# Rin 项目开发工作总结（用于展示 PPT）

## 0. 分析范围与结论先行

- 当前分析分支：`codex-live2d-full-body-fit`
- 基线提交：`1f95ca69ea0260d9ac3ab50f92018952bbf6c50b`
- 基线提交信息：`chore: save baseline before splitting feature branches`
- 最终提交：`207598ddc348fbce36da7bfb7b13d1978ee3419e`
- 最终提交信息：`feat: add LocalPrivacyCard component and integrate it into onboarding step demo guide`
- 基线到最终提交之间：`64` 个提交
- 基线到最终提交差异规模：`201 files changed, 84,669 insertions, 1,041 deletions`
- 最后冲刺阶段对比范围：`40dd8794^..207598dd`，共 `15` 个提交
- 最后冲刺阶段差异规模：`102 files changed, 8,180 insertions, 1,410 deletions`
- 本次落稿时工作区状态：已清洁，无未提交 diff，因此“当前状态”按 `207598dd` 的已提交状态描述

本次总结采用用户明确指定的基线 `1f95ca69`。这个提交本身只改动了分析文档，但提交信息已经表明它是“拆分功能分支前的基线保存点”，因此适合作为“刚 fork 后、尚未进入本轮 Rin 功能开发前”的实际对照基线。

一句话结论：

我们把一个以 AIRI 为名、以通用桌宠和 AI 对话框架为主的 Electron 桌宠工程，二次开发成了面向 HCI 课程展示的 `Rin`，重点落在四条主线：

- 桌面宠物交互从“能显示”进化到“更适合长期悬浮、低打扰、可控、可演示”
- 新增了完整的学习陪伴系统，包括任务、专注计时、统计分析、报告导出和提醒
- 新增了本地优先的视觉交互实验链路，包括运行时复用、视觉自检、人脸门控、录入向导和解释卡片
- 把首次启动、隐私说明、反馈文案、品牌命名和发布预检收束成了更适合答辩展示的产品形态

---

## 1. 项目基线：刚 fork 时的能力

### 1.1 原始项目定位

基线时项目仍然是 `Project AIRI` 语境下的桌宠应用，底层已经具备较强的 Electron 桌面容器、窗口管理、托盘、Live2D 舞台、设置页、插件/服务框架等工程基础，但产品叙事仍偏向“通用 AIRI 桌宠/聊天框架”，并不是一套围绕学习陪伴与本地视觉互动展开的课程展示产品。

### 1.2 基线时已有基础能力

从代码和提交基线看，基线状态已经具备以下能力：

- Electron 多窗口和主进程服务框架
- 主舞台窗口、设置窗口、托盘、关于页等基础桌面应用结构
- Live2D 桌宠显示能力
- 基础 Controls Island 控件区
- 基础拖动窗口、置顶、主题等桌宠通用操作
- 既有 AIRI provider/auth/model onboarding 流程
- i18n、多语言基础设施
- Godot sidecar 与打包配置骨架

关键基线落点：

- [onboarding.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/onboarding.vue)
- [onboarding.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/scenarios/dialogs/onboarding/onboarding.vue)
- [controls-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue)
- [tray/index.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/index.ts)
- [electron-builder.config.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/electron-builder.config.ts)

### 1.3 基线时的局限

相对于 Rin 最终状态，基线主要存在这些不足：

- 品牌仍是 AIRI，用户看到的产品形象不统一
- 首次启动仍围绕 provider/auth/model 配置，不适合课堂 5 到 7 分钟稳定演示
- Controls Island 以通用工具为主，信息架构不够适合“学习 + 视觉 + 桌面交互”叙事
- 缺少学习陪伴系统，无法展示任务管理、专注计时、趋势分析、报告导出
- 缺少本地视觉交互链路，无法展示本地摄像头、自检、解释、录入和门控
- 缺少一套围绕低打扰桌面交互的系统性优化，例如靠近淡出、click-through 保护、快捷键体系、托盘快捷入口等
- 打包发布命名仍以 AIRI 为主，课程展示的产品包装不完整

### 1.4 用于课程展示时的先天短板

- 演示路径不够聚焦，容易陷入“先配模型/先登录”的流程成本
- 缺少 HCI 价值明显的用户任务闭环
- 缺少本地隐私与可信设计的可见呈现
- 缺少可以量化展示的统计、图表和导出成果

---

## 2. 当前最终状态：Rin 的产品形态

### 2.1 一句话定位

`Rin` 是基于 AIRI 桌宠框架二次开发的桌面学习陪伴助手，强调 `学习陪伴 + 本地视觉互动 + 低打扰桌面存在感`。

### 2.2 产品形态概括

当前分支最终状态已经形成了比较完整的演示型产品结构：

- 对外统一展示为 `Rin`
- 主舞台支持 Live2D 上半身 / 全身 / 自动适配显示
- 具备桌面拖拽、缩放、Move Mode、淡出、click-through 保护等低打扰交互
- 具备独立的 Study 面板和 Vision 面板
- 学习模块具备任务、番茄钟、提醒、趋势图、热力图、导出报告
- 视觉模块具备本地运行时、摄像头控制、人脸录入、本地加密档案、本地门控、自检、解释卡片和反馈历史
- 首次启动变成 `Rin Demo Guide`，服务于答辩和课程展示
- 加入 `LocalPrivacyCard`，在 onboarding、vision enrollment、vision island 中统一说明隐私边界
- 打包与预检开始收口到 Rin 命名和演示发布流程

### 2.3 当前核心模块

- 桌面宠物与低打扰交互
- 学习陪伴系统 Study Companion
- 视觉交互与本地人脸门控
- 反馈系统、文案与可解释性
- 首次启动引导与隐私说明
- 品牌统一与发布预检

### 2.4 可演示路径

当前版本已经具备一条相对完整、稳定、可讲述的演示路径：

1. 启动 Rin，展示桌面角色和状态栏菜单
2. 演示拖拽、缩放、Move Mode、靠近淡出、click-through 保护
3. 打开 Study 面板，展示任务、专注、统计和报告导出
4. 打开 Vision 面板，展示本地摄像头、录入、自检、解释卡片和反馈历史
5. 展示隐私说明和本地优先处理边界
6. 展示快捷键和 tray 快捷操作

---

## 3. 总体改造概览

