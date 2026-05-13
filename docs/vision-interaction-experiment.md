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

## 可用性修整（默认界面 + 恢复建议）

- Vision Island 默认视图调整为“用户状态面板”，默认只展示：
  - 摄像头
  - 主体状态
  - 人脸门控
  - 最近反馈
  - 为什么 Rin 没响应（恢复建议）
  - 开启/关闭摄像头、打开人脸录入页

- 诊断字段未删除，统一折叠到 `Advanced / Diagnostics`，包括但不限于：
  - `faceCenter`
  - `subjectPosition`
  - `stableSubjectPosition`
  - `subjectResponseState`
  - `petSubjectResponseState`
  - `subjectResponseGate`
  - `lastSubjectResponseEvent`
  - runtime raw status / templateId / channels / variant / cooldown
  - expression signal confidence / source / reason
  - gesture debug 字段

- 新增“为什么 Rin 没响应？”自然语言恢复建议卡：
  - `camera off`：提示开启摄像头
  - `runtime failed`：提示重试视觉运行时
  - `no_face`：提示靠近摄像头并保持单人入镜
  - `multiple_faces`：提示仅保留当前用户
  - `locked / profile locked`：提示打开录入页并解锁本地资料
  - `unmatched`：提示使用已录入用户或重新录入
- 状态正常时：显示 `Rin 可以响应当前主体`

### 可解释性增强（Round 12）

- Vision Island 默认视图新增三块用户导向能力：
  - `视觉自检`：一键输出当前可用性报告（纯函数驱动）。
  - `为什么 Rin 没响应？`：显示最关键的 1～3 条阻塞原因（纯函数驱动）。
  - `最近反馈`：展示 Rin 最近感知到的反馈记录，支持清空。

- 视觉自检与解释卡均不直接读取 store 或操作 DOM：
  - `vision-self-check.ts` 只根据传入状态生成 `overall / summary / items / primaryAction`。
  - `vision-response-explainer.ts` 只根据传入状态生成自然语言解释与建议动作。

- 最近反馈历史由 `use-vision-pet-feedback.ts` 维护：
  - 内存队列最多 20 条（不持久化）。
  - 默认视图显示最近 3～5 条，支持“查看更多/清空历史”。
  - 连续相同 message 自动跳过，避免刷屏。
  - 门控拦截事件会转换为自然中文文案（例如“已检测到主体，但当前门控未通过。”）。

- 默认视图继续保持“用户任务优先”，不回退为诊断面板：
  - 默认只显示自然中文状态与动作建议。
  - `runtimeStatus raw / MediaPipe/OpenCV raw / templateId / channels / faceCenter raw / directionScores / directionDistribution 详细值` 继续留在高级诊断折叠区。

## 人脸录入页信息架构重构（Round 10）

- 人脸录入页从“技术字段平铺”重构为“用户向导优先”的结构，按以下顺序呈现：
  - 顶部说明区
  - 当前状态卡片
  - 四步录入向导
  - 已有档案状态区
  - 高级录入参数（默认折叠）
  - 诊断详情（默认折叠）
  - 危险操作
  - 简洁隐私说明

- 面向普通用户的默认信息：
  - 摄像头状态
  - 模型就绪状态
  - 人脸档案状态
  - 人脸门控状态
  - 采样进度与自然语言质量提示
  - 启用/关闭门控与本地档案操作

- 默认隐藏开发诊断字段：
  - `runtimeStatus` / `runtimeWarmup` / `retryCount`
  - `MediaPipe` / `OpenCV` raw 状态
  - 摄像头诊断日志与轨道结束统计
  - 亮度/清晰度/对比度/人脸尺寸等 raw 指标

- 折叠策略：
  - “高级录入参数”默认折叠，仅在用户展开后显示阈值与采样参数。
  - “诊断详情”默认折叠，保留完整排障能力与运行环境重试/重置按钮。

- 危险操作隔离：
  - 锁定档案、重新录入、删除档案归入独立危险操作区。
  - 删除档案保留二次确认，避免误删。

