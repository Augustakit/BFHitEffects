export default {
    // ==============================================================================
    //  1. Asset paths (hardcoded to fit the .vuic packaging mechanism)
    // ==============================================================================
    //  For community players:
    //  If you want to replace an icon, place your new image under ui/assets/images/
    //  and change the file name below.
    //  Paths must use relative paths like "./assets/...", never absolute paths starting with "/"!

    // ----- Image paths (modifiable) -----
    // Place new images in ui/assets/images/, then update the corresponding file name below
    imgHeadshot: "./assets/images/headshot2.png",       // Headshot icon
    imgNormal: "./assets/images/headshot.png",          // Normal kill icon
    imgKnife: "./assets/images/knife.png",              // Knife kill icon
    imgDefib: "./assets/images/defib.png",              // Defibrillator icon
    imgMedkit: "./assets/images/medkit.png",            // Medkit icon
    imgRepair: "./assets/images/repair.png",            // Repair tool icon
    imgExplosive: "./assets/images/explosive.png",      // Explosive kill icon
    imgRoadkill: "./assets/images/roadkill.png",        // Roadkill icon
    imgVehicleDestroy: "./assets/images/vehicle_destroy.png", // Vehicle destroyed icon

    // ----- Sound folder paths (modifiable) -----
    // Place sound files in ui/assets/sounds/ under the corresponding subfolder
    soundHeadshotFolder: "./assets/sounds/headshot/",   // Headshot sound pool
    soundNormalFolder: "./assets/sounds/normal/",       // Normal kill sound pool
    soundSpecialFolder: "./assets/sounds/special/",     // Special kill sound pool (knife/defib etc.)
    soundExplosiveFolder: "./assets/sounds/explosive/", // Explosive / vehicle destruction sound pool
    soundHitFolder: "./assets/sounds/hit/",             // Hit feedback sound pool (hit impact)

    // ==============================================================================
    //  2. Animation & visual parameters (purely front-end, control the “feel” of the effects)
    // ==============================================================================
    //  Warning: these parameters directly affect the visual appearance and feel of the effects.
    //  It is recommended to tweak them in steps of 0.1 or 50 at a time.
    popInScalePeak: 1.5,                    // [Scale peak] 1.5 = scale up to 150%, then back to 100%
    popInDurationMs: 700,                   // [Scale duration] in milliseconds, 700 = 0.7s

    rippleEnabled: true,                    // [Ripple] Enable headshot water ripple effect (true=on)
    rippleStartRatio: 0.5,                  // [Ripple] Trigger timing (0.5 = start when scaling animation is 50% complete)
    rippleDurationMs: 800,                  // [Ripple] Total ripple duration (ms)
    rippleStartRadiusPercent: 2,            // [Ripple] Starting radius as a percentage of screen width (2% = tiny dot)
    rippleEndRadiusPercent: 15,             // [Ripple] Final radius as a percentage of screen width (15% of screen width)
    rippleBorderWidth: 6,                   // [Ripple] Ring border thickness (pixels)
    rippleColor: "rgba(144, 242, 255, 1)",  // [Ripple] Ring color (supports rgba)
    rippleGlow: true,                       // [Ripple] Add outer glow effect
    rippleOffsetX: 0,                       // [Ripple] Horizontal offset (pixels, positive = right, negative = left)
    rippleOffsetY: 0,                       // [Ripple] Vertical offset (pixels, positive = down, negative = up)

    // ==============================================================================
    //  3. Scale & queue control
    // ==============================================================================
    defaultAspectRatio: "original",         // [Default aspect ratio] options: "16:9", "4:3", "original"
    originalAspectRatio: 1.0,               // [Custom aspect ratio] used when defaultAspectRatio is "original"

    verticalPositionRatio: 0.26,            // [Vertical position] killfeed distance from bottom of screen (0.26 = 26% height)
    maxFeedItems: 6,                        // [Max items] maximum number of icons displayed simultaneously
    gapBetweenItems: 8,                     // [Gap] spacing between adjacent icons (pixels)
    lifetimeMs: 3000,                       // [Lifetime] time each icon stays on screen (milliseconds)

    textHeightRatio: 0.04,                  // [Text height ratio] base text height as proportion of screen (no need to change)
    textWidthEstimateRatio: 0.6,            // [Text width estimate] used for queue centering (no need to change)

    // ==============================================================================
    //  4. Fallback business config (actually overwritten instantly by Lua, players need not modify here)
    // ==============================================================================
    //  Warning: the following config only serves as a placeholder when JS first starts
    //  before Lua has synced, to prevent JS errors.
    //  For actual customisation of size, color, text, etc., please use the in‑game settings
    //  menu or modify config.lua!
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