| 模块 | 基线状态 | 我们做的工作 | 当前效果 | 展示价值 |
| --- | --- | --- | --- | --- |
| 品牌与定位 | AIRI 作为主展示名 | 把用户可见品牌统一为 Rin，同时保留内部 `@proj-airi` 和兼容命名 | 对外形成独立产品叙事 | 便于课程答辩把“二次开发”讲成“产品重构” |
| 首次启动 | provider/auth/model 配置引导 | 改成 4 步 Rin Demo Guide，并带 Study/Vision/Shortcut/Settings 入口 | 首次启动即进入演示导向 | 极大降低答辩演示准备成本 |
| Live2D 桌面交互 | 有基础桌宠和简单控制区 | 做了 fit 模式、Move Mode、快捷键、tray 快捷入口、淡出与 click-through 保护 | 形成低打扰桌面助手体验 | 可以现场直观看到 HCI 改进 |
| 学习陪伴 | 基线无该模块 | 新增任务、专注、统计、图表、导出、提醒 | 形成完整学习闭环 | 课程展示中最稳定、最容易量化 |
| 视觉互动 | 基线无该模块 | 新增本地运行时、录入、本地加密档案、人脸门控、自检和解释卡片 | 形成可解释的本地视觉互动实验 | HCI、隐私、可信设计价值明显 |
| 反馈系统 | 缺少本地视觉反馈模板层 | 建立 deterministic feedback template engine + history + dedupe + bubble 渲染 | 文案更自然、反馈更克制、状态可追溯 | 有利于讲“不是黑箱 AI，而是可控反馈系统” |
| 隐私设计 | 没有统一可复用隐私卡片 | 新增 `LocalPrivacyCard` 并复用到 Vision/Onboarding/Enrollment | 隐私边界可见、可复述 | 适合讲 HCI 伦理与可信设计 |
| 打包与预检 | AIRI 命名和原始打包配置 | 收口 productName、artifactName、macOS 权限文案，补 preflight 和 Godot 修复 | 更接近可展示发布物 | 能说明工程落地不止于前端界面 |
| 测试与质量 | 有原始测试基础 | 为学习、视觉、Controls、图表、preflight 增补大量测试 | 回归风险更可控 | 能证明这是工程化实现，不是临时 demo |

---

## 4. 模块一：桌面宠物与低打扰交互

### 4.1 开发动机

课程展示里的桌宠不是一次性打开后截图，而是需要真实悬浮在桌面上与用户共存。原始桌宠能力“能显示”还不够，必须解决三个问题：

- 不要挡住用户的网页、PDF、文档
- 用户要能快速移动、缩放、恢复布局
- 控件和 click-through 不能互相干扰，尤其在现场演示时要稳定

### 4.2 原项目不足

基线时已经有 Controls Island 和基础拖动能力，但还不够适合长期桌面陪伴：

- Controls Island 结构更接近通用功能面板，不够聚焦
- 拖动和交互入口较少，演示效率不高
- 缺少完整的快捷键体系
- 缺少围绕 click-through、淡出、保护区域的系统设计
- tray 仍偏向原始 AIRI 桌宠操作，而非 Rin 场景化入口

### 4.3 实现内容

#### 4.3.1 Live2D 展示适配优化

新增了 `auto / full-body / upper-body` 三种展示偏好，并把角色适配计算抽到专门的布局工具中。

关键落点：

- [live2d-fit-layout.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui-live2d/src/utils/live2d-fit-layout.ts)
- [Model.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue)

技术点：

- `fitPreference` 支持 `auto / full-body / upper-body`
- `full-body-safe` 与 `legacy-bottom` 两类垂直锚点策略
- 在不同窗口高度下自动平衡“看到更多下半身”和“保证脸部可见”之间的取舍

用户价值：

- 角色能更像“桌面陪伴者”而不是固定裁切的贴图
- 不同屏幕尺寸和演示布局下更容易调到合适状态

演示价值：

- 可以直接切换 `auto / full-body / upper-body` 讲“桌宠展示适配优化”

#### 4.3.2 Move Mode、拖拽与缩放

我们把“调整 Rin 位置和大小”做成了一套完整链路，而不是单一按钮。

关键落点：

- [stage-move-overlay.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-move-overlay.vue)
- [controls-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue)
- [use-stage-keyboard-shortcuts.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-stage-keyboard-shortcuts.ts)

实现内容：

- 新增 Move Mode，允许在角色附近透明区域拖动
- 保留窗口拖拽和窗口控制入口
- 增加 Rin 显示缩放快捷操作：放大、缩小、重置
- Controls Island 中把窗口控制作为单独分组收束

用户体验提升：

- 减少“找不到拖动点”的问题
- 调整摆放效率更高
- 更适合现场答辩快速调整窗口位置

#### 4.3.3 靠近淡出与 click-through 保护

这是本轮最典型的 HCI 工程优化之一。

关键落点：

- [window-click-through-policy.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/window-click-through-policy.ts)
- [click-through-protected-elements.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/click-through-protected-elements.ts)
- [live2d-hit-area.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/live2d-hit-area.ts)
- [desktop-interaction-improvements.md](/Users/lifulin/Downloads/Rin/docs/desktop-interaction-improvements.md)

实现内容：

- 角色靠近鼠标时淡出，离开后恢复
- 淡出时刷新 click-through 状态，减少遮挡背后内容
- 增加 `protected-control / study-panel-hover / vision-panel-hover / shortcut-guide-hover / live2d-faded-pass-through` 等判定原因
- Controls Anchor、Emergency Anchor、浮动面板、输入框、拖拽/缩放热点均加入保护列表

用户价值：

- Rin 在桌面上长期存在时更不打扰
- 用户不会因为穿透错误而点不到按钮
- “可见但不碍事”的陪伴体验更成立

演示方式：

- 把 Rin 放在网页或 PDF 上方
- 演示靠近后淡出、离开后恢复
- 演示按钮仍然可点、背后内容仍可操作

#### 4.3.4 快捷键与状态栏菜单增强

关键落点：

- [keyboard-shortcuts.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/keyboard-shortcuts.ts)
- [use-stage-keyboard-shortcuts.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-stage-keyboard-shortcuts.ts)
- [tray/index.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/index.ts)
- [tray-menu.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/tray-menu.ts)

新增快捷键能力：

