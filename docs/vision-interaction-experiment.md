# Vision Interaction Experiment

## 模块定位
- 本模块属于 `feature/vision-interaction-experiment` 视觉实验分支。
- 目标是探索 Rin 在桌宠场景下的自然视觉交互能力。
- 不接学习主线，不接 study-companion，不改 Study Island。

## 功能清单
- 摄像头开关（Start/Stop）。
- 人脸在位检测（facePresence）。
- faceDirection / subject-position response（left/right/up/down/center）。
- 三类手势识别（open_palm / victory / thumbs_up）。
- practical gesture mapping（手势到交互语义映射）。
- Local Face Gate（本地门控放行/拦截）。
- encrypted local profile（本地加密人脸档案）。
- OpenCV/canvas quality check（OpenCV 可用时优先，失败时降级 fallback）。
- gesture-driven pet feedback（手势驱动 Rin 形象反馈）。
- Vision Runtime Manager（MediaPipe + OpenCV 单例复用、状态可观测、可重试/可重置）。

## 手势语义
- `open_palm`: quiet Rin temporarily
- `victory`: celebrate completed moment
- `thumbs_up`: acknowledge current prompt

## Optional Experimental Gesture Controls（默认关闭）
- 手势识别保持为 optional experimental controls，默认关闭。
- 用户在 Vision Island 的 `Advanced / Experimental Gesture Controls` 手动开启后，才会运行手势推理链路。
- 关闭时隐藏高级诊断，只保留开关入口；不影响 facePresence / subject-position response 主链路。

### 手势稳健识别链路（v2）
- 输入质量门控（quality gate）：
- `handSizeRatio`、`handInsideGuideArea`、`landmarkCompleteness`、`gestureConfidence`、`handMotionSpeed`
- `qualityState`: `good | too_far | out_of_frame | too_fast | low_confidence | unknown`
- 保守几何校验（geometry verifier）：
- `verifyOpenPalm`
- `verifyVictory`
- `verifyThumbsUp`
- 滑动窗口投票（sliding window voting）：
- `windowSize=10`
- `minVotes=7`
- `minAverageConfidence=0.75`
- `minGeometryPassRate=0.7`
- 仅 `qualityState=good` 的帧参与投票。
- 手势状态机（state machine）：
- `idle -> candidate -> stable -> armed -> triggered -> cooldown -> waiting_release -> idle`
- `open_palm`: hold 600ms, cooldown 3000ms
- `victory`: hold 500ms, cooldown 4000ms
- `thumbs_up`: hold 500ms, cooldown 3000ms
- release-to-retrigger：
- 触发后必须先释放手势（回到 none/unknown）才能再次触发同一手势，避免连续抖动触发。

### 校准反馈（Calibration Feedback）
- Vision Island 会显示：
- `candidateGesture` / `stableGesture` / `gestureState`
- `gestureVotes` / `geometryPassRate` / `gestureQualityState`
- `handSize` / `handInsideGuideArea`
- `holdProgress` / `cooldownRemainingMs` / `releaseRequired`
- 校准提示：
- `Move your hand closer.`
- `Keep your hand inside the guide area.`
- `Hold the gesture steady.`
- `Release your hand to trigger again.`
- `Better lighting may help.`

### 使用建议（真机）
- 保持手势在画面中央有效区域内。
- 光线尽量均匀，避免逆光和强背光。
- 手势保持至少 0.5 秒。
- 触发后先放下手，再做下一次触发。

## Subject-position response（主体位置响应）
- 响应来源：`faceCenter` 与 `faceDirection` 的稳定帧结果（不是单帧抖动）。
- 反馈目标：让 Rin 在 `left / right / up / down / center` 切换时给出可见、可解释的反馈。
- 反馈内容：
- 轻量消息（toast）：由本地模板池生成，不依赖 LLM。
- Live2D 反馈：使用已有 motion/expression fallback 链，不改底层渲染器。
- 状态观测：
- `subjectPosition`
- `lastStableSubjectPosition`
- `subjectResponseState`（`idle/following_left/following_right/looking_up/looking_down/centered/gated`）
- `lastSubjectResponseEvent`
- `subjectResponseCooldownUntil`

### 为什么不是严格视线测量
- 模块仅根据主体在人脸框中的相对位置做 gaze-like feedback。
- 不做瞳孔级别或视线向量级别估计。
- 目标是自然交互演示，而非严格视线测量。

