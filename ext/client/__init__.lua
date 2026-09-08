-- ==============================================================================
--  BFHitEffects 客户端逻辑 (Client Logic)
-- ==============================================================================
-- 说明：读取配置、注册游戏内设置菜单，并将玩家的选择实时同步给前端 JS。
-- 命名空间：所有暴露给 JS 的全局函数均以 "BFHitEffects_" 开头，杜绝冲突！
-- ==============================================================================

local tagConfig = require("config")

--  防御性编程：将音效数量提取到顶层作用域，防止事件回调时读取到 nil 导致崩溃
--  玩家可修改 config.lua 中的 Count 值，此处会自动读取
local soundHeadshotCount = tonumber(tagConfig.SoundHeadshot.Count) or 2
local soundNormalCount   = tonumber(tagConfig.SoundNormal.Count) or 2
local soundSpecialCount  = tonumber(tagConfig.SoundSpecial.Count) or 2
local soundExplosiveCount= tonumber(tagConfig.SoundExplosive.Count) or 2

-- 读取命中反馈配置（玩家可在 config.lua 中调整）
local hitFeedbackConfig = tagConfig.HitFeedback or {}
local hfEnabled = hitFeedbackConfig.Enabled ~= false  -- 默认开启
local hfSoundEnabled = hitFeedbackConfig.SoundEnabled ~= false

-- 读取伤害数字配置（玩家可在 config.lua 中调整）
local damageNumbersConfig = tagConfig.DamageNumbers or {}
local dnEnabled = damageNumbersConfig.Enabled ~= false

-- ============================================================================
-- 1. 注册游戏内设置菜单（玩家可在游戏内直接调整这些选项）
-- ============================================================================

local m_Enabled = SettingsManager:DeclareBool("BFHitEffects_Enabled", tagConfig.Enabled, {
    displayName = "[BFHitEffects] 启用击杀特效", showInUi = true
})
local m_SoundEnabled = SettingsManager:DeclareBool("BFHitEffects_SoundEnabled", tagConfig.SoundEnabled, {
    displayName = "[BFHitEffects] 启用击杀音效", showInUi = true
})

--  注意：Lua 的 string.format 中，% 是特殊字符。如果要在 UI 中显示 "%"，必须写成 "%%"！
local m_TextGlobalScale = SettingsManager:DeclareNumber("BFHitEffects_TextScale", tagConfig.TextGlobalScale or 100, 10.0, 200.0, {
    displayName = "[BFHitEffects] 文字统一大小(%%)", showInUi = true
})
local m_IconGlobalScale = SettingsManager:DeclareNumber("BFHitEffects_IconScale", tagConfig.IconGlobalScale or 100, 10.0, 200.0, {
    displayName = "[BFHitEffects] 图标统一大小(%%)", showInUi = true
})

-- 2. 动态注册每个标签的设置（循环自动生成，新增标签无需改代码，玩家可在设置菜单中微调）
local settings = {}
for tag, cfg in pairs(tagConfig.Tags) do
    local name = cfg.Name or tag

    settings[tag .. "_UseImg"] = SettingsManager:DeclareBool("BFHitEffects_" .. tag .. "_UseImg", cfg.IsImg, {
        displayName = string.format("[BFHitEffects] [%s] 使用图标", name), showInUi = true
    })
    settings[tag .. "_Text"] = SettingsManager:DeclareString("BFHitEffects_" .. tag .. "_Text", cfg.Text or tag, 1, 20, {
        displayName = string.format("[BFHitEffects] [%s] 备用文字", name), showInUi = true
    })
    settings[tag .. "_Color"] = SettingsManager:DeclareString("BFHitEffects_" .. tag .. "_Color", cfg.Color or "#FFFFFF", 7, 9, {
        displayName = string.format("[BFHitEffects] [%s] 文字颜色(Hex)", name), showInUi = true
    })
    settings[tag .. "_Shadow"] = SettingsManager:DeclareNumber("BFHitEffects_" .. tag .. "_Shadow", cfg.Shadow or 1, 0, 2, {
        displayName = string.format("[BFHitEffects] [%s] 文字阴影(0无/1描边/2发光)", name), showInUi = true
    })
    settings[tag .. "_IconScale"] = SettingsManager:DeclareNumber("BFHitEffects_" .. tag .. "_IconScale", cfg.IconScale or 100, 10.0, 200.0, {
        displayName = string.format("[BFHitEffects] [%s] 图标独立大小(%%)", name), showInUi = true
    })
end