- `Cmd/Ctrl+Shift++` 放大 Rin
- `Cmd/Ctrl+Shift+-` 缩小 Rin
- `Cmd/Ctrl+Shift+0` 重置 Rin 缩放
- `Cmd/Ctrl+Shift+M` 切换 Move Mode
- `Cmd/Ctrl+Shift+T` 打开/关闭 Study
- `Cmd/Ctrl+Shift+V` 打开/关闭 Vision
- `Cmd/Ctrl+Shift+K` 打开/关闭 Shortcut Guide
- `Escape` 按优先级关闭 move mode / shortcut guide / vision / study / controls

Tray 对比：

- 基线 tray 主要是窗口显示、尺寸、对齐、设置、about、widgets、caption 等通用功能
- 当前 tray 增加了 Rin 场景化入口：显示/隐藏 Rin、always on top、move mode、study、vision、shortcut guide、fit preference、缩放控制等
- tooltip 从 `Project AIRI` 改为 `Rin`

### 4.4 关键代码落点

- [controls-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue)
- [stage-move-overlay.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-move-overlay.vue)
- [window-click-through-policy.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/window-click-through-policy.ts)
- [live2d-fit-layout.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui-live2d/src/utils/live2d-fit-layout.ts)
- [tray/index.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/index.ts)
- [desktop-interaction-improvements.md](/Users/lifulin/Downloads/Rin/docs/desktop-interaction-improvements.md)

### 4.5 HCI 原则对应

- Recognition rather than recall
  - 可见的 Controls 按钮、快捷键指南、tray 快捷入口
- Flexibility and efficiency of use
  - 快捷键、Move Mode、tray 操作、fit 偏好切换
- Aesthetic and minimalist design
  - Controls 回归轻量入口，长内容移到独立浮动面板
- Help users recognize, diagnose, recover from errors
  - click-through 保护和理由诊断，减少“为什么点不到”

### 4.6 测试保障

代表性测试：

- [window-click-through-policy.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/window-click-through-policy.test.ts)
- [click-through-protected-elements.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/click-through-protected-elements.test.ts)
- [live2d-hit-area.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/live2d-hit-area.test.ts)
- [tray-menu.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/tray-menu.test.ts)
- Controls Island 目录下共 `7` 个测试文件

### 4.7 风险与限制

- 桌面拖拽、窗口行为仍受 Electron 和平台窗口系统差异影响
- 靠近淡出与点击穿透是经验性策略，不同分辨率和系统环境下仍需真机确认
- Linux/macOS/Windows 的窗口交互一致性需继续人工验证

---

## 5. 模块二：学习陪伴系统 Study Companion

### 5.1 开发动机

课程展示不能只停留在“桌宠会动”，还需要一条能体现用户任务闭环、可量化成果和长期价值的主线。学习陪伴系统承担了这个角色。

### 5.2 原项目不足

基线时并没有 `Study Companion` 模块，也没有面向学习场景的任务、计时、统计与导出能力。这意味着：

- 无法展示“陪伴你完成任务”的产品价值
- 无法给出可视化成果
- 无法讲“学习数据如何帮助反思与复盘”

### 5.3 用户痛点 → 解决方案 → 实现方式 → 演示方式

#### 痛点 1：任务分散，难以把桌宠和学习行为绑定起来

解决方案：

- 在桌宠内加入任务管理与当前专注任务绑定

实现方式：

- 新增 `study-companion` store，管理任务、优先级、截止日期、当前专注任务、事件日志与统计快照

关键落点：

- [study-companion.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts)
- [study-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue)
- [TaskList.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.vue)

事实能力：

- 任务优先级：`high / medium / low`
- 截止日期：`YYYY-MM-DD`
- 排序模式：`smart / createdAt / priority / dueDate`
- 当前专注任务：`selectedFocusTaskId`

演示方式：

- 现场创建一个高优先级任务
- 绑定为当前专注任务
- 展示任务列表随优先级、截止日期排序

#### 痛点 2：专注节奏固定，不适合不同使用者和展示场景

解决方案：

- 支持自定义专注/休息时长

实现方式：

- 在 store 和 Study Settings 中暴露 `focusMinutes` / `breakMinutes`

事实能力：

- 专注时长范围：`5-120` 分钟
- 休息时长范围：`1-60` 分钟

关键落点：

- [study-companion.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts)
- [settings/study/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue)

演示方式：

- 把专注时长调短，用于现场快速出结果
- 强调“演示模式不等于伪造历史数据”

#### 痛点 3：完成一轮专注后，不知道下一步做什么

解决方案：

- 在专注结束后给出显式下一步动作

实现方式：

- Study Island 中加入完成后动作卡

事实能力：

- `休息 5 分钟`
- `开始下一轮`
- `完成当前任务`

用户价值：

- 从“计时器”变成“行动建议器”

HCI 对应：

- Recognition rather than recall
- Flexibility and efficiency of use

#### 痛点 4：学了多少、坚持得怎样，缺少反馈和复盘依据

解决方案：

- 提供多日统计和图表分析

实现方式：

- 在 Study Island 和 Study Settings 中加入热力图、趋势图、完成结构、优先级分布、专注质量卡片等

关键落点：

- [study-chart-data.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/study-chart-data.ts)
- [StudyTrendChart.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyTrendChart.vue)
- [StudyHistoryChart.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyHistoryChart.vue)
- [StudyTaskCompletionChart.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyTaskCompletionChart.vue)
- [StudyTaskPriorityChart.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyTaskPriorityChart.vue)
- [StudyHeatmap.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyHeatmap.vue)
- [StudyFocusQualityCards.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyFocusQualityCards.vue)

事实能力：

- 今日中断次数
- 多日历史统计
- 最近 `7 / 14 / 30` 天摘要
- 最近 7 天趋势
- 最近 14 天趋势摘要
- 热力图、趋势图、完成结构、优先级分布、专注质量卡片

演示方式：

- 完成一轮专注后进入 Study Settings
- 展示 7/14/30 天摘要区和图表区

#### 痛点 5：老师或答辩评审看不到“项目真的记录了什么”

解决方案：

- 支持 JSON 与 Markdown 报告导出

实现方式：

- store 直接导出结构化 snapshot 与 Markdown report

事实能力：

- `exportStudySnapshot()`
- `exportStudyMarkdownReport()`
- 文件名模式：`rin-study-report-YYYY-MM-DD.md`

导出内容包括：

- 今日专注分钟/轮数
- 今日中断次数
- 任务列表
- 当前时长设置
- 事件日志
- 最近 7 天与 14 天数据
- 优先级分布摘要

