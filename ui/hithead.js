import config from './config.js';

// ==============================================================================
// ═══════════════════════════════════════════════════════════════════════════════
//  🌟 Player‑editable configuration area (read the comments before modifying)
//  ═══════════════════════════════════════════════════════════════════════════════
//  Note: all adjustable values are centralised here for easy tweaking by players.
//  Save the file and reload the mod for changes to take effect.
// ==============================================================================

// ----- 1. Hit Feedback geometry parameters -----
// These control the shape and size of the centre "X" marker
const HITFEEDBACK_GEOMETRY = {
    // Grain length relative to overall size (larger = longer arms of the X)
    GRAIN_LENGTH_RATIO: 0.60,
    // Grain width relative to overall size (larger = thicker lines)
    GRAIN_WIDTH_RATIO: 0.12,
    // Central gap radius relative to overall size (larger = bigger hollow centre)
    GAP_RADIUS_RATIO: 0.60,
    // Black outline extra thickness beyond the coloured part (pixels, larger = more visible outline)
    OUTLINE_THICKNESS: 1.0
};

// ----- 2. Damage Numbers position parameters -----
// These control where numbers appear on screen (relative to the crosshair)
const DAMAGE_NUMBERS_POSITION = {
    // Horizontal offset ratio (negative = left, -0.06 = 6% screen width to the left of centre)
    OFFSET_X: -0.06,
    // Vertical offset for headshot numbers (negative = up, -0.02 = 2% screen height above centre)
    HEADSHOT_OFFSET_Y: -0.02,
    // Vertical offset for normal numbers (positive = down, 0.01 = 1% screen height below centre)
    NORMAL_OFFSET_Y: 0.01
};
// ----- 2.5 Damage Numbers shadow thickness -----
const DAMAGE_NUMBERS_SHADOW_THICKNESS = 2;  // 0=none, 1=thin, 2=standard, 3=thick

// ----- 2.6 Damage Numbers stacking queue parameters -----
const DAMAGE_NUMBERS_QUEUE = {
    // Vertical slot height per number (pixels), determines spacing between numbers
    SLOT_HEIGHT: 32,
    // Maximum queue length (new numbers replace the oldest when exceeded)
    MAX_QUEUE_SIZE: 6
};

// ----- 3. Audio throttling parameters -----
// Prevents the audio context from hanging due to too many simultaneous sounds
const MAX_CONCURRENT_AUDIO = 3;   // Maximum number of simultaneous audio plays

// ----- 4. Shadow preset dictionary (automatically mapped from numeric values sent by Lua) -----
const SHADOW_PRESETS = {
    0: "none",
    1: "2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000",
    2: "0 0 4px #000, 0 0 8px #000, 2px 2px 0px #000, -2px -2px 0px #000"
};

//  Core logic (the code below generally does not need modification)

// ----- 1. Global state & configuration -----
let cleanupInterval = null;

const IMG_PATHS = {
    HEADSHOT: config.imgHeadshot, NORMAL: config.imgNormal, KNIFE: config.imgKnife,
    DEFIB: config.imgDefib, MEDKIT: config.imgMedkit, REPAIR: config.imgRepair,
    EXPLOSIVE: config.imgExplosive, ROADKILL: config.imgRoadkill, VEHICLE_DESTRUCTION: config.imgVehicleDestroy
};

// Hit feedback config (actual values are overridden by Lua)
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

// Damage numbers config (actual values are overridden by Lua)
let damageNumbersConfig = {
    enabled: true,
    headshot: { color: "#90F2FF", size: 28, alpha: 1.0 },
    normal: { color: "#FFFFFF", size: 24, alpha: 1.0 },
    fadeInMs: 80, fadeOutMs: 100, lifetimeMs: 180,
    fontFamily: "Alibaba PuHuiTi, Arial, sans-serif",
    shadowThickness: DAMAGE_NUMBERS_SHADOW_THICKNESS,
    // Position parameters reference the top-level config for easy centralised adjustment
    position: {
        offsetX: DAMAGE_NUMBERS_POSITION.OFFSET_X,
        headshotOffsetY: DAMAGE_NUMBERS_POSITION.HEADSHOT_OFFSET_Y,
        normalOffsetY: DAMAGE_NUMBERS_POSITION.NORMAL_OFFSET_Y
    }
};

// ----- Damage numbers queue state (for vertical stacking) -----
// Headshot queue (stacks upward)
let headshotQueue = [];
// Normal damage queue (stacks downward)
let normalQueue = [];
// Animation ID for queue reflow

