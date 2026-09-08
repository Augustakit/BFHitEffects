import config from './config.js';

// ==============================================================================
// ═══════════════════════════════════════════════════════════════════════════════
//  🌟 玩家可修改配置区（修改前请阅读注释）
//  ═══════════════════════════════════════════════════════════════════════════════
//  说明：所有可调整的数值都集中在这里，方便玩家按需修改。
//  修改后保存文件，重新加载模组即可生效。
// ==============================================================================

// ----- 1. 命中反馈（Hit Feedback）几何参数 -----
// 这些参数控制屏幕中心 "X" 标记的形状和大小
const HITFEEDBACK_GEOMETRY = {
    // 米粒长度相对于整体大小的比例（值越大，X 的臂越长）
    GRAIN_LENGTH_RATIO: 0.60,
    // 米粒宽度相对于整体大小的比例（值越大，线条越粗）
    GRAIN_WIDTH_RATIO: 0.12,
    // 中心间隙半径相对于整体大小的比例（值越大，中间空隙越大）
    GAP_RADIUS_RATIO: 0.60,
    // 黑色描边比彩色部分多出的粗细（像素，值越大描边越明显）
    OUTLINE_THICKNESS: 1.0
};

// ----- 2. 伤害数字（Damage Numbers）位置参数 -----
// 这些参数控制数字在屏幕上的显示位置（相对于准心）
const DAMAGE_NUMBERS_POSITION = {
    // 水平偏移比例（负值向左，-0.06 = 准心左侧 6% 屏幕宽度）
    OFFSET_X: -0.06,
    // 爆头数字垂直偏移比例（负值向上，-0.02 = 准心上方 2% 屏幕高度）
    HEADSHOT_OFFSET_Y: -0.02,
    // 普通数字垂直偏移比例（正值向下，0.01 = 准心下方 1% 屏幕高度）
    NORMAL_OFFSET_Y: 0.01
};
// ----- 2.5 伤害数字描边粗细 -----
const DAMAGE_NUMBERS_SHADOW_THICKNESS = 2;  // 0=无阴影，1=细，2=标准，3=粗

// ----- 2.6 伤害数字堆叠队列参数 -----
const DAMAGE_NUMBERS_QUEUE = {
    // 每个数字占用的垂直槽位高度（像素），决定数字之间的间距
    SLOT_HEIGHT: 32,
    // 最大队列长度（超过后新数字替换最旧的那个）
    MAX_QUEUE_SIZE: 6
};

// ----- 3. 音效限流参数 -----
// 防止短时间内大量音效同时播放导致音频上下文挂起
const MAX_CONCURRENT_AUDIO = 3;   // 同时最多播放的音效数量

// ----- 4. 阴影预设字典（由 Lua 传入的数字自动映射）-----
const SHADOW_PRESETS = {
    0: "none",
    1: "2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000",
    2: "0 0 4px #000, 0 0 8px #000, 2px 2px 0px #000, -2px -2px 0px #000"
};

//  核心逻辑（以下代码一般不需要修改）

// ----- 1. 全局状态与配置 -----
let cleanupInterval = null;

const IMG_PATHS = {
    HEADSHOT: config.imgHeadshot, NORMAL: config.imgNormal, KNIFE: config.imgKnife,
    DEFIB: config.imgDefib, MEDKIT: config.imgMedkit, REPAIR: config.imgRepair,
    EXPLOSIVE: config.imgExplosive, ROADKILL: config.imgRoadkill, VEHICLE_DESTRUCTION: config.imgVehicleDestroy
};

// 命中反馈配置（实际值由 Lua 下发覆盖）
let hitFeedbackConfig = {
    enabled: true, soundEnabled: true,
    normal: { color: "#FFFFFF", size: 27, thickness: 5, alpha: 1.0 },
    headshot: { color: "#FFAA00", size: 27, thickness: 5, alpha: 1.0 },
    kill: { color: "#FF0000", size: 27, thickness: 5, alpha: 1.0 },
    headshotKill: { color: "#853AF2", size: 27, thickness: 5, alpha: 1.0 },
    specialScale: 1.2, specialThickness: 1.4,
    fadeInMs: 80, fadeOutMs: 200,
    sound: { folder: "hit", count: 1 }
};