演示价值：

- 特别适合 PPT 中展示“成果沉淀”页
- 也适合答辩时证明不是一次性前端假数据

#### 痛点 6：截止日期容易忘，桌宠没有真正“陪伴提醒”

解决方案：

- 增加任务截止提醒与系统通知桥接

实现方式：

- 规则生成在 shared store 中完成，renderer 轮询检查，到 main 进程调用 Electron `Notification`

关键落点：

- [study-task-reminders.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-task-reminders.ts)
- [use-study-task-reminders.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-task-reminders.ts)
- [study-task-reminder-notification.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/services/electron/study-task-reminder-notification.ts)

事实边界：

- 通知功能已在代码中实现
- 提醒检查依赖应用运行中轮询
- 真实的 macOS 通知权限与系统到达效果需人工确认

### 5.4 休息建议、空状态与恢复提示

关键落点：

- [study-break-suggestions.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/study-break-suggestions.ts)
- [study-status-labels.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/study-status-labels.ts)

事实能力：

- 休息阶段显示本地建议池中的一条建议
- 空状态文案明确引导“添加一个任务，让 Rin 陪你完成它”
- 统计页在没有足够历史时会做空状态处理

### 5.5 关键代码落点

- [study-companion.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts)
- [study-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue)
- [settings/study/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue)
- [study-chart-data.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/study-chart-data.ts)
- [study-break-suggestions.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/study-break-suggestions.ts)

### 5.6 用户体验提升

- 从无学习能力变成完整学习闭环
- 数据、任务和陪伴行为绑在一起
- 既有即时反馈，也有长期复盘
- 对课程展示来说，这一模块最容易被老师看懂和认可

### 5.7 HCI 原则对应

- Recognition rather than recall
  - 专注结束后的下一步动作卡、空状态提示、设置页摘要
- Flexibility and efficiency of use
  - 自定义专注/休息时长、当前专注任务切换、快速导出
- Aesthetic and minimalist design
  - 图表与统计视图统一美化，复杂数据结构转为可读图形
- Help users recognize, diagnose, recover from errors
  - 空状态、恢复提示、提醒状态和统计摘要
- Help and documentation
  - Markdown 导出就是一种“可读的使用结果文档”

### 5.8 测试保障

代表性测试：

- [study-companion.test.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.test.ts)
- [study-task-reminders.test.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-task-reminders.test.ts)
- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.test.ts)
- [TaskList.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.test.ts)
- [StudyTrendChart.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyTrendChart.test.ts)
- [StudyHeatmap.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyHeatmap.test.ts)
- Study Island 目录共 `8` 个测试文件

这些测试的价值不只是“组件能渲染”，还包括：

- 计时和状态切换行为
- 休息建议是否只在 break 阶段显示
- 图表数据是否按业务语义生成
- 报告导出结构是否稳定

### 5.9 风险与限制

- 提醒依赖应用运行中轮询，不是系统级后台服务
- 学习历史的真实积累需要持续使用，现场 demo 如果数据不足需要提前准备
- macOS 通知实际弹出效果需人工确认

---

## 6. 模块三：视觉交互与本地人脸门控

### 6.1 开发动机

如果 Rin 只是一个静态桌宠，课程展示的交互深度仍然有限。视觉模块的目标不是做“强 AI 识别”，而是探索在本地、可解释、可信前提下，让 Rin 对用户在位、方向和身份做出适度反馈。

### 6.2 原项目不足

基线中不存在以下内容：

- Vision Runtime
- Vision Island
- Vision Enrollment
- Local Face Gate
- Encrypted Face Profile
- Vision self-check / response explainer / feedback history

也就是说，视觉模块几乎是从零新增的产品链路。

### 6.3 实现内容

#### 6.3.1 本地摄像头视觉交互与运行时单例复用

关键落点：

- [use-vision-runtime.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts)
- [use-vision-interaction.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts)
- [vision-interaction-experiment.md](/Users/lifulin/Downloads/Rin/docs/vision-interaction-experiment.md)

实现内容：

- 创建共享 `Vision Runtime singleton`
- `runtimeStatus` 支持 `idle / warming / ready / partial_ready / failed / resetting`
- MediaPipe 与 OpenCV 热启动、重试、重置
- 本地模型与本地 wasm 优先，只有在 `VITE_VISION_ALLOW_REMOTE_FALLBACK === 'true'` 时才允许远端 fallback
- 摄像头 start/stop 与 runtime 生命周期拆开，避免每次开关面板都重建整个运行时

工程价值：

- 减少重复初始化带来的卡顿
- 提高演示稳定性
- 让 Vision 页面与面板切换更像真实产品，而不是一次性实验脚本

#### 6.3.2 MediaPipe / OpenCV 质量评估

关键落点：

- [use-opencv-face-quality.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts)

实现思路：

- 用本地视觉质量指标辅助判断采样质量
- 在录入页中给出自然语言采样提示
- 失败时走降级逻辑而不是直接崩溃

用户价值：

- 录入时知道“为什么当前帧不合格”
- 减少“系统没反应”的困惑

#### 6.3.3 本地人脸门控 Face Gate

关键落点：

- [use-local-face-gate.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts)

事实能力：

- gate 状态：`disabled / enabled / gated / locked`
- profile 状态：`not_enrolled / enrolled / matched / unmatched / uncertain / multiple_faces / no_face`
- 连续稳定帧判断避免抖动切换
- 多人入镜、无人脸、未录入、未解锁等情形都会进入不同状态

必须强调的真实性边界：

- 这是本地匹配门控，不等同于安全认证系统
- 它的作用是让 Rin 只在更可能是目标用户时进入互动反馈，而不是进行严格身份认证

#### 6.3.4 本地加密人脸档案

关键落点：

- [use-encrypted-face-profile.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts)

事实能力：

- 本地存储 key：`airi.vision-experiment.encrypted-face-profile.v1`
- 加密方案：`PBKDF2 + AES-GCM`
- 默认 PBKDF2 迭代次数：`150000`
- 解锁状态只保存在当前 renderer 进程内存，不持久化
- 删除、锁定、重新录入均有对应操作

用户价值：

- 把“视觉录入”从裸 localStorage 提升到有明确加密处理的本地档案
- 为隐私设计和 HCI 伦理提供可讲述依据

#### 6.3.5 人脸录入页重构

关键落点：

- [vision-enrollment/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue)