### Contextual Vision Feedback Engine
- 文案来源是本地模板池 `apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts`。
- 模板事件覆盖：
- `subject_position_left/right/up/down/center`
- `subject_returned`
- `subject_absent`
- `subject_gated`
- `subject_matched`
- `subject_uncertain`
- `subject_dwelled_left/right/center`
- 模板选择支持 displayName 插值，且同一事件连续两次不会返回相同句子。
- 全部文案本地生成，不调用远程 API，不写入主聊天历史。

### Feedback Intensity
- `minimal`：
- 主要更新状态，不做方向类 toast，Live2D 反馈极轻或不触发。
- `balanced`（默认）：
- 方向变化触发短反馈；`subject_returned / subject_matched` 更强。
- `expressive`：
- 方向变化、回中和 dwell 都可触发更活跃反馈（仍受冷却限制）。

### 防打扰策略
- 事件级冷却：方向类默认 5s，`returned/matched` 10s，dwell 14s。
- 方向提示全局节流：方向在短时间快速切换时仅更新状态，不重复弹 toast（默认 2.5s）。
- 事件优先级：`subject_returned` / `subject_matched` 视为高优先级，方向噪声期间优先保留这类提示；高优先级提示后会短暂抑制低优先级方向提示，避免被刷屏淹没。
- quiet mode 抑制：不触发 normal/strong 反馈，仅更新状态。
- gate blocked（unmatched/multiple_faces/locked/no_face/uncertain）：
- 不触发 motion/expression，记录 gated 类型反馈，避免刷屏。
- dwell 反馈：主体在同一稳定方向停留约 7s 才触发一次，随后受更长冷却保护。

### Face Gate 约束（主体位置响应）
- `gate disabled`：允许 subject-position response。
- `gate enabled + matched`：允许 subject-position response。
- `gate enabled + unmatched/no_face/multiple_faces/uncertain/gated/locked`：
- 仍可显示检测到的方向（调试可见）。
- 不触发 Rin motion / expression。
- 不触发主体位置 toast。
- 事件记录为 `Subject position detected but gated.`
- `multiple_faces` 场景始终禁止放行，不会随意选择一个主体响应。

## Face Gate 状态机
- gate 层状态：
- `disabled`：门控未开启，允许视觉反馈。
- `enabled`：门控开启且已匹配，允许视觉反馈。
- `gated`：门控开启但未放行，手势仅显示 detected but gated。
- `locked`：门控锁定（如无脸/多脸/未解锁档案等），不触发形象反馈。

- profile / matching 层状态：
- `matched`
- `unmatched`
- `multiple_faces`
- `no_face`
- `uncertain`
- `enrolled`
- `not_enrolled`

## 本地数据与隐私
- 人脸档案仅本地保存。
- 保存内容为加密 blob，不写明文 descriptor / displayName。
- 摄像头数据不上传服务器。
- 用户可随时 Delete Profile 删除本地档案。
- passphrase 不写入 localStorage，仅用于当次解锁与派生密钥。

## Vision Runtime Manager（单例复用）
- Runtime 生命周期是 renderer 级单例：Vision Island 与 Enrollment 共用同一份 runtime。
- Vision Island 挂载会自动触发后台 warmup（不阻塞 UI）。
- 首次冷启动可能较慢（wasm/model 下载与编译）；同一会话后续 Start/Stop/再 Start 复用已就绪 runtime。
- `Stop Camera` 只释放摄像头流与循环，不销毁 MediaPipe/OpenCV runtime。
- 仅在用户点击 `Reset Runtime`（或 renderer 重启）时清空 runtime 引用并重新初始化。
- 若初始化失败可点 `Retry Runtime`，不需要重启应用。

### Runtime 状态
- runtime: `idle | warming | ready | partial_ready | failed | resetting`
- mediapipe: `idle | loading | ready | failed`
- opencv: `idle | loading | ready | fallback | failed`
- 诊断字段：`warmupDurationMs`、`retryCount`、`lastError`

### OpenCV fallback 机制
- OpenCV warming 失败或超时后标记为 `fallback`，质量评估自动走 canvas 路径。
- fallback 不阻断摄像头与手势识别；MediaPipe ready 时视觉交互可继续运行。

