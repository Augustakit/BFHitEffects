-- ==============================================================================
--  BFHitEffects Server Core
-- ==============================================================================
--  Description: Uses Soldier:Damage to capture micro-explosion attributes,
--  and generates high‑level kill tags in Player:Killed.
--  Vehicle destruction tracking: uses Vehicle:Damage to record the last
--  damager, and decides team affiliation in Vehicle:Destroyed.
-- ==============================================================================

-- [1. Damage Snapshot] (must be declared upfront to suppress static warnings)
-- 💡 Rationale: Player:Killed does not pass a DamageInfo; we must “photograph”
--    the damage in Soldier:Damage ahead of time.
BFHitEffects_DamageSnapshot = BFHitEffects_DamageSnapshot or {}
Hooks:Install('Soldier:Damage', 100, function(hook, soldier, info, giverInfo)
    -- Record explosion damage
    if soldier and soldier.player then
        BFHitEffects_DamageSnapshot[soldier.player.id] = info.isExplosionDamage
    end

    -- Hit feedback + damage number logic
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

                    -- Hit feedback type
                    local hitType = "normal"
                    if isHeadshot and isKill then
                        hitType = "headshot_kill"
                    elseif isHeadshot then
                        hitType = "headshot"
                    elseif isKill then
                        hitType = "kill"
                    end

                    NetEvents:SendToLocal('BFHitEffects_HitEvent', attacker, hitType)

                    -- 🌟 New: send damage number event
                    local damageRounded = math.floor(damage)
                    NetEvents:SendToLocal('BFHitEffects_DamageEvent', attacker, damageRounded, isHeadshot)
                end
            end
        end
    end

    hook:Pass(soldier, info, giverInfo)
end)


Events:Subscribe('Player:Left', function(player)
    BFHitEffects_DamageSnapshot[player.id] = nil -- clean up on player leave
end)

-- [2. Special weapon mapping] (only non‑explosive special kills)
local BFHitEffects_WeaponMap = {
    ["U_Defib"] = "DEFIB",
    ["U_Knife"] = "KNIFE",
    ["U_Knife_Razor"] = "KNIFE",
    ["U_Medkit"] = "MEDKIT",
    ["U_Repairtool"] = "REPAIR",
}

-- [3. Core logic: Player:Killed]
Events:Subscribe('Player:Killed', function(player, inflictor, position, weapon, isRoadKill, isHeadShot, wasVictimInReviveState, info)
    -- 🛡️ Strictly filter out suicides and friendly fire
    if not inflictor or inflictor == player then return end
    if inflictor.teamId == player.teamId then return end

    local tags = {}
    local baseTag = "NORMAL"

    -- Step A: Resolve real weapon ID (prevent Mod string pollution, get from underlying DataContainer)
    local realWeaponId = weapon
    if info and info.weaponUnlock then
        -- 🌟 Use pcall to protect against non‑standard weapon data that could crash the C++ layer
        local success, unlockAsset = pcall(function()
            return _G[info.weaponUnlock.typeInfo.name](info.weaponUnlock)
        end)
        if success and unlockAsset and unlockAsset.debugUnlockId then
            realWeaponId = unlockAsset.debugUnlockId
        end
    end

    -- Step B: Base tag determination (mutually exclusive, priority top‑down)
    if BFHitEffects_WeaponMap[realWeaponId] then
        baseTag = BFHitEffects_WeaponMap[realWeaponId]
    elseif isRoadKill then
        baseTag = "ROADKILL"
    elseif isHeadShot then
        baseTag = "HEADSHOT"
    --  Core realism: explicitly compare to true to avoid VSCode type inference warnings
    elseif BFHitEffects_DamageSnapshot[player.id] == true then
        baseTag = "EXPLOSIVE"
    end
    table.insert(tags, baseTag)
    
    BFHitEffects_DamageSnapshot[player.id] = nil -- consume immediately to prevent memory leaks
    NetEvents:SendToLocal('BFHitEffects_KillEvent', inflictor, table.concat(tags, ","))
end)

-- ==========================================
--  [4. Vehicle destruction tracking] (independent of infantry kills)
-- ==========================================
BFHitEffects_LastDamager = BFHitEffects_LastDamager or {}

-- Record the last attacker (whenever someone damages a vehicle, remember who)
Events:Subscribe('Vehicle:Damage', function(vehicle, damage, info)
    local uid = vehicle.uniqueId
    if info and info.giver then
        BFHitEffects_LastDamager[uid] = info.giver
    end
end)

-- When a vehicle is destroyed, determine if this is a “valid enemy vehicle kill”
Events:Subscribe('Vehicle:Destroyed', function(vehicle, vehiclePoints, hotTeam)
    local uid = vehicle.uniqueId
    local killer = BFHitEffects_LastDamager[uid]
 
    --  Defensive programming: ensure killer is a Player object and not a friend / neutral
    local isValidKill = false
    if killer and killer.name then
        local success, killerTeam = pcall(function() return killer.teamId end)
        if success and killerTeam and hotTeam ~= TeamId.TeamNeutral and hotTeam ~= killerTeam then
            isValidKill = true
        end
    end

    if isValidKill then
        -- Valid kill confirmed, send event to the killer's client
        NetEvents:SendTo('BFHitEffects_VehicleDestroyed', killer)
    end

    BFHitEffects_LastDamager[uid] = nil -- clean up record
end)

-- Clean up when the vehicle is unspawned / disappears
Events:Subscribe('Vehicle:Unspawn', function(vehicle)
    BFHitEffects_LastDamager[vehicle.uniqueId] = nil
end)