相对于原本不存在的录入页，这一页是完整新增，同时做了明显的信息架构设计：

- `步骤 1 / 4：开启摄像头`
- `步骤 2 / 4：设置本地档案`
- `步骤 3 / 4：采集人脸样本`
- `步骤 4 / 4：完成并启用`
- 高级参数默认折叠
- 诊断详情默认折叠
- 危险操作独立隔离
- 隐私说明与本地边界明确写出

用户价值：

- 从“技术字段堆叠”转为“普通用户也能跟着做”的向导
- 更适合答辩现场演示

HCI 对应：

- Recognition rather than recall
- Aesthetic and minimalist design
- Help users recognize, diagnose, recover from errors

#### 6.3.6 主体位置识别与中立校准

关键落点：

- [use-vision-interaction.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts)
- [vision-self-check.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-self-check.ts)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)

实现内容：

- 新增 `subjectNeutralCenter`
- 支持校准当前坐姿为个人中立基准
- 方向判断不再只围绕固定画面中心，而是围绕用户自己的校准中心
- 保存 `directionDistribution` 作为近期方向分布诊断

用户价值：

- 更适合真实桌面坐姿，不会要求所有人都严格居中
- 方向反馈更像“面向你的相对位置”，而不是“机器盯着屏幕几何中心”

演示价值：

- 可以现场展示“校准前后方向判定更合理”

#### 6.3.7 视觉自检与“为什么 Rin 没响应？”解释卡片

关键落点：

- [vision-self-check.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-self-check.ts)
- [vision-response-explainer.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-response-explainer.ts)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)

实现内容：

- 用纯函数生成视觉自检报告
- 用纯函数生成“为什么 Rin 没响应”的阻塞原因解释
- 覆盖相机未开、runtime 未就绪、无人脸、多人、人脸档案锁定、未匹配等情况

HCI 价值：

- 用户不用猜“是不是坏了”
- 系统直接帮助用户识别、诊断和恢复

#### 6.3.8 最近反馈历史

关键落点：

- [use-vision-pet-feedback.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)

事实能力：

- 维护最近反馈历史队列
- 默认展示最近 3 到 5 条
- 支持清空历史
- 连续相同消息自动去重，避免刷屏

### 6.4 隐私边界与真实性要求

根据当前代码和文案，较稳妥的事实表述应为：

- 摄像头用于 Rin 的本地视觉互动与人脸门控
- 视觉处理优先使用本地运行时
- 未经额外说明，Rin 不会把摄像头画面或录入档案上传到远端服务
- 人脸档案在本机加密保存，可随时锁定、重新录入或删除
- 面部动作信号只是本地视觉线索，不是情绪识别
- 视觉线索用于本地反馈，不用于评分、画像或自动决策

对应代码落点：

- [local-privacy-card.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/misc/local-privacy-card.vue)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)
- [vision-enrollment/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue)

### 6.5 关键代码落点

- [use-vision-runtime.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts)
- [use-vision-interaction.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts)
- [use-local-face-gate.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts)
- [use-encrypted-face-profile.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts)
- [vision-enrollment/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)
- [vision-interaction-experiment.md](/Users/lifulin/Downloads/Rin/docs/vision-interaction-experiment.md)

### 6.6 用户体验提升

- 从“完全没有视觉能力”变成“可解释、可诊断、可展示的本地视觉互动”
- 录入、使用、恢复、隐私说明形成闭环
- 对 HCI 课程来说，这一模块体现了明显的可信设计与错误恢复设计

### 6.7 HCI 原则对应

- Recognition rather than recall
  - 视觉自检、状态标签、解释卡片、四步录入引导
- Flexibility and efficiency of use
  - 摄像头 start/stop 与 runtime 分离、校准入口、本地门控开关
- Aesthetic and minimalist design
  - 默认视图展示用户状态，高级参数和诊断折叠
- Help users recognize, diagnose, recover from errors
  - 自检、解释卡、恢复动作、危险操作隔离
- Help and documentation
  - 录入页隐私说明、Onboarding 视觉步骤说明

### 6.8 测试保障

代表性测试：

- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.test.ts)
- [pet-feedback-path.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/pet-feedback-path.test.ts)
- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.test.ts)
- [use-vision-interaction.behavior.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.behavior.test.ts)
- [use-vision-runtime.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.test.ts)
- [use-local-face-gate.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.test.ts)
- [use-encrypted-face-profile.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.test.ts)

### 6.9 风险与限制

- 视觉识别受光照、角度、摄像头质量、多人入镜影响
- 人脸门控是本地实验能力，不是安全认证系统
- 面部动作信号不是情绪识别
- 如果本地安全存储条件不足，自动解锁体验会受限
- 远端 fallback 能力受环境变量控制，课堂展示应优先准备本地资源

---

## 7. 模块四：反馈系统、文案与可解释性

### 7.1 开发动机

视觉模块如果只有 raw 状态值，会让用户感到“系统在内部判断，但我不知道它在想什么”。反馈系统的价值，是把视觉状态转换成可读、克制、可控的本地反馈，而不是制造另一个黑箱。

### 7.2 原项目不足

基线时没有面向视觉链路的本地反馈模板系统，也没有统一的去重、冷却、历史和显示通道控制。

### 7.3 实现内容

#### 7.3.1 Vision Feedback Template Engine

关键落点：

- [vision-feedback-messages.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts)

事实能力：

- `intensity`: `minimal / balanced / expressive`
- `locale`: `en / zh-CN`
- `variant`: `default / a / b`
- 模板支持 `namedText`，可插入 `{name}`
- 渠道支持 `ui / toast / bubble / motion`
- transition 事件包括：
  - `transition_absent_to_returned`
  - `transition_uncertain_to_matched`
  - `transition_gated_to_matched`
  - `transition_multiple_faces_to_matched`
  - `transition_matched_to_absent`
  - `transition_matched_to_uncertain`

这是一个本地、确定性的模板选择系统，不是 LLM 即时生成。

#### 7.3.2 反馈历史、冷却、去重与 bubble 真正渲染

关键落点：

- [use-vision-pet-feedback.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)

实现内容：

- recent template ID 去重
- previous text 去重
- contextual cooldown
- bubble duration 管理
- quiet mode 抑制
- gate 约束
- transition-first 决策
- history queue 和 `clearVisionFeedbackHistory`

用户价值：

- 避免“桌宠每帧都在说话”
- 让反馈更接近陪伴，而不是噪音

