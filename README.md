好的，这是一份完整的 README.md 文档，面向社区玩家，详细说明了模组的框架、功能和修改方法。

---

# BFHitEffects 模组 — 战地3 击杀特效与命中反馈增强

> 适用于 Venice Unleashed v20939 及以上版本

## 📖 项目简介

**BFHitEffects** 是一款为《战地3》Venice Unleashed 私服打造的击杀特效与命中反馈增强模组。它替换了游戏中单调的击杀提示，为你带来：

- **丰富的击杀特效**：爆头、刀杀、爆炸击杀等 9 种击杀类型，各自拥有独立的图标和颜色
- **动态爆头水波纹**：爆头时屏幕中心扩散出绚丽的彩色波纹
- **战地4风格命中反馈**：命中敌人时，准星处出现四段式"米粒"X 标记
- **伤害数字显示**：像战地6一样，在准心左侧实时显示你造成的伤害数值
- **击杀与命中音效**：每种击杀类型都有独立的音效池，增强打击感
- **高度自定义**：几乎所有视觉参数都可以通过游戏内菜单或配置文件调整，无需重新编译

无论你是只想调整一下颜色的普通玩家，还是希望深度定制 UI 的模组开发者，这份指南都能帮助你快速上手。


## 📁 目录结构

模组安装完成后的文件结构如下：

```
BFHitEffects/
├── __init__.lua              # 客户端逻辑（一般不需要修改）
├── config.lua                # ⭐ 玩家配置文件（大部分调整都在这里）
├── ext/                      # VeniceEXT 扩展（模组核心逻辑）
│   └── __init__.lua          # 服务端逻辑（一般不需要修改）
├── ui/                       # UI 资源目录（合成 .vuic 后使用）
│   ├── assets/               # 已打包的资源文件（合成 .vuic 时自动包含）
│   │   ├── fonts/            # 字体文件 (.ttf/.otf)
│   │   ├── images/           # 击杀图标 (.png)
│   │   └── sounds/           # 音效文件 (.webm)
│   │       ├── headshot/     # 爆头音效
│   │       ├── normal/       # 普通击杀音效
│   │       ├── special/      # 特殊击杀音效（刀杀/除颤等）
│   │       ├── explosive/    # 爆炸击杀音效
│   │       └── hit/          # 命中反馈音效
│   ├── config.js             # ⭐⭐ 进阶配置文件（资源路径与动画参数）
│   ├── hithead.js            # ⭐⭐⭐ 核心渲染引擎（高级玩家可调）
│   ├── hithead.css           # UI 样式表（一般不需要修改）
│   └── index.html            # UI 入口页面
├── assets/                   # 预备素材文件夹（未打包的原始素材）
│   ├── images/               # 图标素材（复制到 ui/assets/images/ 后生效）
└── mod.json                  # 模组元数据
```


## ⚙️ 第一部分：游戏内设置菜单（最简单，零门槛）

进入游戏后，按 **ESC** 打开菜单，依次点击：

```
设置 → 模组 → BFHitEffects
```

你会看到以下选项，所有修改**实时生效**，无需重启游戏：

| 设置项 | 作用 | 取值范围 |
|--------|------|----------|
| **启用击杀特效** | 模组总开关 | 开启/关闭 |
| **启用击杀音效** | 所有音效的总开关 | 开启/关闭 |
| **文字统一大小** | 所有文字类图标的全局大小 | 10% ~ 200% |
| **图标统一大小** | 所有图片类图标的全局大小 | 10% ~ 200% |
| **[标签] 使用图标** | 单独切换某个击杀类型使用图片或文字 | 开启/关闭 |
| **[标签] 备用文字** | 文字模式下的显示内容 | 任意文本 |
| **[标签] 文字颜色** | 文字模式下的颜色 | 6位Hex色码（如 #FF2222） |
| **[标签] 文字阴影** | 文字描边或发光强度 | 0=无 / 1=描边 / 2=发光 |
| **[标签] 图标独立大小** | 单独调整某个图标的大小 | 10% ~ 200% |

> **小贴士**：如果你只想微调颜色或大小，优先使用游戏内菜单。这是最简单、最安全的方式，不需要接触任何代码文件。


## 📝 第二部分：在 config.lua 中修改（玩家最常用的修改方式）

`config.lua` 位于模组根目录下，是玩家最常修改的配置文件。所有修改保存后**需要重进游戏**才能生效。

### 📍 文件位置
```
BFHitEffects/config.lua
```

### 🔧 如何修改
1. 使用**记事本**、**Notepad++** 或 **VSCode** 打开该文件。
2. 找到你要修改的参数（下面有详细说明）。
3. 修改数值，**保存文件**。
4. **完全退出游戏**，然后重新进入。

