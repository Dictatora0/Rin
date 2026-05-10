# `feature/vision-interaction-experiment` 分支进度记录（2026-05-07）

## 1. 当前分支与工作区状态

- 分支：`feature/vision-interaction-experiment`
- 当前 `HEAD`：`9fc699d3 chore: unify zh-cn terminology for vision gate ui`
- 远端基线：`origin/feature/vision-interaction-experiment` 在 `3b67a4ed`
- 工作区状态：存在未提交改动（`git status --short` 显示 10 个已修改文件 + 1 个未跟踪目录）

未提交改动文件：

- `apps/stage-tamagotchi/electron.vite.config.ts`
- `apps/stage-tamagotchi/src/main/services/electron/app.test.ts`
- `apps/stage-tamagotchi/src/main/services/electron/app.ts`
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`
- `apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts`
- `apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts`
- `apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts`
- `apps/stage-tamagotchi/src/renderer/pages/index.vue`
- `apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue`
- `apps/stage-tamagotchi/src/shared/eventa/index.ts`
- `apps/stage-tamagotchi/src/renderer/public/assets/vision/`（未跟踪）

## 2. 本轮已完成的核心改动

### 2.1 本机“记住并自动解锁”能力（无感解锁）

- 新增 Eventa IPC 合约（secure store set/get/delete）：
  - `apps/stage-tamagotchi/src/shared/eventa/index.ts`
- 主进程新增安全存储处理（`electron.safeStorage` + 本地配置存储）：
  - `apps/stage-tamagotchi/src/main/services/electron/app.ts`
- 新增主进程单测覆盖 secure store 读写删：
  - `apps/stage-tamagotchi/src/main/services/electron/app.test.ts`
- 渲染层接入自动解锁逻辑、记住开关、可用性探测与失败兜底清理：
  - `apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts`
  - `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`
  - `apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue`

### 2.2 视觉推理时间戳单调性与诊断日志

- 增加单调时间戳生成逻辑，避免回退时间戳：
  - `nextMonotonicInferenceTimestampMs(...)`
- 开发环境增加每帧推理时间戳日志：
  - 日志关键字：`[vision] inference timestamp`
  - 输出字段：`frameTimestampMs`、`previousTimestampMs`、`deltaMs`、`isMonotonic`
- 增加 timestamp mismatch 自动恢复流程（冷却时间 + recognizer 重建）：
  - 错误识别关键字：`packet timestamp mismatch` / `minimum expected timestamp`

### 2.3 手势识别与门控可观测性增强

- 新增手势调试日志（开发环境）：
  - `raw gesture sample`
  - `open_palm|victory|thumbs_up blocked by gate`
  - `open_palm|victory|thumbs_up accepted`
  - 前缀：`[vision][gesture]`
- 新增门控状态同步与锁定状态表达，减少“状态显示已解锁但交互被拦截”的排障盲区。

### 2.4 “关闭摄像头未真正关闭”修复

- 引入流生命周期 token、跟踪 `MediaStream` 集合、显式停止所有已跟踪 track：
  - `streamLifecycleToken`
  - `trackedCameraStreams`
- `stop()`/`stopTracks()` 强化清理，防止异步竞态导致旧流残留。
- 新增相关诊断日志：
  - `[vision] camera stream stopped`
  - `[vision] video track ended`

### 2.5 模型预热与资源可用性

- 增加视觉模型预热按钮与状态展示（Vision Island）。
- 增加本地模型/wasm 构建前校验插件：
  - `proj-airi:verify-local-vision-assets`
  - 文件：`apps/stage-tamagotchi/electron.vite.config.ts`
- 当前未跟踪本地资源目录（需确认是否纳入版本管理）：
  - `apps/stage-tamagotchi/src/renderer/public/assets/vision/models/*`
  - `apps/stage-tamagotchi/src/renderer/public/assets/vision/wasm/*`

### 2.6 其他修复

- 修复 Vue 模板中 `import.meta.env.DEV` 直接写在模板表达式导致的编译错误：
  - 改为脚本内 `const isDev = import.meta.env.DEV` 后在模板使用。
  - 涉及文件：
    - `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`
    - `apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue`
- `use-opencv-face-quality` 初始化并发与回退策略优化，降低初始化抖动导致的异常。
- 主页面卸载时 runtime channel 发送增加 `tryCatch` 包裹，减少退出时噪音报错。

## 3. 当前关键日志关键词（回查用）

可在 DevTools Console 里按关键词筛选：

- `[vision] inference timestamp`
- `[vision][gesture] raw gesture sample`
- `[vision][gesture] open_palm blocked by gate`
- `[vision][gesture] victory blocked by gate`
- `[vision][gesture] thumbs_up blocked by gate`
- `[vision][gesture] open_palm accepted`
- `[vision][gesture] victory accepted`
- `[vision][gesture] thumbs_up accepted`
- `[vision] inference error`
- `[vision] camera stream stopped`
- `[vision] video track ended`

## 4. 已知风险与待确认项

- 手势“精度下降”目前仅通过参数节流与日志增强处理，尚未完成一次系统性回归比对。
- 安全存储依赖 Electron 平台能力；不可用时会降级并提示，需确认目标系统行为是否符合预期。
- 本地视觉模型资源目录处于未跟踪状态，切分支前后可能丢失或不一致，需确认是否提交/迁移。
- 当前尚未完成针对“关闭摄像头必停流”的自动化回归测试（目前主要是运行期修复 + 诊断日志）。

## 5. 回到该分支后的建议执行顺序

1. 先确认资源：`apps/stage-tamagotchi/src/renderer/public/assets/vision/` 文件完整。
2. 启动：`pnpm dev:tamagotchi`。
3. 在 Vision Island 先点“预热视觉模型”，再开启摄像头。
4. 验证“关闭摄像头”后是否不再出现活跃视频轨道（结合 `[vision] camera stream stopped` 与 track ended 诊断）。
5. 验证“首次手动解锁 + 勾选记住”后重启是否自动解锁；再测试手动关闭自动解锁。
6. 用 `[vision] inference timestamp` 快速确认 `isMonotonic` 始终为 `true`。
7. 对比三个手势在相同光照/距离下命中率，必要时再调 `GESTURE_INFERENCE_INTERVAL_MS` 与稳定帧阈值。

## 6. 参考验证记录（本轮）

- `pnpm -F @proj-airi/stage-tamagotchi typecheck`：此前回合已通过。
- `pnpm -F @proj-airi/stage-tamagotchi exec vitest run src/main/services/electron/app.test.ts`：此前回合已通过（覆盖 secure store 读写删）。
- 全量 lint 仍有仓库范围既有问题（非本次变更独立引入），未在本次一起清理。