- 隐私与数据边界：
  - 人脸档案仅本机加密保存，不上传摄像头数据。
  - 口令仅用于本地解锁，不持久化保存。

### 状态字段中文化与折叠策略（Round 5）

- 默认视图坚持“用户可理解状态”：
  - 摄像头
  - 主体状态
  - 人脸门控
  - 最近反馈
  - 恢复建议
- 默认界面不直接暴露 raw key（例如 `cameraState`、`faceGate`、`templateId`、`channels` 等）。
- 技术字段保留在 `Advanced / Diagnostics`，用于专家排障与实验验证。
- 文案统一走 `vision-status-labels.ts` 映射层，避免在模板里散落硬编码判断。

## 与 Controls 的解耦（Floating Panel）

- Controls Island 仅保留视觉入口，不再嵌入 Vision Island 的完整内容。
- 点击视觉入口后，Vision Island 渲染在独立 renderer 浮动面板（`StageFloatingPanel`）中。
- 面板关闭语义为“只关闭 UI”：
  - 不强制 `Stop Camera`
  - 不重置 runtime
  - 不关闭 Face Gate
  - 不清空最近反馈状态
- 视觉入口状态拆分：
  - `visionPanelOpen`：表示面板是否打开
  - `visionCameraRunning`：表示摄像头是否运行（用于入口状态点提示）
- 这样可以减少 Controls 内部拥挤与滚动冲突，同时保留视觉功能连续性。

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

### 中立位置校准（Round 11）
- 新增“主体位置校准”入口：
- 在 Vision Island 可点击“校准当前坐姿”，将当前 `faceCenter` 记为 `subjectNeutralCenter`。
- 校准状态会本地持久化，重启后仍可复用；未校准时回退默认中心 `{ x: 0.5, y: 0.5 }`。
- 无人脸时会拒绝校准并提示“请先让摄像头检测到你。”。

### 方向判定算法（Round 11）
- 不再仅使用固定画面中心做方向判定，改为基于校准中心的相对偏移：
- `dx = faceCenter.x - neutralCenter.x`
- `dy = faceCenter.y - neutralCenter.y`
- 引入 enter/exit hysteresis 阈值与轴向优势比：
- `directionEnterThresholdX/Y`
- `directionExitThresholdX/Y`
- `directionAxisDominanceRatio`
- 当 `dx/dy` 两轴都接近且优势不足时标记为 `ambiguous`，不触发强反馈，避免方向抖动。
- 输出诊断数据 `directionScores`（`scoreX/scoreY/confidence/ambiguous`）用于调参。

### 最近方向分布（Round 11）
- 新增最近窗口方向统计（默认 60 秒）：
- 居中 / 偏左 / 偏右 / 偏上 / 偏下 / 不确定
- 在高级诊断中可查看，用于确认是否存在长期偏向 `left/down`。

### 灵敏度调优（第二轮）
- 主体位置 dead zone 调整为更灵敏：
- `directionDeadZoneX: 0.09`
- `directionDeadZoneY: 0.10`
- 主体位置稳定帧与表情信号稳定帧解耦：
- 主体位置响应稳定帧默认 `2` 帧。
- 面部动作信号稳定帧继续保持 `5` 帧（保守触发）。
- UI 状态更新与强反馈冷却分离：
- `faceDirection / subjectPosition` 会尽快更新。
- bubble / toast / motion 仍受 cooldown 与 gate 约束。
- `looking_away_signal` 不再抢占方向事件：
- away duration 在 `left/right/up/down` 方向切换时会重置。
- 方向刚变化后的短窗口内不会立即触发 `looking_away_signal` 强反馈。
- `no_face` 时会清空旧稳定方向：
- `subjectPosition` 与 `lastStableSubjectPosition` 回到 `unknown`，避免继续显示旧 `left/right/down`。

### 为什么不是严格视线测量
- 模块仅根据主体在人脸框中的相对位置做“主体位置反馈”。
- 不做瞳孔级别或视线向量级别估计，不做 eye tracking。
- 目标是自然交互演示，而非严格视线测量。