### 🎛️ 可修改参数详解

#### 1. 全局开关与尺寸

```lua
Enabled = true               -- true=开启模组，false=关闭
SoundEnabled = true          -- true=开启音效，false=静音
TextGlobalScale = 70         -- 文字统一大小（百分比）
IconGlobalScale = 70         -- 图标统一大小（百分比）
```

#### 2. 音效配置

```lua
SoundHeadshot = { Folder = "headshot", Count = 3 }  -- 爆头音效池
SoundNormal   = { Folder = "normal",   Count = 1 }  -- 普通击杀音效池
SoundSpecial  = { Folder = "special",  Count = 1 }  -- 特殊击杀音效池
SoundExplosive= { Folder = "explosive",Count = 1 }  -- 爆炸击杀音效池
```

- `Folder`：音效文件夹名称（位于 `ui/assets/sounds/` 下）
- `Count`：该文件夹中的 `.webm` 文件数量

> **⚠️ 重要**：如果修改了 `Count`，请确保文件夹中有对应数量的音效文件（如 `1.webm`、`2.webm`...）

#### 3. 击杀标签配置

```lua
Tags = {
    HEADSHOT = {
        Name = "爆头",              -- 在设置菜单中显示的名称
        Text = "HEADSHOT",          -- 文字模式下的显示内容
        IsImg = true,               -- true=使用图片，false=使用文字
        IconScale = 80,             -- 该图标的独立缩放（百分比）
        Color = "#FF2222",          -- 文字颜色（Hex格式）
        Shadow = 2,                 -- 阴影等级：0=无，1=描边，2=发光
        AspectRatio = "original"    -- 图片宽高比
    },
    -- ... 其他标签类似
}
```

**支持的击杀标签：**

| 标签 | 说明 |
|------|------|
| `HEADSHOT` | 爆头击杀 |
| `NORMAL` | 普通击杀 |
| `KNIFE` | 刀杀 |
| `DEFIB` | 除颤器击杀 |
| `MEDKIT` | 医疗箱击杀 |
| `REPAIR` | 维修工具击杀 |
| `EXPLOSIVE` | 爆炸击杀 |
| `ROADKILL` | 载具碾压 |
| `VEHICLE_DESTRUCTION` | 毁灭载具 |

**`AspectRatio` 可选值：**
- `"16:9"` — 宽屏比例
- `"4:3"` — 传统比例
- `"original"` — 保持图片原始比例
- `"1.5"` — 自定义数字比例（如 `"1.5"` 表示宽高比为 1.5:1）

#### 4. 命中反馈配置

```lua
HitFeedback = {
    Enabled = true,                     -- 是否显示命中反馈
    SoundEnabled = true,                -- 是否播放命中音效
    Normal = {
        Color = "#FFFFFF",              -- 普通命中颜色
        Size = 15,                      -- 整体大小（像素）
        Thickness = 3,                  -- 线条粗细（像素）
        Alpha = 1.0                     -- 不透明度（0~1）
    },
    Headshot = { ... },                 -- 爆头命中配置
    Kill = { ... },                     -- 击杀命中配置
    HeadshotKill = { ... },             -- 爆头击杀命中配置
    SpecialScale = 1.2,                 -- 爆头/击杀时整体放大倍率
    SpecialThickness = 1.4,             -- 爆头/击杀时线条加粗倍率
    FadeInMs = 80,                      -- 淡入时间（毫秒）
    FadeOutMs = 100,                    -- 淡出时间（毫秒）
    Sound = { Folder = "hit", Count = 1 }
}
```

> **小提示**：`Size` 和 `Thickness` 共同决定了命中反馈的视觉效果。`Size` 控制整体大小，`Thickness` 控制线条粗细。

#### 5. 伤害数字配置

```lua
DamageNumbers = {
    Enabled = true,
    Headshot = {
        Color = "#90F2FF",              -- 头部伤害颜色
        Size = 20,                      -- 字体大小
        Alpha = 1.0                     -- 不透明度
    },
    Normal = {
        Color = "#FFFFFF",              -- 普通伤害颜色
        Size = 20,
        Alpha = 1.0
    },
    FadeInMs = 80,                      -- 淡入时间（毫秒）
    FadeOutMs = 100,                    -- 淡出时间（毫秒）
    LifetimeMs = 180,                   -- 总存活时间（毫秒）
}
```

> **小提示**：`LifetimeMs` 控制数字在屏幕上停留的总时间。数值越小，数字消失得越快，适合高射速武器场景。


## 📝 第三部分：在前端文件中修改（需要重新打包 .vuic）

如果你想**替换图片、音效、字体**，或调整**动画参数、命中反馈形状、伤害数字位置**，就需要修改 `ui/` 文件夹下的文件，然后重新打包成 `.vuic`。

