# Rin/AIRI 仓库改造分析（HCI 课程项目）

更新时间：2026-04-29
范围：仅仓库结构与代码路径分析，不包含代码修改

## 1. `pnpm dev:tamagotchi` 启动链路

### 1.1 根脚本 -> Tamagotchi workspace
- `package.json`
  - `dev:tamagotchi = pnpm -rF @proj-airi/stage-tamagotchi run dev`

### 1.2 Tamagotchi 脚本
- `apps/stage-tamagotchi/package.json`
  - `dev = electron-vite dev`
  - `main = ./out/main/index.js`（构建产物入口）

### 1.3 Electron 主进程入口
- `apps/stage-tamagotchi/src/main/index.ts`
  - 负责应用启动、DI（injeca）、窗口管理器注册、tray 注册、各服务启动

### 1.4 渲染进程入口
- `apps/stage-tamagotchi/electron.vite.config.ts`
  - renderer input: `src/renderer/index.html`
- `apps/stage-tamagotchi/src/renderer/index.html`
  - `<script type="module" src="/main.ts"></script>`
- `apps/stage-tamagotchi/src/renderer/main.ts`
  - Vue app、router、pinia、i18n 初始化
- `apps/stage-tamagotchi/src/renderer/App.vue`
  - onMounted 中完成显示模型、角色卡、聊天会话、settings 初始化

## 2. Live2D 模型加载路径与控制点

### 2.1 预置模型来源（含 `model3.json` 上游来源）
- `apps/stage-tamagotchi/electron.vite.config.ts`
  - `DownloadLive2DSDK()`
  - 下载 `hiyori_free_zh.zip` / `hiyori_pro_zh.zip` 到 `packages/stage-ui/src/assets/live2d/models`
- `packages/stage-ui/src/assets/live2d/models/`
  - `hiyori_free_zh.zip`
  - `hiyori_pro_zh.zip`
  - `hiyori/preview.png`
- ZIP 内包含真实 `*.model3.json`（例如 `runtime/hiyori_pro_t11.model3.json`）

### 2.2 模型注册与选中
- `packages/stage-ui/src/stores/display-models.ts`
  - 预置模型 `preset-live2d-1/2`
  - 用户导入模型（IndexedDB/localforage）
- `packages/stage-ui/src/stores/settings/stage-model.ts`
  - 默认选中：`settings/stage/model = preset-live2d-1`
  - 解析当前模型 URL（preset URL 或 file blob URL）
  - 决定 renderer 是 `live2d` 还是 `vrm`

### 2.3 渲染链路
- `packages/stage-ui/src/components/scenes/Stage.vue`
  - `Live2DScene :model-src="stageModelSelectedUrl" :model-id="stageModelSelected"`
- `packages/stage-ui-live2d/src/components/scenes/Live2D.vue`
  - 注册 ZIP loader + OPFS 缓存中间件
- `packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue`
  - `Live2DFactory.setupLive2DModel(..., { url, id })`
  - 核心加载/动作/表情逻辑都在此

### 2.4 `model3.json` 解析与兜底
- `packages/stage-ui-live2d/src/utils/live2d-zip-loader.ts`
  - 若 ZIP 内有 `.model3.json/.model.json`，走标准设置读取
  - 若缺失，`createFakeSettings()` 构造 `ModelSettings`（虚拟 `*.model3.json`）作为兜底
- `packages/stage-ui-live2d/src/utils/opfs-loader.ts`
  - 会在 OPFS 落盘缓存文件，必要时重建 settings 文件（默认名 `model.model3.json`）

### 2.5 表情/动作控制位置
- 动作列表解析与播放：
  - `packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue`
    - `availableMotions` 解析
    - `setMotion(motionName, index?)`
    - `watch(currentMotion, ...)` 驱动播放
- 情绪 -> Live2D 动作组映射：
  - `packages/stage-ui-live2d/src/constants/emotions.ts`
  - `packages/stage-ui/src/components/scenes/Stage.vue`（收到 ACT/emotion token 后设置 `currentMotion`）
- 表情系统（exp3）：
  - `packages/stage-ui-live2d/src/composables/live2d/expression-controller.ts`
  - `packages/stage-ui-live2d/src/stores/expression-store.ts`
  - `Model.vue` 中 `initExpressionController()` 从 model settings 的 expressions 读取并加载 exp3
- 设置页控制面板：
  - `packages/stage-ui/src/components/scenarios/settings/model-settings/live2d.vue`
  - 包含 Idle 动作选择、眨眼、阴影、参数、缓存清理等

## 3. 默认角色 persona/system prompt 配置位置

### 3.1 默认卡（角色）创建
- `packages/stage-ui/src/stores/modules/airi-card.ts`
  - `initialize()` 中创建默认卡：
    - id: `default`
    - name: `ReLU`
    - description 来自 `SystemPromptV2(...)`

### 3.2 System prompt 拼装
- `packages/stage-ui/src/constants/prompts/system-v2.ts`
  - `prefix + 情绪列表 + suffix` 拼成 system message