// 伤害数字配置（实际值由 Lua 下发覆盖）
let damageNumbersConfig = {
    enabled: true,
    headshot: { color: "#90F2FF", size: 28, alpha: 1.0 },
    normal: { color: "#FFFFFF", size: 24, alpha: 1.0 },
    fadeInMs: 80, fadeOutMs: 100, lifetimeMs: 180,
    fontFamily: "Alibaba PuHuiTi, Arial, sans-serif",
    shadowThickness: DAMAGE_NUMBERS_SHADOW_THICKNESS,
    // 位置参数引用顶部配置，便于玩家集中调整
    position: {
        offsetX: DAMAGE_NUMBERS_POSITION.OFFSET_X,
        headshotOffsetY: DAMAGE_NUMBERS_POSITION.HEADSHOT_OFFSET_Y,
        normalOffsetY: DAMAGE_NUMBERS_POSITION.NORMAL_OFFSET_Y
    }
};

// ----- 伤害数字队列状态（用于垂直堆叠排列）-----
// 爆头数字队列（向上堆叠）
let headshotQueue = [];
// 普通伤害数字队列（向下堆叠）
let normalQueue = [];
// 队列重新排列的动画 ID

// 用于存储 reflowDamageNumbers 的 requestAnimationFrame ID，以便必要时取消
let reflowAnimationId = null;
// ----- 2. 音效播放引擎 -----
let activeAudioCount = 0;

function playSoundByFolder(folderType, soundIndex) {
    if (!config.soundEnabled || activeAudioCount >= MAX_CONCURRENT_AUDIO) return;
    const folderMap = {
        headshot: config.soundHeadshotFolder, normal: config.soundNormalFolder,
        special: config.soundSpecialFolder, explosive: config.soundExplosiveFolder,
        hit: config.soundHitFolder
    };
    const folder = folderMap[folderType];
    if (!folder) return;

    const file = folder + soundIndex + '.webm';
    const video = document.createElement('video');
    video.src = file; video.autoplay = true; video.controls = false;
    video.muted = false; video.volume = 1.0; video.style.display = 'none';

    activeAudioCount++;
    const cleanup = () => { activeAudioCount--; if (video.parentNode) video.remove(); };
    video.addEventListener('ended', cleanup);
    video.addEventListener('error', cleanup);

    document.body.appendChild(video);
    if (typeof video.play === 'function') video.play();
}

// ----- 3. 击杀图标 (Killfeed) 渲染引擎 -----
function getAspectRatioForTag(tagKey) {
    const tagCfg = config.tags[tagKey];
    let ratioStr = tagCfg ? tagCfg.aspectRatio : undefined;
    if (!ratioStr) ratioStr = config.defaultAspectRatio || "original";
    if (ratioStr === "16:9") return 16 / 9;
    if (ratioStr === "4:3") return 4 / 3;
    if (ratioStr === "original") return config.originalAspectRatio || 1.0;
    const num = parseFloat(ratioStr);
    return (!isNaN(num) && num > 0) ? num : 1.0;
}

function ensureAnimationKeyframes() {
    if (document.getElementById('bf-hit-animation-style')) return;
    const style = document.createElement('style');
    style.id = 'bf-hit-animation-style';
    const peak = config.popInScalePeak || 1.5;
    const durationSec = config.popInDurationMs / 1000;
    style.textContent = `@keyframes BFHitEffects_PopDynamic { 0% { transform: scale(1); opacity: 1; } 30% { transform: scale(${peak}); opacity: 1; } 100% { transform: scale(1); opacity: 1; } } .bf5-icon-animate { animation: BFHitEffects_PopDynamic ${durationSec}s cubic-bezier(0.34, 1.2, 0.64, 1) forwards; }`;
    document.head.appendChild(style);
}