#### 7.3.3 用户昵称动态插值

当前模板系统支持 `namedText` 和 `{name}` 替换，因此反馈不会被硬编码成固定用户名。这使得反馈更贴近“个体化陪伴”而不是模板公告。

### 7.4 文案体验与可解释性价值

- 用自然语言而不是 raw key 表达状态
- “为什么 Rin 没响应？”把系统阻塞讲清楚
- 历史反馈让用户能回看 Rin 的反应路径
- intensity / variant / locale 让反馈既可控又可本地化

### 7.5 HCI 原则对应

- Recognition rather than recall
  - 用户不用记住状态码，直接看自然语言反馈
- Aesthetic and minimalist design
  - 通过 dedupe、cooldown、quiet mode 控制反馈密度
- Help users recognize, diagnose, recover from errors
  - transition 文案、解释卡片、历史记录共同构成可解释层

### 7.6 测试保障

代表性测试：

- [pet-feedback-path.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/pet-feedback-path.test.ts)
- [use-vision-interaction.behavior.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.behavior.test.ts)
- 视觉工具与 composables 测试一起覆盖了 feedback path、状态切换和文案选择的关键路径

### 7.7 风险与限制

- 反馈模板虽有多样性，但本质仍是预定义模板池，不是开放式自然对话系统
- 昵称插值依赖现有 display name 流程，需人工确认展示现场的名字来源是否符合预期

---

## 8. 模块五：首次启动、隐私说明与用户引导

### 8.1 开发动机

课程展示最怕的不是功能少，而是“功能很多但讲不清”。首次启动流程必须从工程配置导向转成产品演示导向。

### 8.2 原项目不足

基线 onboarding 仍然是：

- welcome
- provider selection
- provider configuration
- model selection
- 可选 analytics notice

这套流程适合通用 AIRI 初始化，不适合 Rin 课堂演示。

### 8.3 实现内容

#### 8.3.1 首次启动改为 Rin Demo Guide

关键落点：

- [onboarding.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/onboarding.vue)
- [onboarding.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/scenarios/dialogs/onboarding/onboarding.vue)
- [step-demo-guide.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/scenarios/dialogs/onboarding/step-demo-guide.vue)

当前引导四步：

1. `认识 Rin`
2. `学习陪伴`
3. `视觉互动`
4. `快捷操作`

当前引导动作入口：

- `Open Study`
- `Open Vision`
- `Open Shortcut Guide`
- `Open Settings`
- `Open Study Settings`

作用：

- 首次启动不再要求先理解 provider 与 model
- 先引导用户看到“这个产品能做什么”
- 把后续 demo 路线嵌入 onboarding 本身

#### 8.3.2 引导状态记忆

关键落点：

- [onboarding.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/onboarding.ts)

事实能力：

- 使用 `useLocalStorage('onboarding/completed', false)`
- 使用 `useLocalStorage('onboarding/skipped', false)`
- `markSetupCompleted()` / `markSetupSkipped()` 持久化状态

用户价值：

- 不会反复打扰用户
- 适合答辩前准备一次、正式展示时不重复弹出

#### 8.3.3 Local Privacy Card 组件复用

关键落点：

- [local-privacy-card.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/misc/local-privacy-card.vue)
- [step-demo-guide.vue](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/components/scenarios/dialogs/onboarding/step-demo-guide.vue)
- [vision-enrollment/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue)
- [vision-island/index.vue](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue)

复用位置：

- Onboarding 的视觉互动步骤
- Vision Island
- Vision Enrollment

价值：

- 隐私边界不再只藏在某个角落
- 用户在首次接触、使用中、录入时都能看到同一套可信承诺

### 8.4 HCI 原则对应

- Recognition rather than recall
  - 四步 Demo Guide、操作按钮、隐私卡片
- Flexibility and efficiency of use
  - 引导里直接打开 Study / Vision / Settings
- Help and documentation
  - onboarding 本身就是课程答辩的“内置帮助文档”
- Aesthetic and minimalist design
  - 用分步卡片代替复杂配置流

### 8.5 展示价值

这是非常强的答辩材料：

- 它证明我们没有只做功能，而是重新设计了“第一次接触产品时应该看到什么”
- 它能自然引出整场演示的顺序

### 8.6 风险与限制

- `step-demo-guide.vue` 中写有“如果要重新看这份引导，可以在后续版本里从设置页再次打开”，但当前仓库中是否已经提供了显式“重新打开引导”的用户入口，需人工确认

---

## 9. 模块六：品牌统一与打包发布

### 9.1 开发动机

如果课堂展示里界面写的是 Rin、托盘写的是 Rin，但打包产物、权限文案、DMG 名称还是 AIRI，会破坏最终交付的一致性。因此必须对“用户可见品牌”和“内部兼容命名”做分层处理。

### 9.2 原项目不足

基线时：

- `productName: 'AIRI'`
- macOS 权限提示文案写 AIRI
- tray tooltip 为 `Project AIRI`
- artifactName 以 `${productName}` 展开时仍是 AIRI

### 9.3 实现内容

#### 9.3.1 对外品牌统一为 Rin

关键证据：

- `c25bb37a i18n: rename user-facing AIRI branding to Rin`
- [electron-builder.config.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/electron-builder.config.ts)
- [tray/index.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/index.ts)
- `packages/i18n` 各 locale 文件

已完成的用户可见改动：

- `productName` 改为 `Rin`
- macOS 相机/麦克风权限文案改为 Rin
- tray tooltip 改为 Rin
- i18n 中对外文案从 AIRI 收口为 Rin

#### 9.3.2 保留内部 AIRI 命名与开源归属兼容

当前 builder 文件仍保留部分内部兼容项：

- `appId: 'ai.moeru.airi'`
- `extraMetadata.name: 'ai.moeru.airi'`
- `homepage: 'https://airi.moeru.ai/docs/'`
- `repository: 'https://github.com/moeru-ai/airi'`
- Windows/Linux `executableName` 仍为 `airi`
- Linux `description` 仍以 `AIRI is ...` 开头

这说明当前策略不是彻底抹掉 AIRI，而是：

- 对用户可见层统一为 Rin
- 对内部包名、路径、仓库归属、兼容字段保留 AIRI

这与“基于 AIRI 二次开发、避免破坏工程兼容”的目标一致。

#### 9.3.3 打包预检与 Godot sidecar 修复

关键落点：

