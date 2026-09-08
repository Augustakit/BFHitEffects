-- ==============================================================================
--  BFHitEffects 服务端核心 (Server Logic)
-- ==============================================================================
-- 说明：利用 Soldier:Damage 捕获微观爆炸属性，在 Player:Killed 中完成宏观标签生成。
-- 载具摧毁追踪：利用 Vehicle:Damage 记录最后攻击者，在 Vehicle:Destroyed 中判定阵营。
-- ==============================================================================

-- 【1. 伤害快照】(必须前置声明，消除静态检查警告)
-- 💡 原理：Player:Killed 事件不传递 DamageInfo，必须在 Soldier:Damage 中提前“偷拍”记录
BFHitEffects_DamageSnapshot = BFHitEffects_DamageSnapshot or {}
Hooks:Install('Soldier:Damage', 100, function(hook, soldier, info, giverInfo)
    -- 原有：记录爆炸伤害
    if soldier and soldier.player then
        BFHitEffects_DamageSnapshot[soldier.player.id] = info.isExplosionDamage
    end

    -- 命中反馈 + 伤害数字逻辑
    if info.damage > 0 and giverInfo and giverInfo.giver then
        local attacker = giverInfo.giver
        local victimPlayer = soldier.player
        
        if attacker and victimPlayer and attacker ~= victimPlayer then
            local attackerTeam = attacker.teamId
            local victimTeam = victimPlayer.teamId
            if attackerTeam and victimTeam and attackerTeam ~= victimTeam then
                if not soldier.isManDown then
                    local damage = info.damage
                    local isHeadshot = (info.boneIndex == 1)
                    local isKill = (damage + 0.001 >= soldier.health)

                    -- 命中反馈类型
                    local hitType = "normal"
                    if isHeadshot and isKill then
                        hitType = "headshot_kill"
                    elseif isHeadshot then
                        hitType = "headshot"
                    elseif isKill then
                        hitType = "kill"
                    end

                    NetEvents:SendToLocal('BFHitEffects_HitEvent', attacker, hitType)

                    -- 🌟 新增：发送伤害数字事件
                    local damageRounded = math.floor(damage)
                    NetEvents:SendToLocal('BFHitEffects_DamageEvent', attacker, damageRounded, isHeadshot)
                end
            end
        end
    end

    hook:Pass(soldier, info, giverInfo)
end)


Events:Subscribe('Player:Left', function(player)
    BFHitEffects_DamageSnapshot[player.id] = nil -- 玩家离开时清理内存
end)

-- 【2. 特殊武器映射表】(仅保留非爆炸的特殊击杀)
local BFHitEffects_WeaponMap = {
    ["U_Defib"] = "DEFIB",
    ["U_Knife"] = "KNIFE",
    ["U_Knife_Razor"] = "KNIFE",
    ["U_Medkit"] = "MEDKIT",
    ["U_Repairtool"] = "REPAIR",
}

-- 【3. 核心判定逻辑：Player:Killed】
Events:Subscribe('Player:Killed', function(player, inflictor, position, weapon, isRoadKill, isHeadShot, wasVictimInReviveState, info)
    -- 🛡️ 严格过滤自杀与友军
    if not inflictor or inflictor == player then return end
    if inflictor.teamId == player.teamId then return end

    local tags = {}
    local baseTag = "NORMAL"

    -- 步骤 A：解析真实武器 ID (防 Mod 字符串污染，通过底层 DataContainer 获取)
    local realWeaponId = weapon
    if info and info.weaponUnlock then
        -- 🌟 使用 pcall 保护，防止非标准武器数据导致 C++ 层崩溃
        local success, unlockAsset = pcall(function()
            return _G[info.weaponUnlock.typeInfo.name](info.weaponUnlock)
        end)
        if success and unlockAsset and unlockAsset.debugUnlockId then
            realWeaponId = unlockAsset.debugUnlockId
        end
    end

    -- 步骤 B：基础标签判定 (单线程互斥，优先级从上到下)
    if BFHitEffects_WeaponMap[realWeaponId] then
        baseTag = BFHitEffects_WeaponMap[realWeaponId]
    elseif isRoadKill then
        baseTag = "ROADKILL"
    elseif isHeadShot then
        baseTag = "HEADSHOT"
    --  核心唯实：显式判断 == true，杜绝 VSCode 类型推断警告
    elseif BFHitEffects_DamageSnapshot[player.id] == true then
        baseTag = "EXPLOSIVE"
    end
    table.insert(tags, baseTag)
    
    BFHitEffects_DamageSnapshot[player.id] = nil -- 用完即焚，防止内存泄漏
    NetEvents:SendToLocal('BFHitEffects_KillEvent', inflictor, table.concat(tags, ","))
end)

-- ==========================================
--  【4. 载具摧毁追踪】(独立于步兵击杀)
-- ==========================================
BFHitEffects_LastDamager = BFHitEffects_LastDamager or {}

-- 记录最后攻击者 (只要有人打载具，就记下是谁)
Events:Subscribe('Vehicle:Damage', function(vehicle, damage, info)
    local uid = vehicle.uniqueId
    if info and info.giver then
        BFHitEffects_LastDamager[uid] = info.giver
    end
end)

-- 载具被毁时，判定是否为“有效击杀敌方载具”
Events:Subscribe('Vehicle:Destroyed', function(vehicle, vehiclePoints, hotTeam)
    local uid = vehicle.uniqueId
    local killer = BFHitEffects_LastDamager[uid]
 
    --  防御性编程：确保 killer 是 Player 对象，且不是友军/中立
    local isValidKill = false
    if killer and killer.name then
        local success, killerTeam = pcall(function() return killer.teamId end)
        if success and killerTeam and hotTeam ~= TeamId.TeamNeutral and hotTeam ~= killerTeam then
            isValidKill = true
        end
    end

    if isValidKill then
        -- 确认有效击杀，发送事件给击杀者客户端
        NetEvents:SendTo('BFHitEffects_VehicleDestroyed', killer)
    end

    BFHitEffects_LastDamager[uid] = nil -- 清理记录
end)

-- 载具卸载/消失时清理内存
Events:Subscribe('Vehicle:Unspawn', function(vehicle)
    BFHitEffects_LastDamager[vehicle.uniqueId] = nil
end)