function createRipple(containerItem, iconWidth, iconHeight) {
    if (!config.rippleEnabled) return;
    const delay = config.popInDurationMs * config.rippleStartRatio;
    setTimeout(() => {
        if (!containerItem || !containerItem.parentNode) return;
        const ripple = document.createElement('div');
        ripple.className = 'bf5-ripple-ring';
        ripple.style.borderWidth = `${config.rippleBorderWidth}px`;
        ripple.style.borderColor = config.rippleColor;
        ripple.style.opacity = '0.8';
        let centerX = iconWidth / 2; let centerY = -iconHeight / 2;
        if (config.rippleOffsetX !== undefined) centerX += config.rippleOffsetX;
        if (config.rippleOffsetY !== undefined) centerY += config.rippleOffsetY;
        ripple.style.left = `${centerX}px`; ripple.style.top = `${centerY}px`;
        ripple.style.transform = 'translate(-50%, -50%)';
        const screenWidth = window.innerWidth;
        const startRadius = screenWidth * (config.rippleStartRadiusPercent / 100);
        const endRadius = screenWidth * (config.rippleEndRadiusPercent / 100);
        ripple.style.width = `${Math.max(startRadius * 2, 2)}px`;
        ripple.style.height = `${Math.max(startRadius * 2, 2)}px`;
        if (config.rippleGlow) ripple.style.boxShadow = `0 0 ${config.rippleBorderWidth * 1.5}px ${config.rippleColor}`;
        containerItem.appendChild(ripple);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                ripple.style.transition = `width ${config.rippleDurationMs}ms ease-out, height ${config.rippleDurationMs}ms ease-out, opacity ${config.rippleDurationMs}ms ease-out`;
                ripple.style.width = `${Math.max(endRadius * 2, 2)}px`;
                ripple.style.height = `${Math.max(endRadius * 2, 2)}px`;
                ripple.style.opacity = '0';
            });
        });
        setTimeout(() => { if (ripple && ripple.parentNode) ripple.remove(); }, config.rippleDurationMs);
    }, delay);
}

function getFeedContainer() {
    let container = document.getElementById('bf5-killfeed-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bf5-killfeed-container';
        document.body.appendChild(container);
        container.style.bottom = `${Math.floor(window.innerHeight * config.verticalPositionRatio)}px`;
        cleanupInterval = setInterval(() => {
            const now = Date.now(); let needsUpdate = false;
            for (let i = 0; i < container.children.length; i++) {
                if (now >= parseInt(container.children[i].dataset.dieTime, 10)) { container.children[i].remove(); needsUpdate = true; }
            }
            if (needsUpdate && container.children.length > 0) updatePositions(container);
        }, 200);
    }
    return container;
}

function updatePositions(container) {
    const children = container.children; const count = children.length; if (count === 0) return;
    let totalWidth = 0;
    for (let i = 0; i < count; i++) { totalWidth += parseInt(children[i].dataset.width, 10); if (i < count - 1) totalWidth += config.gapBetweenItems; }
    let currentLeft = -totalWidth / 2;
    for (let i = 0; i < count; i++) { const child = children[i]; child.style.left = `${currentLeft}px`; currentLeft += parseInt(child.dataset.width, 10) + config.gapBetweenItems; }
}