- `packages/i18n/src/locales/en/base.yaml`
  - `base.prompt.prefix`
  - `base.prompt.suffix`

### 3.3 最终会话实际注入的系统提示
- `packages/stage-ui/src/stores/modules/airi-card.ts`
  - `systemPrompt` 计算属性会拼接：
    - `card.systemPrompt`
    - `card.description`
    - `card.personality`
    - `artistry.widgetInstruction`
- `packages/stage-ui/src/stores/chat/session-store.ts`
  - `generateInitialMessageFromPrompt(systemPrompt.value)` 生成系统首消息

## 4. 桌面窗口行为代码位置

### 4.1 透明窗口 / 无边框
- `apps/stage-tamagotchi/src/main/windows/shared/window.ts`
  - `transparentWindowConfig()`：
    - `frame: false`
    - `transparent: true`
    - `hasShadow: false`

### 4.2 置顶
- 主窗口置顶：
  - `apps/stage-tamagotchi/src/main/windows/main/index.ts`
    - `window.setAlwaysOnTop(true, 'screen-saver', 1)`
- caption/widgets/overlay 也分别设置置顶：
  - `apps/stage-tamagotchi/src/main/windows/caption/index.ts`
  - `apps/stage-tamagotchi/src/main/windows/widgets/index.ts`
  - `apps/stage-tamagotchi/src/main/windows/desktop-overlay/index.ts`

### 4.3 拖拽
- 主进程拖拽实现：
  - `apps/stage-tamagotchi/src/main/windows/main/index.ts`
  - `electron-click-drag-plugin` + `electronStartDraggingWindow` invoke handler
- 渲染层拖拽触发按钮：
  - `apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue`

### 4.4 托盘
- `apps/stage-tamagotchi/src/main/tray/index.ts`
  - `new Tray(...)`
  - 点击显示/隐藏主窗口
  - 菜单中提供窗口尺寸与对齐操作

### 4.5 窗口大小与缩放
- 主窗口尺寸初始化与持久化：
  - `apps/stage-tamagotchi/src/main/windows/main/index.ts`
  - `resize/move` 写入 config
- 通用 resize 算法：
  - `apps/stage-tamagotchi/src/main/windows/shared/window.ts`
  - `resizeWindowByDelta(...)`
- 渲染层边缘拖拽句柄：
  - `apps/stage-tamagotchi/src/renderer/components/ResizeHandler.vue`
- IPC 调整窗口：
  - `apps/stage-tamagotchi/src/main/services/electron/window.ts`
  - `electron.window.resize / setBounds / setIgnoreMouseEvents / setAlwaysOnTop`

## 5. 最小改造建议：新增 `Rin` 学习陪伴角色（不破坏 AIRI 默认）

目标：新增并行角色，不替换默认 `default/ReLU`。

### 5.1 角色卡层（最小侵入）
- 在 `packages/stage-ui/src/stores/modules/airi-card.ts` 的 `initialize()` 内新增一张 seed card（如 id: `rin`）
- 保持：
  - `activeCardId` 默认仍是 `default`
  - 默认 AIRI prompt 与行为保持不变
- `Rin` 卡内定义：
  - `name/personality/systemPrompt`
  - `extensions.airi.modules.displayModelId = preset-live2d-rin-1`

### 5.2 模型层
- 在 `apps/stage-tamagotchi/electron.vite.config.ts` 新增 Rin 模型 ZIP 下载
- 在 `packages/stage-ui/src/stores/display-models.ts` 新增 `preset-live2d-rin-1`
- 这样 Rin 卡切换时可直接复用现有 `stageModelSelected` 机制自动换模型

### 5.3 学习陪伴 prompt 层
- 建议新增独立 i18n prompt key（例如 `base.prompt.rin-prefix/suffix` 或新命名空间）
- 在构建 Rin 卡时使用新 prompt key，通过 `SystemPromptV2` 复用情绪 token 规范
- 不覆盖原 `base.prompt.prefix/suffix`，避免影响 default AIRI

### 5.4 动作/表情兼容
- 确认 Rin 模型动作组名与 `EMOTION_EmotionMotionName_value` 兼容
- 若不兼容，在映射层补充适配，不要改动全局默认映射行为

### 5.5 验证建议（改造后）
- 切换 `default` 与 `rin`：
  - system prompt 是否隔离
  - display model 是否随卡切换
  - Live2D motion/expression 是否正常
- 验证托盘、置顶、拖拽、缩放行为不回归

## 6. 结论

当前仓库已具备完整的：
- 多角色卡（AiriCard）体系
- 可切换显示模型（Live2D/VRM）体系
- 桌宠窗口控制体系（透明、置顶、拖拽、托盘、缩放）

因此 “新增 Rin 学习陪伴桌宠” 可以走 **新增并行 preset card + preset model** 的路径，做到最小改造且不破坏默认 AIRI 配置。