-- ============================================================================
-- 3. 核心：将所有配置打包成 JSON 字符串发送给 JS（玩家修改 config 或设置菜单后自动同步）
-- ============================================================================
local function SyncSettingsToJS()
    -- 构建标签配置对象
    local updateObj = "{"
    local first = true
    for tag, cfg in pairs(tagConfig.Tags) do
        if not first then updateObj = updateObj .. "," end
        first = false

        -- 防御性读取：提供默认值
        local isImg = settings[tag .. "_UseImg"].value
        local text = string.gsub(settings[tag .. "_Text"].value or "", '"', '\\"')
        local color = settings[tag .. "_Color"].value or "#FFFFFF"
        local shadowType = tonumber(settings[tag .. "_Shadow"].value) or 1
        local iconScale = (tonumber(settings[tag .. "_IconScale"].value) or 100) / 100.0
        local aspectRatio = cfg.AspectRatio or "original"

        updateObj = updateObj .. string.format(
            '%s:{isImg:%s,text:"%s",color:"%s",shadowType:%d,iconScale:%.2f,aspectRatio:"%s"}',
            tag, tostring(isImg), text, color, shadowType, iconScale, aspectRatio
        )
    end
    updateObj = updateObj .. "}"

    -- 音效配置打包
    local soundObj = string.format(
        '{headshot:{folder:"%s",count:%d}, normal:{folder:"%s",count:%d}, special:{folder:"%s",count:%d}, explosive:{folder:"%s",count:%d}}',
        tagConfig.SoundHeadshot.Folder or "headshot", soundHeadshotCount,
        tagConfig.SoundNormal.Folder or "normal", soundNormalCount,
        tagConfig.SoundSpecial.Folder or "special", soundSpecialCount,
        tagConfig.SoundExplosive.Folder or "explosive", soundExplosiveCount
    )

    -- 命中反馈配置打包（玩家在 config.lua 中修改的值会传递到这里）
    local hfConfig = hitFeedbackConfig
    local hfObj = string.format([[
        {
            enabled: %s,
            soundEnabled: %s,
            normal: {color:"%s", size:%d, thickness:%d, alpha:%.2f},
            headshot: {color:"%s", size:%d, thickness:%d, alpha:%.2f},
            kill: {color:"%s", size:%d, thickness:%d, alpha:%.2f},
            headshotKill: {color:"%s", size:%d, thickness:%d, alpha:%.2f},
            specialScale: %.2f,
            specialThickness: %.2f,
            fadeInMs: %d,
            fadeOutMs: %d,
            sound: {folder:"%s", count:%d}
        }
    ]],
        tostring(hfEnabled),
        tostring(hfSoundEnabled),
        hfConfig.Normal.Color or "#FFFFFF",
        hfConfig.Normal.Size or 40,
        hfConfig.Normal.Thickness or 3,
        hfConfig.Normal.Alpha or 0.8,
        hfConfig.Headshot.Color or "#FFAA00",
        hfConfig.Headshot.Size or 40,
        hfConfig.Headshot.Thickness or 3,
        hfConfig.Headshot.Alpha or 0.8,
        hfConfig.Kill.Color or "#FF0000",
        hfConfig.Kill.Size or 40,
        hfConfig.Kill.Thickness or 3,
        hfConfig.Kill.Alpha or 0.8,
        hfConfig.HeadshotKill.Color or "#FF00FF",
        hfConfig.HeadshotKill.Size or 40,
        hfConfig.HeadshotKill.Thickness or 3,
        hfConfig.HeadshotKill.Alpha or 0.8,
        hfConfig.SpecialScale or 1.5,
        hfConfig.SpecialThickness or 2.0,
        hfConfig.FadeInMs or 100,
        hfConfig.FadeOutMs or 300,
        (hfConfig.Sound and hfConfig.Sound.Folder) or "hit",
        (hfConfig.Sound and hfConfig.Sound.Count) or 2
    )

    -- 伤害数字配置打包（玩家在 config.lua 中修改的值会传递到这里）
    local dnConfig = tagConfig.DamageNumbers or {}
    local dnObj = string.format([[
        {
            enabled: %s,
            headshot: {color:"%s", size:%d, alpha:%.2f},
            normal: {color:"%s", size:%d, alpha:%.2f},
            fadeInMs: %d,
            fadeOutMs: %d,
            lifetimeMs: %d,
            fontFamily: "%s"
        }
    ]],
        tostring(dnEnabled),
        (dnConfig.Headshot and dnConfig.Headshot.Color) or "#FF0000",
        (dnConfig.Headshot and dnConfig.Headshot.Size) or 28,
        (dnConfig.Headshot and dnConfig.Headshot.Alpha) or 1.0,
        (dnConfig.Normal and dnConfig.Normal.Color) or "#FFFFFF",
        (dnConfig.Normal and dnConfig.Normal.Size) or 24,
        (dnConfig.Normal and dnConfig.Normal.Alpha) or 1.0,
        dnConfig.FadeInMs or 50,
        dnConfig.FadeOutMs or 150,
        dnConfig.LifetimeMs or 250,
        (dnConfig.FontFamily or "Alibaba PuHuiTi"):gsub('"', '\\"')
    )

    -- 最终组合成一条 JS 调用
    local jsCode = string.format([[
        if(typeof BFHitEffects_UpdateSettings === 'function') {
            BFHitEffects_UpdateSettings({
                enabled: %s,
                textGlobalScale: %f,
                iconGlobalScale: %f,
                tags: %s,
                sounds: %s,
                hitFeedback: %s,
                damageNumbers: %s
            });
        }
    ]],
        tostring(m_SoundEnabled.value),
        (tonumber(m_TextGlobalScale.value) or 100) / 100.0,
        (tonumber(m_IconGlobalScale.value) or 100) / 100.0,
        updateObj,
        soundObj,
        hfObj,
        dnObj
    )
    WebUI:ExecuteJS(jsCode)