// ==============================================================================
// 🌟 命中反馈 (Hit Feedback) - "战地4风格" 双层描边 + 炸裂版
// ==============================================================================
window.BFHitEffects_ShowHitFeedback = function(type) {
    if (!hitFeedbackConfig.enabled) return;

    // 主动清除上一个未销毁的命中反馈，防止高射速下 DOM 累积
    const oldContainer = document.querySelector('.bf-hitfeedback-container');
    if (oldContainer && oldContainer.parentNode) {
        oldContainer.remove();
    }

    // 读取配置
    const typeMap = {
        'normal': hitFeedbackConfig.normal,
        'headshot': hitFeedbackConfig.headshot,
        'kill': hitFeedbackConfig.kill,
        'headshot_kill': hitFeedbackConfig.headshotKill
    };
    const cfg = typeMap[type] || hitFeedbackConfig.normal;
    const isSpecial = (type !== 'normal');

    // 动态计算尺寸
    const size = isSpecial ? cfg.size * (hitFeedbackConfig.specialScale || 1.2) : cfg.size;
    const color = cfg.color;

    // 使用顶部配置的几何参数（数值未改，只是引用变量）
    const grainLength = size * HITFEEDBACK_GEOMETRY.GRAIN_LENGTH_RATIO;
    const grainWidth = size * HITFEEDBACK_GEOMETRY.GRAIN_WIDTH_RATIO;
    const gapRadius = size * HITFEEDBACK_GEOMETRY.GAP_RADIUS_RATIO;
    const outlineThickness = HITFEEDBACK_GEOMETRY.OUTLINE_THICKNESS;

    // 播放音效
    if (hitFeedbackConfig.soundEnabled) {
        const count = hitFeedbackConfig.sound.count || 1;
        const index = Math.floor(Math.random() * count) + 1;
        playSoundByFolder("hit", index);
    }

    // 创建中心容器
    const container = document.createElement('div');
    container.className = 'bf-hitfeedback-container';
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.opacity = '0';
    container.style.transform = 'translate(-50%, -50%) scale(0.8)';

    // 生成 4 个"双层米粒"（黑色底 + 彩色面）
    const angles = [45, 135, 225, 315];
    angles.forEach(angle => {
        const rad = angle * Math.PI / 180;
        const dist = gapRadius + grainLength / 2;
        const x = (size / 2) + Math.sin(rad) * dist;
        const y = (size / 2) - Math.cos(rad) * dist;

        // 底层：黑色描边
        const outlineGrain = document.createElement('div');
        outlineGrain.style.position = 'absolute';
        outlineGrain.style.left = `${x}px`;
        outlineGrain.style.top = `${y}px`;
        outlineGrain.style.width = `${grainWidth + outlineThickness * 2}px`;
        outlineGrain.style.height = `${grainLength + outlineThickness * 2}px`;
        outlineGrain.style.borderRadius = `${(grainWidth + outlineThickness * 2) / 2}px`;
        outlineGrain.style.backgroundColor = '#000000';
        outlineGrain.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        outlineGrain.style.pointerEvents = 'none';
        container.appendChild(outlineGrain);

        // 上层：彩色主体
        const colorGrain = document.createElement('div');
        colorGrain.style.position = 'absolute';
        colorGrain.style.left = `${x}px`;
        colorGrain.style.top = `${y}px`;
        colorGrain.style.width = `${grainWidth}px`;
        colorGrain.style.height = `${grainLength}px`;
        colorGrain.style.borderRadius = `${grainWidth / 2}px`;
        colorGrain.style.backgroundColor = color;
        colorGrain.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        colorGrain.style.pointerEvents = 'none';
        container.appendChild(colorGrain);
    });

    document.body.appendChild(container);

    // 触发淡入淡出动画
    requestAnimationFrame(() => {
        container.style.transition = `opacity ${hitFeedbackConfig.fadeInMs}ms ease-out, transform ${hitFeedbackConfig.fadeInMs}ms ease-out`;
        container.style.opacity = cfg.alpha.toString();
        container.style.transform = 'translate(-50%, -50%) scale(1.0)';

        setTimeout(() => {
            container.style.transition = `opacity ${hitFeedbackConfig.fadeOutMs}ms ease-in, transform ${hitFeedbackConfig.fadeOutMs}ms ease-in`;
            container.style.opacity = '0';
            container.style.transform = 'translate(-50%, -50%) scale(1.1)';
        }, hitFeedbackConfig.fadeInMs);
    });

    // 动画结束后销毁
    const totalDuration = hitFeedbackConfig.fadeInMs + hitFeedbackConfig.fadeOutMs;
    setTimeout(() => { if (container.parentNode) container.remove(); }, totalDuration + 50);
};