### 🔧 打包方法

VU 官方提供了详细的 UI 打包教程，请参考：

> **[Venice Unleashed 官方文档 — 自定义 UI](https://docs.veniceunleashed.net/modding/custom-ui/)**

简单来说，你需要使用 VU 提供的 `vuic` 工具将 `ui/` 文件夹编译成一个 `.vuic` 文件，然后放到模组目录中。

### 📍 需要修改的文件

| 文件 | 用途 | 修改难度 |
|------|------|----------|
| `ui/config.js` | 资源路径、动画参数、队列控制 | ⭐⭐（中等） |
| `ui/hithead.js` | 命中反馈形状、数字位置、高级参数 | ⭐⭐⭐⭐（进阶） |
| `ui/hithead.css` | 字体替换 | ⭐⭐（简单） |
| `ui/assets/` | 图片、音效、字体文件 | ⭐（简单） |

### 🎯 场景一：替换图片/音效/字体（最简单）

**替换图片**：
1. 准备一张 PNG 格式的图片（建议透明背景）。
2. 将图片放入 `ui/assets/images/` 目录。
3. 打开 `ui/config.js`，找到对应的 `imgXXX` 配置项，修改为你的文件名。

**示例**：将爆头图标换成你自己的图片
```javascript
// 在 ui/config.js 中
imgHeadshot: "./assets/images/my_cool_headshot.png",  // 改成你的文件名
```

**替换音效**：
1. 准备 `.webm` 格式的音频文件（GameFace 仅支持此格式）。
2. 将文件放入对应的音效文件夹（如 `ui/assets/sounds/headshot/`）。
3. 文件名必须为数字格式（如 `1.webm`、`2.webm`...）。
4. 打开 `config.lua`，修改对应的 `Count` 值，确保与实际文件数量一致。

**替换字体**：
1. 准备 `.ttf` 或 `.otf` 格式的字体文件。
2. 将字体放入 `ui/assets/fonts/` 目录。
3. 打开 `ui/hithead.css`，修改 `@font-face` 中的 `font-family` 名称和 `src` 路径。

### 🎯 场景二：调整动画参数（在 ui/config.js 中修改）

`ui/config.js` 控制着特效的"手感"——弹出速度、水波纹大小、图标数量等。

```javascript
// 在 ui/config.js 中
popInScalePeak: 1.5,                    // 图标弹出时的放大峰值（1.5=150%）
popInDurationMs: 700,                   // 弹出动画持续时间（毫秒）

rippleEnabled: true,                    // 是否启用爆头水波纹
rippleDurationMs: 800,                  // 水波纹扩散持续时间
rippleColor: "rgba(144, 242, 255, 1)",  // 水波纹颜色（支持RGBA）
rippleBorderWidth: 6,                   // 水波纹边框粗细

verticalPositionRatio: 0.26,            // 击杀列表距离屏幕底部的比例
maxFeedItems: 6,                        // 同时显示的最大图标数量
gapBetweenItems: 8,                     // 图标之间的间距
lifetimeMs: 3000,                       // 每个图标的存活时间（毫秒）
```

> **小提示**：`maxFeedItems` 建议保持在 6-10 之间，过高可能影响性能。

### 🎯 场景三：调整命中反馈形状（在 ui/hithead.js 顶部修改）

`hithead.js` 顶部有一个专门的配置区，所有可调参数都集中在一起：

```javascript
// 在 ui/hithead.js 顶部（玩家可修改配置区）

// 命中反馈几何参数（控制 X 标记的形状）
const HITFEEDBACK_GEOMETRY = {
    GRAIN_LENGTH_RATIO: 0.60,   // 米粒长度（值越大，X 的臂越长）
    GRAIN_WIDTH_RATIO: 0.12,    // 米粒宽度（值越大，线条越粗）
    GAP_RADIUS_RATIO: 0.60,     // 中心间隙半径（值越大，中间空隙越大）
    OUTLINE_THICKNESS: 1.0      // 黑色描边粗细
};

// 伤害数字位置参数
const DAMAGE_NUMBERS_POSITION = {
    OFFSET_X: -0.06,            // 水平偏移（负值向左）
    HEADSHOT_OFFSET_Y: -0.02,   // 爆头数字垂直偏移（负值向上）
    NORMAL_OFFSET_Y: 0.01       // 普通数字垂直偏移（正值向下）
};

// 伤害数字描边粗细
const DAMAGE_NUMBERS_SHADOW_THICKNESS = 2;  // 0=无，1=细，2=标准，3=粗

// 伤害数字堆叠队列参数
const DAMAGE_NUMBERS_QUEUE = {
    SLOT_HEIGHT: 32,            // 每个数字的垂直槽位高度（像素）
    MAX_QUEUE_SIZE: 6           // 最大队列长度
};
```

**调整建议：**
- 觉得 X 太小？增加 `GRAIN_LENGTH_RATIO`（如 0.70）
- 觉得线条太细？增加 `GRAIN_WIDTH_RATIO`（如 0.18）
- 觉得中间空隙不够大？增加 `GAP_RADIUS_RATIO`（如 0.70）
- 数字重叠？增加 `SLOT_HEIGHT`（如 36）
- 想显示更多数字？增加 `MAX_QUEUE_SIZE`（如 8）


## 📂 第四部分：素材文件夹说明

模组中有两个 `assets` 文件夹，它们的用途不同，请注意区分：

| 文件夹 | 位置 | 用途 |
|--------|------|------|
| `BFHitEffects/assets/` | 模组根目录下 | **预备素材文件夹**：存放原始素材（图片、音效、字体），方便你收集和整理素材，不会直接用于游戏 |
| `BFHitEffects/ui/assets/` | `ui/` 文件夹下 | **已打包素材文件夹**：这些素材会在合成 `.vuic` 时被打包进 UI 文件中，游戏运行时读取的是这里的内容 |

**工作流程**：
1. 你把收集到的素材放到 `assets/`（预备素材）里整理。
2. 当你决定使用某个素材时，把它**复制**到 `ui/assets/` 对应的子文件夹中。
3. 修改 `ui/config.js` 或 `config.lua` 中的路径或文件名。
4. 重新打包 `.vuic`，素材就会生效。

**为什么要分两个文件夹？**
- `assets/`（预备素材）不会被游戏读取，你可以在这里存放不同版本的图标、音效，方便对比和选择。
- `ui/assets/`（已打包素材）只有放在这里的内容才会被 `vuic` 工具打包进 UI 文件。


## ❓ 常见问题（FAQ）

### Q1：修改配置后没有生效？

**A**：请确保：
1. 修改后已**保存文件**。
2. **完全退出游戏**后重新进入（`config.lua` 的修改需要重进游戏才能生效）。
3. 如果修改的是前端文件（`ui/` 下的文件），需要**重新打包 `.vuic`** 并替换模组中的文件。
4. 如果修改的是 `config.lua`，检查是否有多余的逗号或括号（Lua 语法错误会导致配置加载失败）。

### Q2：颜色变成白色了？

**A**：检查你输入的颜色值是否以 `#` 开头，例如 `#FF0000` 代表红色。缺少 `#` 会导致解析失败，回退为白色。

### Q3：如何关闭某些特效？

**A**：
- 在 `config.lua` 中将对应的 `Enabled` 设为 `false`。
- 或者在游戏内设置菜单中关闭。

### Q4：如何调整命中反馈的位置？

**A**：命中反馈固定在屏幕正中心，无法移动。但你可以调整 `GAP_RADIUS_RATIO` 来控制中心空隙的大小。

### Q5：音效文件应该用什么格式？

**A**：GameFace 引擎仅支持 `.webm` 格式的音频文件。你可以使用 FFmpeg 将其他格式转换为 `.webm`：
```bash
ffmpeg -i input.ogg -c:a libvorbis -b:a 128k -f webm output.webm
```

### Q6：伤害数字重叠了怎么办？

**A**：在 `hithead.js` 顶部的配置区找到 `DAMAGE_NUMBERS_QUEUE.SLOT_HEIGHT`，将数值调大（如 32 → 40），数字之间的间距会增大，避免重叠。

### Q7：队列满了之后新数字会替换旧数字吗？

**A**：是的。当队列达到最大长度（默认 6 个）时，新数字会替换最旧的那个数字，旧数字会快速淡出后消失。


## 📦 修改清单快速参考

| 修改内容 | 修改位置 | 修改后需要 |
|----------|----------|------------|
| 颜色、大小、音效数量、开关 | `config.lua` | 重进游戏 |
| 图片路径、动画参数、队列数量 | `ui/config.js` | 重新打包 `.vuic` |
| 命中反馈形状、数字位置、描边粗细 | `ui/hithead.js` 顶部配置区 | 重新打包 `.vuic` |
| 字体替换 | `ui/hithead.css` | 重新打包 `.vuic` |
| 图片、音效、字体文件 | `ui/assets/` | 重新打包 `.vuic` |


## 🙏 致谢

本模组的开发过程中，参考了以下社区资源和经验：

- Venice Unleashed 官方文档
- Darkness 模组 UI 开发经验
- Fortnite-hit-effects 模组架构
- 社区玩家的大量反馈与建议


**Happy Gaming! 🎮**

如有任何问题或建议，欢迎在社区或 GitHub Issues 中提出。