# 基于 AIRI/Rin 的低打扰学习陪伴桌宠系统

## 结论
最稳、最像 HCI 课程项目、也最适合 8 天落地的路线，不是把 AIRI/Rin 做成“大而全学习助手”，而是做成一个“低打扰、外周感知、可自我管理”的桌宠学习陪伴层：用现有 Live2D 舞台、角色卡、Stage 情绪动作链路和 Electron 窗口/托盘能力，新增一个本地优先的学习状态机，把“专注计时 + 轻任务清单 + 低打扰提醒 + 正反馈 + 可导出日志”串起来。主线尽量留在渲染层和 `stage-ui` 共享 store，少碰主进程；手势、原生通知、复杂 LLM 行为都不要做成核心依赖。

这一步我只做了真实代码审查，没有改文件。关键依据主要来自：

- `apps/stage-tamagotchi/src/renderer/pages/index.vue`
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue`
- `apps/stage-tamagotchi/src/main/tray/index.ts`
- `apps/stage-tamagotchi/src/main/windows/main/index.ts`
- `packages/stage-ui/src/components/scenes/Stage.vue`
- `packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue`
- `packages/stage-ui/src/stores/modules/airi-card.ts`
- `packages/stage-ui/src/stores/chat/session-store.ts`
- `packages/stage-pages/src/pages/settings/airi-card/index.vue`
- `apps/stage-tamagotchi/electron.vite.config.ts`

## 一、代码审查结论

### 1. 当前 `stage-tamagotchi` 已有桌宠能力

- 已有透明无边框主窗体。
- 已有常驻置顶、托盘、窗口拖拽。
- 已有 Windows 缩放边。
- 已有点击穿透和 hover fade。
- 已有主舞台 `WidgetStage`。
- 已有控制岛和状态岛。
- 已有设置窗、聊天窗、字幕窗、notice/widgets 窗。
- 主舞台页已经把这些组合起来。

### 2. 当前 `stage-ui` / `stage-ui-live2d` 已有角色反馈能力

- 已有 Live2D / VRM 模型切换。
- 已有预置模型。
- 已有鼠标视线跟随。
- 已有口型同步。
- 已有 idle / blink / expression / shadow。
- 已有 `ACT` 情绪 token 到 Live2D motion / VRM expression 的映射。
- 已有发送消息前 `Think` 动作。
- 已有背景图层。
- 已有角色卡系统。
- 已有按角色卡分离会话。

### 3. 最适合放学习功能的位置

- 共享业务状态最适合放 `packages/stage-ui/src/stores/modules/`。
- 桌宠主交互最适合放 `apps/stage-tamagotchi/src/renderer/components/stage-islands/`。
- 桌宠专属设置页最适合放 `apps/stage-tamagotchi/src/renderer/pages/settings/`。
- 角色 persona 优先复用现有 `packages/stage-pages/src/pages/settings/airi-card/`。

### 4. 哪些适合写成独立 store / composable / component

- 适合新建一个独立学习 store。
- 把倒计时、提醒节流、Live2D 状态映射拆成 composable。
- 把主舞台上的学习面板做成独立 island component。
- 把完整设置和统计做成 settings page。

### 5. 哪些会牵涉主进程 IPC / Electron API

- 托盘新增学习入口会牵涉主进程。
- 如果要新 dashboard 窗口，会牵涉主进程。
- 如果要原生通知，会牵涉主进程。
- 如果要全局快捷键，会牵涉主进程。
- 如果要摄像头 / 权限提示，会牵涉 Electron API。
- 纯计时、任务、toast、统计、JSON 导出都可以只在渲染层完成。

### 6. 8 天内应明确放弃什么

- 新 Live2D 形象 / 动作资源。
- 复杂手势主线。
- 云同步。
- 依赖 LLM 的智能提醒主流程。
- 独立 dashboard 窗口重构。
- 复杂 Todo / 日历系统。
- 现有 `notice` 窗口是大弹窗式引导，不适合拿来做“低打扰提醒”。

## 二、从 HCI 目标出发的功能规划

| 方向 | 痛点 / 交互价值 | 为什么适合桌宠 | 代码结合点 | 工作量 / 风险 | 演示 / 报告价值 | 优先级 |
|---|---|---|---|---|---|---|
| Rin 学习陪伴 persona / 角色卡 | 默认 AIRI 设定偏通用，可能啰嗦、偏聊天，不够“陪学” | 桌宠的人格设定本来就是外周交互入口 | `airi-card.ts`、`session-store.ts`、`settings/airi-card` 页面 | 低到中；静态 persona 很稳，动态“学习状态语义注入”会升风险 | 很高 | A |
| 番茄钟 / 专注计时 | 学生缺少轻量专注节奏和中断边界 | 桌宠天生适合做常驻状态物 | 主舞台 island + 新 study store + `useLive2d().currentMotion` | 中；风险低 | 很高 | A |
| 今日任务清单 | 学习任务容易散、忘、缺正反馈 | 桌宠做“轻监督”和完成奖励很自然 | 新 store；不要直接复用 `character-notebook` 做主存储 | 中；风险低 | 很高 | A |
| 低打扰提醒策略 | 普通提醒容易烦、打断流 | 桌宠适合用情绪 / 小提示做 peripheral feedback | 全局 `Toaster`、主舞台 island、motion 映射 | 中；风险中低 | 很高，最像 HCI | A |
| 学习状态 / 日志面板 | 没有自我反馈就难写报告，也难评估效果 | 桌宠不是只卖萌，要有可解释的行为结果 | settings page + `useDownload` + 本地日志 | 中；风险低 | 很高 | B |
| 手势控制实验 | 有新意，但容易偏“炫技”而非主线 | 适合做彩蛋，不适合当主交互 | 仓库有 `model-driver-mediapipe`，但现在主要停在 workshop/devtools | 高；风险高 | 有展示性，但不稳 | C |
| 桌面窗口交互增强 | 用户需要更快开关专注、静音、查看统计 | 桌宠是常驻桌面的，入口可见性很重要 | `controls-island`、`tray/index.ts`、已有窗口 IPC | 低；风险低 | 高 | B |
| 可用性测试支持 | 课程报告需要证据，不只是“看起来能用” | 日志本身就是交互设计的一部分 | 本地事件日志 + JSON 导出 | 低到中；风险低 | 很高 | B |

## 三、功能优先级

### A. 必做 MVP

- 学习 companion persona。
- 番茄钟。
- 轻任务清单。
- 低打扰提醒策略。

### B. 强展示功能

- 今日统计 / 活动日志。
- 托盘 / 控制岛学习入口。
- 可导出 JSON 的评估支持。

### C. 可选加分

- 默认关闭的手势控制实验，只做 2 到 3 个手势，只在时间非常充裕时做。

### D. 明确不做

- 新 Live2D 美术 / 模型。
- 复杂日历 / Todo。
- 依赖在线 LLM 的主动学习教练。
- 独立 dashboard 窗口重构。
- 云同步。

## 四、重点方向判断

### 1. Rin 学习陪伴 persona / 角色卡

- 适合加入。
- 建议用单独 study card，不要覆盖默认 AIRI 卡。
- 重点包括：
  - 低打扰学习陪伴设定。
  - 回复短句化。
  - 学习状态语义。
  - 不破坏默认 AIRI 配置。
- 优先级：A。

### 2. 番茄钟 / 专注计时

- 非常适合加入。
- 最适合做成主线核心状态机。
- 重点包括：
  - 开始、暂停、重置。
  - 专注 / 休息切换。
  - 与 Live2D 情绪或动作联动。
  - 本地持久化。
- 优先级：A。

### 3. 今日任务清单

- 适合加入。
- 但要做成轻量版，不做复杂 Todo。
- 重点包括：
  - 新增任务。
  - 完成任务。
  - 删除任务。
  - 完成任务触发角色正反馈。
- 优先级：A。

### 4. 低打扰提醒策略

- 非常适合加入。
- 这是最能体现 HCI 价值的部分之一。
- 重点包括：
  - 专注期间减少主动打扰。
  - 休息时轻提醒。
  - 静音一段时间。
  - 提醒频率控制。
  - 提醒文案短句化。
- 优先级：A。

### 5. 学习状态面板 / 日志面板

- 适合加入。
- 很适合支撑课堂演示和报告写作。
- 重点包括：
  - 今日专注轮数。
  - 今日完成任务数。
  - 累计专注分钟。
  - 提醒次数。
  - 简单导出 JSON 或调试面板。
- 优先级：B。

### 6. 手势控制实验功能

- 不适合做主线。
- 仓库里虽然有 `model-driver-mediapipe` 和 devtools/workshop，但没有稳定接到桌宠主舞台主流程。
- 如果做：
  - 默认关闭。
  - 用户手动开启摄像头。
  - 只做 2 到 3 个手势。
  - 必须防抖。
- 但建议只做加分实验，不进入最小验收。
- 优先级：C。

### 7. 桌面窗口交互增强

- 适合加入。
- 最稳的是：
  - 更清晰的置顶 / 穿透 / 拖拽 / 缩放控制。
  - 托盘菜单增加学习功能入口。
  - 快速进入学习设置页。
- 不建议在 8 天内额外起新学习 dashboard 窗口。
- 优先级：B。

### 8. 可用性测试支持

- 很适合加入。
- 建议内置简单交互日志。
- 建议记录：
  - 开始专注。
  - 暂停 / 继续。
  - 完成任务。
  - 静音提醒。
  - 提醒触发。
- 用于报告中的 HCI 评估非常合适。
- 优先级：B。

## 五、最终推荐方案

### 1. 项目定位

这是一个基于 AIRI/Rin 现有桌宠架构改造的“低打扰学习陪伴桌宠系统”。它不是另一个聊天助手，而是一个常驻桌面的、以外周感知和轻反馈为主的学习伙伴：在用户专注、休息、完成任务和静音之间维持可见但不过度打扰的状态反馈，并为课程报告提供可导出的交互数据。

### 2. 核心功能列表

| 核心功能 | 实现落点 |
|---|---|
| 1. 独立的 Rin 学习陪伴 persona | `packages/stage-ui/src/stores/modules/airi-card.ts`、`packages/stage-pages/src/pages/settings/airi-card/*`、必要时 `packages/stage-ui/src/constants/prompts/system-v2.ts` 与 `packages/i18n/src/locales/*/base.yaml` |
| 2. 专注 / 休息番茄钟状态机 | `packages/stage-ui/src/stores/modules/study-companion.ts` |
| 3. 主舞台 Study Island 快捷面板 | `apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/*`、`apps/stage-tamagotchi/src/renderer/pages/index.vue` |
| 4. 轻量今日任务清单 | 同一个 `study-companion` store；完整管理页放 `apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue` |
| 5. 低打扰提醒与静音策略 | `apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy.ts`，复用 `vue-sonner` 与主舞台状态 |
| 6. Live2D 学习状态反馈 | `apps/stage-tamagotchi/src/renderer/composables/use-study-stage-feedback.ts`，消费 `useLive2d().currentMotion`，不改底层渲染器 |
| 7. 今日统计 / 活动日志 / JSON 导出 | `study-companion` store + `apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue`，导出可复用 `packages/stage-ui/src/composables/download.ts` |

### 3. 数据设计

| 数据设计 | 推荐方案 |
|---|---|
| 主状态 | `mode: idle/focus/break/paused`、`endsAt`、`remainingMs`、`focusMinutes`、`breakMinutes`、`cycleCount`、`mutedUntil`、`lastReminderAt` |
| 任务状态 | `tasks: { id, title, done, createdAt, completedAt }[]`，只做今天清单，不做项目 / 标签 / 优先级大系统 |
| 统计状态 | `dayKey`、`todayFocusSessions`、`todayFocusMinutes`、`todayCompletedTasks`、`todayReminderCount` |
| 日志状态 | `events: { id, type, at, payload }[]`，记录 `start_focus`、`pause_focus`、`finish_focus`、`add_task`、`complete_task`、`mute_reminders` 等 |
| 持久化 | 以 `Pinia + useLocalStorageManualReset` 为主；不需要 IndexedDB。现有项目把二进制模型放 `localforage`，但学习数据很轻，localStorage 更稳更快。 |
| persona 隔离 | 不改默认 AIRI 卡；新增单独 study card。`session-store` 已按 `activeCardId` 分离会话，所以不会污染默认对话。 |

### 4. 事件流设计

#### 用户开始专注

- 用户点击开始专注。
- `study-companion` 切到 `focus`，写入 `endsAt`。
- `use-study-stage-feedback` 把 Live2D 切到 `Think` / `Curious` 一类动作。
- `use-study-reminder-policy` 进入“抑制主动提醒”模式。

#### 用户完成任务

- store 标记 `done`。
- 统计 `todayCompletedTasks + 1`。
- 写日志。
- 触发一次 `Happy` 动作和短 toast。
- 回到当前专注或休息状态。

#### 专注结束

- store 从 `focus` 转 `break-ready` 或 `break`。
- 触发一次轻提醒和状态动作。
- 用户在 Study Island 里选“休息 5 分钟”或“继续下一轮”，而不是弹大窗。

#### 用户静音提醒

- store 写入 `mutedUntil`。
- reminder policy 在时段内不再发 toast / 打断，只保留面板状态提示。

### 5. 8 天实施排期

| Day | 当天目标 | 建议 commit |
|---|---|---|
| Day 1 | 把代码骨架摸清、定状态机、定 UI 入口、同时开始报告大纲 | `docs: outline study companion scope and HCI rationale` |
| Day 2 | 实现 study store、计时状态机、本地持久化 | `feat: add study companion store and local persistence` |
| Day 3 | 接主舞台 Study Island，完成开始 / 暂停 / 重置 / 休息切换 | `feat: add focus timer controls on tamagotchi stage` |
| Day 4 | 加今日任务清单和完成反馈 | `feat: add lightweight study task list` |
| Day 5 | 做低打扰提醒策略、静音、Live2D 状态联动；当天必须开始写报告正文 | `feat: connect study states to reminder policy and Live2D feedback` |
| Day 6 | 做统计 / 活动日志 / JSON 导出；补 settings 页面；锁定 MVP | `feat: add study stats panel and activity export` |
| Day 7 | Buffer 日；修集成问题；录屏；做 2 到 3 人快速可用性试用 | `feat: add study entry to controls island and tray` |
| Day 8 | 只修 bug，不再扩功能；完成最终报告、演示视频、答辩稿 | `docs: finalize HCI report and demo script` |

### 6. 代码提交计划

1. `feat: add Rin study companion preset card`
2. `feat: add study companion store and local persistence`
3. `feat: add focus timer state machine`
4. `feat: add study island quick controls`
5. `feat: add lightweight daily task list`
6. `feat: connect study states to Live2D feedback`
7. `feat: add low-interruption reminder and mute policy`
8. `feat: add study stats and JSON activity export`
9. `docs: add HCI design rationale and evaluation notes`

### 7. 风险评估

| 主要风险 | 最可能怎么失败 | 规避方案 |
|---|---|---|
| 原项目结构复杂 | 改动范围一路扩到 chat / context / plugin / window | 把主线锁在“一个新 store + 一个主舞台 island + 一个 settings 页”；不要把学习状态接进 server channel 主流程 |
| Live2D 动作映射不稳 | 不同模型 motion 名不一致，`setMotion` 可能失败 | MVP 只保证 Hiyori 预置模型演示；失败时 fallback 到 `Idle`，不要承诺所有模型一致 |
| 主进程 / IPC 风险 | 为了小功能引入新窗口、新 IPC，时间被吃掉 | 核心功能尽量 renderer-only；主进程只做托盘入口，不做原生通知主链路 |
| 手势识别风险 | 摄像头权限、性能、抖动、误触发 | 只当 C 级实验；默认关闭；不进验收标准；不和主 store 强耦合 |
| LLM / API 风险 | persona 或主动提醒依赖外部模型，演示时失效 | 核心提醒、任务反馈、专注状态全部规则驱动；LLM 只作为 persona 加分，不是主验收条件 |
| TTS 风险 | 默认 `speech-noop`，做了“会说话”却演示不出来 | 核心反馈以 motion + toast + 面板为准，不把语音播报写进最小验收 |
| 报告太晚 | 第 7 天才开始写，最后只能拼截图 | Day 5 必须开始写；Day 7 必须开始录屏和做用户试用 |

### 8. 最小验收标准

- 打开 `pnpm dev:tamagotchi` 后，桌宠主舞台能正常出现，Study Island 可见。
- 用户能开始一轮专注、暂停、恢复、重置，并看到状态变化被持久化。
- 专注 / 休息切换时，Rin 至少有 1 种稳定可见的动作或情绪反馈。
- 用户能新增、完成、删除今日任务，并在完成时收到正反馈。
- 用户能在设置页或面板里看到今日专注轮数、完成任务数、累计专注分钟，并导出一份 JSON 日志。

### 9. 明确不要做什么

- 不做新 Live2D 形象、动作资源制作、2D 美术替换。这不适合 8 天，也会把工作量从 HCI 转成美术。
- 不做完整手势主交互。仓库虽然有 `model-driver-mediapipe`，但目前更接近 workshop/devtools，不适合做核心依赖。
- 不做依赖在线 LLM 的“智能督学”主流程。课程演示需要可控性，规则驱动更稳。
- 不做复杂 Todo / 日历 / 课程表系统。你们要的是“学习陪伴层”，不是另起一套生产力软件。
- 不做独立 dashboard 窗口主线。仓库里虽然有 `dashboard` 窗口骨架，但主页面还只是占位，接它会把主进程工作量拉高。