- [preflight-release-check.mjs](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/scripts/preflight-release-check.mjs)
- [electron-builder.config.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/electron-builder.config.ts)
- [electron.vite.config.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/electron.vite.config.ts)
- [package.json](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/package.json)
- [export_presets.cfg](/Users/lifulin/Downloads/Rin/engines/stage-tamagotchi-godot/export_presets.cfg)
- [project.godot](/Users/lifulin/Downloads/Rin/engines/stage-tamagotchi-godot/project.godot)

事实能力：

- `preflight:release` 脚本存在
- `build:mac` 脚本存在
- `preflight-release-check.mjs` 会检查：
  - productName
  - artifactName
  - macOS permission copy
  - icon resources
  - vision assets
  - godot extraResources
- 当前仓库下执行 preflight 的结果为 `6 checks, 0 fail, 0 warn`
- `300558d5` 修复了 macOS Godot export preset
- `electron.vite.config.ts` 明确针对 `EMFILE` / watch 过多问题做了守护

### 9.4 当前打包状态的真实表述

本次会话中可以确认的是：

- 仓库内的发布预检脚本可通过
- 相关打包命名和资源检查已经部分收口到 Rin
- Godot sidecar 的 extraResources 路径和 macOS preset 已有修复

不能确认或不能夸大的是：

- 本次会话没有执行完整 `build:mac`
- 没有验证正式签名、公证、最终 DMG 产物生成
- 不能声称“DMG 已完全发布”

### 9.5 工程实现价值

这个模块体现的不是 UI，而是：

- 我们把课程项目往真实交付物推进了一步
- 对命名一致性、权限文案、资源完整性和 sidecar 依赖进行了工程化收口

### 9.6 风险与限制

- Godot sidecar 仍然是打包链路中的外部依赖点
- 正式签名/公证/发布环境仍需后续正式验证
- Linux/Windows 命名仍保留 AIRI 兼容字段，这在最终发布前是否继续保留，需人工决策

---

## 10. 测试与工程质量保障

### 10.1 测试分布概览

根据当前仓库统计，代表性测试分布如下：

- `study-island`：`8` 个测试文件
- `vision-island`：`2` 个测试文件
- `vision-enrollment`：`1` 个测试文件
- `controls-island`：`7` 个测试文件
- renderer `composables`：`12` 个测试文件
- renderer `utils`：`18` 个测试文件
- `packages/stage-ui/src/stores/modules`：`5` 个测试文件
- `packages/stage-ui-live2d/src/utils`：`1` 个测试文件
- `src/main/tray`：`1` 个测试文件
- `apps/stage-tamagotchi/scripts`：当前直接可见 `3` 个测试文件，但其中与本轮发布相关的 preflight 验证更多体现在脚本本身和手动执行结果；`preflight-release-check` 对应自动化测试文件需人工确认

### 10.2 代表性测试文件

- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.test.ts)
- [TaskList.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.test.ts)
- [StudyTrendChart.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyTrendChart.test.ts)
- [StudyHeatmap.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/StudyHeatmap.test.ts)
- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.test.ts)
- [pet-feedback-path.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/pet-feedback-path.test.ts)
- [index.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.test.ts)
- [use-vision-interaction.behavior.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.behavior.test.ts)
- [use-vision-runtime.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.test.ts)
- [use-local-face-gate.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.test.ts)
- [use-encrypted-face-profile.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.test.ts)
- [window-click-through-policy.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/window-click-through-policy.test.ts)
- [click-through-protected-elements.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/click-through-protected-elements.test.ts)
- [live2d-hit-area.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/live2d-hit-area.test.ts)
- [tray-menu.test.ts](/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/main/tray/tray-menu.test.ts)
- [study-companion.test.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.test.ts)
- [study-task-reminders.test.ts](/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-task-reminders.test.ts)

### 10.3 这些测试在防什么风险

- 防止学习模块只测“有渲染”，不测任务/计时/导出的真实业务语义
- 防止 click-through 和 protected elements 在界面改动后失效
- 防止视觉 runtime、face gate、encrypted profile 在重构后失去关键状态机行为
- 防止图表改样式时把统计语义做错
- 防止 tray 快捷入口和 fit preference 菜单逻辑回归

### 10.4 当前会话中实际验证过的内容

本次会话中实际执行并确认的只读验证：

- `node apps/stage-tamagotchi/scripts/preflight-release-check.mjs`
- 结果：`6 checks, 0 fail, 0 warn`

### 10.5 需谨慎表述的点

- 本次没有运行全量 `typecheck`
- 本次没有运行全量 `build`
- 不能直接声称“所有测试当前均通过”
- 如果 PPT 需要写“工程质量保障”，建议表述为“补充了大量测试与预检脚本，当前预检脚本通过；全量 typecheck/build/发布链路需在正式环境继续验证”

---

## 11. 最终演示建议

建议采用一条 `5～7 分钟` 的稳定路线：

1. 启动 Rin
   - 讲“这是基于 AIRI 二次开发、对外统一为 Rin 的桌面学习陪伴助手”
2. 展示拖拽 / 缩放 / 靠近淡出
   - 演示 Move Mode、缩放和低打扰交互
3. 打开 Study
   - 新建任务，绑定当前专注任务，开始一轮专注
4. 展示任务、专注、统计图表、导出报告
   - 切到 Study Settings，看 7/14/30 天统计和图表，展示 Markdown/JSON 导出
5. 打开 Vision
   - 展示摄像头状态、本地运行时、自检、解释卡片
6. 展示人脸门控、主体位置校准、反馈历史
   - 如果现场环境稳定，可演示录入后匹配与方向反馈
7. 展示隐私说明和本地处理
   - 强调本地优先、加密档案、非情绪识别、非安全认证
8. 展示状态栏菜单与快捷键
   - 证明不是只靠页面按钮，而是完整桌面应用交互

演示准备建议：

- 提前准备一份 Study 历史数据，避免图表区空白
- 提前完成一次 Vision Enrollment，避免现场录入时间不稳定
- 提前确认相机权限和光照
- 把 Rin 放到一个能明显体现“淡出不遮挡”的桌面背景上，例如浏览器或 PDF 页面

---

## 12. PPT 页面建议

建议做 `12～18` 页，这里给出 `15` 页大纲。

### 第 1 页：项目标题页

