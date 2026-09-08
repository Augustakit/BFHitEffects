export default {
    // ==============================================================================
    //  1. 资源路径 (硬编码，适配 .vuic 打包机制)
    // ==============================================================================
    //  社区玩家请注意：
    // 如果你想替换图标，请把新图片放在 ui/assets/images/ 下，并修改下方的文件名。
    // 路径必须使用 "./assets/..." 这种相对路径，绝对不能使用 "/" 开头的绝对路径！

    // ----- 图片路径（可修改） -----
    // 将新图片放入 ui/assets/images/ 后，修改下方对应的文件名即可
    imgHeadshot: "./assets/images/headshot2.png",       // 爆头图标
    imgNormal: "./assets/images/headshot.png",          // 普通击杀图标
    imgKnife: "./assets/images/knife.png",              // 刀杀图标
    imgDefib: "./assets/images/defib.png",              // 除颤器图标
    imgMedkit: "./assets/images/medkit.png",            // 医疗箱图标
    imgRepair: "./assets/images/repair.png",            // 维修工具图标
    imgExplosive: "./assets/images/explosive.png",      // 爆炸击杀图标
    imgRoadkill: "./assets/images/roadkill.png",        // 载具碾压图标
    imgVehicleDestroy: "./assets/images/vehicle_destroy.png", // 毁灭载具图标

    // ----- 音效文件夹路径（可修改） -----
    // 将音效文件放入 ui/assets/sounds/ 下对应的子文件夹中
    soundHeadshotFolder: "./assets/sounds/headshot/",   // 爆头音效池
    soundNormalFolder: "./assets/sounds/normal/",       // 普通击杀音效池
    soundSpecialFolder: "./assets/sounds/special/",     // 特殊击杀音效池 (刀/除颤等)
    soundExplosiveFolder: "./assets/sounds/explosive/", // 爆炸/毁车音效池
    soundHitFolder: "./assets/sounds/hit/",             // 命中反馈音效池（击打音效）

    // ==============================================================================
    //  2. 动画与视觉参数 (纯前端控制，决定特效的“手感”)
    // ==============================================================================
    //  警告：以下参数直接影响特效的视觉效果和手感，建议微调时以 0.1 或 50 为单位变动
    popInScalePeak: 1.5,                    // [缩放峰值] 1.5 = 先放大到150%，再缩回100%
    popInDurationMs: 700,                   // [缩放时长] 毫秒，700 = 0.7秒

    rippleEnabled: true,                    // [水波纹] 是否启用爆头水波纹 (true=开启)
    rippleStartRatio: 0.5,                  // [水波纹] 触发时机 (0.5 = 缩放动画进行到50%时开始扩散)
    rippleDurationMs: 800,                  // [水波纹] 扩散总时长 (毫秒)
    rippleStartRadiusPercent: 2,            // [水波纹] 起始半径百分比 (2% = 很小的一个点)
    rippleEndRadiusPercent: 15,             // [水波纹] 最终半径百分比 (15% = 扩散到屏幕宽度的15%)
    rippleBorderWidth: 6,                   // [水波纹] 圆环边框粗细 (像素)
    rippleColor: "rgba(144, 242, 255, 1)",  // [水波纹] 圆环颜色 (支持 rgba)
    rippleGlow: true,                       // [水波纹] 是否添加外发光效果
    rippleOffsetX: 0,                       // [水波纹] 水平偏移 (像素, 正数向右, 负数向左)
    rippleOffsetY: 0,                       // [水波纹] 垂直偏移 (像素, 正数向下, 负数向上)

    // ==============================================================================
    //  3. 比例与队列控制
    // ==============================================================================
    defaultAspectRatio: "original",         // [默认宽高比] 可选: "16:9"、"4:3"、"original"
    originalAspectRatio: 1.0,               // [自定义宽高比] 当 defaultAspectRatio 为 "original" 时使用

    verticalPositionRatio: 0.26,            // [垂直位置] 击杀列表距离屏幕底部的比例 (0.26 = 26%高度处)
    maxFeedItems: 6,                        // [最大数量] 屏幕上同时显示的最大图标数量
    gapBetweenItems: 8,                     // [间距] 相邻图标之间的间距 (像素)
    lifetimeMs: 3000,                       // [存活时间] 每个图标在屏幕上停留的时间 (毫秒)

    textHeightRatio: 0.04,                  // [文字高度比例] 文字基础高度占屏幕比例 (无需修改)
    textWidthEstimateRatio: 0.6,            // [文字宽度估算] 用于队列居中计算 (无需修改)

    // ==============================================================================
    //  4. 兜底业务配置 (实际运行时会被 Lua 瞬间覆盖，玩家无需修改此处)
    // ==============================================================================
    //  警告：以下配置仅作为 JS 刚启动、Lua 还没同步时的“占位符”，防止 JS 报错。
    //  玩家实际修改大小、颜色、文字等，请在游戏内设置菜单或修改 config.lua！
    soundEnabled: true,
    textGlobalScale: 1.0,
    iconGlobalScale: 1.0,
    tags: {},
    sounds: {
        headshot: { folder: "./assets/sounds/headshot/", count: 2 },
        normal: { folder: "./assets/sounds/normal/", count: 2 },
        special: { folder: "./assets/sounds/special/", count: 2 },
        explosive: { folder: "./assets/sounds/explosive/", count: 2 }
    }
};