// requestAnimationFrame ID for reflowDamageNumbers, so it can be cancelled if needed
let reflowAnimationId = null;
// ----- 2. Sound playback engine -----
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

// ----- 3. Killfeed rendering engine -----
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
// 🌟 Hit Feedback - "Battlefield 4 style" double‑layered outline + blast effect
// ==============================================================================
window.BFHitEffects_ShowHitFeedback = function(type) {
    if (!hitFeedbackConfig.enabled) return;

    // Immediately clear any previous hit feedback to prevent DOM buildup during rapid fire
    const oldContainer = document.querySelector('.bf-hitfeedback-container');
    if (oldContainer && oldContainer.parentNode) {
        oldContainer.remove();
    }

    // Read config
    const typeMap = {
        'normal': hitFeedbackConfig.normal,
        'headshot': hitFeedbackConfig.headshot,
        'kill': hitFeedbackConfig.kill,
        'headshot_kill': hitFeedbackConfig.headshotKill
    };
    const cfg = typeMap[type] || hitFeedbackConfig.normal;
    const isSpecial = (type !== 'normal');

    // Dynamic size calculation
    const size = isSpecial ? cfg.size * (hitFeedbackConfig.specialScale || 1.2) : cfg.size;
    const color = cfg.color;

    // Use geometry parameters from the top config (values unchanged, just variable references)
    const grainLength = size * HITFEEDBACK_GEOMETRY.GRAIN_LENGTH_RATIO;
    const grainWidth = size * HITFEEDBACK_GEOMETRY.GRAIN_WIDTH_RATIO;
    const gapRadius = size * HITFEEDBACK_GEOMETRY.GAP_RADIUS_RATIO;
    const outlineThickness = HITFEEDBACK_GEOMETRY.OUTLINE_THICKNESS;

    // Play sound
    if (hitFeedbackConfig.soundEnabled) {
        const count = hitFeedbackConfig.sound.count || 1;
        const index = Math.floor(Math.random() * count) + 1;
        playSoundByFolder("hit", index);
    }

    // Create centre container
    const container = document.createElement('div');
    container.className = 'bf-hitfeedback-container';
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.opacity = '0';
    container.style.transform = 'translate(-50%, -50%) scale(0.8)';

    // Generate 4 "double‑layered grains" (black base + coloured top)
    const angles = [45, 135, 225, 315];
    angles.forEach(angle => {
        const rad = angle * Math.PI / 180;
        const dist = gapRadius + grainLength / 2;
        const x = (size / 2) + Math.sin(rad) * dist;
        const y = (size / 2) - Math.cos(rad) * dist;

        // Bottom layer: black outline
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

        // Top layer: coloured main body
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

    // Trigger fade‑in / fade‑out animation
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

    // Destroy after animation ends
    const totalDuration = hitFeedbackConfig.fadeInMs + hitFeedbackConfig.fadeOutMs;
    setTimeout(() => { if (container.parentNode) container.remove(); }, totalDuration + 50);
};


// ==============================================================================
// 🌟 Damage Numbers - vertically stacked queue version
// ==============================================================================
window.BFHitEffects_ShowDamage = function(damage, isHeadshot) {
    if (!damageNumbersConfig.enabled) return;

    const cfg = isHeadshot ? damageNumbersConfig.headshot : damageNumbersConfig.normal;
    const color = cfg.color;
    const size = cfg.size;
    const queue = isHeadshot ? headshotQueue : normalQueue;
    const maxSize = DAMAGE_NUMBERS_QUEUE.MAX_QUEUE_SIZE;

    // If queue is full, remove the oldest (index 0) with a quick fade‑out animation
    if (queue.length >= maxSize) {
        const oldest = queue.shift();
        if (oldest && oldest.wrapper && oldest.wrapper.parentNode) {
            // Quick fade‑out instead of instant removal
            oldest.wrapper.style.transition = 'opacity 100ms ease-out';
            oldest.wrapper.style.opacity = '0';
            setTimeout(() => {
                if (oldest.wrapper && oldest.wrapper.parentNode) {
                    oldest.wrapper.remove();
                }
            }, 100);
        }
        // Re‑arrange remaining numbers (fill the gap)
        reflowDamageNumbers(isHeadshot);
    }

    // Calculate base position
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const offsetX = window.innerWidth * damageNumbersConfig.position.offsetX;
    const offsetY = isHeadshot
        ? window.innerHeight * damageNumbersConfig.position.headshotOffsetY
        : window.innerHeight * damageNumbersConfig.position.normalOffsetY;
    const baseX = cx + offsetX;
    const baseY = cy + offsetY;

    // Create outer wrapper for positioning and animation
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = `${baseX}px`;
    wrapper.style.top = `${baseY}px`;
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.opacity = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '10001';
    wrapper.style.whiteSpace = 'nowrap';

    // Bottom layer: black outline (shadow)
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

    // Top layer: coloured main text
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

    // Record the number info in the queue
    const entry = {
        wrapper: wrapper,
        damage: damage,
        isHeadshot: isHeadshot,
        startTime: performance.now(),
        baseX: baseX,
        baseY: baseY,
        index: queue.length,  // position in the queue
        isRemoved: false
    };
    queue.push(entry);

    // Trigger appear animation: first fade in, then fade out
    requestAnimationFrame(() => {
        wrapper.style.transition = `opacity ${damageNumbersConfig.fadeInMs}ms ease-in`;
        wrapper.style.opacity = cfg.alpha.toString();

        setTimeout(() => {
            wrapper.style.transition = `opacity ${damageNumbersConfig.fadeOutMs}ms ease-out`;
            wrapper.style.opacity = '0';
        }, damageNumbersConfig.fadeInMs);
    });

    // Listen for fade‑out completion to remove DOM and clean up queue
    let isRemoved = false;
    wrapper.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' && !isRemoved && parseFloat(wrapper.style.opacity) === 0) {
            isRemoved = true;
            if (wrapper.parentNode) wrapper.remove();
            // Remove entry from queue
            removeDamageNumber(entry, isHeadshot);
        }
    });

    // Fallback: if transitionend doesn't fire (e.g., forced cleanup), use setTimeout as safety net
    setTimeout(() => {
        if (!isRemoved && wrapper.parentNode) {
            isRemoved = true;
            wrapper.remove();
            removeDamageNumber(entry, isHeadshot);
        }
    }, damageNumbersConfig.fadeInMs + damageNumbersConfig.fadeOutMs + 100);

    // Immediately re‑arrange all numbers
    reflowDamageNumbers(isHeadshot);
};