### Contextual Vision Feedback Engine
- v2 语料不再是 `string[]`，而是结构化模板：
- `VisionFeedbackTemplate = { id, text, namedText?, level, intensities, channels, cooldownMs?, tags? }`
- selector 输出 `text + level + channels + cooldownMs + templateId + resolvedEventType`，可直接驱动 UI/Toast/Motion。
- 本地模板池在 `apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts`，全部离线可控，不调用 LLM/远程 API。
- 不使用 LLM 的原因：
- 需要 deterministic 可测试行为（支持 injected random）。
- 需要强约束 cooldown/优先级/gate，不允许生成式漂移。
- 需要保证隐私与低延迟，不上传视觉上下文。

### Bubble Channel（本地短气泡）
- `bubble` 不再只是 metadata；Vision Island 会渲染本地 transient bubble。
- bubble 只属于视觉实验模块，不写入主聊天会话历史。
- bubble 默认展示约 4 秒，自动消失；也可手动 clear。
- bubble 来源是 selector 选中的同一模板文本，不额外生成新文案。
- quiet mode / Face Gate 约束：
- quiet mode 下 normal/strong bubble 会被抑制，保留状态更新。
- gate blocked（unmatched/multiple_faces/locked/no_face 等）不显示正向 bubble。

### 事件类型（Base + Transition）
- Base events（13）：
- `subject_position_left/right/up/down/center`
- `subject_returned` / `subject_absent`
- `subject_gated` / `subject_matched` / `subject_uncertain`
- `subject_dwelled_left/right/center`
- Transition events（6）：
- `transition_absent_to_returned`
- `transition_uncertain_to_matched`
- `transition_gated_to_matched`
- `transition_multiple_faces_to_matched`
- `transition_matched_to_absent`
- `transition_matched_to_uncertain`
- transition 命中时优先于 base event（未命中回退 base），避免“只是方向变化就随机一句”的割裂感。

### Transition-First 策略
- 先解析状态过渡，再选模板，而不是先随机句子：
- `absent -> present` 优先 `transition_absent_to_returned`
- `uncertain -> matched` 优先 `transition_uncertain_to_matched`
- `gated/unmatched/locked -> matched` 优先 `transition_gated_to_matched`
- `multiple_faces -> matched` 优先 `transition_multiple_faces_to_matched`
- `matched -> absent/uncertain` 优先对应降级 transition
- 这样 returned/matched 类高价值反馈不会被高频方向噪声淹没。

### Feedback Intensity
- `minimal`：
- 主要更新状态，方向类事件尽量 UI-only，优先 subtle。
- 仅 returned/matched 等关键反馈允许轻提示。
- `balanced`（默认）：
- 默认 normal/subtle 混合，方向变化触发短反馈。
- returned/matched 与关键 transition 可提升到更高可见度。
- `expressive`：
- normal/strong 可用，回中与 dwell 反馈更积极。
- 仍受 cooldown、priority、gate、quiet mode 约束，不会刷屏。

### 模板去重与选择规则
- 同一 eventType 连续触发会避免相同 `templateId`；仅当候选唯一时允许重复。
- 支持 `recentTemplateIds` 最近窗口去重，不只避免上一条模板。
- `use-vision-pet-feedback` 会维护最近模板队列（默认 6 条），连续触发同类反馈时优先换模板。
- 支持 `displayName` 时优先 `namedText`，无名字回退 `text`，不会残留 `{name}` 占位符。
- 支持 `allowedChannels` 与 `preferredLevel` 过滤；若强度不允许则自动降级 level。
- 选择失败时回退到安全模板，不抛异常。

### Locale / Variant（轻量扩展）
- 模板新增：
- `localeText?: Partial<Record<'en' | 'zh-CN', { text; namedText? }>>`
- `variant?: 'default' | 'a' | 'b'`
- selector 支持 `locale` 与 `variant`：
- locale 只影响文本来源，不改变核心过滤逻辑；locale 缺失时 fallback 到默认 `text/namedText`。
- variant 优先匹配请求值，缺失时回退 `default` 与可用候选。
- 当前仅补少量中文示例（非全量翻译），用于验证结构与 fallback 规则：
- `transition_absent_to_returned`
- `subject_gated`
- `subject_position_center`
- `subject_matched`
- `subject_uncertain`

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