- 标题：`Rin：面向学习陪伴与本地视觉互动的桌面宠物系统`
- 截图：Rin 主舞台 + 学习面板或视觉面板
- 讲解重点：一句话定位
- 支撑：品牌统一、主界面、桌宠形态

### 第 2 页：项目来源与改造目标

- 标题：`从 AIRI 到 Rin`
- 截图：基线 AIRI 界面 / 当前 Rin 界面对照
- 讲解重点：二次开发，不是从零造轮子；目标从通用桌宠扩展到学习陪伴与本地视觉互动
- 支撑：i18n、tray、builder、docs

### 第 3 页：基线能力与不足

- 标题：`刚 fork 时项目有什么、缺什么`
- 截图：基线 onboarding、基线 controls 或 tray
- 讲解重点：已有工程基础，但缺学习、视觉、演示导向产品化
- 支撑：基线代码对照

### 第 4 页：整体架构改造图

- 标题：`我们做了哪些主线改造`
- 截图：自绘模块图或目录结构图
- 讲解重点：桌面交互、学习、视觉、引导、隐私、发布
- 支撑：Git diff 统计和模块表格

### 第 5 页：桌面宠物与低打扰交互

- 标题：`让 Rin 真正适合常驻桌面`
- 截图：Move Mode、fit mode、淡出前后
- 讲解重点：拖拽、缩放、淡出、click-through 保护
- 支撑：`window-click-through-policy.ts`、`live2d-fit-layout.ts`

### 第 6 页：快捷操作与 tray

- 标题：`高频操作效率优化`
- 截图：快捷键指南、tray 菜单
- 讲解重点：快捷键、状态栏菜单、Study/Vision 快捷入口
- 支撑：`use-stage-keyboard-shortcuts.ts`、`tray/index.ts`

### 第 7 页：学习陪伴系统概览

- 标题：`Study Companion：把桌宠变成学习闭环`
- 截图：Study Island 主界面
- 讲解重点：任务、番茄钟、当前专注任务、下一步动作
- 支撑：`study-companion.ts`、`study-island/index.vue`

### 第 8 页：学习统计与导出

- 标题：`可视化统计与成果沉淀`
- 截图：趋势图、热力图、优先级图、Markdown 导出
- 讲解重点：7/14/30 天趋势、图表、导出报告
- 支撑：图表组件和导出函数

### 第 9 页：视觉互动模块概览

- 标题：`本地视觉互动，不做黑箱`
- 截图：Vision Island 主界面
- 讲解重点：本地摄像头、本地运行时、自检、解释卡片
- 支撑：`use-vision-runtime.ts`、`vision-island/index.vue`

### 第 10 页：人脸录入与本地门控

- 标题：`四步录入 + 本地加密档案 + Face Gate`
- 截图：Vision Enrollment 四步界面
- 讲解重点：录入向导、危险操作隔离、本地加密、门控边界
- 支撑：`vision-enrollment/index.vue`、`use-encrypted-face-profile.ts`

### 第 11 页：可解释性与反馈系统

- 标题：`为什么 Rin 没响应？`
- 截图：解释卡片、最近反馈历史、bubble 文案
- 讲解重点：template engine、history、dedupe、cooldown、explainability
- 支撑：`vision-feedback-messages.ts`、`use-vision-pet-feedback.ts`

### 第 12 页：首次启动与隐私说明

- 标题：`把 onboarding 变成演示引导`
- 截图：Rin Demo Guide、LocalPrivacyCard
- 讲解重点：四步引导、快捷入口、隐私复用组件
- 支撑：`onboarding.vue`、`step-demo-guide.vue`、`local-privacy-card.vue`

### 第 13 页：品牌统一与发布工程

- 标题：`从 AIRI 工程到 Rin 产品包装`
- 截图：builder 配置片段、preflight 输出
- 讲解重点：productName、权限文案、artifactName、Godot sidecar、EMFILE 修复
- 支撑：`electron-builder.config.ts`、`preflight-release-check.mjs`

### 第 14 页：测试与工程质量

- 标题：`不是拼 UI，而是工程化实现`
- 截图：测试文件分布表或命令输出摘要
- 讲解重点：学习、视觉、Controls、图表、tray 的测试覆盖
- 支撑：代表性测试文件列表

### 第 15 页：限制与未来工作

- 标题：`当前限制与下一步`
- 截图：可放 TODO 列表或风险图标
- 讲解重点：视觉环境敏感、门控非认证、打包公证未验证、Godot sidecar 依赖等
- 支撑：当前代码与验证边界

---

## 13. 已知限制与未来工作

### 13.1 已知限制

- Godot sidecar 仍然是打包链路依赖点，正式发布前要继续验证构建目录、extraResources 和平台兼容性
- 本次仅验证了 preflight 通过，未验证正式 `build:mac` 产物、签名、公证和最终 DMG
- 视觉识别受光照、角度、镜头质量、多人入镜影响
- Local Face Gate 是本地实验能力，不等同安全认证系统
- 面部动作信号不是情绪识别
- 本地优先处理是当前设计方向；如未来启用远端 fallback 或新服务接入，隐私文案需要继续保持同步与谨慎
- onboarding 中“未来可从设置再次打开引导”的用户入口是否已经完整提供，需人工确认
- Study 统计效果依赖实际使用积累，现场展示若无预先数据会影响表现

### 13.2 未来工作方向

- 正式梳理签名、公证和 macOS 发布链路
- 针对不同光照/角度条件继续优化视觉稳定性
- 进一步把 tray、shortcut、settings 中的帮助入口整合成完整帮助系统
- 为 Study 与 Vision 增加更多跨模块联动，例如学习阶段的低打扰视觉反馈策略
- 继续清理用户可见层之外仍保留的 AIRI 命名，形成更明确的“外部 Rin / 内部 AIRI”边界文档

---

## 14. 结论：这段开发周期我们实际完成了什么

如果用答辩口径总结，可以概括成四句话：

1. 我们没有停留在原始 AIRI 桌宠框架，而是把它重新定位成了 `Rin`，面向学习陪伴和本地视觉互动。
2. 我们新增了两个真正可展示、可落地的核心模块：`Study Companion` 和 `Vision Interaction`。
3. 我们围绕 HCI 做了大量“用户能感知到”的交互改造，包括低打扰桌面交互、首次启动引导、可解释反馈和隐私说明。
4. 我们没有只做界面，还补上了 tray 快捷操作、发布预检、测试和工程兼容层，让它更接近一个可演示、可交付的产品。

