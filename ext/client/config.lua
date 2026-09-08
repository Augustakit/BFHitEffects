-- ==============================================================================
--  BFHitEffects 模组前端配置中枢 (Client Config)
-- ==============================================================================
--  社区玩家请注意：
-- 1. 此文件控制所有 UI 的默认显示状态（文字/图片、颜色、阴影、大小等）。
-- 2. 修改此处的默认值，将直接改变玩家在游戏设置菜单中的“初始默认值”。
-- 3. 颜色支持 Hex 格式（例如 "#FF0000" 代表纯红色，"#FFFFFF" 代表白色）。
-- 4. 阴影支持数字选项（0=无, 1=黑色描边, 2=发光描边），JS端会自动转换。
-- ==============================================================================

return {
    -- --------------------------------------------------------------------------
    --  全局基础开关与尺寸（玩家可随意调整）
    -- --------------------------------------------------------------------------
    Enabled = true,               -- [开关] 是否启用整个击杀特效模组 (true=开启, false=关闭)
    SoundEnabled = true,          -- [开关] 是否启用击杀音效 (true=开启, false=静音)

    --  尺寸配置 (单位: 百分比。100 = 100%原始大小, 70 = 70%大小)
    TextGlobalScale = 70,         -- [文字] 统一全局缩放百分比 (所有文字共用此基础大小)
    IconGlobalScale = 70,         -- [图标] 统一全局缩放百分比 (所有图标的基础大小)

    -- --------------------------------------------------------------------------
    -- 🔊 音效配置 (玩家可修改音效池数量，但需确保实际文件存在)
    -- --------------------------------------------------------------------------
    -- 说明：Folder 是文件夹名字 (在 ui/assets/sounds/ 下)，Count 是里面有几个 .webm 文件
    SoundHeadshot = { Folder = "headshot", Count = 3 }, -- 爆头音效池
    SoundNormal   = { Folder = "normal",   Count = 1 }, -- 普通击杀音效池
    SoundSpecial  = { Folder = "special",  Count = 1 }, -- 特殊击杀音效池 (刀杀/除颤/路杀等)
    SoundExplosive= { Folder = "explosive",Count = 1 }, -- 爆炸/毁车音效池

    -- --------------------------------------------------------------------------
    -- 🎨 标签专属配置 (每个击杀类型独立设置，玩家可按喜好调整)
    -- --------------------------------------------------------------------------
    -- 参数说明：
    -- Name       : 在游戏设置菜单里显示的中文名称
    -- Text       : 当玩家选择“文字模式”时，显示的具体文字内容
    -- IsImg      : 默认是否使用图片 (true=图片, false=文字)
    -- IconScale  : [仅图标有效] 该图标的独立微调缩放 (100=不额外放大, 120=放大20%)
    -- Color      : [仅文字有效] 文字颜色。请使用 Hex 码 (如 "#FF2222" 为红色)
    -- Shadow     : [仅文字有效] 文字阴影。填数字：0=无, 1=简单黑色描边, 2=强烈发光描边
    -- AspectRatio: [仅图标有效] 图片宽高比。可设为 "16:9"、"4:3" 或 "original"(保持原图比例)
    -- --------------------------------------------------------------------------
    Tags = {
        HEADSHOT = {
            Name = "爆头", Text = "HEADSHOT", IsImg = true, IconScale = 80, 
            Color = "#FF2222", Shadow = 2, AspectRatio = "original"
        },
        NORMAL = { 
            Name = "普通击杀", Text = "KILL", IsImg = true, IconScale = 80, 
            Color = "#FFFFFF", Shadow = 1, AspectRatio = "original"
        },
        KNIFE = { 
            Name = "刀杀", Text = "KNIFE", IsImg = true, IconScale = 100, 
            Color = "#FFAA00", Shadow = 1, AspectRatio = "original"
        },
        DEFIB = { 
            Name = "除颤器", Text = "DEFIB", IsImg = true, IconScale = 70, 
            Color = "#00FFFF", Shadow = 1, AspectRatio = "original"
        },
        MEDKIT = { 
            Name = "医疗箱", Text = "MEDKIT", IsImg = true, IconScale = 80, 
            Color = "#00FF00", Shadow = 1, AspectRatio = "original"
        },
        REPAIR = { 
            Name = "维修工具", Text = "REPAIR", IsImg = true, IconScale = 100, 
            Color = "#0088FF", Shadow = 1, AspectRatio = "original"
        },
        EXPLOSIVE = {
            Name = "爆炸击杀", Text = "EXPLOSIVE", IsImg = true, IconScale = 70, 
            Color = "#FF8800", Shadow = 2, AspectRatio = "original"
        },
        ROADKILL = { 
            Name = "载具碾压", Text = "ROADKILL", IsImg = true, IconScale = 120, 
            Color = "#AA00FF", Shadow = 1, AspectRatio = "original"
        },
        VEHICLE_DESTRUCTION = {
            Name = "毁灭载具", Text = "WRECK", IsImg = true, IconScale = 70, 
            Color = "#888888", Shadow = 1, AspectRatio = "original"
        }
    },

    -- ==========================================================================
    -- 🌟 命中反馈配置（击打敌人时屏幕中心的 X 标记，玩家可完全自定义）
    -- ==========================================================================
    HitFeedback = {
        Enabled = true,                     -- [开关] 是否显示命中反馈
        SoundEnabled = true,                -- [开关] 命中时是否播放音效
        -- 每种命中类型的颜色、大小、线条粗细、透明度
        Normal = {
            Color = "#FFFFFF",              -- [普通命中] 颜色
            Size = 15,                      -- [普通命中] 整体大小（像素）
            Thickness = 3,                  -- [普通命中] 线条粗细（像素）
            Alpha = 1.0                     -- [普通命中] 不透明度 (0~1)
        },
        Headshot = {
            Color = "#FFAA00",              -- [爆头] 颜色
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        Kill = {
            Color = "#FF0000",              -- [击杀（非爆头）] 颜色
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        HeadshotKill = {
            Color = "#00FF7F",              -- [爆头击杀] 颜色
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        SpecialScale = 1.2,                 -- [特殊放大] 爆头/击杀时整体放大倍率
        SpecialThickness = 1.4,             -- [特殊加粗] 爆头/击杀时线条加粗倍率
        FadeInMs = 80,                      -- [淡入时间] 毫秒
        FadeOutMs = 200,                    -- [淡出时间] 毫秒
        Sound = { Folder = "hit", Count = 1 } -- [音效] 文件夹名和文件数量
    },

    -- ==========================================================================
    -- 🌟 伤害数字显示（战地6风格 — 固定在准心左侧，玩家可调颜色/大小/时间）
    -- ==========================================================================
    DamageNumbers = {
        Enabled = true,
        -- 头部伤害（颜色建议和水波纹颜色一致）
        Headshot = {
            Color = "#90F2FF",              -- [头部伤害] 颜色
            Size = 20,                      -- [头部伤害] 字体大小
            Alpha = 1.0                     -- [头部伤害] 不透明度
        },
        -- 普通伤害
        Normal = {
            Color = "#FFFFFF",              -- [普通伤害] 颜色
            Size = 20,                      -- [普通伤害] 字体大小
            Alpha = 1.0                     -- [普通伤害] 不透明度
        },
        -- 时间参数（极速淡入淡出，避免重叠）
        FadeInMs = 80,                      -- [淡入] 毫秒
        FadeOutMs = 200,                    -- [淡出] 毫秒
        LifetimeMs = 280,                   -- [总生命周期] 毫秒，数值越小消失越快
    }
}