// ==============================================================================
// 🌟 伤害数字 (Damage Numbers) - 垂直堆叠队列版
// ==============================================================================
window.BFHitEffects_ShowDamage = function(damage, isHeadshot) {
    if (!damageNumbersConfig.enabled) return;

    const cfg = isHeadshot ? damageNumbersConfig.headshot : damageNumbersConfig.normal;
    const color = cfg.color;
    const size = cfg.size;
    const queue = isHeadshot ? headshotQueue : normalQueue;
    const maxSize = DAMAGE_NUMBERS_QUEUE.MAX_QUEUE_SIZE;

    // 如果队列已满，移除最旧的那个（索引0），带快速淡出动画
    if (queue.length >= maxSize) {
        const oldest = queue.shift();
        if (oldest && oldest.wrapper && oldest.wrapper.parentNode) {
            // 快速淡出而不是瞬间移除
            oldest.wrapper.style.transition = 'opacity 100ms ease-out';
            oldest.wrapper.style.opacity = '0';
            setTimeout(() => {
                if (oldest.wrapper && oldest.wrapper.parentNode) {
                    oldest.wrapper.remove();
                }
            }, 100);
        }
        // 重新排列剩余数字（补位）
        reflowDamageNumbers(isHeadshot);
    }

    // 计算基准位置
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const offsetX = window.innerWidth * damageNumbersConfig.position.offsetX;
    const offsetY = isHeadshot
        ? window.innerHeight * damageNumbersConfig.position.headshotOffsetY
        : window.innerHeight * damageNumbersConfig.position.normalOffsetY;
    const baseX = cx + offsetX;
    const baseY = cy + offsetY;

    // 创建外层容器用于定位和动画
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = `${baseX}px`;
    wrapper.style.top = `${baseY}px`;
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.opacity = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '10001';
    wrapper.style.whiteSpace = 'nowrap';

    // 底层：黑色描边
    const shadowEl = document.createElement('div');
    shadowEl.textContent = damage;
    shadowEl.style.color = '#000000';
    shadowEl.style.fontSize = `${size}px`;
    shadowEl.style.fontFamily = damageNumbersConfig.fontFamily;
    shadowEl.style.fontWeight = 'bold';
    const thickness = damageNumbersConfig.shadowThickness || 2;
    shadowEl.style.transform = `translate(${thickness}px, ${thickness}px)`;
    shadowEl.style.position = 'absolute';
    shadowEl.style.left = '0';
    shadowEl.style.top = '0';

    // 上层：彩色主文字
    const mainEl = document.createElement('div');
    mainEl.textContent = damage;
    mainEl.style.color = color;
    mainEl.style.fontSize = `${size}px`;
    mainEl.style.fontFamily = damageNumbersConfig.fontFamily;
    mainEl.style.fontWeight = 'bold';
    mainEl.style.position = 'absolute';
    mainEl.style.left = '0';
    mainEl.style.top = '0';

    wrapper.appendChild(shadowEl);
    wrapper.appendChild(mainEl);
    document.body.appendChild(wrapper);

    // 记录数字信息到队列
    const entry = {
        wrapper: wrapper,
        damage: damage,
        isHeadshot: isHeadshot,
        startTime: performance.now(),
        baseX: baseX,
        baseY: baseY,
        index: queue.length,  // 当前队列中的位置
        isRemoved: false
    };
    queue.push(entry);

    // 触发展开动画：先不透明，然后淡出
    requestAnimationFrame(() => {
        wrapper.style.transition = `opacity ${damageNumbersConfig.fadeInMs}ms ease-in`;
        wrapper.style.opacity = cfg.alpha.toString();

        setTimeout(() => {
            wrapper.style.transition = `opacity ${damageNumbersConfig.fadeOutMs}ms ease-out`;
            wrapper.style.opacity = '0';
        }, damageNumbersConfig.fadeInMs);
    });

    // 监听淡出完成，移除 DOM 并清理队列
    let isRemoved = false;
    wrapper.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' && !isRemoved && parseFloat(wrapper.style.opacity) === 0) {
            isRemoved = true;
            if (wrapper.parentNode) wrapper.remove();
            // 从队列中移除该数字
            removeDamageNumber(entry, isHeadshot);
        }
    });

    // 兜底：如果 transitionend 未触发（如被强制清除），用 setTimeout 保底
    setTimeout(() => {
        if (!isRemoved && wrapper.parentNode) {
            isRemoved = true;
            wrapper.remove();
            removeDamageNumber(entry, isHeadshot);
        }
    }, damageNumbersConfig.fadeInMs + damageNumbersConfig.fadeOutMs + 100);

    // 立即重新排列所有数字
    reflowDamageNumbers(isHeadshot);
};



