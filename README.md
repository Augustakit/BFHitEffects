# BFHitEffects Mod — Battlefield 3 Kill Effect & Hit Feedback Enhancement

> Compatible with Venice Unleashed v20939 and above

## 📖 Overview

**BFHitEffects** is a kill effect and hit feedback enhancement mod for the Battlefield 3 Venice Unleashed private server. It replaces the game's bland kill notifications with:

- **Rich kill effects**: 9 kill types including headshots, knife kills, explosive kills, each with their own independent icon and colour
- **Dynamic headshot ripple**: a colourful ripple effect that expands from the centre of the screen on headshots
- **Battlefield 4 style hit feedback**: a four‑segment "grain" X marker appears at the crosshair when you hit an enemy
- **Damage number display**: shows the damage you deal in real time, fixed to the left of the crosshair – just like in Battlefield 6
- **Kill and hit sounds**: each kill type has its own sound pool for enhanced impact feedback
- **Highly customisable**: almost every visual parameter can be tweaked via the in‑game settings menu or configuration files – no recompilation required

Whether you're a regular player who just wants to adjust a few colours, or a mod developer looking for deep UI customisation, this guide will help you get started quickly.


## 📁 Directory Structure

After installation, the mod's file structure looks like this:

```
BFHitEffects/
├── __init__.lua              # Client logic (generally does not need modification)
├── config.lua                # ⭐ Player configuration file (most adjustments go here)
├── ext/                      # VeniceEXT extension (core mod logic)
│   └── __init__.lua          # Server logic (generally does not need modification)
├── ui/                       # UI resource directory (packaged into .vuic for use)
│   ├── assets/               # Packaged resource files (automatically included when building .vuic)
│   │   ├── fonts/            # Font files (.ttf/.otf)
│   │   ├── images/           # Kill icons (.png)
│   │   └── sounds/           # Sound files (.webm)
│   │       ├── headshot/     # Headshot sounds
│   │       ├── normal/       # Normal kill sounds
│   │       ├── special/      # Special kill sounds (knife/defib etc.)
│   │       ├── explosive/    # Explosive kill sounds
│   │       └── hit/          # Hit feedback sounds
│   ├── config.js             # ⭐⭐ Advanced configuration (asset paths & animation parameters)
│   ├── hithead.js            # ⭐⭐⭐ Core rendering engine (advanced users can tweak)
│   ├── hithead.css           # UI stylesheet (generally does not need modification)
│   └── index.html            # UI entry page
├── assets/                   # Source asset folder (raw, un‑packaged materials)
│   ├── images/               # Icon source files (copy to ui/assets/images/ to use)
└── mod.json                  # Mod metadata
```


## ⚙️ Part 1: In‑Game Settings Menu (simplest, zero‑configuration)

Once in game, press **ESC** to open the menu, then navigate to:

```
Settings → Mods → BFHitEffects
```

You will see the following options. All changes take effect **in real time** – no need to restart the game:

