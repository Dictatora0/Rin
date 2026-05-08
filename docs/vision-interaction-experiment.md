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

## 手势语义
- `open_palm`: quiet Rin temporarily
- `victory`: celebrate completed moment
- `thumbs_up`: acknowledge current prompt

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

## 手动测试 Checklist
- 冷启动：进入主界面，Vision Island 可打开，默认摄像头关闭。
- Start Camera：摄像头状态变为 active。
- Stop Camera：状态回到 off，摄像头轨道释放。
- 未开启 gate：三类手势可触发反馈。
- 开启 gate 且未解锁：手势被 gated，显示 detected but gated。
- 录入 profile：单人脸、质量合格时可录入成功。
- 刷新后解锁：需要 passphrase 才能恢复 unlocked。
- matched 手势反馈：gate enabled + matched 时触发 pet feedback。
- multiple_faces：状态进入 locked/multiple_faces，禁止反馈。
- Delete Profile：确认后清空档案，状态回到未录入。
- 权限拒绝恢复：拒绝权限后显示 error，再次允许后可重试 Start Camera。
- Stop Camera 资源释放：track stop 计数与诊断信息更新。

## 已知限制
- 光照极暗/极亮会降低质量评分。
- 侧脸或大角度会影响稳定匹配。
- 多人脸场景默认锁定，不做身份放行。
- MediaPipe/OpenCV wasm 首次加载可能受本地环境影响。
- 目前自动化测试仍使用 deterministic mock，不包含“真实摄像头权限弹窗 + 真实驱动 + 真实模型资产”的完整 E2E。
- 该门控不是安全级认证，仅用于实验交互约束。
- `EMFILE` 通常是 dev watcher 环境问题，不是视觉逻辑故障。

## 稳定性补强说明（本轮）
- MediaPipe 预热链路改为统一走 `FilesetResolver.forVisionTasks`，不再手工拼接 wasm loader 路径，降低重复注入 `vision_wasm_internal.js` 引发 `ModuleFactory already declared` 的风险。
- 预热并发行为已加回归测试：并发触发 prewarm 时只应执行一次初始化。
- 诊断面板已覆盖 camera permission / MediaPipe / OpenCV / face profile / face gate / lastError，便于现场定位是权限层、模型层还是门控层失败。

## 演示步骤（5 分钟）
1. 打开主界面，展示“视觉交互”入口与 Vision Diagnostics。
2. Start Camera，说明 camera / permission / MediaPipe / OpenCV 状态。
3. 依次做 `open_palm`、`victory`、`thumbs_up`，展示 Rin 形象反馈。
4. 开启 Face Gate，演示未解锁或多脸时“detected but gated”。
5. 在录入页展示加密档案、解锁、Delete Profile（带确认）与删除后状态复位。

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