// ==============================================================================
// 🌟 伤害数字队列辅助函数（垂直堆叠排列）
// ==============================================================================

/**
 * 重新排列指定队列中的所有数字，使其垂直堆叠
 * @param {boolean} isHeadshot - true=爆头队列，false=普通队列
 */
function reflowDamageNumbers(isHeadshot) {
    const queue = isHeadshot ? headshotQueue : normalQueue;
    const slotHeight = DAMAGE_NUMBERS_QUEUE.SLOT_HEIGHT;

    // 遍历队列，为每个数字计算新的 Y 位置
    for (let i = 0; i < queue.length; i++) {
        const entry = queue[i];
        if (!entry || !entry.wrapper || entry.isRemoved) continue;

        // 计算偏移量：爆头向上（负值），普通向下（正值）
        const offsetY = isHeadshot
            ? -i * slotHeight   // 爆头向上堆叠
            : i * slotHeight;   // 普通向下堆叠

        // 更新位置（带动画过渡）
        const newY = entry.baseY + offsetY;
        // 使用 transform 移动，避免触发重排
        // 只在首次移动时设置 transition，避免重复赋值
        if (!entry.wrapper.dataset.transitionSet) {
        entry.wrapper.style.transition = 'transform 0.15s ease-out';
        entry.wrapper.dataset.transitionSet = 'true';
        }
        entry.wrapper.style.transform = `translate(-50%, -50%) translateY(${offsetY}px)`;
    }
}

/**
 * 从队列中移除指定的数字条目
 * @param {object} entry - 要移除的队列条目
 * @param {boolean} isHeadshot - true=爆头队列，false=普通队列
 */
function removeDamageNumber(entry, isHeadshot) {
    if (!entry || entry.isRemoved) return;
    entry.isRemoved = true;

    const queue = isHeadshot ? headshotQueue : normalQueue;
    const index = queue.indexOf(entry);
    if (index !== -1) {
        queue.splice(index, 1);
        // 移除后重新排列剩余数字（自动补位）
        reflowDamageNumbers(isHeadshot);
    }
}

// ==============================================================================
// 🎯 Lua 通信接口（玩家无需修改）
// ==============================================================================
window.BFHitEffects_UpdateSettings = function(newSettings) {
    config.soundEnabled = newSettings.enabled;
    config.textGlobalScale = newSettings.textGlobalScale;
    config.iconGlobalScale = newSettings.iconGlobalScale;
    config.tags = newSettings.tags;
    config.sounds = newSettings.sounds;

    if (newSettings.hitFeedback) {
        const hf = newSettings.hitFeedback;
        if (hf.enabled !== undefined) hitFeedbackConfig.enabled = hf.enabled;
        if (hf.soundEnabled !== undefined) hitFeedbackConfig.soundEnabled = hf.soundEnabled;
        if (hf.normal) Object.assign(hitFeedbackConfig.normal, hf.normal);
        if (hf.headshot) Object.assign(hitFeedbackConfig.headshot, hf.headshot);
        if (hf.kill) Object.assign(hitFeedbackConfig.kill, hf.kill);
        if (hf.headshotKill) Object.assign(hitFeedbackConfig.headshotKill, hf.headshotKill);
        if (hf.specialScale !== undefined) hitFeedbackConfig.specialScale = hf.specialScale;
        if (hf.specialThickness !== undefined) hitFeedbackConfig.specialThickness = hf.specialThickness;
        if (hf.fadeInMs !== undefined) hitFeedbackConfig.fadeInMs = hf.fadeInMs;
        if (hf.fadeOutMs !== undefined) hitFeedbackConfig.fadeOutMs = hf.fadeOutMs;
        if (hf.sound) Object.assign(hitFeedbackConfig.sound, hf.sound);
    }

    if (newSettings.damageNumbers) {
        const dn = newSettings.damageNumbers;
        if (dn.enabled !== undefined) damageNumbersConfig.enabled = dn.enabled;
        if (dn.headshot) Object.assign(damageNumbersConfig.headshot, dn.headshot);
        if (dn.normal) Object.assign(damageNumbersConfig.normal, dn.normal);
        if (dn.fadeInMs !== undefined) damageNumbersConfig.fadeInMs = dn.fadeInMs;
        if (dn.fadeOutMs !== undefined) damageNumbersConfig.fadeOutMs = dn.fadeOutMs;
        if (dn.lifetimeMs !== undefined) damageNumbersConfig.lifetimeMs = dn.lifetimeMs;
        if (dn.fontFamily) damageNumbersConfig.fontFamily = dn.fontFamily;
    }
};