| Setting | Effect | Range |
|---------|--------|-------|
| **Enable kill effects** | Master switch for the mod | On / Off |
| **Enable kill sounds** | Master switch for all sounds | On / Off |
| **Text global scale** | Global size for all text‑based icons | 10% ~ 200% |
| **Icon global scale** | Global size for all image‑based icons | 10% ~ 200% |
| **[Tag] Use image** | Switch a specific kill type between image and text mode | On / Off |
| **[Tag] Fallback text** | Display text for text mode | any text |
| **[Tag] Text colour** | Colour for text mode | 6‑digit Hex (e.g. #FF2222) |
| **[Tag] Text shadow** | Stroke or glow intensity | 0=none / 1=stroke / 2=glow |
| **[Tag] Icon individual scale** | Adjust the size of a specific icon independently | 10% ~ 200% |

> **Tip**: If you just want to fine‑tune colours or sizes, the in‑game settings menu is the easiest and safest way – no code files to touch.


## 📝 Part 2: Modifying config.lua (most common player‑friendly method)

`config.lua` is located in the mod root directory and is the most frequently modified configuration file. All changes **require a game restart** to take effect.

### 📍 File Location
```
BFHitEffects/config.lua
```

### 🔧 How to Edit
1. Open the file with **Notepad**, **Notepad++**, or **VSCode**.
2. Find the parameter you want to change (detailed explanations below).
3. Change the value and **save the file**.
4. **Exit the game completely**, then launch it again.

### 🎛️ Configurable Parameters Explained

#### 1. Global Master Switch & Sizes

```lua
Enabled = true               -- true = mod enabled, false = mod disabled
SoundEnabled = true          -- true = sounds enabled, false = muted
TextGlobalScale = 70         -- Global text size (percent)
IconGlobalScale = 70         -- Global icon size (percent)
```

#### 2. Sound Configuration

```lua
SoundHeadshot = { Folder = "headshot", Count = 3 }  -- Headshot sound pool
SoundNormal   = { Folder = "normal",   Count = 1 }  -- Normal kill sound pool
SoundSpecial  = { Folder = "special",  Count = 1 }  -- Special kill sound pool
SoundExplosive= { Folder = "explosive",Count = 1 }  -- Explosive kill sound pool
```

- `Folder`: Sound folder name (located under `ui/assets/sounds/`)
- `Count`: Number of `.webm` files in that folder

> **⚠️ Important**: If you change `Count`, make sure the folder contains the corresponding number of sound files (e.g. `1.webm`, `2.webm`...)

#### 3. Kill Tag Configuration

```lua
Tags = {
    HEADSHOT = {
        Name = "Headshot",          -- Display name shown in the settings menu
        Text = "HEADSHOT",          -- Display text for text mode
        IsImg = true,               -- true = use image, false = use text
        IconScale = 80,             -- Individual scale for this icon (percent)
        Color = "#FF2222",          -- Text colour (Hex format)
        Shadow = 2,                 -- Shadow level: 0=none, 1=stroke, 2=glow
        AspectRatio = "original"    -- Image aspect ratio
    },
    -- ... similar for other tags
}
```

**Supported kill tags:**

| Tag | Description |
|-----|-------------|
| `HEADSHOT` | Headshot kill |
| `NORMAL` | Normal kill |
| `KNIFE` | Knife kill |
| `DEFIB` | Defibrillator kill |
| `MEDKIT` | Medkit kill |
| `REPAIR` | Repair tool kill |
| `EXPLOSIVE` | Explosive kill |
| `ROADKILL` | Roadkill |
| `VEHICLE_DESTRUCTION` | Vehicle destroyed |

**`AspectRatio` valid values:**
- `"16:9"` — widescreen ratio
- `"4:3"` — traditional ratio
- `"original"` — keep the image's original aspect ratio
- `"1.5"` — custom numeric ratio (e.g. `"1.5"` means 1.5:1)

#### 4. Hit Feedback Configuration

```lua
HitFeedback = {
    Enabled = true,                     -- Show hit feedback
    SoundEnabled = true,                -- Play hit sound
    Normal = {
        Color = "#FFFFFF",              -- Normal hit colour
        Size = 15,                      -- Overall size (pixels)
        Thickness = 3,                  -- Line thickness (pixels)
        Alpha = 1.0                     -- Opacity (0~1)
    },
    Headshot = { ... },                 -- Headshot hit config
    Kill = { ... },                     -- Kill hit config
    HeadshotKill = { ... },             -- Headshot kill hit config
    SpecialScale = 1.2,                 -- Overall scale multiplier for headshot/kill
    SpecialThickness = 1.4,             -- Line thickness multiplier for headshot/kill
    FadeInMs = 80,                      -- Fade‑in time (milliseconds)
    FadeOutMs = 100,                    -- Fade‑out time (milliseconds)
    Sound = { Folder = "hit", Count = 1 }
}
```

> **Tip**: `Size` and `Thickness` together determine the hit feedback's visual appearance. `Size` controls the overall size, while `Thickness` controls the line width.

#### 5. Damage Number Configuration

```lua
DamageNumbers = {
    Enabled = true,
    Headshot = {
        Color = "#90F2FF",              -- Headshot damage colour
        Size = 20,                      -- Font size
        Alpha = 1.0                     -- Opacity
    },
    Normal = {
        Color = "#FFFFFF",              -- Normal damage colour
        Size = 20,
        Alpha = 1.0
    },
    FadeInMs = 80,                      -- Fade‑in time (milliseconds)
    FadeOutMs = 100,                    -- Fade‑out time (milliseconds)
    LifetimeMs = 180,                   -- Total lifetime (milliseconds)
}
```

> **Tip**: `LifetimeMs` controls how long the number stays on screen. Smaller values make numbers disappear faster – useful for high‑rate‑of‑fire weapons.


## 📝 Part 3: Modifying Front‑End Files (requires rebuilding .vuic)

If you want to **replace images, sounds, or fonts**, or adjust **animation parameters, hit feedback shape, or damage number position**, you need to modify files in the `ui/` folder and then rebuild the `.vuic` package.

### 🔧 How to Build

The VU team provides an official UI packaging guide – please refer to:

> **[Venice Unleashed Official Docs — Custom UI](https://docs.veniceunleashed.net/modding/custom-ui/)**

In short, you use the VU‑provided `vuic` tool to compile the `ui/` folder into a `.vuic` file, then place it in your mod directory.

### 📍 Files That May Need Modification

| File | Purpose | Difficulty |
|------|---------|------------|
| `ui/config.js` | Asset paths, animation parameters, queue control | ⭐⭐ (moderate) |
| `ui/hithead.js` | Hit feedback shape, number position, advanced parameters | ⭐⭐⭐⭐ (advanced) |
| `ui/hithead.css` | Font replacement | ⭐⭐ (simple) |
| `ui/assets/` | Images, sounds, font files | ⭐ (simple) |

### 🎯 Scenario 1: Replacing Images / Sounds / Fonts (simplest)

**Replacing images**:
1. Prepare a PNG image (transparent background recommended).
2. Place the image in `ui/assets/images/`.
3. Open `ui/config.js`, find the corresponding `imgXXX` entry, and change it to your file name.

**Example**: Replace the headshot icon with your own image
```javascript
// In ui/config.js
imgHeadshot: "./assets/images/my_cool_headshot.png",  // change to your file name
```

**Replacing sounds**:
1. Prepare audio files in `.webm` format (GameFace only supports this format).
2. Place the files in the corresponding sound folder (e.g. `ui/assets/sounds/headshot/`).
3. File names must be numeric (e.g. `1.webm`, `2.webm`...).
4. Open `config.lua` and adjust the corresponding `Count` value to match the actual number of files.

**Replacing fonts**:
1. Prepare a `.ttf` or `.otf` font file.
2. Place the font file in `ui/assets/fonts/`.
3. Open `ui/hithead.css`, modify the `font-family` name and `src` path in the `@font-face` rule.

### 🎯 Scenario 2: Adjusting Animation Parameters (in ui/config.js)

`ui/config.js` controls the "feel" of the effects – pop speed, ripple size, icon count, etc.

```javascript
// In ui/config.js
popInScalePeak: 1.5,                    // Peak scale on pop‑in (1.5 = 150%)
popInDurationMs: 700,                   // Pop‑in animation duration (ms)

rippleEnabled: true,                    // Enable headshot ripple
rippleDurationMs: 800,                  // Ripple spread duration
rippleColor: "rgba(144, 242, 255, 1)",  // Ripple colour (supports RGBA)
rippleBorderWidth: 6,                   // Ripple border thickness

verticalPositionRatio: 0.26,            // Killfeed distance from bottom of screen
maxFeedItems: 6,                        // Maximum simultaneous icons
gapBetweenItems: 8,                     // Gap between icons
lifetimeMs: 3000,                       // Each icon's lifetime (ms)
```

> **Tip**: Keep `maxFeedItems` between 6 and 10 – higher values may affect performance.

### 🎯 Scenario 3: Adjusting Hit Feedback Shape (at the top of ui/hithead.js)

At the top of `hithead.js` there is a dedicated configuration area where all tweakable parameters are grouped together:

```javascript
// At the top of ui/hithead.js (player‑editable config area)

// Hit feedback geometry parameters (control the shape of the X marker)
const HITFEEDBACK_GEOMETRY = {
    GRAIN_LENGTH_RATIO: 0.60,   // Grain length (larger = longer X arms)
    GRAIN_WIDTH_RATIO: 0.12,    // Grain width (larger = thicker lines)
    GAP_RADIUS_RATIO: 0.60,     // Centre gap radius (larger = bigger hollow centre)
    OUTLINE_THICKNESS: 1.0      // Black outline thickness
};

// Damage number position parameters
const DAMAGE_NUMBERS_POSITION = {
    OFFSET_X: -0.06,            // Horizontal offset (negative = left)
    HEADSHOT_OFFSET_Y: -0.02,   // Headshot vertical offset (negative = up)
    NORMAL_OFFSET_Y: 0.01       // Normal vertical offset (positive = down)
};

// Damage number shadow thickness
const DAMAGE_NUMBERS_SHADOW_THICKNESS = 2;  // 0=none, 1=thin, 2=standard, 3=thick

// Damage number stacking queue parameters
const DAMAGE_NUMBERS_QUEUE = {
    SLOT_HEIGHT: 32,            // Vertical slot height per number (pixels)
    MAX_QUEUE_SIZE: 6           // Maximum queue length
};
```

**Tuning suggestions:**
- X too small? Increase `GRAIN_LENGTH_RATIO` (e.g. to 0.70)
- Lines too thin? Increase `GRAIN_WIDTH_RATIO` (e.g. to 0.18)
- Centre gap too small? Increase `GAP_RADIUS_RATIO` (e.g. to 0.70)
- Numbers overlapping? Increase `SLOT_HEIGHT` (e.g. to 36)
- Want more numbers on screen? Increase `MAX_QUEUE_SIZE` (e.g. to 8)


## 📂 Part 4: Asset Folder Explanation

There are two `assets` folders in the mod, with different purposes – please note the distinction:

| Folder | Location | Purpose |
|--------|----------|---------|
| `BFHitEffects/assets/` | Mod root directory | **Source asset folder**: stores raw materials (images, sounds, fonts) for you to organise and collect; *not* used directly by the game |
| `BFHitEffects/ui/assets/` | Inside `ui/` | **Packaged asset folder**: these materials are bundled into the `.vuic` file during packaging; the game reads from here at runtime |

**Workflow**:
1. Place collected materials in `assets/` (source assets) for organisation.
2. When you decide to use a particular asset, **copy** it to the corresponding subfolder under `ui/assets/`.
3. Update the path or file name in `ui/config.js` or `config.lua`.
4. Rebuild the `.vuic` package – the asset will then be active.

**Why two separate folders?**
- `assets/` (source assets) is never read by the game – you can keep different versions of icons or sounds here for comparison.
- `ui/assets/` (packaged assets) – only content placed here will be bundled into the UI file by the `vuic` tool.


## ❓ Frequently Asked Questions (FAQ)

### Q1: My changes aren't taking effect.

**A**: Please make sure:
1. You **saved the file** after editing.
2. You **completely exited the game** and relaunched it (changes to `config.lua` require a game restart).
3. If you modified front‑end files (under `ui/`), you need to **rebuild the `.vuic`** and replace the file in your mod directory.
4. If you modified `config.lua`, check for any stray commas or brackets (Lua syntax errors can cause the config to fail loading).

### Q2: The colour turned white.

**A**: Check that your colour value starts with `#`, e.g. `#FF0000` for red. Missing the `#` will cause parsing to fail and fall back to white.

### Q3: How do I turn off certain effects?

**A**:
- Set the corresponding `Enabled` flag to `false` in `config.lua`.
- Or turn them off via the in‑game settings menu.

### Q4: How do I move the hit feedback position?

**A**: Hit feedback is fixed at the exact centre of the screen and cannot be moved. However, you can adjust `GAP_RADIUS_RATIO` to control the size of the hollow centre gap.

### Q5: What format should sound files be in?

**A**: The GameFace engine only supports `.webm` audio files. You can use FFmpeg to convert other formats to `.webm`:
```bash
ffmpeg -i input.ogg -c:a libvorbis -b:a 128k -f webm output.webm
```

### Q6: Damage numbers are overlapping.

**A**: Find the `DAMAGE_NUMBERS_QUEUE.SLOT_HEIGHT` parameter in the config area at the top of `hithead.js` and increase the value (e.g. 32 → 40). This increases the spacing between numbers and prevents overlap.

### Q7: When the queue is full, do new numbers replace old ones?

**A**: Yes. When the queue reaches its maximum length (6 by default), a new number replaces the oldest one. The old number fades out quickly before being removed.


## 📦 Quick Reference: Modification Summary

| What to change | Where to change | Action required |
|----------------|-----------------|-----------------|
| Colours, sizes, sound counts, switches | `config.lua` | Restart game |
| Image paths, animation parameters, queue sizes | `ui/config.js` | Rebuild `.vuic` |
| Hit feedback shape, number position, shadow thickness | `ui/hithead.js` top config area | Rebuild `.vuic` |
| Font replacement | `ui/hithead.css` | Rebuild `.vuic` |
| Images, sounds, font files | `ui/assets/` | Rebuild `.vuic` |


## 🙏 Acknowledgements

During development, this mod drew inspiration and experience from the following community resources:

- Venice Unleashed official documentation
- Darkness mod UI development experience
- Fortnite-hit-effects mod architecture
- Extensive feedback and suggestions from community players


**Happy Gaming! 🎮**

If you have any questions or suggestions, feel free to reach out on the community forums or open an issue on GitHub.