end

-- 模组加载完成时同步配置到前端
Events:Subscribe('Extension:Loaded', function()
    WebUI:Init()
    SyncSettingsToJS()
end)

-- 玩家在游戏内设置菜单更改任何选项时，自动重新同步
Events:Subscribe('SettingsManager:SettingsChanged', function()
    SyncSettingsToJS()
end)

-- ============================================================================
-- 4. 接收 Server 端的击杀事件（玩家无需修改）
-- ============================================================================
NetEvents:Subscribe('BFHitEffects_KillEvent', function(tagsStr)
    if not m_Enabled.value then return end
    local baseTag = string.match(tagsStr, "([^,]+)") or "NORMAL"
    local folderType, soundIndex = "normal", 1

    if baseTag == "HEADSHOT" then
        folderType = "headshot"; soundIndex = MathUtils:GetRandomInt(1, soundHeadshotCount)
    elseif baseTag == "EXPLOSIVE" or baseTag == "VEHICLE_DESTRUCTION" then
        folderType = "explosive"; soundIndex = MathUtils:GetRandomInt(1, soundExplosiveCount)
    elseif baseTag ~= "NORMAL" then
        folderType = "special"; soundIndex = MathUtils:GetRandomInt(1, soundSpecialCount)
    else
        soundIndex = MathUtils:GetRandomInt(1, soundNormalCount)
    end

    WebUI:ExecuteJS(string.format('if(typeof BFHitEffects_AddKill === "function") BFHitEffects_AddKill("%s", "%s", %d);', tagsStr, folderType, soundIndex))
end)

-- 接收 Server 端的“毁灭载具”独立事件
NetEvents:Subscribe('BFHitEffects_VehicleDestroyed', function()
    if not m_Enabled.value then return end
    WebUI:ExecuteJS('if(typeof BFHitEffects_AddKill === "function") BFHitEffects_AddKill("VEHICLE_DESTRUCTION", "explosive", 1);')
end)

-- ============================================================================
-- 5. 移除原版命中反馈（HUD 中的 Hitindicator 节点）
-- ============================================================================
Hooks:Install('UI:PushScreen', 100, function(hook, screen, graphPriority, parentGraph)
    local screenAsset = UIGraphAsset(screen)
    local screenName = screenAsset.name

    if screenName == 'UI/Flow/Screen/HudMPScreen' then
        local clone = screen:Clone(screen.instanceGuid)
        local screenClone = UIGraphAsset(clone)

        local removed = false
        for i = #screenClone.nodes, 1, -1 do
            local node = screenClone.nodes[i]
            if node and node.name == 'Hitindicator' then
                screenClone.nodes:erase(i)
                removed = true
            end
        end

        if removed then
            hook:Pass(screenClone, graphPriority, parentGraph)
            return
        end
    end

    hook:Pass(screen, graphPriority, parentGraph)
end)

-- ============================================================================
-- 6. 接收命中反馈和伤害数字事件（由服务端 Soldier:Damage 触发）
-- ============================================================================
NetEvents:Subscribe('BFHitEffects_HitEvent', function(hitType)
    if not hfEnabled then return end
    WebUI:ExecuteJS(string.format('if(typeof BFHitEffects_ShowHitFeedback === "function") BFHitEffects_ShowHitFeedback("%s");', hitType))
end)

NetEvents:Subscribe('BFHitEffects_DamageEvent', function(damage, isHeadshot)
    if not dnEnabled then return end
    WebUI:ExecuteJS(string.format('if(typeof BFHitEffects_ShowDamage === "function") BFHitEffects_ShowDamage(%d, %s);', damage, tostring(isHeadshot)))
end)