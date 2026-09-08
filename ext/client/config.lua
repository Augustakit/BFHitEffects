-- ==============================================================================
--  BFHitEffects Front‑end Configuration (Client Config)
-- ==============================================================================
--  For community players:
--  1. This file controls the default display state of all UI elements
--     (text/image, color, shadow, size, etc.).
--  2. Changing the defaults here will change the initial values shown in the
--     in‑game settings menu for all players.
--  3. Colors support Hex format (e.g. "#FF0000" for pure red, "#FFFFFF" for white).
--  4. Shadow supports numeric options: 0=none, 1=black stroke, 2=glow stroke.
--     The JavaScript front‑end will convert them automatically.
-- ==============================================================================

return {
    -- --------------------------------------------------------------------------
    --  Global master switch and scale (players can freely adjust)
    -- --------------------------------------------------------------------------
    Enabled = true,               -- [Switch] Enable the entire kill effect mod (true=on, false=off)
    SoundEnabled = true,          -- [Switch] Enable kill sounds (true=on, false=mute)

    --  Size configuration (unit: percent. 100 = 100% original size, 70 = 70% size)
    TextGlobalScale = 70,         -- [Text] Global uniform scale (%) – applied to all text
    IconGlobalScale = 70,         -- [Icon] Global uniform scale (%) – base size for all icons

    -- --------------------------------------------------------------------------
    -- 🔊 Sound configuration (players can change the pool sizes, but must ensure
    --    the actual files exist)
    -- --------------------------------------------------------------------------
    --  Note: Folder is the subdirectory under ui/assets/sounds/, Count is the
    --  number of .webm files inside.
    SoundHeadshot = { Folder = "headshot", Count = 3 }, -- Headshot sound pool
    SoundNormal   = { Folder = "normal",   Count = 1 }, -- Normal kill sound pool
    SoundSpecial  = { Folder = "special",  Count = 1 }, -- Special kill sound pool (knife/defib/roadkill etc.)
    SoundExplosive= { Folder = "explosive",Count = 1 }, -- Explosion / vehicle destruction sound pool

    -- --------------------------------------------------------------------------
    -- 🎨 Tag‑specific configuration (each kill type is independently customisable)
    -- --------------------------------------------------------------------------
    --  Parameter explanations:
    --  Name       : Display name shown in the in‑game settings menu
    --  Text       : The actual text shown when the player chooses "text mode"
    --  IsImg      : Whether to use an image by default (true=image, false=text)
    --  IconScale  : [Image only] Per‑tag fine‑tune scaling (100 = no extra scaling, 120 = +20%)
    --  Color      : [Text only] Text colour in Hex (e.g. "#FF2222" for red)
    --  Shadow     : [Text only] Shadow style: 0=none, 1=simple black stroke, 2=strong glow
    --  AspectRatio: [Image only] Image aspect ratio; can be "16:9", "4:3", or "original"
    -- --------------------------------------------------------------------------
    Tags = {
        HEADSHOT = {
            Name = "Headshot", Text = "HEADSHOT", IsImg = true, IconScale = 80, 
            Color = "#FF2222", Shadow = 2, AspectRatio = "original"
        },
        NORMAL = { 
            Name = "Normal Kill", Text = "KILL", IsImg = true, IconScale = 80, 
            Color = "#FFFFFF", Shadow = 1, AspectRatio = "original"
        },
        KNIFE = { 
            Name = "Knife Kill", Text = "KNIFE", IsImg = true, IconScale = 100, 
            Color = "#FFAA00", Shadow = 1, AspectRatio = "original"
        },
        DEFIB = { 
            Name = "Defibrillator", Text = "DEFIB", IsImg = true, IconScale = 70, 
            Color = "#00FFFF", Shadow = 1, AspectRatio = "original"
        },
        MEDKIT = { 
            Name = "Medkit", Text = "MEDKIT", IsImg = true, IconScale = 80, 
            Color = "#00FF00", Shadow = 1, AspectRatio = "original"
        },
        REPAIR = { 
            Name = "Repair Tool", Text = "REPAIR", IsImg = true, IconScale = 100, 
            Color = "#0088FF", Shadow = 1, AspectRatio = "original"
        },
        EXPLOSIVE = {
            Name = "Explosive Kill", Text = "EXPLOSIVE", IsImg = true, IconScale = 70, 
            Color = "#FF8800", Shadow = 2, AspectRatio = "original"
        },
        ROADKILL = { 
            Name = "Roadkill", Text = "ROADKILL", IsImg = true, IconScale = 120, 
            Color = "#AA00FF", Shadow = 1, AspectRatio = "original"
        },
        VEHICLE_DESTRUCTION = {
            Name = "Vehicle Destroyed", Text = "WRECK", IsImg = true, IconScale = 70, 
            Color = "#888888", Shadow = 1, AspectRatio = "original"
        }
    },

    -- ==========================================================================
    -- 🌟 Hit Feedback configuration (the cross‑hair X marker when hitting an enemy)
    --    Fully customisable by the player.
    -- ==========================================================================
    HitFeedback = {
        Enabled = true,                     -- [Switch] Show hit feedback
        SoundEnabled = true,                -- [Switch] Play sound on hit
        -- Settings for each hit type: color, size, line thickness, opacity
        Normal = {
            Color = "#FFFFFF",              -- [Normal hit] Color
            Size = 15,                      -- [Normal hit] Overall size (pixels)
            Thickness = 3,                  -- [Normal hit] Line thickness (pixels)
            Alpha = 1.0                     -- [Normal hit] Opacity (0~1)
        },
        Headshot = {
            Color = "#FFAA00",              -- [Headshot] Color
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        Kill = {
            Color = "#FF0000",              -- [Kill (non‑headshot)] Color
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        HeadshotKill = {
            Color = "#00FF7F",              -- [Headshot kill] Color
            Size = 15,
            Thickness = 3,
            Alpha = 1.0
        },
        SpecialScale = 1.2,                 -- [Special scaling] Overall scale multiplier for headshot/kill
        SpecialThickness = 1.4,             -- [Special thickness] Line thickness multiplier for headshot/kill
        FadeInMs = 80,                      -- [Fade‑in time] in milliseconds
        FadeOutMs = 200,                    -- [Fade‑out time] in milliseconds
        Sound = { Folder = "hit", Count = 1 } -- [Sound] folder name and file count
    },

    -- ==========================================================================
    -- 🌟 Damage Numbers display (Battlefield 6 style – fixed to the left of the
    --    crosshair). Players can adjust colour, size, and timing.
    -- ==========================================================================
    DamageNumbers = {
        Enabled = true,
        -- Headshot damage (colour recommended to match the ripple effect)
        Headshot = {
            Color = "#90F2FF",              -- [Head damage] Colour
            Size = 20,                      -- [Head damage] Font size
            Alpha = 1.0                     -- [Head damage] Opacity
        },
        -- Normal damage
        Normal = {
            Color = "#FFFFFF",              -- [Normal damage] Colour
            Size = 20,                      -- [Normal damage] Font size
            Alpha = 1.0                     -- [Normal damage] Opacity
        },
        -- Timing parameters (very fast fade‑in/out to avoid overlap)
        FadeInMs = 80,                      -- [Fade‑in] milliseconds
        FadeOutMs = 200,                    -- [Fade‑out] milliseconds
        LifetimeMs = 280,                   -- [Total lifetime] milliseconds; smaller = faster disappearance
    }
}