## 手动测试 Checklist
- 冷启动：进入主界面，Vision Island 可打开，默认摄像头关闭。
- Runtime 预热：进入 Vision Island 后观察 runtime 从 warming 到 ready/partial_ready。
- Start Camera：摄像头状态变为 active。
- Stop Camera：状态回到 off，摄像头轨道释放。
- 再次 Start Camera：应明显快于首次冷启动，且不重新下载模型资源。
- 未开启 gate：三类手势可触发反馈。
- 开启 gate 且未解锁：手势被 gated，显示 detected but gated。
- 录入 profile：单人脸、质量合格时可录入成功。
- 刷新后解锁：需要 passphrase 才能恢复 unlocked。
- matched 手势反馈：gate enabled + matched 时触发 pet feedback。
- matched 主体位置反馈：gate enabled + matched 时，左右上下与回中会触发可见反馈。
- multiple_faces：状态进入 locked/multiple_faces，禁止反馈。
- unmatched/no_face：主体位置事件只显示 gated/idle，不触发 Rin 反馈。
- Delete Profile：确认后清空档案，状态回到未录入。
- 权限拒绝恢复：拒绝权限后显示 error，再次允许后可重试 Start Camera。
- Stop Camera 资源释放：track stop 计数与诊断信息更新。
- Retry/Reset Runtime：failed 时可 Retry；Reset 后下一次 Start 触发完整 warmup。

## 已知限制
- 光照极暗/极亮会降低质量评分。
- 侧脸或大角度会影响稳定匹配。
- 多人脸场景默认锁定，不做身份放行。
- MediaPipe/OpenCV wasm 首次加载可能受本地环境影响。
- 目前自动化测试仍使用 deterministic mock，不包含“真实摄像头权限弹窗 + 真实驱动 + 真实模型资产”的完整 E2E。
- 该门控不是安全级认证，仅用于实验交互约束。
- `EMFILE` 通常是 dev watcher 环境问题，不是视觉逻辑故障。

## 稳定性补强说明（本轮）
- 新增 `use-vision-runtime` 作为统一 runtime manager，集中管理 MediaPipe/OpenCV 初始化、状态机与错误恢复。
- MediaPipe/OpenCV warmup promise 均做并发去重；多组件并发 warmup 只跑一次实际初始化。
- `startCamera` 与 `prewarmVisionModels` 均复用 runtime manager，不再各自重复初始化链路。
- `stopCamera` 不销毁模型实例，避免反复 Start/Stop 的卡顿与重复 warmup。
- `resetVisionRuntime` 可清理卡死 promise 与 runtime 代次；`retryVisionRuntime` 用于失败后重试。
- 诊断面板覆盖 runtime / mediapipe / opencv / retryCount / warmupDuration / lastError，便于演示定位故障层。

## 演示步骤（5 分钟）
1. 打开主界面，展示“视觉交互”入口与 Vision Diagnostics，并等待 runtime 进入 ready/partial_ready。
2. Start Camera，说明 camera / permission / runtime / MediaPipe / OpenCV 状态。
3. 在 Subject-position response 区域切换 `minimal / balanced / expressive`，观察反馈强度变化。
4. 单人脸场景左右上下移动并回到中心，展示 contextual feedback 与 Live2D fallback 响应。
5. 暂时离开画面再返回，展示 `subject_absent / subject_returned` 反馈策略。
6. 保持一个方向稳定停留（约 7 秒），展示 dwell 反馈只触发一次且不刷屏。
7. 开启 Face Gate，演示 matched 才响应；unmatched/multiple_faces/no_face/locked 为 gated。
8. 再做 `open_palm`、`victory`、`thumbs_up`，展示手势反馈仍为可选实验路径。
9. 在录入页展示加密档案、解锁、Delete Profile（带确认）与删除后状态复位，并演示 Retry/Reset Runtime。

## EMFILE 风险与 Workaround
- 建议先提升文件句柄上限再启动 dev：

```bash
ulimit -n 65536
pnpm dev:tamagotchi
```

- 如仍触发 watcher 相关失败，优先使用 `vitest run` 与定向命令做验证，不把该类环境问题误判为视觉模块回归。

## 真实环境验收建议（补足 mock 边界）
- 在可用摄像头设备上做一次手动权限验收：
  1. 首次点击 Start Camera，拒绝权限，确认 `cameraState=error` 且可再次重试。
  2. 再次点击 Start Camera 并允许权限，确认 `cameraState=active`。
- 在同一环境执行一次模型预热验收：
  1. 点击预热视觉模型，确认 `MediaPipe=ready` 或明确 `failed` 文案。
  2. 多次快速点击预热按钮，确认不会出现 `ModuleFactory already declared`。
- Live2D 反馈仍以“store/composable 集成路径测试”为主；模型资产级 E2E 需在带真实 model 资源的桌面环境单独验收。