// ==============================================================================
// 🌟 Damage numbers queue helpers (vertical stacking)
// ==============================================================================

/**
 * Re‑arrange all numbers in the specified queue to stack vertically
 * @param {boolean} isHeadshot - true for headshot queue, false for normal queue
 */
function reflowDamageNumbers(isHeadshot) {
    const queue = isHeadshot ? headshotQueue : normalQueue;
    const slotHeight = DAMAGE_NUMBERS_QUEUE.SLOT_HEIGHT;

    // Iterate through the queue and compute new Y positions for each number
    for (let i = 0; i < queue.length; i++) {
        const entry = queue[i];
        if (!entry || !entry.wrapper || entry.isRemoved) continue;

        // Calculate offset: headshot = upward (negative), normal = downward (positive)
        const offsetY = isHeadshot
            ? -i * slotHeight   // Headshot stacks upward
            : i * slotHeight;   // Normal stacks downward

        // Update position (with smooth transition)
        const newY = entry.baseY + offsetY;
        // Use transform to move, avoiding reflow
        // Only set transition on the first move to avoid multiple assignments
        if (!entry.wrapper.dataset.transitionSet) {
        entry.wrapper.style.transition = 'transform 0.15s ease-out';
        entry.wrapper.dataset.transitionSet = 'true';
        }
        entry.wrapper.style.transform = `translate(-50%, -50%) translateY(${offsetY}px)`;
    }
}

/**
 * Remove a specific number entry from the queue
 * @param {object} entry - The queue entry to remove
 * @param {boolean} isHeadshot - true for headshot queue, false for normal queue
 */
function removeDamageNumber(entry, isHeadshot) {
    if (!entry || entry.isRemoved) return;
    entry.isRemoved = true;

    const queue = isHeadshot ? headshotQueue : normalQueue;
    const index = queue.indexOf(entry);
    if (index !== -1) {
        queue.splice(index, 1);
        // Re‑arrange remaining numbers after removal (auto‑fill the gap)
        reflowDamageNumbers(isHeadshot);
    }
}

// ==============================================================================
// 🎯 Lua communication interface (players do not need to modify)
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