## Expression Signal / Face Motion Signal
- 本功能是本地视觉信号增强，不是情绪识别，不做心理/学习状态判断。
- 仅用于 Rin 本地外周反馈与 Vision Island 状态展示，不写入主聊天历史。
- 默认 `Enable Expression Signals = off`，用户可在 Vision Island 手动开启。

### 为什么不是 emotion recognition
- 我们只读取局部视觉变化（blendshape、画面稳定度、方向稳定性）。
- 只输出中性信号标签，不输出“开心/焦虑/疲劳/专注”等真实状态判断。
- UI 文案固定为 `Expression Signal / visual signal / smile-like signal` 语义。

### 信号来源
- `blendshape`：FaceLandmarker 的 `outputFaceBlendshapes` 本地输出。
- `quality`：现有 OpenCV/canvas 质量分数（`qualityScore`）。
- `position`：`facePresence + faceDirection + centered/away duration`。

### 支持信号
- `smile_like_signal`
- `stable_face_signal`
- `looking_away_signal`
- `unclear_face_signal`
- `low_confidence`

### 触发规则（本地纯函数 + 稳定帧）
- `smile_like_signal`：
- `mouthSmileLeft/right` 平均分 `>= 0.45`。
- `stable_face_signal`：
- `present + center + quality>=0.65 + centered>=3000ms`。
- `looking_away_signal`：
- `present + non-center + away>=5000ms`。
- `unclear_face_signal`：
- `presence unknown`，或 `quality<0.35`，或关键视觉输入缺失。
- `low_confidence`：
- 输入关键字段不足或无法形成可靠信号。
- 稳定化：同一候选信号需连续 5 帧一致才升级为 stable signal。

### 冷却与防打扰
- `smile_like_signal` 冷却 10 秒。
- `stable_face_signal` 冷却 12 秒。
- `looking_away_signal` 冷却 15 秒。
- `unclear_face_signal/low_confidence` 以 UI/subtle 为主，避免高频提示。
- quiet mode 下禁止 normal/strong 反馈。

### Face Gate 约束（Expression Signal）
- 允许反馈：`gate disabled` 或 `gate enabled + matched`。
- 禁止反馈：`unmatched / no_face / multiple_faces / locked / gated`。
- 多人脸场景显示被阻断状态，不触发 Rin motion/expression/bubble。
- gated/quiet 约束在 interaction 层与 pet-feedback 层都会再检查一次。

### 隐私说明
- 全部本地处理，不上传表情或摄像头数据。
- 不调用云端视觉 API，不调用 LLM。
- 不用于权限、评分、分类或自动决策。

### 演示建议
1. 打开 Vision Island，开启 `Enable Expression Signals`。
2. 在单人脸 matched 状态下展示 smile-like signal。
3. 持续偏离中心展示 looking-away signal。
4. 切到 multiple_faces / locked，确认信号可见但 Rin 反馈被阻断。

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
- Face Gate 在 `unmatched / no_face / multiple_faces / locked` 时会拦截正向反馈。
- expression signal 是保守触发策略，不追求高频提示。
- 目前自动化测试仍使用 deterministic mock，不包含“真实摄像头权限弹窗 + 真实驱动 + 真实模型资产”的完整 E2E。
- 该门控不是安全级认证，仅用于实验交互约束。
- `EMFILE` 通常是 dev watcher 环境问题，不是视觉逻辑故障。

## Vision Island 指标本地化（第二轮）
- 用户可见状态字段改为自然简体中文（运行状态 / 主体位置反馈 / 面部动作信号）。
- 主体位置反馈区不再展示技术 key（如 `subjectResponseState`），改为语义化标签。
- `matchedUser` 展示改为状态感知：
- `matched + present` 显示“当前用户”。
- `no_face / unmatched / locked` 显示“已录入用户”，避免误导为当前实时匹配。
- `looking_away` 文案改为自然表达，避免 “away-from-center signal stayed active” 这类技术化提示。

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