window.BFHitEffects_AddKill = function(tagsStr, folderType, soundIndex) {
    playSoundByFolder(folderType, soundIndex);
    ensureAnimationKeyframes();
    const container = getFeedContainer();
    if (container.children.length >= config.maxFeedItems) container.removeChild(container.lastChild);

    const tags = tagsStr.split(',').filter(t => t.length > 0);
    let baseTag = tags[0] || "NORMAL";
    let extraTags = tags.slice(1).filter(t => t === "VEHICLE_DESTRUCTION");
    const baseConfig = config.tags[baseTag] || { isImg: true, text: "KILL", color: "#FFF", shadowType: 1, iconScale: 1.0 };

    const item = document.createElement('div');
    item.className = 'bf5-kill-item';
    item.dataset.dieTime = Date.now() + config.lifetimeMs;

    let iconEl, width, height;
    if (baseConfig.isImg) {
        const baseHeight = Math.floor(window.innerHeight * 0.05);
        const finalScale = config.iconGlobalScale * (baseConfig.iconScale || 1.0);
        height = Math.floor(baseHeight * finalScale);
        const aspectRatio = getAspectRatioForTag(baseTag);
        width = Math.floor(height * aspectRatio);
        iconEl = document.createElement('img');
        iconEl.src = IMG_PATHS[baseTag] || IMG_PATHS.NORMAL;
        iconEl.style.width = `${width}px`; iconEl.style.height = `${height}px`;
    } else {
        const baseHeight = Math.floor(window.innerHeight * config.textHeightRatio);
        height = Math.floor(baseHeight * config.textGlobalScale);
        width = Math.floor(height * baseConfig.text.length * config.textWidthEstimateRatio);
        iconEl = document.createElement('div');
        iconEl.className = 'bf5-text-icon';
        iconEl.textContent = baseConfig.text;
        iconEl.style.fontSize = `${height}px`; iconEl.style.lineHeight = `${height}px`;
        iconEl.style.color = baseConfig.color;
        iconEl.style.textShadow = SHADOW_PRESETS[baseConfig.shadowType] || SHADOW_PRESETS[1];
    }

    iconEl.className += ' bf5-icon bf5-icon-animate';
    iconEl.style.opacity = '1';
    item.appendChild(iconEl);

    if (baseTag === "HEADSHOT" && config.rippleEnabled) createRipple(item, width, height);

    let totalWidth = width;
    for (const extraTag of extraTags) {
        const extraConfig = config.tags[extraTag] || { iconScale: 1.0 };
        const extraIcon = document.createElement('img');
        extraIcon.className = 'bf5-icon bf5-extra-icon bf5-icon-animate';
        extraIcon.src = IMG_PATHS[extraTag] || IMG_PATHS.VEHICLE_DESTRUCTION;
        const baseHeight = Math.floor(window.innerHeight * 0.05);
        const eHeight = Math.floor(baseHeight * config.iconGlobalScale * (extraConfig.iconScale || 1.0));
        const eAspectRatio = getAspectRatioForTag(extraTag);
        const eWidth = Math.floor(eHeight * eAspectRatio);
        extraIcon.style.width = `${eWidth}px`; extraIcon.style.height = `${eHeight}px`;
        extraIcon.style.left = `${totalWidth + config.gapBetweenItems}px`;
        extraIcon.style.bottom = '0'; extraIcon.style.opacity = '1';
        item.appendChild(extraIcon);
        totalWidth += eWidth + config.gapBetweenItems;
    }

    item.dataset.width = totalWidth;
    container.insertBefore(item, container.firstChild);
    updatePositions(container);
};

window.BFHitEffects_EnableSound = function(enabled) { config.soundEnabled = enabled; };