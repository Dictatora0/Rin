# Rin 桌宠只读审查与迭代规划

**Session ID:** ses_1ea1911baffenFwNvlK4sdP6ed
**Created:** 5/11/2026, 3:18:36 PM
**Updated:** 5/11/2026, 3:27:20 PM

---

## User

你现在在本地仓库工作：

/Users/lifulin/Downloads/Rin


任务目标：
请对当前 Rin 桌宠项目做一次“只读型产品迭代审查”。重点扫描学习模块和视觉模块的现有代码，结合 HCI 课程项目要求、当前功能完成度、可演示性、可用性和稳定性，发散性思考下一步还可以如何迭代。

注意：本轮不要改代码，不要新增文件，不要安装依赖，不要提交。只做代码审查、产品分析和迭代规划。

一、审查范围

请重点扫描以下模块：

学习模块相关：
- apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/
- apps/stage-tamagotchi/src/renderer/pages/settings/study/
- apps/stage-tamagotchi/src/renderer/stores/ 或 composables 中与 study / companion / task / focus / timer / reminder / stats / export 相关的文件
- packages/stage-ui/src/stores/modules/ 中与学习陪伴相关的 store
- docs 中 study companion / HCI / demo 相关文档

视觉模块相关：
- apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/
- apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/
- apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts
- apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts
- apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts
- apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts
- apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts
- apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts
- apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts
- apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals.ts
- apps/stage-tamagotchi/src/renderer/utils/vision-status-labels.ts，如存在
- docs/vision-interaction-experiment.md

桌面交互与控制面板相关：
- apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/
- apps/stage-tamagotchi/src/renderer/components/stage-move-overlay.vue
- apps/stage-tamagotchi/src/renderer/components/ResizeHandler.vue
- docs/desktop-interaction-improvements.md

入口与集成：
- apps/stage-tamagotchi/src/renderer/pages/index.vue
- apps/stage-tamagotchi/src/main/windows/main/index.ts
- apps/stage-tamagotchi/src/main/services/electron/window.ts
- apps/stage-tamagotchi/src/main/tray/index.ts
- package.json / apps/stage-tamagotchi/package.json 中相关脚本

二、先输出当前实现地图

请先基于真实代码输出一个“当前实现地图”，不要凭 README 猜。

请分三部分：

1. 学习模块当前已实现什么
至少回答：
- 学习入口在哪里
- 是否有专注计时 / 番茄钟
- 是否有今日任务
- 是否有提醒策略
- 是否有低打扰机制
- 是否有 Live2D / Rin 反馈联动
- 是否有统计 / 日志 / 导出
- 是否有设置页
- 是否持久化
- 哪些功能已经接入主舞台
- 哪些功能仍像半成品或只在测试中存在

2. 视觉模块当前已实现什么
至少回答：
- Vision Island 入口在哪里
- Vision Runtime Manager 是否存在
- 摄像头开启/关闭逻辑在哪里
- Face Gate 是否存在
- Face Enrollment 是否存在
- 本地加密 profile 是否存在
- subject-position response 是否存在
- Contextual Feedback Engine 是否存在
- localized bubble 是否存在
- Face Motion Signal 是否存在
- optional gesture controls 是否存在
- 这些功能哪些默认开启，哪些默认关闭
- 哪些功能仍更像实验/诊断

3. 桌面交互当前已实现什么
至少回答：
- Controls Island 当前布局
- Move Mode
- 透明拖拽热区
- Emergency Anchor
- Zoom In / Zoom Out / Reset Size
- ResizeHandler 多方向缩放
- 当前 controls 是否仍有可见性 / 自动收起 / 布局问题

三、按 HCI 原则分析问题

请按以下五条原则分别审查学习模块和视觉模块：

1. Recognition rather than recall
识别而非回忆：
- 用户是否能一眼知道按钮做什么
- 是否过度依赖图标
- 状态文案是否是用户语言
- 是否需要记住流程
- 是否有足够的可见选项和提示

2. Flexibility and efficiency of use
灵活性与效率：
- 新手是否容易上手
- 熟练用户是否有快捷路径
- 是否有一键开始/继续/重置
- 是否支持默认设置与快速操作
- 是否存在过多步骤

3. Aesthetic and minimalist design
审美与极简：
- 默认 UI 是否过度展示调试字段
- 哪些信息应折叠
- 哪些按钮应分组
- 哪些功能不应默认显示
- 学习模块和视觉模块是否有视觉噪声

4. Help users recognize, diagnose, recover from errors
帮助用户识别、诊断和恢复错误：
- 摄像头失败、权限失败、Face Gate locked/no_face/multiple_faces 时是否说人话
- 学习计时异常、任务为空、导出失败时是否有恢复建议
- 错误是否有明确操作按钮
- 是否只是显示 raw status

5. Help and documentation
帮助与文档：
- 是否有内置帮助入口
- 是否有 3-4 步任务式说明
- 是否有工具提示 tooltip
- 文档是否能支持答辩和演示
- 用户是否能在 UI 内理解功能

四、发散提出迭代方向

请分别为学习模块和视觉模块提出可迭代方向。要求不要只列功能名，要说明“用户价值 + 实现落点 + 工作量 + 风险 + 演示价值”。

请按照下面格式输出表格：

| 方向 | 用户痛点 | 具体改动 | 代码落点 | 工作量 | 风险 | 演示价值 | 优先级 |
|---|---|---|---|---|---|---|---|

优先级分为：
- P0：必须修，影响演示或基本可用性
- P1：强建议，能显著提升产品感
- P2：可选加分
- P3：不建议当前阶段做

五、学习模块可重点思考这些方向

请结合代码实际判断，不要机械照抄：

1. 学习面板默认界面是否太复杂
2. 是否需要“开始下一轮专注”的一键入口
3. 是否需要“继续上次任务”
4. 是否需要更明确的任务完成正反馈
5. 是否需要专注结束后的选择卡片：
   - 休息 5 分钟
   - 继续下一轮
   - 完成当前任务
6. 是否需要空状态引导：
   - 还没有今日任务，点击添加一个
7. 是否需要错误恢复：
   - 计时中断后如何恢复
8. 是否需要统计卡片更可解释：
   - 今日专注分钟
   - 完成任务数
   - 连续轮次
9. 是否需要导出报告更适合课程评估
10. 是否需要 Live2D 反馈更少打扰
11. 是否需要帮助入口：
   - 如何开始专注
   - 如何添加任务
   - 如何查看统计
12. 是否需要快捷键或快速按钮
13. 是否需要“演示模式”，展示一组预置任务和统计数据

六、视觉模块可重点思考这些方向

请结合代码实际判断，不要机械照抄：

1. Vision Island 默认界面是否过度调试化
2. 是否应默认只展示：
   - 摄像头
   - 主体状态
   - Face Gate
   - 最近反馈
   - 恢复建议
3. 诊断字段是否应折叠到 Advanced
4. no_face / locked / gated / multiple_faces 是否应显示自然恢复建议
5. Face Enrollment 流程是否清晰
6. 本地加密 profile 解锁失败是否有恢复路径
7. Runtime warming / failed / fallback 是否说人话
8. subject-position response 是否够自然
9. Face Motion Signal 是否应默认关闭，或者折叠
10. Gesture Controls 是否应继续隐藏在 Advanced
11. 是否需要“视觉能力自检”：
   - 摄像头权限
   - 模型就绪
   - Face Gate 状态
   - 光照/质量
12. 是否需要“视觉演示模式”：
   - 不依赖真实人脸时展示模拟状态
   - 但不能污染实际逻辑
13. 是否需要更好的本地化中文状态
14. 是否需要减少 bubble/toast/motion 同时出现
15. 是否需要“为什么 Rin 没响应？”的解释卡片

七、桌面交互可重点思考这些方向

请结合代码实际判断：

1. Controls Island 是否仍然布局不齐
2. 展开/收起是否稳定
3. Emergency Anchor 是否只是补丁，还是应该作为正式入口
4. Move Mode 是否应该有更自然提示
5. Zoom In / Zoom Out / Reset Size 是否可发现
6. Resize handles 是否需要视觉提示
7. 面板是否会遮挡 Rin
8. 是否需要“简洁 / 高级”模式
9. 是否需要 tooltip
10. 是否需要快捷键提示

八、筛选出最值得做的下一轮任务

请从所有建议中筛选出：

1. 最值得马上做的 5 个 P0/P1 任务
2. 每个任务给出：
   - 目标
   - 为什么现在做
   - 涉及文件
   - 预期改动规模
   - 风险
   - 推荐 commit message

请优先考虑：
- 对真实演示影响最大
- 不会引入大风险
- 能明显提升 HCI 可用性
- 能在短时间完成
- 不继续堆识别算法

九、明确哪些不建议继续做

请列出当前不建议继续做的功能，并说明原因。至少考虑：

1. 更复杂的手势识别
2. 更强的人脸身份认证
3. 真正情绪识别
4. 云同步
5. 日历/课程表大系统
6. 新 Live2D 美术资源
7. 大规模重写 UI 框架
8. 主进程窗口系统大改

十、输出格式要求

请用中文输出，结构清晰。

最终输出必须包含：

1. 当前分支和工作区状态
2. 当前实现地图
3. HCI 五原则问题分析
4. 学习模块迭代表
5. 视觉模块迭代表
6. 桌面交互迭代表
7. 最推荐马上做的 5 个任务
8. 不建议继续做的方向
9. 是否建议现在继续开发，还是进入冻结和演示材料阶段
10. 如果建议继续开发，请给出下一步 Codex 实施 prompt 的方向，但本轮不要直接改代码

特别强调：
本轮只读分析，不要修改代码，不要提交，不要安装依赖。

---

## Assistant (Build · MiMo-V2.5-Pro · 18.1s)

_Thinking:_

用户要求对Rin桌宠项目进行"只读型产品迭代审查"，这是一个大型分析任务。我需要按照用户提供的详细结构进行分析，包括：

1. 当前实现地图（学习模块、视觉模块、桌面交互）
2. HCI五原则问题分析
3. 迭代方向表格
4. 推荐任务
5. 不建议的方向

这是一个只读任务，我不能修改代码，只能分析。我需要先扫描相关目录和文件来了解当前实现状态。

让我开始扫描相关目录和文件。

**Tool: bash**

**Input:**
```json
{
  "command": "git status --short && git branch --show-current",
  "description": "检查当前分支和工作区状态"
}
```

**Output:**
```
integration/final-hci-demo

```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.vue
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/pages/settings/study/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/pet-feedback-path.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/move-and-size-controls.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/layout-regression.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-anchor.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/vision-panel-auto-collapse.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-fade-on-hover.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-fade-on-hover.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-auth-button.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button-tooltip.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/window-size.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/window-size.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-hearing-config.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-profile-picker.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/indicator-mic-volume.vue
```

---

## Assistant (Build · MiMo-V2.5-Pro · 8.6s)

_Thinking:_

现在我需要扫描更多文件来了解实现细节。让我并行读取关键文件。

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
3: import { storeToRefs } from 'pinia'
4: import { computed } from 'vue'
5:
6: import TaskList from './TaskList.vue'
7:
8: const emit = defineEmits<{
9:   close: []
10:   interactionLockChange: [locked: boolean]
11: }>()
12: const studyStore = useStudyCompanionStore()
13: const { persisted, isMuted, demoModeEnabled } = storeToRefs(studyStore)
14: const { startFocus, startBreak, pause, resume, resetSession, appendEvent, toggleDemoMode } = studyStore
15: const MUTE_DURATION_MS = 30 * 60 * 1000
16:
17: const isIdle = computed(() => persisted.value.mode === 'idle')
18: const isPaused = computed(() => persisted.value.mode === 'paused')
19: const isFocusing = computed(() => persisted.value.mode === 'focus')
20: const isBreaking = computed(() => persisted.value.mode === 'break')
21: const isRunning = computed(() => isFocusing.value || isBreaking.value)
22:
23: const formattedRemaining = computed(() => {
24:   const totalSeconds = Math.ceil(persisted.value.remainingMs / 1000)
25:   const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
26:   const seconds = (totalSeconds % 60).toString().padStart(2, '0')
27:   return `${minutes}:${seconds}`
28: })
29:
30: const modeDisplayText = computed(() => {
31:   if (persisted.value.mode === 'focus')
32:     return '专注中'
33:   if (persisted.value.mode === 'break')
34:     return '休息中'
35:   if (persisted.value.mode === 'paused')
36:     return '已暂停'
37:   return '空闲'
38: })
39:
40: const todayFocusSessions = computed(() => persisted.value.todayFocusSessions)
41: const todayFocusMinutes = computed(() => persisted.value.todayFocusMinutes)
42: const todayReminderCount = computed(() => persisted.value.todayReminderCount)
43: const showNoStudyRecord = computed(() => persisted.value.studyEvents.length === 0)
44:
45: function handleMuteToggle() {
46:   if (isMuted.value) {
47:     persisted.value.mutedUntil = 0
48:     appendEvent('unmuted', {})
49:   }
50:   else {
51:     persisted.value.mutedUntil = Date.now() + MUTE_DURATION_MS
52:     appendEvent('muted', { durationMinutes: 30 })
53:   }
54: }
55:
56: const canStartFocus = computed(() => isIdle.value)
57: const canStartBreak = computed(() => isIdle.value)
58: const canPause = computed(() => isRunning.value)
59: const canResume = computed(() => isPaused.value)
60:
61: const modeHintText = computed(() => {
62:   if (isFocusing.value)
63:     return '保持当前节奏，Rin 会安静陪你。'
64:   if (isBreaking.value)
65:     return '短暂休息一下，稍后再继续。'
66:   if (isPaused.value)
67:     return '已暂停，可继续或重置。'
68:   return '准备开始今天的专注。'
69: })
70:
71: const demoDurationText = computed(() => {
72:   const focusSeconds = Math.round(persisted.value.focusDurationMs / 1000)
73:   const breakSeconds = Math.round(persisted.value.breakDurationMs / 1000)
74:   return `专注 ${focusSeconds} 秒 / 休息 ${breakSeconds} 秒`
75: })
76:
77: function handleTaskInteractionLock(locked: boolean) {
78:   emit('interactionLockChange', locked)
79: }
80: </script>
81:
82: <template>
83:   <div
84:     :class="[
85:       'h-full w-full min-h-0',
86:       'flex flex-col overflow-hidden',
87:       'rounded-xl border border-neutral-200/60 px-3 py-3',
88:       'bg-white/90 shadow-md backdrop-blur-md dark:border-neutral-700/70 dark:bg-neutral-900/90',
89:     ]"
90:   >
91:     <div
92:       :class="[
93:         'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4',
94:         'gap-2',
95:         'pr-1 pb-8',
96:       ]"
97:     >
98:       <div :class="['flex items-center justify-between gap-2']">
99:         <span :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-100']">学习计时</span>
100:         <div :class="['flex items-center gap-1.5']">
101:           <button
102:             type="button"
103:             :class="[
104:               'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
105:               demoModeEnabled
106:                 ? 'bg-orange-500 text-white hover:bg-orange-400'
107:                 : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
108:             ]"
109:             @click="toggleDemoMode"
110:           >
111:             {{ demoModeEnabled ? '演示模式：开' : '演示模式：关' }}
112:           </button>
113:           <button
114:             type="button"
115:             :class="[
116:               'rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700',
117:               'dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200',
118:             ]"
119:             title="关闭学习面板"
120:             @click="emit('close')"
121:           >
122:             <span :class="['i-solar:close-circle-outline size-4']" />
123:           </button>
124:         </div>
125:       </div>
126:       <p
127:         v-if="demoModeEnabled"
128:         :class="[
129:           'rounded-md border border-orange-200/80 bg-orange-50/80 px-2 py-1 text-[11px]',
130:           'text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/40 dark:text-orange-200',
131:         ]"
132:       >
133:         演示模式已启用，{{ demoDurationText }}
134:       </p>
135:
136:       <!-- Mode & Time Display -->
137:       <div :class="['flex items-center justify-between gap-2']">
138:         <div
139:           :class="[
140:             'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
141:             isIdle ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
142:             : isFocusing ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300'
143:               : isBreaking ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
144:                 : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
145:           ]"
146:         >
147:           {{ modeDisplayText }}
148:         </div>
149:
150:         <div
151:           :class="[
152:             'font-mono text-lg font-semibold tabular-nums',
153:             isFocusing ? 'text-rose-600 dark:text-rose-400'
154:             : isBreaking ? 'text-emerald-600 dark:text-emerald-400'
155:               : 'text-neutral-800 dark:text-neutral-200',
156:           ]"
157:         >
158:           {{ formattedRemaining }}
159:         </div>
160:       </div>
161:       <p :class="['text-xs text-neutral-500 dark:text-neutral-400']">
162:         {{ modeHintText }}
163:       </p>
164:
165:       <!-- Control Buttons -->
166:       <div :class="['grid grid-cols-2 gap-1.5']">
167:         <button
168:           type="button"
169:           :disabled="!canStartFocus"
170:           :class="[
171:             'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
172:             canStartFocus
173:               ? 'bg-rose-500 text-white hover:bg-rose-600'
174:               : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500',
175:           ]"
176:           @click="startFocus"
177:         >
178:           <div class="i-solar:play-bold size-4" />
179:           开始专注
180:         </button>
181:
182:         <button
183:           type="button"
184:           :disabled="!canStartBreak"
185:           :class="[
186:             'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
187:             canStartBreak
188:               ? 'bg-emerald-500 text-white hover:bg-emerald-600'
189:               : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500',
190:           ]"
191:           @click="startBreak"
192:         >
193:           <div class="i-solar:cup-bold size-4" />
194:           开始休息
195:         </button>
196:
197:         <button
198:           v-if="canPause"
199:           type="button"
200:           :class="[
201:             'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
202:             'bg-amber-500 text-white hover:bg-amber-600',
203:           ]"
204:           @click="pause"
205:         >
206:           <div class="i-solar:pause-bold size-4" />
207:           暂停
208:         </button>
209:
210:         <button
211:           v-if="canResume"
212:           type="button"
213:           :class="[
214:             'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
215:             'bg-sky-500 text-white hover:bg-sky-600',
216:           ]"
217:           @click="resume"
218:         >
219:           <div class="i-solar:play-bold size-4" />
220:           继续
221:         </button>
222:
223:         <button
224:           v-if="!isIdle"
225:           type="button"
226:           :class="[
227:             'col-span-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
228:             'bg-neutral-200 text-neutral-700 hover:bg-neutral-300',
229:             'dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
230:           ]"
231:           @click="resetSession"
232:         >
233:           <div class="i-solar:restart-bold size-4" />
234:           重置
235:         </button>
236:       </div>
237:
238:       <div :class="['flex items-center justify-end']">
239:         <button
240:           type="button"
241:           :class="[
242:             'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-all',
243:             'hover:scale-105 active:scale-95',
244:             isMuted
245:               ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
246:               : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
247:           ]"
248:           :title="isMuted ? '取消静音提醒' : '静音提醒 30 分钟'"
249:           @click="handleMuteToggle"
250:         >
251:           <div
252:             :class="[
253:               'size-4',
254:               isMuted ? 'i-solar:bell-off-bold' : 'i-solar:bell-bold',
255:             ]"
256:           />
257:         </button>
258:       </div>
259:
260:       <!-- Stats Panel -->
261:       <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
262:         <div :class="['flex flex-wrap items-center gap-1']">
263:           <div class="i-solar:list-check-bold size-3.5" />
264:           <span>今日：{{ todayFocusSessions }} 轮 · {{ todayFocusMinutes }} 分钟</span>
265:         </div>
266:         <div v-if="todayReminderCount > 0" :class="['mt-1 flex items-center gap-1']">
267:           <div class="i-solar:bell-bold size-3.5" />
268:           <span>{{ todayReminderCount }} 条提醒</span>
269:         </div>
270:         <div v-if="isMuted" :class="['mt-1 flex items-center gap-1']">
271:           <div class="i-solar:bell-off-bold size-3.5" />
272:           <span>已静音</span>
273:         </div>
274:         <div v-if="showNoStudyRecord" :class="['mt-1 text-neutral-400 dark:text-neutral-500']">
275:           暂无学习记录。
276:         </div>
277:       </div>
278:
279:       <TaskList @interaction-lock-change="handleTaskInteractionLock" />
280:     </div>
281:   </div>
282: </template>

(End of file - total 282 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
3: import { storeToRefs } from 'pinia'
4: import { computed, nextTick, ref } from 'vue'
5:
6: const emit = defineEmits<{
7:   interactionLockChange: [locked: boolean]
8: }>()
9: const studyStore = useStudyCompanionStore()
10: const { persisted, taskTotal, taskCompleted, taskPending } = storeToRefs(studyStore)
11: const { addTask, toggleTaskDone, deleteTask } = studyStore
12: const draftTitle = ref('')
13: const taskInputRef = ref<HTMLInputElement>()
14: const isTaskInputFocused = ref(false)
15: const isComposing = ref(false)
16:
17: const tasks = computed(() => persisted.value.tasks)
18: const showTaskOverloadHint = computed(() => taskPending.value >= 5)
19:
20: function submitTask() {
21:   const normalizedTitle = draftTitle.value.trim()
22:   if (!normalizedTitle)
23:     return
24:
25:   addTask(normalizedTitle)
26:   draftTitle.value = ''
27: }
28:
29: function handleTaskInputFocus() {
30:   isTaskInputFocused.value = true
31:   emit('interactionLockChange', true)
32:   nextTick(() => {
33:     taskInputRef.value?.scrollIntoView({
34:       block: 'center',
35:       behavior: 'smooth',
36:     })
37:   })
38: }
39:
40: function handleTaskInputBlur() {
41:   isTaskInputFocused.value = false
42:   emit('interactionLockChange', isComposing.value)
43: }
44:
45: function handleCompositionStart() {
46:   isComposing.value = true
47:   emit('interactionLockChange', true)
48: }
49:
50: function handleCompositionEnd() {
51:   isComposing.value = false
52:   emit('interactionLockChange', isTaskInputFocused.value)
53: }
54:
55: function handleTaskInputKeydown(event: KeyboardEvent) {
56:   if (event.key !== 'Enter')
57:     return
58:
59:   if (isComposing.value || event.isComposing)
60:     return
61:
62:   event.preventDefault()
63:   submitTask()
64: }
65: </script>
66:
67: <template>
68:   <section
69:     :class="[
70:       'mt-1 border-t border-neutral-200/70 pt-2 pb-4',
71:       'dark:border-neutral-700/70',
72:     ]"
73:   >
74:     <div :class="['flex items-center justify-between gap-2 text-xs']">
75:       <span :class="['font-medium text-neutral-700 dark:text-neutral-200']">今日任务</span>
76:       <span :class="['text-neutral-500 dark:text-neutral-400']">
77:         任务：已完成 {{ taskCompleted }} / 共 {{ taskTotal }}
78:       </span>
79:     </div>
80:
81:     <p
82:       v-if="showTaskOverloadHint"
83:       :class="[
84:         'mt-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1 text-xs',
85:         'text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200',
86:       ]"
87:     >
88:       任务较多，建议先选 1 项开始。
89:     </p>
90:
91:     <div :class="['mt-2 flex items-center gap-1.5']">
92:       <input
93:         ref="taskInputRef"
94:         v-model="draftTitle"
95:         type="text"
96:         maxlength="120"
97:         placeholder="添加今日任务"
98:         :class="[
99:           'min-w-0 flex-1 rounded-lg border border-neutral-200/80 px-2.5 py-1.5 text-xs',
100:           'scroll-mt-4 scroll-mb-28',
101:           'bg-white/90 text-neutral-800 placeholder:text-neutral-400',
102:           'outline-none transition-colors focus:border-primary-500',
103:           'dark:border-neutral-700/70 dark:bg-neutral-800/80 dark:text-neutral-100 dark:placeholder:text-neutral-500',
104:         ]"
105:         @focus="handleTaskInputFocus"
106:         @blur="handleTaskInputBlur"
107:         @keydown="handleTaskInputKeydown"
108:         @compositionstart="handleCompositionStart"
109:         @compositionend="handleCompositionEnd"
110:       >
111:       <button
112:         type="button"
113:         :class="[
114:           'shrink-0 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white',
115:           'transition-colors hover:bg-primary-500',
116:         ]"
117:         @click="submitTask"
118:       >
119:         添加
120:       </button>
121:     </div>
122:
123:     <ul
124:       v-if="tasks.length > 0"
125:       :class="['mt-2 space-y-1 pb-4']"
126:     >
127:       <li
128:         v-for="task in tasks"
129:         :key="task.id"
130:         :class="[
131:           'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs',
132:           'bg-neutral-100/80 dark:bg-neutral-800/70',
133:         ]"
134:       >
135:         <button
136:           type="button"
137:           :class="[
138:             'min-w-0 flex-1 truncate text-left',
139:             task.done ? 'text-neutral-400 line-through dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-100',
140:           ]"
141:           :title="task.title"
142:           @click="toggleTaskDone(task.id)"
143:         >
144:           {{ task.title }}
145:         </button>
146:
147:         <button
148:           type="button"
149:           :class="[
150:             'shrink-0 rounded px-1.5 py-1 text-[11px] transition-colors',
151:             task.done
152:               ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
153:               : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
154:           ]"
155:           @click="toggleTaskDone(task.id)"
156:         >
157:           {{ task.done ? '取消完成' : '完成' }}
158:         </button>
159:
160:         <button
161:           type="button"
162:           :class="[
163:             'shrink-0 rounded px-1.5 py-1 text-[11px] transition-colors',
164:             'bg-red-100 text-red-700 hover:bg-red-200',
165:             'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
166:           ]"
167:           @click="deleteTask(task.id)"
168:         >
169:           删除
170:         </button>
171:       </li>
172:     </ul>
173:
174:     <p
175:       v-else
176:       :class="['mt-2 text-xs text-neutral-500 dark:text-neutral-400']"
177:     >
178:       今天还没有任务。
179:     </p>
180:   </section>
181: </template>

(End of file - total 181 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import type { StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'
3:
4: import { useDownload } from '@proj-airi/stage-ui/composables/download'
5: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
6: import { Button, Callout, DoubleCheckButton } from '@proj-airi/ui'
7: import { useNow } from '@vueuse/core'
8: import { computed, ref } from 'vue'
9:
10: const studyCompanion = useStudyCompanionStore()
11: const now = useNow({ interval: 1000 })
12: const expandedEventIds = ref<Set<string>>(new Set())
13:
14: const EVENT_DETAIL_PREVIEW_LIMIT = 120
15:
16: const mutedUntilText = computed(() => {
17:   const mutedUntil = studyCompanion.persisted.mutedUntil
18:   if (mutedUntil <= now.value.getTime())
19:     return '未静音'
20:
21:   return new Date(mutedUntil).toLocaleTimeString([], {
22:     hour: '2-digit',
23:     minute: '2-digit',
24:   })
25: })
26:
27: const modeText = computed(() => formatMode(studyCompanion.persisted.mode))
28: const isMutedText = computed(() => (studyCompanion.isMuted ? '是' : '否'))
29: const isDemoModeText = computed(() => (studyCompanion.demoModeEnabled ? '是' : '否'))
30:
31: const todayStatsRows = computed(() => [
32:   { label: '统计日期', value: studyCompanion.persisted.statsDate },
33:   { label: '今日专注轮数', value: String(studyCompanion.persisted.todayFocusSessions) },
34:   { label: '今日累计专注分钟', value: String(studyCompanion.persisted.todayFocusMinutes) },
35:   { label: '今日完成任务数', value: String(studyCompanion.taskCompleted) },
36:   { label: '今日提醒次数', value: String(studyCompanion.persisted.todayReminderCount) },
37:   { label: '当前模式', value: modeText.value },
38:   { label: '是否静音', value: isMutedText.value },
39:   { label: '是否演示模式', value: isDemoModeText.value },
40:   { label: '静音到', value: mutedUntilText.value },
41:   { label: '剩余时间', value: formatRemaining(studyCompanion.persisted.remainingMs) },
42: ])
43:
44: const taskSummaryRows = computed(() => {
45:   return [
46:     { label: '任务总数', value: String(studyCompanion.taskTotal) },
47:     { label: '已完成', value: String(studyCompanion.taskCompleted) },
48:     { label: '未完成', value: String(studyCompanion.taskPending) },
49:   ]
50: })
51:
52: const recentEvents = computed(() => {
53:   return [...studyCompanion.persisted.studyEvents]
54:     .slice(-50)
55:     .reverse()
56:     .map((event, index) => ({
57:       id: event.id || `${event.type}-${event.at}-${index}`,
58:       at: formatEventTime(event.at),
59:       type: event.type,
60:       typeLabel: formatEventType(event.type),
61:       detail: formatEventDetail(event.detail),
62:     }))
63: })
64:
65: function formatMode(mode: string) {
66:   if (mode === 'focus')
67:     return '专注中'
68:   if (mode === 'break')
69:     return '休息中'
70:   if (mode === 'paused')
71:     return '已暂停'
72:   return '空闲'
73: }
74:
75: function formatRemaining(remainingMs: number) {
76:   const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
77:   const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
78:   const seconds = (totalSeconds % 60).toString().padStart(2, '0')
79:   return `${minutes}:${seconds}`
80: }
81:
82: function formatEventTime(timestamp: number) {
83:   if (!Number.isFinite(timestamp))
84:     return '时间无效'
85:
86:   return new Date(timestamp).toLocaleString()
87: }
88:
89: function formatEventDetail(detail: StudyEventLogEntry['detail']) {
90:   if (!detail || Object.keys(detail).length === 0)
91:     return '无'
92:
93:   try {
94:     const serializedDetail = JSON.stringify(detail)
95:     if (serializedDetail.length <= 120)
96:       return serializedDetail
97:     return `${serializedDetail.slice(0, 117)}...`
98:   }
99:   catch {
100:     return '[详情不可序列化]'
101:   }
102: }
103:
104: function formatEventType(type: StudyEventLogEntry['type']) {
105:   if (type === 'focus_started')
106:     return '开始专注'
107:   if (type === 'focus_completed')
108:     return '专注完成'
109:   if (type === 'session_paused')
110:     return '会话暂停'
111:   if (type === 'session_resumed')
112:     return '会话继续'
113:   if (type === 'focus_reset')
114:     return '重置会话'
115:   if (type === 'break_started')
116:     return '开始休息'
117:   if (type === 'break_completed')
118:     return '休息完成'
119:   if (type === 'task_added')
120:     return '新增任务'
121:   if (type === 'task_completed')
122:     return '完成任务'
123:   if (type === 'task_reopened')
124:     return '任务重开'
125:   if (type === 'task_deleted')
126:     return '删除任务'
127:   if (type === 'demo_mode_enabled')
128:     return '开启演示模式'
129:   if (type === 'demo_mode_disabled')
130:     return '关闭演示模式'
131:   if (type === 'day_rollover')
132:     return '跨日重置'
133:   if (type === 'study_log_exported')
134:     return '导出日志'
135:   if (type === 'study_events_cleared')
136:     return '清空日志'
137:   if (type === 'study_stats_cleared')
138:     return '清空今日统计'
139:   if (type === 'reminder_shown')
140:     return '触发提醒'
141:   return type
142: }
143:
144: function getEventDetailPreview(detail: string) {
145:   if (detail.length <= EVENT_DETAIL_PREVIEW_LIMIT)
146:     return detail
147:   return `${detail.slice(0, EVENT_DETAIL_PREVIEW_LIMIT - 3)}...`
148: }
149:
150: function toggleEventDetail(id: string) {
151:   if (expandedEventIds.value.has(id)) {
152:     expandedEventIds.value.delete(id)
153:   }
154:   else {
155:     expandedEventIds.value.add(id)
156:   }
157: }
158:
159: function isEventDetailExpanded(id: string) {
160:   return expandedEventIds.value.has(id)
161: }
162:
163: function handleExportJson() {
164:   const snapshot = studyCompanion.exportStudySnapshot()
165:   const snapshotJson = JSON.stringify(snapshot, null, 2)
166:   const snapshotBlob = new Blob([snapshotJson], { type: 'application/json' })
167:   const { download } = useDownload(
168:     snapshotBlob,
169:     `rin-study-log-${snapshot.statsDate}.json`,
170:   )
171:
172:   download()
173: }
174:
175: function handleClearActivityLog() {
176:   studyCompanion.clearStudyEvents()
177: }
178:
179: function handleClearTodayStats() {
180:   studyCompanion.clearTodayStudyStats()
181: }
182: </script>
183:
184: <template>
185:   <div :class="['flex flex-col gap-4 pb-8']">
186:     <Callout
187:       :class="['w-full']"
188:       label="学习陪伴统计"
189:       theme="primary"
190:     >
191:       查看今日专注统计、最近活动日志，并导出 JSON 快照用于分享或备份。
192:     </Callout>
193:
194:     <section
195:       :class="[
196:         'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
197:         'dark:border-neutral-700/60 dark:bg-neutral-900/70',
198:       ]"
199:     >
200:       <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
201:         今日统计
202:       </h3>
203:       <div :class="['grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4']">
204:         <div
205:           v-for="row in todayStatsRows"
206:           :key="row.label"
207:           :class="[
208:             'rounded-lg border border-neutral-200/70 bg-neutral-50/90 px-3 py-2',
209:             'dark:border-neutral-700/70 dark:bg-neutral-800/70',
210:           ]"
211:         >
212:           <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
213:             {{ row.label }}
214:           </div>
215:           <div :class="['mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100']">
216:             {{ row.value }}
217:           </div>
218:         </div>
219:       </div>
220:     </section>
221:
222:     <section
223:       :class="[
224:         'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
225:         'dark:border-neutral-700/60 dark:bg-neutral-900/70',
226:       ]"
227:     >
228:       <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
229:         今日任务摘要
230:       </h3>
231:       <div :class="['grid grid-cols-1 gap-3 sm:grid-cols-3']">
232:         <div
233:           v-for="row in taskSummaryRows"
234:           :key="row.label"
235:           :class="[
236:             'rounded-lg border border-neutral-200/70 bg-neutral-50/90 px-3 py-2',
237:             'dark:border-neutral-700/70 dark:bg-neutral-800/70',
238:           ]"
239:         >
240:           <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
241:             {{ row.label }}
242:           </div>
243:           <div :class="['mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100']">
244:             {{ row.value }}
245:           </div>
246:         </div>
247:       </div>
248:     </section>
249:
250:     <section
251:       :class="[
252:         'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
253:         'dark:border-neutral-700/60 dark:bg-neutral-900/70',
254:       ]"
255:     >
256:       <div :class="['mb-3 flex items-center justify-between gap-3']">
257:         <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
258:           活动日志（最近 50 条）
259:         </h3>
260:         <span :class="['text-xs text-neutral-500 dark:text-neutral-400']">
261:           共 {{ recentEvents.length }} 条
262:         </span>
263:       </div>
264:
265:       <div
266:         v-if="recentEvents.length === 0"
267:         :class="[
268:           'rounded-lg border border-dashed border-neutral-300/70 px-3 py-4 text-sm',
269:           'text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400',
270:         ]"
271:       >
272:         暂无学习记录。
273:       </div>
274:
275:       <div
276:         v-else
277:         :class="[
278:           'max-h-96 overflow-y-auto rounded-lg border border-neutral-200/70',
279:           'dark:border-neutral-700/70',
280:         ]"
281:       >
282:         <div
283:           v-for="event in recentEvents"
284:           :key="event.id"
285:           :class="[
286:             'grid grid-cols-1 gap-2 border-b border-neutral-200/70 px-3 py-3 text-xs sm:grid-cols-12',
287:             'last:border-b-0 dark:border-neutral-700/70',
288:           ]"
289:         >
290:           <div :class="['sm:col-span-3 text-neutral-500 dark:text-neutral-400']">
291:             {{ event.at }}
292:           </div>
293:           <div :class="['sm:col-span-3 font-medium text-neutral-700 dark:text-neutral-200']">
294:             {{ event.typeLabel }}
295:           </div>
296:           <div :class="['sm:col-span-6 text-neutral-600 dark:text-neutral-300']">
297:             <p :class="['break-all']">
298:               {{ isEventDetailExpanded(event.id) ? event.detail : getEventDetailPreview(event.detail) }}
299:             </p>
300:             <button
301:               v-if="event.detail.length > EVENT_DETAIL_PREVIEW_LIMIT"
302:               type="button"
303:               :class="['mt-1 text-[11px] text-primary-600 hover:underline dark:text-primary-300']"
304:               @click="toggleEventDetail(event.id)"
305:             >
306:               {{ isEventDetailExpanded(event.id) ? '收起' : '展开' }}
307:             </button>
308:           </div>
309:         </div>
310:       </div>
311:     </section>
312:
313:     <section
314:       :class="[
315:         'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
316:         'dark:border-neutral-700/60 dark:bg-neutral-900/70',
317:       ]"
318:     >
319:       <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
320:         操作
321:       </h3>
322:       <div :class="['flex flex-col gap-3 sm:flex-row sm:flex-wrap']">
323:         <Button
324:           icon="i-solar:download-minimalistic-bold-duotone"
325:           variant="secondary"
326:           @click="handleExportJson"
327:         >
328:           导出 JSON
329:         </Button>
330:
331:         <DoubleCheckButton variant="caution" cancel-variant="secondary" @confirm="handleClearActivityLog">
332:           清空活动日志
333:           <template #confirm>
334:             确认清空日志
335:           </template>
336:         </DoubleCheckButton>
337:
338:         <DoubleCheckButton variant="danger" cancel-variant="secondary" @confirm="handleClearTodayStats">
339:           清空今日统计与日志
340:           <template #confirm>
341:             确认清空今日
342:           </template>
343:         </DoubleCheckButton>
344:       </div>
345:     </section>
346:   </div>
347: </template>
348:
349: <route lang="yaml">
350: meta:
351:   layout: settings
352:   title: 学习统计
353:   subtitleKey: settings.title
354:   description: 学习陪伴统计面板、活动日志与 JSON 导出
355:   icon: i-solar:chart-2-bold-duotone
356:   settingsEntry: true
357:   order: 8
358:   stageTransition:
359:     name: slide
360:     pageSpecificAvailable: true
361: </route>

(End of file - total 361 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import type { VisionInteractionEvent } from '../../../composables/use-vision-interaction'
3:
4: import { Button } from '@proj-airi/ui'
5: import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
6: import { useRouter } from 'vue-router'
7: import { toast } from 'vue-sonner'
8:
9: import { useVisionInteraction } from '../../../composables/use-vision-interaction'
10: import { useVisionPetFeedback } from '../../../composables/use-vision-pet-feedback'
11: import {
12:   formatExpressionSignal,
13:   formatFaceDirection,
14:   formatFacePresence,
15:   formatFeedbackIntensity,
16:   formatGateStatus,
17:   formatMatchStatus,
18:   formatSubjectResponseState,
19:   formatVisionFieldLabel,
20:   formatVisionStatusValue,
21:   normalizeVisionStatusLocale,
22: } from '../../../utils/vision-status-labels'
23:
24: const props = withDefaults(defineProps<{
25:   embedded?: boolean
26:   uiMode?: 'novice' | 'expert'
27: }>(), {
28:   embedded: false,
29:   uiMode: 'novice',
30: })
31:
32: const collapsed = ref(!props.embedded)
33: const advancedDiagnosticsExpanded = ref(false)
34: const gestureDiagnosticsExpanded = ref(false)
35: const expressionSignalDiagnosticsExpanded = ref(false)
36: const videoRef = ref<HTMLVideoElement | null>(null)
37: const unlockPassphrase = ref('')
38: const unlocking = ref(false)
39: const rememberOnDevice = ref(false)
40: const isDev = import.meta.env.DEV
41:
42: const router = useRouter()
43:
44: const {
45:   isEnabled,
46:   cameraState,
47:   cameraPermissionState,
48:   mediaPipeStatus,
49:   facePresence,
50:   faceCenter,
51:   faceDirection,
52:   subjectPosition,
53:   lastStableSubjectPosition,
54:   subjectPositionChangedAt,
55:   subjectResponseState: interactionSubjectResponseState,
56:   lastSubjectResponseEvent: interactionLastSubjectResponseEvent,
57:   subjectResponseCooldownUntil,
58:   enableExpressionSignals,
59:   expressionSignal,
60:   expressionSignalCandidate,
61:   stableExpressionSignal,
62:   expressionSignalStableFrames,
63:   expressionSignalConfidence,
64:   expressionSignalReason,
65:   expressionSignalSource,
66:   expressionSignalChangedAt,
67:   expressionSignalCooldownUntil,
68:   expressionSignalFeedbackAllowed,
69:   expressionSignalUnavailable,
70:   lastGesture,
71:   gestureControlsEnabled,
72:   candidateGesture,
73:   stableGesture,
74:   gestureState,
75:   gestureConfidence,
76:   gestureVoteCount,
77:   gestureVoteWindowSize,
78:   geometryPassRate,
79:   gestureQualityState,
80:   handSizeRatio,
81:   handInsideGuideArea,
82:   holdProgressMs,
83:   holdDurationMs,
84:   cooldownRemainingMs,
85:   releaseRequired,
86:   lastEvent,
87:   errorMessage,
88:   quietRemainingMs,
89:   isVisionQuiet,
90:   localCelebrationCount,
91:   activePrompt,
92:   matchedDisplayName,
93:   gateEnabled,
94:   hasEncryptedProfile,
95:   isProfileUnlocked,
96:   profileStatus,
97:   rememberFaceProfileOnDevice,
98:   secureStoreAvailable,
99:   localFaceGate,
100:   openCvFaceQuality,
101:   canTriggerInteractiveFeedback,
102:   canTriggerSubjectPositionResponse,
103:   maxInferenceStallMs,
104:   lastInferenceAt,
105:   modelWarmupStatus,
106:   modelSource,
107:   modelProfile,
108:   runtimeStatus,
109:   runtimeWarmupDurationMs,
110:   runtimeRetryCount,
111:   runtimeLastError,
112:   startTiming,
113:   attachVideoElement,
114:   start,
115:   stop,
116:   warmupVisionRuntime,
117:   retryVisionRuntime,
118:   resetVisionRuntime,
119:   setFaceGateEnabled,
120:   setGestureControlsEnabled,
121:   setExpressionSignalsEnabled,
122:   setMaxInferenceStallMs,
123:   setRememberFaceProfileOnDevice,
124:   unlockFaceProfile,
125: } = useVisionInteraction({
126:   stableFrames: 3,
127:   gestureStableFrames: 2,
128:   gestureInferenceIntervalMs: 90,
129:   gestureScoreThreshold: 0.35,
130:   eventCooldownMs: 2_000,
131:   loopIntervalMs: 120,
132: })
133: const {
134:   triggerVisionPetFeedback,
135:   triggerExpressionSignalFeedback,
136:   triggerContextualVisionFeedback,
137:   feedbackIntensity,
138:   setFeedbackIntensity,
139:   feedbackLocale,
140:   setFeedbackLocale,
141:   feedbackVariant,
142:   setFeedbackVariant,
143:   lastFeedbackType,
144:   lastFeedbackMessage,
145:   lastFeedbackLevel,
146:   lastFeedbackPriority,
147:   lastFeedbackChannels,
148:   lastFeedbackTemplateId,
149:   lastResolvedFeedbackEventType,
150:   lastIsTransitionFeedback,
151:   nextAllowedFeedbackIn,
152:   feedbackSuppressedByQuiet,
153:   feedbackBlockedByGate,
154:   activeBubbleMessage,
155:   activeBubbleLevel,
156:   activeBubbleEventType,
157:   activeBubbleTemplateId,
158:   bubbleVisibleUntil,
159:   bubbleRemainingMs,
160:   petFeedbackState,
161:   lastPetFeedback,
162:   subjectResponseState: petSubjectResponseState,
163:   lastSubjectResponseEvent: petLastSubjectResponseEvent,
164:   subjectResponseCooldownUntil: petSubjectResponseCooldownUntil,
165:   isQuietVisualMode,
166:   quietRemainingMs: petQuietRemainingMs,
167:   celebrationCount: petCelebrationCount,
168:   cancelQuietVisualMode,
169:   clearBubble,
170:   clearPetFeedback,
171: } = useVisionPetFeedback()
172:
173: const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
174: const prewarming = ref(false)
175: const BACKGROUND_WARMUP_DELAY_MS = 1_200
176: const BACKGROUND_WARMUP_IDLE_TIMEOUT_MS = 2_000
177: const SUBJECT_DWELL_THRESHOLD_MS = 7_000
178: let scheduledWarmupTimerId: number | null = null
179: let scheduledIdleCallbackId: number | null = null
180: let subjectDwellTimerId: number | null = null
181: const quietRemainingSeconds = computed(() => Math.ceil(quietRemainingMs.value / 1000))
182: const petQuietRemainingSeconds = computed(() => Math.ceil(petQuietRemainingMs.value / 1000))
183: const isExpertMode = computed(() => props.uiMode === 'expert')
184: const statusLocale = computed(() => normalizeVisionStatusLocale(feedbackLocale.value))
185: const feedbackIntensityOptions = [
186:   { value: 'minimal', label: formatFeedbackIntensity('minimal', 'zh-CN') },
187:   { value: 'balanced', label: formatFeedbackIntensity('balanced', 'zh-CN') },
188:   { value: 'expressive', label: formatFeedbackIntensity('expressive', 'zh-CN') },
189: ] as const
190: const feedbackLocaleOptions = [
191:   { value: 'en', label: 'English' },
192:   { value: 'zh-CN', label: '简体中文' },
193: ] as const
194: const feedbackVariantOptions = [
195:   { value: 'default', label: 'Default' },
196:   { value: 'a', label: 'A' },
197:   { value: 'b', label: 'B' },
198: ] as const
199: const expressionSignalConfidenceText = computed(() => expressionSignalConfidence.value.toFixed(2))
200: const currentExpressionSignalText = computed(() => {
201:   const signal = stableExpressionSignal.value !== 'none'
202:     ? stableExpressionSignal.value
203:     : expressionSignal.value
204:   return formatExpressionSignal(signal, statusLocale.value)
205: })
206: const expressionSignalCooldownRemainingMs = computed(() => {
207:   return Math.max(0, expressionSignalCooldownUntil.value - Date.now())
208: })
209: const expressionSignalCooldownRemainingSeconds = computed(() => {
210:   return Math.ceil(expressionSignalCooldownRemainingMs.value / 1000)
211: })
212: const expressionSignalChangedText = computed(() => {
213:   if (!expressionSignalChangedAt.value)
214:     return '无'
215:   return new Date(expressionSignalChangedAt.value).toLocaleTimeString()
216: })
217:
218: const faceCenterText = computed(() => {
219:   if (facePresence.value === 'absent')
220:     return '未检测到'
221:   if (!faceCenter.value)
222:     return '未知'
223:   return `x=${faceCenter.value.x.toFixed(2)}, y=${faceCenter.value.y.toFixed(2)}`
224: })
225:
226: const lastInferenceText = computed(() => {
227:   if (!lastInferenceAt.value)
228:     return '无'
229:   return new Date(lastInferenceAt.value).toLocaleTimeString()
230: })
231:
232: const cameraStateText = computed(() => {
233:   return formatVisionStatusValue(cameraState.value, statusLocale.value)
234: })
235: const cameraPermissionStateText = computed(() => {
236:   return formatVisionStatusValue(cameraPermissionState.value, statusLocale.value)
237: })
238: const mediaPipeStatusText = computed(() => {
239:   return formatVisionStatusValue(mediaPipeStatus.value, statusLocale.value)
240: })
241: const openCvStatusText = computed(() => {
242:   return formatVisionStatusValue(openCvFaceQuality.status.value, statusLocale.value)
243: })
244:
245: const facePresenceText = computed(() => {
246:   return formatFacePresence(facePresence.value, statusLocale.value)
247: })
248:
249: const faceDirectionText = computed(() => {
250:   return formatFaceDirection(faceDirection.value, statusLocale.value)
251: })
252:
253: const gestureText = computed(() => {
254:   const map: Record<string, string> = {
255:     none: '无',
256:     open_palm: '张开手掌',
257:     victory: '胜利手势',
258:     thumbs_up: '竖拇指',
259:     unknown: '未知',
260:   }
261:   return map[lastGesture.value] ?? lastGesture.value
262: })
263: const gestureConfidenceText = computed(() => gestureConfidence.value.toFixed(2))
264: const gestureVoteText = computed(() => `${gestureVoteCount.value}/${gestureVoteWindowSize.value}`)
265: const geometryPassRateText = computed(() => geometryPassRate.value.toFixed(2))
266: const handSizeRatioText = computed(() => handSizeRatio.value.toFixed(3))
267: const holdProgressText = computed(() => `${Math.round(holdProgressMs.value)}ms / ${Math.round(holdDurationMs.value)}ms`)
268: const cooldownRemainingText = computed(() => `${Math.max(0, Math.round(cooldownRemainingMs.value))}ms`)
269: const showAdvancedGestureDiagnostics = computed(() => {
270:   return gestureControlsEnabled.value && gestureDiagnosticsExpanded.value
271: })
272: const gestureCalibrationHint = computed(() => {
273:   if (!gestureControlsEnabled.value)
274:     return 'Enable experimental gesture controls to view diagnostics.'
275:   if (releaseRequired.value)
276:     return 'Release your hand to trigger again.'
277:   if (gestureQualityState.value === 'too_far')
278:     return 'Move your hand closer.'
279:   if (gestureQualityState.value === 'out_of_frame')
280:     return 'Keep your hand inside the guide area.'
281:   if (gestureQualityState.value === 'too_fast')
282:     return 'Hold the gesture steady.'
283:   if (gestureQualityState.value === 'low_confidence')
284:     return 'Better lighting may help.'
285:   if (gestureState.value === 'candidate' || gestureState.value === 'stable')
286:     return 'Hold the gesture steady.'
287:   return 'Gesture input looks good.'
288: })
289:
290: const profileStatusText = computed(() => {
291:   const map: Record<string, string> = {
292:     none: '未录入',
293:     encrypted: '已加密（锁定）',
294:     unlocked: '已解锁',
295:   }
296:   return map[profileStatus.value] ?? profileStatus.value
297: })
298:
299: const gateStateText = computed(() => {
300:   return formatGateStatus(localFaceGate.gateState.value, statusLocale.value)
301: })
302: const gateProfileStatusText = computed(() => {
303:   return formatMatchStatus(localFaceGate.profileStatus.value, statusLocale.value)
304: })
305: const matchedUserLabelText = computed(() => {
306:   const hasMatchedUser = matchedDisplayName.value.trim().length > 0
307:   if (!hasMatchedUser)
308:     return ''
309:   const isRuntimeMatched = localFaceGate.profileStatus.value === 'matched'
310:     && facePresence.value === 'present'
311:   return isRuntimeMatched ? '当前用户' : '已录入用户'
312: })
313:
314: const modelWarmupStatusText = computed(() => {
315:   const map: Record<string, string> = {
316:     idle: '未预热',
317:     warming: '预热中',
318:     ready: '已就绪',
319:     fallback_remote: '回退远程',
320:   }
321:   return map[modelWarmupStatus.value] ?? modelWarmupStatus.value
322: })
323:
324: const modelSourceText = computed(() => {
325:   const map: Record<string, string> = {
326:     local: '本地',
327:     remote: '远程',
328:     unknown: '未知',
329:   }
330:   return map[modelSource.value] ?? modelSource.value
331: })
332: const runtimeStatusText = computed(() => {
333:   const map: Record<string, string> = {
334:     idle: 'idle',
335:     warming: 'warming',
336:     ready: 'ready',
337:     partial_ready: 'partial_ready',
338:     failed: 'failed',
339:     resetting: 'resetting',
340:   }
341:   return map[runtimeStatus.value] ?? runtimeStatus.value
342: })
343: const runtimeWarmupDurationText = computed(() => formatTiming(runtimeWarmupDurationMs.value))
344:
345: const permissionTimingText = computed(() => formatTiming(startTiming.value.permissionMs))
346: const videoPlayTimingText = computed(() => formatTiming(startTiming.value.videoPlayMs))
347: const recognizerInitTimingText = computed(() => formatTiming(startTiming.value.recognizerInitMs))
348: const totalTimingText = computed(() => formatTiming(startTiming.value.totalMs))
349: const readyForPreviewTimingText = computed(() => formatTiming(startTiming.value.readyForPreviewMs))
350: const petFeedbackStateText = computed(() => {
351:   const map: Record<string, string> = {
352:     idle: 'idle',
353:     quiet: 'quiet',
354:     celebrating: 'celebrating',
355:     acknowledged: 'acknowledged',
356:     gated: 'gated',
357:   }
358:   return map[petFeedbackState.value] ?? petFeedbackState.value
359: })
360: const lastPetFeedbackSummary = computed(() => {
361:   if (!lastPetFeedback.value)
362:     return '无'
363:   return `${lastPetFeedback.value.summary} (${new Date(lastPetFeedback.value.at).toLocaleTimeString()})`
364: })
365: const shouldShowPetFeedbackGatedHint = computed(() => {
366:   if (petFeedbackState.value === 'gated')
367:     return true
368:   return lastEvent.value?.type === 'detected_but_gated'
369:     || lastEvent.value?.type === 'subject_position_gated'
370: })
371: const subjectPositionText = computed(() => {
372:   if (facePresence.value === 'absent')
373:     return '无主体'
374:   return formatFaceDirection(subjectPosition.value, statusLocale.value)
375: })
376: const stableSubjectPositionText = computed(() => {
377:   if (facePresence.value === 'absent')
378:     return '无主体'
379:   return formatFaceDirection(lastStableSubjectPosition.value, statusLocale.value)
380: })
381: const interactionSubjectResponseStateText = computed(() => {
382:   return formatSubjectResponseState(interactionSubjectResponseState.value, statusLocale.value)
383: })
384: const petSubjectResponseStateText = computed(() => {
385:   return formatSubjectResponseState(petSubjectResponseState.value, statusLocale.value)
386: })
387: const subjectResponseGateText = computed(() => {
388:   return canTriggerSubjectPositionResponse.value
389:     ? formatVisionStatusValue('allowed', statusLocale.value)
390:     : formatVisionStatusValue('gated', statusLocale.value)
391: })
392: const subjectResponseGateHintText = computed(() => {
393:   if (canTriggerSubjectPositionResponse.value)
394:     return '已匹配，可触发位置反馈。'
395:   if (localFaceGate.profileStatus.value === 'no_face')
396:     return '未检测到人脸，位置反馈已拦截。'
397:   if (localFaceGate.profileStatus.value === 'multiple_faces')
398:     return '多人入镜，位置反馈已拦截。'
399:   if (localFaceGate.gateState.value === 'locked')
400:     return '门控已锁定，等待解锁或匹配。'
401:   return '未匹配主体，位置反馈已拦截。'
402: })
403: const subjectResponseCooldownSeconds = computed(() => {
404:   const now = Date.now()
405:   const interactionRemainingMs = Math.max(0, subjectResponseCooldownUntil.value - now)
406:   const petRemainingMs = Math.max(0, petSubjectResponseCooldownUntil.value - now)
407:   const remainingMs = Math.max(interactionRemainingMs, petRemainingMs)
408:   return Math.ceil(remainingMs / 1000)
409: })
410: const subjectPositionChangedText = computed(() => {
411:   if (!subjectPositionChangedAt.value)
412:     return '无'
413:   return new Date(subjectPositionChangedAt.value).toLocaleTimeString()
414: })
415: const lastSubjectResponseSummary = computed(() => {
416:   if (interactionLastSubjectResponseEvent.value) {
417:     const when = new Date(interactionLastSubjectResponseEvent.value.at).toLocaleTimeString()
418:     return `${interactionLastSubjectResponseEvent.value.message} (${when})`
419:   }
420:   if (petLastSubjectResponseEvent.value) {
421:     const when = new Date(petLastSubjectResponseEvent.value.at).toLocaleTimeString()
422:     return `${petLastSubjectResponseEvent.value.summary} (${when})`
423:   }
424:   return '无'
425: })
426: const lastContextualFeedbackTypeText = computed(() => {
427:   return lastFeedbackType.value ?? '无'
428: })
429: const lastContextualFeedbackMessageText = computed(() => {
430:   if (!lastFeedbackMessage.value)
431:     return '无'
432:   return lastFeedbackMessage.value
433: })
434: const contextualFeedbackLevelText = computed(() => {
435:   return lastFeedbackLevel.value
436: })
437: const contextualFeedbackPriorityText = computed(() => {
438:   return lastFeedbackPriority.value
439: })
440: const contextualFeedbackChannelsText = computed(() => {
441:   if (lastFeedbackChannels.value.length === 0)
442:     return '无'
443:   return lastFeedbackChannels.value.join(', ')
444: })
445: const contextualFeedbackTemplateIdText = computed(() => {
446:   return lastFeedbackTemplateId.value ?? '无'
447: })
448: const resolvedFeedbackEventTypeText = computed(() => {
449:   return lastResolvedFeedbackEventType.value ?? '无'
450: })
451: const transitionFeedbackBadgeText = computed(() => {
452:   return lastIsTransitionFeedback.value ? 'transition' : 'base'
453: })
454: const activeBubbleMessageText = computed(() => {
455:   if (!activeBubbleMessage.value)
456:     return '无'
457:   return activeBubbleMessage.value
458: })
459: const activeBubbleLevelText = computed(() => {
460:   return activeBubbleLevel.value ?? '无'
461: })
462: const activeBubbleEventTypeText = computed(() => {
463:   return activeBubbleEventType.value ?? '无'
464: })
465: const activeBubbleTemplateIdText = computed(() => {
466:   return activeBubbleTemplateId.value ?? '无'
467: })
468: const bubbleRemainingSeconds = computed(() => {
469:   return Math.ceil(bubbleRemainingMs.value / 1000)
470: })
471: const bubbleVisible = computed(() => {
472:   return activeBubbleMessage.value.trim().length > 0 && bubbleRemainingMs.value > 0
473: })
474: const nextAllowedFeedbackSeconds = computed(() => {
475:   return Math.ceil(nextAllowedFeedbackIn.value / 1000)
476: })
477: const dwellStatusText = computed(() => {
478:   if (!lastFeedbackType.value)
479:     return '无'
480:   if (lastFeedbackType.value === 'subject_dwelled_left')
481:     return 'dwelled_left'
482:   if (lastFeedbackType.value === 'subject_dwelled_right')
483:     return 'dwelled_right'
484:   if (lastFeedbackType.value === 'subject_dwelled_center')
485:     return 'dwelled_center'
486:   return 'inactive'
487: })
488: const visionDiagnosticsLastError = computed(() => {
489:   if (errorMessage.value)
490:     return errorMessage.value
491:   if (runtimeLastError.value)
492:     return runtimeLastError.value
493:   if (openCvFaceQuality.errorMessage.value)
494:     return openCvFaceQuality.errorMessage.value
495:   return 'none'
496: })
497: const rootClasses = computed(() => {
498:   if (props.embedded) {
499:     return [
500:       'relative w-full',
501:       'max-h-[68vh] overflow-y-auto',
502:     ]
503:   }
504:
505:   return ['fixed left-3 top-14 z-20']
506: })
507:
508: function localizeVisionText(zhCN: string, en: string) {
509:   return statusLocale.value === 'en' ? en : zhCN
510: }
511:
512: const visionRecoveryIssue = computed(() => {
513:   const hasCameraIssue = cameraPermissionState.value === 'denied'
514:     || cameraPermissionState.value === 'unsupported'
515:     || cameraState.value === 'error'
516:
517:   if (hasCameraIssue) {
518:     return {
519:       id: 'camera',
520:       title: localizeVisionText('摄像头暂不可用', 'Camera is unavailable'),
521:       description: localizeVisionText(
522:         '请先检查系统摄像头权限，然后重试开启摄像头。',
523:         'Check camera permission first, then retry camera startup.',
524:       ),
525:       actions: [
526:         {
527:           id: 'retry-camera',
528:           label: localizeVisionText('重试摄像头', 'Retry camera'),
529:           handler: handleRetryCamera,
530:         },
531:         {
532:           id: 'open-settings',
533:           label: localizeVisionText('打开设置', 'Open settings'),
534:           handler: openSettingsPage,
535:         },
536:       ],
537:     }
538:   }
539:
540:   const hasRuntimeIssue = runtimeStatus.value === 'failed'
541:     || runtimeLastError.value.trim().length > 0
542:
543:   if (hasRuntimeIssue) {
544:     return {
545:       id: 'runtime',
546:       title: localizeVisionText('视觉运行时需要恢复', 'Vision runtime needs recovery'),
547:       description: localizeVisionText(
548:         '运行时初始化失败或状态异常。你可以先重试，再执行重置。',
549:         'Runtime startup failed or became unstable. Retry first, then reset if needed.',
550:       ),
551:       actions: [
552:         {
553:           id: 'retry-runtime',
554:           label: localizeVisionText('重试 Runtime', 'Retry runtime'),
555:           handler: handleRetryRuntime,
556:         },
557:         {
558:           id: 'reset-runtime',
559:           label: localizeVisionText('重置 Runtime', 'Reset runtime'),
560:           handler: handleResetRuntime,
561:         },
562:       ],
563:     }
564:   }
565:
566:   const gateBlocked = gateEnabled.value && (
567:     localFaceGate.gateState.value === 'locked'
568:     || localFaceGate.profileStatus.value === 'unmatched'
569:     || localFaceGate.profileStatus.value === 'no_face'
570:     || localFaceGate.profileStatus.value === 'multiple_faces'
571:   )
572:
573:   if (gateBlocked) {
574:     return {
575:       id: 'gate',
576:       title: localizeVisionText('反馈被门控拦截', 'Feedback is blocked by face gate'),
577:       description: localizeVisionText(
578:         '当前主体未通过门控条件。请保持单人入镜并完成匹配，或前往录入页确认档案。',
579:         'Current subject does not pass gate conditions. Keep one face in frame and match profile, or verify enrollment.',
580:       ),
581:       actions: [
582:         {
583:           id: 'open-enrollment',
584:           label: localizeVisionText('打开录入页', 'Open enrollment'),
585:           handler: openEnrollmentPage,
586:         },
587:       ],
588:     }
589:   }
590:
591:   return null
592: })
593:
594: watch(videoRef, element => attachVideoElement(element), { immediate: true })
595:
596: watch(maxInferenceStallMs, (value) => {
597:   const text = String(value)
598:   if (text !== maxInferenceStallInput.value)
599:     maxInferenceStallInput.value = text
600: })
601:
602: watch(maxInferenceStallInput, (value) => {
603:   const parsed = Number.parseInt(value, 10)
604:   if (!Number.isFinite(parsed))
605:     return
606:   setMaxInferenceStallMs(parsed)
607: })
608:
609: watch(lastEvent, (event) => {
610:   if (!event)
611:     return
612:   if (event.toastMessage && !isContextualInteractionEvent(event.type))
613:     toast.message(event.toastMessage)
614:   applyPetFeedbackForEvent(event)
615: })
616:
617: watch(isEnabled, (enabled) => {
618:   if (!enabled) {
619:     clearSubjectDwellTimer()
620:     clearPetFeedback()
621:   }
622: })
623:
624: watch(
625:   [lastStableSubjectPosition, subjectPosition, facePresence, canTriggerSubjectPositionResponse],
626:   () => {
627:     scheduleSubjectDwellFeedback()
628:   },
629: )
630:
631: watch(() => localFaceGate.profileStatus.value, (status) => {
632:   if (status !== 'uncertain')
633:     return
634:   triggerContextualVisionFeedback('subject_uncertain', {
635:     allowVisualFeedback: canTriggerSubjectPositionResponse.value,
636:     gateEnabled: gateEnabled.value,
637:     gateState: localFaceGate.gateState.value,
638:     gateProfileStatus: localFaceGate.profileStatus.value,
639:     presence: facePresence.value,
640:     direction: subjectPosition.value,
641:     displayName: matchedDisplayName.value || undefined,
642:   })
643:   if (petLastSubjectResponseEvent.value?.toastMessage)
644:     toast.message(petLastSubjectResponseEvent.value.toastMessage)
645: })
646:
647: onMounted(() => {
648:   scheduleRuntimeWarmup({
649:     delayMs: BACKGROUND_WARMUP_DELAY_MS,
650:     trackLoadingState: false,
651:     reportToast: false,
652:   })
653: })
654:
655: onBeforeUnmount(() => {
656:   clearScheduledWarmup()
657:   clearSubjectDwellTimer()
658: })
659:
660: function toggleCamera() {
661:   if (isEnabled.value) {
662:     void stop()
663:     return
664:   }
665:   void start()
666: }
667:
668: function toggleGate() {
669:   setFaceGateEnabled(!gateEnabled.value)
670: }
671:
672: function toggleGestureControls(event: Event) {
673:   const enabled = (event.target as HTMLInputElement).checked
674:   setGestureControlsEnabled(enabled)
675: }
676:
677: function toggleExpressionSignals(event: Event) {
678:   const enabled = (event.target as HTMLInputElement).checked
679:   setExpressionSignalsEnabled(enabled)
680: }
681:
682: function openEnrollmentPage() {
683:   void router.push('/vision-enrollment')
684: }
685:
686: function openSettingsPage() {
687:   void router.push('/settings')
688: }
689:
690: async function handleRetryCamera() {
691:   try {
692:     await start()
693:     toast.success(localizeVisionText('已重新尝试开启摄像头。', 'Retried camera startup.'))
694:   }
695:   catch {
696:     toast.error(localizeVisionText('摄像头重试失败。', 'Camera retry failed.'))
697:   }
698: }
699:
700: async function unlockProfile() {
701:   if (!unlockPassphrase.value.trim())
702:     return
703:   unlocking.value = true
704:   try {
705:     const result = await unlockFaceProfile(unlockPassphrase.value, {
706:       rememberOnDevice: rememberOnDevice.value,
707:     })
708:     if (result.ok)
709:       unlockPassphrase.value = ''
710:   }
711:   finally {
712:     unlocking.value = false
713:   }
714: }
715:
716: watch(rememberFaceProfileOnDevice, (value) => {
717:   rememberOnDevice.value = value
718: }, { immediate: true })
719:
720: async function toggleRememberOnDevice(event: Event) {
721:   const nextValue = (event.target as HTMLInputElement).checked
722:   const accepted = await setRememberFaceProfileOnDevice(nextValue)
723:   rememberOnDevice.value = accepted && nextValue
724: }
725:
726: async function handlePrewarmVision() {
727:   if (prewarming.value)
728:     return
729:   toast.message(localizeVisionText(
730:     '视觉运行时预热已加入后台队列。',
731:     'Vision runtime warmup queued for idle background.',
732:   ))
733:   scheduleRuntimeWarmup({
734:     delayMs: 0,
735:     trackLoadingState: true,
736:     reportToast: true,
737:   })
738: }
739:
740: async function handleRetryRuntime() {
741:   if (prewarming.value)
742:     return
743:   prewarming.value = true
744:   try {
745:     await retryVisionRuntime()
746:     toast.success(localizeVisionText('视觉运行时重试完成。', 'Vision runtime retry completed.'))
747:   }
748:   catch {
749:     toast.error(localizeVisionText('视觉运行时重试失败。', 'Vision runtime retry failed.'))
750:   }
751:   finally {
752:     prewarming.value = false
753:   }
754: }
755:
756: async function handleResetRuntime() {
757:   if (prewarming.value)
758:     return
759:   prewarming.value = true
760:   try {
761:     await resetVisionRuntime()
762:     toast.message(localizeVisionText('视觉运行时重置完成。', 'Vision runtime reset complete.'))
763:   }
764:   finally {
765:     prewarming.value = false
766:   }
767: }
768:
769: function formatTiming(ms: number | null) {
770:   if (ms === null || !Number.isFinite(ms))
771:     return '无'
772:   return `${ms.toFixed(1)} ms`
773: }
774:
775: function clearScheduledWarmup() {
776:   if (scheduledWarmupTimerId !== null) {
777:     clearTimeout(scheduledWarmupTimerId)
778:     scheduledWarmupTimerId = null
779:   }
780:
781:   if (scheduledIdleCallbackId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
782:     window.cancelIdleCallback(scheduledIdleCallbackId)
783:     scheduledIdleCallbackId = null
784:   }
785: }
786:
787: function clearSubjectDwellTimer() {
788:   if (subjectDwellTimerId === null)
789:     return
790:   clearTimeout(subjectDwellTimerId)
791:   subjectDwellTimerId = null
792: }
793:
794: function isContextualInteractionEvent(eventType: VisionInteractionEvent['type']) {
795:   return eventType === 'user_moved_left'
796:     || eventType === 'user_moved_right'
797:     || eventType === 'user_moved_up'
798:     || eventType === 'user_moved_down'
799:     || eventType === 'user_centered'
800:     || eventType === 'expression_smile_like_detected'
801:     || eventType === 'expression_stable_face_detected'
802:     || eventType === 'expression_looking_away_detected'
803:     || eventType === 'expression_unclear_detected'
804:     || eventType === 'subject_position_gated'
805:     || eventType === 'subject_matched'
806:     || eventType === 'welcome_back'
807:     || eventType === 'user_away'
808:     || eventType === 'detected_but_gated'
809: }
810:
811: function emitLastContextualToastForEvent(sourceEventId: number) {
812:   const event = petLastSubjectResponseEvent.value
813:   if (!event)
814:     return
815:   if (event.sourceEventId !== sourceEventId)
816:     return
817:   if (!event.toastMessage)
818:     return
819:   toast.message(event.toastMessage)
820: }
821:
822: function onFeedbackIntensityChange(event: Event) {
823:   const value = (event.target as HTMLSelectElement).value
824:   if (value !== 'minimal' && value !== 'balanced' && value !== 'expressive')
825:     return
826:   setFeedbackIntensity(value)
827: }
828:
829: function onFeedbackLocaleChange(event: Event) {
830:   const value = (event.target as HTMLSelectElement).value
831:   if (value !== 'en' && value !== 'zh-CN')
832:     return
833:   setFeedbackLocale(value)
834: }
835:
836: function onFeedbackVariantChange(event: Event) {
837:   const value = (event.target as HTMLSelectElement).value
838:   if (value !== 'default' && value !== 'a' && value !== 'b')
839:     return
840:   setFeedbackVariant(value)
841: }
842:
843: function scheduleSubjectDwellFeedback() {
844:   clearSubjectDwellTimer()
845:   const stablePosition = lastStableSubjectPosition.value
846:   const shouldTrackDwell = stablePosition === 'left'
847:     || stablePosition === 'right'
848:     || stablePosition === 'center'
849:
850:   if (!shouldTrackDwell)
851:     return
852:   if (facePresence.value !== 'present')
853:     return
854:   if (subjectPosition.value !== stablePosition)
855:     return
856:
857:   const eventType = stablePosition === 'left'
858:     ? 'subject_dwelled_left'
859:     : stablePosition === 'right'
860:       ? 'subject_dwelled_right'
861:       : 'subject_dwelled_center'
862:
863:   subjectDwellTimerId = window.setTimeout(() => {
864:     subjectDwellTimerId = null
865:     if (facePresence.value !== 'present')
866:       return
867:     if (lastStableSubjectPosition.value !== stablePosition)
868:       return
869:
870:     triggerContextualVisionFeedback(eventType, {
871:       allowVisualFeedback: canTriggerSubjectPositionResponse.value,
872:       gateEnabled: gateEnabled.value,
873:       gateState: localFaceGate.gateState.value,
874:       gateProfileStatus: localFaceGate.profileStatus.value,
875:       presence: facePresence.value,
876:       direction: stablePosition,
877:       displayName: matchedDisplayName.value || undefined,
878:     })
879:     if (petLastSubjectResponseEvent.value?.toastMessage)
880:       toast.message(petLastSubjectResponseEvent.value.toastMessage)
881:   }, SUBJECT_DWELL_THRESHOLD_MS)
882: }
883:
884: function scheduleRuntimeWarmup(options: {
885:   delayMs: number
886:   trackLoadingState: boolean
887:   reportToast: boolean
888: }) {
889:   clearScheduledWarmup()
890:
891:   const runWarmup = async () => {
892:     if (options.trackLoadingState)
893:       prewarming.value = true
894:
895:     try {
896:       await warmupVisionRuntime({
897:         background: true,
898:         includeOpenCv: false,
899:       })
900:       if (options.reportToast)
901:         toast.success(localizeVisionText('视觉运行时预热完成。', 'Vision runtime warmed up.'))
902:     }
903:     catch {
904:       if (options.reportToast)
905:         toast.error(localizeVisionText('视觉运行时预热失败。', 'Vision runtime warmup failed.'))
906:     }
907:     finally {
908:       if (options.trackLoadingState)
909:         prewarming.value = false
910:     }
911:   }
912:
913:   const dispatchWarmup = () => {
914:     const hasIdleCallback = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
915:     if (hasIdleCallback) {
916:       scheduledIdleCallbackId = window.requestIdleCallback(() => {
917:         scheduledIdleCallbackId = null
918:         void runWarmup()
919:       }, { timeout: BACKGROUND_WARMUP_IDLE_TIMEOUT_MS })
920:       return
921:     }
922:
923:     void runWarmup()
924:   }
925:
926:   if (options.delayMs <= 0) {
927:     dispatchWarmup()
928:     return
929:   }
930:
931:   scheduledWarmupTimerId = window.setTimeout(() => {
932:     scheduledWarmupTimerId = null
933:     dispatchWarmup()
934:   }, options.delayMs)
935: }
936:
937: function createPetFeedbackOptions(event: VisionInteractionEvent) {
938:   return {
939:     allowVisualFeedback: canTriggerInteractiveFeedback.value,
940:     gateEnabled: gateEnabled.value,
941:     gateState: localFaceGate.gateState.value,
942:     gateProfileStatus: localFaceGate.profileStatus.value,
943:     presence: facePresence.value,
944:     sourceEventId: event.id,
945:     displayName: matchedDisplayName.value || undefined,
946:   }
947: }
948:
949: function directionFromEventType(eventType: VisionInteractionEvent['type']) {
950:   if (eventType === 'user_moved_left')
951:     return 'left'
952:   if (eventType === 'user_moved_right')
953:     return 'right'
954:   if (eventType === 'user_moved_up')
955:     return 'up'
956:   if (eventType === 'user_moved_down')
957:     return 'down'
958:   return 'center'
959: }
960:
961: function applyPetFeedbackForEvent(event: VisionInteractionEvent) {
962:   if (event.type === 'quiet_mode_requested') {
963:     triggerVisionPetFeedback('open_palm', createPetFeedbackOptions(event))
964:     return
965:   }
966:
967:   if (event.type === 'completion_celebration') {
968:     triggerVisionPetFeedback('victory', createPetFeedbackOptions(event))
969:     return
970:   }
971:
972:   if (event.type === 'acknowledged') {
973:     triggerVisionPetFeedback('thumbs_up', createPetFeedbackOptions(event))
974:     return
975:   }
976:
977:   if (
978:     event.type === 'expression_smile_like_detected'
979:     || event.type === 'expression_stable_face_detected'
980:     || event.type === 'expression_looking_away_detected'
981:     || event.type === 'expression_unclear_detected'
982:   ) {
983:     const mappedSignal = event.type === 'expression_smile_like_detected'
984:       ? 'smile_like_signal'
985:       : event.type === 'expression_stable_face_detected'
986:         ? 'stable_face_signal'
987:         : event.type === 'expression_looking_away_detected'
988:           ? 'looking_away_signal'
989:           : 'unclear_face_signal'
990:
991:     triggerExpressionSignalFeedback({
992:       signal: mappedSignal,
993:       confidence: expressionSignalConfidence.value,
994:       reason: expressionSignalReason.value,
995:       source: expressionSignalSource.value,
996:       gateAllowed: expressionSignalFeedbackAllowed.value,
997:       gateEnabled: gateEnabled.value,
998:       gateState: localFaceGate.gateState.value,
999:       gateProfileStatus: localFaceGate.profileStatus.value,
1000:       quietMode: isVisionQuiet.value,
1001:       locale: feedbackLocale.value,
1002:       variant: feedbackVariant.value,
1003:       displayName: matchedDisplayName.value || undefined,
1004:       sourceEventId: event.id,
1005:       presence: facePresence.value,
1006:     })
1007:     emitLastContextualToastForEvent(event.id)
1008:     return
1009:   }
1010:
1011:   if (event.type === 'subject_matched') {
1012:     triggerContextualVisionFeedback('subject_matched', {
1013:       allowVisualFeedback: canTriggerSubjectPositionResponse.value,
1014:       gateEnabled: gateEnabled.value,
1015:       gateState: localFaceGate.gateState.value,
1016:       gateProfileStatus: localFaceGate.profileStatus.value,
1017:       presence: facePresence.value,
1018:       sourceEventId: event.id,
1019:       direction: subjectPosition.value,
1020:       displayName: matchedDisplayName.value || undefined,
1021:     })
1022:     emitLastContextualToastForEvent(event.id)
1023:     return
1024:   }
1025:
1026:   if (event.type === 'welcome_back') {
1027:     triggerContextualVisionFeedback('subject_returned', {
1028:       allowVisualFeedback: canTriggerSubjectPositionResponse.value,
1029:       gateEnabled: gateEnabled.value,
1030:       gateState: localFaceGate.gateState.value,
1031:       gateProfileStatus: localFaceGate.profileStatus.value,
1032:       presence: facePresence.value,
1033:       sourceEventId: event.id,
1034:       direction: subjectPosition.value,
1035:       displayName: matchedDisplayName.value || undefined,
1036:     })
1037:     emitLastContextualToastForEvent(event.id)
1038:     return
1039:   }
1040:
1041:   if (event.type === 'user_away') {
1042:     triggerContextualVisionFeedback('subject_absent', {
1043:       allowVisualFeedback: canTriggerSubjectPositionResponse.value,
1044:       gateEnabled: gateEnabled.value,
1045:       gateState: localFaceGate.gateState.value,
1046:       gateProfileStatus: localFaceGate.profileStatus.value,
1047:       presence: facePresence.value,
1048:       sourceEventId: event.id,
1049:       direction: subjectPosition.value,
1050:       displayName: matchedDisplayName.value || undefined,
1051:     })
1052:     emitLastContextualToastForEvent(event.id)
1053:     return
1054:   }
1055:
1056:   if (event.type === 'user_moved_left') {
1057:     triggerContextualVisionFeedback('subject_moved_left', {
1058:       ...createPetFeedbackOptions(event),
1059:       direction: event.subjectPosition ?? directionFromEventType(event.type),
1060:     })
1061:     emitLastContextualToastForEvent(event.id)
1062:     return
1063:   }
1064:
1065:   if (event.type === 'user_moved_right') {
1066:     triggerContextualVisionFeedback('subject_moved_right', {
1067:       ...createPetFeedbackOptions(event),
1068:       direction: event.subjectPosition ?? directionFromEventType(event.type),
1069:     })
1070:     emitLastContextualToastForEvent(event.id)
1071:     return
1072:   }
1073:
1074:   if (event.type === 'user_moved_up') {
1075:     triggerContextualVisionFeedback('subject_moved_up', {
1076:       ...createPetFeedbackOptions(event),
1077:       direction: event.subjectPosition ?? directionFromEventType(event.type),
1078:     })
1079:     emitLastContextualToastForEvent(event.id)
1080:     return
1081:   }
1082:
1083:   if (event.type === 'user_moved_down') {
1084:     triggerContextualVisionFeedback('subject_moved_down', {
1085:       ...createPetFeedbackOptions(event),
1086:       direction: event.subjectPosition ?? directionFromEventType(event.type),
1087:     })
1088:     emitLastContextualToastForEvent(event.id)
1089:     return
1090:   }
1091:
1092:   if (event.type === 'user_centered') {
1093:     triggerContextualVisionFeedback('subject_centered', {
1094:       ...createPetFeedbackOptions(event),
1095:       direction: event.subjectPosition ?? directionFromEventType(event.type),
1096:     })
1097:     emitLastContextualToastForEvent(event.id)
1098:     return
1099:   }
1100:
1101:   if (event.type === 'subject_position_gated') {
1102:     triggerContextualVisionFeedback('subject_gated', {
1103:       ...createPetFeedbackOptions(event),
1104:       direction: event.subjectPosition ?? 'unknown',
1105:       allowVisualFeedback: false,
1106:     })
1107:     emitLastContextualToastForEvent(event.id)
1108:     return
1109:   }
1110:
1111:   if (event.type === 'detected_but_gated') {
1112:     triggerVisionPetFeedback('gated', {
1113:       ...createPetFeedbackOptions(event),
1114:       allowVisualFeedback: false,
1115:       summary: 'Gesture detected but pet feedback gated.',
1116:     })
1117:   }
1118: }
1119: </script>
1120:
1121: <template>
1122:   <div :class="rootClasses">
1123:     <div
1124:       :class="[
1125:         props.embedded ? 'w-full' : 'w-80',
1126:         'rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
1127:         'dark:border-neutral-700/70 dark:bg-neutral-900/80',
1128:       ]"
1129:     >
1130:       <div :class="['mb-2 flex items-center justify-between gap-2']">
1131:         <div :class="['text-sm font-700 text-neutral-800 dark:text-neutral-100']">
1132:           视觉交互
1133:         </div>
1134:         <Button v-if="!props.embedded" size="sm" variant="ghost" @click="collapsed = !collapsed">
1135:           {{ collapsed ? '展开' : '收起' }}
1136:         </Button>
1137:       </div>
1138:
1139:       <div v-if="props.embedded || !collapsed" :class="['flex flex-col gap-2']">
1140:         <div :class="['flex flex-wrap items-center gap-2']">
1141:           <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
1142:             {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
1143:           </Button>
1144:           <Button size="sm" variant="ghost" @click="openEnrollmentPage">
1145:             打开人脸录入页
1146:           </Button>
1147:           <Button
1148:             v-if="isExpertMode"
1149:             data-testid="advanced-diagnostics-toggle"
1150:             size="sm"
1151:             variant="ghost"
1152:             @click="advancedDiagnosticsExpanded = !advancedDiagnosticsExpanded"
1153:           >
1154:             {{ advancedDiagnosticsExpanded ? '收起 Advanced / Diagnostics' : '展开 Advanced / Diagnostics' }}
1155:           </Button>
1156:         </div>
1157:
1158:         <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1159:           <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1160:             运行状态
1161:           </div>
1162:           <div>{{ formatVisionFieldLabel('cameraState', statusLocale) }}：{{ cameraStateText }}</div>
1163:           <div>{{ formatVisionFieldLabel('facePresence', statusLocale) }}：{{ facePresenceText }}</div>
1164:           <div>{{ formatVisionFieldLabel('faceDirection', statusLocale) }}：{{ faceDirectionText }}</div>
1165:           <div>{{ formatVisionFieldLabel('faceGate', statusLocale) }}：{{ gateStateText }}</div>
1166:           <div>{{ formatVisionFieldLabel('matchStatus', statusLocale) }}：{{ gateProfileStatusText }}</div>
1167:           <div v-if="matchedDisplayName">
1168:             {{ matchedUserLabelText }}：{{ matchedDisplayName }}
1169:           </div>
1170:           <div>
1171:             {{ formatVisionFieldLabel('interactiveFeedback', statusLocale) }}：{{
1172:               canTriggerInteractiveFeedback
1173:                 ? formatVisionStatusValue('allowed', statusLocale)
1174:                 : formatVisionStatusValue('gated', statusLocale)
1175:             }}
1176:           </div>
1177:         </div>
1178:
1179:         <div
1180:           v-if="visionRecoveryIssue"
1181:           data-testid="vision-recovery-panel"
1182:           :class="[
1183:             'rounded-xl border border-amber-300/75 bg-amber-50/85 p-2 text-xs text-amber-900',
1184:             'dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-200',
1185:           ]"
1186:         >
1187:           <div class="font-semibold">
1188:             {{ visionRecoveryIssue.title }}
1189:           </div>
1190:           <div class="mt-1">
1191:             {{ visionRecoveryIssue.description }}
1192:           </div>
1193:           <div class="mt-2 flex flex-wrap gap-1.5">
1194:             <Button
1195:               v-for="action in visionRecoveryIssue.actions"
1196:               :key="action.id"
1197:               :data-testid="`vision-recovery-action-${action.id}`"
1198:               size="sm"
1199:               variant="ghost"
1200:               @click="action.handler"
1201:             >
1202:               {{ action.label }}
1203:             </Button>
1204:           </div>
1205:         </div>
1206:
1207:         <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1208:           <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1209:             主体位置反馈
1210:           </div>
1211:           <label :class="['mb-2 flex items-center gap-2']">
1212:             <span>反馈强度：</span>
1213:             <select
1214:               data-testid="feedback-intensity-select"
1215:               :value="feedbackIntensity"
1216:               :class="[
1217:                 'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
1218:                 'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
1219:               ]"
1220:               @change="onFeedbackIntensityChange"
1221:             >
1222:               <option
1223:                 v-for="option in feedbackIntensityOptions"
1224:                 :key="option.value"
1225:                 :value="option.value"
1226:               >
1227:                 {{ option.label }}
1228:               </option>
1229:             </select>
1230:           </label>
1231:           <div
1232:             v-if="bubbleVisible"
1233:             data-testid="vision-feedback-bubble"
1234:             :class="[
1235:               'mb-2 rounded-lg border px-2 py-1 text-xs',
1236:               activeBubbleLevel === 'strong'
1237:                 ? 'border-sky-500 bg-sky-100/80 text-sky-700 dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-200'
1238:                 : activeBubbleLevel === 'normal'
1239:                   ? 'border-emerald-500 bg-emerald-100/80 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200'
1240:                   : 'border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-200',
1241:             ]"
1242:           >
1243:             <div>Rin: {{ activeBubbleMessage }}</div>
1244:             <div :class="['mt-1 text-[11px] opacity-80']">
1245:               {{ activeBubbleLevelText }} · {{ bubbleRemainingSeconds }}s
1246:             </div>
1247:           </div>
1248:           <div>{{ formatVisionFieldLabel('latestBubble', statusLocale) }}：{{ activeBubbleMessageText }}</div>
1249:           <div>{{ formatVisionFieldLabel('faceCenter', statusLocale) }}：{{ faceCenterText }}</div>
1250:           <div>{{ formatVisionFieldLabel('subjectPosition', statusLocale) }}：{{ subjectPositionText }}</div>
1251:           <div>{{ formatVisionFieldLabel('stableSubjectPosition', statusLocale) }}：{{ stableSubjectPositionText }}</div>
1252:           <div>{{ formatVisionFieldLabel('subjectResponseState', statusLocale) }}：{{ interactionSubjectResponseStateText }}</div>
1253:           <div>{{ formatVisionFieldLabel('petSubjectResponseState', statusLocale) }}：{{ petSubjectResponseStateText }}</div>
1254:           <div>{{ formatVisionFieldLabel('subjectResponseGate', statusLocale) }}：{{ subjectResponseGateText }}</div>
1255:           <div>{{ formatVisionFieldLabel('lastFeedbackMessage', statusLocale) }}：{{ lastContextualFeedbackMessageText }}</div>
1256:           <div>{{ formatVisionFieldLabel('lastSubjectResponseEvent', statusLocale) }}：{{ lastSubjectResponseSummary }}</div>
1257:           <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
1258:             Rin 只会响应已匹配的主体。
1259:           </div>
1260:           <div :class="['text-neutral-500 dark:text-neutral-400']">
1261:             这是基于主体位置的类视线反馈，不是严格视线测量。
1262:           </div>
1263:           <div :class="['text-neutral-500 dark:text-neutral-400']">
1264:             {{ subjectResponseGateHintText }}
1265:           </div>
1266:           <div v-if="bubbleVisible" :class="['mt-1']">
1267:             <Button size="sm" variant="ghost" @click="clearBubble">
1268:               清除气泡
1269:             </Button>
1270:           </div>
1271:         </div>
1272:
1273:         <div data-testid="expression-signal-panel" :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1274:           <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1275:             面部动作信号
1276:           </div>
1277:           <label :class="['mb-2 flex items-center gap-2']">
1278:             <input
1279:               data-testid="expression-signal-toggle"
1280:               type="checkbox"
1281:               :checked="enableExpressionSignals"
1282:               @change="toggleExpressionSignals"
1283:             >
1284:             <span>启用面部动作信号</span>
1285:           </label>
1286:           <div>{{ formatVisionFieldLabel('faceMotionSignals', statusLocale) }}：{{ enableExpressionSignals ? '开启' : '关闭' }}</div>
1287:           <div>{{ formatVisionFieldLabel('currentSignal', statusLocale) }}：{{ currentExpressionSignalText }}</div>
1288:           <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
1289:             面部动作信号只是本地视觉线索，不是情绪识别。
1290:           </div>
1291:           <div :class="['text-neutral-500 dark:text-neutral-400']">
1292:             Rin 只会将它们用于本地反馈。
1293:           </div>
1294:           <div :class="['text-neutral-500 dark:text-neutral-400']">
1295:             不会上传任何面部动作数据。
1296:           </div>
1297:         </div>
1298:
1299:         <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1300:           <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
1301:             本地人脸门控
1302:           </div>
1303:           <div>门控开关：{{ gateEnabled ? '开启' : '关闭' }}</div>
1304:           <div>门控状态：{{ gateStateText }}</div>
1305:           <div>匹配状态：{{ profileStatusText }}</div>
1306:           <div>匹配细分：{{ gateProfileStatusText }}</div>
1307:           <div>距离：{{ localFaceGate.matchScore ?? '未知' }}</div>
1308:           <div>交互结果：{{ canTriggerInteractiveFeedback ? '放行' : '拦截' }}</div>
1309:           <div :class="['mt-2 flex items-center gap-2']">
1310:             <Button size="sm" :variant="gateEnabled ? 'secondary' : 'primary'" @click="toggleGate">
1311:               {{ gateEnabled ? '关闭人脸门控' : '开启人脸门控' }}
1312:             </Button>
1313:           </div>
1314:           <div v-if="matchedDisplayName" :class="['mt-1']">
1315:             {{ matchedUserLabelText }}：{{ matchedDisplayName }}
1316:           </div>
1317:           <div v-if="gateEnabled && hasEncryptedProfile && !isProfileUnlocked" :class="['mt-1 text-amber-600 dark:text-amber-300']">
1318:             人脸档案已锁定，解锁后才能启用门控交互。
1319:           </div>
1320:           <div v-if="hasEncryptedProfile && !isProfileUnlocked" :class="['mt-2 flex flex-col gap-1']">
1321:             <input
1322:               v-model="unlockPassphrase"
1323:               type="password"
1324:               placeholder="输入口令以解锁"
1325:               :class="[
1326:                 'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
1327:                 'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
1328:               ]"
1329:             >
1330:             <Button size="sm" variant="primary" :disabled="unlocking" @click="unlockProfile">
1331:               {{ unlocking ? '解锁中...' : '解锁档案' }}
1332:             </Button>
1333:             <label :class="['mt-1 flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300']">
1334:               <input
1335:                 :checked="rememberOnDevice"
1336:                 type="checkbox"
1337:                 :disabled="!secureStoreAvailable"
1338:                 @change="toggleRememberOnDevice"
1339:               >
1340:               <span>在本机记住并自动解锁</span>
1341:             </label>
1342:             <div
1343:               v-if="!secureStoreAvailable && isDev"
1344:               :class="['text-xs text-amber-600 dark:text-amber-300']"
1345:             >
1346:               当前环境未启用安全存储，无法开启无感自动解锁。
1347:             </div>
1348:           </div>
1349:         </div>
1350:
1351:         <div
1352:           v-if="isExpertMode && advancedDiagnosticsExpanded"
1353:           data-testid="advanced-diagnostics-panel"
1354:           :class="['rounded-xl border border-neutral-200/80 bg-neutral-50/85 p-2 text-xs dark:border-neutral-700/70 dark:bg-neutral-900/55']"
1355:         >
1356:           <div :class="['mb-2 font-600 text-neutral-700 dark:text-neutral-200']">
1357:             Advanced / Diagnostics
1358:           </div>
1359:
1360:           <div :class="['mb-2 flex flex-wrap items-center gap-2']">
1361:             <Button size="sm" variant="ghost" :disabled="prewarming" @click="handlePrewarmVision">
1362:               {{ prewarming ? '处理中...' : '预加载/重试 Runtime' }}
1363:             </Button>
1364:             <Button size="sm" variant="ghost" :disabled="prewarming" @click="handleRetryRuntime">
1365:               Retry Runtime
1366:             </Button>
1367:             <Button size="sm" variant="ghost" :disabled="prewarming" @click="handleResetRuntime">
1368:               Reset Runtime
1369:             </Button>
1370:           </div>
1371:
1372:           <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1373:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1374:               Vision Runtime
1375:             </div>
1376:             <div>status: {{ runtimeStatusText }}</div>
1377:             <div>warmupDuration: {{ runtimeWarmupDurationText }}</div>
1378:             <div>retryCount: {{ runtimeRetryCount }}</div>
1379:             <div>lastError: {{ runtimeLastError || 'none' }}</div>
1380:             <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
1381:               First startup may take a moment.
1382:             </div>
1383:             <div :class="['text-neutral-500 dark:text-neutral-400']">
1384:               Models are reused after warmup.
1385:             </div>
1386:             <div :class="['text-neutral-500 dark:text-neutral-400']">
1387:               Stop Camera releases camera only; models stay ready.
1388:             </div>
1389:           </div>
1390:
1391:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1392:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1393:               模型状态
1394:             </div>
1395:             <div>预热状态：{{ modelWarmupStatusText }}</div>
1396:             <div>当前来源：{{ modelSourceText }}</div>
1397:             <div>模型规格：{{ modelProfile }}</div>
1398:           </div>
1399:
1400:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1401:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1402:               Vision Diagnostics
1403:             </div>
1404:             <div>运行时状态：{{ runtimeStatusText }}</div>
1405:             <div>{{ formatVisionFieldLabel('cameraState', statusLocale) }}：{{ cameraStateText }}</div>
1406:             <div>摄像头权限：{{ cameraPermissionStateText }}</div>
1407:             <div>MediaPipe: {{ mediaPipeStatusText }}</div>
1408:             <div>OpenCV: {{ openCvStatusText }}</div>
1409:             <div>人脸档案：{{ profileStatus }}</div>
1410:             <div>{{ formatVisionFieldLabel('faceGate', statusLocale) }}：{{ gateStateText }} / {{ gateProfileStatusText }}</div>
1411:             <div>最近错误：{{ visionDiagnosticsLastError }}</div>
1412:           </div>
1413:
1414:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1415:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1416:               启动耗时
1417:             </div>
1418:             <div>权限请求：{{ permissionTimingText }}</div>
1419:             <div>video.play：{{ videoPlayTimingText }}</div>
1420:             <div>识别器初始化：{{ recognizerInitTimingText }}</div>
1421:             <div>可见画面就绪：{{ readyForPreviewTimingText }}</div>
1422:             <div>总耗时：{{ totalTimingText }}</div>
1423:           </div>
1424:
1425:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1426:             <div>最近手势：{{ gestureText }}</div>
1427:             <div>最近推理：{{ lastInferenceText }}</div>
1428:             <div>交互安静模式：{{ isVisionQuiet ? `进行中（${quietRemainingSeconds}秒）` : '未开启' }}</div>
1429:             <div>quietSuppressed: {{ feedbackSuppressedByQuiet ? 'yes' : 'no' }}</div>
1430:             <div>gateBlocked: {{ feedbackBlockedByGate ? 'yes' : 'no' }}</div>
1431:             <div>本地庆祝计数：{{ localCelebrationCount }}</div>
1432:             <div>Current pet state: {{ petFeedbackStateText }}</div>
1433:             <div>Last pet feedback: {{ lastPetFeedbackSummary }}</div>

(Output capped at 50 KB. Showing lines 1-1433. Use offset=1434 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import type { StageWindowSizeAction } from './window-size'
3:
4: import { defineInvoke } from '@moeru/eventa'
5: import { useElectronEventaContext, useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
6: import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
7: import { useTheme } from '@proj-airi/ui'
8: import { storeToRefs } from 'pinia'
9: import { computed, nextTick, reactive, ref, watch } from 'vue'
10: import { useI18n } from 'vue-i18n'
11:
12: import StudyIsland from '../study-island/index.vue'
13: import VisionIsland from '../vision-island/index.vue'
14: import ControlButtonTooltip from './control-button-tooltip.vue'
15: import ControlButton from './control-button.vue'
16: import ControlsIslandAuthButton from './controls-island-auth-button.vue'
17: import ControlsIslandFadeOnHover from './controls-island-fade-on-hover.vue'
18: import ControlsIslandHearingConfig from './controls-island-hearing-config.vue'
19: import ControlsIslandProfilePicker from './controls-island-profile-picker.vue'
20: import IndicatorMicVolume from './indicator-mic-volume.vue'
21:
22: import {
23:   electron,
24:   electronAppQuit,
25:   electronOpenChat,
26:   electronOpenSettings,
27:   electronStartDraggingWindow,
28:   electronWindowSetAlwaysOnTop,
29: } from '../../../../shared/eventa'
30: import { useControlsIslandStore } from '../../../stores/controls-island'
31: import { calculateStageWindowBoundsForAction } from './window-size'
32:
33: const { isDark, toggleDark } = useTheme()
34: const { t } = useI18n()
35:
36: const settingsAudioDeviceStore = useSettingsAudioDevice()
37: const settingsStore = useSettings()
38: const controlsIslandStore = useControlsIslandStore()
39: const context = useElectronEventaContext()
40: const { enabled } = storeToRefs(settingsAudioDeviceStore)
41: const { alwaysOnTop, controlsIslandIconSize } = storeToRefs(settingsStore)
42: const { moveModeEnabled, controlsPanelExpanded, controlsUIMode } = storeToRefs(controlsIslandStore)
43: const openSettings = useElectronEventaInvoke(electronOpenSettings)
44: const openChat = useElectronEventaInvoke(electronOpenChat)
45: const isLinux = useElectronEventaInvoke(electron.app.isLinux)
46: const closeWindow = useElectronEventaInvoke(electronAppQuit)
47: const setAlwaysOnTop = useElectronEventaInvoke(electronWindowSetAlwaysOnTop)
48: const getWindowBounds = useElectronEventaInvoke(electron.window.getBounds)
49: const setWindowBounds = useElectronEventaInvoke(electron.window.setBounds)
50: const getPrimaryDisplay = useElectronEventaInvoke(electron.screen.getPrimaryDisplay)
51:
52: const visionPanelVisible = ref(false)
53: const studyPanelExpanded = ref(false)
54: const studyPanelInteractionLocked = ref(false)
55: const shortcutsCardExpanded = ref(false)
56: const controlsPanelScrollElement = ref<HTMLElement | null>(null)
57: const visionPanelElement = ref<HTMLElement | null>(null)
58:
59: // Tracks open overlays/dialogs that should prevent auto-collapse (e.g. 'hearing', 'profile-picker')
60: const blockingOverlays = reactive(new Set<string>())
61:
62: const panelToggleLabel = computed(() => controlsPanelExpanded.value
63:   ? t('tamagotchi.stage.controls-island.collapse')
64:   : t('tamagotchi.stage.controls-island.expand'))
65: const controlsUIModeLabel = computed(() => controlsUIMode.value === 'novice'
66:   ? t('tamagotchi.stage.controls-island.ui-mode.novice')
67:   : t('tamagotchi.stage.controls-island.ui-mode.expert'))
68: const controlsUIModeToggleLabel = computed(() => controlsUIMode.value === 'novice'
69:   ? t('tamagotchi.stage.controls-island.ui-mode.switch-to-expert')
70:   : t('tamagotchi.stage.controls-island.ui-mode.switch-to-novice'))
71: const shortcutsToggleLabel = computed(() => shortcutsCardExpanded.value
72:   ? t('tamagotchi.stage.controls-island.shortcuts.toggle-close')
73:   : t('tamagotchi.stage.controls-island.shortcuts.toggle-open'))
74: const isNoviceMode = computed(() => controlsUIMode.value === 'novice')
75: const moveModeControlLabel = computed(() => moveModeEnabled.value
76:   ? t('tamagotchi.stage.controls-island.move-mode.disable')
77:   : t('tamagotchi.stage.controls-island.move-mode.enable'))
78: const studyPanelToggleLabel = computed(() => studyPanelExpanded.value
79:   ? t('tamagotchi.stage.controls-island.study-panel.collapse')
80:   : t('tamagotchi.stage.controls-island.study-panel.expand'))
81: const visionPanelToggleLabel = computed(() => visionPanelVisible.value
82:   ? t('tamagotchi.stage.controls-island.vision-panel.collapse')
83:   : t('tamagotchi.stage.controls-island.vision-panel.expand'))
84:
85: function setOverlay(key: string, active: boolean) {
86:   if (active)
87:     blockingOverlays.add(key)
88:   else
89:     blockingOverlays.delete(key)
90: }
91:
92: // Expose for parent (e.g. to disable click-through when a dialog is open)
93: defineExpose({
94:   get hearingDialogOpen() { return blockingOverlays.has('hearing') },
95:   set hearingDialogOpen(v: boolean) { setOverlay('hearing', v) },
96:   get studyPanelPinned() { return studyPanelExpanded.value || studyPanelInteractionLocked.value },
97:   get studyPanelInputActive() { return studyPanelInteractionLocked.value },
98: })
99:
100: watch(controlsPanelExpanded, (isExpanded) => {
101:   if (isExpanded && visionPanelVisible.value) {
102:     void scrollVisionPanelIntoView()
103:     return
104:   }
105:
106:   if (!isExpanded) {
107:     const keepVisionPanelOverlay = visionPanelVisible.value
108:     blockingOverlays.clear()
109:     if (keepVisionPanelOverlay)
110:       blockingOverlays.add('vision-panel')
111:     studyPanelExpanded.value = false
112:     studyPanelInteractionLocked.value = false
113:     shortcutsCardExpanded.value = false
114:   }
115: })
116:
117: watch(visionPanelVisible, (visible) => {
118:   setOverlay('vision-panel', visible)
119:   if (visible)
120:     void scrollVisionPanelIntoView()
121: })
122:
123: // Apply alwaysOnTop on mount and when it changes
124: watch(alwaysOnTop, (val) => {
125:   setAlwaysOnTop(val)
126: }, { immediate: true })
127:
128: function toggleAlwaysOnTop() {
129:   alwaysOnTop.value = !alwaysOnTop.value
130: }
131:
132: // Grouped classes for icon / border / padding and combined style class
133: const adjustStyleClasses = computed(() => {
134:   let isLarge: boolean
135:
136:   // Determine size based on setting
137:   switch (controlsIslandIconSize.value) {
138:     case 'large':
139:       isLarge = true
140:       break
141:     case 'small':
142:       isLarge = false
143:       break
144:     case 'auto':
145:     default:
146:       // Fixed to large for better visibility in the new layout,
147:       // can be changed to windowHeight based check if absolutely needed.
148:       isLarge = true
149:       break
150:   }
151:
152:   const icon = isLarge ? 'size-5' : 'size-3'
153:   const border = isLarge ? 'border-2' : 'border-0'
154:   const padding = isLarge ? 'p-2' : 'p-0.5'
155:   return { icon, border, padding, button: `${border} ${padding}` }
156: })
157:
158: /**
159:  * This is a know issue (or expected behavior maybe) to Electron.
160:  * We don't use this approach on Linux because it's not working.
161:  *
162:  * See `apps/stage-tamagotchi/src/main/windows/main/index.ts` for handler definition
163:  */
164: const startDraggingWindow = !isLinux() ? defineInvoke(context.value, electronStartDraggingWindow) : undefined
165:
166: function refreshWindow() {
167:   window.location.reload()
168: }
169:
170: function handleStudyPanelInteractionLock(locked: boolean) {
171:   studyPanelInteractionLocked.value = locked
172: }
173:
174: function toggleStudyPanel() {
175:   studyPanelExpanded.value = !studyPanelExpanded.value
176: }
177:
178: function closeStudyPanel() {
179:   studyPanelExpanded.value = false
180:   studyPanelInteractionLocked.value = false
181: }
182:
183: function toggleVisionPanel() {
184:   visionPanelVisible.value = !visionPanelVisible.value
185: }
186:
187: async function scrollVisionPanelIntoView() {
188:   await nextTick()
189:   const panelSection = visionPanelElement.value
190:   const scrollContainer = controlsPanelScrollElement.value
191:   if (!panelSection || !scrollContainer)
192:     return
193:
194:   if (typeof panelSection.scrollIntoView === 'function') {
195:     panelSection.scrollIntoView({
196:       behavior: 'smooth',
197:       block: 'nearest',
198:       inline: 'nearest',
199:     })
200:     return
201:   }
202:
203:   scrollContainer.scrollTop = scrollContainer.scrollHeight
204: }
205:
206: function toggleMoveMode() {
207:   controlsIslandStore.toggleMoveMode()
208: }
209:
210: function toggleControlsUIMode() {
211:   controlsIslandStore.toggleControlsUIMode()
212: }
213:
214: function toggleShortcutsCard() {
215:   shortcutsCardExpanded.value = !shortcutsCardExpanded.value
216: }
217:
218: async function resizeWindowByAction(action: StageWindowSizeAction) {
219:   try {
220:     const [currentBounds, primaryDisplay] = await Promise.all([
221:       getWindowBounds(),
222:       getPrimaryDisplay(),
223:     ])
224:
225:     if (!currentBounds || !primaryDisplay?.workArea) {
226:       return
227:     }
228:
229:     const nextBounds = calculateStageWindowBoundsForAction({
230:       action,
231:       currentBounds,
232:       workArea: primaryDisplay.workArea,
233:     })
234:
235:     await setWindowBounds([nextBounds])
236:   }
237:   catch (error) {
238:     console.warn('[ControlsIsland] Failed to apply window resize action:', error)
239:   }
240: }
241: </script>
242:
243: <template>
244:   <div
245:     data-testid="controls-island-root"
246:     data-control-layer="controls-island"
247:     class="controls-island-root [-webkit-app-region:no-drag] pointer-events-auto z-120"
248:     fixed inset-y-2 right-2
249:   >
250:     <div class="h-full min-h-0 flex flex-col items-end justify-end gap-1.5">
251:       <!-- iOS Style Drawer Panel -->
252:       <Transition
253:         enter-active-class="transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
254:         leave-active-class="transition-all duration-400 cubic-bezier(0.32, 0.72, 0, 1)"
255:         enter-from-class="opacity-0 translate-y-8 scale-90 blur-sm"
256:         leave-to-class="opacity-0 translate-y-8 scale-90 blur-sm"
257:       >
258:         <div
259:           v-show="controlsPanelExpanded"
260:           data-testid="controls-panel-viewport"
261:           class="mb-2 max-w-[76vw] min-h-0 w-[18.5rem] flex flex-1 items-end self-end"
262:         >
263:           <div
264:             ref="controlsPanelScrollElement"
265:             data-testid="controls-panel"
266:             data-controls-panel-scroll
267:             :class="[
268:               'w-full border border-neutral-200/70 rounded-2xl p-3',
269:               'bg-neutral-100/82 shadow-2xl shadow-black/20 backdrop-blur-xl',
270:               'dark:border-neutral-800/70 dark:bg-neutral-900/82',
271:               'min-h-0 max-h-full overflow-y-auto overscroll-contain',
272:               'flex flex-col gap-3',
273:             ]"
274:           >
275:             <section
276:               data-testid="controls-auth-section"
277:               :class="[
278:                 'w-full border-b border-neutral-200/70 pb-2',
279:                 'dark:border-neutral-700/70',
280:               ]"
281:             >
282:               <ControlsIslandAuthButton
283:                 button-style="w-full justify-start [-webkit-app-region:no-drag] pointer-events-auto"
284:                 :icon-class="adjustStyleClasses.icon"
285:               />
286:             </section>
287:
288:             <section data-testid="controls-group-core" :class="['w-full flex flex-col gap-2']">
289:               <header
290:                 data-testid="controls-group-title-core"
291:                 :class="[
292:                   'text-[10px] font-semibold tracking-[0.08em] uppercase',
293:                   'text-neutral-500 dark:text-neutral-400',
294:                 ]"
295:               >
296:                 {{ t('tamagotchi.stage.controls-island.groups.core') }}
297:               </header>
298:               <div data-testid="controls-core-grid" class="controls-button-grid grid grid-cols-3 gap-2">
299:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
300:                   <ControlButton
301:                     data-testid="controls-open-settings"
302:                     class="controls-button"
303:                     :button-style="adjustStyleClasses.button"
304:                     :show-label="isNoviceMode"
305:                     :label="t('tamagotchi.stage.controls-island.labels.settings')"
306:                     :aria-label="t('tamagotchi.stage.controls-island.open-settings')"
307:                     :title="t('tamagotchi.stage.controls-island.open-settings')"
308:                     @click="openSettings({ route: '/settings' })"
309:                   >
310:                     <div i-solar:settings-minimalistic-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
311:                   </ControlButton>
312:                   <template #tooltip>
313:                     {{ t('tamagotchi.stage.controls-island.open-settings') }}
314:                   </template>
315:                 </ControlButtonTooltip>
316:
317:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
318:                   <ControlsIslandProfilePicker placement="up" :open="blockingOverlays.has('profile-picker')" @update:open="setOverlay('profile-picker', $event)">
319:                     <template #default="{ toggle }">
320:                       <ControlButton
321:                         data-testid="controls-profile-picker"
322:                         class="controls-button"
323:                         :button-style="adjustStyleClasses.button"
324:                         :show-label="isNoviceMode"
325:                         :label="t('tamagotchi.stage.controls-island.labels.profile')"
326:                         :aria-label="t('tamagotchi.stage.controls-island.switch-profile')"
327:                         :title="t('tamagotchi.stage.controls-island.switch-profile')"
328:                         @click="toggle"
329:                       >
330:                         <div i-solar:emoji-funny-square-broken :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
331:                       </ControlButton>
332:                     </template>
333:                   </ControlsIslandProfilePicker>
334:                   <template #tooltip>
335:                     {{ t('tamagotchi.stage.controls-island.switch-profile') }}
336:                   </template>
337:                 </ControlButtonTooltip>
338:
339:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
340:                   <ControlButton
341:                     data-testid="controls-open-chat"
342:                     class="controls-button"
343:                     :button-style="adjustStyleClasses.button"
344:                     :show-label="isNoviceMode"
345:                     :label="t('tamagotchi.stage.controls-island.labels.chat')"
346:                     :aria-label="t('tamagotchi.stage.controls-island.open-chat')"
347:                     :title="t('tamagotchi.stage.controls-island.open-chat')"
348:                     @click="openChat"
349:                   >
350:                     <div i-solar:chat-line-line-duotone :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
351:                   </ControlButton>
352:                   <template #tooltip>
353:                     {{ t('tamagotchi.stage.controls-island.open-chat') }}
354:                   </template>
355:                 </ControlButtonTooltip>
356:
357:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
358:                   <ControlButton
359:                     data-testid="controls-refresh-window"
360:                     class="controls-button"
361:                     :button-style="adjustStyleClasses.button"
362:                     :show-label="isNoviceMode"
363:                     :label="t('tamagotchi.stage.controls-island.labels.refresh')"
364:                     :aria-label="t('tamagotchi.stage.controls-island.refresh')"
365:                     :title="t('tamagotchi.stage.controls-island.refresh')"
366:                     @click="refreshWindow"
367:                   >
368:                     <div i-solar:refresh-linear :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
369:                   </ControlButton>
370:                   <template #tooltip>
371:                     {{ t('tamagotchi.stage.controls-island.refresh') }}
372:                   </template>
373:                 </ControlButtonTooltip>
374:
375:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
376:                   <ControlButton
377:                     data-testid="controls-theme-toggle"
378:                     class="controls-button"
379:                     :button-style="adjustStyleClasses.button"
380:                     :show-label="isNoviceMode"
381:                     :label="t('tamagotchi.stage.controls-island.labels.appearance')"
382:                     :aria-label="isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode')"
383:                     :title="isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode')"
384:                     @click="toggleDark()"
385:                   >
386:                     <Transition name="fade" mode="out-in">
387:                       <div v-if="isDark" i-solar:moon-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
388:                       <div v-else i-solar:sun-2-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
389:                     </Transition>
390:                   </ControlButton>
391:                   <template #tooltip>
392:                     {{ isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode') }}
393:                   </template>
394:                 </ControlButtonTooltip>
395:
396:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
397:                   <ControlButton
398:                     data-testid="controls-always-on-top-toggle"
399:                     class="controls-button"
400:                     :button-style="adjustStyleClasses.button"
401:                     :show-label="isNoviceMode"
402:                     :label="t('tamagotchi.stage.controls-island.labels.pin')"
403:                     :aria-label="alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top')"
404:                     :title="alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top')"
405:                     @click="toggleAlwaysOnTop()"
406:                   >
407:                     <div v-if="alwaysOnTop" i-solar:pin-bold :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
408:                     <div v-else i-solar:pin-linear :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300 opacity-50" />
409:                   </ControlButton>
410:                   <template #tooltip>
411:                     {{ alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top') }}
412:                   </template>
413:                 </ControlButtonTooltip>
414:               </div>
415:             </section>
416:
417:             <section
418:               data-testid="controls-group-tools"
419:               :class="[
420:                 'w-full flex flex-col gap-2 border-t border-neutral-200/70 pt-2',
421:                 'dark:border-neutral-700/70',
422:               ]"
423:             >
424:               <header
425:                 data-testid="controls-group-title-tools"
426:                 :class="[
427:                   'text-[10px] font-semibold tracking-[0.08em] uppercase',
428:                   'text-neutral-500 dark:text-neutral-400',
429:                 ]"
430:               >
431:                 {{ t('tamagotchi.stage.controls-island.groups.tools') }}
432:               </header>
433:               <div data-testid="controls-tools-grid" class="controls-button-grid grid grid-cols-3 gap-2">
434:                 <ControlsIslandFadeOnHover
435:                   data-testid="controls-fade-toggle"
436:                   :icon-class="adjustStyleClasses.icon"
437:                   :button-style="adjustStyleClasses.button"
438:                   :show-label="isNoviceMode"
439:                   :label="t('tamagotchi.stage.controls-island.labels.fade')"
440:                 />
441:
442:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
443:                   <ControlsIslandHearingConfig :show="blockingOverlays.has('hearing')" @update:show="setOverlay('hearing', $event)">
444:                     <div class="relative">
445:                       <ControlButton
446:                         data-testid="controls-hearing-toggle"
447:                         class="controls-button"
448:                         :button-style="adjustStyleClasses.button"
449:                         :show-label="isNoviceMode"
450:                         :label="t('tamagotchi.stage.controls-island.labels.hearing')"
451:                         :aria-label="t('tamagotchi.stage.controls-island.open-hearing-controls')"
452:                         :title="t('tamagotchi.stage.controls-island.open-hearing-controls')"
453:                       >
454:                         <Transition name="fade" mode="out-in">
455:                           <IndicatorMicVolume v-if="enabled" :class="adjustStyleClasses.icon" />
456:                           <div v-else i-ph:microphone-slash :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
457:                         </Transition>
458:                       </ControlButton>
459:                     </div>
460:                   </ControlsIslandHearingConfig>
461:                   <template #tooltip>
462:                     {{ t('tamagotchi.stage.controls-island.open-hearing-controls') }}
463:                   </template>
464:                 </ControlButtonTooltip>
465:
466:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
467:                   <ControlButton
468:                     data-testid="controls-study-toggle"
469:                     class="controls-button"
470:                     :button-style="adjustStyleClasses.button"
471:                     :show-label="isNoviceMode"
472:                     :label="t('tamagotchi.stage.controls-island.labels.study')"
473:                     :aria-label="studyPanelToggleLabel"
474:                     :title="studyPanelToggleLabel"
475:                     @click="toggleStudyPanel"
476:                   >
477:                     <div
478:                       :class="[adjustStyleClasses.icon, studyPanelExpanded ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-800 dark:text-neutral-300']"
479:                       i-solar:book-bold-duotone
480:                     />
481:                   </ControlButton>
482:                   <template #tooltip>
483:                     {{ studyPanelToggleLabel }}
484:                   </template>
485:                 </ControlButtonTooltip>
486:
487:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
488:                   <ControlButton
489:                     data-testid="controls-vision-toggle"
490:                     class="controls-button"
491:                     :button-style="adjustStyleClasses.button"
492:                     :show-label="isNoviceMode"
493:                     :label="t('tamagotchi.stage.controls-island.labels.vision')"
494:                     :aria-label="visionPanelToggleLabel"
495:                     :title="visionPanelToggleLabel"
496:                     :class="[
497:                       visionPanelVisible ? 'bg-sky-100/80 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300' : '',
498:                     ]"
499:                     @click="toggleVisionPanel"
500:                   >
501:                     <div i-solar:camera-outline :class="adjustStyleClasses.icon" />
502:                   </ControlButton>
503:                   <template #tooltip>
504:                     {{ visionPanelToggleLabel }}
505:                   </template>
506:                 </ControlButtonTooltip>
507:
508:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
509:                   <ControlButton
510:                     data-testid="controls-ui-mode-toggle"
511:                     class="controls-button"
512:                     :button-style="adjustStyleClasses.button"
513:                     :show-label="isNoviceMode"
514:                     :label="t('tamagotchi.stage.controls-island.labels.mode')"
515:                     :aria-label="controlsUIModeToggleLabel"
516:                     :title="controlsUIModeToggleLabel"
517:                     @click="toggleControlsUIMode"
518:                   >
519:                     <div
520:                       :class="[adjustStyleClasses.icon, controlsUIMode === 'novice' ? 'text-amber-500 dark:text-amber-300' : 'text-indigo-500 dark:text-indigo-300']"
521:                       i-ph:user-switch
522:                     />
523:                   </ControlButton>
524:                   <template #tooltip>
525:                     {{ controlsUIModeLabel }}
526:                   </template>
527:                 </ControlButtonTooltip>
528:
529:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
530:                   <ControlButton
531:                     data-testid="controls-shortcuts-toggle"
532:                     class="controls-button"
533:                     :button-style="adjustStyleClasses.button"
534:                     :show-label="isNoviceMode"
535:                     :label="t('tamagotchi.stage.controls-island.labels.keys')"
536:                     :aria-label="shortcutsToggleLabel"
537:                     :title="shortcutsToggleLabel"
538:                     :class="[
539:                       shortcutsCardExpanded ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200' : '',
540:                     ]"
541:                     @click="toggleShortcutsCard"
542:                   >
543:                     <div i-ph:keyboard :class="adjustStyleClasses.icon" />
544:                   </ControlButton>
545:                   <template #tooltip>
546:                     {{ shortcutsToggleLabel }}
547:                   </template>
548:                 </ControlButtonTooltip>
549:               </div>
550:
551:               <Transition
552:                 enter-active-class="transition-all duration-200 ease-out"
553:                 enter-from-class="opacity-0 -translate-y-1"
554:                 enter-to-class="opacity-100 translate-y-0"
555:                 leave-active-class="transition-all duration-150 ease-in"
556:                 leave-from-class="opacity-100 translate-y-0"
557:                 leave-to-class="opacity-0 -translate-y-1"
558:               >
559:                 <div
560:                   v-if="shortcutsCardExpanded"
561:                   data-testid="controls-shortcuts-card"
562:                   :class="[
563:                     'w-full rounded-lg border border-neutral-200/80 px-2.5 py-2 text-[11px]',
564:                     'bg-neutral-50/80 text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-200',
565:                   ]"
566:                 >
567:                   <div class="font-semibold">
568:                     {{ t('tamagotchi.stage.controls-island.shortcuts.title') }}
569:                   </div>
570:                   <div class="mt-1 flex items-center justify-between gap-2">
571:                     <span>{{ t('tamagotchi.stage.controls-island.shortcuts.zoom-in') }}</span>
572:                     <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + +</code>
573:                   </div>
574:                   <div class="mt-1 flex items-center justify-between gap-2">
575:                     <span>{{ t('tamagotchi.stage.controls-island.shortcuts.zoom-out') }}</span>
576:                     <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + -</code>
577:                   </div>
578:                   <div class="mt-1 flex items-center justify-between gap-2">
579:                     <span>{{ t('tamagotchi.stage.controls-island.shortcuts.reset-size') }}</span>
580:                     <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + 0</code>
581:                   </div>
582:                   <div class="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
583:                     {{ t('tamagotchi.stage.controls-island.shortcuts.hint') }}
584:                   </div>
585:                 </div>
586:               </Transition>
587:             </section>
588:
589:             <section
590:               data-testid="controls-group-window"
591:               :class="[
592:                 'w-full flex flex-col gap-2 border-t border-neutral-200/70 pt-2',
593:                 'dark:border-neutral-700/70',
594:               ]"
595:             >
596:               <header
597:                 data-testid="controls-group-title-window"
598:                 :class="[
599:                   'text-[10px] font-semibold tracking-[0.08em] uppercase',
600:                   'text-neutral-500 dark:text-neutral-400',
601:                 ]"
602:               >
603:                 {{ t('tamagotchi.stage.controls-island.groups.window') }}
604:               </header>
605:
606:               <div data-testid="controls-window-grid" class="controls-button-grid grid grid-cols-3 gap-2">
607:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
608:                   <ControlButton
609:                     data-testid="controls-move-mode-toggle"
610:                     class="controls-button"
611:                     :button-style="adjustStyleClasses.button"
612:                     :show-label="isNoviceMode"
613:                     :label="t('tamagotchi.stage.controls-island.labels.move')"
614:                     :aria-label="moveModeControlLabel"
615:                     :title="moveModeControlLabel"
616:                     :aria-pressed="moveModeEnabled"
617:                     :class="[
618:                       moveModeEnabled
619:                         ? 'bg-sky-100/85 text-sky-700 ring-2 ring-sky-400/70 dark:bg-sky-900/45 dark:text-sky-200 dark:ring-sky-400/60'
620:                         : 'text-neutral-800 dark:text-neutral-300',
621:                     ]"
622:                     @click="toggleMoveMode"
623:                   >
624:                     <Transition name="fade" mode="out-in">
625:                       <div
626:                         v-if="moveModeEnabled"
627:                         data-testid="controls-move-mode-icon"
628:                         i-ph:arrows-out-cardinal
629:                         :class="adjustStyleClasses.icon"
630:                       />
631:                       <div
632:                         v-else
633:                         data-testid="controls-move-mode-icon"
634:                         i-ph:arrows-out-cardinal
635:                         :class="adjustStyleClasses.icon"
636:                       />
637:                     </Transition>
638:                   </ControlButton>
639:                   <template #tooltip>
640:                     {{ moveModeControlLabel }}
641:                   </template>
642:                 </ControlButtonTooltip>
643:
644:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
645:                   <ControlButton
646:                     data-testid="controls-zoom-in"
647:                     class="controls-button"
648:                     :button-style="adjustStyleClasses.button"
649:                     :show-label="isNoviceMode"
650:                     :label="t('tamagotchi.stage.controls-island.labels.zoom-in')"
651:                     :aria-label="t('tamagotchi.stage.controls-island.zoom-in')"
652:                     :title="t('tamagotchi.stage.controls-island.zoom-in')"
653:                     @click="resizeWindowByAction('zoom-in')"
654:                   >
655:                     <div i-ph:magnifying-glass-plus :class="adjustStyleClasses.icon" />
656:                   </ControlButton>
657:                   <template #tooltip>
658:                     {{ t('tamagotchi.stage.controls-island.zoom-in') }}
659:                   </template>
660:                 </ControlButtonTooltip>
661:
662:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
663:                   <ControlButton
664:                     data-testid="controls-zoom-out"
665:                     class="controls-button"
666:                     :button-style="adjustStyleClasses.button"
667:                     :show-label="isNoviceMode"
668:                     :label="t('tamagotchi.stage.controls-island.labels.zoom-out')"
669:                     :aria-label="t('tamagotchi.stage.controls-island.zoom-out')"
670:                     :title="t('tamagotchi.stage.controls-island.zoom-out')"
671:                     @click="resizeWindowByAction('zoom-out')"
672:                   >
673:                     <div i-ph:magnifying-glass-minus :class="adjustStyleClasses.icon" />
674:                   </ControlButton>
675:                   <template #tooltip>
676:                     {{ t('tamagotchi.stage.controls-island.zoom-out') }}
677:                   </template>
678:                 </ControlButtonTooltip>
679:
680:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
681:                   <ControlButton
682:                     data-testid="controls-reset-size"
683:                     class="controls-button"
684:                     :button-style="adjustStyleClasses.button"
685:                     :show-label="isNoviceMode"
686:                     :label="t('tamagotchi.stage.controls-island.labels.reset')"
687:                     :aria-label="t('tamagotchi.stage.controls-island.reset-size')"
688:                     :title="t('tamagotchi.stage.controls-island.reset-size')"
689:                     @click="resizeWindowByAction('reset-size')"
690:                   >
691:                     <div data-testid="controls-reset-size-icon" i-ph:arrows-clockwise :class="adjustStyleClasses.icon" />
692:                   </ControlButton>
693:                   <template #tooltip>
694:                     {{ t('tamagotchi.stage.controls-island.reset-size') }}
695:                   </template>
696:                 </ControlButtonTooltip>
697:
698:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
699:                   <ControlButton
700:                     data-testid="controls-drag-window"
701:                     class="controls-button"
702:                     :button-style="adjustStyleClasses.button"
703:                     :show-label="isNoviceMode"
704:                     :label="t('tamagotchi.stage.controls-island.labels.drag')"
705:                     :aria-label="t('tamagotchi.stage.controls-island.drag-to-move-window')"
706:                     :title="t('tamagotchi.stage.controls-island.drag-to-move-window')"
707:                     cursor-move
708:                     :class="[{ 'drag-region': isLinux }, 'text-neutral-800 dark:text-neutral-300']"
709:                     @mousedown="startDraggingWindow?.()"
710:                   >
711:                     <div data-testid="controls-drag-window-icon" i-ph:hand-grabbing :class="adjustStyleClasses.icon" />
712:                   </ControlButton>
713:                   <template #tooltip>
714:                     {{ t('tamagotchi.stage.controls-island.drag-to-move-window') }}
715:                   </template>
716:                 </ControlButtonTooltip>
717:
718:                 <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
719:                   <ControlButton
720:                     data-testid="controls-close-button"
721:                     class="controls-button"
722:                     :button-style="adjustStyleClasses.button"
723:                     :show-label="isNoviceMode"
724:                     :label="t('tamagotchi.stage.controls-island.labels.close')"
725:                     :aria-label="t('tamagotchi.stage.controls-island.close')"
726:                     :title="t('tamagotchi.stage.controls-island.close')"
727:                     :class="['text-neutral-800 dark:text-neutral-200 hover:bg-red-500/85 hover:text-white']"
728:                     @click="closeWindow()"
729:                   >
730:                     <div i-solar:close-circle-outline :class="adjustStyleClasses.icon" />
731:                   </ControlButton>
732:                   <template #tooltip>
733:                     {{ t('tamagotchi.stage.controls-island.close') }}
734:                   </template>
735:                 </ControlButtonTooltip>
736:               </div>
737:
738:               <div
739:                 v-if="moveModeEnabled"
740:                 data-testid="controls-move-mode-status"
741:                 :class="[
742:                   'w-full rounded-lg px-2 py-1.5',
743:                   'text-2.75 text-left leading-4 text-sky-700',
744:                   'bg-sky-100/70 dark:bg-sky-900/35 dark:text-sky-200',
745:                 ]"
746:               >
747:                 <span class="font-semibold">{{ t('tamagotchi.stage.controls-island.move-mode.status-on') }}</span>
748:                 <span class="ml-1">{{ t('tamagotchi.stage.controls-island.move-mode.status-hint') }}</span>
749:               </div>
750:             </section>
751:
752:             <Transition
753:               enter-active-class="transition-all duration-200 ease-out"
754:               enter-from-class="opacity-0 -translate-y-1"
755:               enter-to-class="opacity-100 translate-y-0"
756:               leave-active-class="transition-all duration-150 ease-in"
757:               leave-from-class="opacity-100 translate-y-0"
758:               leave-to-class="opacity-0 -translate-y-1"
759:             >
760:               <section
761:                 v-show="studyPanelExpanded"
762:                 data-testid="controls-study-panel"
763:                 :class="[
764:                   'min-h-0 flex flex-1 flex-col border-t border-neutral-200/70 pt-2',
765:                   'dark:border-neutral-700/70',
766:                 ]"
767:               >
768:                 <div :class="['min-h-0 flex-1 overflow-hidden']">
769:                   <StudyIsland
770:                     :class="['h-full w-full']"
771:                     @interaction-lock-change="handleStudyPanelInteractionLock"
772:                     @close="closeStudyPanel"
773:                   />
774:                 </div>
775:               </section>
776:             </Transition>
777:
778:             <section
779:               v-if="visionPanelVisible"
780:               ref="visionPanelElement"
781:               data-testid="controls-vision-panel"
782:               class="min-h-0 flex flex-col"
783:             >
784:               <VisionIsland embedded :ui-mode="controlsUIMode" />
785:             </section>
786:           </div>
787:         </div>
788:       </Transition>
789:
790:       <div data-testid="controls-anchor" class="flex flex-col items-end">
791:         <ControlButtonTooltip side="left">
792:           <ControlButton
793:             data-testid="controls-toggle-button"
794:             class="controls-toggle-button [-webkit-app-region:no-drag] pointer-events-auto"
795:             :button-style="adjustStyleClasses.button"
796:             :aria-label="panelToggleLabel"
797:             :title="panelToggleLabel"
798:             @click="controlsIslandStore.toggleControlsPanel()"
799:           >
800:             <div
801:               :class="[adjustStyleClasses.icon, controlsPanelExpanded ? 'rotate-180' : 'rotate-0']"
802:               i-solar:alt-arrow-up-line-duotone scale-110 transition-all duration-300
803:               text="neutral-800 dark:neutral-300"
804:             />
805:           </ControlButton>
806:           <template #tooltip>
807:             {{ panelToggleLabel }}
808:           </template>
809:         </ControlButtonTooltip>
810:       </div>
811:     </div>
812:   </div>
813: </template>
814:
815: <style scoped>
816: .controls-island-root {
817:   z-index: 120;
818:   -webkit-app-region: no-drag;
819: }
820:
821: .controls-island-root .drag-region {
822:   -webkit-app-region: drag;
823: }
824:
825: .controls-button-grid {
826:   width: 100%;
827: }
828:
829: .controls-button-cell {
830:   width: 100%;
831:   display: flex;
832:   justify-content: center;
833: }
834:
835: .controls-toggle-button {
836:   -webkit-app-region: no-drag;
837:   pointer-events: auto;
838: }
839: </style>

(End of file - total 839 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro · 10.8s)

_Thinking:_

现在我需要读取更多文件来全面了解项目状态。让我继续读取关键文件。

**Tool: glob**

**Input:**
```json
{
  "pattern": "packages/stage-ui/src/stores/modules/study-companion*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.test.ts
/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.behavior.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/utils/vision-status-labels*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-status-labels.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-status-labels.test.ts
```

---

## Assistant (Build · MiMo-V2.5-Pro · 86.8s)

_Thinking:_

让我继续读取更多关键文件来了解实现细节。

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/packages/stage-ui/src/stores/modules/study-companion.ts</path>
<type>file</type>
<content>
1: import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
2: import { useIntervalFn } from '@vueuse/core'
3: import { defineStore } from 'pinia'
4: import { computed, watch } from 'vue'
5:
6: /** Pomodoro run mode: single source of truth for Study Island & Live2D feedback. */
7: export type StudyCompanionMode = 'idle' | 'focus' | 'break' | 'paused'
8:
9: /**
10:  * Default focus segment length (25 minutes), in milliseconds.
11:  *
12:  * @default 25 * 60 * 1000
13:  */
14: export const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000
15:
16: /**
17:  * Default short break length (5 minutes), in milliseconds.
18:  *
19:  * @default 5 * 60 * 1000
20:  */
21: export const DEFAULT_BREAK_DURATION_MS = 5 * 60 * 1000
22: export const DEMO_FOCUS_DURATION_MS = 60 * 1000
23: export const DEMO_BREAK_DURATION_MS = 15 * 1000
24:
25: const STORAGE_KEY = 'settings/study-companion/v1'
26:
27: const MAX_EVENT_LOG = 500
28:
29: /**
30:  * Lightweight today-task row (member 4 extends actions; shape is stable for UI).
31:  */
32: export interface StudyTask {
33:   id: string
34:   title: string
35:   done: boolean
36:   createdAt: number
37:   completedAt?: number
38: }
39:
40: /**
41:  * Append-only study analytics / export row (member 7 extends types & export UI).
42:  */
43: export interface StudyEventLogEntry {
44:   id: string
45:   at: number
46:   type: 'focus_started' | 'focus_completed' | 'session_paused' | 'focus_reset'
47:     | 'break_started' | 'break_completed' | 'day_rollover' | (string & {})
48:   detail?: Record<string, unknown>
49: }
50:
51: /**
52:  * Persisted snapshot: timer + daily stats + collaboration fields (tasks, reminders, log).
53:  */
54: export interface StudyCompanionPersisted {
55:   /** Calendar day (UTC `YYYY-MM-DD`) for `today*` counters. */
56:   statsDate: string
57:   /** Completed focus sessions today (a session completes when the focus timer reaches zero). */
58:   todayFocusSessions: number
59:   /** Sum of completed focus minutes today (from configured focus duration). */
60:   todayFocusMinutes: number
61:   /** Lifetime count of completed focus sessions (not cleared on day rollover). */
62:   cycleCount: number
63:   mode: StudyCompanionMode
64:   /** Countdown display; while running, derived from `segmentEndsAt` on each tick. */
65:   remainingMs: number
66:   /** Wall-clock end timestamp while `focus` or `break` is actively counting; `null` when idle or paused. */
67:   segmentEndsAt: number | null
68:   /** When `mode === 'paused'`, which phase to resume. */
69:   pausedCarry: 'focus' | 'break' | null
70:   focusDurationMs: number
71:   breakDurationMs: number
72:   demoModeEnabled: boolean
73:   previousFocusDurationMs: number | null
74:   previousBreakDurationMs: number | null
75:   tasks: StudyTask[]
76:   /** Shown / fired reminders today (member 5). */
77:   todayReminderCount: number
78:   /** Epoch ms until reminders are suppressed; `0` means not muted (member 5). */
79:   mutedUntil: number
80:   studyEvents: StudyEventLogEntry[]
81: }
82:
83: /**
84:  * Serializable snapshot payload for study statistics export.
85:  */
86: export interface StudyCompanionSnapshot {
87:   schemaVersion: 1
88:   app: 'Rin'
89:   feature: 'study-companion'
90:   project: 'Rin Study Companion'
91:   exportedAt: string
92:   demoModeEnabled: boolean
93:   statsDate: string
94:   summary: {
95:     todayFocusSessions: number
96:     todayFocusMinutes: number
97:     cycleCount: number
98:     todayReminderCount: number
99:     taskTotal: number
100:     taskCompleted: number
101:     taskPending: number
102:     mode: StudyCompanionMode
103:     isRunning: boolean
104:     isMuted: boolean
105:   }
106:   timer: {
107:     remainingMs: number
108:     segmentEndsAt: number | null
109:     focusDurationMs: number
110:     breakDurationMs: number
111:   }
112:   tasks: StudyTask[]
113:   events: StudyEventLogEntry[]
114: }
115:
116: function utcCalendarDay(d = new Date()): string {
117:   return d.toISOString().slice(0, 10)
118: }
119:
120: function randomId(): string {
121:   return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
122: }
123:
124: function cloneJsonRecord(record: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
125:   if (!record)
126:     return undefined
127:
128:   try {
129:     return JSON.parse(JSON.stringify(record)) as Record<string, unknown>
130:   }
131:   catch {
132:     return {
133:       notice: 'detail_not_serializable',
134:     }
135:   }
136: }
137:
138: function cloneStudyTasks(tasks: StudyTask[]): StudyTask[] {
139:   return tasks.map((task) => {
140:     const normalizedCompletedAt = Number.isFinite(task.completedAt)
141:       ? task.completedAt
142:       : undefined
143:
144:     return {
145:       id: `${task.id}`,
146:       title: `${task.title}`,
147:       done: Boolean(task.done),
148:       createdAt: Number.isFinite(task.createdAt) ? task.createdAt : 0,
149:       ...(normalizedCompletedAt == null ? {} : { completedAt: normalizedCompletedAt }),
150:     }
151:   })
152: }
153:
154: function cloneStudyEvents(events: StudyEventLogEntry[]): StudyEventLogEntry[] {
155:   return events.map(event => ({
156:     id: `${event.id}`,
157:     at: Number.isFinite(event.at) ? event.at : 0,
158:     type: event.type,
159:     detail: cloneJsonRecord(event.detail),
160:   }))
161: }
162:
163: /**
164:  * Default persisted shape for first run or partial migrations.
165:  */
166: export function createDefaultStudyCompanionPersisted(): StudyCompanionPersisted {
167:   return {
168:     statsDate: utcCalendarDay(),
169:     todayFocusSessions: 0,
170:     todayFocusMinutes: 0,
171:     cycleCount: 0,
172:     mode: 'idle',
173:     remainingMs: DEFAULT_FOCUS_DURATION_MS,
174:     segmentEndsAt: null,
175:     pausedCarry: null,
176:     focusDurationMs: DEFAULT_FOCUS_DURATION_MS,
177:     breakDurationMs: DEFAULT_BREAK_DURATION_MS,
178:     demoModeEnabled: false,
179:     previousFocusDurationMs: null,
180:     previousBreakDurationMs: null,
181:     tasks: [],
182:     todayReminderCount: 0,
183:     mutedUntil: 0,
184:     studyEvents: [],
185:   }
186: }
187:
188: function coercePersisted(raw: unknown): StudyCompanionPersisted {
189:   const base = createDefaultStudyCompanionPersisted()
190:   if (!raw || typeof raw !== 'object')
191:     return base
192:
193:   const o = raw as Record<string, unknown>
194:   return {
195:     ...base,
196:     statsDate: typeof o.statsDate === 'string' ? o.statsDate : base.statsDate,
197:     todayFocusSessions: typeof o.todayFocusSessions === 'number' ? o.todayFocusSessions : base.todayFocusSessions,
198:     todayFocusMinutes: typeof o.todayFocusMinutes === 'number' ? o.todayFocusMinutes : base.todayFocusMinutes,
199:     cycleCount: typeof o.cycleCount === 'number' ? o.cycleCount : base.cycleCount,
200:     mode: o.mode === 'idle' || o.mode === 'focus' || o.mode === 'break' || o.mode === 'paused'
201:       ? o.mode
202:       : base.mode,
203:     remainingMs: typeof o.remainingMs === 'number' && o.remainingMs >= 0 ? o.remainingMs : base.remainingMs,
204:     segmentEndsAt: typeof o.segmentEndsAt === 'number' || o.segmentEndsAt === null
205:       ? o.segmentEndsAt as number | null
206:       : base.segmentEndsAt,
207:     pausedCarry: o.pausedCarry === 'focus' || o.pausedCarry === 'break' || o.pausedCarry === null
208:       ? o.pausedCarry
209:       : base.pausedCarry,
210:     focusDurationMs: typeof o.focusDurationMs === 'number' && o.focusDurationMs > 0 ? o.focusDurationMs : base.focusDurationMs,
211:     breakDurationMs: typeof o.breakDurationMs === 'number' && o.breakDurationMs > 0 ? o.breakDurationMs : base.breakDurationMs,
212:     demoModeEnabled: typeof o.demoModeEnabled === 'boolean' ? o.demoModeEnabled : base.demoModeEnabled,
213:     previousFocusDurationMs: typeof o.previousFocusDurationMs === 'number' && o.previousFocusDurationMs > 0
214:       ? o.previousFocusDurationMs
215:       : base.previousFocusDurationMs,
216:     previousBreakDurationMs: typeof o.previousBreakDurationMs === 'number' && o.previousBreakDurationMs > 0
217:       ? o.previousBreakDurationMs
218:       : base.previousBreakDurationMs,
219:     tasks: Array.isArray(o.tasks) ? o.tasks as StudyTask[] : base.tasks,
220:     todayReminderCount: typeof o.todayReminderCount === 'number' ? o.todayReminderCount : base.todayReminderCount,
221:     mutedUntil: typeof o.mutedUntil === 'number' ? o.mutedUntil : base.mutedUntil,
222:     studyEvents: Array.isArray(o.studyEvents) ? o.studyEvents as StudyEventLogEntry[] : base.studyEvents,
223:   }
224: }
225:
226: /**
227:  * Pinia store: Pomodoro state machine + persisted daily stats.
228:  *
229:  * Use when:
230:  * - Building Study Island controls (start / pause / resume / reset / break).
231:  * - Driving reminders, Live2D, or exports — read from this store only.
232:  *
233:  * Expects:
234:  * - A browser `localStorage` (Electron renderer satisfies this).
235:  *
236:  * Returns:
237:  * - Reactive persisted snapshot, actions, and a wall-clock aligned ticker.
238:  */
239: export const useStudyCompanionStore = defineStore('study-companion', () => {
240:   const persisted = useLocalStorageManualReset<StudyCompanionPersisted>(
241:     STORAGE_KEY,
242:     createDefaultStudyCompanionPersisted(),
243:     { deep: true },
244:   )
245:
246:   persisted.value = coercePersisted(persisted.value)
247:
248:   function appendEvent(type: StudyEventLogEntry['type'], detail?: Record<string, unknown>) {
249:     const entry: StudyEventLogEntry = {
250:       id: randomId(),
251:       at: Date.now(),
252:       type,
253:       detail,
254:     }
255:     const next = [...persisted.value.studyEvents, entry]
256:     if (next.length > MAX_EVENT_LOG)
257:       next.splice(0, next.length - MAX_EVENT_LOG)
258:     persisted.value.studyEvents = next
259:   }
260:
261:   /**
262:    * Rolls daily counters when `statsDate` is not today (UTC). Idempotent.
263:    */
264:   function rolloverIfNeeded() {
265:     const today = utcCalendarDay()
266:     const p = persisted.value
267:     if (p.statsDate === today)
268:       return
269:
270:     const previousStatsDate = p.statsDate
271:     p.statsDate = today
272:     p.todayFocusSessions = 0
273:     p.todayFocusMinutes = 0
274:     p.todayReminderCount = 0
275:     p.mutedUntil = 0
276:     p.tasks = []
277:     p.mode = 'idle'
278:     p.segmentEndsAt = null
279:     p.pausedCarry = null
280:     p.remainingMs = p.focusDurationMs
281:     appendEvent('day_rollover', { previousStatsDate })
282:   }
283:
284:   function reconcileRunningTimerFromWallClock() {
285:     const p = persisted.value
286:     if ((p.mode !== 'focus' && p.mode !== 'break') || p.segmentEndsAt == null)
287:       return
288:
289:     const nextRemaining = Math.max(0, p.segmentEndsAt - Date.now())
290:     p.remainingMs = nextRemaining
291:     if (nextRemaining <= 0)
292:       completeCurrentPhase()
293:   }
294:
295:   function completeCurrentPhase() {
296:     const p = persisted.value
297:     if (p.mode === 'focus') {
298:       p.todayFocusSessions += 1
299:       p.todayFocusMinutes += Math.round(p.focusDurationMs / 60_000)
300:       p.cycleCount += 1
301:       p.mode = 'break'
302:       p.remainingMs = p.breakDurationMs
303:       p.segmentEndsAt = Date.now() + p.breakDurationMs
304:       p.pausedCarry = 'break'
305:       appendEvent('focus_completed', {})
306:       return
307:     }
308:
309:     if (p.mode === 'break') {
310:       p.mode = 'idle'
311:       p.remainingMs = p.focusDurationMs
312:       p.segmentEndsAt = null
313:       p.pausedCarry = null
314:       appendEvent('break_completed', {})
315:     }
316:   }
317:
318:   function tick() {
319:     rolloverIfNeeded()
320:     reconcileRunningTimerFromWallClock()
321:   }
322:
323:   useIntervalFn(tick, 250, { immediate: false }).resume()
324:
325:   watch(
326:     () => persisted.value.mode,
327:     (mode: StudyCompanionMode) => {
328:       if (mode === 'idle' || mode === 'paused')
329:         reconcileRunningTimerFromWallClock()
330:     },
331:   )
332:
333:   const isRunning = computed(() => {
334:     const p = persisted.value
335:     return (p.mode === 'focus' || p.mode === 'break') && p.segmentEndsAt != null
336:   })
337:
338:   const isMuted = computed(() => persisted.value.mutedUntil > Date.now())
339:   const demoModeEnabled = computed(() => persisted.value.demoModeEnabled)
340:   const taskTotal = computed(() => persisted.value.tasks.length)
341:   const taskCompleted = computed(() => persisted.value.tasks.filter(task => task.done).length)
342:   const taskPending = computed(() => taskTotal.value - taskCompleted.value)
343:
344:   /**
345:    * Starts a focus segment from `idle`, or resumes when already paused in focus.
346:    */
347:   function startFocus() {
348:     rolloverIfNeeded()
349:     const p = persisted.value
350:     if (p.mode === 'paused' && p.pausedCarry === 'focus') {
351:       resume()
352:       return
353:     }
354:     if (p.mode === 'focus' && p.segmentEndsAt != null)
355:       return
356:
357:     const from = p.mode
358:     p.mode = 'focus'
359:     p.remainingMs = p.focusDurationMs
360:     p.segmentEndsAt = Date.now() + p.focusDurationMs
361:     p.pausedCarry = 'focus'
362:     appendEvent('focus_started', { from })
363:   }
364:
365:   /**
366:    * Starts a short break from `idle` (manual rest). Does not mutate completed focus stats.
367:    */
368:   function startBreak() {
369:     rolloverIfNeeded()
370:     const p = persisted.value
371:     if (p.mode === 'focus' && p.segmentEndsAt != null)
372:       return
373:     if (p.mode === 'paused' && p.pausedCarry === 'focus')
374:       return
375:     if (p.mode === 'paused' && p.pausedCarry === 'break') {
376:       resume()
377:       return
378:     }
379:     if (p.mode === 'break' && p.segmentEndsAt != null)
380:       return
381:
382:     p.mode = 'break'
383:     p.remainingMs = p.breakDurationMs
384:     p.segmentEndsAt = Date.now() + p.breakDurationMs
385:     p.pausedCarry = 'break'
386:     appendEvent('break_started', { manual: true })
387:   }
388:
389:   /**
390:    * Pauses an active focus or break segment.
391:    */
392:   function pause() {
393:     const p = persisted.value
394:     if (p.mode !== 'focus' && p.mode !== 'break')
395:       return
396:     if (p.segmentEndsAt == null)
397:       return
398:
399:     p.remainingMs = Math.max(0, p.segmentEndsAt - Date.now())
400:     p.segmentEndsAt = null
401:     p.pausedCarry = p.mode === 'focus' ? 'focus' : 'break'
402:     p.mode = 'paused'
403:     appendEvent('session_paused', { carry: p.pausedCarry })
404:   }
405:
406:   /**
407:    * Resumes from `paused` into the carried phase.
408:    */
409:   function resume() {
410:     const p = persisted.value
411:     if (p.mode !== 'paused' || !p.pausedCarry)
412:       return
413:
414:     const carry = p.pausedCarry
415:     p.mode = p.pausedCarry
416:     p.segmentEndsAt = Date.now() + p.remainingMs
417:     appendEvent('session_resumed', { carry })
418:   }
419:
420:   /**
421:    * Returns to `idle` and clears the active segment (no stats change).
422:    */
423:   function resetSession() {
424:     const p = persisted.value
425:     p.mode = 'idle'
426:     p.segmentEndsAt = null
427:     p.pausedCarry = null
428:     p.remainingMs = p.focusDurationMs
429:     appendEvent('focus_reset', {})
430:   }
431:
432:   /**
433:    * Hydrates countdown after tab sleep: call when `document` becomes visible if needed.
434:    */
435:   function syncFromWallClock() {
436:     tick()
437:   }
438:
439:   function alignRunningSegmentDuration(targetDurationMs: number) {
440:     const p = persisted.value
441:     const clampedRemaining = Math.min(Math.max(0, p.remainingMs), targetDurationMs)
442:     p.remainingMs = clampedRemaining
443:
444:     if (p.segmentEndsAt != null)
445:       p.segmentEndsAt = Date.now() + clampedRemaining
446:   }
447:
448:   /**
449:    * Enables quick demo durations for course presentation mode.
450:    */
451:   function enableDemoMode() {
452:     const p = persisted.value
453:     if (p.demoModeEnabled)
454:       return
455:
456:     p.previousFocusDurationMs = p.focusDurationMs
457:     p.previousBreakDurationMs = p.breakDurationMs
458:     p.demoModeEnabled = true
459:     p.focusDurationMs = DEMO_FOCUS_DURATION_MS
460:     p.breakDurationMs = DEMO_BREAK_DURATION_MS
461:
462:     if (p.mode === 'idle') {
463:       p.remainingMs = p.focusDurationMs
464:     }
465:     else if (p.mode === 'focus' || (p.mode === 'paused' && p.pausedCarry === 'focus')) {
466:       alignRunningSegmentDuration(p.focusDurationMs)
467:     }
468:     else if (p.mode === 'break' || (p.mode === 'paused' && p.pausedCarry === 'break')) {
469:       alignRunningSegmentDuration(p.breakDurationMs)
470:     }
471:
472:     appendEvent('demo_mode_enabled', {
473:       focusDurationMs: p.focusDurationMs,
474:       breakDurationMs: p.breakDurationMs,
475:     })
476:   }
477:
478:   /**
479:    * Restores normal durations after demo mode.
480:    */
481:   function disableDemoMode() {
482:     const p = persisted.value
483:     if (!p.demoModeEnabled)
484:       return
485:
486:     const restoredFocusDuration = p.previousFocusDurationMs ?? DEFAULT_FOCUS_DURATION_MS
487:     const restoredBreakDuration = p.previousBreakDurationMs ?? DEFAULT_BREAK_DURATION_MS
488:
489:     p.focusDurationMs = restoredFocusDuration
490:     p.breakDurationMs = restoredBreakDuration
491:     p.demoModeEnabled = false
492:     p.previousFocusDurationMs = null
493:     p.previousBreakDurationMs = null
494:
495:     if (p.mode === 'idle') {
496:       p.remainingMs = p.focusDurationMs
497:     }
498:     else if (p.mode === 'focus' || (p.mode === 'paused' && p.pausedCarry === 'focus')) {
499:       alignRunningSegmentDuration(p.focusDurationMs)
500:     }
501:     else if (p.mode === 'break' || (p.mode === 'paused' && p.pausedCarry === 'break')) {
502:       alignRunningSegmentDuration(p.breakDurationMs)
503:     }
504:
505:     appendEvent('demo_mode_disabled', {
506:       focusDurationMs: p.focusDurationMs,
507:       breakDurationMs: p.breakDurationMs,
508:     })
509:   }
510:
511:   function toggleDemoMode() {
512:     if (persisted.value.demoModeEnabled) {
513:       disableDemoMode()
514:       return
515:     }
516:
517:     enableDemoMode()
518:   }
519:
520:   /**
521:    * Adds a lightweight today-task row and records it in study events.
522:    */
523:   function addTask(title: string) {
524:     rolloverIfNeeded()
525:     const normalizedTitle = title.trim()
526:     if (!normalizedTitle)
527:       return
528:
529:     const nextTask: StudyTask = {
530:       id: randomId(),
531:       title: normalizedTitle,
532:       done: false,
533:       createdAt: Date.now(),
534:     }
535:
536:     persisted.value = {
537:       ...persisted.value,
538:       tasks: [...persisted.value.tasks, nextTask],
539:     }
540:     appendEvent('task_added', {
541:       id: nextTask.id,
542:       title: nextTask.title,
543:     })
544:   }
545:
546:   /**
547:    * Toggles task completion and records either complete or reopen events.
548:    */
549:   function toggleTaskDone(id: string) {
550:     rolloverIfNeeded()
551:     const task = persisted.value.tasks.find(item => item.id === id)
552:     if (!task)
553:       return
554:
555:     const toggledDone = !task.done
556:     const toggledTask: StudyTask = {
557:       ...task,
558:       done: toggledDone,
559:       completedAt: toggledDone ? Date.now() : undefined,
560:     }
561:     persisted.value = {
562:       ...persisted.value,
563:       tasks: persisted.value.tasks.map(existingTask => existingTask.id === id ? toggledTask : existingTask),
564:     }
565:
566:     if (task.done) {
567:       appendEvent('task_reopened', {
568:         id: toggledTask.id,
569:         title: toggledTask.title,
570:       })
571:       return
572:     }
573:
574:     appendEvent('task_completed', {
575:       id: toggledTask.id,
576:       title: toggledTask.title,
577:     })
578:   }
579:
580:   /**
581:    * Removes one task by id and records a delete event.
582:    */
583:   function deleteTask(id: string) {
584:     rolloverIfNeeded()
585:     const targetTask = persisted.value.tasks.find(task => task.id === id)
586:     if (!targetTask)
587:       return
588:
589:     persisted.value = {
590:       ...persisted.value,
591:       tasks: persisted.value.tasks.filter(task => task.id !== id),
592:     }
593:     appendEvent('task_deleted', {
594:       id: targetTask.id,
595:       title: targetTask.title,
596:     })
597:   }
598:
599:   /**
600:    * Clears all completed tasks and keeps pending tasks untouched.
601:    */
602:   function clearCompletedTasks() {
603:     rolloverIfNeeded()
604:     persisted.value = {
605:       ...persisted.value,
606:       tasks: persisted.value.tasks.filter(task => !task.done),
607:     }
608:   }
609:
610:   /**
611:    * Creates a JSON-ready snapshot for Study Island stats/log export.
612:    */
613:   function exportStudySnapshot(): StudyCompanionSnapshot {
614:     const p = persisted.value
615:     appendEvent('study_log_exported', { statsDate: p.statsDate })
616:
617:     const taskSnapshot = cloneStudyTasks(p.tasks)
618:     const eventSnapshot = cloneStudyEvents(p.studyEvents)
619:     const taskCompleted = taskSnapshot.filter(task => task.done).length
620:
621:     return {
622:       schemaVersion: 1,
623:       app: 'Rin',
624:       feature: 'study-companion',
625:       project: 'Rin Study Companion',
626:       exportedAt: new Date().toISOString(),
627:       demoModeEnabled: p.demoModeEnabled,
628:       statsDate: p.statsDate,
629:       summary: {
630:         todayFocusSessions: p.todayFocusSessions,
631:         todayFocusMinutes: p.todayFocusMinutes,
632:         cycleCount: p.cycleCount,
633:         todayReminderCount: p.todayReminderCount,
634:         taskTotal: taskSnapshot.length,
635:         taskCompleted,
636:         taskPending: taskSnapshot.length - taskCompleted,
637:         mode: p.mode,
638:         isRunning: isRunning.value,
639:         isMuted: isMuted.value,
640:       },
641:       timer: {
642:         remainingMs: p.remainingMs,
643:         segmentEndsAt: p.segmentEndsAt,
644:         focusDurationMs: p.focusDurationMs,
645:         breakDurationMs: p.breakDurationMs,
646:       },
647:       tasks: taskSnapshot,
648:       events: eventSnapshot,
649:     }
650:   }
651:
652:   /**
653:    * Clears the activity log and keeps a single marker event.
654:    */
655:   function clearStudyEvents() {
656:     persisted.value.studyEvents = []
657:     appendEvent('study_events_cleared', { statsDate: persisted.value.statsDate })
658:   }
659:
660:   /**
661:    * Clears today's counters and today's event log only.
662:    */
663:   function clearTodayStudyStats() {
664:     const p = persisted.value
665:     p.todayFocusSessions = 0
666:     p.todayFocusMinutes = 0
667:     p.todayReminderCount = 0
668:     p.studyEvents = []
669:     appendEvent('study_stats_cleared', { statsDate: p.statsDate })
670:   }
671:
672:   return {
673:     persisted,
674:     isRunning,
675:     isMuted,
676:     demoModeEnabled,
677:     taskTotal,
678:     taskCompleted,
679:     taskPending,
680:     startFocus,
681:     startBreak,
682:     pause,
683:     resume,
684:     resetSession,
685:     syncFromWallClock,
686:     rolloverIfNeeded,
687:     appendEvent,
688:     enableDemoMode,
689:     disableDemoMode,
690:     toggleDemoMode,
691:     addTask,
692:     toggleTaskDone,
693:     deleteTask,
694:     clearCompletedTasks,
695:     exportStudySnapshot,
696:     clearStudyEvents,
697:     clearTodayStudyStats,
698:   }
699: })

(End of file - total 699 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/vision-enrollment/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { Button } from '@proj-airi/ui'
3: import { computed, onMounted, ref, watch } from 'vue'
4: import { useRouter } from 'vue-router'
5: import { toast } from 'vue-sonner'
6:
7: import { useVisionInteraction } from '../../composables/use-vision-interaction'
8:
9: const router = useRouter()
10: const videoRef = ref<HTMLVideoElement | null>(null)
11: const isDev = import.meta.env.DEV
12:
13: const {
14:   isEnabled,
15:   cameraState,
16:   cameraPermissionState,
17:   mediaPipeStatus,
18:   runtimeStatus,
19:   runtimeWarmupDurationMs,
20:   runtimeRetryCount,
21:   runtimeLastError,
22:   errorMessage,
23:   displayName,
24:   gateEnabled,
25:   hasEncryptedProfile,
26:   rememberFaceProfileOnDevice,
27:   secureStoreAvailable,
28:   localFaceGate,
29:   openCvFaceQuality,
30:   encryptedProfile,
31:   cameraDiagnostics,
32:   attachVideoElement,
33:   start,
34:   stop,
35:   warmupVisionRuntime,
36:   retryVisionRuntime,
37:   resetVisionRuntime,
38:   setDisplayName,
39:   setFaceGateEnabled,
40:   enrollLocalFaceProfile,
41:   unlockFaceProfile,
42:   lockFaceProfile,
43:   deleteLocalFaceProfile,
44:   setRememberFaceProfileOnDevice,
45: } = useVisionInteraction()
46:
47: const passphrase = ref('')
48: const confirmPassphrase = ref('')
49: const unlockPassphrase = ref('')
50: const enrolling = ref(false)
51: const unlocking = ref(false)
52: const runtimeWorking = ref(false)
53: const rememberOnDevice = ref(false)
54: const displayNameInput = ref(displayName.value)
55:
56: const thresholdInput = ref(localFaceGate.threshold.value.toFixed(2))
57: const qualityThresholdInput = ref(localFaceGate.qualityThreshold.value.toFixed(2))
58: const stableFramesInput = ref(String(localFaceGate.stableFrames.value))
59: const enrollSampleCountInput = ref('6')
60: const acceptedSamples = ref(0)
61: const rejectedSamples = ref(0)
62: const enrollmentMessage = ref('')
63:
64: const profileStatus = computed(() => encryptedProfile.status.value)
65: const latestQuality = computed(() => openCvFaceQuality.latestQuality.value)
66: const openCvStatus = computed(() => openCvFaceQuality.status.value)
67: const openCvErrorMessage = computed(() => openCvFaceQuality.errorMessage.value)
68: const unlockedProfile = computed(() => encryptedProfile.unlockedProfile.value)
69: const cameraStateText = computed(() => {
70:   const map: Record<string, string> = {
71:     off: '已关闭',
72:     loading: '加载中',
73:     active: '运行中',
74:     error: '错误',
75:   }
76:   return map[cameraState.value] ?? cameraState.value
77: })
78: const openCvStatusText = computed(() => {
79:   const map: Record<string, string> = {
80:     idle: '未初始化',
81:     loading: '加载中',
82:     ready: '就绪',
83:     failed: '失败',
84:     fallback: '降级模式',
85:   }
86:   return map[openCvStatus.value] ?? openCvStatus.value
87: })
88: const profileStatusText = computed(() => {
89:   const map: Record<string, string> = {
90:     none: '未录入',
91:     encrypted: '已加密（锁定）',
92:     unlocked: '已解锁',
93:   }
94:   return map[profileStatus.value] ?? profileStatus.value
95: })
96: const cameraPermissionStateText = computed(() => {
97:   const map: Record<string, string> = {
98:     unknown: '未知',
99:     prompt: '待请求',
100:     granted: '已授权',
101:     denied: '已拒绝',
102:     unsupported: '不支持',
103:   }
104:   return map[cameraPermissionState.value] ?? cameraPermissionState.value
105: })
106: const mediaPipeStatusText = computed(() => {
107:   const map: Record<string, string> = {
108:     idle: 'idle',
109:     loading: 'loading',
110:     ready: 'ready',
111:     failed: 'failed',
112:   }
113:   return map[mediaPipeStatus.value] ?? mediaPipeStatus.value
114: })
115: const runtimeStatusText = computed(() => {
116:   const map: Record<string, string> = {
117:     idle: 'idle',
118:     warming: 'warming',
119:     ready: 'ready',
120:     partial_ready: 'partial_ready',
121:     failed: 'failed',
122:     resetting: 'resetting',
123:   }
124:   return map[runtimeStatus.value] ?? runtimeStatus.value
125: })
126: const runtimeWarmupDurationText = computed(() => formatTiming(runtimeWarmupDurationMs.value))
127: const gateStateText = computed(() => {
128:   const map: Record<string, string> = {
129:     disabled: '未启用',
130:     enabled: '已启用',
131:     gated: '门控中',
132:     locked: '已锁定',
133:   }
134:   return map[localFaceGate.gateState.value] ?? localFaceGate.gateState.value
135: })
136: const gateProfileStatusText = computed(() => {
137:   const map: Record<string, string> = {
138:     not_enrolled: 'not_enrolled',
139:     enrolling: 'enrolling',
140:     enrolled: 'enrolled',
141:     matching: 'matching',
142:     matched: 'matched',
143:     unmatched: 'unmatched',
144:     uncertain: 'uncertain',
145:     multiple_faces: 'multiple_faces',
146:     no_face: 'no_face',
147:   }
148:   return map[localFaceGate.profileStatus.value] ?? localFaceGate.profileStatus.value
149: })
150: const qualityText = computed(() => {
151:   const q = latestQuality.value
152:   if (!q)
153:     return '暂无'
154:   return `${q.qualityScore.toFixed(2)}（${q.accepted ? '通过' : mapQualityReason(q.reason)}）`
155: })
156: const lastTrackEndedAtText = computed(() => {
157:   if (!cameraDiagnostics.value.lastTrackEndedAt)
158:     return '无'
159:   return new Date(cameraDiagnostics.value.lastTrackEndedAt).toLocaleTimeString()
160: })
161: const lastInferenceErrorAtText = computed(() => {
162:   if (!cameraDiagnostics.value.lastInferenceErrorAt)
163:     return '无'
164:   return new Date(cameraDiagnostics.value.lastInferenceErrorAt).toLocaleTimeString()
165: })
166: const visionLastError = computed(() => {
167:   if (errorMessage.value)
168:     return errorMessage.value
169:   if (runtimeLastError.value)
170:     return runtimeLastError.value
171:   if (cameraDiagnostics.value.lastInferenceErrorMessage)
172:     return cameraDiagnostics.value.lastInferenceErrorMessage
173:   return '无'
174: })
175:
176: watch(videoRef, element => attachVideoElement(element), { immediate: true })
177:
178: watch(displayName, (value) => {
179:   if (value !== displayNameInput.value)
180:     displayNameInput.value = value
181: })
182: watch(displayNameInput, (value) => {
183:   if (value === displayName.value)
184:     return
185:   setDisplayName(value)
186: })
187:
188: watch(() => localFaceGate.threshold.value, (value) => {
189:   thresholdInput.value = value.toFixed(2)
190: })
191: watch(() => localFaceGate.qualityThreshold.value, (value) => {
192:   qualityThresholdInput.value = value.toFixed(2)
193: })
194: watch(() => localFaceGate.stableFrames.value, (value) => {
195:   stableFramesInput.value = String(value)
196: })
197:
198: watch(thresholdInput, (value) => {
199:   const parsed = Number.parseFloat(value)
200:   if (!Number.isFinite(parsed))
201:     return
202:   localFaceGate.setThreshold(parsed)
203: })
204: watch(qualityThresholdInput, (value) => {
205:   const parsed = Number.parseFloat(value)
206:   if (!Number.isFinite(parsed))
207:     return
208:   localFaceGate.setQualityThreshold(parsed)
209: })
210: watch(stableFramesInput, (value) => {
211:   const parsed = Number.parseInt(value, 10)
212:   if (!Number.isFinite(parsed))
213:     return
214:   localFaceGate.setStableFrames(parsed)
215: })
216: watch(rememberFaceProfileOnDevice, (value) => {
217:   rememberOnDevice.value = value
218: }, { immediate: true })
219:
220: onMounted(() => {
221:   void warmupVisionRuntime({
222:     background: true,
223:     includeOpenCv: false,
224:   }).catch(() => {
225:     // runtime diagnostics card will display latest error
226:   })
227: })
228:
229: function toggleCamera() {
230:   if (isEnabled.value) {
231:     void stop()
232:     return
233:   }
234:   void start()
235: }
236:
237: async function handleRetryRuntime() {
238:   if (runtimeWorking.value)
239:     return
240:   runtimeWorking.value = true
241:   try {
242:     await retryVisionRuntime()
243:     toast.success('Vision runtime retry completed.')
244:   }
245:   catch {
246:     toast.error('Vision runtime retry failed.')
247:   }
248:   finally {
249:     runtimeWorking.value = false
250:   }
251: }
252:
253: async function handleResetRuntime() {
254:   if (runtimeWorking.value)
255:     return
256:   runtimeWorking.value = true
257:   try {
258:     await resetVisionRuntime()
259:     toast.message('Vision runtime reset complete.')
260:   }
261:   finally {
262:     runtimeWorking.value = false
263:   }
264: }
265:
266: async function runEnrollment() {
267:   enrolling.value = true
268:   enrollmentMessage.value = ''
269:   acceptedSamples.value = 0
270:   rejectedSamples.value = 0
271:   try {
272:     const sampleCount = Number.parseInt(enrollSampleCountInput.value, 10)
273:     const result = await enrollLocalFaceProfile({
274:       displayName: displayNameInput.value,
275:       passphrase: passphrase.value,
276:       confirmPassphrase: confirmPassphrase.value,
277:       threshold: localFaceGate.threshold.value,
278:       qualityThreshold: localFaceGate.qualityThreshold.value,
279:       stableFrames: localFaceGate.stableFrames.value,
280:       enrollSampleCount: sampleCount,
281:     })
282:
283:     if (!result.ok) {
284:       enrollmentMessage.value = `录入失败：${mapEnrollmentFailureReason(result.reason)}`
285:       toast.error(enrollmentMessage.value)
286:       return
287:     }
288:
289:     acceptedSamples.value = result.captured
290:     enrollmentMessage.value = `录入完成：已通过 ${result.captured}/${result.target} 个样本。`
291:     toast.success('人脸档案已在本地加密保存。')
292:     setFaceGateEnabled(true)
293:   }
294:   finally {
295:     enrolling.value = false
296:   }
297: }
298:
299: async function runUnlock() {
300:   unlocking.value = true
301:   try {
302:     const result = await unlockFaceProfile(unlockPassphrase.value, {
303:       rememberOnDevice: rememberOnDevice.value,
304:     })
305:     if (!result.ok) {
306:       toast.error('无法解锁本地人脸档案。')
307:       return
308:     }
309:     unlockPassphrase.value = ''
310:     toast.success('人脸档案已解锁。')
311:   }
312:   finally {
313:     unlocking.value = false
314:   }
315: }
316:
317: async function toggleRememberOnDevice(event: Event) {
318:   const nextValue = (event.target as HTMLInputElement).checked
319:   const accepted = await setRememberFaceProfileOnDevice(nextValue)
320:   rememberOnDevice.value = accepted && nextValue
321: }
322:
323: function runLock() {
324:   lockFaceProfile()
325:   toast.message('人脸档案已锁定。')
326: }
327:
328: function runDelete() {
329:   if (!hasEncryptedProfile.value)
330:     return
331:   const confirmed = typeof window === 'undefined'
332:     ? true
333:     : window.confirm('确认删除本地加密人脸档案？此操作不可撤销。')
334:   if (!confirmed)
335:     return
336:
337:   deleteLocalFaceProfile()
338:   setFaceGateEnabled(false)
339:   unlockPassphrase.value = ''
340:   passphrase.value = ''
341:   confirmPassphrase.value = ''
342:   acceptedSamples.value = 0
343:   rejectedSamples.value = 0
344:   enrollmentMessage.value = '档案已清除。'
345:   toast.message('本地加密人脸档案已删除。')
346: }
347:
348: function backToStage() {
349:   void router.push('/')
350: }
351:
352: function mapQualityReason(reason: string | undefined) {
353:   const map: Record<string, string> = {
354:     low_quality: '质量不达标',
355:     face_too_small: '人脸过小',
356:     opencv_not_ready: 'OpenCV 未就绪',
357:     invalid_frame: '无效画面',
358:   }
359:   if (!reason)
360:     return '已拒绝'
361:   return map[reason] ?? reason
362: }
363:
364: function mapEnrollmentFailureReason(reason: string | undefined) {
365:   const map: Record<string, string> = {
366:     'camera inactive': '摄像头未开启',
367:     'displayName required': '请输入显示昵称',
368:     'passphrase required': '请输入口令',
369:     'passphrase mismatch': '两次口令不一致',
370:     'no face': '未检测到人脸',
371:     'multiple faces': '检测到多张人脸',
372:     'low quality': '样本质量不足',
373:     'descriptor failed': '人脸特征提取失败',
374:     'enrollment cancelled': '录入已取消',
375:     'save failed': '加密保存失败',
376:   }
377:   if (!reason)
378:     return '未知错误'
379:   return map[reason] ?? reason
380: }
381:
382: function formatTiming(ms: number | null) {
383:   if (ms === null || !Number.isFinite(ms))
384:     return '无'
385:   return `${ms.toFixed(1)} ms`
386: }
387: </script>
388:
389: <template>
390:   <div :class="['mx-auto max-w-4xl p-4 text-neutral-800 dark:text-neutral-100']">
391:     <div :class="['mb-4 flex items-center justify-between gap-2']">
392:       <div>
393:         <div :class="['text-2xl font-700']">
394:           人脸录入
395:         </div>
396:         <div :class="['text-sm text-neutral-500 dark:text-neutral-400']">
397:           为 Rin 视觉交互门控配置本地加密人脸档案。
398:         </div>
399:       </div>
400:       <Button size="sm" variant="ghost" @click="backToStage">
401:         返回主界面
402:       </Button>
403:     </div>
404:
405:     <div :class="['grid gap-3 md:grid-cols-2']">
406:       <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
407:         <div :class="['mb-2 text-sm font-700']">
408:           摄像头控制
409:         </div>
410:         <div :class="['flex items-center gap-2']">
411:           <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
412:             {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
413:           </Button>
414:         </div>
415:         <div :class="['mt-2 text-xs']">
416:           <div>摄像头状态：{{ cameraStateText }}</div>
417:           <div v-if="errorMessage" :class="['text-rose-600 dark:text-rose-300']">
418:             {{ errorMessage }}
419:           </div>
420:         </div>
421:       </div>
422:
423:       <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
424:         <div :class="['mb-2 text-sm font-700']">
425:           OpenCV 状态
426:         </div>
427:         <div :class="['text-xs']">
428:           <div>OpenCV：{{ openCvStatusText }}</div>
429:           <div>质量分：{{ qualityText }}</div>
430:           <div>亮度：{{ latestQuality?.brightness?.toFixed(1) ?? '无' }}</div>
431:           <div>清晰度：{{ latestQuality?.sharpness?.toFixed(1) ?? '无' }}</div>
432:           <div>对比度：{{ latestQuality?.contrast?.toFixed(1) ?? '无' }}</div>
433:           <div>人脸尺寸：{{ latestQuality?.faceSize?.toFixed(2) ?? '无' }}</div>
434:           <div v-if="openCvErrorMessage" :class="['text-amber-600 dark:text-amber-300']">
435:             {{ openCvErrorMessage }}
436:           </div>
437:         </div>
438:       </div>
439:     </div>
440:
441:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
442:       <div :class="['mb-2 text-sm font-700']">
443:         Vision Runtime
444:       </div>
445:       <div :class="['text-xs']">
446:         <div>status：{{ runtimeStatusText }}</div>
447:         <div>warmupDuration：{{ runtimeWarmupDurationText }}</div>
448:         <div>retryCount：{{ runtimeRetryCount }}</div>
449:         <div>lastError：{{ runtimeLastError || 'none' }}</div>
450:         <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
451:           First startup may take a moment.
452:         </div>
453:         <div :class="['text-neutral-500 dark:text-neutral-400']">
454:           Models are reused after warmup.
455:         </div>
456:         <div :class="['text-neutral-500 dark:text-neutral-400']">
457:           Stop Camera releases camera only; models stay ready.
458:         </div>
459:       </div>
460:       <div :class="['mt-2 flex flex-wrap items-center gap-2']">
461:         <Button size="sm" variant="ghost" :disabled="runtimeWorking" @click="handleRetryRuntime">
462:           {{ runtimeWorking ? '处理中...' : 'Retry Runtime' }}
463:         </Button>
464:         <Button size="sm" variant="ghost" :disabled="runtimeWorking" @click="handleResetRuntime">
465:           Reset Runtime
466:         </Button>
467:       </div>
468:     </div>
469:
470:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
471:       <div :class="['mb-2 text-sm font-700']">
472:         基础信息
473:       </div>
474:       <div :class="['grid gap-2 md:grid-cols-2']">
475:         <label :class="['flex flex-col gap-1 text-xs']">
476:           <span>显示昵称</span>
477:           <input
478:             v-model="displayNameInput"
479:             :class="[
480:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
481:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
482:             ]"
483:           >
484:         </label>
485:         <label :class="['flex flex-col gap-1 text-xs']">
486:           <span>加密口令 / PIN</span>
487:           <input
488:             v-model="passphrase"
489:             type="password"
490:             :class="[
491:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
492:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
493:             ]"
494:           >
495:         </label>
496:         <label :class="['flex flex-col gap-1 text-xs']">
497:           <span>确认口令</span>
498:           <input
499:             v-model="confirmPassphrase"
500:             type="password"
501:             :class="[
502:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
503:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
504:             ]"
505:           >
506:         </label>
507:         <label :class="['flex flex-col gap-1 text-xs']">
508:           <span>匹配阈值</span>
509:           <input
510:             v-model="thresholdInput"
511:             inputmode="decimal"
512:             :class="[
513:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
514:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
515:             ]"
516:           >
517:         </label>
518:         <label :class="['flex flex-col gap-1 text-xs']">
519:           <span>质量阈值</span>
520:           <input
521:             v-model="qualityThresholdInput"
522:             inputmode="decimal"
523:             :class="[
524:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
525:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
526:             ]"
527:           >
528:         </label>
529:         <label :class="['flex flex-col gap-1 text-xs']">
530:           <span>目标采样数</span>
531:           <input
532:             v-model="enrollSampleCountInput"
533:             inputmode="numeric"
534:             :class="[
535:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
536:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
537:             ]"
538:           >
539:         </label>
540:         <label :class="['flex flex-col gap-1 text-xs']">
541:           <span>稳定判定帧数</span>
542:           <input
543:             v-model="stableFramesInput"
544:             inputmode="numeric"
545:             :class="[
546:               'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
547:               'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
548:             ]"
549:           >
550:         </label>
551:       </div>
552:     </div>
553:
554:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
555:       <div :class="['mb-2 text-sm font-700']">
556:         采样录入
557:       </div>
558:       <div :class="['flex flex-wrap items-center gap-2']">
559:         <Button size="sm" variant="primary" :disabled="enrolling || !isEnabled" @click="runEnrollment">
560:           {{ enrolling ? '录入中...' : (hasEncryptedProfile ? '重新录入' : '开始录入') }}
561:         </Button>
562:       </div>
563:       <div :class="['mt-2 text-xs']">
564:         <div>通过样本数：{{ acceptedSamples }}</div>
565:         <div>拒绝样本数：{{ rejectedSamples }}</div>
566:         <div v-if="enrollmentMessage">
567:           {{ enrollmentMessage }}
568:         </div>
569:       </div>
570:     </div>
571:
572:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
573:       <div :class="['mb-2 text-sm font-700']">
574:         加密档案
575:       </div>
576:       <div :class="['text-xs']">
577:         <div>档案状态：{{ profileStatusText }}</div>
578:         <div>门控状态：{{ gateStateText }}</div>
579:         <div>样本数量：{{ localFaceGate.profileSampleCount }}</div>
580:         <div v-if="unlockedProfile">
581:           显示昵称：{{ unlockedProfile.displayName }}
582:         </div>
583:         <div v-if="unlockedProfile">
584:           创建时间：{{ unlockedProfile.createdAt }}
585:         </div>
586:         <div v-if="unlockedProfile">
587:           更新时间：{{ unlockedProfile.updatedAt }}
588:         </div>
589:       </div>
590:       <div :class="['mt-2 flex flex-wrap items-center gap-2']">
591:         <label :class="['flex items-center gap-1 text-xs']">
592:           <span>启用人脸门控</span>
593:           <input
594:             :checked="gateEnabled"
595:             type="checkbox"
596:             @change="setFaceGateEnabled(($event.target as HTMLInputElement).checked)"
597:           >
598:         </label>
599:         <input
600:           v-if="profileStatus !== 'unlocked'"
601:           v-model="unlockPassphrase"
602:           type="password"
603:           placeholder="输入解锁口令"
604:           :class="[
605:             'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
606:             'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
607:           ]"
608:         >
609:         <Button
610:           v-if="profileStatus !== 'unlocked'"
611:           size="sm"
612:           variant="secondary"
613:           :disabled="unlocking || !hasEncryptedProfile"
614:           @click="runUnlock"
615:         >
616:           {{ unlocking ? '解锁中...' : '解锁档案' }}
617:         </Button>
618:         <Button v-if="profileStatus === 'unlocked'" size="sm" variant="secondary" @click="runLock">
619:           锁定档案
620:         </Button>
621:         <Button size="sm" variant="ghost" :disabled="!hasEncryptedProfile" @click="runDelete">
622:           删除档案
623:         </Button>
624:       </div>
625:       <div v-if="hasEncryptedProfile" :class="['mt-2 flex flex-col gap-1 text-xs']">
626:         <label :class="['flex items-center gap-1 text-neutral-600 dark:text-neutral-300']">
627:           <input
628:             :checked="rememberOnDevice"
629:             type="checkbox"
630:             :disabled="!secureStoreAvailable"
631:             @change="toggleRememberOnDevice"
632:           >
633:           <span>在本机记住并自动解锁</span>
634:         </label>
635:         <div v-if="!secureStoreAvailable && isDev" :class="['text-amber-600 dark:text-amber-300']">
636:           当前环境未启用安全存储，无法开启无感自动解锁。
637:         </div>
638:       </div>
639:       <div v-if="encryptedProfile.errorMessage" :class="['mt-2 text-xs text-rose-600 dark:text-rose-300']">
640:         {{ encryptedProfile.errorMessage }}
641:       </div>
642:     </div>
643:
644:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
645:       <div :class="['mb-2 text-sm font-700']">
646:         Vision Diagnostics
647:       </div>
648:       <div :class="['grid gap-1 text-xs md:grid-cols-2']">
649:         <div>runtimeStatus：{{ runtimeStatusText }}</div>
650:         <div>runtimeWarmup：{{ runtimeWarmupDurationText }}</div>
651:         <div>runtimeRetryCount：{{ runtimeRetryCount }}</div>
652:         <div>cameraState：{{ cameraState }}</div>
653:         <div>cameraPermission：{{ cameraPermissionStateText }}</div>
654:         <div>MediaPipe：{{ mediaPipeStatusText }}</div>
655:         <div>OpenCV：{{ openCvStatusText }}</div>
656:         <div>faceProfile：{{ profileStatus }}</div>
657:         <div>faceGate：{{ localFaceGate.gateState }} / {{ gateProfileStatusText }}</div>
658:         <div :class="['md:col-span-2']">
659:           lastError：{{ visionLastError }}
660:         </div>
661:       </div>
662:     </div>
663:
664:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
665:       <div :class="['mb-2 text-sm font-700']">
666:         摄像头诊断日志
667:       </div>
668:       <div :class="['text-xs']">
669:         <div>轨道结束次数：{{ cameraDiagnostics.trackEndedCount }}</div>
670:         <div>意外轨道结束次数：{{ cameraDiagnostics.unexpectedTrackEndedCount }}</div>
671:         <div>最近轨道结束时间：{{ lastTrackEndedAtText }}</div>
672:         <div>最近轨道 ID：{{ cameraDiagnostics.lastTrackEndedTrackId ?? '无' }}</div>
673:         <div>最近轨道标签：{{ cameraDiagnostics.lastTrackEndedTrackLabel ?? '无' }}</div>
674:         <div>最近轨道结束是否主动：{{ cameraDiagnostics.lastTrackEndedIntentional === null ? '无' : (cameraDiagnostics.lastTrackEndedIntentional ? '是' : '否') }}</div>
675:         <div>识别异常总数：{{ cameraDiagnostics.inferenceErrorCount }}</div>
676:         <div>连续识别异常：{{ cameraDiagnostics.consecutiveInferenceErrorCount }}</div>
677:         <div>最近识别异常时间：{{ lastInferenceErrorAtText }}</div>
678:         <div>最近识别异常信息：{{ cameraDiagnostics.lastInferenceErrorMessage || '无' }}</div>
679:       </div>
680:     </div>
681:
682:     <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 text-xs shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
683:       人脸档案仅在本地加密保存，不会上传任何摄像头数据；口令不会被持久化保存，本地档案可随时删除，本功能仅用于提升 Rin 视觉交互体验。
684:     </div>
685:
686:     <video
687:       ref="videoRef"
688:       muted
689:       playsinline
690:       :class="['h-0 w-0 op-0 pointer-events-none']"
691:     />
692:   </div>
693: </template>

(End of file - total 693 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-move-overlay.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-move-overlay.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: const props = withDefaults(defineProps<{
3:   enabled: boolean
4:   isLinux: boolean
5:   debug?: boolean
6: }>(), {
7:   debug: false,
8: })
9:
10: const emit = defineEmits<{
11:   (event: 'startDrag'): void
12: }>()
13:
14: function handleDragMouseDown() {
15:   if (!props.isLinux) {
16:     emit('startDrag')
17:   }
18: }
19: </script>
20:
21: <template>
22:   <Transition
23:     enter-active-class="transition-opacity duration-250"
24:     enter-from-class="opacity-0"
25:     enter-to-class="opacity-100"
26:     leave-active-class="transition-opacity duration-250"
27:     leave-from-class="opacity-100"
28:     leave-to-class="opacity-0"
29:   >
30:     <div
31:       v-if="enabled"
32:       data-testid="stage-move-overlay"
33:       data-control-layer="move-overlay"
34:       :class="[
35:         'stage-move-overlay',
36:         'absolute left-0 top-0 z-30 h-full w-full pointer-events-none',
37:       ]"
38:     >
39:       <div
40:         data-testid="stage-move-hit-area"
41:         :class="[
42:           'stage-move-hit-area',
43:           'absolute pointer-events-auto cursor-move select-none',
44:           props.debug ? 'stage-move-hit-area-debug' : '',
45:           props.isLinux ? 'drag-region' : '',
46:         ]"
47:         @mousedown="handleDragMouseDown"
48:       />
49:     </div>
50:   </Transition>
51: </template>
52:
53: <style scoped>
54: .stage-move-overlay {
55:   --stage-move-hit-area-width: min(70vw, 420px);
56:   --stage-move-hit-area-height: min(72vh, 560px);
57:   --stage-move-hit-area-offset-y: -42%;
58:   --stage-move-hit-area-right-safe: 112px;
59: }
60:
61: .stage-move-hit-area {
62:   top: 50%;
63:   left: calc(50% - 24px);
64:   transform: translate(-50%, var(--stage-move-hit-area-offset-y));
65:   width: var(--stage-move-hit-area-width);
66:   height: var(--stage-move-hit-area-height);
67:   max-width: calc(100% - var(--stage-move-hit-area-right-safe));
68:   max-height: calc(100% - 72px);
69:   min-height: 220px;
70: }
71:
72: .stage-move-hit-area-debug {
73:   border-radius: 12px;
74:   outline: 1px dashed rgb(56 189 248 / 45%);
75:   background: rgb(56 189 248 / 6%);
76: }
77: </style>

(End of file - total 77 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/ResizeHandler.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/ResizeHandler.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { electron } from '@proj-airi/electron-eventa'
3: import { useElectronEventaInvoke, useElectronWindowResize } from '@proj-airi/electron-vueuse'
4: import { useAsyncState } from '@vueuse/core'
5: import { computed } from 'vue'
6: import { useRoute } from 'vue-router'
7:
8: const isWindows = useElectronEventaInvoke(electron.app.isWindows)
9: const { handleResizeStart } = useElectronWindowResize()
10: const route = useRoute()
11: const isStageLayout = computed(() => route.meta.layout === 'stage')
12: const { state: isWindowsRef } = useAsyncState(() => isWindows(), false)
13:
14: const resizeDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
15: </script>
16:
17: <template>
18:   <div
19:     v-if="isWindowsRef"
20:     data-testid="resize-handles-root"
21:     :class="[
22:       'resize-handles',
23:       isStageLayout ? 'resize-handles-stage' : '',
24:     ]"
25:   >
26:     <div
27:       v-for="direction in resizeDirections"
28:       :key="direction"
29:       :data-testid="`resize-handle-${direction}`"
30:       :class="[
31:         'handle',
32:         direction,
33:       ]"
34:       @mousedown="handleResizeStart($event, direction)"
35:     />
36:   </div>
37: </template>
38:
39: <style scoped>
40: .resize-handles {
41:   position: fixed;
42:   top: 0;
43:   left: 0;
44:   right: 0;
45:   bottom: 0;
46:   pointer-events: none;
47:   z-index: 9999;
48: }
49:
50: .handle {
51:   position: absolute;
52:   pointer-events: auto;
53: }
54:
55: .handle.n { top: 0; left: 5px; right: 5px; height: 5px; cursor: n-resize; }
56: .handle.s { bottom: 0; left: 5px; right: 5px; height: 5px; cursor: s-resize; }
57: .handle.e { top: 5px; bottom: 5px; right: 0; width: 5px; cursor: e-resize; }
58: .handle.w { top: 5px; bottom: 5px; left: 0; width: 5px; cursor: w-resize; }
59:
60: .handle.nw { top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize; }
61: .handle.ne { top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize; }
62: .handle.sw { bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize; }
63: .handle.se { bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize; }
64:
65: .resize-handles-stage .handle.n,
66: .resize-handles-stage .handle.s {
67:   height: 8px;
68: }
69:
70: .resize-handles-stage .handle.e,
71: .resize-handles-stage .handle.w {
72:   width: 8px;
73: }
74:
75: .resize-handles-stage .handle.nw,
76: .resize-handles-stage .handle.ne,
77: .resize-handles-stage .handle.sw,
78: .resize-handles-stage .handle.se {
79:   width: 14px;
80:   height: 14px;
81: }
82: </style>

(End of file - total 82 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/index.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/index.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import type { ModelSettingsRuntimeSnapshot } from '@proj-airi/stage-ui/components/scenarios/settings/model-settings/runtime'
3:
4: import type { ModelSettingsRuntimeChannelEvent } from '../../shared/model-settings-runtime'
5:
6: import workletUrl from '@proj-airi/stage-ui/workers/vad/process.worklet?worker&url'
7:
8: import { defineInvoke } from '@moeru/eventa'
9: import { tryCatch } from '@moeru/std'
10: import { electron } from '@proj-airi/electron-eventa'
11: import {
12:   useElectronEventaContext,
13:   useElectronEventaInvoke,
14:   useElectronMouseAroundWindowBorder,
15:   useElectronMouseInElement,
16:   useElectronMouseInWindow,
17:   useElectronRelativeMouse,
18: } from '@proj-airi/electron-vueuse'
19: import { useModelStore, useThreeSceneIsTransparentAtPoint } from '@proj-airi/stage-ui-three'
20: import { HoloCoupon } from '@proj-airi/stage-ui/components'
21: import {
22:   createEmptyModelSettingsRuntimeSnapshot,
23:   resolveComponentStateToRuntimePhase,
24: } from '@proj-airi/stage-ui/components/scenarios/settings/model-settings/runtime'
25: import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
26: import { useAudioRecorder } from '@proj-airi/stage-ui/composables/audio/audio-recorder'
27: import { useCanvasPixelIsTransparentAtPoint } from '@proj-airi/stage-ui/composables/canvas-alpha'
28: import { useVAD } from '@proj-airi/stage-ui/stores/ai/models/vad'
29: import { useLive2d } from '@proj-airi/stage-ui/stores/live2d'
30: import { useHearingSpeechInputPipeline } from '@proj-airi/stage-ui/stores/modules/hearing'
31: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
32: import { useOnboardingStore } from '@proj-airi/stage-ui/stores/onboarding'
33: import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
34: import { refDebounced, useAsyncState, useBroadcastChannel } from '@vueuse/core'
35: import { storeToRefs } from 'pinia'
36: import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
37:
38: import ControlsIsland from '../components/stage-islands/controls-island/index.vue'
39: import ResourceStatusIsland from '../components/stage-islands/resource-status-island/index.vue'
40: import StatusIsland from '../components/stage-islands/status-island/index.vue'
41: import StudyBubble from '../components/stage-islands/study-bubble/index.vue'
42: import StageMoveOverlay from '../components/stage-move-overlay.vue'
43:
44: import { electronOpenOnboarding, electronStartDraggingWindow } from '../../shared/eventa'
45: import { modelSettingsRuntimeSnapshotChannelName } from '../../shared/model-settings-runtime'
46: import { useStudyCompanionBubble } from '../composables/use-study-companion-bubble'
47: import { useStudyStageFeedback } from '../composables/use-study-stage-feedback'
48: import { useChatSyncStore } from '../stores/chat-sync'
49: import { useControlsIslandStore } from '../stores/controls-island'
50: import { useStageWindowLifecycleStore } from '../stores/stage-window-lifecycle'
51: import { useWindowStore } from '../stores/window'
52: import { shouldSampleStageTransparency } from '../utils/stage-three-transparency'
53:
54: const controlsIslandRef = ref<InstanceType<typeof ControlsIsland>>()
55: const statusIslandRef = ref<InstanceType<typeof StatusIsland>>()
56: const widgetStageRef = ref<InstanceType<typeof WidgetStage>>()
57: const stageCanvas = toRef(() => widgetStageRef.value?.canvasElement())
58: const componentStateStage = ref<'pending' | 'loading' | 'mounted'>('pending')
59: const stageMounted = computed(() => componentStateStage.value === 'mounted')
60: const isLoading = computed(() => !stageMounted.value)
61: useStudyStageFeedback()
62: const { currentBubble } = useStudyCompanionBubble()
63:
64: const isIgnoringMouseEvents = ref(false)
65: const shouldFadeOnCursorWithin = ref(false)
66:
67: const onboardingStore = useOnboardingStore()
68: const openOnboarding = useElectronEventaInvoke(electronOpenOnboarding)
69: const eventaContext = useElectronEventaContext()
70: const isLinux = useElectronEventaInvoke(electron.app.isLinux)
71: const { state: isLinuxRef } = useAsyncState(() => isLinux(), false)
72:
73: const { isOutside: isOutsideWindow } = useElectronMouseInWindow()
74: const { isOutside } = useElectronMouseInElement(controlsIslandRef)
75: const { isOutside: isOutsideStatusIsland } = useElectronMouseInElement(statusIslandRef)
76: const isOutsideFor250Ms = refDebounced(isOutside, 250)
77: const isOutsideStatusIslandFor250Ms = refDebounced(isOutsideStatusIsland, 250)
78: const { x: relativeMouseX, y: relativeMouseY } = useElectronRelativeMouse()
79: // NOTICE: In real-world use cases of Fade on Hover feature, the cursor may move around the edge of the
80: // model rapidly, causing flickering effects when checking pixel transparency strictly.
81: // Here we use render-target pixel sampling to keep detection aligned with the actual render output.
82: const isTransparentByPixels = useCanvasPixelIsTransparentAtPoint(
83:   stageCanvas,
84:   relativeMouseX,
85:   relativeMouseY,
86:   { regionRadius: 25 },
87: )
88: const isTransparentByThree = useThreeSceneIsTransparentAtPoint(
89:   widgetStageRef,
90:   relativeMouseX,
91:   relativeMouseY,
92:   { regionRadius: 25 },
93: )
94:
95: const settingsStore = useSettings()
96: const { stageModelRenderer, stageModelSelectedUrl } = storeToRefs(settingsStore)
97: const modelStore = useModelStore()
98: const { sceneMutationLocked, scenePhase } = storeToRefs(modelStore)
99: const { stagePaused } = storeToRefs(useStageWindowLifecycleStore())
100: const controlsIslandStore = useControlsIslandStore()
101: const { fadeOnHoverEnabled, moveModeEnabled, controlsPanelExpanded } = storeToRefs(controlsIslandStore)
102: const modelSettingsRuntimeOwnerInstanceId = `tamagotchi-main-stage:${Math.random().toString(36).slice(2, 10)}`
103: const { data: modelSettingsRuntimeChannelEvent, post: postModelSettingsRuntimeChannelEvent } = useBroadcastChannel<ModelSettingsRuntimeChannelEvent, ModelSettingsRuntimeChannelEvent>({ name: modelSettingsRuntimeSnapshotChannelName })
104: const shouldUseThreeTransparencyHitTest = computed(() => shouldSampleStageTransparency({
105:   componentState: componentStateStage.value,
106:   fadeOnHoverEnabled: fadeOnHoverEnabled.value,
107:   stageModelRenderer: stageModelRenderer.value,
108:   stagePaused: stagePaused.value,
109: }))
110: const isTransparent = computed(() => {
111:   if (stagePaused.value || componentStateStage.value !== 'mounted' || !fadeOnHoverEnabled.value)
112:     return true
113:
114:   if (stageModelRenderer.value === 'vrm')
115:     return shouldUseThreeTransparencyHitTest.value ? isTransparentByThree.value : true
116:
117:   if (stageModelRenderer.value === 'live2d')
118:     return isTransparentByPixels.value
119:
120:   // NOTICE:
121:   // Godot / unsupported renderers currently do not provide per-pixel transparency sampling.
122:   // Returning `false` here keeps fade-on-hover visually functional instead of being permanently disabled.
123:   return false
124: })
125:
126: const { isNearAnyBorder: isAroundWindowBorder } = useElectronMouseAroundWindowBorder({ threshold: 10 })
127: const isAroundWindowBorderFor250Ms = refDebounced(isAroundWindowBorder, 250)
128:
129: const setIgnoreMouseEvents = useElectronEventaInvoke(electron.window.setIgnoreMouseEvents)
130: const startDraggingWindow = defineInvoke(eventaContext.value, electronStartDraggingWindow)
131:
132: function handleMoveOverlayDragStart() {
133:   if (!isLinuxRef.value) {
134:     startDraggingWindow()
135:   }
136: }
137:
138: const live2dStore = useLive2d()
139: const { scale, positionInPercentageString } = storeToRefs(live2dStore)
140: const { live2dLookAtX, live2dLookAtY } = storeToRefs(useWindowStore())
141:
142: const { pause, resume } = watch(isTransparent, (transparent) => {
143:   shouldFadeOnCursorWithin.value = fadeOnHoverEnabled.value && !transparent
144: }, { immediate: true })
145:
146: const hearingDialogOpen = computed(() => controlsIslandRef.value?.hearingDialogOpen ?? false)
147: const studyPanelPinned = computed(() => controlsIslandRef.value?.studyPanelPinned ?? false)
148: const studyPanelInputActive = computed(() => controlsIslandRef.value?.studyPanelInputActive ?? false)
149:
150: const modelSettingsRuntimeSnapshot = computed<ModelSettingsRuntimeSnapshot>(() => {
151:   const hasModel = !!stageModelSelectedUrl.value
152:
153:   if (stageModelRenderer.value === 'live2d') {
154:     const phase = resolveComponentStateToRuntimePhase(componentStateStage.value, { hasModel })
155:
156:     return createEmptyModelSettingsRuntimeSnapshot({
157:       ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
158:       renderer: 'live2d',
159:       phase,
160:       controlsLocked: hasModel ? phase !== 'mounted' : false,
161:       previewAvailable: hasModel,
162:       canCapturePreview: false,
163:       updatedAt: Date.now(),
164:     })
165:   }
166:
167:   if (stageModelRenderer.value === 'vrm') {
168:     return createEmptyModelSettingsRuntimeSnapshot({
169:       ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
170:       renderer: 'vrm',
171:       phase: hasModel ? scenePhase.value : 'no-model',
172:       controlsLocked: hasModel
173:         ? (!stageMounted.value || sceneMutationLocked.value)
174:         : false,
175:       previewAvailable: hasModel,
176:       canCapturePreview: false,
177:       updatedAt: Date.now(),
178:     })
179:   }
180:
181:   if (stageModelRenderer.value === 'godot') {
182:     return createEmptyModelSettingsRuntimeSnapshot({
183:       ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
184:       renderer: 'godot',
185:       phase: hasModel ? 'mounted' : 'no-model',
186:       controlsLocked: false,
187:       previewAvailable: false,
188:       canCapturePreview: false,
189:       updatedAt: Date.now(),
190:     })
191:   }
192:
193:   return createEmptyModelSettingsRuntimeSnapshot({
194:     ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
195:     updatedAt: Date.now(),
196:   })
197: })
198:
199: watch([isOutsideFor250Ms, isOutsideStatusIslandFor250Ms, isAroundWindowBorderFor250Ms, isOutsideWindow, isTransparent, hearingDialogOpen, studyPanelPinned, fadeOnHoverEnabled, moveModeEnabled, controlsPanelExpanded, stagePaused], () => {
200:   if (stagePaused.value) {
201:     isIgnoringMouseEvents.value = false
202:     shouldFadeOnCursorWithin.value = false
203:     setIgnoreMouseEvents([false, { forward: true }])
204:     pause()
205:     return
206:   }
207:
208:   if (moveModeEnabled.value) {
209:     // Move mode needs reliable pointer events on stage to avoid click-through conflicts.
210:     // Keep stage interactive, but still allow fade preview to work.
211:     const fadeEnabled = fadeOnHoverEnabled.value
212:     const insideControls = !isOutsideFor250Ms.value || !isOutsideStatusIslandFor250Ms.value
213:     isIgnoringMouseEvents.value = false
214:     shouldFadeOnCursorWithin.value = fadeEnabled
215:       && !insideControls
216:       && !isTransparent.value
217:     setIgnoreMouseEvents([false, { forward: true }])
218:     if (shouldFadeOnCursorWithin.value)
219:       resume()
220:     else
221:       pause()
222:     return
223:   }
224:
225:   if (controlsPanelExpanded.value) {
226:     // Keep the control drawer interactive, while still allowing stage fade preview.
227:     const fadeEnabled = fadeOnHoverEnabled.value
228:     const insideControls = !isOutsideFor250Ms.value || !isOutsideStatusIslandFor250Ms.value
229:     isIgnoringMouseEvents.value = false
230:     shouldFadeOnCursorWithin.value = fadeEnabled
231:       && !insideControls
232:       && !isTransparent.value
233:     setIgnoreMouseEvents([false, { forward: true }])
234:     if (shouldFadeOnCursorWithin.value)
235:       resume()
236:     else
237:       pause()
238:     return
239:   }
240:
241:   if (studyPanelPinned.value) {
242:     // Study panel text editing should stay interactive and avoid click-through.
243:     isIgnoringMouseEvents.value = false
244:     shouldFadeOnCursorWithin.value = false
245:     setIgnoreMouseEvents([false, { forward: true }])
246:     pause()
247:     return
248:   }
249:
250:   if (hearingDialogOpen.value) {
251:     // Hearing dialog/drawer is open; keep window interactive
252:     isIgnoringMouseEvents.value = false
253:     shouldFadeOnCursorWithin.value = false
254:     setIgnoreMouseEvents([false, { forward: true }])
255:     pause()
256:     return
257:   }
258:
259:   const insideControls = !isOutsideFor250Ms.value || !isOutsideStatusIslandFor250Ms.value
260:   const nearBorder = isAroundWindowBorderFor250Ms.value
261:
262:   if (insideControls || nearBorder) {
263:     // Inside interactive controls or near resize border: do NOT ignore events
264:     isIgnoringMouseEvents.value = false
265:     shouldFadeOnCursorWithin.value = false
266:     setIgnoreMouseEvents([false, { forward: true }])
267:     pause()
268:   }
269:   else {
270:     const fadeEnabled = fadeOnHoverEnabled.value
271:     // Otherwise allow click-through while we fade UI based on transparency (when enabled)
272:     isIgnoringMouseEvents.value = fadeEnabled
273:     shouldFadeOnCursorWithin.value = fadeEnabled && !isTransparent.value
274:     setIgnoreMouseEvents([fadeEnabled, { forward: true }])
275:     if (fadeEnabled)
276:       resume()
277:     else
278:       pause()
279:   }
280: })
281:
282: // Emit runtime snapshot on change and on request from settings panel
283: watch(modelSettingsRuntimeSnapshot, (snapshot) => {
284:   postModelSettingsRuntimeChannelEvent({ type: 'snapshot', snapshot })
285: }, { immediate: true })
286:
287: watch(modelSettingsRuntimeChannelEvent, (event) => {
288:   if (event?.type !== 'request-current')
289:     return
290:
291:   postModelSettingsRuntimeChannelEvent({ type: 'snapshot', snapshot: modelSettingsRuntimeSnapshot.value })
292: })
293:
294: const settingsAudioDeviceStore = useSettingsAudioDevice()
295: const { stream, enabled } = storeToRefs(settingsAudioDeviceStore)
296: const { askPermission } = settingsAudioDeviceStore
297: const { startRecord, stopRecord, onStopRecord } = useAudioRecorder(stream)
298: const hearingPipeline = useHearingSpeechInputPipeline()
299: const { transcribeForRecording, transcribeForMediaStream, stopStreamingTranscription } = hearingPipeline
300: const { supportsStreamInput } = storeToRefs(hearingPipeline)
301: const chatSyncStore = useChatSyncStore()
302: const shouldUseStreamInput = computed(() => supportsStreamInput.value && !!stream.value)
303:
304: const { init: initVAD, dispose: disposeVAD, start: startVAD, loaded: vadLoaded } = useVAD(workletUrl, {
305:   threshold: ref(0.6),
306:   onSpeechStart: () => {
307:     void handleSpeechStart()
308:   },
309:   onSpeechEnd: () => {
310:     void handleSpeechEnd()
311:   },
312: })
313:
314: let stopOnStopRecord: (() => void) | undefined
315: const audioInteractionStarting = ref(false)
316:
317: // Caption overlay broadcast channel
318: type CaptionChannelEvent
319:   = | { type: 'caption-speaker', text: string }
320:     | { type: 'caption-assistant', text: string }
321: const { post: postCaption } = useBroadcastChannel<CaptionChannelEvent, CaptionChannelEvent>({ name: 'airi-caption-overlay' })
322: function handleVisibilityChange() {
323:   if (!document.hidden) {
324:     useStudyCompanionStore().syncFromWallClock()
325:   }
326: }
327:
328: function handleStreamingSentenceEnd(delta: string) {
329:   console.info('[Main Page] Received transcription delta:', delta)
330:   const finalText = delta
331:   if (!finalText || !finalText.trim()) {
332:     return
333:   }
334:
335:   postCaption({ type: 'caption-speaker', text: finalText })
336:
337:   void (async () => {
338:     try {
339:       console.info('[Main Page] Sending transcription to chat:', finalText)
340:       await chatSyncStore.requestIngest({ text: finalText })
341:     }
342:     catch (err) {
343:       console.error('[Main Page] Failed to send chat from voice:', err)
344:     }
345:   })()
346: }
347:
348: function handleStreamingSpeechEnd(text: string) {
349:   console.info('[Main Page] Speech ended, final text:', text)
350:   postCaption({ type: 'caption-speaker', text })
351: }
352:
353: async function handleSpeechStart() {
354:   if (shouldUseStreamInput.value) {
355:     console.info('Speech detected - transcription session should already be active')
356:     return
357:   }
358:
359:   startRecord()
360: }
361:
362: async function handleSpeechEnd() {
363:   if (shouldUseStreamInput.value) {
364:     // Keep streaming session alive; idle timer in pipeline will handle teardown.
365:     return
366:   }
367:
368:   stopRecord()
369: }
370:
371: async function startAudioInteraction() {
372:   if (audioInteractionStarting.value)
373:     return
374:
375:   // NOTICE: `stopOnStopRecord` only tracks whether the non-stream recording hook was registered.
376:   //
377:   // It does NOT guarantee that the current realtime transcription session is still attached to the
378:   // latest `MediaStream`. We previously used it as a generic "already started" guard, which broke
379:   // the hearing-config retoggle path: the mic stream was recreated, VAD restarted on the new stream,
380:   // but `transcribeForMediaStream()` never reattached so speech was detected without any transcript.
381:   //
382:   // Keep the startup guard scoped to "startup in progress" only, and let stream changes restart the
383:   // transcription binding when a new stream arrives.
384:   audioInteractionStarting.value = true
385:   try {
386:     console.info('[Main Page] Starting audio interaction...')
387:
388:     initVAD().then(() => {
389:       if (stream.value) {
390:         console.info('[Main Page] VAD initialized successfully, starting with stream input')
391:         return startVAD(stream.value)
392:       }
393:     }).catch((err) => {
394:       console.warn('[Main Page] VAD initialization failed (non-critical for Web Speech API):', err)
395:     })
396:
397:     if (shouldUseStreamInput.value) {
398:       console.info('[Main Page] Starting streaming transcription...', {
399:         supportsStreamInput: supportsStreamInput.value,
400:         hasStream: !!stream.value,
401:       })
402:
403:       if (!stream.value) {
404:         console.warn('[Main Page] Stream not available despite shouldUseStreamInput being true')
405:         return
406:       }
407:
408:       // Use sentence deltas for live captions and speech end for final text.
409:       await transcribeForMediaStream(stream.value, {
410:         onSentenceEnd: handleStreamingSentenceEnd,
411:         onSpeechEnd: handleStreamingSpeechEnd,
412:       })
413:
414:       console.info('[Main Page] Streaming transcription started successfully')
415:     }
416:     else {
417:       console.warn('[Main Page] Not starting streaming transcription:', {
418:         shouldUseStreamInput: shouldUseStreamInput.value,
419:         hasStream: !!stream.value,
420:         supportsStreamInput: supportsStreamInput.value,
421:       })
422:     }
423:
424:     // NOTICE: This hook is only for record-then-transcribe providers.
425:     //
426:     // Streaming providers use the active `MediaStream` directly, so this callback must not be treated
427:     // as proof that a realtime session is alive. Future refactors should keep recorder-hook bookkeeping
428:     // separate from stream transcription state, otherwise mic/device re-toggles can leave VAD active
429:     // but transcription detached.
430:     //
431:     // Hook once for non-streaming providers.
432:     if (!stopOnStopRecord) {
433:       stopOnStopRecord = onStopRecord(async (recording) => {
434:         if (shouldUseStreamInput.value)
435:           return
436:
437:         const text = await transcribeForRecording(recording)
438:         if (!text || !text.trim())
439:           return
440:
441:         // Update caption overlay speaker text via BroadcastChannel
442:         postCaption({ type: 'caption-speaker', text })
443:
444:         try {
445:           await chatSyncStore.requestIngest({ text })
446:         }
447:         catch (err) {
448:           console.error('Failed to send chat from voice:', err)
449:         }
450:       })
451:     }
452:   }
453:   catch (e) {
454:     console.error('Audio interaction init failed:', e)
455:   }
456:   finally {
457:     audioInteractionStarting.value = false
458:   }
459: }
460:
461: function stopAudioInteraction() {
462:   tryCatch(() => {
463:     stopOnStopRecord?.()
464:     stopOnStopRecord = undefined
465:     audioInteractionStarting.value = false
466:     void stopStreamingTranscription(true)
467:     disposeVAD()
468:   })
469: }
470:
471: watch(enabled, async (val) => {
472:   console.info('[Main Page] Audio enabled changed:', val, 'stream available:', !!stream.value)
473:   if (val) {
474:     await askPermission()
475:     await startAudioInteraction()
476:   }
477:   else {
478:     stopAudioInteraction()
479:   }
480: }, { immediate: true })
481:
482: onMounted(() => {
483:   chatSyncStore.initialize('authority')
484:   if (onboardingStore.needsOnboarding) {
485:     openOnboarding()
486:   }
487:   document.addEventListener('visibilitychange', handleVisibilityChange)
488: })
489:
490: onUnmounted(() => {
491:   document.removeEventListener('visibilitychange', handleVisibilityChange)
492:   tryCatch(() => {
493:     postModelSettingsRuntimeChannelEvent({
494:       type: 'owner-gone',
495:       ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
496:     })
497:   })
498:   stopAudioInteraction()
499:   chatSyncStore.dispose()
500: })
501:
502: watch(stream, async (currentStream) => {
503:   if (!enabled.value || !currentStream || audioInteractionStarting.value)
504:     return
505:
506:   // NOTICE: The controls-island mic toggle and device changes can replace the underlying MediaStream
507:   // without reloading the page. When that happens, VAD may successfully restart against the new stream,
508:   // but any existing transcription transport is still bound to the old one. Always allow the page to
509:   // re-run `startAudioInteraction()` for a newly available stream unless startup is already underway.
510:   console.info('[Main Page] Stream became available, ensuring audio interaction is started')
511:   await startAudioInteraction()
512: })
513:
514: watch([stream, () => vadLoaded.value], async ([s, loaded]) => {
515:   if (enabled.value && loaded && s) {
516:     try {
517:       await startVAD(s)
518:     }
519:     catch (e) {
520:       console.error('Failed to start VAD with stream:', e)
521:     }
522:   }
523: })
524:
525: // Assistant caption is broadcast from Stage.vue via the same channel
526: </script>
527:
528: <template>
529:   <div
530:     max-h="[100vh]"
531:     max-w="[100vw]"
532:     flex="~ col"
533:     relative h-full overflow-hidden rounded-xl
534:     transition="opacity duration-500 ease-in-out"
535:   >
536:     <!-- Stage is always in DOM so TresCanvas can measure dimensions -->
537:     <div
538:       :class="[
539:         'relative h-full w-full items-end gap-2',
540:         'transition-opacity duration-250 ease-in-out',
541:       ]"
542:     >
543:       <div
544:         :class="[
545:           shouldFadeOnCursorWithin ? 'op-0' : 'op-100',
546:           'absolute',
547:           'top-0 left-0 w-full h-full',
548:           'overflow-hidden',
549:           'rounded-2xl',
550:           'transition-opacity duration-250 ease-in-out',
551:         ]"
552:       >
553:         <StatusIsland ref="statusIslandRef" class="relative z-60" />
554:         <ResourceStatusIsland class="relative z-60" />
555:         <WidgetStage
556:           ref="widgetStageRef"
557:           v-model:state="componentStateStage"
558:           h-full w-full
559:           flex-1
560:           :paused="stagePaused"
561:           :focus-at="{ x: live2dLookAtX, y: live2dLookAtY }"
562:           :scale="scale"
563:           :x-offset="positionInPercentageString.x"
564:           :y-offset="positionInPercentageString.y"
565:         />
566:         <HoloCoupon />
567:         <StudyBubble
568:           :message="currentBubble"
569:           :lift-for-input="studyPanelInputActive"
570:         />
571:       </div>
572:     </div>
573:     <!-- Loading overlay sits on top, does not hide the stage -->
574:     <div v-show="isLoading" class="absolute left-0 top-0 z-99 h-full w-full flex cursor-grab items-center justify-center overflow-hidden">
575:       <div
576:         :class="[
577:           'absolute h-24 w-full overflow-hidden rounded-xl',
578:           'flex items-center justify-center',
579:           'bg-white/80 dark:bg-neutral-950/80',
580:           'backdrop-blur-md',
581:         ]"
582:       >
583:         <div
584:           :class="[
585:             'drag-region',
586:             'absolute left-0 top-0',
587:             'h-full w-full flex items-center justify-center',
588:             'text-1.5rem text-primary-600 dark:text-primary-400 font-normal',
589:             'select-none',
590:             'animate-flash animate-duration-5s animate-count-infinite',
591:           ]"
592:         >
593:           Loading...
594:         </div>
595:       </div>
596:     </div>
597:   </div>
598:   <div
599:     data-control-layer="floating-controls-layer"
600:     :class="[
601:       'pointer-events-none fixed inset-0 z-[170]',
602:       '[-webkit-app-region:no-drag]',
603:     ]"
604:   >
605:     <ControlsIsland
606:       ref="controlsIslandRef"
607:       class="pointer-events-auto"
608:     />
609:   </div>
610:   <StageMoveOverlay
611:     :enabled="moveModeEnabled && !isLoading"
612:     :is-linux="isLinuxRef"
613:     @start-drag="handleMoveOverlayDragStart"
614:   />
615:   <Transition
616:     enter-active-class="transition-opacity duration-250 ease-in-out"
617:     enter-from-class="opacity-50"
618:     enter-to-class="opacity-100"
619:     leave-active-class="transition-opacity duration-250 ease-in-out"
620:     leave-from-class="opacity-100"
621:     leave-to-class="opacity-50"
622:   >
623:     <div v-if="isAroundWindowBorderFor250Ms && !isLoading" class="pointer-events-none absolute left-0 top-0 z-999 h-full w-full">
624:       <div
625:         :class="[
626:           'b-primary/50',
627:           'h-full w-full animate-flash animate-duration-3s animate-count-infinite b-4 rounded-2xl',
628:         ]"
629:       />
630:     </div>
631:   </Transition>
632: </template>
633:
634: <route lang="yaml">
635: meta:
636:   layout: stage
637: </route>

(End of file - total 637 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro · 26.5s)

_Thinking:_

现在我已经读取了足够的关键文件来了解项目的当前状态。让我继续读取一些辅助文件来补充分析。

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-status-labels.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-status-labels.ts</path>
<type>file</type>
<content>
1: export type VisionStatusLocale = 'zh-CN' | 'en'
2:
3: const FIELD_LABELS: Record<string, Record<VisionStatusLocale, string>> = {
4:   cameraState: { 'zh-CN': '摄像头', 'en': 'Camera' },
5:   facePresence: { 'zh-CN': '主体状态', 'en': 'Subject' },
6:   faceDirection: { 'zh-CN': '主体方向', 'en': 'Direction' },
7:   faceGate: { 'zh-CN': '人脸门控', 'en': 'Face gate' },
8:   matchStatus: { 'zh-CN': '匹配状态', 'en': 'Match status' },
9:   interactiveFeedback: { 'zh-CN': '反馈权限', 'en': 'Feedback gate' },
10:   feedbackIntensity: { 'zh-CN': '反馈强度', 'en': 'Feedback intensity' },
11:   latestBubble: { 'zh-CN': '最新气泡', 'en': 'Latest bubble' },
12:   faceCenter: { 'zh-CN': '主体中心', 'en': 'Face center' },
13:   subjectPosition: { 'zh-CN': '当前主体位置', 'en': 'Subject position' },
14:   stableSubjectPosition: { 'zh-CN': '稳定主体位置', 'en': 'Stable subject position' },
15:   subjectResponseState: { 'zh-CN': '位置反馈状态', 'en': 'Subject response state' },
16:   petSubjectResponseState: { 'zh-CN': 'Rin 反馈状态', 'en': 'Rin response state' },
17:   subjectResponseGate: { 'zh-CN': '位置反馈权限', 'en': 'Subject response gate' },
18:   lastFeedbackMessage: { 'zh-CN': '最近反馈文案', 'en': 'Last feedback message' },
19:   lastSubjectResponseEvent: { 'zh-CN': '最近位置事件', 'en': 'Last subject event' },
20:   faceMotionSignals: { 'zh-CN': '面部动作信号', 'en': 'Face motion signals' },
21:   currentSignal: { 'zh-CN': '当前信号', 'en': 'Current signal' },
22:   expressionSignal: { 'zh-CN': '面部动作信号', 'en': 'Expression signal' },
23:   stableExpressionSignal: { 'zh-CN': '稳定信号', 'en': 'Stable signal' },
24:   confidence: { 'zh-CN': '置信度', 'en': 'Confidence' },
25:   reason: { 'zh-CN': '原因', 'en': 'Reason' },
26:   source: { 'zh-CN': '来源', 'en': 'Source' },
27:   cooldown: { 'zh-CN': '冷却', 'en': 'Cooldown' },
28: }
29:
30: const VALUE_LABELS: Record<string, Record<VisionStatusLocale, string>> = {
31:   active: { 'zh-CN': '运行中', 'en': 'Active' },
32:   running: { 'zh-CN': '运行中', 'en': 'Running' },
33:   off: { 'zh-CN': '未开启', 'en': 'Off' },
34:   loading: { 'zh-CN': '加载中', 'en': 'Loading' },
35:   error: { 'zh-CN': '异常', 'en': 'Error' },
36:   present: { 'zh-CN': '已检测到', 'en': 'Present' },
37:   absent: { 'zh-CN': '未检测到主体', 'en': 'Absent' },
38:   unknown: { 'zh-CN': '未知', 'en': 'Unknown' },
39:   left: { 'zh-CN': '左侧', 'en': 'Left' },
40:   right: { 'zh-CN': '右侧', 'en': 'Right' },
41:   up: { 'zh-CN': '上方', 'en': 'Up' },
42:   down: { 'zh-CN': '下方', 'en': 'Down' },
43:   center: { 'zh-CN': '居中', 'en': 'Centered' },
44:   locked: { 'zh-CN': '已锁定', 'en': 'Locked' },
45:   gated: { 'zh-CN': '已拦截', 'en': 'Gated' },
46:   enabled: { 'zh-CN': '已允许', 'en': 'Enabled' },
47:   disabled: { 'zh-CN': '未启用', 'en': 'Disabled' },
48:   matched: { 'zh-CN': '已匹配', 'en': 'Matched' },
49:   unmatched: { 'zh-CN': '未匹配', 'en': 'Unmatched' },
50:   no_face: { 'zh-CN': '未检测到人脸', 'en': 'No face' },
51:   multiple_faces: { 'zh-CN': '多人入镜', 'en': 'Multiple faces' },
52:   uncertain: { 'zh-CN': '不稳定', 'en': 'Uncertain' },
53:   low_confidence: { 'zh-CN': '置信度较低', 'en': 'Low confidence' },
54:   not_enrolled: { 'zh-CN': '未录入', 'en': 'Not enrolled' },
55:   enrolling: { 'zh-CN': '录入中', 'en': 'Enrolling' },
56:   enrolled: { 'zh-CN': '已录入', 'en': 'Enrolled' },
57:   matching: { 'zh-CN': '匹配中', 'en': 'Matching' },
58:   prompt: { 'zh-CN': '等待授权', 'en': 'Prompt' },
59:   granted: { 'zh-CN': '已授权', 'en': 'Granted' },
60:   denied: { 'zh-CN': '已拒绝', 'en': 'Denied' },
61:   unsupported: { 'zh-CN': '不支持', 'en': 'Unsupported' },
62:   ready: { 'zh-CN': '已就绪', 'en': 'Ready' },
63:   failed: { 'zh-CN': '失败', 'en': 'Failed' },
64:   fallback: { 'zh-CN': '降级模式', 'en': 'Fallback' },
65:   warming: { 'zh-CN': '预热中', 'en': 'Warming' },
66:   partial_ready: { 'zh-CN': '部分就绪', 'en': 'Partially ready' },
67:   resetting: { 'zh-CN': '重置中', 'en': 'Resetting' },
68:   allowed: { 'zh-CN': '已允许', 'en': 'Allowed' },
69:   none: { 'zh-CN': '无', 'en': 'None' },
70:   idle: { 'zh-CN': '空闲', 'en': 'Idle' },
71:   following_left: { 'zh-CN': '跟随左侧', 'en': 'Following left' },
72:   following_right: { 'zh-CN': '跟随右侧', 'en': 'Following right' },
73:   looking_up: { 'zh-CN': '看向上方', 'en': 'Looking up' },
74:   looking_down: { 'zh-CN': '看向下方', 'en': 'Looking down' },
75:   centered: { 'zh-CN': '回到中心', 'en': 'Centered' },
76:   minimal: { 'zh-CN': '克制', 'en': 'Minimal' },
77:   balanced: { 'zh-CN': '平衡', 'en': 'Balanced' },
78:   expressive: { 'zh-CN': '活跃', 'en': 'Expressive' },
79:   on: { 'zh-CN': '开启', 'en': 'On' },
80:   smile_like_signal: { 'zh-CN': '类微笑信号', 'en': 'Smile-like signal' },
81:   stable_face_signal: { 'zh-CN': '稳定面部信号', 'en': 'Stable face signal' },
82:   looking_away_signal: { 'zh-CN': '偏离中心信号', 'en': 'Off-center signal' },
83:   unclear_face_signal: { 'zh-CN': '面部信号不清晰', 'en': 'Unclear face signal' },
84:   blendshape: { 'zh-CN': 'Blendshape', 'en': 'Blendshape' },
85:   position: { 'zh-CN': '位置推断', 'en': 'Position' },
86:   quality: { 'zh-CN': '质量评估', 'en': 'Quality' },
87:   yes: { 'zh-CN': '是', 'en': 'Yes' },
88:   no: { 'zh-CN': '否', 'en': 'No' },
89: }
90:
91: /**
92:  * Normalizes locale for vision status formatting.
93:  *
94:  * Use when:
95:  * - UI needs deterministic locale fallback for local vision diagnostics labels.
96:  *
97:  * Expects:
98:  * - Any runtime locale-like string, including null/undefined.
99:  *
100:  * Returns:
101:  * - `zh-CN` or `en` with `zh-CN` as default fallback.
102:  */
103: export function normalizeVisionStatusLocale(locale?: string | null): VisionStatusLocale {
104:   if (locale === 'en')
105:     return 'en'
106:   return 'zh-CN'
107: }
108:
109: /**
110:  * Formats a field label used by vision diagnostics panels.
111:  *
112:  * Use when:
113:  * - Rendering user-facing field names such as camera state or gate status.
114:  *
115:  * Expects:
116:  * - Stable key names used by the view layer.
117:  *
118:  * Returns:
119:  * - Localized label when known, otherwise the original key.
120:  */
121: export function formatVisionFieldLabel(key: string, locale: VisionStatusLocale = 'zh-CN') {
122:   const field = FIELD_LABELS[key]
123:   return field?.[locale] ?? key
124: }
125:
126: /**
127:  * Formats a status value into localized plain text.
128:  *
129:  * Use when:
130:  * - Rendering vision state values in user-facing diagnostics.
131:  *
132:  * Expects:
133:  * - String-like status values from composables.
134:  *
135:  * Returns:
136:  * - Localized value label when known; otherwise the raw value.
137:  */
138: export function formatVisionStatusLabel(
139:   key: string,
140:   value: string | null | undefined,
141:   locale: VisionStatusLocale = 'zh-CN',
142: ) {
143:   if (value === null || value === undefined || String(value).trim().length === 0) {
144:     return locale === 'zh-CN' ? '未知' : 'Unknown'
145:   }
146:
147:   const normalized = String(value)
148:   const mappedValue = VALUE_LABELS[normalized]?.[locale] ?? normalized
149:   return `${formatVisionFieldLabel(key, locale)}：${mappedValue}`
150: }
151:
152: /**
153:  * Formats face presence state value.
154:  *
155:  * Use when:
156:  * - Rendering current face presence for end users.
157:  *
158:  * Expects:
159:  * - `present | absent | unknown` like values.
160:  *
161:  * Returns:
162:  * - Localized presence value label.
163:  */
164: export function formatFacePresence(value: string, locale: VisionStatusLocale = 'zh-CN') {
165:   return VALUE_LABELS[value]?.[locale] ?? value
166: }
167:
168: /**
169:  * Formats face direction value.
170:  *
171:  * Use when:
172:  * - Rendering directional cues from face center.
173:  *
174:  * Expects:
175:  * - Direction-like state value.
176:  *
177:  * Returns:
178:  * - Localized direction label.
179:  */
180: export function formatFaceDirection(value: string, locale: VisionStatusLocale = 'zh-CN') {
181:   return VALUE_LABELS[value]?.[locale] ?? value
182: }
183:
184: /**
185:  * Formats gate state value.
186:  *
187:  * Use when:
188:  * - Rendering gate lock/allow statuses.
189:  *
190:  * Expects:
191:  * - Gate state-like string.
192:  *
193:  * Returns:
194:  * - Localized gate status label.
195:  */
196: export function formatGateStatus(value: string, locale: VisionStatusLocale = 'zh-CN') {
197:   return VALUE_LABELS[value]?.[locale] ?? value
198: }
199:
200: /**
201:  * Formats face-gate match status value.
202:  *
203:  * Use when:
204:  * - Rendering match/no-face/multiple-faces statuses.
205:  *
206:  * Expects:
207:  * - Profile status-like string.
208:  *
209:  * Returns:
210:  * - Localized match status label.
211:  */
212: export function formatMatchStatus(value: string, locale: VisionStatusLocale = 'zh-CN') {
213:   return VALUE_LABELS[value]?.[locale] ?? value
214: }
215:
216: /**
217:  * Formats feedback intensity level.
218:  *
219:  * Use when:
220:  * - Rendering feedback intensity controls and diagnostics.
221:  *
222:  * Expects:
223:  * - `minimal | balanced | expressive`.
224:  *
225:  * Returns:
226:  * - Localized intensity label.
227:  */
228: export function formatFeedbackIntensity(value: string, locale: VisionStatusLocale = 'zh-CN') {
229:   return VALUE_LABELS[value]?.[locale] ?? value
230: }
231:
232: /**
233:  * Formats expression signal value.
234:  *
235:  * Use when:
236:  * - Rendering local face motion signal summaries.
237:  *
238:  * Expects:
239:  * - Expression signal enum-like value.
240:  *
241:  * Returns:
242:  * - Localized expression signal label.
243:  */
244: export function formatExpressionSignal(value: string, locale: VisionStatusLocale = 'zh-CN') {
245:   return VALUE_LABELS[value]?.[locale] ?? value
246: }
247:
248: /**
249:  * Formats subject response state.
250:  *
251:  * Use when:
252:  * - Rendering subject-position response state values.
253:  *
254:  * Expects:
255:  * - Subject response state-like value.
256:  *
257:  * Returns:
258:  * - Localized subject response state label.
259:  */
260: export function formatSubjectResponseState(value: string, locale: VisionStatusLocale = 'zh-CN') {
261:   return VALUE_LABELS[value]?.[locale] ?? value
262: }
263:
264: /**
265:  * Formats generic status value.
266:  *
267:  * Use when:
268:  * - A specific formatter is not available.
269:  *
270:  * Expects:
271:  * - Any status-like string value.
272:  *
273:  * Returns:
274:  * - Localized value when known; raw value otherwise.
275:  */
276: export function formatVisionStatusValue(value: string, locale: VisionStatusLocale = 'zh-CN') {
277:   return VALUE_LABELS[value]?.[locale] ?? value
278: }

(End of file - total 278 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-feedback-messages.ts</path>
<type>file</type>
<content>
1: /**
2:  * Feedback intensity controls how expressive local vision feedback should be.
3:  */
4: export type VisionFeedbackIntensity = 'minimal' | 'balanced' | 'expressive'
5:
6: /**
7:  * Feedback level controls how strong a selected template should feel.
8:  */
9: export type VisionFeedbackLevel = 'subtle' | 'normal' | 'strong'
10:
11: /**
12:  * Channels describe where a selected template can be surfaced.
13:  */
14: export type VisionFeedbackChannel = 'ui' | 'toast' | 'bubble' | 'motion'
15:
16: /**
17:  * Locale used by local vision feedback templates.
18:  */
19: export type VisionFeedbackLocale = 'en' | 'zh-CN'
20:
21: /**
22:  * Template variant marker for local A/B style experiments.
23:  */
24: export type VisionFeedbackVariant = 'default' | 'a' | 'b'
25:
26: /**
27:  * Locale-specific text payload.
28:  */
29: export interface VisionFeedbackTextVariant {
30:   text: string
31:   namedText?: string
32: }
33:
34: /**
35:  * Base vision feedback event types emitted by the interaction pipeline.
36:  */
37: export type VisionFeedbackBaseEventType
38:   = | 'subject_position_left'
39:     | 'subject_position_right'
40:     | 'subject_position_up'
41:     | 'subject_position_down'
42:     | 'subject_position_center'
43:     | 'subject_returned'
44:     | 'subject_absent'
45:     | 'subject_gated'
46:     | 'subject_matched'
47:     | 'subject_uncertain'
48:     | 'expression_smile_like'
49:     | 'expression_stable_face'
50:     | 'expression_looking_away'
51:     | 'expression_unclear'
52:     | 'subject_dwelled_left'
53:     | 'subject_dwelled_right'
54:     | 'subject_dwelled_center'
55:
56: /**
57:  * Transition-aware feedback event types used for smoother state changes.
58:  */
59: export type VisionFeedbackTransitionEventType
60:   = | 'transition_absent_to_returned'
61:     | 'transition_uncertain_to_matched'
62:     | 'transition_gated_to_matched'
63:     | 'transition_multiple_faces_to_matched'
64:     | 'transition_matched_to_absent'
65:     | 'transition_matched_to_uncertain'
66:
67: /**
68:  * Full event type surface supported by template selection.
69:  */
70: export type VisionFeedbackEventType = VisionFeedbackBaseEventType | VisionFeedbackTransitionEventType
71:
72: /**
73:  * Backward-compatible alias for existing call sites.
74:  */
75: export type VisionFeedbackMessageTemplateType = VisionFeedbackEventType
76:
77: /**
78:  * Structured local feedback template for v2 selector logic.
79:  */
80: export interface VisionFeedbackTemplate {
81:   /** Unique identifier used for strict de-duplication and diagnostics. */
82:   id: string
83:   /** Default text used when no display name is available. */
84:   text: string
85:   /** Optional name-aware variant, using `{name}` placeholder. */
86:   namedText?: string
87:   /** Optional locale-specific overrides. */
88:   localeText?: Partial<Record<VisionFeedbackLocale, VisionFeedbackTextVariant>>
89:   /** Optional template variant for lightweight A/B testing. */
90:   variant?: VisionFeedbackVariant
91:   /** Feedback intensity tiers that are allowed to use this template. */
92:   intensities: VisionFeedbackIntensity[]
93:   /** Template strength level. */
94:   level: VisionFeedbackLevel
95:   /** Supported render channels for this template. */
96:   channels: VisionFeedbackChannel[]
97:   /** Optional per-template cooldown override. */
98:   cooldownMs?: number
99:   /** Optional tags for future extension/filtering. */
100:   tags?: string[]
101: }
102:
103: /**
104:  * Snapshot used by transition resolver.
105:  */
106: export interface VisionFeedbackTransitionSnapshot {
107:   presence?: 'present' | 'absent' | 'unknown'
108:   gateState?: 'disabled' | 'enabled' | 'gated' | 'locked' | 'unknown'
109:   profileStatus?:
110:     | 'not_enrolled'
111:     | 'enrolling'
112:     | 'enrolled'
113:     | 'matching'
114:     | 'matched'
115:     | 'unmatched'
116:     | 'uncertain'
117:     | 'multiple_faces'
118:     | 'no_face'
119:     | 'unknown'
120: }
121:
122: export interface SelectVisionFeedbackMessageOptions {
123:   intensity?: VisionFeedbackIntensity
124:   displayName?: string
125:   previousText?: string | null
126:   previousTemplateId?: string | null
127:   random?: () => number
128:   preferredLevel?: VisionFeedbackLevel
129:   allowedChannels?: VisionFeedbackChannel[]
130:   locale?: VisionFeedbackLocale
131:   variant?: VisionFeedbackVariant
132:   bubbleAllowed?: boolean
133: }
134:
135: export interface SelectedVisionFeedbackMessage {
136:   text: string
137:   level: VisionFeedbackLevel
138:   channels: VisionFeedbackChannel[]
139:   cooldownMs: number
140:   eventType: VisionFeedbackEventType
141:   templateId: string
142:   locale: VisionFeedbackLocale
143:   variant: VisionFeedbackVariant
144:   selectedTextSource: 'locale' | 'default'
145:   shouldShowBubble: boolean
146: }
147:
148: /**
149:  * Legacy selection options kept for backward compatibility.
150:  */
151: export interface PickVisionFeedbackMessageOptions {
152:   displayName?: string
153:   previousMessage?: string | null
154:   random?: () => number
155: }
156:
157: const DEFAULT_RANDOM = Math.random
158: const MAX_RANDOM = 0.999_999_999
159:
160: const FEEDBACK_LEVELS_BY_INTENSITY: Record<VisionFeedbackIntensity, VisionFeedbackLevel[]> = {
161:   minimal: ['subtle'],
162:   balanced: ['normal', 'subtle'],
163:   expressive: ['strong', 'normal', 'subtle'],
164: }
165:
166: const FALLBACK_TEMPLATE: VisionFeedbackTemplate = {
167:   id: 'fallback-safe',
168:   text: 'Feedback updated.',
169:   namedText: '{name}, feedback updated.',
170:   variant: 'default',
171:   intensities: ['minimal', 'balanced', 'expressive'],
172:   level: 'subtle',
173:   channels: ['ui'],
174:   cooldownMs: 5_000,
175:   tags: ['fallback'],
176: }
177:
178: const EVENT_DEFAULT_COOLDOWN_MS: Record<VisionFeedbackEventType, number> = {
179:   subject_position_left: 5_000,
180:   subject_position_right: 5_000,
181:   subject_position_up: 5_000,
182:   subject_position_down: 5_000,
183:   subject_position_center: 5_000,
184:   subject_returned: 10_000,
185:   subject_absent: 8_000,
186:   subject_gated: 5_000,
187:   subject_matched: 10_000,
188:   subject_uncertain: 8_000,
189:   expression_smile_like: 10_000,
190:   expression_stable_face: 12_000,
191:   expression_looking_away: 15_000,
192:   expression_unclear: 9_000,
193:   subject_dwelled_left: 14_000,
194:   subject_dwelled_right: 14_000,
195:   subject_dwelled_center: 14_000,
196:   transition_absent_to_returned: 10_000,
197:   transition_uncertain_to_matched: 10_000,
198:   transition_gated_to_matched: 10_000,
199:   transition_multiple_faces_to_matched: 10_000,
200:   transition_matched_to_absent: 8_000,
201:   transition_matched_to_uncertain: 8_000,
202: }
203:
204: const MESSAGE_TEMPLATES: Record<VisionFeedbackEventType, VisionFeedbackTemplate[]> = {
205:   subject_position_left: [
206:     { id: 'left-min-1', text: 'Left side noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
207:     { id: 'left-bal-1', text: 'I noticed you moved left.', namedText: '{name}, you moved left.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
208:     { id: 'left-bal-2', text: 'You shifted to the left.', namedText: '{name}, you shifted left.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
209:     { id: 'left-bal-3', text: 'Left position confirmed.', namedText: '{name}, left position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
210:     { id: 'left-exp-1', text: 'Nice move to the left.', namedText: '{name}, nice move to the left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
211:     { id: 'left-exp-2', text: 'You are leaning left now.', namedText: '{name}, you are leaning left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
212:     { id: 'left-subtle-2', text: 'Left side detected.', namedText: '{name}, left side detected.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
213:   ],
214:   subject_position_right: [
215:     { id: 'right-min-1', text: 'Right side noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
216:     { id: 'right-bal-1', text: 'I noticed you moved right.', namedText: '{name}, you moved right.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
217:     { id: 'right-bal-2', text: 'You shifted to the right.', namedText: '{name}, you shifted right.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
218:     { id: 'right-bal-3', text: 'Right position confirmed.', namedText: '{name}, right position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
219:     { id: 'right-exp-1', text: 'Nice move to the right.', namedText: '{name}, nice move to the right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
220:     { id: 'right-exp-2', text: 'You are leaning right now.', namedText: '{name}, you are leaning right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
221:     { id: 'right-subtle-2', text: 'Right side detected.', namedText: '{name}, right side detected.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
222:   ],
223:   subject_position_up: [
224:     { id: 'up-min-1', text: 'Upper position noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
225:     { id: 'up-bal-1', text: 'Looking up?', namedText: '{name}, looking up?', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
226:     { id: 'up-bal-2', text: 'You moved higher in frame.', namedText: '{name}, you moved higher in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
227:     { id: 'up-exp-1', text: 'Upper position looks steady.', namedText: '{name}, upper position looks steady.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
228:     { id: 'up-subtle-2', text: 'Head moved upward.', namedText: '{name}, your head moved upward.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
229:   ],
230:   subject_position_down: [
231:     { id: 'down-min-1', text: 'Lower position noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
232:     { id: 'down-bal-1', text: 'Looking down?', namedText: '{name}, looking down?', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
233:     { id: 'down-bal-2', text: 'You moved lower in frame.', namedText: '{name}, you moved lower in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
234:     { id: 'down-exp-1', text: 'Lower position looks steady.', namedText: '{name}, lower position looks steady.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
235:     { id: 'down-subtle-2', text: 'Head moved downward.', namedText: '{name}, your head moved downward.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
236:   ],
237:   subject_position_center: [
238:     { id: 'center-min-1', text: 'Centered.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
239:     {
240:       id: 'center-bal-1',
241:       text: 'Back to center.',
242:       namedText: '{name}, back to center.',
243:       localeText: {
244:         'zh-CN': {
245:           text: '回到中心了。',
246:           namedText: '{name}，你回到中心了。',
247:         },
248:       },
249:       intensities: ['balanced', 'expressive'],
250:       level: 'normal',
251:       channels: ['ui', 'toast'],
252:       tags: ['direction'],
253:     },
254:     {
255:       id: 'center-bal-2',
256:       text: 'Centered again.',
257:       namedText: '{name}, centered again.',
258:       localeText: {
259:         'zh-CN': {
260:           text: '又回到中心位置。',
261:           namedText: '{name}，你又回到中心位置。',
262:         },
263:       },
264:       intensities: ['balanced', 'expressive'],
265:       level: 'normal',
266:       channels: ['ui', 'toast'],
267:       tags: ['direction'],
268:       variant: 'a',
269:     },
270:     { id: 'center-bal-3', text: 'Center position confirmed.', namedText: '{name}, center position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
271:     { id: 'center-exp-1', text: 'Nice, back in the center.', namedText: '{name}, nice, back in the center.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
272:     { id: 'center-exp-2', text: 'Center lock looks clean.', namedText: '{name}, center lock looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
273:     { id: 'center-subtle-2', text: 'You are centered now.', namedText: '{name}, you are centered now.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
274:   ],
275:   subject_returned: [
276:     { id: 'returned-min-1', text: 'You are back.', namedText: '{name}, you are back.', intensities: ['minimal'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
277:     { id: 'returned-bal-1', text: 'Welcome back.', namedText: 'Welcome back, {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
278:     { id: 'returned-bal-2', text: 'Good to see you again.', namedText: 'Good to see you again, {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
279:     { id: 'returned-bal-3', text: 'You are back in frame.', namedText: '{name}, you are back in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
280:     { id: 'returned-bal-4', text: 'Return detected.', namedText: '{name}, return detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
281:     { id: 'returned-exp-1', text: 'Nice return, welcome back.', namedText: 'Nice return, {name}.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['presence'] },
282:     { id: 'returned-exp-2', text: 'You are right back on track.', namedText: '{name}, you are right back on track.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['presence'] },
283:     { id: 'returned-exp-3', text: 'Welcome back to center flow.', namedText: '{name}, welcome back to center flow.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['presence'] },
284:     { id: 'returned-subtle-2', text: 'Presence restored.', namedText: '{name}, presence restored.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['presence'] },
285:   ],
286:   subject_absent: [
287:     { id: 'absent-min-1', text: 'Subject absent.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['presence'] },
288:     { id: 'absent-bal-1', text: 'You stepped away.', namedText: '{name}, you stepped away.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
289:     { id: 'absent-bal-2', text: 'Subject left the frame.', namedText: '{name} left the frame.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
290:     { id: 'absent-bal-3', text: 'No subject in frame now.', namedText: 'No subject in frame now, {name}.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
291:     { id: 'absent-exp-1', text: 'I will wait here.', namedText: 'I will wait here, {name}.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
292:     { id: 'absent-exp-2', text: 'Frame is clear for now.', namedText: '{name}, frame is clear for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
293:   ],
294:   subject_gated: [
295:     {
296:       id: 'gated-min-1',
297:       text: 'Feedback is gated.',
298:       localeText: {
299:         'zh-CN': {
300:           text: '反馈暂时被门控限制。',
301:         },
302:       },
303:       intensities: ['minimal'],
304:       level: 'subtle',
305:       channels: ['ui'],
306:       tags: ['gate'],
307:     },
308:     {
309:       id: 'gated-bal-1',
310:       text: 'Detected, but feedback is gated.',
311:       localeText: {
312:         'zh-CN': {
313:           text: '检测到了，但反馈被门控拦截。',
314:         },
315:       },
316:       intensities: ['balanced', 'expressive'],
317:       level: 'subtle',
318:       channels: ['ui', 'toast'],
319:       tags: ['gate'],
320:     },
321:     { id: 'gated-bal-2', text: 'Position detected, gate is blocking.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
322:     { id: 'gated-bal-3', text: 'Gate lock: no active feedback.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
323:     { id: 'gated-bal-4', text: 'Feedback paused by face gate.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
324:     { id: 'gated-exp-1', text: 'Gate is active, waiting for match.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
325:     {
326:       id: 'gated-exp-2',
327:       text: 'Match needed before stronger feedback.',
328:       localeText: {
329:         'zh-CN': {
330:           text: '需要先匹配成功，才能触发更强反馈。',
331:         },
332:       },
333:       intensities: ['expressive'],
334:       level: 'normal',
335:       channels: ['ui', 'toast'],
336:       tags: ['gate'],
337:       variant: 'b',
338:     },
339:   ],
340:   subject_matched: [
341:     {
342:       id: 'matched-min-1',
343:       text: 'Matched subject confirmed.',
344:       namedText: 'Matched subject confirmed, {name}.',
345:       localeText: {
346:         'zh-CN': {
347:           text: '已确认匹配主体。',
348:           namedText: '已确认匹配主体，{name}。',
349:         },
350:       },
351:       intensities: ['minimal', 'balanced', 'expressive'],
352:       level: 'subtle',
353:       channels: ['ui', 'toast'],
354:       tags: ['gate'],
355:     },
356:     { id: 'matched-bal-1', text: 'Face gate matched.', namedText: '{name} matched by face gate.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
357:     { id: 'matched-bal-2', text: 'Identity match completed.', namedText: 'Identity match completed for {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
358:     { id: 'matched-bal-3', text: 'You are verified for feedback.', namedText: '{name}, you are verified for feedback.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
359:     {
360:       id: 'matched-bal-4',
361:       text: 'Gate is open for you now.',
362:       namedText: '{name}, gate is open for you now.',
363:       localeText: {
364:         'zh-CN': {
365:           text: '门控已为你放行。',
366:           namedText: '{name}，门控已为你放行。',
367:         },
368:       },
369:       intensities: ['balanced', 'expressive'],
370:       level: 'normal',
371:       channels: ['ui', 'toast'],
372:       tags: ['gate'],
373:       variant: 'a',
374:     },
375:     { id: 'matched-exp-1', text: 'Great, match is stable now.', namedText: 'Great, {name}, match is stable now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['gate'] },
376:     {
377:       id: 'matched-exp-2',
378:       text: 'Match locked, feedback unlocked.',
379:       namedText: '{name}, match locked, feedback unlocked.',
380:       intensities: ['expressive'],
381:       level: 'strong',
382:       channels: ['ui', 'toast', 'motion', 'bubble'],
383:       tags: ['gate'],
384:       variant: 'a',
385:     },
386:     { id: 'matched-exp-3', text: 'You are fully matched.', namedText: '{name}, you are fully matched.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['gate'] },
387:     { id: 'matched-subtle-2', text: 'Verified subject active.', namedText: '{name}, verified subject active.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['gate'] },
388:   ],
389:   subject_uncertain: [
390:     {
391:       id: 'uncertain-min-1',
392:       text: 'Match uncertain.',
393:       localeText: {
394:         'zh-CN': {
395:           text: '当前匹配不够稳定。',
396:         },
397:       },
398:       intensities: ['minimal'],
399:       level: 'subtle',
400:       channels: ['ui'],
401:       tags: ['gate'],
402:     },
403:     { id: 'uncertain-bal-1', text: 'Identity uncertain right now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
404:     { id: 'uncertain-bal-2', text: 'Match is uncertain for now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
405:     { id: 'uncertain-bal-3', text: 'I need a steadier face sample.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
406:     {
407:       id: 'uncertain-bal-4',
408:       text: 'Uncertain match, waiting for stability.',
409:       localeText: {
410:         'zh-CN': {
411:           text: '匹配暂不确定，正在等待更稳定画面。',
412:         },
413:       },
414:       intensities: ['balanced', 'expressive'],
415:       level: 'subtle',
416:       channels: ['ui', 'toast'],
417:       tags: ['gate'],
418:       variant: 'b',
419:     },
420:     { id: 'uncertain-exp-1', text: 'Match drifted, trying to recover.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
421:     { id: 'uncertain-exp-2', text: 'Still checking match quality.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
422:   ],
423:   expression_smile_like: [
424:     {
425:       id: 'expr-smile-min-1',
426:       text: 'Smile-like signal noted.',
427:       intensities: ['minimal'],
428:       level: 'subtle',
429:       channels: ['ui'],
430:       tags: ['expression', 'smile_like'],
431:     },
432:     {
433:       id: 'expr-smile-bal-1',
434:       text: 'I caught a smile-like signal.',
435:       namedText: '{name}, I caught a smile-like signal.',
436:       localeText: {
437:         'zh-CN': {
438:           text: '检测到一个微笑样信号。',
439:           namedText: '{name}，检测到一个微笑样信号。',
440:         },
441:       },
442:       intensities: ['balanced', 'expressive'],
443:       level: 'normal',
444:       channels: ['ui', 'toast', 'bubble'],
445:       tags: ['expression', 'smile_like'],
446:       cooldownMs: 10_000,
447:     },
448:     { id: 'expr-smile-bal-2', text: 'Smile-like motion is visible.', namedText: '{name}, smile-like motion is visible.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
449:     { id: 'expr-smile-exp-1', text: 'Nice smile-like cue in frame.', namedText: '{name}, nice smile-like cue in frame.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
450:     { id: 'expr-smile-exp-2', text: 'Smile-like signal looks clear.', namedText: '{name}, smile-like signal looks clear.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
451:   ],
452:   expression_stable_face: [
453:     {
454:       id: 'expr-stable-min-1',
455:       text: 'Stable face signal recorded.',
456:       intensities: ['minimal'],
457:       level: 'subtle',
458:       channels: ['ui'],
459:       tags: ['expression', 'stable_face'],
460:       cooldownMs: 12_000,
461:     },
462:     {
463:       id: 'expr-stable-bal-1',
464:       text: 'Your face looks steady in frame.',
465:       namedText: '{name}, your face looks steady in frame.',
466:       localeText: {
467:         'zh-CN': {
468:           text: '你的画面内人脸很稳定。',
469:           namedText: '{name}，你的画面内人脸很稳定。',
470:         },
471:       },
472:       intensities: ['balanced', 'expressive'],
473:       level: 'normal',
474:       channels: ['ui', 'toast', 'bubble'],
475:       tags: ['expression', 'stable_face'],
476:       cooldownMs: 12_000,
477:     },
478:     { id: 'expr-stable-bal-2', text: 'Stable face signal confirmed.', namedText: '{name}, stable face signal confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
479:     { id: 'expr-stable-exp-1', text: 'Frame stability looks clean.', namedText: '{name}, frame stability looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
480:     { id: 'expr-stable-exp-2', text: 'Stable face cue is strong now.', namedText: '{name}, stable face cue is strong now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
481:   ],
482:   expression_looking_away: [
483:     {
484:       id: 'expr-away-min-1',
485:       text: 'Slightly off center.',
486:       localeText: {
487:         'zh-CN': {
488:           text: '你暂时偏离了画面中心。',
489:         },
490:       },
491:       intensities: ['minimal'],
492:       level: 'subtle',
493:       channels: ['ui'],
494:       tags: ['expression', 'looking_away'],
495:       cooldownMs: 15_000,
496:     },
497:     {
498:       id: 'expr-away-bal-1',
499:       text: 'I noticed you moved away from center.',
500:       namedText: '{name}, I noticed you moved away from center.',
501:       localeText: {
502:         'zh-CN': {
503:           text: '我看到你偏离了画面中心。',
504:           namedText: '{name}，我看到你偏离了画面中心。',
505:         },
506:       },
507:       intensities: ['balanced', 'expressive'],
508:       level: 'subtle',
509:       channels: ['ui', 'toast', 'bubble'],
510:       tags: ['expression', 'looking_away'],
511:       cooldownMs: 15_000,
512:     },
513:     {
514:       id: 'expr-away-bal-2',
515:       text: 'You are a little off center.',
516:       namedText: '{name}, you are a little off center.',
517:       localeText: {
518:         'zh-CN': {
519:           text: '你暂时不在画面中央，我会安静一点。',
520:           namedText: '{name}，你暂时不在画面中央，我会安静一点。',
521:         },
522:       },
523:       intensities: ['balanced', 'expressive'],
524:       level: 'subtle',
525:       channels: ['ui', 'toast'],
526:       tags: ['expression', 'looking_away'],
527:       cooldownMs: 15_000,
528:     },
529:     {
530:       id: 'expr-away-exp-1',
531:       text: 'The visual signal is not stable yet.',
532:       namedText: '{name}, the visual signal is not stable yet.',
533:       localeText: {
534:         'zh-CN': {
535:           text: '画面里的主体位置不太稳定。',
536:           namedText: '{name}，画面里的主体位置不太稳定。',
537:         },
538:       },
539:       intensities: ['expressive'],
540:       level: 'normal',
541:       channels: ['ui', 'toast', 'bubble', 'motion'],
542:       tags: ['expression', 'looking_away'],
543:       cooldownMs: 15_000,
544:     },
545:   ],
546:   expression_unclear: [
547:     {
548:       id: 'expr-unclear-min-1',
549:       text: 'Visual signal is unclear.',
550:       localeText: {
551:         'zh-CN': {
552:           text: '当前视觉信号不够清晰。',
553:         },
554:       },
555:       intensities: ['minimal', 'balanced', 'expressive'],
556:       level: 'subtle',
557:       channels: ['ui'],
558:       tags: ['expression', 'unclear'],
559:       cooldownMs: 9_000,
560:     },
561:     { id: 'expr-unclear-bal-1', text: 'The visual signal is unclear.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'bubble'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
562:     { id: 'expr-unclear-bal-2', text: 'Face motion signal is not stable yet.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
563:     { id: 'expr-unclear-exp-1', text: 'Signal quality dropped for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
564:   ],
565:   subject_dwelled_left: [
566:     { id: 'dwell-left-1', text: 'You stayed on the left side.', namedText: '{name}, you stayed on the left side.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
567:     { id: 'dwell-left-2', text: 'Left dwell detected.', namedText: '{name}, left dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
568:     { id: 'dwell-left-3', text: 'Still leaning left.', namedText: '{name}, still leaning left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
569:     { id: 'dwell-left-4', text: 'Holding left position.', namedText: '{name}, holding left position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
570:     { id: 'dwell-left-5', text: 'Left hold looks stable.', namedText: '{name}, left hold looks stable.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
571:   ],
572:   subject_dwelled_right: [
573:     { id: 'dwell-right-1', text: 'You stayed on the right side.', namedText: '{name}, you stayed on the right side.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
574:     { id: 'dwell-right-2', text: 'Right dwell detected.', namedText: '{name}, right dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
575:     { id: 'dwell-right-3', text: 'Still leaning right.', namedText: '{name}, still leaning right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
576:     { id: 'dwell-right-4', text: 'Holding right position.', namedText: '{name}, holding right position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
577:     { id: 'dwell-right-5', text: 'Right hold looks stable.', namedText: '{name}, right hold looks stable.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
578:   ],
579:   subject_dwelled_center: [
580:     { id: 'dwell-center-1', text: 'You held center steadily.', namedText: '{name}, you held center steadily.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
581:     { id: 'dwell-center-2', text: 'Center dwell detected.', namedText: '{name}, center dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
582:     { id: 'dwell-center-3', text: 'Stable centered position.', namedText: '{name}, stable centered position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
583:     { id: 'dwell-center-4', text: 'You stayed centered.', namedText: '{name}, you stayed centered.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
584:     { id: 'dwell-center-5', text: 'Center hold looks clean.', namedText: '{name}, center hold looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
585:   ],
586:   transition_absent_to_returned: [
587:     {
588:       id: 't-absent-returned-1',
589:       text: 'Welcome back from a short break.',
590:       namedText: 'Welcome back, {name}.',
591:       localeText: {
592:         'zh-CN': {
593:           text: '欢迎回来。',
594:           namedText: '欢迎回来，{name}。',
595:         },
596:       },
597:       intensities: ['minimal', 'balanced', 'expressive'],
598:       level: 'subtle',
599:       channels: ['ui', 'toast'],
600:       tags: ['transition', 'return'],
601:       variant: 'a',
602:     },
603:     { id: 't-absent-returned-2', text: 'You are back in view.', namedText: '{name}, you are back in view.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
604:     { id: 't-absent-returned-3', text: 'Return transition confirmed.', namedText: '{name}, return transition confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
605:     {
606:       id: 't-absent-returned-4',
607:       text: 'Frame picked you up again.',
608:       namedText: '{name}, frame picked you up again.',
609:       localeText: {
610:         'zh-CN': {
611:           text: '画面再次捕捉到你了。',
612:           namedText: '{name}，画面再次捕捉到你了。',
613:         },
614:       },
615:       intensities: ['balanced', 'expressive'],
616:       level: 'normal',
617:       channels: ['ui', 'toast'],
618:       tags: ['transition', 'return'],
619:       variant: 'b',
620:     },
621:     { id: 't-absent-returned-5', text: 'Nice return, tracking resumed.', namedText: '{name}, tracking resumed.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['transition', 'return'] },
622:     { id: 't-absent-returned-6', text: 'Back online for feedback.', namedText: '{name}, back online for feedback.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'return'] },
623:     { id: 't-absent-returned-7', text: 'Presence recovered smoothly.', namedText: '{name}, presence recovered smoothly.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
624:     { id: 't-absent-returned-8', text: 'You are back at center flow.', namedText: '{name}, you are back at center flow.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'return'] },
625:     { id: 't-absent-returned-9', text: 'Return transition complete.', namedText: '{name}, return transition complete.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
626:   ],
627:   transition_uncertain_to_matched: [
628:     { id: 't-uncertain-matched-1', text: 'Match recovered from uncertainty.', namedText: '{name}, match recovered from uncertainty.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
629:     { id: 't-uncertain-matched-2', text: 'Uncertain state cleared, now matched.', namedText: '{name}, uncertain state cleared.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
630:     { id: 't-uncertain-matched-3', text: 'Match is stable again.', namedText: '{name}, match is stable again.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
631:     { id: 't-uncertain-matched-4', text: 'Identity lock restored.', namedText: '{name}, identity lock restored.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
632:     { id: 't-uncertain-matched-5', text: 'Great, certainty is back.', namedText: '{name}, certainty is back.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'match'] },
633:     { id: 't-uncertain-matched-6', text: 'Transition to matched completed.', namedText: '{name}, transition to matched completed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
634:     { id: 't-uncertain-matched-7', text: 'You are matched again.', namedText: '{name}, you are matched again.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'match'] },
635:   ],
636:   transition_gated_to_matched: [
637:     { id: 't-gated-matched-1', text: 'Gate lifted, matched subject ready.', namedText: '{name}, gate lifted and matched.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
638:     { id: 't-gated-matched-2', text: 'Gated state resolved to matched.', namedText: '{name}, gated state resolved.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
639:     { id: 't-gated-matched-3', text: 'Face gate reopened for you.', namedText: '{name}, face gate reopened for you.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
640:     { id: 't-gated-matched-4', text: 'Match restored after gating.', namedText: '{name}, match restored after gating.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
641:     { id: 't-gated-matched-5', text: 'Great unlock, feedback can resume.', namedText: '{name}, feedback can resume now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'gate'] },
642:     { id: 't-gated-matched-6', text: 'Gate transition complete.', namedText: '{name}, gate transition complete.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
643:     { id: 't-gated-matched-7', text: 'You moved from gated to matched.', namedText: '{name}, now moving from gated to matched.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'gate'] },
644:   ],
645:   transition_multiple_faces_to_matched: [
646:     { id: 't-multi-matched-1', text: 'Single matched subject recovered.', namedText: '{name}, single matched subject recovered.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
647:     { id: 't-multi-matched-2', text: 'Multiple-face lock cleared.', namedText: '{name}, multiple-face lock cleared.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
648:     { id: 't-multi-matched-3', text: 'Now tracking one matched subject.', namedText: '{name}, now tracking one matched subject.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
649:     { id: 't-multi-matched-4', text: 'Crowd state resolved to matched.', namedText: '{name}, crowd state resolved to matched.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
650:     { id: 't-multi-matched-5', text: 'Nice, focus is back on you.', namedText: 'Nice, {name}, focus is back on you.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'multi'] },
651:     { id: 't-multi-matched-6', text: 'Multiple-face transition completed.', namedText: '{name}, multiple-face transition completed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
652:     { id: 't-multi-matched-7', text: 'Clear frame, matched subject active.', namedText: '{name}, clear frame and matched subject active.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'multi'] },
653:   ],
654:   transition_matched_to_absent: [
655:     { id: 't-matched-absent-1', text: 'Matched subject stepped away.', namedText: '{name}, you stepped away from frame.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
656:     { id: 't-matched-absent-2', text: 'Matched presence moved to absent.', namedText: '{name}, matched presence moved to absent.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
657:     { id: 't-matched-absent-3', text: 'Match paused because frame is clear.', namedText: '{name}, match paused because frame is clear.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
658:     { id: 't-matched-absent-4', text: 'Matched state dropped to absent.', namedText: '{name}, matched state dropped to absent.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
659:     { id: 't-matched-absent-5', text: 'I will wait for your return.', namedText: '{name}, I will wait for your return.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['transition', 'presence'] },
660:     { id: 't-matched-absent-6', text: 'Tracking paused for now.', namedText: '{name}, tracking paused for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
661:     { id: 't-matched-absent-7', text: 'Absent transition confirmed.', namedText: '{name}, absent transition confirmed.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
662:   ],
663:   transition_matched_to_uncertain: [
664:     { id: 't-matched-uncertain-1', text: 'Matched state turned uncertain.', namedText: '{name}, matched state turned uncertain.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
665:     { id: 't-matched-uncertain-2', text: 'Match confidence dropped a bit.', namedText: '{name}, match confidence dropped a bit.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
666:     { id: 't-matched-uncertain-3', text: 'Moving from matched to uncertain.', namedText: '{name}, moving from matched to uncertain.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
667:     { id: 't-matched-uncertain-4', text: 'Identity lock is unstable now.', namedText: '{name}, identity lock is unstable now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
668:     { id: 't-matched-uncertain-5', text: 'I am rechecking the match.', namedText: '{name}, I am rechecking the match.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
669:     { id: 't-matched-uncertain-6', text: 'Uncertain transition detected.', namedText: '{name}, uncertain transition detected.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
670:     { id: 't-matched-uncertain-7', text: 'Please hold steady for rematch.', namedText: '{name}, please hold steady for rematch.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
671:   ],
672: }
673:
674: function normalizeDisplayName(displayName?: string) {
675:   if (!displayName)
676:     return ''
677:   return displayName.trim().slice(0, 32)
678: }
679:
680: function normalizeLocale(locale?: VisionFeedbackLocale): VisionFeedbackLocale {
681:   if (locale === 'zh-CN')
682:     return 'zh-CN'
683:   return 'en'
684: }
685:
686: function normalizeVariant(variant?: VisionFeedbackVariant): VisionFeedbackVariant {
687:   if (variant === 'a' || variant === 'b')
688:     return variant
689:   return 'default'
690: }
691:
692: function normalizeRandomValue(randomValue: number) {
693:   if (!Number.isFinite(randomValue))
694:     return 0
695:   if (randomValue <= 0)
696:     return 0
697:   if (randomValue >= MAX_RANDOM)
698:     return MAX_RANDOM
699:   return randomValue
700: }
701:
702: function resolveTemplateVariant(template: VisionFeedbackTemplate): VisionFeedbackVariant {
703:   return template.variant ?? 'default'
704: }
705:
706: function resolveTemplateText(
707:   template: VisionFeedbackTemplate,
708:   locale: VisionFeedbackLocale,
709:   displayName: string,
710: ): { text: string, selectedTextSource: 'locale' | 'default' } {
711:   const localeVariant = template.localeText?.[locale]
712:   if (localeVariant && localeVariant.text.trim().length > 0) {
713:     if (displayName && localeVariant.namedText)
714:       return { text: localeVariant.namedText.replace('{name}', displayName), selectedTextSource: 'locale' }
715:     return { text: localeVariant.text, selectedTextSource: 'locale' }
716:   }
717:
718:   if (displayName && template.namedText)
719:     return { text: template.namedText.replace('{name}', displayName), selectedTextSource: 'default' }
720:   return { text: template.text, selectedTextSource: 'default' }
721: }
722:
723: function containsAllowedChannel(templateChannels: VisionFeedbackChannel[], allowedChannels: VisionFeedbackChannel[]) {
724:   if (allowedChannels.length === 0)
725:     return true
726:   return templateChannels.some(channel => allowedChannels.includes(channel))
727: }
728:
729: function normalizeRequestedLevel(
730:   intensity: VisionFeedbackIntensity,
731:   preferredLevel?: VisionFeedbackLevel,
732: ) {
733:   if (!preferredLevel)
734:     return null
735:   if (FEEDBACK_LEVELS_BY_INTENSITY[intensity].includes(preferredLevel))
736:     return preferredLevel
737:   if (preferredLevel === 'strong' && intensity === 'balanced')
738:     return 'normal' as const
739:   return 'subtle' as const
740: }
741:
742: function pickFromTemplates(
743:   templates: VisionFeedbackTemplate[],
744:   random: () => number,
745: ) {
746:   const randomValue = normalizeRandomValue(random())
747:   const index = Math.floor(randomValue * templates.length)
748:   return templates[index] ?? templates[0] ?? FALLBACK_TEMPLATE
749: }
750:
751: function resolveVariantCandidates(
752:   templates: VisionFeedbackTemplate[],
753:   requestedVariant: VisionFeedbackVariant,
754: ) {
755:   const defaultTemplates = templates.filter(template => resolveTemplateVariant(template) === 'default')
756:   if (requestedVariant === 'default')
757:     return [...defaultTemplates, ...templates.filter(template => resolveTemplateVariant(template) !== 'default')]
758:
759:   const preferredTemplates = templates.filter(template => resolveTemplateVariant(template) === requestedVariant)
760:   const remainingTemplates = templates.filter(template => resolveTemplateVariant(template) !== requestedVariant && resolveTemplateVariant(template) !== 'default')
761:   return [...preferredTemplates, ...defaultTemplates, ...remainingTemplates]
762: }
763:
764: function normalizeTransitionSnapshot(snapshot?: VisionFeedbackTransitionSnapshot | null) {
765:   return {
766:     presence: snapshot?.presence ?? 'unknown',
767:     gateState: snapshot?.gateState ?? 'unknown',
768:     profileStatus: snapshot?.profileStatus ?? 'unknown',
769:   } as const
770: }
771:
772: function isGatedLikeSnapshot(snapshot: ReturnType<typeof normalizeTransitionSnapshot>) {
773:   if (snapshot.gateState === 'gated' || snapshot.gateState === 'locked')
774:     return true
775:   return snapshot.profileStatus === 'unmatched' || snapshot.profileStatus === 'no_face'
776: }
777:
778: /**
779:  * Resolves transition-aware event type for contextual feedback.
780:  *
781:  * Use when:
782:  * - Feedback should prefer state transitions over single-frame event labels.
783:  *
784:  * Expects:
785:  * - `previousSnapshot` represents the prior stable feedback state.
786:  * - `currentSnapshot` represents the latest stable feedback state.
787:  *
788:  * Returns:
789:  * - Transition event type when a known state transition is detected,
790:  *   otherwise returns `baseEventType`.
791:  */
792: export function resolveVisionFeedbackTransition(
793:   previousSnapshot: VisionFeedbackTransitionSnapshot | null | undefined,
794:   currentSnapshot: VisionFeedbackTransitionSnapshot | null | undefined,
795:   baseEventType: VisionFeedbackBaseEventType,
796: ): VisionFeedbackEventType {
797:   const previous = normalizeTransitionSnapshot(previousSnapshot)
798:   const current = normalizeTransitionSnapshot(currentSnapshot)
799:
800:   if (baseEventType === 'subject_returned' && previous.presence === 'absent' && current.presence === 'present')
801:     return 'transition_absent_to_returned'
802:
803:   if (baseEventType === 'subject_matched' && previous.profileStatus === 'uncertain' && current.profileStatus === 'matched')
804:     return 'transition_uncertain_to_matched'
805:
806:   if (baseEventType === 'subject_matched' && previous.profileStatus === 'multiple_faces' && current.profileStatus === 'matched')
807:     return 'transition_multiple_faces_to_matched'
808:
809:   if (baseEventType === 'subject_matched' && isGatedLikeSnapshot(previous) && current.profileStatus === 'matched')
810:     return 'transition_gated_to_matched'
811:
812:   if (baseEventType === 'subject_absent' && previous.profileStatus === 'matched' && current.presence === 'absent')
813:     return 'transition_matched_to_absent'
814:
815:   if (baseEventType === 'subject_uncertain' && previous.profileStatus === 'matched' && current.profileStatus === 'uncertain')
816:     return 'transition_matched_to_uncertain'
817:
818:   return baseEventType
819: }
820:
821: /**
822:  * Selects a structured feedback template with intensity and transition awareness.
823:  *
824:  * Use when:
825:  * - You need deterministic, local-only feedback selection.
826:  * - Selection must respect intensity, level, channel, and de-duplication rules.
827:  *
828:  * Expects:
829:  * - `eventType` can be any runtime string; unknown values are safely handled.
830:  *
831:  * Returns:
832:  * - Selected structured payload for UI/toast/motion routing.
833:  */
834: export function selectVisionFeedbackMessage(
835:   eventType: VisionFeedbackEventType | string,
836:   options?: SelectVisionFeedbackMessageOptions,
837: ): SelectedVisionFeedbackMessage {
838:   const normalizedEventType = isKnownVisionFeedbackEventType(eventType)
839:     ? eventType
840:     : ('subject_uncertain' as const)
841:   const intensity = options?.intensity ?? 'balanced'
842:   const displayName = normalizeDisplayName(options?.displayName)
843:   const previousText = options?.previousText ?? null
844:   const previousTemplateId = options?.previousTemplateId ?? null
845:   const random = options?.random ?? DEFAULT_RANDOM
846:   const allowedChannels = options?.allowedChannels ?? []
847:   const requestedLocale = normalizeLocale(options?.locale)
848:   const requestedVariant = normalizeVariant(options?.variant)
849:   const bubbleAllowed = options?.bubbleAllowed !== false
850:   const requestedLevel = normalizeRequestedLevel(intensity, options?.preferredLevel)
851:   const availableLevels = FEEDBACK_LEVELS_BY_INTENSITY[intensity]
852:
853:   const templatesForEvent = MESSAGE_TEMPLATES[normalizedEventType] ?? []
854:
855:   const intensityCandidates = templatesForEvent.filter((template) => {
856:     if (!template.intensities.includes(intensity))
857:       return false
858:     return containsAllowedChannel(template.channels, allowedChannels)
859:   })
860:
861:   const levelCandidates = requestedLevel
862:     ? intensityCandidates.filter(template => template.level === requestedLevel)
863:     : []
864:
865:   const rankedCandidates = levelCandidates.length > 0
866:     ? levelCandidates
867:     : availableLevels.flatMap(level => intensityCandidates.filter(template => template.level === level))
868:
869:   const variantCandidates = resolveVariantCandidates(rankedCandidates, requestedVariant)
870:
871:   const nonRepeatingCandidates = variantCandidates.filter((template) => {
872:     if (previousTemplateId && template.id === previousTemplateId && variantCandidates.length > 1)
873:       return false
874:     if (!previousText)
875:       return true
876:     const text = resolveTemplateText(template, requestedLocale, displayName).text
877:     if (text === previousText && variantCandidates.length > 1)
878:       return false
879:     return true
880:   })
881:
882:   const selectedTemplate = pickFromTemplates(
883:     nonRepeatingCandidates.length > 0
884:       ? nonRepeatingCandidates
885:       : (variantCandidates.length > 0 ? variantCandidates : [FALLBACK_TEMPLATE]),
886:     random,
887:   )
888:
889:   const resolvedText = resolveTemplateText(selectedTemplate, requestedLocale, displayName)
890:   const selectedVariant = resolveTemplateVariant(selectedTemplate)
891:   const bubbleChannelAllowedByFilter = allowedChannels.length === 0 || allowedChannels.includes('bubble')
892:   const shouldShowBubble = selectedTemplate.channels.includes('bubble')
893:     && bubbleAllowed
894:     && bubbleChannelAllowedByFilter
895:
896:   return {
897:     text: resolvedText.text,
898:     level: selectedTemplate.level,
899:     channels: selectedTemplate.channels,
900:     cooldownMs: selectedTemplate.cooldownMs ?? EVENT_DEFAULT_COOLDOWN_MS[normalizedEventType] ?? (FALLBACK_TEMPLATE.cooldownMs ?? 5_000),
901:     eventType: normalizedEventType,
902:     templateId: selectedTemplate.id,
903:     locale: requestedLocale,

(Output capped at 50 KB. Showing lines 1-903. Use offset=904 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-local-face-gate.ts</path>
<type>file</type>
<content>
1: import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
2:
3: import type { FaceSampleQuality, VisionFaceProfilePayload } from './use-encrypted-face-profile'
4:
5: import { computed, ref } from 'vue'
6:
7: export type LocalFaceProfileStatus
8:   = | 'not_enrolled'
9:     | 'enrolling'
10:     | 'enrolled'
11:     | 'matching'
12:     | 'matched'
13:     | 'unmatched'
14:     | 'uncertain'
15:     | 'multiple_faces'
16:     | 'no_face'
17:
18: export type LocalFaceGateState = 'disabled' | 'enabled' | 'gated' | 'locked'
19:
20: export type VisionSubjectStatus = 'none' | 'matched_subject' | 'unknown_subject' | 'multiple_subjects'
21:
22: export interface LocalFaceSampleDescriptor {
23:   descriptor: number[]
24:   quality: number
25:   capturedAt: string
26: }
27:
28: export interface LocalFaceGateConfig {
29:   /** Consecutive frames required before switching match status. @default 3 */
30:   stableFrames?: number
31:   /** Minimum descriptor quality score in [0,1]. @default 0.45 */
32:   qualityThreshold?: number
33: }
34:
35: export interface LocalFaceMatchResult {
36:   status: LocalFaceProfileStatus
37:   score: number | null
38:   reason?: string
39: }
40:
41: const DEFAULT_CONFIG: Required<LocalFaceGateConfig> = {
42:   stableFrames: 3,
43:   qualityThreshold: 0.45,
44: }
45:
46: export interface CreateDescriptorOptions {
47:   descriptorVersion?: string
48: }
49:
50: export interface GateEvaluationInput {
51:   faceResult: FaceLandmarkerResult | null
52:   profile: VisionFaceProfilePayload | null
53:   qualityMetrics: FaceSampleQuality | null
54: }
55:
56: export function useLocalFaceGate(partialConfig?: LocalFaceGateConfig) {
57:   const config = {
58:     ...DEFAULT_CONFIG,
59:     ...partialConfig,
60:   }
61:
62:   const gateEnabled = ref(false)
63:   const profileStatus = ref<LocalFaceProfileStatus>('not_enrolled')
64:   const gateState = ref<LocalFaceGateState>('disabled')
65:   const subjectStatus = ref<VisionSubjectStatus>('none')
66:   const matchScore = ref<number | null>(null)
67:   const threshold = ref(0.38)
68:   const qualityThreshold = ref(config.qualityThreshold)
69:   const stableFrames = ref(config.stableFrames)
70:   const debugStatusText = ref('')
71:
72:   const hasUnlockedProfile = ref(false)
73:   const unlockedDisplayName = ref('')
74:   const profileSampleCount = ref(0)
75:   const profileUpdatedAt = ref('')
76:   const lastWelcomeAtMs = ref(Number.NEGATIVE_INFINITY)
77:   const stableStatusCandidate = ref<LocalFaceProfileStatus>('not_enrolled')
78:   const stableStatusFrames = ref(0)
79:   const justTransitionedToMatched = ref(false)
80:
81:   const hasProfile = computed(() => profileSampleCount.value > 0)
82:   const canRunMatching = computed(() => gateEnabled.value && hasUnlockedProfile.value && hasProfile.value)
83:
84:   function syncProfileFromPayload(payload: VisionFaceProfilePayload | null) {
85:     if (!payload) {
86:       hasUnlockedProfile.value = false
87:       unlockedDisplayName.value = ''
88:       profileSampleCount.value = 0
89:       profileUpdatedAt.value = ''
90:       profileStatus.value = 'not_enrolled'
91:       if (!gateEnabled.value)
92:         gateState.value = 'disabled'
93:       else
94:         gateState.value = 'locked'
95:       subjectStatus.value = 'none'
96:       return
97:     }
98:
99:     hasUnlockedProfile.value = true
100:     unlockedDisplayName.value = payload.displayName
101:     profileSampleCount.value = payload.samples.length
102:     profileUpdatedAt.value = payload.updatedAt
103:     threshold.value = clampThreshold(payload.threshold)
104:     qualityThreshold.value = clampQualityThreshold(payload.qualityThreshold)
105:     stableFrames.value = clampStableFrames(payload.stableFrames)
106:     profileStatus.value = gateEnabled.value ? 'enrolled' : 'enrolled'
107:     gateState.value = gateEnabled.value ? 'gated' : 'disabled'
108:     subjectStatus.value = gateEnabled.value ? 'unknown_subject' : 'none'
109:     stableStatusCandidate.value = profileStatus.value
110:     stableStatusFrames.value = 0
111:     justTransitionedToMatched.value = false
112:   }
113:
114:   function setGateEnabled(enabled: boolean) {
115:     gateEnabled.value = enabled
116:     if (!enabled) {
117:       gateState.value = 'disabled'
118:       subjectStatus.value = 'none'
119:       if (hasProfile.value)
120:         profileStatus.value = 'enrolled'
121:       else
122:         profileStatus.value = 'not_enrolled'
123:       return
124:     }
125:
126:     if (!hasUnlockedProfile.value || !hasProfile.value) {
127:       gateState.value = 'locked'
128:       subjectStatus.value = 'none'
129:       profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
130:       return
131:     }
132:
133:     gateState.value = 'gated'
134:     subjectStatus.value = 'unknown_subject'
135:     profileStatus.value = 'enrolled'
136:   }
137:
138:   function setThreshold(nextThreshold: number) {
139:     threshold.value = clampThreshold(nextThreshold)
140:   }
141:
142:   function setQualityThreshold(nextThreshold: number) {
143:     qualityThreshold.value = clampQualityThreshold(nextThreshold)
144:   }
145:
146:   function setStableFrames(nextFrames: number) {
147:     stableFrames.value = clampStableFrames(nextFrames)
148:   }
149:
150:   function resetForCameraStop() {
151:     matchScore.value = null
152:     stableStatusFrames.value = 0
153:     stableStatusCandidate.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
154:     justTransitionedToMatched.value = false
155:     if (!gateEnabled.value) {
156:       gateState.value = 'disabled'
157:       subjectStatus.value = 'none'
158:       profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
159:       return
160:     }
161:     gateState.value = hasUnlockedProfile.value && hasProfile.value ? 'gated' : 'locked'
162:     subjectStatus.value = hasUnlockedProfile.value ? 'unknown_subject' : 'none'
163:     profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
164:   }
165:
166:   function setLockedByProfile() {
167:     hasUnlockedProfile.value = false
168:     unlockedDisplayName.value = ''
169:     if (gateEnabled.value) {
170:       gateState.value = hasProfile.value ? 'locked' : 'locked'
171:       subjectStatus.value = 'none'
172:       profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
173:     }
174:   }
175:
176:   function updateStableStatus(nextStatus: LocalFaceProfileStatus) {
177:     if (stableStatusCandidate.value === nextStatus) {
178:       stableStatusFrames.value += 1
179:     }
180:     else {
181:       stableStatusCandidate.value = nextStatus
182:       stableStatusFrames.value = 1
183:     }
184:
185:     if (stableStatusFrames.value < stableFrames.value)
186:       return
187:
188:     const previous = profileStatus.value
189:     profileStatus.value = nextStatus
190:     justTransitionedToMatched.value = previous !== 'matched' && nextStatus === 'matched'
191:   }
192:
193:   function consumeJustMatchedWelcome(nowMs: number, cooldownMs: number) {
194:     if (!justTransitionedToMatched.value)
195:       return false
196:     if (nowMs - lastWelcomeAtMs.value < cooldownMs)
197:       return false
198:     justTransitionedToMatched.value = false
199:     lastWelcomeAtMs.value = nowMs
200:     return true
201:   }
202:
203:   function evaluateFrame(input: GateEvaluationInput): LocalFaceMatchResult {
204:     justTransitionedToMatched.value = false
205:
206:     if (!gateEnabled.value) {
207:       gateState.value = 'disabled'
208:       subjectStatus.value = 'none'
209:       matchScore.value = null
210:       return {
211:         status: hasProfile.value ? 'enrolled' : 'not_enrolled',
212:         score: null,
213:       }
214:     }
215:
216:     if (!hasUnlockedProfile.value || !input.profile || !input.profile.samples.length) {
217:       gateState.value = 'locked'
218:       subjectStatus.value = 'none'
219:       matchScore.value = null
220:       profileStatus.value = input.profile ? 'enrolled' : 'not_enrolled'
221:       return {
222:         status: profileStatus.value,
223:         score: null,
224:         reason: input.profile ? 'profile locked' : 'not enrolled',
225:       }
226:     }
227:
228:     if (!input.faceResult) {
229:       gateState.value = 'locked'
230:       subjectStatus.value = 'unknown_subject'
231:       updateStableStatus('uncertain')
232:       return {
233:         status: profileStatus.value,
234:         score: null,
235:         reason: 'face result unavailable',
236:       }
237:     }
238:
239:     const faces = input.faceResult.faceLandmarks ?? []
240:     if (!faces.length) {
241:       gateState.value = 'locked'
242:       subjectStatus.value = 'unknown_subject'
243:       matchScore.value = null
244:       updateStableStatus('no_face')
245:       return {
246:         status: profileStatus.value,
247:         score: null,
248:         reason: 'no face',
249:       }
250:     }
251:
252:     if (faces.length > 1) {
253:       gateState.value = 'locked'
254:       subjectStatus.value = 'multiple_subjects'
255:       matchScore.value = null
256:       updateStableStatus('multiple_faces')
257:       return {
258:         status: profileStatus.value,
259:         score: null,
260:         reason: 'multiple faces',
261:       }
262:     }
263:
264:     const landmarks = faces[0] ?? []
265:     if (!landmarks.length) {
266:       gateState.value = 'locked'
267:       subjectStatus.value = 'unknown_subject'
268:       updateStableStatus('no_face')
269:       return {
270:         status: profileStatus.value,
271:         score: null,
272:         reason: 'no face',
273:       }
274:     }
275:
276:     if (input.qualityMetrics && input.qualityMetrics.qualityScore < qualityThreshold.value) {
277:       gateState.value = 'gated'
278:       subjectStatus.value = 'unknown_subject'
279:       matchScore.value = null
280:       debugStatusText.value = `quality=${input.qualityMetrics.qualityScore.toFixed(2)} threshold=${qualityThreshold.value.toFixed(2)}`
281:       updateStableStatus('uncertain')
282:       return {
283:         status: profileStatus.value,
284:         score: null,
285:         reason: 'low quality',
286:       }
287:     }
288:
289:     const descriptor = createLandmarkDescriptor(landmarks, { descriptorVersion: input.profile.descriptorVersion })
290:     if (!descriptor) {
291:       gateState.value = 'gated'
292:       subjectStatus.value = 'unknown_subject'
293:       matchScore.value = null
294:       updateStableStatus('uncertain')
295:       return {
296:         status: profileStatus.value,
297:         score: null,
298:         reason: 'descriptor failed',
299:       }
300:     }
301:
302:     const distance = minDistanceToSamples(descriptor, input.profile.samples)
303:     matchScore.value = Number.isFinite(distance) ? distance : null
304:     const matched = distance <= threshold.value
305:     updateStableStatus(matched ? 'matched' : 'unmatched')
306:
307:     if (profileStatus.value === 'matched') {
308:       gateState.value = 'enabled'
309:       subjectStatus.value = 'matched_subject'
310:     }
311:     else {
312:       gateState.value = 'gated'
313:       subjectStatus.value = 'unknown_subject'
314:     }
315:
316:     return {
317:       status: profileStatus.value,
318:       score: matchScore.value,
319:       reason: matched ? undefined : 'distance above threshold',
320:     }
321:   }
322:
323:   return {
324:     gateEnabled,
325:     gateState,
326:     profileStatus,
327:     subjectStatus,
328:     hasProfile,
329:     hasUnlockedProfile,
330:     unlockedDisplayName,
331:     profileSampleCount,
332:     profileUpdatedAt,
333:     matchScore,
334:     threshold,
335:     qualityThreshold,
336:     stableFrames,
337:     debugStatusText,
338:     canRunMatching,
339:     setGateEnabled,
340:     setThreshold,
341:     setQualityThreshold,
342:     setStableFrames,
343:     setLockedByProfile,
344:     syncProfileFromPayload,
345:     evaluateFrame,
346:     resetForCameraStop,
347:     consumeJustMatchedWelcome,
348:   }
349: }
350:
351: function clampThreshold(value: number) {
352:   if (!Number.isFinite(value))
353:     return 0.38
354:   return Math.min(1.2, Math.max(0.05, value))
355: }
356:
357: function clampQualityThreshold(value: number) {
358:   if (!Number.isFinite(value))
359:     return 0.45
360:   return Math.min(1, Math.max(0.05, value))
361: }
362:
363: function clampStableFrames(value: number) {
364:   if (!Number.isFinite(value))
365:     return 3
366:   return Math.min(12, Math.max(2, Math.round(value)))
367: }
368:
369: function minDistanceToSamples(descriptor: number[], samples: VisionFaceProfilePayload['samples']) {
370:   let minDistance = Number.POSITIVE_INFINITY
371:   for (const sample of samples) {
372:     const distance = descriptorDistance(descriptor, sample.descriptor)
373:     minDistance = Math.min(minDistance, distance)
374:   }
375:   return minDistance
376: }
377:
378: function descriptorDistance(a: number[], b: number[]) {
379:   if (!a.length || !b.length)
380:     return Number.POSITIVE_INFINITY
381:   if (a.length !== b.length)
382:     return Number.POSITIVE_INFINITY
383:
384:   const n = a.length
385:   let sum = 0
386:   for (let i = 0; i < n; i += 1) {
387:     const left = a[i] ?? 0
388:     const right = b[i] ?? 0
389:     if (!Number.isFinite(left) || !Number.isFinite(right))
390:       return Number.POSITIVE_INFINITY
391:     const d = left - right
392:     sum += d * d
393:   }
394:   if (!Number.isFinite(sum))
395:     return Number.POSITIVE_INFINITY
396:
397:   return Math.sqrt(sum / n)
398: }
399:
400: export function createLandmarkDescriptor(landmarks: NormalizedLandmark[], options?: CreateDescriptorOptions) {
401:   const bounds = extractFaceBounds(landmarks)
402:   if (!bounds)
403:     return null
404:   const centerX = (bounds.minX + bounds.maxX) * 0.5
405:   const centerY = (bounds.minY + bounds.maxY) * 0.5
406:   const baseSize = Math.max(bounds.width, bounds.height)
407:   if (baseSize <= 1e-6)
408:     return null
409:
410:   const descriptorVersion = options?.descriptorVersion ?? 'landmark-signature-v1'
411:   const anchorIndices = descriptorVersion === 'landmark-signature-v1'
412:     ? [1, 33, 133, 362, 263, 61, 291, 10, 152, 234, 454]
413:     : [1, 33, 133, 362, 263, 61, 291, 10, 152, 234, 454]
414:
415:   const descriptor: number[] = []
416:   for (const index of anchorIndices) {
417:     const point = landmarks[index]
418:     if (!point)
419:       continue
420:     descriptor.push((point.x - centerX) / baseSize)
421:     descriptor.push((point.y - centerY) / baseSize)
422:     descriptor.push((point.z ?? 0) / baseSize)
423:   }
424:
425:   const leftEye = landmarks[33]
426:   const rightEye = landmarks[263]
427:   const nose = landmarks[1]
428:   const chin = landmarks[152]
429:   if (leftEye && rightEye && nose && chin) {
430:     descriptor.push(distance2d(leftEye, rightEye) / baseSize)
431:     descriptor.push(distance2d(nose, chin) / baseSize)
432:     descriptor.push((nose.x - centerX) / baseSize)
433:     descriptor.push((nose.y - centerY) / baseSize)
434:   }
435:
436:   if (!descriptor.length)
437:     return null
438:
439:   const squared = descriptor.reduce((sum, item) => sum + (item * item), 0)
440:   const norm = Math.sqrt(squared)
441:   if (norm <= 1e-9)
442:     return null
443:   return descriptor.map(item => item / norm)
444: }
445:
446: function distance2d(a: NormalizedLandmark, b: NormalizedLandmark) {
447:   const dx = a.x - b.x
448:   const dy = a.y - b.y
449:   return Math.sqrt((dx * dx) + (dy * dy))
450: }
451:
452: export function extractFaceBounds(landmarks: NormalizedLandmark[]) {
453:   if (!landmarks.length)
454:     return null
455:   let minX = Number.POSITIVE_INFINITY
456:   let maxX = Number.NEGATIVE_INFINITY
457:   let minY = Number.POSITIVE_INFINITY
458:   let maxY = Number.NEGATIVE_INFINITY
459:
460:   for (const landmark of landmarks) {
461:     minX = Math.min(minX, landmark.x)
462:     maxX = Math.max(maxX, landmark.x)
463:     minY = Math.min(minY, landmark.y)
464:     maxY = Math.max(maxY, landmark.y)
465:   }
466:
467:   if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY))
468:     return null
469:
470:   const width = Math.max(0, maxX - minX)
471:   const height = Math.max(0, maxY - minY)
472:   if (width <= 0 || height <= 0)
473:     return null
474:
475:   return {
476:     minX,
477:     maxX,
478:     minY,
479:     maxY,
480:     width,
481:     height,
482:     centerX: (minX + maxX) * 0.5,
483:     centerY: (minY + maxY) * 0.5,
484:   }
485: }

(End of file - total 485 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-runtime.ts</path>
<type>file</type>
<content>
1: import type { FaceLandmarker, GestureRecognizer } from '@mediapipe/tasks-vision'
2:
3: import {
4:   FaceLandmarker as FaceLandmarkerClass,
5:   FilesetResolver,
6:   GestureRecognizer as GestureRecognizerClass,
7: } from '@mediapipe/tasks-vision'
8: import { errorMessageFrom } from '@moeru/std'
9: import { computed, ref } from 'vue'
10:
11: import { useOpenCvFaceQuality } from './use-opencv-face-quality'
12:
13: export type VisionRuntimeStatus = 'idle' | 'warming' | 'ready' | 'partial_ready' | 'failed' | 'resetting'
14: export type VisionMediaPipeStatus = 'idle' | 'loading' | 'ready' | 'failed'
15: export type VisionModelSource = 'local' | 'remote' | 'unknown'
16:
17: export interface VisionRuntimeWarmupOptions {
18:   background?: boolean
19:   includeOpenCv?: boolean
20:   force?: boolean
21: }
22:
23: interface MediaPipeRuntime {
24:   faceLandmarker: FaceLandmarker
25:   gestureRecognizer: GestureRecognizer
26: }
27:
28: interface CreateMediaPipeRuntimeOptions {
29:   fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>
30:   faceModelAssetPath: string
31:   gestureModelAssetPath: string
32: }
33:
34: const LOCAL_FACE_MODEL_ASSET_URL = './assets/vision/models/face_landmarker.task'
35: const LOCAL_GESTURE_MODEL_ASSET_URL = './assets/vision/models/gesture_recognizer.task'
36: const LOCAL_WASM_ROOT_URL = './assets/vision/wasm'
37: const FACE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
38: const GESTURE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
39: const WASM_ROOT_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
40: const ENABLE_REMOTE_MODEL_FALLBACK = import.meta.env.VITE_VISION_ALLOW_REMOTE_FALLBACK === 'true'
41: const PRACTICAL_GESTURE_ALLOWLIST = ['Open_Palm', 'Victory', 'Thumb_Up']
42: const DEFAULT_GESTURE_SCORE_THRESHOLD = 0.35
43: const DEFAULT_MEDIA_PIPE_TIMEOUT_MS = 18_000
44: const DEFAULT_OPENCV_TIMEOUT_MS = 12_000
45: const DEFAULT_BACKGROUND_WARMUP_IDLE_TIMEOUT_MS = 2_500
46:
47: /**
48:  * Shared Vision runtime singleton.
49:  *
50:  * Use when:
51:  * - Vision pages/components need warmup/retry/reset semantics.
52:  * - MediaPipe/OpenCV runtimes should be reused across component mounts.
53:  *
54:  * Expects:
55:  * - Runtime is renderer-process scoped and intentionally long-lived.
56:  *
57:  * Returns:
58:  * - State refs, warmup/retry/reset methods, and runtime accessors.
59:  */
60: export function useVisionRuntime() {
61:   return sharedVisionRuntime
62: }
63:
64: function createVisionRuntimeSingleton() {
65:   const openCvRuntime = useOpenCvFaceQuality()
66:   const runtimeStatus = ref<VisionRuntimeStatus>('idle')
67:   const mediaPipeStatus = ref<VisionMediaPipeStatus>('idle')
68:   const modelSource = ref<VisionModelSource>('unknown')
69:   const modelProfile = ref('MediaPipe 官方 float16 v1（本地与远程同规格）')
70:   const lastWarmupStartedAt = ref<number | null>(null)
71:   const lastWarmupFinishedAt = ref<number | null>(null)
72:   const warmupDurationMs = ref<number | null>(null)
73:   const lastError = ref('')
74:   const retryCount = ref(0)
75:
76:   let mediaPipeRuntime: MediaPipeRuntime | null = null
77:   let mediaPipeWarmupPromise: Promise<MediaPipeRuntime> | null = null
78:   let openCvWarmupPromise: Promise<void> | null = null
79:   let warmupVisionRuntimePromise: Promise<void> | null = null
80:   let runtimeGeneration = 0
81:   let lastWarmupToken = 0
82:
83:   const opencvStatus = openCvRuntime.status
84:   const isReady = computed(() => runtimeStatus.value === 'ready')
85:   const isPartiallyReady = computed(() => runtimeStatus.value === 'partial_ready')
86:
87:   function isRuntimeTokenValid(token: number) {
88:     return token === runtimeGeneration
89:   }
90:
91:   function closeMediaPipeRuntime() {
92:     try {
93:       mediaPipeRuntime?.faceLandmarker.close()
94:     }
95:     catch {}
96:     try {
97:       mediaPipeRuntime?.gestureRecognizer.close()
98:     }
99:     catch {}
100:     mediaPipeRuntime = null
101:   }
102:
103:   function recomputeRuntimeStatus() {
104:     if (runtimeStatus.value === 'resetting')
105:       return
106:
107:     if (mediaPipeStatus.value === 'failed') {
108:       runtimeStatus.value = 'failed'
109:       return
110:     }
111:
112:     if (mediaPipeStatus.value === 'loading' || opencvStatus.value === 'loading') {
113:       runtimeStatus.value = 'warming'
114:       return
115:     }
116:
117:     if (mediaPipeStatus.value === 'ready' && opencvStatus.value === 'ready') {
118:       runtimeStatus.value = 'ready'
119:       return
120:     }
121:
122:     if (mediaPipeStatus.value === 'ready') {
123:       runtimeStatus.value = 'partial_ready'
124:       return
125:     }
126:
127:     runtimeStatus.value = 'idle'
128:   }
129:
130:   function markLastError(message: string) {
131:     lastError.value = message
132:   }
133:
134:   function clearLastError() {
135:     lastError.value = ''
136:   }
137:
138:   function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
139:     return new Promise<T>((resolve, reject) => {
140:       const timer = setTimeout(() => {
141:         reject(new Error(timeoutMessage))
142:       }, timeoutMs)
143:
144:       promise
145:         .then((value) => {
146:           clearTimeout(timer)
147:           resolve(value)
148:         })
149:         .catch((error) => {
150:           clearTimeout(timer)
151:           reject(error)
152:         })
153:     })
154:   }
155:
156:   async function createMediaPipeRuntime(options: CreateMediaPipeRuntimeOptions) {
157:     await yieldToBrowserFrame()
158:     const nextFaceLandmarker = await FaceLandmarkerClass.createFromOptions(options.fileset, {
159:       baseOptions: { modelAssetPath: options.faceModelAssetPath },
160:       runningMode: 'VIDEO',
161:       numFaces: 2,
162:       minFaceDetectionConfidence: 0.5,
163:       minFacePresenceConfidence: 0.5,
164:       minTrackingConfidence: 0.5,
165:       outputFaceBlendshapes: true,
166:       outputFacialTransformationMatrixes: false,
167:     })
168:
169:     try {
170:       await yieldToBrowserFrame()
171:       const nextGestureRecognizer = await GestureRecognizerClass.createFromOptions(options.fileset, {
172:         baseOptions: { modelAssetPath: options.gestureModelAssetPath },
173:         runningMode: 'VIDEO',
174:         numHands: 1,
175:         minHandDetectionConfidence: 0.5,
176:         minHandPresenceConfidence: 0.5,
177:         minTrackingConfidence: 0.5,
178:         cannedGesturesClassifierOptions: {
179:           categoryAllowlist: PRACTICAL_GESTURE_ALLOWLIST,
180:           maxResults: 3,
181:           scoreThreshold: DEFAULT_GESTURE_SCORE_THRESHOLD,
182:         },
183:       })
184:
185:       return {
186:         faceLandmarker: nextFaceLandmarker,
187:         gestureRecognizer: nextGestureRecognizer,
188:       }
189:     }
190:     catch (error) {
191:       try {
192:         nextFaceLandmarker.close()
193:       }
194:       catch {}
195:       throw error
196:     }
197:   }
198:
199:   async function warmupMediaPipe(options?: VisionRuntimeWarmupOptions) {
200:     if (mediaPipeRuntime && mediaPipeStatus.value === 'ready')
201:       return mediaPipeRuntime
202:     if (mediaPipeWarmupPromise)
203:       return mediaPipeWarmupPromise
204:
205:     const warmupToken = runtimeGeneration
206:     mediaPipeStatus.value = 'loading'
207:     runtimeStatus.value = 'warming'
208:     if (options?.force)
209:       clearLastError()
210:
211:     mediaPipeWarmupPromise = (async () => {
212:       try {
213:         const localFileset = await withTimeout(
214:           FilesetResolver.forVisionTasks(LOCAL_WASM_ROOT_URL),
215:           DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
216:           'MediaPipe warmup timed out',
217:         )
218:         const localRuntime = await withTimeout(
219:           createMediaPipeRuntime({
220:             fileset: localFileset,
221:             faceModelAssetPath: LOCAL_FACE_MODEL_ASSET_URL,
222:             gestureModelAssetPath: LOCAL_GESTURE_MODEL_ASSET_URL,
223:           }),
224:           DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
225:           'MediaPipe warmup timed out',
226:         )
227:
228:         if (!isRuntimeTokenValid(warmupToken)) {
229:           try {
230:             localRuntime.faceLandmarker.close()
231:           }
232:           catch {}
233:           try {
234:             localRuntime.gestureRecognizer.close()
235:           }
236:           catch {}
237:           throw new Error('Vision runtime warmup invalidated')
238:         }
239:
240:         mediaPipeRuntime = localRuntime
241:         mediaPipeStatus.value = 'ready'
242:         modelSource.value = 'local'
243:         return localRuntime
244:       }
245:       catch (localError) {
246:         if (!ENABLE_REMOTE_MODEL_FALLBACK)
247:           throw localError
248:
249:         const remoteFileset = await withTimeout(
250:           FilesetResolver.forVisionTasks(WASM_ROOT_URL),
251:           DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
252:           'MediaPipe warmup timed out',
253:         )
254:         const remoteRuntime = await withTimeout(
255:           createMediaPipeRuntime({
256:             fileset: remoteFileset,
257:             faceModelAssetPath: FACE_MODEL_ASSET_URL,
258:             gestureModelAssetPath: GESTURE_MODEL_ASSET_URL,
259:           }),
260:           DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
261:           'MediaPipe warmup timed out',
262:         )
263:
264:         if (!isRuntimeTokenValid(warmupToken)) {
265:           try {
266:             remoteRuntime.faceLandmarker.close()
267:           }
268:           catch {}
269:           try {
270:             remoteRuntime.gestureRecognizer.close()
271:           }
272:           catch {}
273:           throw new Error('Vision runtime warmup invalidated')
274:         }
275:
276:         mediaPipeRuntime = remoteRuntime
277:         mediaPipeStatus.value = 'ready'
278:         modelSource.value = 'remote'
279:         return remoteRuntime
280:       }
281:     })()
282:       .catch((error) => {
283:         if (isRuntimeTokenValid(warmupToken)) {
284:           closeMediaPipeRuntime()
285:           mediaPipeStatus.value = 'failed'
286:           modelSource.value = 'unknown'
287:           markLastError(errorMessageFrom(error) ?? 'MediaPipe warmup failed')
288:           runtimeStatus.value = 'failed'
289:         }
290:         throw error
291:       })
292:       .finally(() => {
293:         if (isRuntimeTokenValid(warmupToken))
294:           mediaPipeWarmupPromise = null
295:       })
296:
297:     return mediaPipeWarmupPromise
298:   }
299:
300:   function scheduleOpenCvWarmupTask() {
301:     if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
302:       window.requestIdleCallback(() => {
303:         void warmupOpenCV()
304:       })
305:       return
306:     }
307:
308:     setTimeout(() => {
309:       void warmupOpenCV()
310:     }, 0)
311:   }
312:
313:   async function warmupOpenCV() {
314:     if (opencvStatus.value === 'ready')
315:       return
316:     if (openCvWarmupPromise)
317:       return openCvWarmupPromise
318:
319:     const warmupToken = runtimeGeneration
320:     openCvWarmupPromise = (async () => {
321:       try {
322:         await withTimeout(
323:           openCvRuntime.initializeOpenCv().then(() => undefined),
324:           DEFAULT_OPENCV_TIMEOUT_MS,
325:           'OpenCV warmup timed out, using fallback',
326:         )
327:       }
328:       catch (error) {
329:         if (isRuntimeTokenValid(warmupToken)) {
330:           const message = errorMessageFrom(error) ?? 'OpenCV warmup timed out, using fallback'
331:           openCvRuntime.markFallback(message)
332:           markLastError(message)
333:         }
334:       }
335:       finally {
336:         if (isRuntimeTokenValid(warmupToken))
337:           openCvWarmupPromise = null
338:       }
339:     })()
340:
341:     return openCvWarmupPromise
342:   }
343:
344:   async function warmupVisionRuntime(options?: VisionRuntimeWarmupOptions) {
345:     if (warmupVisionRuntimePromise)
346:       return warmupVisionRuntimePromise
347:
348:     const warmupToken = runtimeGeneration
349:     const includeOpenCv = options?.includeOpenCv ?? true
350:     const background = options?.background ?? false
351:     const shouldForce = options?.force ?? false
352:
353:     if (shouldForce) {
354:       closeMediaPipeRuntime()
355:       mediaPipeWarmupPromise = null
356:       mediaPipeStatus.value = 'idle'
357:       openCvRuntime.resetRuntime()
358:       openCvWarmupPromise = null
359:       clearLastError()
360:     }
361:
362:     runtimeStatus.value = 'warming'
363:     const startedAt = Date.now()
364:     lastWarmupToken += 1
365:     lastWarmupStartedAt.value = startedAt
366:
367:     warmupVisionRuntimePromise = (async () => {
368:       try {
369:         if (background) {
370:           await waitForBrowserIdle(DEFAULT_BACKGROUND_WARMUP_IDLE_TIMEOUT_MS)
371:           await yieldToBrowserFrame()
372:         }
373:
374:         await warmupMediaPipe(options)
375:         if (!isRuntimeTokenValid(warmupToken))
376:           return
377:
378:         if (includeOpenCv) {
379:           if (background)
380:             scheduleOpenCvWarmupTask()
381:           else
382:             await warmupOpenCV()
383:         }
384:
385:         if (!isRuntimeTokenValid(warmupToken))
386:           return
387:
388:         recomputeRuntimeStatus()
389:       }
390:       catch (error) {
391:         if (isRuntimeTokenValid(warmupToken)) {
392:           markLastError(errorMessageFrom(error) ?? 'Vision runtime warmup failed')
393:           runtimeStatus.value = 'failed'
394:         }
395:         throw error
396:       }
397:       finally {
398:         if (isRuntimeTokenValid(warmupToken)) {
399:           lastWarmupFinishedAt.value = Date.now()
400:           warmupDurationMs.value = lastWarmupFinishedAt.value - startedAt
401:           if (runtimeStatus.value !== 'failed')
402:             recomputeRuntimeStatus()
403:           warmupVisionRuntimePromise = null
404:         }
405:       }
406:     })()
407:
408:     return warmupVisionRuntimePromise
409:   }
410:
411:   async function resetVisionRuntime() {
412:     runtimeStatus.value = 'resetting'
413:     runtimeGeneration += 1
414:     lastWarmupToken += 1
415:     mediaPipeWarmupPromise = null
416:     openCvWarmupPromise = null
417:     warmupVisionRuntimePromise = null
418:     closeMediaPipeRuntime()
419:     mediaPipeStatus.value = 'idle'
420:     modelSource.value = 'unknown'
421:     openCvRuntime.resetRuntime()
422:     lastWarmupStartedAt.value = null
423:     lastWarmupFinishedAt.value = null
424:     warmupDurationMs.value = null
425:     clearLastError()
426:     runtimeStatus.value = 'idle'
427:   }
428:
429:   async function retryVisionRuntime(options?: Omit<VisionRuntimeWarmupOptions, 'force'>) {
430:     retryCount.value += 1
431:     await warmupVisionRuntime({
432:       ...options,
433:       force: true,
434:       background: false,
435:     })
436:   }
437:
438:   function getMediaPipeRuntime() {
439:     if (mediaPipeStatus.value !== 'ready')
440:       return null
441:     return mediaPipeRuntime
442:   }
443:
444:   function getOpenCVRuntime() {
445:     return openCvRuntime
446:   }
447:
448:   return {
449:     runtimeStatus,
450:     mediaPipeStatus,
451:     opencvStatus,
452:     modelSource,
453:     modelProfile,
454:     lastWarmupStartedAt,
455:     lastWarmupFinishedAt,
456:     warmupDurationMs,
457:     lastError,
458:     retryCount,
459:     isReady,
460:     isPartiallyReady,
461:     warmupVisionRuntime,
462:     warmupMediaPipe,
463:     warmupOpenCV,
464:     getMediaPipeRuntime,
465:     getOpenCVRuntime,
466:     resetVisionRuntime,
467:     retryVisionRuntime,
468:   }
469: }
470:
471: const sharedVisionRuntime = createVisionRuntimeSingleton()
472:
473: function yieldToBrowserFrame() {
474:   return new Promise<void>((resolve) => {
475:     setTimeout(resolve, 0)
476:   })
477: }
478:
479: function waitForBrowserIdle(timeoutMs: number) {
480:   return new Promise<void>((resolve) => {
481:     if (typeof window === 'undefined') {
482:       setTimeout(resolve, 0)
483:       return
484:     }
485:
486:     const schedulerWindow = window as Window & {
487:       requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
488:     }
489:     if (typeof schedulerWindow.requestIdleCallback === 'function') {
490:       schedulerWindow.requestIdleCallback(() => {
491:         resolve()
492:       }, { timeout: timeoutMs })
493:       return
494:     }
495:
496:     setTimeout(resolve, 16)
497:   })
498: }

(End of file - total 498 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts",
  "limit": 200
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts</path>
<type>file</type>
<content>
1: import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
2:
3: import type { GestureQualityPoint, GestureQualityState } from '../utils/gesture-quality'
4: import type { GestureCandidateGesture, GestureMachineGesture, GestureMachineState } from '../utils/gesture-state-machine'
5: import type {
6:   VisionExpressionSignal,
7:   VisionExpressionSignalResult,
8:   VisionExpressionSignalSource,
9: } from '../utils/vision-expression-signals'
10: import type { FaceSampleQuality, VisionFaceProfilePayload, VisionFaceProfileSample } from './use-encrypted-face-profile'
11: import type { VisionRuntimeWarmupOptions } from './use-vision-runtime'
12:
13: import { defineInvoke } from '@moeru/eventa'
14: import { errorMessageFrom } from '@moeru/std'
15: import { getElectronEventaContext } from '@proj-airi/electron-vueuse'
16: import { isElectronWindow } from '@proj-airi/stage-shared'
17: import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
18:
19: import { electronSecureStoreDelete, electronSecureStoreGet, electronSecureStoreSet } from '../../shared/eventa'
20: import { verifyGestureGeometry } from '../utils/gesture-geometry'
21: import {
22:   assessGestureQuality,
23:   DEFAULT_GESTURE_QUALITY_THRESHOLDS,
24:
25: } from '../utils/gesture-quality'
26: import {
27:   createGestureStateMachine,
28:   DEFAULT_GESTURE_STATE_MACHINE_CONFIG,
29:
30: } from '../utils/gesture-state-machine'
31: import { resolveVisionExpressionSignal } from '../utils/vision-expression-signals'
32: import { useEncryptedFaceProfile } from './use-encrypted-face-profile'
33: import { createLandmarkDescriptor, useLocalFaceGate } from './use-local-face-gate'
34: import { useVisionRuntime } from './use-vision-runtime'
35:
36: export type VisionCameraState = 'off' | 'loading' | 'active' | 'error'
37: export type VisionCameraPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'
38: export type VisionMediaPipeStatus = 'idle' | 'loading' | 'ready' | 'failed'
39: export type VisionFacePresence = 'present' | 'absent' | 'unknown'
40: export type VisionFaceDirection = 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
41: export type VisionGesture = 'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'
42: export type VisionGestureQualityState = GestureQualityState
43: export type VisionSubjectResponseState = 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
44: export type { VisionExpressionSignal }
45: export type { VisionExpressionSignalSource }
46:
47: export type VisionInteractionEventType
48:   = | 'quiet_mode_requested'
49:     | 'completion_celebration'
50:     | 'acknowledged'
51:     | 'nothing_to_confirm'
52:     | 'detected_but_gated'
53:     | 'face_gate_enrolled'
54:     | 'face_gate_profile_deleted'
55:     | 'face_profile_locked'
56:     | 'face_profile_unlocked'
57:     | 'user_away'
58:     | 'welcome_back'
59:     | 'subject_matched'
60:     | 'user_moved_left'
61:     | 'user_moved_right'
62:     | 'user_moved_up'
63:     | 'user_moved_down'
64:     | 'user_centered'
65:     | 'subject_position_gated'
66:     | 'expression_smile_like_detected'
67:     | 'expression_stable_face_detected'
68:     | 'expression_looking_away_detected'
69:     | 'expression_unclear_detected'
70:
71: export interface VisionInteractionEvent {
72:   id: number
73:   type: VisionInteractionEventType
74:   message: string
75:   at: number
76:   toastMessage?: string
77:   subjectPosition?: VisionFaceDirection
78: }
79:
80: export interface VisionSubjectResponseEvent {
81:   direction: VisionFaceDirection
82:   state: VisionSubjectResponseState
83:   at: number
84:   message: string
85:   gated: boolean
86: }
87:
88: export interface VisionInteractionOptions {
89:   stableFrames?: number
90:   subjectPositionStableFrames?: number
91:   subjectDirectionDeadZoneX?: number
92:   subjectDirectionDeadZoneY?: number
93:   gestureStableFrames?: number
94:   gestureInferenceIntervalMs?: number
95:   gestureScoreThreshold?: number
96:   eventCooldownMs?: number
97:   loopIntervalMs?: number
98:   quietDurationMs?: number
99:   welcomeBackCooldownMs?: number
100:   celebrationCooldownMs?: number
101:   maxInferenceStallMs?: number
102:   faceGateWelcomeCooldownMs?: number
103:   autoUnlockFaceProfile?: boolean
104:   subjectResponseCooldownMs?: number
105: }
106:
107: export type VisionModelWarmupStatus = 'idle' | 'warming' | 'ready' | 'fallback_remote'
108: export type VisionModelSource = 'local' | 'remote' | 'unknown'
109:
110: export interface VisionStartTimingSnapshot {
111:   startedAt: number | null
112:   finishedAt: number | null
113:   totalMs: number | null
114:   readyForPreviewMs: number | null
115:   permissionMs: number | null
116:   videoPlayMs: number | null
117:   recognizerInitMs: number | null
118:   recognizerSource: VisionModelSource
119: }
120:
121: export interface VisionCameraDiagnosticsSnapshot {
122:   trackEndedCount: number
123:   unexpectedTrackEndedCount: number
124:   lastTrackEndedAt: number | null
125:   lastTrackEndedTrackId: string | null
126:   lastTrackEndedTrackLabel: string | null
127:   lastTrackEndedIntentional: boolean | null
128:   inferenceErrorCount: number
129:   consecutiveInferenceErrorCount: number
130:   lastInferenceErrorAt: number | null
131:   lastInferenceErrorMessage: string
132: }
133:
134: interface EmitEventOptions {
135:   type: VisionInteractionEventType
136:   message: string
137:   toastMessage?: string
138:   nowMs: number
139:   cooldownMs?: number
140:   cooldownKey?: string
141:   isAutomatic?: boolean
142:   markAsPrompt?: boolean
143:   skipQuietMute?: boolean
144:   subjectPosition?: VisionFaceDirection
145: }
146:
147: interface GestureTopCandidate {
148:   gesture: GestureCandidateGesture
149:   confidence: number
150:   landmarks: NormalizedLandmark[] | null
151:   handedness: 'left' | 'right' | 'unknown'
152: }
153:
154: const DEFAULT_OPTIONS: Required<VisionInteractionOptions> = {
155:   stableFrames: 3,
156:   subjectPositionStableFrames: 2,
157:   subjectDirectionDeadZoneX: 0.09,
158:   subjectDirectionDeadZoneY: 0.1,
159:   gestureStableFrames: 2,
160:   gestureInferenceIntervalMs: 90,
161:   gestureScoreThreshold: 0.35,
162:   eventCooldownMs: 2_000,
163:   loopIntervalMs: 120,
164:   quietDurationMs: 60_000,
165:   welcomeBackCooldownMs: 8_000,
166:   celebrationCooldownMs: 4_000,
167:   maxInferenceStallMs: 1_200,
168:   faceGateWelcomeCooldownMs: 8_000,
169:   autoUnlockFaceProfile: true,
170:   subjectResponseCooldownMs: 3_500,
171: }
172:
173: const DISPLAY_NAME_LOCAL_STORAGE_KEY = 'airi.vision-experiment.display-name'
174: const GATE_ENABLED_STORAGE_KEY = 'airi.vision-experiment.local-face-gate-enabled.v1'
175: const GESTURE_CONTROLS_ENABLED_STORAGE_KEY = 'airi.vision-experiment.gesture-controls-enabled.v1'
176: const EXPRESSION_SIGNALS_ENABLED_STORAGE_KEY = 'airi.vision-experiment.expression-signals-enabled.v1'
177: const INFERENCE_ERROR_LOG_COOLDOWN_MS = 1_500
178: const TIMESTAMP_MISMATCH_RECOVERY_COOLDOWN_MS = 3_000
179: const QUALITY_EVALUATION_INTERVAL_MS = 400
180: const UI_YIELD_INTERVAL_MS = 240
181: const EXPRESSION_SIGNAL_STABLE_FRAMES = 5
182: const EXPRESSION_LOOKING_AWAY_DIRECTION_SETTLE_MS = 2_500
183: const EXPRESSION_SIGNAL_COOLDOWN_MS: Record<VisionExpressionSignal, number> = {
184:   none: 0,
185:   smile_like_signal: 10_000,
186:   stable_face_signal: 12_000,
187:   looking_away_signal: 15_000,
188:   unclear_face_signal: 9_000,
189:   low_confidence: 9_000,
190: }
191: const FACE_PROFILE_AUTO_UNLOCK_STORE_KEY = 'vision.face-profile.auto-unlock.passphrase.v1'
192: const ENABLE_VISION_VERBOSE_DEBUG_LOGS = import.meta.env.DEV
193:   && import.meta.env.VITE_VISION_DEBUG_LOGS === 'true'
194:
195: const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
196:   width: { ideal: 960, max: 1280 },
197:   height: { ideal: 540, max: 720 },
198:   frameRate: { ideal: 24, max: 30 },
199: }
200: const CAMERA_PERMISSION_TIMEOUT_MS = 12_000

(Showing lines 1-200 of 2605. Use offset=201 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/window-size.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/window-size.ts</path>
<type>file</type>
<content>
1: export interface StageWindowBounds {
2:   x: number
3:   y: number
4:   width: number
5:   height: number
6: }
7:
8: export interface StageWorkAreaBounds {
9:   x: number
10:   y: number
11:   width: number
12:   height: number
13: }
14:
15: export interface StageWindowSizeLimits {
16:   minWidth: number
17:   minHeight: number
18:   maxWidth: number
19:   maxHeight: number
20: }
21:
22: export type StageWindowSizeAction = 'zoom-in' | 'zoom-out' | 'reset-size'
23:
24: const STAGE_WINDOW_ZOOM_FACTOR = 1.1
25: const STAGE_WINDOW_WORK_AREA_MARGIN = 24
26:
27: /**
28:  * Recommended default stage window size.
29:  *
30:  * Use when:
31:  * - Resetting Rin to a predictable size across platforms
32:  *
33:  * Expects:
34:  * - Width and height are interpreted as BrowserWindow pixel bounds
35:  *
36:  * Returns:
37:  * - A stable desktop-pet friendly default footprint
38:  */
39: export const STAGE_WINDOW_DEFAULT_SIZE = {
40:   width: 450,
41:   height: 600,
42: } as const
43:
44: /**
45:  * Safe lower bound for stage window controls visibility.
46:  *
47:  * Use when:
48:  * - Resizing from controls-island zoom actions
49:  * - Preventing Rin from shrinking until controls become hard to use
50:  *
51:  * Expects:
52:  * - Consumers clamp against these values before calling setBounds
53:  *
54:  * Returns:
55:  * - Minimum width and height that keep interactions reachable
56:  */
57: export const STAGE_WINDOW_MIN_SIZE = {
58:   width: 360,
59:   height: 460,
60: } as const
61:
62: function clamp(value: number, min: number, max: number): number {
63:   return Math.min(Math.max(value, min), max)
64: }
65:
66: /**
67:  * Resolves zoom-safe min/max size limits from display work area.
68:  *
69:  * Use when:
70:  * - Any controls-island zoom action needs to clamp size safely
71:  *
72:  * Expects:
73:  * - `workArea` comes from `electron.screen.getPrimaryDisplay().workArea`
74:  *
75:  * Returns:
76:  * - Min/max limits that keep size valid and bounded to the screen work area
77:  */
78: export function resolveStageWindowSizeLimits(workArea: StageWorkAreaBounds): StageWindowSizeLimits {
79:   const maxWidthCandidate = Math.max(1, workArea.width - STAGE_WINDOW_WORK_AREA_MARGIN)
80:   const maxHeightCandidate = Math.max(1, workArea.height - STAGE_WINDOW_WORK_AREA_MARGIN)
81:   const minWidth = Math.min(STAGE_WINDOW_MIN_SIZE.width, maxWidthCandidate)
82:   const minHeight = Math.min(STAGE_WINDOW_MIN_SIZE.height, maxHeightCandidate)
83:
84:   return {
85:     minWidth,
86:     minHeight,
87:     maxWidth: Math.max(minWidth, maxWidthCandidate),
88:     maxHeight: Math.max(minHeight, maxHeightCandidate),
89:   }
90: }
91:
92: /**
93:  * Calculates next BrowserWindow bounds for stage zoom controls.
94:  *
95:  * Use when:
96:  * - Controls-island triggers zoom in, zoom out, or reset size
97:  *
98:  * Expects:
99:  * - `currentBounds` and `workArea` are measured in the same coordinate space
100:  * - Caller applies the returned value with `electron.window.setBounds`
101:  *
102:  * Returns:
103:  * - Clamped bounds that preserve center position and remain inside work area
104:  */
105: export function calculateStageWindowBoundsForAction(params: {
106:   action: StageWindowSizeAction
107:   currentBounds: StageWindowBounds
108:   workArea: StageWorkAreaBounds
109: }): StageWindowBounds {
110:   const limits = resolveStageWindowSizeLimits(params.workArea)
111:   const centerX = params.currentBounds.x + params.currentBounds.width / 2
112:   const centerY = params.currentBounds.y + params.currentBounds.height / 2
113:
114:   const scale = params.action === 'zoom-in'
115:     ? STAGE_WINDOW_ZOOM_FACTOR
116:     : params.action === 'zoom-out'
117:       ? 1 / STAGE_WINDOW_ZOOM_FACTOR
118:       : 1
119:
120:   const targetWidth = params.action === 'reset-size'
121:     ? STAGE_WINDOW_DEFAULT_SIZE.width
122:     : Math.round(params.currentBounds.width * scale)
123:
124:   const targetHeight = params.action === 'reset-size'
125:     ? STAGE_WINDOW_DEFAULT_SIZE.height
126:     : Math.round(params.currentBounds.height * scale)
127:
128:   const width = clamp(targetWidth, limits.minWidth, limits.maxWidth)
129:   const height = clamp(targetHeight, limits.minHeight, limits.maxHeight)
130:   const maxX = params.workArea.x + Math.max(0, params.workArea.width - width)
131:   const maxY = params.workArea.y + Math.max(0, params.workArea.height - height)
132:   const x = clamp(Math.round(centerX - width / 2), params.workArea.x, maxX)
133:   const y = clamp(Math.round(centerY - height / 2), params.workArea.y, maxY)
134:
135:   return { x, y, width, height }
136: }

(End of file - total 136 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-fade-on-hover.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/controls-island-fade-on-hover.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
3: import { storeToRefs } from 'pinia'
4: import { computed } from 'vue'
5: import { useI18n } from 'vue-i18n'
6:
7: import ControlButtonTooltip from './control-button-tooltip.vue'
8: import ControlButton from './control-button.vue'
9:
10: import { noticeWindowEventa } from '../../../../shared/eventa'
11: import { useControlsIslandStore } from '../../../stores/controls-island'
12:
13: interface Props {
14:   iconClass?: string
15:   buttonStyle?: string
16:   label?: string
17:   showLabel?: boolean
18: }
19:
20: const props = withDefaults(defineProps<Props>(), {
21:   iconClass: 'size-5',
22: })
23:
24: const uiStore = useControlsIslandStore()
25: const { fadeOnHoverEnabled, dontShowItAgainNoticeFadeOnHover } = storeToRefs(uiStore)
26: const enabled = computed(() => fadeOnHoverEnabled.value)
27: const { t } = useI18n()
28: const fadeToggleLabel = computed(() => enabled.value
29:   ? t('tamagotchi.stage.controls-island.fade-on-hover.disable')
30:   : t('tamagotchi.stage.controls-island.fade-on-hover.enable'))
31:
32: const requestNotice = useElectronEventaInvoke(noticeWindowEventa.openWindow)
33: const NOTICE_WINDOW_ID = 'fade-on-hover'
34:
35: async function handleToggle() {
36:   if (enabled.value) {
37:     uiStore.disableFadeOnHover()
38:     return
39:   }
40:
41:   uiStore.enableFadeOnHover()
42:
43:   if (dontShowItAgainNoticeFadeOnHover.value) {
44:     return
45:   }
46:
47:   const noticePromise = requestNotice({
48:     id: NOTICE_WINDOW_ID,
49:     route: '/notice/fade-on-hover',
50:     type: 'fade-on-hover',
51:   })
52:
53:   void noticePromise.catch((error) => {
54:     console.error('Failed to open fade-on-hover notice:', error)
55:   })
56: }
57: </script>
58:
59: <template>
60:   <ControlButtonTooltip>
61:     <ControlButton
62:       data-testid="controls-fade-on-hover-toggle"
63:       :button-style="props.buttonStyle"
64:       :label="props.label"
65:       :show-label="props.showLabel"
66:       :aria-label="fadeToggleLabel"
67:       :title="fadeToggleLabel"
68:       :class="{ 'border-primary-300/70 shadow-[0_10px_24px_rgba(0,0,0,0.22)]': enabled }"
69:       @click="handleToggle"
70:     >
71:       <Transition name="fade" mode="out-in">
72:         <div v-if="enabled" i-ph:eye :class="props.iconClass" text="primary-700 dark:primary-300" />
73:         <div v-else i-ph:eye-slash :class="props.iconClass" text="neutral-800 dark:neutral-300" />
74:       </Transition>
75:     </ControlButton>
76:
77:     <template #tooltip>
78:       {{ fadeToggleLabel }}
79:     </template>
80:   </ControlButtonTooltip>
81: </template>

(End of file - total 81 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: const props = defineProps<{
3:   buttonStyle?: string
4:   label?: string
5:   showLabel?: boolean
6: }>()
7: </script>
8:
9: <template>
10:   <button
11:     type="button"
12:     :class="[
13:       'border-2 border-solid border-neutral-200/60 dark:border-neutral-800/10',
14:       'bg-neutral-50/80 dark:bg-neutral-800/70',
15:       'h-10 w-10 shrink-0 flex items-center justify-center p-2 leading-none',
16:       '[&>*]:inline-flex [&>*]:items-center [&>*]:justify-center',
17:       props.showLabel ? 'h-12 w-12 flex-col gap-0.5 px-1 py-1.5' : '',
18:       'rounded-xl backdrop-blur-md',
19:       '[-webkit-app-region:no-drag] pointer-events-auto',
20:       'transition-all hover:transition-none transition-duration-300 transition-ease-out',
21:       props.buttonStyle,
22:     ]"
23:   >
24:     <slot />
25:     <span
26:       v-if="props.showLabel && props.label"
27:       :class="[
28:         'max-w-full truncate text-center',
29:         'text-[9px] leading-none text-neutral-600 dark:text-neutral-300',
30:       ]"
31:     >
32:       {{ props.label }}
33:     </span>
34:   </button>
35: </template>

(End of file - total 35 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button-tooltip.vue"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/controls-island/control-button-tooltip.vue</path>
<type>file</type>
<content>
1: <script setup lang="ts">
2: import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
3:
4: const { side = 'left', triggerClass = '' } = defineProps<{
5:   side?: 'top' | 'right' | 'bottom' | 'left'
6:   triggerClass?: string
7: }>()
8: </script>
9:
10: <template>
11:   <TooltipProvider
12:     :delay-duration="0"
13:     :skip-delay-duration="0"
14:   >
15:     <TooltipRoot>
16:       <TooltipTrigger as-child>
17:         <span
18:           data-testid="controls-button-wrapper"
19:           data-controls-button-wrapper
20:           :class="[
21:             'relative z-0 inline-flex items-center justify-center focus-within:z-20 hover:z-20',
22:             triggerClass,
23:           ]"
24:         >
25:           <slot />
26:         </span>
27:       </TooltipTrigger>
28:       <Transition name="fade">
29:         <TooltipContent
30:           data-testid="controls-tooltip"
31:           data-controls-tooltip
32:           :class="[
33:             'border-1 border-solid border-neutral-200/60 dark:border-neutral-800/10',
34:             'bg-neutral-50/80 dark:bg-neutral-800/70',
35:             'w-fit flex items-center self-end justify-center px-1.5 py-1',
36:             'rounded-lg backdrop-blur-md',
37:             'text-xs whitespace-nowrap',
38:             'z-[240] pointer-events-none',
39:           ]"
40:           :side="side"
41:           :side-offset="6"
42:         >
43:           <slot name="tooltip" />
44:         </TooltipContent>
45:       </Transition>
46:     </TooltipRoot>
47:   </TooltipProvider>
48: </template>
49:
50: <style scoped>
51: .fade-enter-active,
52: .fade-leave-active {
53:   transition: opacity 0.2s ease-in-out;
54: }
55:
56: .fade-enter-from,
57: .fade-leave-to {
58:   opacity: 0;
59: }
60:
61: .fade-enter-to,
62: .fade-leave-from {
63:   opacity: 1;
64: }
65: </style>

(End of file - total 65 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-companion-bubble.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-companion-bubble.ts</path>
<type>file</type>
<content>
1: import type { StudyCompanionPersisted } from '@proj-airi/stage-ui/stores/modules/study-companion'
2:
3: import type {
4:   BubbleKind,
5:   StudyBubblePayload,
6: } from './study-companion-bubble-copy-resolver'
7:
8: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
9: import { storeToRefs } from 'pinia'
10: import { computed, onScopeDispose, ref, watch } from 'vue'
11:
12: import {
13:   createStudyBubbleCopyHistory,
14:   createTaskOverloadBubblePayload,
15:   resolveStudyBubbleText,
16: } from './study-companion-bubble-copy-resolver'
17: import { useStudyReminderPolicy } from './use-study-reminder-policy'
18:
19: export type { BubbleKind, StudyBubbleCopyHistory, StudyBubblePayload } from './study-companion-bubble-copy-resolver'
20: export {
21:   createStudyBubbleCopyHistory,
22:   createTaskOverloadBubblePayload,
23:   resolveStudyBubbleText,
24:   STUDY_BUBBLE_COPY_BY_EVENT,
25: } from './study-companion-bubble-copy-resolver'
26:
27: export interface StudyBubbleMessage {
28:   id: string
29:   text: string
30:   kind: BubbleKind
31:   createdAt: number
32:   durationMs: number
33: }
34:
35: interface ShowBubbleOptions {
36:   kind?: BubbleKind
37:   durationMs?: number
38:   throttleKey?: string
39:   critical?: boolean
40:   throttleMs?: number
41: }
42:
43: export interface StudyBubblePolicyHistory {
44:   lastShownAtByKey: Map<string, number>
45:   lastShownAtByCopy: Map<string, number>
46: }
47:
48: export interface StudyBubblePolicyContext {
49:   mode: StudyCompanionPersisted['mode']
50:   isMuted: boolean
51:   now: number
52: }
53:
54: const DEFAULT_DURATION_MS = 4500
55: const DEFAULT_THROTTLE_MS = 30 * 1000
56: const SAME_COPY_COOLDOWN_MS = 30 * 1000
57:
58: export function createStudyBubblePolicyHistory(): StudyBubblePolicyHistory {
59:   return {
60:     lastShownAtByKey: new Map<string, number>(),
61:     lastShownAtByCopy: new Map<string, number>(),
62:   }
63: }
64:
65: export function shouldShowStudyBubble(
66:   payload: StudyBubblePayload,
67:   context: StudyBubblePolicyContext,
68:   history: StudyBubblePolicyHistory,
69: ): boolean {
70:   if (context.isMuted && !payload.critical && payload.throttleKey !== 'muted')
71:     return false
72:
73:   if (context.mode === 'focus' && !payload.critical && payload.throttleKey !== 'focus_started')
74:     return false
75:
76:   const throttleMs = payload.throttleMs ?? DEFAULT_THROTTLE_MS
77:   const lastShownAt = history.lastShownAtByKey.get(payload.throttleKey)
78:   if (lastShownAt != null && context.now - lastShownAt < throttleMs)
79:     return false
80:
81:   const lastCopyShownAt = history.lastShownAtByCopy.get(payload.text)
82:   if (lastCopyShownAt != null && context.now - lastCopyShownAt < SAME_COPY_COOLDOWN_MS)
83:     return false
84:
85:   history.lastShownAtByKey.set(payload.throttleKey, context.now)
86:   history.lastShownAtByCopy.set(payload.text, context.now)
87:   return true
88: }
89:
90: export function useStudyCompanionBubble() {
91:   const studyStore = useStudyCompanionStore()
92:   const { persisted, isMuted } = storeToRefs(studyStore)
93:
94:   // Keep existing reminder policy counters/logging alive while bubble becomes main presentation.
95:   useStudyReminderPolicy()
96:
97:   const currentBubble = ref<StudyBubbleMessage | null>(null)
98:   const lastHandledEventId = ref<string | null>(null)
99:   const copyHistory = createStudyBubbleCopyHistory()
100:   const policyHistory = createStudyBubblePolicyHistory()
101:   let hideTimer: ReturnType<typeof setTimeout> | null = null
102:
103:   const taskPending = computed(() => persisted.value.tasks.filter(task => !task.done).length)
104:
105:   function clearHideTimer() {
106:     if (hideTimer != null) {
107:       clearTimeout(hideTimer)
108:       hideTimer = null
109:     }
110:   }
111:
112:   function hideBubble() {
113:     currentBubble.value = null
114:     clearHideTimer()
115:   }
116:
117:   function showPayloadBubble(payload: StudyBubblePayload, durationMs = DEFAULT_DURATION_MS) {
118:     const now = Date.now()
119:     const allowed = shouldShowStudyBubble(payload, {
120:       mode: persisted.value.mode,
121:       isMuted: isMuted.value,
122:       now,
123:     }, policyHistory)
124:
125:     if (!allowed)
126:       return
127:
128:     currentBubble.value = {
129:       id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
130:       text: payload.text,
131:       kind: payload.kind,
132:       createdAt: now,
133:       durationMs,
134:     }
135:
136:     clearHideTimer()
137:     hideTimer = setTimeout(() => {
138:       hideBubble()
139:     }, durationMs)
140:   }
141:
142:   function showBubble(text: string, options: ShowBubbleOptions = {}) {
143:     const payload: StudyBubblePayload = {
144:       text,
145:       kind: options.kind ?? 'reminder',
146:       throttleKey: options.throttleKey ?? text,
147:       critical: options.critical ?? false,
148:       throttleMs: options.throttleMs,
149:     }
150:     showPayloadBubble(payload, options.durationMs ?? DEFAULT_DURATION_MS)
151:   }
152:
153:   watch(
154:     () => persisted.value.studyEvents.at(-1)?.id,
155:     (latestEventId) => {
156:       if (!latestEventId)
157:         return
158:
159:       const latestEvent = persisted.value.studyEvents.at(-1)
160:       if (!latestEvent)
161:         return
162:
163:       if (lastHandledEventId.value == null) {
164:         lastHandledEventId.value = latestEvent.id
165:         return
166:       }
167:
168:       if (latestEvent.id === lastHandledEventId.value)
169:         return
170:
171:       lastHandledEventId.value = latestEvent.id
172:
173:       const payload = resolveStudyBubbleText(latestEvent, persisted.value, copyHistory)
174:       if (!payload)
175:         return
176:
177:       showPayloadBubble(payload)
178:     },
179:     { flush: 'post' },
180:   )
181:
182:   watch(
183:     taskPending,
184:     (pending, previousPending) => {
185:       if (pending < 5)
186:         return
187:
188:       const crossedThreshold = (previousPending ?? 0) < 5
189:       if (!crossedThreshold && persisted.value.mode === 'focus')
190:         return
191:
192:       showPayloadBubble(createTaskOverloadBubblePayload(copyHistory))
193:     },
194:   )
195:
196:   onScopeDispose(() => {
197:     clearHideTimer()
198:   })
199:
200:   return {
201:     currentBubble,
202:     showBubble,
203:     hideBubble,
204:   }
205: }

(End of file - total 205 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro · 44.8s)

_Thinking:_

现在我已经读取了足够的关键文件来全面了解项目的当前状态。让我继续读取一些辅助文件来补充分析。

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts",
  "limit": 300,
  "offset": 201
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-interaction.ts</path>
<type>file</type>
<content>
201: const VIDEO_ELEMENT_ATTACH_TIMEOUT_MS = 1_500
202:
203: export function useVisionInteraction(options?: VisionInteractionOptions) {
204:   const runtimeOptions = {
205:     ...DEFAULT_OPTIONS,
206:     ...options,
207:   }
208:   const effectiveGestureInferenceIntervalMs = Math.max(40, Math.round(runtimeOptions.gestureInferenceIntervalMs))
209:   const effectiveGestureScoreThreshold = Math.min(0.9, Math.max(0.05, runtimeOptions.gestureScoreThreshold))
210:   const visionRuntime = useVisionRuntime()
211:
212:   const isEnabled = ref(false)
213:   const cameraState = ref<VisionCameraState>('off')
214:   const cameraPermissionState = ref<VisionCameraPermissionState>('unknown')
215:   const mediaPipeStatus = computed<VisionMediaPipeStatus>(() => visionRuntime.mediaPipeStatus.value)
216:   const facePresence = ref<VisionFacePresence>('unknown')
217:   const faceDirection = ref<VisionFaceDirection>('unknown')
218:   const faceCenter = ref<{ x: number, y: number } | null>(null)
219:   const subjectPosition = ref<VisionFaceDirection>('unknown')
220:   const lastStableSubjectPosition = ref<VisionFaceDirection>('unknown')
221:   const subjectPositionChangedAt = ref<number | null>(null)
222:   const subjectResponseState = ref<VisionSubjectResponseState>('idle')
223:   const lastSubjectResponseEvent = ref<VisionSubjectResponseEvent | null>(null)
224:   const subjectResponseCooldownUntil = ref(0)
225:   const enableExpressionSignals = ref(loadExpressionSignalsEnabled())
226:   const expressionSignal = ref<VisionExpressionSignal>('none')
227:   const expressionSignalCandidate = ref<VisionExpressionSignal>('none')
228:   const stableExpressionSignal = ref<VisionExpressionSignal>('none')
229:   const expressionSignalStableFrames = ref(0)
230:   const expressionSignalConfidence = ref(0)
231:   const expressionSignalReason = ref(enableExpressionSignals.value
232:     ? 'No stable expression signal.'
233:     : 'Expression signals are disabled.')
234:   const expressionSignalSource = ref<VisionExpressionSignalSource>('fallback')
235:   const expressionSignalChangedAt = ref<number | null>(null)
236:   const expressionSignalCooldownUntil = ref(0)
237:   const expressionSignalFeedbackAllowed = ref(false)
238:   const expressionSignalUnavailable = ref(false)
239:   const lastGesture = ref<VisionGesture>('none')
240:   const gestureControlsEnabled = ref(loadGestureControlsEnabled())
241:   const candidateGesture = ref<GestureCandidateGesture>('none')
242:   const stableGesture = ref<GestureCandidateGesture>('none')
243:   const gestureState = ref<GestureMachineState>('idle')
244:   const gestureConfidence = ref(0)
245:   const gestureVoteCount = ref(0)
246:   const gestureVoteWindowSize = ref(DEFAULT_GESTURE_STATE_MACHINE_CONFIG.voting.windowSize)
247:   const geometryPassRate = ref(0)
248:   const gestureQualityState = ref<VisionGestureQualityState>('unknown')
249:   const handSizeRatio = ref(0)
250:   const handInsideGuideArea = ref(false)
251:   const holdProgressMs = ref(0)
252:   const holdDurationMs = ref(0)
253:   const cooldownRemainingMs = ref(0)
254:   const releaseRequired = ref(false)
255:   const lastEvent = ref<VisionInteractionEvent | null>(null)
256:   const errorMessage = ref('')
257:   const lastInferenceAt = ref<number | null>(null)
258:
259:   const displayName = ref(loadDisplayName())
260:   const localCelebrationCount = ref(0)
261:   const acknowledgedEventId = ref<number | null>(null)
262:   const visionQuietUntil = ref(0)
263:   const quietRemainingMs = ref(0)
264:   const activePrompt = ref('')
265:
266:   const lastPresenceTransitionAt = ref<number | null>(null)
267:   const lastStableFaceDirection = ref<VisionFaceDirection>('unknown')
268:   const lastGestureTriggeredAt = ref<Record<'open_palm' | 'victory' | 'thumbs_up', number>>({
269:     open_palm: Number.NEGATIVE_INFINITY,
270:     victory: Number.NEGATIVE_INFINITY,
271:     thumbs_up: Number.NEGATIVE_INFINITY,
272:   })
273:
274:   const isVisionQuiet = computed(() => quietRemainingMs.value > 0)
275:   const maxInferenceStallMs = ref(runtimeOptions.maxInferenceStallMs)
276:   const modelWarmupStatus = computed<VisionModelWarmupStatus>(() => {
277:     if (visionRuntime.mediaPipeStatus.value === 'loading' || visionRuntime.runtimeStatus.value === 'warming')
278:       return 'warming'
279:     if (visionRuntime.mediaPipeStatus.value === 'ready' && visionRuntime.modelSource.value === 'remote')
280:       return 'fallback_remote'
281:     if (visionRuntime.mediaPipeStatus.value === 'ready')
282:       return 'ready'
283:     return 'idle'
284:   })
285:   const modelSource = visionRuntime.modelSource
286:   const modelProfile = visionRuntime.modelProfile
287:   const runtimeStatus = visionRuntime.runtimeStatus
288:   const runtimeWarmupDurationMs = visionRuntime.warmupDurationMs
289:   const runtimeRetryCount = visionRuntime.retryCount
290:   const runtimeLastError = visionRuntime.lastError
291:   const startTiming = ref<VisionStartTimingSnapshot>({
292:     startedAt: null,
293:     finishedAt: null,
294:     totalMs: null,
295:     readyForPreviewMs: null,
296:     permissionMs: null,
297:     videoPlayMs: null,
298:     recognizerInitMs: null,
299:     recognizerSource: 'unknown',
300:   })
301:   const cameraDiagnostics = ref<VisionCameraDiagnosticsSnapshot>({
302:     trackEndedCount: 0,
303:     unexpectedTrackEndedCount: 0,
304:     lastTrackEndedAt: null,
305:     lastTrackEndedTrackId: null,
306:     lastTrackEndedTrackLabel: null,
307:     lastTrackEndedIntentional: null,
308:     inferenceErrorCount: 0,
309:     consecutiveInferenceErrorCount: 0,
310:     lastInferenceErrorAt: null,
311:     lastInferenceErrorMessage: '',
312:   })
313:
314:   const stream = shallowRef<MediaStream | null>(null)
315:   const videoElement = shallowRef<HTMLVideoElement | null>(null)
316:   const latestFaceResult = shallowRef<FaceLandmarkerResult | null>(null)
317:
318:   const encryptedProfile = useEncryptedFaceProfile()
319:   const openCvFaceQuality = visionRuntime.getOpenCVRuntime()
320:   const gestureStateMachine = createGestureStateMachine(DEFAULT_GESTURE_STATE_MACHINE_CONFIG)
321:   const localFaceGate = useLocalFaceGate({
322:     stableFrames: runtimeOptions.stableFrames,
323:   })
324:
325:   const gateEnabled = ref(loadGateEnabled())
326:   localFaceGate.setGateEnabled(gateEnabled.value)
327:   if (encryptedProfile.unlockedProfile.value)
328:     localFaceGate.syncProfileFromPayload(encryptedProfile.unlockedProfile.value)
329:   if (encryptedProfile.hasEncryptedProfile.value && !encryptedProfile.unlockedProfile.value)
330:     localFaceGate.setLockedByProfile()
331:
332:   watch(
333:     () => encryptedProfile.unlockedProfile.value,
334:     (nextProfile) => {
335:       if (nextProfile) {
336:         localFaceGate.syncProfileFromPayload(nextProfile)
337:         return
338:       }
339:
340:       if (encryptedProfile.hasEncryptedProfile.value) {
341:         localFaceGate.setLockedByProfile()
342:         return
343:       }
344:
345:       localFaceGate.syncProfileFromPayload(null)
346:     },
347:     { immediate: true },
348:   )
349:
350:   let rafId: number | null = null
351:   let lastLoopAtMs = 0
352:
353:   let quietTickerId: number | null = null
354:   let nextEventId = 1
355:   let activePromptEventId: number | null = null
356:   let lastProcessedVideoTimeSec = -1
357:   let lastProcessedFrameTimestampMs = -1
358:
359:   let presentFrameStreak = 0
360:   let absentFrameStreak = 0
361:   let stablePresence: Exclude<VisionFacePresence, 'unknown'> | null = null
362:
363:   let candidateDirection: VisionFaceDirection = 'unknown'
364:   let candidateDirectionFrames = 0
365:   let expressionSignalCandidateFrames = 0
366:   let centeredDirectionStartedAt: number | null = null
367:   let awayDirectionStartedAt: number | null = null
368:   let awayDirectionCandidate: Exclude<VisionFaceDirection, 'unknown' | 'center'> | null = null
369:
370:   let previousGestureHandCenter: GestureQualityPoint | null = null
371:   let previousGestureHandTimestampMs: number | null = null
372:
373:   const cooldownByEventKey = new Map<string, number>()
374:   let isStoppingTracksIntentionally = false
375:   let lastInferenceErrorLoggedAt = Number.NEGATIVE_INFINITY
376:   let lastQualityEvaluatedAt = Number.NEGATIVE_INFINITY
377:   let cachedQualityMetrics: FaceSampleQuality | null = null
378:   let lastGestureInferenceAtMs = Number.NEGATIVE_INFINITY
379:   let lastUiYieldAtMs = Number.NEGATIVE_INFINITY
380:   let lastTimestampMismatchRecoveryAtMs = Number.NEGATIVE_INFINITY
381:   let isRecoveringFromTimestampMismatch = false
382:   let streamLifecycleToken = 0
383:   const trackedCameraStreams = new Set<MediaStream>()
384:   let cameraPermissionStatus: PermissionStatus | null = null
385:
386:   function invalidateStreamLifecycle() {
387:     streamLifecycleToken += 1
388:   }
389:
390:   function nowMs() {
391:     if (typeof performance !== 'undefined' && typeof performance.now === 'function')
392:       return performance.now()
393:     return Date.now()
394:   }
395:
396:   function roundedMs(value: number | null) {
397:     if (value === null || !Number.isFinite(value))
398:       return null
399:     return Math.round(value * 10) / 10
400:   }
401:
402:   function nextMonotonicInferenceTimestampMs(frameNowMs: number) {
403:     const candidateTimestampMs = Math.floor(frameNowMs)
404:     const floorTimestampMs = lastProcessedFrameTimestampMs
405:     const nextTimestampMs = candidateTimestampMs > floorTimestampMs
406:       ? candidateTimestampMs
407:       : (floorTimestampMs + 1)
408:     lastProcessedFrameTimestampMs = nextTimestampMs
409:     return nextTimestampMs
410:   }
411:
412:   function isTimestampMismatchInferenceError(message: string) {
413:     const normalizedMessage = message.toLowerCase()
414:     return normalizedMessage.includes('packet timestamp mismatch')
415:       || normalizedMessage.includes('current minimum expected timestamp')
416:       || (normalizedMessage.includes('minimum expected timestamp') && normalizedMessage.includes('received 0'))
417:   }
418:
419:   function resetStartTiming() {
420:     startTiming.value = {
421:       startedAt: null,
422:       finishedAt: null,
423:       totalMs: null,
424:       readyForPreviewMs: null,
425:       permissionMs: null,
426:       videoPlayMs: null,
427:       recognizerInitMs: null,
428:       recognizerSource: modelSource.value,
429:     }
430:   }
431:
432:   function resetCameraDiagnostics() {
433:     cameraDiagnostics.value = {
434:       trackEndedCount: 0,
435:       unexpectedTrackEndedCount: 0,
436:       lastTrackEndedAt: null,
437:       lastTrackEndedTrackId: null,
438:       lastTrackEndedTrackLabel: null,
439:       lastTrackEndedIntentional: null,
440:       inferenceErrorCount: 0,
441:       consecutiveInferenceErrorCount: 0,
442:       lastInferenceErrorAt: null,
443:       lastInferenceErrorMessage: '',
444:     }
445:     lastInferenceErrorLoggedAt = Number.NEGATIVE_INFINITY
446:   }
447:
448:   function markInferenceSuccess() {
449:     if (cameraDiagnostics.value.consecutiveInferenceErrorCount === 0)
450:       return
451:     cameraDiagnostics.value = {
452:       ...cameraDiagnostics.value,
453:       consecutiveInferenceErrorCount: 0,
454:       lastInferenceErrorMessage: '',
455:     }
456:   }
457:
458:   function recordInferenceError(error: unknown) {
459:     const message = errorMessageFrom(error) ?? 'Vision inference failed'
460:     const now = Date.now()
461:     cameraDiagnostics.value = {
462:       ...cameraDiagnostics.value,
463:       inferenceErrorCount: cameraDiagnostics.value.inferenceErrorCount + 1,
464:       consecutiveInferenceErrorCount: cameraDiagnostics.value.consecutiveInferenceErrorCount + 1,
465:       lastInferenceErrorAt: now,
466:       lastInferenceErrorMessage: message,
467:     }
468:
469:     if (now - lastInferenceErrorLoggedAt >= INFERENCE_ERROR_LOG_COOLDOWN_MS) {
470:       lastInferenceErrorLoggedAt = now
471:       console.warn('[vision] inference error', {
472:         message,
473:         inferenceErrorCount: cameraDiagnostics.value.inferenceErrorCount,
474:         consecutiveInferenceErrorCount: cameraDiagnostics.value.consecutiveInferenceErrorCount,
475:       })
476:     }
477:
478:     return message
479:   }
480:
481:   function recordTrackEnded(track: MediaStreamTrack) {
482:     const now = Date.now()
483:     const intentional = isStoppingTracksIntentionally
484:     cameraDiagnostics.value = {
485:       ...cameraDiagnostics.value,
486:       trackEndedCount: cameraDiagnostics.value.trackEndedCount + 1,
487:       unexpectedTrackEndedCount: intentional
488:         ? cameraDiagnostics.value.unexpectedTrackEndedCount
489:         : (cameraDiagnostics.value.unexpectedTrackEndedCount + 1),
490:       lastTrackEndedAt: now,
491:       lastTrackEndedTrackId: track.id || null,
492:       lastTrackEndedTrackLabel: track.label || null,
493:       lastTrackEndedIntentional: intentional,
494:     }
495:
496:     console.warn('[vision] video track ended', {
497:       intentional,
498:       trackId: track.id,
499:       trackLabel: track.label,
500:       trackReadyState: track.readyState,

(Showing lines 201-500 of 2605. Use offset=501 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-stage-feedback.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-stage-feedback.ts</path>
<type>file</type>
<content>
1: import type { StudyCompanionMode, StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'
2:
3: import { Emotion, EMOTION_EmotionMotionName_value, EmotionNeutralMotionName } from '@proj-airi/stage-ui-live2d/constants/emotions'
4: import { useLive2d } from '@proj-airi/stage-ui/stores/live2d'
5: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
6: import { storeToRefs } from 'pinia'
7: import { watch } from 'vue'
8:
9: /**
10:  * Maps Study Companion state to the closest AIRI emotion.
11:  *
12:  * Before:
13:  * - "focus"
14:  * - "task_completed"
15:  *
16:  * After:
17:  * - "think"
18:  * - "happy"
19:  */
20: export function resolveStudyFeedbackEmotion(input: StudyCompanionMode | StudyEventLogEntry['type'], muted: boolean): Emotion {
21:   // Muted study mode should keep Rin calm even when completion events arrive.
22:   // This lets member 5's low-interruption policy remain the stronger signal.
23:   if (muted)
24:     return Emotion.Neutral
25:
26:   // Long-lived Pomodoro states become ambient posture/emotion cues.
27:   if (input === 'focus')
28:     return Emotion.Think
29:   if (input === 'break')
30:     return Emotion.Curious
31:   if (input === 'paused')
32:     return Emotion.Question
33:
34:   // Momentary events use brighter feedback so users can notice task progress
35:   // without requiring a toast or modal interruption.
36:   if (input === 'focus_completed' || input === 'break_completed' || input === 'task_completed')
37:     return Emotion.Happy
38:   if (input === 'task_overload')
39:     return Emotion.Awkward
40:
41:   return Emotion.Neutral
42: }
43:
44: function isMomentaryFeedbackEvent(type: StudyEventLogEntry['type']): boolean {
45:   // Only positive/attention events should override the ambient mode watcher.
46:   // Lifecycle events like focus_started are already represented by `mode`.
47:   return type === 'focus_completed'
48:     || type === 'break_completed'
49:     || type === 'task_completed'
50:     || type === 'task_overload'
51: }
52:
53: /**
54:  * Drives Live2D peripheral feedback from the Study Companion store.
55:  *
56:  * Use when:
57:  * - The desktop stage should visibly reflect study mode changes.
58:  * - Study completion or task events should produce brief character feedback.
59:  *
60:  * Expects:
61:  * - {@link useStudyCompanionStore} is the only source of learning state.
62:  * - Live2D motions may be absent on some models, so motion names need fallback.
63:  *
64:  * Returns:
65:  * - A stop handle that disposes the internal watchers.
66:  */
67: export function useStudyStageFeedback() {
68:   const studyStore = useStudyCompanionStore()
69:   const { currentMotion, availableMotions } = storeToRefs(useLive2d())
70:
71:   function resolveMotionGroup(emotion: Emotion): string {
72:     const preferred = EMOTION_EmotionMotionName_value[emotion] ?? EmotionNeutralMotionName
73:     const availableGroups = new Set(availableMotions.value.map(motion => motion.motionName))
74:
75:     // NOTICE:
76:     // Live2D models are user-provided and do not always include AIRI's named emotion motions.
77:     // The current Live2D model component catches failed motion calls, but choosing a known
78:     // group here keeps study feedback stable instead of repeatedly requesting missing motions.
79:     // Source/context: packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue setMotion().
80:     // Removal condition: remove this fallback once model-level emotion mapping is configurable.
81:     if (availableGroups.size === 0 || availableGroups.has(preferred))
82:       return preferred
83:     if (availableGroups.has(EmotionNeutralMotionName))
84:       return EmotionNeutralMotionName
85:
86:     return availableMotions.value[0]?.motionName ?? EmotionNeutralMotionName
87:   }
88:
89:   function applyEmotion(emotion: Emotion) {
90:     // Live2D Model.vue observes `currentMotion` and performs the actual model call.
91:     // Keeping this composable at the store layer avoids coupling study feedback to Pixi.
92:     currentMotion.value = { group: resolveMotionGroup(emotion) }
93:   }
94:
95:   const stopModeWatch = watch(
96:     () => [studyStore.persisted.mode, studyStore.persisted.mutedUntil] as const,
97:     ([mode]) => applyEmotion(resolveStudyFeedbackEmotion(mode, studyStore.isMuted)),
98:     { immediate: true },
99:   )
100:
101:   const stopEventWatch = watch(
102:     () => studyStore.persisted.studyEvents.at(-1)?.type,
103:     (type) => {
104:       if (!type || !isMomentaryFeedbackEvent(type))
105:         return
106:
107:       // Completion/task events are short feedback pulses layered on top of the
108:       // current mode. The next mode/mute change will restore ambient feedback.
109:       applyEmotion(resolveStudyFeedbackEmotion(type, studyStore.isMuted))
110:     },
111:   )
112:
113:   return () => {
114:     stopModeWatch()
115:     stopEventWatch()
116:   }
117: }

(End of file - total 117 lines)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/study-companion-bubble-copy-resolver*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/study-companion-bubble-copy-resolver.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.test.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/stores/controls-island*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/stores/controls-island.test.ts
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/stores/controls-island.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "apps/stage-tamagotchi/src/renderer/pages/settings/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/study/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/system/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/system/window-shortcuts.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/system/developer.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/system/general.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/models/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/modules/mcp.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/data/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/connection/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/connection/server-channel-qr-card.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/account/index.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/data/components/desktop-folder-section.vue
/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/pages/settings/data/components/desktop-reset-section.vue
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "docs/**/*"
}
```

**Output:**
```
/Users/lifulin/Downloads/Rin/docs/branch-progress/2026-05-07-feature-vision-interaction-experiment.md
/Users/lifulin/Downloads/Rin/docs/node_modules/.bin/vitepress
/Users/lifulin/Downloads/Rin/docs/node_modules/.bin/tsx
/Users/lifulin/Downloads/Rin/docs/node_modules/.bin/markdown-it
/Users/lifulin/Downloads/Rin/docs/node_modules/.bin/vue-tsc
/Users/lifulin/Downloads/Rin/docs/.DS_Store
/Users/lifulin/Downloads/Rin/docs/node_modules/.DS_Store
/Users/lifulin/Downloads/Rin/docs/.vitepress/.DS_Store
/Users/lifulin/Downloads/Rin/docs/wechat.md
/Users/lifulin/Downloads/Rin/docs/uno.config.ts
/Users/lifulin/Downloads/Rin/docs/netlify.toml
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/references/research/gaming/minecraft.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/references/research/mocap.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/references/research/text-to-motion.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/references/research/lipsync.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/references/research/tts.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/docs/contributing/tamagotchi.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/docs/contributing/webui.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/docs/contributing/design-guidelines/resources.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/docs/contributing/design-guidelines/tools.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/docs/contributing/design-guidelines/index.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/about/terms.md
/Users/lifulin/Downloads/Rin/docs/content/zh-Hans/about/privacy.md
/Users/lifulin/Downloads/Rin/docs/README.ru-RU.md
/Users/lifulin/Downloads/Rin/docs/README.fr.md
/Users/lifulin/Downloads/Rin/docs/.vitepress/utils/utils.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/utils/cache.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/utils/flatten.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/theme-vitepress.css
/Users/lifulin/Downloads/Rin/docs/README.ja-JP.md
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/theme-kbd.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/theme-animations.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/theme-media.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/custom-nixie.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/theme-markdown.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/style.css
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/index.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/theme/config.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/meta.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/plugins/vite-frontmatter-assets.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/functions/blog.data.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/functions/chronicles.data.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/modules/posthog.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/functions/all-documents.data.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/custom/Showcase.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/custom/Layout.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/data/releases.data.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/custom/Docs.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/constants.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/config.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/contributor-names.json
/Users/lifulin/Downloads/Rin/docs/.vitepress/contributors.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/edit-link.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/outline.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/prev-next.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/theme-color.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/sidebar.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/composables/date.ts
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Snowfall.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ThemedVideo.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ThemeToggle.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/SearchCommandBox.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/SearchTrigger.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Spinner.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ParallaxCoverHalloween20251029.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ReleasesList.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ParallaxCover.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ReleaseDownloads.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/ParallaxCoverChristmas20251224.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/NavbarLanguage.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Navbar.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/HomeButtonSet.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Home.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/MotionToggle.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/NavbarLanguageSubMenu.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/HomeButton.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocSidebar.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocSidebarItem.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocTopbar.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DropdownMenu.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocOutline.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocFooter.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocCarbonAds.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocCommunity.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocOutlineItem.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Contributors.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/DocFooterLastUpdated.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Banner.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/CardLink.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/BlogPosts.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Chip.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Button.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/components/Chronicles.vue
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-patterns-ghost.svg
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-patterns-lollipop.svg
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-cover-2025-12-24.avif
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-cover-2025-12-24-bg.avif
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-cover-2025-10-29.avif
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-cover-2025-10-29-bg.avif
/Users/lifulin/Downloads/Rin/docs/.vitepress/assets/home-cover-2025-07-23.avif

(Results are truncated: showing first 100 results. Consider using a more specific path or pattern.)
```

---

## Assistant (Build · MiMo-V2.5-Pro · 21.1s)

_Thinking:_

现在我已经读取了足够的关键文件来全面了解项目的当前状态。让我继续读取一些辅助文件来补充分析。

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/stores/controls-island.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/stores/controls-island.ts</path>
<type>file</type>
<content>
1: import { useLocalStorage } from '@vueuse/core'
2: import { defineStore } from 'pinia'
3: import { ref } from 'vue'
4:
5: export const useControlsIslandStore = defineStore('controls-island', () => {
6:   // Persist fade-on-hover preference per user
7:   const fadeOnHoverEnabled = useLocalStorage<boolean>('controls-island/fade-on-hover-enabled', false)
8:   const moveModeEnabled = useLocalStorage<boolean>('controls-island/move-mode-enabled', false)
9:   const controlsUIMode = useLocalStorage<'novice' | 'expert'>('controls-island/ui-mode', 'novice')
10:   const controlsPanelExpanded = ref(false)
11:   const dontShowItAgainNoticeFadeOnHover = useLocalStorage<boolean>('preferences/dont-show-it-again/notice/fade-on-hover', false)
12:
13:   function enableFadeOnHover() {
14:     fadeOnHoverEnabled.value = true
15:   }
16:
17:   function disableFadeOnHover() {
18:     fadeOnHoverEnabled.value = false
19:   }
20:
21:   function toggleMoveMode() {
22:     moveModeEnabled.value = !moveModeEnabled.value
23:   }
24:
25:   function setControlsUIMode(mode: 'novice' | 'expert') {
26:     controlsUIMode.value = mode
27:   }
28:
29:   function toggleControlsUIMode() {
30:     controlsUIMode.value = controlsUIMode.value === 'novice' ? 'expert' : 'novice'
31:   }
32:
33:   function toggleControlsPanel() {
34:     controlsPanelExpanded.value = !controlsPanelExpanded.value
35:   }
36:
37:   function setControlsPanelExpanded(expanded: boolean) {
38:     controlsPanelExpanded.value = expanded
39:   }
40:
41:   return {
42:     fadeOnHoverEnabled,
43:     moveModeEnabled,
44:     controlsUIMode,
45:     controlsPanelExpanded,
46:     dontShowItAgainNoticeFadeOnHover,
47:     enableFadeOnHover,
48:     disableFadeOnHover,
49:     toggleMoveMode,
50:     setControlsUIMode,
51:     toggleControlsUIMode,
52:     toggleControlsPanel,
53:     setControlsPanelExpanded,
54:   }
55: })

(End of file - total 55 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/study-companion-bubble-copy-resolver.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/study-companion-bubble-copy-resolver.ts</path>
<type>file</type>
<content>
1: import type { StudyCompanionPersisted, StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'
2:
3: export type BubbleKind = 'focus' | 'break' | 'task' | 'reminder' | 'quiet'
4:
5: export interface StudyBubblePayload {
6:   text: string
7:   kind: BubbleKind
8:   throttleKey: string
9:   critical: boolean
10:   throttleMs?: number
11: }
12:
13: export interface StudyBubbleCopyHistory {
14:   recentCopyMemory: Map<string, string[]>
15:   usedCopyMemory: Map<string, Set<string>>
16: }
17:
18: const TASK_OVERLOAD_THROTTLE_MS = 5 * 60 * 1000
19:
20: export const STUDY_BUBBLE_COPY_BY_EVENT: Record<string, string[]> = {
21:   focus_started: [
22:     '好，先专注一小会儿。',
23:     '我会安静陪着你。',
24:     '开始啦，把注意力轻轻放回这一件事上。',
25:     '先把手头的事做完吧，一件一件来。',
26:     '慢慢进入状态就好，不用急。',
27:     '慢慢来，不着急，我就在这里。',
28:     '把注意力轻轻收回来，我们开始了。',
29:     '放轻松，这一段时间只属于你。',
30:   ],
31:   focus_started_demo: [
32:     '演示模式已开，我们先体验一小轮。',
33:     '演示节奏开始啦，先专注这一分钟就好。',
34:     '先热热身，熟悉一下节奏。',
35:     '我们先温柔地走一小轮，不赶时间。',
36:     '不着急，慢慢熟悉就好。',
37:     '先感受一下，不用有压力。',
38:     '这只是体验，放轻松就好。',
39:   ],
40:   session_paused: [
41:     '暂停一下也没关系，回来继续就好。',
42:     '先停在这里，我帮你记着进度呢。',
43:     '先缓一缓，等你准备好了再继续。',
44:     '临时停一下，我们稍后接上。',
45:     '暂停也是过程的一部分，不用着急。',
46:     '没关系，休息一下再继续也不迟。',
47:     '我在这儿等你，什么时候回来都可以。',
48:   ],
49:   session_resumed: [
50:     '欢迎回来，我们接着做。',
51:     '好，按原来的节奏继续就好。',
52:     '不急，我们慢慢回到刚才的节奏。',
53:     '回来了就好，继续吧。',
54:     '状态找回来了吗？我们慢慢开始。',
55:     '没关系，从哪里接上都可以。',
56:     '我一直在，我们继续。',
57:   ],
58:   focus_reset: [
59:     '这一轮先重来，没关系的。',
60:     '重新开始也是一种调整呢。',
61:     '先重置一下，再稳稳地开始。',
62:     '这一段我们再来一次，不着急。',
63:     '没关系，重新来过也挺好的。',
64:     '清空一下，我们再试一次。',
65:     '不必在意，我们重新开始就好。',
66:   ],
67:   focus_completed: [
68:     '这一轮完成了，先让眼睛休息一下吧。',
69:     '完成一轮，做得不错。可以短暂离开屏幕了。',
70:     '专注结束，喝口水再回来吧。',
71:     '这一段收尾了，稍微放松一下。',
72:     '这一轮拿下了，先活动活动吧。',
73:     '辛苦啦，给自己一个小小的停顿。',
74:     '做得很好，现在属于你自己的时间到了。',
75:   ],
76:   break_started: [
77:     '休息时间到了，别盯着屏幕啦。',
78:     '短暂休息一下，我在这儿等你回来。',
79:     '活动一下肩颈，再继续也不迟。',
80:     '先离开屏幕片刻，待会儿继续。',
81:     '休息这一段，让注意力慢慢回一回。',
82:     '放下手头的事，给自己喘口气。',
83:     '这是属于你的休息时间，不用想别的。',
84:   ],
85:   break_completed: [
86:     '休息结束，可以准备下一轮了。',
87:     '回来啦，要不要继续一小段？',
88:     '状态恢复一点了吗？可以开始下一轮了。',
89:     '这一段休息完成了，我们接着来。',
90:     '准备好了就继续，我在这儿等你。',
91:     '感觉好些了吗？我们随时可以开始。',
92:     '休息够了的话，我们慢慢进入状态吧。',
93:   ],
94:   task_completed: [
95:     '完成一项，继续保持这个节奏。',
96:     '这项任务已经拿下了，真不错。',
97:     '很好，清单又少了一项呢。',
98:     '做得好，这项已经完成啦。',
99:     '这一项结束了，节奏保持得不错。',
100:     '又迈出了一小步，继续加油。',
101:     '完成的感觉很好吧？我们慢慢来。',
102:   ],
103:   task_overload: [
104:     '任务有点多，先选一项开始就好。',
105:     '先别被清单吓到，挑最小的一步开始。',
106:     '先做最关键的一项吧。',
107:     '先挑一项最小动作，马上动起来。',
108:     '不用想全部，先做眼前这一件。',
109:     ' overwhelmed 的时候，从最小的一步开始。',
110:     '清单很长，但一次只做一件就够了。',
111:   ],
112:   muted: [
113:     '好，我先安静一会儿。',
114:     '收到，接下来少打扰你。',
115:     '明白了，我会更克制地提醒。',
116:     '已切换到静音陪伴模式。',
117:     '我会安静地陪着你，有需要随时叫我。',
118:     '好，我在旁边，不打扰你。',
119:     '知道了，需要的时候我就在。',
120:   ],
121: }
122:
123: function pickCopyWithHistory(eventKey: string, candidates: string[], history: StudyBubbleCopyHistory): string {
124:   const recent = history.recentCopyMemory.get(eventKey) ?? []
125:   const used = history.usedCopyMemory.get(eventKey) ?? new Set<string>()
126:   const unseen = candidates.filter(text => !used.has(text))
127:   const preferredPool = unseen.length > 0 ? unseen : candidates
128:   const available = preferredPool.filter(text => !recent.includes(text))
129:   const pool = available.length > 0 ? available : preferredPool
130:   const index = Math.floor(Math.random() * pool.length)
131:   const selected = pool[index] ?? pool[0] ?? ''
132:
133:   used.add(selected)
134:   history.usedCopyMemory.set(eventKey, used)
135:
136:   const nextRecent = [...recent, selected].slice(-2)
137:   history.recentCopyMemory.set(eventKey, nextRecent)
138:
139:   return selected
140: }
141:
142: function getTaskPending(snapshot: StudyCompanionPersisted): number {
143:   return snapshot.tasks.filter(task => !task.done).length
144: }
145:
146: export function createStudyBubbleCopyHistory(): StudyBubbleCopyHistory {
147:   return {
148:     recentCopyMemory: new Map<string, string[]>(),
149:     usedCopyMemory: new Map<string, Set<string>>(),
150:   }
151: }
152:
153: export function resolveStudyBubbleText(
154:   event: StudyEventLogEntry | { type: string },
155:   snapshot: StudyCompanionPersisted,
156:   history: StudyBubbleCopyHistory,
157: ): StudyBubblePayload | null {
158:   if (event.type === 'focus_started') {
159:     const nextRound = snapshot.todayFocusSessions + 1
160:     if (snapshot.todayFocusSessions === 0) {
161:       return {
162:         text: '第一轮开始，先进入状态。',
163:         kind: 'focus',
164:         throttleKey: 'focus_started',
165:         critical: false,
166:       }
167:     }
168:
169:     if (snapshot.todayFocusSessions >= 2) {
170:       return {
171:         text: `第 ${nextRound} 轮开始，节奏很不错。`,
172:         kind: 'focus',
173:         throttleKey: 'focus_started',
174:         critical: false,
175:       }
176:     }
177:
178:     const copyKey = snapshot.demoModeEnabled ? 'focus_started_demo' : 'focus_started'
179:     return {
180:       text: pickCopyWithHistory(copyKey, STUDY_BUBBLE_COPY_BY_EVENT[copyKey]!, history),
181:       kind: 'focus',
182:       throttleKey: 'focus_started',
183:       critical: false,
184:     }
185:   }
186:
187:   if (event.type === 'session_paused') {
188:     return {
189:       text: pickCopyWithHistory('session_paused', STUDY_BUBBLE_COPY_BY_EVENT.session_paused, history),
190:       kind: 'focus',
191:       throttleKey: 'session_paused',
192:       critical: false,
193:     }
194:   }
195:
196:   if (event.type === 'session_resumed') {
197:     return {
198:       text: pickCopyWithHistory('session_resumed', STUDY_BUBBLE_COPY_BY_EVENT.session_resumed, history),
199:       kind: 'focus',
200:       throttleKey: 'session_resumed',
201:       critical: false,
202:     }
203:   }
204:
205:   if (event.type === 'focus_reset') {
206:     return {
207:       text: pickCopyWithHistory('focus_reset', STUDY_BUBBLE_COPY_BY_EVENT.focus_reset, history),
208:       kind: 'focus',
209:       throttleKey: 'focus_reset',
210:       critical: false,
211:     }
212:   }
213:
214:   if (event.type === 'focus_completed') {
215:     if (snapshot.todayFocusSessions >= 2) {
216:       return {
217:         text: `今天已经完成 ${snapshot.todayFocusSessions} 轮了，节奏很好。`,
218:         kind: 'focus',
219:         throttleKey: 'focus_completed',
220:         critical: true,
221:       }
222:     }
223:     if (snapshot.todayFocusMinutes >= 50) {
224:       return {
225:         text: `今天已累计 ${snapshot.todayFocusMinutes} 分钟，状态很好。`,
226:         kind: 'focus',
227:         throttleKey: 'focus_completed',
228:         critical: true,
229:       }
230:     }
231:
232:     return {
233:       text: pickCopyWithHistory('focus_completed', STUDY_BUBBLE_COPY_BY_EVENT.focus_completed, history),
234:       kind: 'focus',
235:       throttleKey: 'focus_completed',
236:       critical: true,
237:     }
238:   }
239:
240:   if (event.type === 'break_started') {
241:     return {
242:       text: pickCopyWithHistory('break_started', STUDY_BUBBLE_COPY_BY_EVENT.break_started, history),
243:       kind: 'break',
244:       throttleKey: 'break_started',
245:       critical: false,
246:     }
247:   }
248:
249:   if (event.type === 'break_completed') {
250:     if (snapshot.demoModeEnabled) {
251:       return {
252:         text: '演示休息结束了，我们继续下一轮。',
253:         kind: 'break',
254:         throttleKey: 'break_completed',
255:         critical: true,
256:       }
257:     }
258:
259:     return {
260:       text: pickCopyWithHistory('break_completed', STUDY_BUBBLE_COPY_BY_EVENT.break_completed, history),
261:       kind: 'break',
262:       throttleKey: 'break_completed',
263:       critical: true,
264:     }
265:   }
266:
267:   if (event.type === 'task_completed') {
268:     const pending = getTaskPending(snapshot)
269:     if (pending === 0) {
270:       return {
271:         text: '今日任务清空了，可以轻松一点。',
272:         kind: 'task',
273:         throttleKey: 'task_completed',
274:         critical: true,
275:       }
276:     }
277:
278:     if (pending > 0) {
279:       return {
280:         text: `还剩 ${pending} 项，先挑最重要的一项。`,
281:         kind: 'task',
282:         throttleKey: 'task_completed',
283:         critical: true,
284:       }
285:     }
286:
287:     return {
288:       text: pickCopyWithHistory('task_completed', STUDY_BUBBLE_COPY_BY_EVENT.task_completed, history),
289:       kind: 'task',
290:       throttleKey: 'task_completed',
291:       critical: true,
292:     }
293:   }
294:
295:   if (event.type === 'muted') {
296:     return {
297:       text: pickCopyWithHistory('muted', STUDY_BUBBLE_COPY_BY_EVENT.muted, history),
298:       kind: 'quiet',
299:       throttleKey: 'muted',
300:       critical: true,
301:     }
302:   }
303:
304:   return null
305: }
306:
307: export function createTaskOverloadBubblePayload(history: StudyBubbleCopyHistory): StudyBubblePayload {
308:   return {
309:     text: pickCopyWithHistory('task_overload', STUDY_BUBBLE_COPY_BY_EVENT.task_overload, history),
310:     kind: 'task',
311:     throttleKey: 'task_overload',
312:     critical: false,
313:     throttleMs: TASK_OVERLOAD_THROTTLE_MS,
314:   }
315: }

(End of file - total 315 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-study-reminder-policy.ts</path>
<type>file</type>
<content>
1: import type { StudyCompanionMode } from '@proj-airi/stage-ui/stores/modules/study-companion'
2:
3: import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
4: import { storeToRefs } from 'pinia'
5: import { computed, onScopeDispose, ref, watch } from 'vue'
6:
7: /**
8:  * Reminder type produced by the policy when a key transition occurs.
9:  *
10:  * Use when:
11:  * - Displaying a toast notification in the Study Island panel
12:  *
13:  * Expects:
14:  * - The consumer reads `currentReminder` and renders the message
15:  * - The consumer calls `dismissReminder()` to clear the toast
16:  */
17: export interface StudyReminder {
18:   id: number
19:   message: string
20:   type: 'focus_completed' | 'break_completed' | 'task_completed'
21:   timestamp: number
22: }
23:
24: /** Minimum gap between two consecutive reminders in milliseconds. */
25: const THROTTLE_INTERVAL_MS = 30 * 1000
26:
27: /** How long a toast stays visible before auto-dismiss in milliseconds. */
28: const AUTO_DISMISS_MS = 4000
29:
30: /**
31:  * Low-interruption reminder policy for the study companion.
32:  *
33:  * Use when:
34:  * - The Study Island UI needs to show non-intrusive toasts at key moments
35:  * - The system must respect mute state, focus-period suppression, and throttling
36:  *
37:  * Expects:
38:  * - `study-companion` store is initialized
39:  * - Consumer renders `currentReminder` and handles `dismissReminder`
40:  *
41:  * Returns:
42:  * - `currentReminder`: the active reminder to display, or null
43:  * - `dismissReminder()`: manually dismiss the current reminder
44:  * - `todayReminderCount`: how many reminders were shown today
45:  */
46: export function useStudyReminderPolicy() {
47:   const store = useStudyCompanionStore()
48:   const { isMuted, persisted } = storeToRefs(store)
49:
50:   const currentReminder = ref<StudyReminder | null>(null)
51:   let lastReminderAt = 0
52:   let nextId = 1
53:   let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
54:
55:   const todayReminderCount = computed(() => persisted.value.todayReminderCount)
56:
57:   function clearAutoDismissTimer() {
58:     if (autoDismissTimer !== null) {
59:       clearTimeout(autoDismissTimer)
60:       autoDismissTimer = null
61:     }
62:   }
63:
64:   function dismissReminder() {
65:     currentReminder.value = null
66:     clearAutoDismissTimer()
67:   }
68:
69:   /**
70:    * Decide whether a reminder should fire and, if so, show it.
71:    *
72:    * Suppression rules (checked in order):
73:    * 1. User has muted reminders → skip
74:    * 2. Throttle window has not elapsed since last reminder → skip
75:    * 3. All checks pass → show reminder, bump counter, start auto-dismiss
76:    */
77:   function tryShowReminder(message: string, type: StudyReminder['type']) {
78:     if (isMuted.value)
79:       return
80:
81:     const now = Date.now()
82:     if (now - lastReminderAt < THROTTLE_INTERVAL_MS)
83:       return
84:
85:     lastReminderAt = now
86:     persisted.value.todayReminderCount += 1
87:     store.appendEvent('reminder_shown', { message, type })
88:
89:     clearAutoDismissTimer()
90:
91:     currentReminder.value = {
92:       id: nextId++,
93:       message,
94:       type,
95:       timestamp: now,
96:     }
97:
98:     autoDismissTimer = setTimeout(() => {
99:       dismissReminder()
100:     }, AUTO_DISMISS_MS)
101:   }
102:
103:   // Watch mode transitions to trigger reminders at key moments
104:   watch(
105:     () => persisted.value.mode,
106:     (newMode: StudyCompanionMode, oldMode: StudyCompanionMode | undefined) => {
107:       if (oldMode === undefined)
108:         return
109:
110:       if (oldMode === 'focus' && newMode === 'break') {
111:         tryShowReminder('Focus complete! Time for a break.', 'focus_completed')
112:       }
113:
114:       if (oldMode === 'break' && newMode === 'idle') {
115:         tryShowReminder('Break is over. Ready to focus?', 'break_completed')
116:       }
117:     },
118:   )
119:
120:   watch(
121:     () => persisted.value.studyEvents.at(-1)?.id,
122:     () => {
123:       const latestEvent = persisted.value.studyEvents.at(-1)
124:       if (!latestEvent || latestEvent.type !== 'task_completed')
125:         return
126:
127:       tryShowReminder('Task completed. Keep it up!', 'task_completed')
128:     },
129:   )
130:
131:   onScopeDispose(() => {
132:     clearAutoDismissTimer()
133:   })
134:
135:   return {
136:     currentReminder,
137:     dismissReminder,
138:     todayReminderCount,
139:   }
140: }

(End of file - total 140 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/utils/vision-expression-signals.ts</path>
<type>file</type>
<content>
1: export type VisionExpressionSignal
2:   = | 'none'
3:     | 'smile_like_signal'
4:     | 'stable_face_signal'
5:     | 'looking_away_signal'
6:     | 'unclear_face_signal'
7:     | 'low_confidence'
8:
9: export type VisionExpressionSignalSource
10:   = | 'blendshape'
11:     | 'position'
12:     | 'quality'
13:     | 'fallback'
14:
15: export interface VisionExpressionBlendshapeCategory {
16:   categoryName: string
17:   score: number
18: }
19:
20: export interface ResolveVisionExpressionSignalInput {
21:   blendshapes?: VisionExpressionBlendshapeCategory[]
22:   blendshapeOutputAvailable?: boolean
23:   hasLandmarks?: boolean
24:   facePresence: 'present' | 'absent' | 'unknown'
25:   faceDirection: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
26:   qualityScore?: number
27:   faceCenter?: { x: number, y: number } | null
28:   centeredDurationMs?: number
29:   awayDurationMs?: number
30: }
31:
32: export interface VisionExpressionSignalResult {
33:   signal: VisionExpressionSignal
34:   confidence: number
35:   reason: string
36:   source: VisionExpressionSignalSource
37: }
38:
39: const SMILE_SIGNAL_THRESHOLD = 0.45
40: const STABLE_FACE_QUALITY_THRESHOLD = 0.65
41: const UNCLEAR_QUALITY_THRESHOLD = 0.35
42: const STABLE_FACE_CENTERED_DURATION_MS = 3_000
43: const LOOKING_AWAY_DURATION_MS = 5_000
44:
45: /**
46:  * Resolves local face motion signals from blendshapes, face direction, and quality metrics.
47:  *
48:  * Use when:
49:  * - Visual interaction needs lightweight face motion cues for local avatar feedback.
50:  * - You need deterministic, testable signal extraction without remote APIs.
51:  *
52:  * Expects:
53:  * - `facePresence` and `faceDirection` reflect the current frame-level visual state.
54:  * - `qualityScore` is normalized to `[0, 1]` when provided.
55:  *
56:  * Returns:
57:  * - A conservative visual signal classification with confidence, reason, and signal source.
58:  */
59: export function resolveVisionExpressionSignal(
60:   input: ResolveVisionExpressionSignalInput,
61: ): VisionExpressionSignalResult {
62:   if (input.facePresence === 'absent') {
63:     return {
64:       signal: 'none',
65:       confidence: 0,
66:       reason: 'no face present',
67:       source: 'fallback',
68:     }
69:   }
70:
71:   const normalizedQuality = normalizeQualityScore(input.qualityScore)
72:   const smileScore = resolveSmileScore(input.blendshapes)
73:   const blendshapeOutputAvailable = input.blendshapeOutputAvailable ?? true
74:   const hasLandmarks = input.hasLandmarks ?? true
75:
76:   if (smileScore >= SMILE_SIGNAL_THRESHOLD) {
77:     return {
78:       signal: 'smile_like_signal',
79:       confidence: smileScore,
80:       reason: 'smile-like face motion',
81:       source: 'blendshape',
82:     }
83:   }
84:
85:   const centeredDurationMs = normalizeDurationMs(input.centeredDurationMs)
86:   if (
87:     input.facePresence === 'present'
88:     && input.faceDirection === 'center'
89:     && normalizedQuality >= STABLE_FACE_QUALITY_THRESHOLD
90:     && centeredDurationMs >= STABLE_FACE_CENTERED_DURATION_MS
91:   ) {
92:     return {
93:       signal: 'stable_face_signal',
94:       confidence: confidenceFromQualityAndDuration(normalizedQuality, centeredDurationMs, STABLE_FACE_CENTERED_DURATION_MS),
95:       reason: 'stable face in frame',
96:       source: 'position',
97:     }
98:   }
99:
100:   const awayDurationMs = normalizeDurationMs(input.awayDurationMs)
101:   if (
102:     input.facePresence === 'present'
103:     && input.faceDirection !== 'center'
104:     && input.faceDirection !== 'unknown'
105:     && awayDurationMs >= LOOKING_AWAY_DURATION_MS
106:   ) {
107:     return {
108:       signal: 'looking_away_signal',
109:       confidence: confidenceFromQualityAndDuration(
110:         normalizedQuality > 0 ? normalizedQuality : 0.55,
111:         awayDurationMs,
112:         LOOKING_AWAY_DURATION_MS,
113:       ),
114:       reason: 'face position away from center',
115:       source: 'position',
116:     }
117:   }
118:
119:   if (
120:     input.facePresence === 'unknown'
121:     || normalizedQuality > 0 && normalizedQuality < UNCLEAR_QUALITY_THRESHOLD
122:     || (input.facePresence === 'present' && (!hasLandmarks || (!blendshapeOutputAvailable && !input.blendshapes?.length)))
123:   ) {
124:     return {
125:       signal: 'unclear_face_signal',
126:       confidence: normalizedQuality > 0 ? normalizedQuality : 0.2,
127:       reason: 'visual signal unclear',
128:       source: normalizedQuality > 0 && normalizedQuality < UNCLEAR_QUALITY_THRESHOLD ? 'quality' : 'fallback',
129:     }
130:   }
131:
132:   if (isMissingCriticalInput(input)) {
133:     return {
134:       signal: 'low_confidence',
135:       confidence: normalizedQuality > 0 ? Math.min(0.4, normalizedQuality) : 0.15,
136:       reason: 'visual signal confidence is low',
137:       source: 'fallback',
138:     }
139:   }
140:
141:   return {
142:     signal: 'none',
143:     confidence: normalizedQuality > 0 ? Math.min(0.49, normalizedQuality) : 0.3,
144:     reason: 'no stable expression signal',
145:     source: 'fallback',
146:   }
147: }
148:
149: function resolveSmileScore(categories?: VisionExpressionBlendshapeCategory[]) {
150:   if (!Array.isArray(categories) || categories.length === 0)
151:     return 0
152:
153:   const smileLikeCategories = new Map<string, number>()
154:   for (const category of categories) {
155:     const normalizedName = category.categoryName?.trim().toLowerCase()
156:     if (!normalizedName)
157:       continue
158:     smileLikeCategories.set(normalizedName, normalizeQualityScore(category.score))
159:   }
160:
161:   const smileLeft = smileLikeCategories.get('mouthsmileleft')
162:     ?? smileLikeCategories.get('mouth_smile_left')
163:     ?? smileLikeCategories.get('smileleft')
164:     ?? 0
165:   const smileRight = smileLikeCategories.get('mouthsmileright')
166:     ?? smileLikeCategories.get('mouth_smile_right')
167:     ?? smileLikeCategories.get('smileright')
168:     ?? 0
169:   const smileGeneral = smileLikeCategories.get('smile')
170:     ?? smileLikeCategories.get('mouthsmile')
171:     ?? smileLikeCategories.get('mouth_smile')
172:     ?? 0
173:
174:   if (smileLeft > 0 || smileRight > 0)
175:     return (smileLeft + smileRight) / 2
176:   return smileGeneral
177: }
178:
179: function normalizeDurationMs(value?: number) {
180:   if (!Number.isFinite(value))
181:     return 0
182:   return Math.max(0, Number(value))
183: }
184:
185: function normalizeQualityScore(value?: number) {
186:   if (!Number.isFinite(value))
187:     return 0
188:   return Math.min(1, Math.max(0, Number(value)))
189: }
190:
191: function confidenceFromQualityAndDuration(qualityScore: number, durationMs: number, thresholdMs: number) {
192:   const durationFactor = Math.min(1, durationMs / thresholdMs)
193:   return Math.min(1, Math.max(0.3, (qualityScore * 0.7) + (durationFactor * 0.3)))
194: }
195:
196: function isMissingCriticalInput(input: ResolveVisionExpressionSignalInput) {
197:   if (input.facePresence === 'present' && input.faceDirection === 'unknown')
198:     return true
199:   if (input.facePresence === 'present' && !Number.isFinite(input.qualityScore))
200:     return true
201:   return false
202: }

(End of file - total 202 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-vision-pet-feedback.ts</path>
<type>file</type>
<content>
1: import type { VisionExpressionSignal, VisionExpressionSignalSource } from '../utils/vision-expression-signals'
2: import type {
3:   SelectedVisionFeedbackMessage,
4:   VisionFeedbackChannel,
5:   VisionFeedbackEventType,
6:   VisionFeedbackIntensity,
7:   VisionFeedbackLevel,
8:   VisionFeedbackLocale,
9:   VisionFeedbackTransitionSnapshot,
10:   VisionFeedbackVariant,
11: } from '../utils/vision-feedback-messages'
12: import type { LocalFaceGateState, LocalFaceProfileStatus } from './use-local-face-gate'
13: import type { VisionFaceDirection } from './use-vision-interaction'
14:
15: import { errorMessageFrom } from '@moeru/std'
16: import {
17:   EmotionHappyMotionName,
18:   EmotionNeutralMotionName,
19:   EmotionThinkMotionName,
20:   useExpressionStore,
21:   useLive2d,
22: } from '@proj-airi/stage-ui-live2d'
23: import { useSettings } from '@proj-airi/stage-ui/stores/settings'
24: import { storeToRefs } from 'pinia'
25: import { computed, onBeforeUnmount, ref, watch } from 'vue'
26:
27: import {
28:   resolveVisionFeedbackTransition,
29:   selectVisionFeedbackMessage,
30: } from '../utils/vision-feedback-messages'
31:
32: type VisionPetFeedbackEventType
33:   = | 'open_palm'
34:     | 'victory'
35:     | 'thumbs_up'
36:     | 'face_return'
37:     | 'face_direction_change'
38:     | 'gated'
39:
40: type VisionPetFeedbackState = 'idle' | 'quiet' | 'celebrating' | 'acknowledged' | 'gated'
41: type VisionSubjectPosition = Exclude<VisionFaceDirection, 'unknown'>
42: type VisionSubjectResponseState = 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
43: export type { VisionFeedbackIntensity, VisionFeedbackLevel }
44: export type { VisionFeedbackLocale, VisionFeedbackVariant }
45: export type VisionContextualFeedbackPriority = 'low' | 'normal' | 'high'
46: export type VisionContextualFeedbackEventType
47:   = | 'subject_moved_left'
48:     | 'subject_moved_right'
49:     | 'subject_moved_up'
50:     | 'subject_moved_down'
51:     | 'subject_centered'
52:     | 'subject_returned'
53:     | 'subject_absent'
54:     | 'subject_matched'
55:     | 'subject_gated'
56:     | 'subject_uncertain'
57:     | 'subject_dwelled_left'
58:     | 'subject_dwelled_right'
59:     | 'subject_dwelled_center'
60:     | 'expression_smile_like_detected'
61:     | 'expression_stable_face_detected'
62:     | 'expression_looking_away_detected'
63:     | 'expression_unclear_detected'
64:
65: interface VisionPetFeedbackRecord {
66:   eventType: VisionPetFeedbackEventType
67:   state: VisionPetFeedbackState
68:   at: number
69:   sourceEventId?: number
70:   motion?: string
71:   expression?: string
72:   gated?: boolean
73:   suppressedByQuiet?: boolean
74:   faceDirection?: VisionFaceDirection
75:   summary: string
76: }
77:
78: interface VisionSubjectResponseRecord {
79:   eventType: VisionFeedbackEventType
80:   direction: VisionSubjectPosition
81:   state: VisionSubjectResponseState
82:   at: number
83:   sourceEventId?: number
84:   motion?: string
85:   expression?: string
86:   gated: boolean
87:   suppressedByQuiet: boolean
88:   feedbackLevel: VisionFeedbackLevel
89:   feedbackPriority: VisionContextualFeedbackPriority
90:   feedbackChannels: VisionFeedbackChannel[]
91:   templateId: string
92:   isTransition: boolean
93:   resolvedEventType: VisionFeedbackEventType
94:   toastMessage?: string
95:   summary: string
96: }
97:
98: interface TriggerVisionPetFeedbackOptions {
99:   allowVisualFeedback?: boolean
100:   gateEnabled?: boolean
101:   gateState?: LocalFaceGateState
102:   sourceEventId?: number
103:   faceDirection?: VisionFaceDirection
104:   summary?: string
105:   force?: boolean
106: }
107:
108: interface ContextualGateSnapshot {
109:   gateState: LocalFaceGateState
110:   profileStatus: LocalFaceProfileStatus | 'unknown'
111: }
112:
113: interface TriggerSubjectPositionFeedbackOptions {
114:   allowVisualFeedback?: boolean
115:   gateEnabled?: boolean
116:   gateState?: LocalFaceGateState
117:   sourceEventId?: number
118:   summary?: string
119:   force?: boolean
120:   displayName?: string
121:   gateProfileStatus?: LocalFaceProfileStatus
122:   presence?: 'present' | 'absent' | 'unknown'
123:   bubbleAllowed?: boolean
124: }
125:
126: interface TriggerContextualVisionFeedbackOptions {
127:   allowVisualFeedback?: boolean
128:   gateEnabled?: boolean
129:   gateState?: LocalFaceGateState
130:   sourceEventId?: number
131:   direction?: VisionFaceDirection
132:   displayName?: string
133:   summary?: string
134:   force?: boolean
135:   gateProfileStatus?: LocalFaceProfileStatus
136:   presence?: 'present' | 'absent' | 'unknown'
137:   preferredLevel?: VisionFeedbackLevel
138:   allowedChannels?: VisionFeedbackChannel[]
139:   locale?: VisionFeedbackLocale
140:   variant?: VisionFeedbackVariant
141:   bubbleAllowed?: boolean
142: }
143:
144: interface TriggerExpressionSignalFeedbackOptions {
145:   signal: VisionExpressionSignal
146:   confidence: number
147:   reason: string
148:   source: VisionExpressionSignalSource
149:   gateAllowed?: boolean
150:   gateEnabled?: boolean
151:   gateState?: LocalFaceGateState
152:   gateProfileStatus?: LocalFaceProfileStatus
153:   intensity?: VisionFeedbackIntensity
154:   locale?: VisionFeedbackLocale
155:   variant?: VisionFeedbackVariant
156:   quietMode?: boolean
157:   displayName?: string
158:   presence?: 'present' | 'absent' | 'unknown'
159:   sourceEventId?: number
160:   bubbleAllowed?: boolean
161:   force?: boolean
162: }
163:
164: interface UseVisionPetFeedbackOptions {
165:   quietDurationMs?: number
166:   celebrationVisualMs?: number
167:   acknowledgedVisualMs?: number
168:   gatedVisualMs?: number
169:   feedbackCooldownMs?: number
170:   victoryCooldownMs?: number
171:   live2dMotionCooldownMs?: number
172:   subjectResponseCooldownMs?: number
173:   subjectResponseVisualMs?: number
174:   subjectReturnedCooldownMs?: number
175:   subjectMatchedCooldownMs?: number
176:   subjectAbsentCooldownMs?: number
177:   subjectGatedCooldownMs?: number
178:   subjectUncertainCooldownMs?: number
179:   subjectDwellCooldownMs?: number
180:   feedbackMessageCooldownMs?: number
181:   directionToastCooldownMs?: number
182:   highPriorityToastHoldMs?: number
183:   bubbleDurationMs?: number
184:   expressionSmileCooldownMs?: number
185:   expressionStableCooldownMs?: number
186:   expressionLookingAwayCooldownMs?: number
187:   expressionUnclearCooldownMs?: number
188:   random?: () => number
189: }
190:
191: const DEFAULT_OPTIONS: Required<UseVisionPetFeedbackOptions> = {
192:   quietDurationMs: 30_000,
193:   celebrationVisualMs: 3_000,
194:   acknowledgedVisualMs: 2_000,
195:   gatedVisualMs: 2_000,
196:   feedbackCooldownMs: 2_000,
197:   victoryCooldownMs: 3_000,
198:   live2dMotionCooldownMs: 1_100,
199:   subjectResponseCooldownMs: 3_500,
200:   subjectResponseVisualMs: 1_400,
201:   subjectReturnedCooldownMs: 10_000,
202:   subjectMatchedCooldownMs: 10_000,
203:   subjectAbsentCooldownMs: 8_000,
204:   subjectGatedCooldownMs: 5_000,
205:   subjectUncertainCooldownMs: 8_000,
206:   subjectDwellCooldownMs: 14_000,
207:   feedbackMessageCooldownMs: 5_000,
208:   directionToastCooldownMs: 2_500,
209:   highPriorityToastHoldMs: 3_000,
210:   bubbleDurationMs: 4_000,
211:   expressionSmileCooldownMs: 10_000,
212:   expressionStableCooldownMs: 12_000,
213:   expressionLookingAwayCooldownMs: 15_000,
214:   expressionUnclearCooldownMs: 9_000,
215:   random: Math.random,
216: }
217:
218: const FEEDBACK_INTENSITY_STORAGE_KEY = 'airi.vision-experiment.feedback-intensity.v1'
219: const FEEDBACK_LOCALE_STORAGE_KEY = 'airi.vision-experiment.feedback-locale.v1'
220: const FEEDBACK_VARIANT_STORAGE_KEY = 'airi.vision-experiment.feedback-variant.v1'
221:
222: function normalizeFeedbackIntensity(value: string | null): VisionFeedbackIntensity {
223:   if (value === 'minimal' || value === 'balanced' || value === 'expressive')
224:     return value
225:   return 'balanced'
226: }
227:
228: function normalizeFeedbackLocale(value: string | null): VisionFeedbackLocale {
229:   if (value === 'zh-CN')
230:     return 'zh-CN'
231:   return 'en'
232: }
233:
234: function normalizeFeedbackVariant(value: string | null): VisionFeedbackVariant {
235:   if (value === 'a' || value === 'b')
236:     return value
237:   return 'default'
238: }
239:
240: function loadFeedbackIntensity() {
241:   if (typeof localStorage === 'undefined')
242:     return 'balanced' as const
243:   try {
244:     return normalizeFeedbackIntensity(localStorage.getItem(FEEDBACK_INTENSITY_STORAGE_KEY))
245:   }
246:   catch {
247:     return 'balanced' as const
248:   }
249: }
250:
251: function loadFeedbackLocale() {
252:   if (typeof localStorage === 'undefined')
253:     return 'en' as const
254:   try {
255:     return normalizeFeedbackLocale(localStorage.getItem(FEEDBACK_LOCALE_STORAGE_KEY))
256:   }
257:   catch {
258:     return 'en' as const
259:   }
260: }
261:
262: function loadFeedbackVariant() {
263:   if (typeof localStorage === 'undefined')
264:     return 'default' as const
265:   try {
266:     return normalizeFeedbackVariant(localStorage.getItem(FEEDBACK_VARIANT_STORAGE_KEY))
267:   }
268:   catch {
269:     return 'default' as const
270:   }
271: }
272:
273: function persistFeedbackIntensity(intensity: VisionFeedbackIntensity) {
274:   if (typeof localStorage === 'undefined')
275:     return
276:   try {
277:     localStorage.setItem(FEEDBACK_INTENSITY_STORAGE_KEY, intensity)
278:   }
279:   catch {
280:     // ignore storage write failures
281:   }
282: }
283:
284: function persistFeedbackLocale(locale: VisionFeedbackLocale) {
285:   if (typeof localStorage === 'undefined')
286:     return
287:   try {
288:     localStorage.setItem(FEEDBACK_LOCALE_STORAGE_KEY, locale)
289:   }
290:   catch {
291:     // ignore storage write failures
292:   }
293: }
294:
295: function persistFeedbackVariant(variant: VisionFeedbackVariant) {
296:   if (typeof localStorage === 'undefined')
297:     return
298:   try {
299:     localStorage.setItem(FEEDBACK_VARIANT_STORAGE_KEY, variant)
300:   }
301:   catch {
302:     // ignore storage write failures
303:   }
304: }
305:
306: /**
307:  * Drives short-lived Live2D feedback for vision gestures.
308:  *
309:  * Use when:
310:  * - Gesture detection events should trigger visible pet reactions.
311:  * - Feedback must stay local to Vision Island experiments.
312:  *
313:  * Expects:
314:  * - Caller passes gate context for each trigger when available.
315:  * - Live2D motion/expression availability may vary by model.
316:  *
317:  * Returns:
318:  * - Trigger API, short-lived visual state, cooldown-safe feedback snapshots,
319:  *   and quiet-mode controls for Vision Island UI.
320:  */
321: export function useVisionPetFeedback(options?: UseVisionPetFeedbackOptions) {
322:   const runtimeOptions = {
323:     ...DEFAULT_OPTIONS,
324:     ...options,
325:   }
326:
327:   const settingsStore = useSettings()
328:   const { stageModelRenderer } = storeToRefs(settingsStore)
329:   const live2dStore = useLive2d()
330:   const expressionStore = useExpressionStore()
331:   const { currentMotion, availableMotions } = storeToRefs(live2dStore)
332:
333:   const petFeedbackState = ref<VisionPetFeedbackState>('idle')
334:   const lastPetFeedback = ref<VisionPetFeedbackRecord | null>(null)
335:   const subjectResponseState = ref<VisionSubjectResponseState>('idle')
336:   const lastSubjectResponseEvent = ref<VisionSubjectResponseRecord | null>(null)
337:   const subjectResponseCooldownUntil = ref(0)
338:   const lastSubjectStableDirection = ref<VisionFaceDirection>('unknown')
339:   const quietVisualUntil = ref(0)
340:   const quietRemainingMs = ref(0)
341:   const celebrationCount = ref(0)
342:   const isQuietVisualMode = computed(() => quietRemainingMs.value > 0)
343:   const feedbackIntensity = ref<VisionFeedbackIntensity>(loadFeedbackIntensity())
344:   const feedbackLocale = ref<VisionFeedbackLocale>(loadFeedbackLocale())
345:   const feedbackVariant = ref<VisionFeedbackVariant>(loadFeedbackVariant())
346:   const lastFeedbackType = ref<VisionContextualFeedbackEventType | null>(null)
347:   const lastFeedbackMessage = ref('')
348:   const lastFeedbackLevel = ref<VisionFeedbackLevel>('subtle')
349:   const lastFeedbackPriority = ref<VisionContextualFeedbackPriority>('low')
350:   const lastFeedbackChannels = ref<VisionFeedbackChannel[]>([])
351:   const lastFeedbackTemplateId = ref<string | null>(null)
352:   const lastResolvedFeedbackEventType = ref<VisionFeedbackEventType | null>(null)
353:   const lastIsTransitionFeedback = ref(false)
354:   const lastFeedbackAt = ref<number | null>(null)
355:   const nextAllowedFeedbackAt = ref(0)
356:   const feedbackSuppressedByQuiet = ref(false)
357:   const feedbackBlockedByGate = ref(false)
358:   const previousTransitionSnapshot = ref<VisionFeedbackTransitionSnapshot | null>(null)
359:   const currentPresence = ref<'present' | 'absent' | 'unknown'>('unknown')
360:   const activeBubbleMessage = ref('')
361:   const activeBubbleLevel = ref<VisionFeedbackLevel | null>(null)
362:   const activeBubbleEventType = ref<VisionFeedbackEventType | null>(null)
363:   const activeBubbleTemplateId = ref<string | null>(null)
364:   const bubbleVisibleUntil = ref(0)
365:   const bubbleRemainingMs = ref(0)
366:
367:   const lastTriggeredAt = ref<Record<VisionPetFeedbackEventType, number>>({
368:     open_palm: Number.NEGATIVE_INFINITY,
369:     victory: Number.NEGATIVE_INFINITY,
370:     thumbs_up: Number.NEGATIVE_INFINITY,
371:     face_return: Number.NEGATIVE_INFINITY,
372:     face_direction_change: Number.NEGATIVE_INFINITY,
373:     gated: Number.NEGATIVE_INFINITY,
374:   })
375:   const lastDirectionalToastAt = ref(Number.NEGATIVE_INFINITY)
376:   const highPriorityToastUntil = ref(Number.NEGATIVE_INFINITY)
377:   const lastMotionTriggeredAt = ref(Number.NEGATIVE_INFINITY)
378:   const contextualLastTriggeredAt = ref<Map<VisionFeedbackEventType, number>>(new Map())
379:   const previousMessageByEventType = ref<Map<VisionFeedbackEventType, { text: string, templateId: string }>>(new Map())
380:   let stateResetTimer: ReturnType<typeof setTimeout> | null = null
381:   let quietTickerId: ReturnType<typeof setInterval> | null = null
382:   let bubbleTickerId: ReturnType<typeof setInterval> | null = null
383:
384:   const nextAllowedFeedbackIn = computed(() => {
385:     return Math.max(0, nextAllowedFeedbackAt.value - Date.now())
386:   })
387:
388:   function startQuietTicker() {
389:     if (quietTickerId !== null || typeof window === 'undefined')
390:       return
391:     quietTickerId = setInterval(() => syncQuietRemainingMs(Date.now()), 250)
392:   }
393:
394:   function stopQuietTicker() {
395:     if (quietTickerId === null)
396:       return
397:     clearInterval(quietTickerId)
398:     quietTickerId = null
399:   }
400:
401:   function startBubbleTicker() {
402:     if (bubbleTickerId !== null || typeof window === 'undefined')
403:       return
404:     bubbleTickerId = setInterval(() => syncBubbleRemaining(Date.now()), 200)
405:   }
406:
407:   function stopBubbleTicker() {
408:     if (bubbleTickerId === null)
409:       return
410:     clearInterval(bubbleTickerId)
411:     bubbleTickerId = null
412:   }
413:
414:   function clearStateResetTimer() {
415:     if (stateResetTimer === null)
416:       return
417:     clearTimeout(stateResetTimer)
418:     stateResetTimer = null
419:   }
420:
421:   function setTransientState(nextState: VisionPetFeedbackState, holdMs: number) {
422:     clearStateResetTimer()
423:     petFeedbackState.value = nextState
424:     stateResetTimer = setTimeout(() => {
425:       petFeedbackState.value = isQuietVisualMode.value ? 'quiet' : 'idle'
426:       stateResetTimer = null
427:     }, holdMs)
428:   }
429:
430:   function normalizeKey(value: string) {
431:     return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
432:   }
433:
434:   function syncQuietRemainingMs(nowMs: number) {
435:     quietRemainingMs.value = Math.max(0, quietVisualUntil.value - nowMs)
436:     if (quietRemainingMs.value === 0) {
437:       if (petFeedbackState.value === 'quiet')
438:         petFeedbackState.value = 'idle'
439:       stopQuietTicker()
440:     }
441:   }
442:
443:   function syncBubbleRemaining(nowMs: number) {
444:     bubbleRemainingMs.value = Math.max(0, bubbleVisibleUntil.value - nowMs)
445:     if (bubbleRemainingMs.value === 0) {
446:       activeBubbleMessage.value = ''
447:       activeBubbleLevel.value = null
448:       activeBubbleEventType.value = null
449:       activeBubbleTemplateId.value = null
450:       stopBubbleTicker()
451:     }
452:   }
453:
454:   function activateQuietVisualMode(nowMs: number) {
455:     quietVisualUntil.value = nowMs + runtimeOptions.quietDurationMs
456:     syncQuietRemainingMs(nowMs)
457:     clearStateResetTimer()
458:     petFeedbackState.value = 'quiet'
459:     startQuietTicker()
460:   }
461:
462:   function cancelQuietVisualMode() {
463:     quietVisualUntil.value = 0
464:     syncQuietRemainingMs(Date.now())
465:     if (petFeedbackState.value === 'quiet')
466:       petFeedbackState.value = 'idle'
467:   }
468:
469:   function setFeedbackIntensity(nextIntensity: VisionFeedbackIntensity) {
470:     feedbackIntensity.value = nextIntensity
471:     persistFeedbackIntensity(nextIntensity)
472:   }
473:
474:   function setFeedbackLocale(nextLocale: VisionFeedbackLocale) {
475:     feedbackLocale.value = nextLocale
476:     persistFeedbackLocale(nextLocale)
477:   }
478:
479:   function setFeedbackVariant(nextVariant: VisionFeedbackVariant) {
480:     feedbackVariant.value = nextVariant
481:     persistFeedbackVariant(nextVariant)
482:   }
483:
484:   function clearBubble() {
485:     bubbleVisibleUntil.value = 0
486:     bubbleRemainingMs.value = 0
487:     activeBubbleMessage.value = ''
488:     activeBubbleLevel.value = null
489:     activeBubbleEventType.value = null
490:     activeBubbleTemplateId.value = null
491:     stopBubbleTicker()
492:   }
493:
494:   function showBubble(
495:     message: string,
496:     level: VisionFeedbackLevel,
497:     eventType: VisionFeedbackEventType,
498:     templateId: string,
499:     nowMs: number,
500:   ) {
501:     if (!message.trim())
502:       return
503:     activeBubbleMessage.value = message
504:     activeBubbleLevel.value = level
505:     activeBubbleEventType.value = eventType
506:     activeBubbleTemplateId.value = templateId
507:     bubbleVisibleUntil.value = nowMs + runtimeOptions.bubbleDurationMs
508:     syncBubbleRemaining(nowMs)
509:     startBubbleTicker()
510:   }
511:
512:   watch(feedbackIntensity, (nextIntensity) => {
513:     persistFeedbackIntensity(nextIntensity)
514:   }, { immediate: true })
515:
516:   watch(feedbackLocale, (nextLocale) => {
517:     persistFeedbackLocale(nextLocale)
518:   }, { immediate: true })
519:
520:   watch(feedbackVariant, (nextVariant) => {
521:     persistFeedbackVariant(nextVariant)
522:   }, { immediate: true })
523:
524:   function shouldAllowVisualFeedback(options?: TriggerVisionPetFeedbackOptions | TriggerContextualVisionFeedbackOptions) {
525:     if (options?.allowVisualFeedback !== undefined)
526:       return options.allowVisualFeedback
527:     if (options?.gateEnabled === undefined)
528:       return true
529:     if (!options.gateEnabled)
530:       return true
531:     return options.gateState === 'enabled'
532:   }
533:
534:   function getCooldownMs(eventType: VisionPetFeedbackEventType) {
535:     if (eventType === 'victory')
536:       return runtimeOptions.victoryCooldownMs
537:     return runtimeOptions.feedbackCooldownMs
538:   }
539:
540:   function isInCooldown(eventType: VisionPetFeedbackEventType, nowMs: number, force = false) {
541:     if (force)
542:       return false
543:     return nowMs - lastTriggeredAt.value[eventType] < getCooldownMs(eventType)
544:   }
545:
546:   function resolveMotionCandidate(motionCandidates: string[]): { group: string, index?: number } | null {
547:     const motionLookup = new Map<string, { group: string, index: number }>()
548:     for (const motion of availableMotions.value) {
549:       const key = normalizeKey(motion.motionName)
550:       if (!motionLookup.has(key)) {
551:         motionLookup.set(key, {
552:           group: motion.motionName,
553:           index: motion.motionIndex,
554:         })
555:       }
556:     }
557:
558:     for (const candidate of motionCandidates) {
559:       const match = motionLookup.get(normalizeKey(candidate))
560:       if (match)
561:         return match
562:     }
563:
564:     return null
565:   }
566:
567:   function triggerMotionWithFallback(motionCandidates: string[]) {
568:     if (stageModelRenderer.value !== 'live2d')
569:       return undefined
570:
571:     const nowMs = Date.now()
572:     if ((nowMs - lastMotionTriggeredAt.value) < runtimeOptions.live2dMotionCooldownMs)
573:       return undefined
574:
575:     const resolved = resolveMotionCandidate(motionCandidates)
576:     if (!resolved)
577:       return undefined
578:
579:     const previousMotion = currentMotion.value
580:     if (previousMotion.group === resolved.group && previousMotion.index === resolved.index)
581:       return resolved.group
582:
583:     try {
584:       currentMotion.value = resolved.index === undefined
585:         ? { group: resolved.group }
586:         : { group: resolved.group, index: resolved.index }
587:       lastMotionTriggeredAt.value = nowMs
588:       return resolved.group
589:     }
590:     catch (error) {
591:       console.warn('[vision][pet-feedback] failed to set motion', {
592:         motionCandidates,
593:         resolved,
594:         message: errorMessageFrom(error) ?? 'unknown error',
595:       })
596:       return undefined
597:     }
598:   }
599:
600:   function resolveExpressionCandidate(expressionCandidates: string[]) {
601:     const groupEntries = Array.from(expressionStore.expressionGroups.keys()).map((name) => {
602:       return [normalizeKey(name), name] as const
603:     })
604:     const parameterEntries = Array.from(expressionStore.expressions.keys()).map((name) => {
605:       return [normalizeKey(name), name] as const
606:     })
607:     const groupLookup = new Map<string, string>(groupEntries)
608:     const parameterLookup = new Map<string, string>(parameterEntries)
609:
610:     for (const candidate of expressionCandidates) {
611:       const key = normalizeKey(candidate)
612:       const match = groupLookup.get(key) ?? parameterLookup.get(key)
613:       if (match)
614:         return match
615:     }
616:
617:     return undefined
618:   }
619:
620:   function triggerExpressionWithFallback(expressionCandidates: string[], durationMs: number) {
621:     if (stageModelRenderer.value !== 'live2d')
622:       return undefined
623:     if (!expressionStore.modelId)
624:       return undefined
625:
626:     const resolved = resolveExpressionCandidate(expressionCandidates)
627:     if (!resolved)
628:       return undefined
629:
630:     try {
631:       const result = expressionStore.toggle(resolved, Math.max(0, durationMs) / 1000)
632:       if (!result.success)
633:         return undefined
634:       return resolved
635:     }
636:     catch (error) {
637:       console.warn('[vision][pet-feedback] failed to set expression', {
638:         expressionCandidates,
639:         resolved,
640:         message: errorMessageFrom(error) ?? 'unknown error',
641:       })
642:       return undefined
643:     }
644:   }
645:
646:   function commitFeedbackRecord(record: VisionPetFeedbackRecord) {
647:     lastPetFeedback.value = record
648:   }
649:
650:   function mapSubjectResponseState(direction: VisionSubjectPosition): VisionSubjectResponseState {
651:     if (direction === 'left')
652:       return 'following_left'
653:     if (direction === 'right')
654:       return 'following_right'
655:     if (direction === 'up')
656:       return 'looking_up'
657:     if (direction === 'down')
658:       return 'looking_down'
659:     return 'centered'
660:   }
661:
662:   function directionFromContextualEvent(eventType: VisionContextualFeedbackEventType): VisionSubjectPosition {
663:     if (eventType === 'subject_moved_left' || eventType === 'subject_dwelled_left')
664:       return 'left'
665:     if (eventType === 'subject_moved_right' || eventType === 'subject_dwelled_right')
666:       return 'right'
667:     if (eventType === 'subject_moved_up')
668:       return 'up'
669:     if (eventType === 'subject_moved_down')
670:       return 'down'
671:     return 'center'
672:   }
673:
674:   function mapContextualEventToFeedbackEvent(eventType: VisionContextualFeedbackEventType) {
675:     if (eventType === 'subject_moved_left')
676:       return 'subject_position_left' as const
677:     if (eventType === 'subject_moved_right')
678:       return 'subject_position_right' as const
679:     if (eventType === 'subject_moved_up')
680:       return 'subject_position_up' as const
681:     if (eventType === 'subject_moved_down')
682:       return 'subject_position_down' as const
683:     if (eventType === 'subject_centered')
684:       return 'subject_position_center' as const
685:     if (eventType === 'subject_returned')
686:       return 'subject_returned' as const
687:     if (eventType === 'subject_absent')
688:       return 'subject_absent' as const
689:     if (eventType === 'subject_matched')
690:       return 'subject_matched' as const
691:     if (eventType === 'subject_uncertain')
692:       return 'subject_uncertain' as const
693:     if (eventType === 'subject_dwelled_left')
694:       return 'subject_dwelled_left' as const
695:     if (eventType === 'subject_dwelled_right')
696:       return 'subject_dwelled_right' as const
697:     if (eventType === 'subject_dwelled_center')
698:       return 'subject_dwelled_center' as const
699:     if (eventType === 'expression_smile_like_detected')
700:       return 'expression_smile_like' as const
701:     if (eventType === 'expression_stable_face_detected')
702:       return 'expression_stable_face' as const
703:     if (eventType === 'expression_looking_away_detected')
704:       return 'expression_looking_away' as const
705:     if (eventType === 'expression_unclear_detected')
706:       return 'expression_unclear' as const
707:     return 'subject_gated' as const
708:   }
709:
710:   function getContextualCooldownMs(eventType: VisionFeedbackEventType) {
711:     if (eventType === 'subject_returned')
712:       return runtimeOptions.subjectReturnedCooldownMs
713:     if (eventType === 'subject_matched')
714:       return runtimeOptions.subjectMatchedCooldownMs
715:     if (eventType === 'subject_absent')
716:       return runtimeOptions.subjectAbsentCooldownMs
717:     if (eventType === 'subject_gated')
718:       return runtimeOptions.subjectGatedCooldownMs
719:     if (eventType === 'subject_uncertain')
720:       return runtimeOptions.subjectUncertainCooldownMs
721:     if (eventType === 'subject_dwelled_left' || eventType === 'subject_dwelled_right' || eventType === 'subject_dwelled_center')
722:       return runtimeOptions.subjectDwellCooldownMs
723:     if (eventType === 'expression_smile_like')
724:       return runtimeOptions.expressionSmileCooldownMs
725:     if (eventType === 'expression_stable_face')
726:       return runtimeOptions.expressionStableCooldownMs
727:     if (eventType === 'expression_looking_away')
728:       return runtimeOptions.expressionLookingAwayCooldownMs
729:     if (eventType === 'expression_unclear')
730:       return runtimeOptions.expressionUnclearCooldownMs
731:     if (
732:       eventType === 'transition_absent_to_returned'
733:       || eventType === 'transition_uncertain_to_matched'
734:       || eventType === 'transition_gated_to_matched'
735:       || eventType === 'transition_multiple_faces_to_matched'
736:     ) {
737:       return runtimeOptions.subjectMatchedCooldownMs
738:     }
739:     if (eventType === 'transition_matched_to_absent' || eventType === 'transition_matched_to_uncertain')
740:       return runtimeOptions.subjectAbsentCooldownMs
741:     return runtimeOptions.feedbackMessageCooldownMs
742:   }
743:
744:   function resolveFeedbackLevel(eventType: VisionFeedbackEventType, intensity: VisionFeedbackIntensity) {
745:     const isExpressionSignalEvent = eventType === 'expression_smile_like'
746:       || eventType === 'expression_stable_face'
747:       || eventType === 'expression_looking_away'
748:       || eventType === 'expression_unclear'
749:
750:     if (intensity === 'minimal') {
751:       if (isExpressionSignalEvent)
752:         return eventType === 'expression_unclear' ? 'subtle' as const : null
753:       if (
754:         eventType === 'subject_returned'
755:         || eventType === 'subject_matched'
756:         || eventType === 'transition_absent_to_returned'
757:         || eventType === 'transition_uncertain_to_matched'
758:         || eventType === 'transition_gated_to_matched'
759:         || eventType === 'transition_multiple_faces_to_matched'
760:       ) {
761:         return 'subtle' as const
762:       }
763:       return null
764:     }
765:
766:     if (intensity === 'balanced') {
767:       if (isExpressionSignalEvent) {
768:         if (eventType === 'expression_smile_like')
769:           return 'normal' as const
770:         if (eventType === 'expression_stable_face')
771:           return 'normal' as const
772:         return 'subtle' as const
773:       }
774:       if (eventType === 'subject_dwelled_left' || eventType === 'subject_dwelled_right')
775:         return null
776:       if (
777:         eventType === 'subject_returned'
778:         || eventType === 'subject_matched'
779:         || eventType === 'transition_absent_to_returned'
780:         || eventType === 'transition_uncertain_to_matched'
781:         || eventType === 'transition_gated_to_matched'
782:         || eventType === 'transition_multiple_faces_to_matched'
783:       ) {
784:         return 'strong' as const
785:       }
786:       if (
787:         eventType === 'subject_absent'
788:         || eventType === 'subject_uncertain'
789:         || eventType === 'transition_matched_to_absent'
790:         || eventType === 'transition_matched_to_uncertain'
791:       ) {
792:         return 'subtle' as const
793:       }
794:       return 'normal' as const
795:     }
796:
797:     if (
798:       eventType === 'subject_returned'
799:       || eventType === 'subject_matched'
800:       || eventType === 'transition_absent_to_returned'
801:       || eventType === 'transition_uncertain_to_matched'
802:       || eventType === 'transition_gated_to_matched'
803:       || eventType === 'transition_multiple_faces_to_matched'
804:     ) {
805:       return 'strong' as const
806:     }
807:     if (
808:       eventType === 'subject_absent'
809:       || eventType === 'subject_uncertain'
810:       || eventType === 'transition_matched_to_absent'
811:       || eventType === 'transition_matched_to_uncertain'
812:     ) {
813:       return 'subtle' as const
814:     }
815:     if (eventType === 'expression_smile_like' || eventType === 'expression_stable_face')
816:       return 'strong' as const
817:     if (eventType === 'expression_looking_away' || eventType === 'expression_unclear')
818:       return 'normal' as const
819:     return 'normal' as const
820:   }
821:
822:   function toTransitionSnapshot(input: {
823:     eventType: VisionFeedbackEventType
824:     gateSnapshot: ContextualGateSnapshot
825:     presence?: 'present' | 'absent' | 'unknown'
826:   }): VisionFeedbackTransitionSnapshot {
827:     const inferredPresence = input.presence
828:       ?? (input.eventType === 'subject_absent' || input.eventType === 'transition_matched_to_absent'
829:         ? 'absent'
830:         : (input.eventType === 'subject_returned' || input.eventType === 'transition_absent_to_returned' ? 'present' : currentPresence.value))
831:
832:     if (inferredPresence !== 'unknown')
833:       currentPresence.value = inferredPresence
834:
835:     const inferredProfileStatus = input.eventType === 'subject_matched'
836:       ? 'matched'
837:       : input.eventType === 'subject_uncertain'
838:         ? 'uncertain'
839:         : input.eventType === 'subject_gated'
840:           ? input.gateSnapshot.profileStatus
841:           : input.gateSnapshot.profileStatus
842:
843:     return {
844:       presence: inferredPresence,
845:       gateState: input.gateSnapshot.gateState,
846:       profileStatus: inferredProfileStatus,
847:     }
848:   }
849:
850:   function resolveSubjectResponseMotionCandidates(direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
851:     if (level === 'subtle') {
852:       return [
853:         EmotionNeutralMotionName,
854:         'Idle',
855:       ]
856:     }
857:
858:     if (direction === 'left' || direction === 'right') {
859:       if (level === 'strong') {
860:         return [
861:           'Curious',
862:           EmotionHappyMotionName,
863:           EmotionThinkMotionName,
864:           EmotionNeutralMotionName,
865:           'Idle',
866:         ]
867:       }
868:       return [
869:         'Curious',
870:         EmotionThinkMotionName,
871:         'Think',
872:         EmotionNeutralMotionName,
873:         'Idle',
874:       ]
875:     }
876:
877:     if (direction === 'up' || direction === 'down') {
878:       if (level === 'strong') {
879:         return [
880:           EmotionHappyMotionName,
881:           EmotionThinkMotionName,
882:           'Think',
883:           EmotionNeutralMotionName,
884:           'Idle',
885:         ]
886:       }
887:       return [
888:         EmotionThinkMotionName,
889:         'Think',
890:         EmotionNeutralMotionName,
891:         'Idle',
892:       ]
893:     }
894:
895:     if (level === 'strong') {
896:       return [
897:         EmotionHappyMotionName,
898:         'Happy',
899:         'Curious',
900:         EmotionNeutralMotionName,
901:         'Idle',
902:       ]
903:     }
904:
905:     return [
906:       EmotionHappyMotionName,
907:       'Happy',
908:       EmotionNeutralMotionName,
909:       'Idle',
910:     ]
911:   }
912:
913:   function resolveSubjectResponseExpressionCandidates(direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
914:     if (level === 'subtle')
915:       return ['normal', 'neutral']
916:     if (direction === 'left' || direction === 'right') {
917:       return level === 'strong'
918:         ? ['curious', 'smile', 'normal', 'neutral']
919:         : ['curious', 'normal', 'neutral']
920:     }
921:     if (direction === 'center') {
922:       return level === 'strong'
923:         ? ['smile', 'happy', 'normal']
924:         : ['smile', 'normal', 'happy']
925:     }
926:     return ['normal', 'neutral']
927:   }
928:
929:   function resolveExpressionSignalMotionCandidates(eventType: VisionFeedbackEventType, level: VisionFeedbackLevel) {
930:     if (eventType === 'expression_smile_like') {
931:       if (level === 'strong') {
932:         return [
933:           EmotionHappyMotionName,
934:           'Happy',
935:           EmotionNeutralMotionName,
936:           'Idle',
937:         ]
938:       }
939:       return [
940:         EmotionHappyMotionName,
941:         EmotionNeutralMotionName,
942:         'Idle',
943:       ]
944:     }
945:
946:     if (eventType === 'expression_stable_face') {
947:       if (level === 'strong') {
948:         return [
949:           EmotionThinkMotionName,
950:           'Think',
951:           EmotionNeutralMotionName,
952:           'Idle',
953:         ]
954:       }
955:       return [
956:         EmotionThinkMotionName,
957:         EmotionNeutralMotionName,
958:         'Idle',
959:       ]
960:     }
961:
962:     if (eventType === 'expression_looking_away') {
963:       return level === 'strong'
964:         ? ['Curious', EmotionThinkMotionName, 'Think', EmotionNeutralMotionName, 'Idle']
965:         : ['Curious', EmotionThinkMotionName, EmotionNeutralMotionName, 'Idle']
966:     }
967:
968:     return []
969:   }
970:
971:   function resolveExpressionSignalExpressionCandidates(eventType: VisionFeedbackEventType, level: VisionFeedbackLevel) {
972:     if (eventType === 'expression_smile_like')
973:       return level === 'strong' ? ['smile', 'happy', 'normal'] : ['smile', 'normal', 'neutral']
974:     if (eventType === 'expression_stable_face')
975:       return ['normal', 'neutral']
976:     if (eventType === 'expression_looking_away')
977:       return ['curious', 'normal', 'neutral']
978:     return []
979:   }
980:
981:   function resolveContextualMotionCandidates(eventType: VisionFeedbackEventType, direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
982:     if (
983:       eventType === 'expression_smile_like'
984:       || eventType === 'expression_stable_face'
985:       || eventType === 'expression_looking_away'
986:       || eventType === 'expression_unclear'
987:     ) {
988:       return resolveExpressionSignalMotionCandidates(eventType, level)
989:     }
990:
991:     return resolveSubjectResponseMotionCandidates(direction, level)
992:   }
993:
994:   function resolveContextualExpressionCandidates(eventType: VisionFeedbackEventType, direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
995:     if (
996:       eventType === 'expression_smile_like'
997:       || eventType === 'expression_stable_face'
998:       || eventType === 'expression_looking_away'
999:       || eventType === 'expression_unclear'
1000:     ) {
1001:       return resolveExpressionSignalExpressionCandidates(eventType, level)
1002:     }
1003:
1004:     return resolveSubjectResponseExpressionCandidates(direction, level)
1005:   }
1006:
1007:   function shouldAllowContextualToast(eventType: VisionFeedbackEventType, level: VisionFeedbackLevel) {
1008:     const isExpressionEvent = eventType === 'expression_smile_like'
1009:       || eventType === 'expression_stable_face'
1010:       || eventType === 'expression_looking_away'
1011:       || eventType === 'expression_unclear'
1012:
1013:     if (feedbackIntensity.value === 'minimal') {
1014:       if (isExpressionEvent)
1015:         return false
1016:       return eventType === 'subject_returned'
1017:         || eventType === 'subject_matched'
1018:         || eventType === 'transition_absent_to_returned'
1019:         || eventType === 'transition_uncertain_to_matched'
1020:         || eventType === 'transition_gated_to_matched'
1021:         || eventType === 'transition_multiple_faces_to_matched'
1022:     }
1023:     if (feedbackIntensity.value === 'balanced') {
1024:       if (isExpressionEvent)
1025:         return eventType === 'expression_smile_like' || eventType === 'expression_stable_face'
1026:       return level !== 'subtle'
1027:         || eventType === 'subject_returned'
1028:         || eventType === 'subject_matched'
1029:         || eventType === 'transition_absent_to_returned'
1030:         || eventType === 'transition_uncertain_to_matched'
1031:         || eventType === 'transition_gated_to_matched'
1032:         || eventType === 'transition_multiple_faces_to_matched'
1033:     }
1034:     if (isExpressionEvent)
1035:       return eventType !== 'expression_unclear'
1036:     return true
1037:   }
1038:
1039:   function resolveContextualState(eventType: VisionFeedbackEventType, direction: VisionSubjectPosition) {
1040:     if (eventType === 'subject_gated')
1041:       return 'gated' as const
1042:     if (eventType === 'subject_absent' || eventType === 'transition_matched_to_absent')
1043:       return 'idle' as const
1044:     if (eventType === 'subject_uncertain' || eventType === 'transition_matched_to_uncertain')
1045:       return 'idle' as const
1046:     if (
1047:       eventType === 'expression_smile_like'
1048:       || eventType === 'expression_stable_face'
1049:       || eventType === 'expression_looking_away'
1050:       || eventType === 'expression_unclear'
1051:     ) {
1052:       return subjectResponseState.value
1053:     }
1054:     return mapSubjectResponseState(direction)
1055:   }
1056:
1057:   function resolveContextualFeedbackPriority(eventType: VisionFeedbackEventType): VisionContextualFeedbackPriority {
1058:     if (
1059:       eventType === 'subject_returned'
1060:       || eventType === 'subject_matched'
1061:       || eventType === 'transition_absent_to_returned'
1062:       || eventType === 'transition_uncertain_to_matched'
1063:       || eventType === 'transition_gated_to_matched'
1064:       || eventType === 'transition_multiple_faces_to_matched'
1065:     ) {
1066:       return 'high'
1067:     }
1068:     if (
1069:       eventType === 'subject_gated'
1070:       || eventType === 'subject_absent'
1071:       || eventType === 'subject_uncertain'
1072:       || eventType === 'transition_matched_to_absent'
1073:       || eventType === 'transition_matched_to_uncertain'
1074:     ) {
1075:       return 'normal'
1076:     }
1077:     if (eventType === 'expression_smile_like')
1078:       return 'high'
1079:     if (eventType === 'expression_stable_face')
1080:       return 'normal'
1081:     if (eventType === 'expression_looking_away' || eventType === 'expression_unclear')
1082:       return 'low'
1083:     return 'low'
1084:   }
1085:
1086:   function isDirectionalContextualEvent(eventType: VisionFeedbackEventType) {
1087:     return eventType === 'subject_position_left'
1088:       || eventType === 'subject_position_right'
1089:       || eventType === 'subject_position_up'
1090:       || eventType === 'subject_position_down'
1091:       || eventType === 'subject_position_center'
1092:       || eventType === 'subject_dwelled_left'
1093:       || eventType === 'subject_dwelled_right'
1094:       || eventType === 'subject_dwelled_center'
1095:   }
1096:
1097:   function isContextualInCooldown(eventType: VisionFeedbackEventType, nowMs: number, force = false) {
1098:     if (force)
1099:       return false
1100:     const cooldownMs = getContextualCooldownMs(eventType)
1101:     const lastAt = contextualLastTriggeredAt.value.get(eventType) ?? Number.NEGATIVE_INFINITY
1102:     return nowMs - lastAt < cooldownMs
1103:   }
1104:
1105:   function triggerContextualVisionFeedback(
1106:     eventType: VisionContextualFeedbackEventType,
1107:     options?: TriggerContextualVisionFeedbackOptions,
1108:   ) {
1109:     const nowMs = Date.now()
1110:     const isGateBlocked = !shouldAllowVisualFeedback(options)
1111:     feedbackBlockedByGate.value = isGateBlocked
1112:     feedbackSuppressedByQuiet.value = false
1113:
1114:     const direction = options?.direction && options.direction !== 'unknown'
1115:       ? options.direction
1116:       : directionFromContextualEvent(eventType)
1117:
1118:     const baseFeedbackEventType = isGateBlocked
1119:       ? ('subject_gated' as const)
1120:       : mapContextualEventToFeedbackEvent(eventType)
1121:
1122:     const gateSnapshot: ContextualGateSnapshot = {
1123:       gateState: options?.gateState ?? (options?.gateEnabled ? (isGateBlocked ? 'gated' : 'enabled') : 'disabled'),
1124:       profileStatus: options?.gateProfileStatus ?? 'unknown',
1125:     }
1126:     const currentSnapshot = toTransitionSnapshot({
1127:       eventType: baseFeedbackEventType,
1128:       gateSnapshot,
1129:       presence: options?.presence,
1130:     })
1131:     const resolvedEventType = isGateBlocked
1132:       ? ('subject_gated' as const)
1133:       : resolveVisionFeedbackTransition(previousTransitionSnapshot.value, currentSnapshot, baseFeedbackEventType)
1134:     previousTransitionSnapshot.value = currentSnapshot
1135:
1136:     const feedbackPriority = resolveContextualFeedbackPriority(resolvedEventType)
1137:     if (isContextualInCooldown(resolvedEventType, nowMs, options?.force))
1138:       return false
1139:
1140:     const feedbackLevel = resolveFeedbackLevel(resolvedEventType, feedbackIntensity.value)
1141:     const previousSelection = previousMessageByEventType.value.get(resolvedEventType) ?? null
1142:     const nextLocale = options?.locale ?? feedbackLocale.value
1143:     const nextVariant = options?.variant ?? feedbackVariant.value
1144:
1145:     const selectedMessage: SelectedVisionFeedbackMessage = options?.summary
1146:       ? {
1147:           text: options.summary,
1148:           level: feedbackLevel ?? 'subtle',
1149:           channels: ['ui'],
1150:           cooldownMs: getContextualCooldownMs(resolvedEventType),
1151:           eventType: resolvedEventType,
1152:           templateId: 'manual-summary',
1153:           locale: nextLocale,
1154:           variant: nextVariant,
1155:           selectedTextSource: 'default',
1156:           shouldShowBubble: false,
1157:         }
1158:       : selectVisionFeedbackMessage(resolvedEventType, {
1159:           intensity: feedbackIntensity.value,
1160:           locale: nextLocale,
1161:           variant: nextVariant,
1162:           displayName: options?.displayName,
1163:           previousText: previousSelection?.text ?? null,
1164:           previousTemplateId: previousSelection?.templateId ?? null,
1165:           random: runtimeOptions.random,
1166:           preferredLevel: feedbackLevel ?? undefined,
1167:           allowedChannels: options?.allowedChannels,
1168:           bubbleAllowed: options?.bubbleAllowed,
1169:         })
1170:     previousMessageByEventType.value.set(resolvedEventType, {
1171:       text: selectedMessage.text,
1172:       templateId: selectedMessage.templateId,
1173:     })
1174:
1175:     const suppressedByQuiet = isQuietVisualMode.value || feedbackLevel === null
1176:     feedbackSuppressedByQuiet.value = isQuietVisualMode.value
1177:     const nextLevel: VisionFeedbackLevel = feedbackLevel ?? selectedMessage.level
1178:     const shouldRunVisualEffects = !isGateBlocked
1179:       && !suppressedByQuiet
1180:       && feedbackLevel !== null
1181:     const motionCandidates = shouldRunVisualEffects
1182:       ? resolveContextualMotionCandidates(resolvedEventType, direction, nextLevel)
1183:       : []
1184:     const expressionCandidates = shouldRunVisualEffects
1185:       ? resolveContextualExpressionCandidates(resolvedEventType, direction, nextLevel)
1186:       : []
1187:     const motion = shouldRunVisualEffects
1188:       ? triggerMotionWithFallback(motionCandidates)
1189:       : undefined
1190:     const expression = shouldRunVisualEffects
1191:       ? triggerExpressionWithFallback(expressionCandidates, runtimeOptions.subjectResponseVisualMs)
1192:       : undefined
1193:
1194:     let shouldToast = !suppressedByQuiet
1195:       && feedbackLevel !== null
1196:       && selectedMessage.channels.includes('toast')
1197:       && shouldAllowContextualToast(resolvedEventType, nextLevel)
1198:     if (shouldToast && feedbackPriority === 'low' && nowMs < highPriorityToastUntil.value)
1199:       shouldToast = false
1200:     if (shouldToast && isDirectionalContextualEvent(resolvedEventType)) {
1201:       const inDirectionalToastCooldown = (nowMs - lastDirectionalToastAt.value) < runtimeOptions.directionToastCooldownMs
1202:       if (inDirectionalToastCooldown)
1203:         shouldToast = false
1204:       else
1205:         lastDirectionalToastAt.value = nowMs
1206:     }
1207:     if (shouldToast && feedbackPriority === 'high')
1208:       highPriorityToastUntil.value = nowMs + runtimeOptions.highPriorityToastHoldMs
1209:
1210:     let shouldShowBubble = selectedMessage.shouldShowBubble
1211:     if (isGateBlocked || resolvedEventType === 'subject_gated')
1212:       shouldShowBubble = false
1213:     if (feedbackLevel === null)
1214:       shouldShowBubble = false
1215:     if (isQuietVisualMode.value)
1216:       shouldShowBubble = false
1217:     if (feedbackIntensity.value === 'minimal' && isDirectionalContextualEvent(resolvedEventType))
1218:       shouldShowBubble = false
1219:     if (
1220:       feedbackIntensity.value === 'minimal'
1221:       && (resolvedEventType === 'expression_smile_like'
1222:         || resolvedEventType === 'expression_stable_face'
1223:         || resolvedEventType === 'expression_looking_away'
1224:         || resolvedEventType === 'expression_unclear')
1225:     ) {
1226:       shouldShowBubble = false
1227:     }
1228:     if (shouldShowBubble) {
1229:       showBubble(
1230:         selectedMessage.text,
1231:         nextLevel,
1232:         resolvedEventType,
1233:         selectedMessage.templateId,
1234:         nowMs,
1235:       )
1236:     }
1237:
1238:     const state = resolveContextualState(resolvedEventType, direction)
1239:     subjectResponseState.value = state
1240:     subjectResponseCooldownUntil.value = nowMs + runtimeOptions.subjectResponseCooldownMs
1241:     lastSubjectStableDirection.value = direction
1242:     lastSubjectResponseEvent.value = {
1243:       eventType: resolvedEventType,
1244:       direction,
1245:       state,
1246:       at: nowMs,
1247:       sourceEventId: options?.sourceEventId,
1248:       motion,
1249:       expression,
1250:       gated: isGateBlocked,
1251:       suppressedByQuiet,
1252:       feedbackLevel: nextLevel,
1253:       feedbackPriority,
1254:       feedbackChannels: selectedMessage.channels,
1255:       templateId: selectedMessage.templateId,
1256:       isTransition: resolvedEventType.startsWith('transition_'),
1257:       resolvedEventType,
1258:       toastMessage: shouldToast ? selectedMessage.text : undefined,
1259:       summary: selectedMessage.text,
1260:     }
1261:
1262:     contextualLastTriggeredAt.value.set(resolvedEventType, nowMs)
1263:     const cooldownMs = selectedMessage.cooldownMs > 0
1264:       ? selectedMessage.cooldownMs
1265:       : getContextualCooldownMs(resolvedEventType)
1266:     nextAllowedFeedbackAt.value = nowMs + cooldownMs
1267:     lastFeedbackType.value = isGateBlocked ? 'subject_gated' : eventType
1268:     lastResolvedFeedbackEventType.value = resolvedEventType
1269:     lastFeedbackMessage.value = selectedMessage.text
1270:     lastFeedbackLevel.value = nextLevel
1271:     lastFeedbackPriority.value = feedbackPriority
1272:     lastFeedbackChannels.value = selectedMessage.channels
1273:     lastFeedbackTemplateId.value = selectedMessage.templateId
1274:     lastIsTransitionFeedback.value = resolvedEventType.startsWith('transition_')
1275:     lastFeedbackAt.value = nowMs
1276:
1277:     if (isGateBlocked || resolvedEventType === 'subject_gated')
1278:       setTransientState('gated', runtimeOptions.gatedVisualMs)
1279:     else if (isQuietVisualMode.value)
1280:       petFeedbackState.value = 'quiet'
1281:
1282:     return true
1283:   }
1284:
1285:   function triggerSubjectPositionFeedback(
1286:     direction: VisionFaceDirection,
1287:     options?: TriggerSubjectPositionFeedbackOptions,
1288:   ) {
1289:     if (direction === 'unknown')
1290:       return false
1291:
1292:     const eventType: VisionContextualFeedbackEventType
1293:       = direction === 'left'
1294:         ? 'subject_moved_left'
1295:         : direction === 'right'
1296:           ? 'subject_moved_right'
1297:           : direction === 'up'
1298:             ? 'subject_moved_up'
1299:             : direction === 'down'
1300:               ? 'subject_moved_down'
1301:               : 'subject_centered'
1302:
1303:     return triggerContextualVisionFeedback(eventType, {
1304:       allowVisualFeedback: options?.allowVisualFeedback,
1305:       gateEnabled: options?.gateEnabled,
1306:       gateState: options?.gateState,
1307:       gateProfileStatus: options?.gateProfileStatus,
1308:       presence: options?.presence,
1309:       sourceEventId: options?.sourceEventId,
1310:       direction,
1311:       displayName: options?.displayName,
1312:       summary: options?.summary,
1313:       force: options?.force,
1314:       bubbleAllowed: options?.bubbleAllowed,
1315:     })
1316:   }
1317:
1318:   function triggerExpressionSignalFeedback(options: TriggerExpressionSignalFeedbackOptions) {
1319:     const contextualEventType: VisionContextualFeedbackEventType
1320:       = options.signal === 'smile_like_signal'
1321:         ? 'expression_smile_like_detected'
1322:         : options.signal === 'stable_face_signal'
1323:           ? 'expression_stable_face_detected'
1324:           : options.signal === 'looking_away_signal'
1325:             ? 'expression_looking_away_detected'
1326:             : 'expression_unclear_detected'
1327:
1328:     const blockedByGateProfile = options.gateEnabled
1329:       && (
1330:         options.gateState === 'locked'
1331:         || options.gateState === 'gated'
1332:         || options.gateProfileStatus === 'unmatched'
1333:         || options.gateProfileStatus === 'multiple_faces'
1334:         || options.gateProfileStatus === 'no_face'
1335:         || options.gateProfileStatus === 'uncertain'
1336:       )
1337:     const allowVisualFeedback = (options.gateAllowed ?? true) && !blockedByGateProfile
1338:     const eventLevel = options.signal === 'unclear_face_signal' || options.signal === 'low_confidence'
1339:       ? 'subtle'
1340:       : undefined
1341:     const defaultChannels: VisionFeedbackChannel[]
1342:       = options.signal === 'unclear_face_signal' || options.signal === 'low_confidence'
1343:         ? ['ui', 'bubble']
1344:         : ['ui', 'toast', 'bubble', 'motion']
1345:
1346:     return triggerContextualVisionFeedback(contextualEventType, {
1347:       allowVisualFeedback,
1348:       gateEnabled: options.gateEnabled,
1349:       gateState: options.gateState,
1350:       gateProfileStatus: options.gateProfileStatus,
1351:       presence: options.presence,
1352:       sourceEventId: options.sourceEventId,
1353:       direction: options.signal === 'looking_away_signal' ? 'left' : 'center',
1354:       displayName: options.displayName,
1355:       preferredLevel: eventLevel,
1356:       allowedChannels: defaultChannels,
1357:       locale: options.locale,
1358:       variant: options.variant,
1359:       bubbleAllowed: options.bubbleAllowed,
1360:       force: options.force,
1361:     })
1362:   }
1363:
1364:   function recordGatedFeedback(nowMs: number, options?: TriggerVisionPetFeedbackOptions) {
1365:     setTransientState('gated', runtimeOptions.gatedVisualMs)
1366:     commitFeedbackRecord({
1367:       eventType: 'gated',
1368:       state: 'gated',
1369:       at: nowMs,
1370:       sourceEventId: options?.sourceEventId,
1371:       gated: true,
1372:       summary: options?.summary ?? 'Gesture detected but pet feedback gated.',
1373:     })
1374:   }
1375:
1376:   function recordQuietSuppressedFeedback(eventType: 'victory' | 'thumbs_up', nowMs: number, options?: TriggerVisionPetFeedbackOptions) {
1377:     commitFeedbackRecord({
1378:       eventType,
1379:       state: 'quiet',
1380:       at: nowMs,
1381:       sourceEventId: options?.sourceEventId,
1382:       suppressedByQuiet: true,
1383:       summary: eventType === 'victory'
1384:         ? 'Quiet visual mode active, celebration motion suppressed.'
1385:         : 'Quiet visual mode active, acknowledgement motion suppressed.',
1386:     })
1387:     petFeedbackState.value = 'quiet'
1388:   }
1389:
1390:   function triggerVisionPetFeedback(eventType: VisionPetFeedbackEventType, options?: TriggerVisionPetFeedbackOptions) {
1391:     const nowMs = Date.now()
1392:     if (eventType === 'gated') {
1393:       lastTriggeredAt.value.gated = nowMs
1394:       recordGatedFeedback(nowMs, options)
1395:       return false
1396:     }
1397:
1398:     if (!shouldAllowVisualFeedback(options)) {
1399:       lastTriggeredAt.value.gated = nowMs
1400:       recordGatedFeedback(nowMs, options)
1401:       return false
1402:     }
1403:
1404:     if (isInCooldown(eventType, nowMs, options?.force))
1405:       return false
1406:
1407:     lastTriggeredAt.value[eventType] = nowMs
1408:
1409:     if (isQuietVisualMode.value && (eventType === 'victory' || eventType === 'thumbs_up')) {
1410:       recordQuietSuppressedFeedback(eventType, nowMs, options)
1411:       return true
1412:     }
1413:
1414:     if (eventType === 'open_palm') {
1415:       const motion = triggerMotionWithFallback([
1416:         'Idle',
1417:         'FlickDown',
1418:         EmotionNeutralMotionName,
1419:         EmotionThinkMotionName,
1420:         'Neutral',
1421:         'idle',
1422:       ])
1423:       const expression = triggerExpressionWithFallback([
1424:         'neutral',
1425:         'normal',
1426:         'idle',
1427:       ], 1_800)
1428:       activateQuietVisualMode(nowMs)
1429:       commitFeedbackRecord({
1430:         eventType,
1431:         state: 'quiet',
1432:         at: nowMs,
1433:         sourceEventId: options?.sourceEventId,
1434:         motion,
1435:         expression,
1436:         summary: options?.summary ?? 'Quiet visual mode activated.',
1437:       })
1438:       return true
1439:     }
1440:
1441:     if (eventType === 'victory') {
1442:       const motion = triggerMotionWithFallback([
1443:         'Tap@Body',
1444:         'Tap',
1445:         'Flick@Body',
1446:         'Flick',
1447:         EmotionHappyMotionName,
1448:         EmotionNeutralMotionName,
1449:       ])
1450:       const expression = triggerExpressionWithFallback([
1451:         'happy',
1452:         'smile',
1453:       ], runtimeOptions.celebrationVisualMs)
1454:       celebrationCount.value += 1
1455:       setTransientState('celebrating', runtimeOptions.celebrationVisualMs)
1456:       commitFeedbackRecord({
1457:         eventType,
1458:         state: 'celebrating',
1459:         at: nowMs,
1460:         sourceEventId: options?.sourceEventId,
1461:         motion,
1462:         expression,
1463:         summary: options?.summary ?? 'Rin celebrates your completed moment.',
1464:       })
1465:       return true
1466:     }
1467:
1468:     if (eventType === 'thumbs_up') {
1469:       const motion = triggerMotionWithFallback([
1470:         'Tap',
1471:         'Flick',
1472:         'Tap@Body',
1473:         EmotionHappyMotionName,
1474:         EmotionThinkMotionName,
1475:         EmotionNeutralMotionName,
1476:       ])
1477:       const expression = triggerExpressionWithFallback([
1478:         'smile',
1479:         'normal',
1480:         'happy',
1481:       ], runtimeOptions.acknowledgedVisualMs)
1482:       setTransientState('acknowledged', runtimeOptions.acknowledgedVisualMs)
1483:       commitFeedbackRecord({
1484:         eventType,
1485:         state: 'acknowledged',
1486:         at: nowMs,
1487:         sourceEventId: options?.sourceEventId,
1488:         motion,
1489:         expression,
1490:         summary: options?.summary ?? 'Rin acknowledged your prompt.',
1491:       })
1492:       return true
1493:     }
1494:
1495:     if (eventType === 'face_return') {

(Output capped at 50 KB. Showing lines 1-1495. Use offset=1496 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-encrypted-face-profile.ts</path>
<type>file</type>
<content>
1: import { errorMessageFrom } from '@moeru/std'
2: import { computed, ref } from 'vue'
3:
4: export interface FaceSampleQuality {
5:   qualityScore: number
6:   brightness: number
7:   sharpness: number
8:   contrast: number
9:   faceSize: number
10: }
11:
12: export interface VisionFaceProfileSample {
13:   descriptor: number[]
14:   quality: number
15:   brightness: number
16:   sharpness: number
17:   contrast: number
18:   faceSize: number
19:   capturedAt: string
20: }
21:
22: export interface VisionFaceProfilePayload {
23:   schemaVersion: 'vision-face-profile-v1'
24:   id: string
25:   displayName: string
26:   createdAt: string
27:   updatedAt: string
28:   model: string
29:   descriptorVersion: string
30:   threshold: number
31:   qualityThreshold: number
32:   enrollSampleCount: number
33:   stableFrames: number
34:   samples: VisionFaceProfileSample[]
35: }
36:
37: export interface EncryptedFaceProfileBlobV1 {
38:   schemaVersion: 'vision-face-profile-encrypted-v1'
39:   encryptedData: string
40:   salt: string
41:   iv: string
42:   kdf: {
43:     algorithm: 'PBKDF2'
44:     hash: 'SHA-256'
45:     iterations: number
46:   }
47:   encryption: {
48:     algorithm: 'AES-GCM'
49:     tagLength: number
50:   }
51:   createdAt: string
52:   updatedAt: string
53: }
54:
55: export interface EncryptedFaceProfileOptions {
56:   pbkdf2Iterations?: number
57: }
58:
59: const STORAGE_KEY = 'airi.vision-experiment.encrypted-face-profile.v1'
60: const DEFAULT_ITERATIONS = 150_000
61:
62: /**
63:  * Shared encrypted profile state across all composable consumers in the same
64:  * renderer session. Unlock state remains in-memory only and is never persisted.
65:  */
66: const sharedEncryptedBlob = ref<EncryptedFaceProfileBlobV1 | null>(loadBlob())
67: const sharedUnlockedProfile = ref<VisionFaceProfilePayload | null>(null)
68: const sharedErrorMessage = ref('')
69: const sharedIsUnlocking = ref(false)
70: const sharedIsSaving = ref(false)
71: const sharedLastSuccessfulPassphrase = ref('')
72:
73: /**
74:  * Manages encrypted local face profile persistence and unlock lifecycle.
75:  *
76:  * Use when:
77:  * - Face descriptors should only persist encrypted at rest
78:  * - The runtime needs lock/unlock and delete controls
79:  *
80:  * Expects:
81:  * - Browser/Electron renderer provides Web Crypto API
82:  * - Caller collects passphrase input from user each unlock session
83:  *
84:  * Returns:
85:  * - Encrypted blob metadata, unlock state, and save/load/delete actions
86:  */
87: export function useEncryptedFaceProfile(options?: EncryptedFaceProfileOptions) {
88:   const iterations = Math.max(100_000, Math.round(options?.pbkdf2Iterations ?? DEFAULT_ITERATIONS))
89:   const encryptedBlob = sharedEncryptedBlob
90:   const unlockedProfile = sharedUnlockedProfile
91:   const errorMessage = sharedErrorMessage
92:   const isUnlocking = sharedIsUnlocking
93:   const isSaving = sharedIsSaving
94:   const lastSuccessfulPassphrase = sharedLastSuccessfulPassphrase
95:
96:   const hasEncryptedProfile = computed(() => !!encryptedBlob.value)
97:   const isUnlocked = computed(() => !!unlockedProfile.value)
98:   const status = computed<'none' | 'encrypted' | 'unlocked'>(() => {
99:     if (!encryptedBlob.value)
100:       return 'none'
101:     return unlockedProfile.value ? 'unlocked' : 'encrypted'
102:   })
103:
104:   function persistBlob(blob: EncryptedFaceProfileBlobV1 | null) {
105:     if (typeof localStorage === 'undefined')
106:       return
107:
108:     try {
109:       if (!blob)
110:         localStorage.removeItem(STORAGE_KEY)
111:       else
112:         localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
113:     }
114:     catch {
115:       // ignore persistence failure
116:     }
117:   }
118:
119:   function clearError() {
120:     errorMessage.value = ''
121:   }
122:
123:   async function saveEncryptedProfile(profile: VisionFaceProfilePayload, passphrase: string) {
124:     clearError()
125:     isSaving.value = true
126:     try {
127:       if (!passphrase.trim())
128:         throw new Error('Passphrase required')
129:
130:       const nowIso = new Date().toISOString()
131:       const normalizedProfile: VisionFaceProfilePayload = {
132:         ...profile,
133:         schemaVersion: 'vision-face-profile-v1',
134:         updatedAt: nowIso,
135:       }
136:
137:       const salt = crypto.getRandomValues(new Uint8Array(16))
138:       const iv = crypto.getRandomValues(new Uint8Array(12))
139:       const key = await deriveAesKeyFromPassphrase(passphrase, salt, iterations)
140:       const encodedProfile = new TextEncoder().encode(JSON.stringify(normalizedProfile))
141:       const encrypted = await crypto.subtle.encrypt(
142:         { name: 'AES-GCM', iv, tagLength: 128 },
143:         key,
144:         encodedProfile,
145:       )
146:
147:       const nextBlob: EncryptedFaceProfileBlobV1 = {
148:         schemaVersion: 'vision-face-profile-encrypted-v1',
149:         encryptedData: bytesToBase64(new Uint8Array(encrypted)),
150:         salt: bytesToBase64(salt),
151:         iv: bytesToBase64(iv),
152:         kdf: {
153:           algorithm: 'PBKDF2',
154:           hash: 'SHA-256',
155:           iterations,
156:         },
157:         encryption: {
158:           algorithm: 'AES-GCM',
159:           tagLength: 128,
160:         },
161:         createdAt: encryptedBlob.value?.createdAt ?? nowIso,
162:         updatedAt: nowIso,
163:       }
164:
165:       encryptedBlob.value = nextBlob
166:       unlockedProfile.value = normalizedProfile
167:       lastSuccessfulPassphrase.value = passphrase
168:       persistBlob(nextBlob)
169:       return { ok: true as const }
170:     }
171:     catch (error) {
172:       errorMessage.value = errorMessageFrom(error) ?? 'Failed to save encrypted profile.'
173:       return { ok: false as const, reason: errorMessage.value }
174:     }
175:     finally {
176:       isSaving.value = false
177:     }
178:   }
179:
180:   async function unlockProfile(passphrase: string) {
181:     clearError()
182:     isUnlocking.value = true
183:     try {
184:       if (!encryptedBlob.value)
185:         throw new Error('No encrypted profile')
186:       if (!passphrase.trim())
187:         throw new Error('Passphrase required')
188:
189:       const salt = base64ToBytes(encryptedBlob.value.salt)
190:       const iv = base64ToBytes(encryptedBlob.value.iv)
191:       const cipherBytes = base64ToBytes(encryptedBlob.value.encryptedData)
192:       const key = await deriveAesKeyFromPassphrase(passphrase, salt, encryptedBlob.value.kdf.iterations)
193:       const decrypted = await crypto.subtle.decrypt(
194:         { name: 'AES-GCM', iv, tagLength: encryptedBlob.value.encryption.tagLength },
195:         key,
196:         cipherBytes,
197:       )
198:       const json = new TextDecoder().decode(new Uint8Array(decrypted))
199:       const parsed = JSON.parse(json) as VisionFaceProfilePayload
200:       if (!parsed || !Array.isArray(parsed.samples))
201:         throw new Error('Invalid profile payload')
202:
203:       unlockedProfile.value = parsed
204:       lastSuccessfulPassphrase.value = passphrase
205:       return { ok: true as const, profile: parsed }
206:     }
207:     catch {
208:       errorMessage.value = 'Unable to unlock local face profile.'
209:       unlockedProfile.value = null
210:       return { ok: false as const, reason: errorMessage.value }
211:     }
212:     finally {
213:       isUnlocking.value = false
214:     }
215:   }
216:
217:   function lockProfile() {
218:     unlockedProfile.value = null
219:     lastSuccessfulPassphrase.value = ''
220:   }
221:
222:   function deleteProfile() {
223:     encryptedBlob.value = null
224:     unlockedProfile.value = null
225:     lastSuccessfulPassphrase.value = ''
226:     clearError()
227:     persistBlob(null)
228:   }
229:
230:   return {
231:     encryptedBlob,
232:     unlockedProfile,
233:     hasEncryptedProfile,
234:     isUnlocked,
235:     status,
236:     errorMessage,
237:     isUnlocking,
238:     isSaving,
239:     lastSuccessfulPassphrase,
240:     saveEncryptedProfile,
241:     unlockProfile,
242:     lockProfile,
243:     deleteProfile,
244:     clearError,
245:   }
246: }
247:
248: function loadBlob() {
249:   if (typeof localStorage === 'undefined')
250:     return null
251:
252:   try {
253:     const raw = localStorage.getItem(STORAGE_KEY)
254:     if (!raw)
255:       return null
256:     const parsed = JSON.parse(raw) as EncryptedFaceProfileBlobV1
257:     if (!parsed?.encryptedData || !parsed?.salt || !parsed?.iv || !parsed?.kdf?.iterations)
258:       return null
259:     return parsed
260:   }
261:   catch {
262:     return null
263:   }
264: }
265:
266: async function deriveAesKeyFromPassphrase(passphrase: string, salt: Uint8Array, iterations: number) {
267:   const encoded = new TextEncoder().encode(passphrase)
268:   const normalizedSalt = new Uint8Array(salt)
269:   const baseKey = await crypto.subtle.importKey(
270:     'raw',
271:     encoded,
272:     'PBKDF2',
273:     false,
274:     ['deriveKey'],
275:   )
276:
277:   return await crypto.subtle.deriveKey(
278:     {
279:       name: 'PBKDF2',
280:       hash: 'SHA-256',
281:       salt: normalizedSalt.buffer,
282:       iterations,
283:     },
284:     baseKey,
285:     { name: 'AES-GCM', length: 256 },
286:     false,
287:     ['encrypt', 'decrypt'],
288:   )
289: }
290:
291: function bytesToBase64(bytes: Uint8Array) {
292:   let binary = ''
293:   for (const byte of bytes)
294:     binary += String.fromCharCode(byte)
295:   return btoa(binary)
296: }
297:
298: function base64ToBytes(base64: string) {
299:   const binary = atob(base64)
300:   const bytes = new Uint8Array(binary.length)
301:   for (let i = 0; i < binary.length; i += 1)
302:     bytes[i] = binary.charCodeAt(i)
303:   return bytes
304: }

(End of file - total 304 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts"
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/composables/use-opencv-face-quality.ts</path>
<type>file</type>
<content>
1: import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
2:
3: import type { FaceSampleQuality } from './use-encrypted-face-profile'
4:
5: import { computed, ref, shallowRef } from 'vue'
6:
7: import { extractFaceBounds } from './use-local-face-gate'
8:
9: type OpenCvModule = typeof import('@techstark/opencv-js')
10: type OpenCvInstance = OpenCvModule & {
11:   onRuntimeInitialized?: () => void
12: }
13:
14: export type OpenCvStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'fallback'
15:
16: export interface OpenCvFaceQualityResult extends FaceSampleQuality {
17:   accepted: boolean
18:   reason?: 'low_quality' | 'face_too_small' | 'opencv_not_ready' | 'invalid_frame'
19:   patchDataUrl?: string
20: }
21:
22: export interface OpenCvFaceQualityConfig {
23:   outputSize?: number
24:   qualityThreshold?: number
25:   minFaceSizeNormalized?: number
26:   brightnessRange?: { min: number, max: number }
27:   contrastMin?: number
28:   sharpnessMin?: number
29: }
30:
31: const DEFAULT_CONFIG: Required<OpenCvFaceQualityConfig> = {
32:   outputSize: 112,
33:   qualityThreshold: 0.45,
34:   minFaceSizeNormalized: 0.13,
35:   brightnessRange: { min: 55, max: 210 },
36:   contrastMin: 24,
37:   sharpnessMin: 22,
38: }
39:
40: export function useOpenCvFaceQuality(partialConfig?: OpenCvFaceQualityConfig) {
41:   const config = {
42:     ...DEFAULT_CONFIG,
43:     ...partialConfig,
44:   }
45:   const status = ref<OpenCvStatus>('idle')
46:   const errorMessage = ref('')
47:   const latestQuality = ref<OpenCvFaceQualityResult | null>(null)
48:   const cvInstance = shallowRef<OpenCvInstance | null>(null)
49:   const scratchCanvas = shallowRef<HTMLCanvasElement | null>(null)
50:   let initializePromise: Promise<OpenCvInstance | null> | null = null
51:
52:   const isReady = computed(() => status.value === 'ready')
53:   const usesFallback = computed(() => status.value === 'fallback')
54:
55:   async function initializeOpenCv() {
56:     if (cvInstance.value)
57:       return cvInstance.value
58:     if (initializePromise)
59:       return initializePromise
60:
61:     initializePromise = (async () => {
62:       status.value = 'loading'
63:       errorMessage.value = ''
64:
65:       try {
66:         const module = (await import('@techstark/opencv-js')) as OpenCvInstance | Promise<OpenCvInstance>
67:         const cv = await normalizeOpenCvModule(module)
68:         cvInstance.value = cv
69:         status.value = 'ready'
70:         return cv
71:       }
72:       catch (error) {
73:         status.value = 'fallback'
74:         errorMessage.value = `OpenCV initialization failed. ${String(error)}`
75:         return null
76:       }
77:       finally {
78:         initializePromise = null
79:       }
80:     })()
81:
82:     return initializePromise
83:   }
84:
85:   function markFallback(message: string) {
86:     cvInstance.value = null
87:     initializePromise = null
88:     status.value = 'fallback'
89:     errorMessage.value = message
90:   }
91:
92:   function resetRuntime() {
93:     cvInstance.value = null
94:     initializePromise = null
95:     status.value = 'idle'
96:     errorMessage.value = ''
97:     latestQuality.value = null
98:     scratchCanvas.value = null
99:   }
100:
101:   async function evaluateFaceQuality(video: HTMLVideoElement, landmarks: NormalizedLandmark[]) {
102:     try {
103:       const bounds = extractFaceBounds(landmarks)
104:       if (!bounds) {
105:         const fallback = createRejectedResult('invalid_frame')
106:         latestQuality.value = fallback
107:         return fallback
108:       }
109:
110:       const minSize = Math.min(bounds.width, bounds.height)
111:       if (minSize < config.minFaceSizeNormalized) {
112:         const rejected = createRejectedResult('face_too_small')
113:         latestQuality.value = rejected
114:         return rejected
115:       }
116:
117:       const cv = cvInstance.value
118:       if (!cv || status.value !== 'ready') {
119:         const fallback = evaluateQualityWithCanvasFallback(video, bounds, config)
120:         latestQuality.value = fallback
121:         return fallback
122:       }
123:
124:       const result = evaluateWithOpenCv({
125:         cv,
126:         video,
127:         bounds,
128:         outputSize: config.outputSize,
129:         qualityThreshold: config.qualityThreshold,
130:         brightnessRange: config.brightnessRange,
131:         contrastMin: config.contrastMin,
132:         sharpnessMin: config.sharpnessMin,
133:         scratchCanvas,
134:       })
135:       latestQuality.value = result
136:       return result
137:     }
138:     catch {
139:       const fallback = createRejectedResult('invalid_frame')
140:       latestQuality.value = fallback
141:       return fallback
142:     }
143:   }
144:
145:   return {
146:     status,
147:     errorMessage,
148:     latestQuality,
149:     isReady,
150:     usesFallback,
151:     initializeOpenCv,
152:     markFallback,
153:     resetRuntime,
154:     evaluateFaceQuality,
155:   }
156: }
157:
158: async function normalizeOpenCvModule(module: OpenCvInstance | Promise<OpenCvInstance>) {
159:   const maybeResolved = await module
160:   const maybeDefault = (maybeResolved as { default?: unknown })?.default
161:   const candidate = (maybeDefault ?? maybeResolved) as OpenCvInstance | Promise<OpenCvInstance>
162:   if (candidate instanceof Promise)
163:     return await normalizeOpenCvModule(await candidate)
164:   if (typeof candidate.getBuildInformation === 'function')
165:     return candidate
166:
167:   await new Promise<void>((resolve, reject) => {
168:     let timeoutId: number | null = null
169:     const clear = () => {
170:       if (timeoutId !== null)
171:         clearTimeout(timeoutId)
172:     }
173:     timeoutId = window.setTimeout(() => {
174:       clear()
175:       reject(new Error('OpenCV runtime initialization timeout'))
176:     }, 8_000)
177:
178:     candidate.onRuntimeInitialized = () => {
179:       clear()
180:       resolve()
181:     }
182:   })
183:
184:   return candidate
185: }
186:
187: function evaluateWithOpenCv(options: {
188:   cv: OpenCvInstance
189:   video: HTMLVideoElement
190:   bounds: NonNullable<ReturnType<typeof extractFaceBounds>>
191:   outputSize: number
192:   qualityThreshold: number
193:   brightnessRange: { min: number, max: number }
194:   contrastMin: number
195:   sharpnessMin: number
196:   scratchCanvas: { value: HTMLCanvasElement | null }
197: }): OpenCvFaceQualityResult {
198:   const { cv, video, bounds } = options
199:   const sourceWidth = Math.max(1, video.videoWidth)
200:   const sourceHeight = Math.max(1, video.videoHeight)
201:
202:   const marginX = bounds.width * 0.20
203:   const marginY = bounds.height * 0.20
204:   const cropMinX = clamp01(bounds.minX - marginX)
205:   const cropMaxX = clamp01(bounds.maxX + marginX)
206:   const cropMinY = clamp01(bounds.minY - marginY)
207:   const cropMaxY = clamp01(bounds.maxY + marginY)
208:   const cropX = Math.max(0, Math.round(cropMinX * sourceWidth))
209:   const cropY = Math.max(0, Math.round(cropMinY * sourceHeight))
210:   const cropWidth = Math.max(1, Math.round((cropMaxX - cropMinX) * sourceWidth))
211:   const cropHeight = Math.max(1, Math.round((cropMaxY - cropMinY) * sourceHeight))
212:
213:   const canvas = options.scratchCanvas.value ?? document.createElement('canvas')
214:   options.scratchCanvas.value = canvas
215:   canvas.width = sourceWidth
216:   canvas.height = sourceHeight
217:   const ctx = canvas.getContext('2d', { willReadFrequently: true })
218:   if (!ctx)
219:     return createRejectedResult('invalid_frame')
220:   ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight)
221:   const frameData = ctx.getImageData(0, 0, sourceWidth, sourceHeight)
222:
223:   let src: any
224:   let rgba: any
225:   let faceRoi: any
226:   let resized: any
227:   let gray: any
228:   let equalized: any
229:   let laplacian: any
230:
231:   try {
232:     src = cv.matFromImageData(frameData)
233:     rgba = new cv.Mat()
234:     cv.cvtColor(src, rgba, cv.COLOR_RGBA2RGB)
235:
236:     const rect = new cv.Rect(cropX, cropY, Math.min(cropWidth, rgba.cols - cropX), Math.min(cropHeight, rgba.rows - cropY))
237:     faceRoi = rgba.roi(rect)
238:
239:     resized = new cv.Mat()
240:     cv.resize(faceRoi, resized, new cv.Size(options.outputSize, options.outputSize), 0, 0, cv.INTER_AREA)
241:
242:     gray = new cv.Mat()
243:     cv.cvtColor(resized, gray, cv.COLOR_RGB2GRAY)
244:
245:     equalized = new cv.Mat()
246:     cv.equalizeHist(gray, equalized)
247:
248:     laplacian = new cv.Mat()
249:     cv.Laplacian(equalized, laplacian, cv.CV_64F)
250:
251:     const brightness = cv.mean(gray)[0] as number
252:     const contrast = computeContrastFromGray(equalized)
253:     const sharpness = computeVariance(laplacian)
254:     const faceSize = Math.min(bounds.width, bounds.height)
255:
256:     const brightnessScore = normalizedBrightnessScore(brightness, options.brightnessRange.min, options.brightnessRange.max)
257:     const contrastScore = Math.min(1, contrast / Math.max(options.contrastMin, 1))
258:     const sharpnessScore = Math.min(1, sharpness / Math.max(options.sharpnessMin, 1))
259:     const sizeScore = Math.min(1, faceSize / 0.35)
260:     const qualityScore = clamp01((brightnessScore * 0.28) + (contrastScore * 0.24) + (sharpnessScore * 0.34) + (sizeScore * 0.14))
261:
262:     const accepted = qualityScore >= options.qualityThreshold
263:     return {
264:       accepted,
265:       reason: accepted ? undefined : 'low_quality',
266:       qualityScore,
267:       brightness,
268:       sharpness,
269:       contrast,
270:       faceSize,
271:     }
272:   }
273:   catch {
274:     return createRejectedResult('invalid_frame')
275:   }
276:   finally {
277:     safeDelete(laplacian)
278:     safeDelete(equalized)
279:     safeDelete(gray)
280:     safeDelete(resized)
281:     safeDelete(faceRoi)
282:     safeDelete(rgba)
283:     safeDelete(src)
284:   }
285: }
286:
287: function safeDelete(mat: { delete?: () => void } | null | undefined) {
288:   try {
289:     mat?.delete?.()
290:   }
291:   catch {
292:     // noop
293:   }
294: }
295:
296: function computeVariance(mat: any) {
297:   const total = mat.rows * mat.cols
298:   if (!total)
299:     return 0
300:   let sum = 0
301:   let sumSq = 0
302:   for (let y = 0; y < mat.rows; y += 1) {
303:     for (let x = 0; x < mat.cols; x += 1) {
304:       const value = mat.doubleAt(y, x) as number
305:       sum += value
306:       sumSq += value * value
307:     }
308:   }
309:   const mean = sum / total
310:   return Math.max(0, (sumSq / total) - (mean * mean))
311: }
312:
313: function computeContrastFromGray(gray: any) {
314:   const total = gray.rows * gray.cols
315:   if (!total)
316:     return 0
317:   let sum = 0
318:   for (let y = 0; y < gray.rows; y += 1) {
319:     for (let x = 0; x < gray.cols; x += 1)
320:       sum += gray.ucharAt(y, x) as number
321:   }
322:   const mean = sum / total
323:   let varianceSum = 0
324:   for (let y = 0; y < gray.rows; y += 1) {
325:     for (let x = 0; x < gray.cols; x += 1) {
326:       const value = gray.ucharAt(y, x) as number
327:       const delta = value - mean
328:       varianceSum += delta * delta
329:     }
330:   }
331:   return Math.sqrt(Math.max(0, varianceSum / total))
332: }
333:
334: function evaluateQualityWithCanvasFallback(
335:   video: HTMLVideoElement,
336:   bounds: NonNullable<ReturnType<typeof extractFaceBounds>>,
337:   config: Required<OpenCvFaceQualityConfig>,
338: ): OpenCvFaceQualityResult {
339:   const sourceWidth = Math.max(1, video.videoWidth)
340:   const sourceHeight = Math.max(1, video.videoHeight)
341:   const marginX = bounds.width * 0.20
342:   const marginY = bounds.height * 0.20
343:   const cropMinX = clamp01(bounds.minX - marginX)
344:   const cropMaxX = clamp01(bounds.maxX + marginX)
345:   const cropMinY = clamp01(bounds.minY - marginY)
346:   const cropMaxY = clamp01(bounds.maxY + marginY)
347:   const cropX = Math.max(0, Math.round(cropMinX * sourceWidth))
348:   const cropY = Math.max(0, Math.round(cropMinY * sourceHeight))
349:   const cropWidth = Math.max(1, Math.round((cropMaxX - cropMinX) * sourceWidth))
350:   const cropHeight = Math.max(1, Math.round((cropMaxY - cropMinY) * sourceHeight))
351:
352:   const canvas = document.createElement('canvas')
353:   canvas.width = config.outputSize
354:   canvas.height = config.outputSize
355:   const ctx = canvas.getContext('2d', { willReadFrequently: true })
356:   if (!ctx)
357:     return createRejectedResult('invalid_frame')
358:   ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, config.outputSize, config.outputSize)
359:   const imageData = ctx.getImageData(0, 0, config.outputSize, config.outputSize)
360:   const metrics = computeCanvasMetrics(imageData.data)
361:   const faceSize = Math.min(bounds.width, bounds.height)
362:   const brightnessScore = normalizedBrightnessScore(metrics.brightness, config.brightnessRange.min, config.brightnessRange.max)
363:   const contrastScore = Math.min(1, metrics.contrast / Math.max(config.contrastMin, 1))
364:   const sharpnessScore = Math.min(1, metrics.sharpness / Math.max(config.sharpnessMin, 1))
365:   const sizeScore = Math.min(1, faceSize / 0.35)
366:   const qualityScore = clamp01((brightnessScore * 0.28) + (contrastScore * 0.24) + (sharpnessScore * 0.34) + (sizeScore * 0.14))
367:   const accepted = qualityScore >= config.qualityThreshold
368:
369:   return {
370:     accepted,
371:     reason: accepted ? undefined : 'low_quality',
372:     qualityScore,
373:     brightness: metrics.brightness,
374:     sharpness: metrics.sharpness,
375:     contrast: metrics.contrast,
376:     faceSize,
377:   }
378: }
379:
380: function computeCanvasMetrics(rgba: Uint8ClampedArray) {
381:   const pixelCount = Math.max(1, rgba.length / 4)
382:   const gray = new Float32Array(pixelCount)
383:   let sum = 0
384:   for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
385:     const value = (0.299 * (rgba[i] ?? 0)) + (0.587 * (rgba[i + 1] ?? 0)) + (0.114 * (rgba[i + 2] ?? 0))
386:     gray[j] = value
387:     sum += value
388:   }
389:   const brightness = sum / pixelCount
390:   let varianceAccumulator = 0
391:   for (let i = 0; i < gray.length; i += 1) {
392:     const delta = (gray[i] ?? 0) - brightness
393:     varianceAccumulator += delta * delta
394:   }
395:   const contrast = Math.sqrt(varianceAccumulator / pixelCount)
396:
397:   const width = Math.round(Math.sqrt(pixelCount))
398:   const height = width
399:   let laplaceSum = 0
400:   let laplaceSquaredSum = 0
401:   let laplaceCount = 0
402:   for (let y = 1; y < height - 1; y += 1) {
403:     for (let x = 1; x < width - 1; x += 1) {
404:       const idx = (y * width) + x
405:       const center = gray[idx] ?? 0
406:       const left = gray[idx - 1] ?? 0
407:       const right = gray[idx + 1] ?? 0
408:       const up = gray[idx - width] ?? 0
409:       const down = gray[idx + width] ?? 0
410:       const laplace = (4 * center) - left - right - up - down
411:       laplaceSum += laplace
412:       laplaceSquaredSum += laplace * laplace
413:       laplaceCount += 1
414:     }
415:   }
416:   const laplaceMean = laplaceCount > 0 ? laplaceSum / laplaceCount : 0
417:   const sharpness = laplaceCount > 0
418:     ? Math.max(0, (laplaceSquaredSum / laplaceCount) - (laplaceMean * laplaceMean))
419:     : 0
420:
421:   return {
422:     brightness,
423:     contrast,
424:     sharpness,
425:   }
426: }
427:
428: function createRejectedResult(reason: OpenCvFaceQualityResult['reason']) {
429:   return {
430:     accepted: false,
431:     reason,
432:     qualityScore: 0,
433:     brightness: 0,
434:     sharpness: 0,
435:     contrast: 0,
436:     faceSize: 0,
437:   }
438: }
439:
440: function normalizedBrightnessScore(brightness: number, min: number, max: number) {
441:   if (brightness < min)
442:     return clamp01(brightness / Math.max(min, 1))
443:   if (brightness > max)
444:     return clamp01((255 - brightness) / Math.max(255 - max, 1))
445:   return 1
446: }
447:
448: function clamp01(value: number) {
449:   return Math.min(1, Math.max(0, value))
450: }

(End of file - total 450 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue",
  "limit": 300,
  "offset": 1434
}
```

**Output:**
```
<path>/Users/lifulin/Downloads/Rin/apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue</path>
<type>file</type>
<content>
1434:             <div>Quiet remaining seconds: {{ isQuietVisualMode ? petQuietRemainingSeconds : 0 }}</div>
1435:             <div>Celebration count: {{ petCelebrationCount }}</div>
1436:             <div
1437:               v-if="shouldShowPetFeedbackGatedHint"
1438:               :class="['mt-1 text-amber-600 dark:text-amber-300']"
1439:             >
1440:               Gesture detected but pet feedback gated.
1441:             </div>
1442:             <div v-if="isQuietVisualMode" :class="['mt-2 flex items-center gap-2']">
1443:               <Button size="sm" variant="ghost" @click="cancelQuietVisualMode">
1444:                 关闭 quiet visual mode
1445:               </Button>
1446:             </div>
1447:           </div>
1448:
1449:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1450:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1451:               Contextual feedback diagnostics
1452:             </div>
1453:             <label :class="['mb-2 flex items-center gap-2']">
1454:               <span>Locale:</span>
1455:               <select
1456:                 data-testid="feedback-locale-select"
1457:                 :value="feedbackLocale"
1458:                 :class="[
1459:                   'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
1460:                   'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
1461:                 ]"
1462:                 @change="onFeedbackLocaleChange"
1463:               >
1464:                 <option
1465:                   v-for="option in feedbackLocaleOptions"
1466:                   :key="option.value"
1467:                   :value="option.value"
1468:                 >
1469:                   {{ option.label }}
1470:                 </option>
1471:               </select>
1472:             </label>
1473:             <label :class="['mb-2 flex items-center gap-2']">
1474:               <span>Variant:</span>
1475:               <select
1476:                 data-testid="feedback-variant-select"
1477:                 :value="feedbackVariant"
1478:                 :class="[
1479:                   'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
1480:                   'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
1481:                 ]"
1482:                 @change="onFeedbackVariantChange"
1483:               >
1484:                 <option
1485:                   v-for="option in feedbackVariantOptions"
1486:                   :key="option.value"
1487:                   :value="option.value"
1488:                 >
1489:                   {{ option.label }}
1490:                 </option>
1491:               </select>
1492:             </label>
1493:             <div>lastFeedbackType: {{ lastContextualFeedbackTypeText }}</div>
1494:             <div>resolvedFeedbackEventType: {{ resolvedFeedbackEventTypeText }}</div>
1495:             <div>transitionFeedback: {{ transitionFeedbackBadgeText }}</div>
1496:             <div>feedbackLevel: {{ contextualFeedbackLevelText }}</div>
1497:             <div>feedbackPriority: {{ contextualFeedbackPriorityText }}</div>
1498:             <div>feedbackChannels: {{ contextualFeedbackChannelsText }}</div>
1499:             <div>feedbackTemplateId: {{ contextualFeedbackTemplateIdText }}</div>
1500:             <div>activeBubbleLevel: {{ activeBubbleLevelText }}</div>
1501:             <div>activeBubbleEventType: {{ activeBubbleEventTypeText }}</div>
1502:             <div>activeBubbleTemplateId: {{ activeBubbleTemplateIdText }}</div>
1503:             <div>bubbleVisibleUntil: {{ bubbleVisibleUntil }}</div>
1504:             <div>bubbleRemainingSec: {{ bubbleRemainingSeconds }}</div>
1505:             <div>nextAllowedFeedbackIn: {{ nextAllowedFeedbackSeconds }}</div>
1506:             <div>dwellStatus: {{ dwellStatusText }}</div>
1507:             <div>subjectResponseCooldownSec: {{ subjectResponseCooldownSeconds }}</div>
1508:             <div>subjectPositionChangedAt: {{ subjectPositionChangedText }}</div>
1509:           </div>
1510:
1511:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1512:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1513:               Advanced / Experimental Gesture Controls
1514:             </div>
1515:             <label :class="['mb-2 flex items-center gap-2']">
1516:               <input
1517:                 data-testid="gesture-controls-toggle"
1518:                 type="checkbox"
1519:                 :checked="gestureControlsEnabled"
1520:                 @change="toggleGestureControls"
1521:               >
1522:               <span>Enable experimental gesture controls</span>
1523:             </label>
1524:             <div>gestureEnabled: {{ gestureControlsEnabled ? 'true' : 'false' }}</div>
1525:             <Button
1526:               data-testid="gesture-diagnostics-toggle"
1527:               size="sm"
1528:               variant="ghost"
1529:               @click="gestureDiagnosticsExpanded = !gestureDiagnosticsExpanded"
1530:             >
1531:               {{ gestureDiagnosticsExpanded ? 'Hide gesture diagnostics' : 'Show gesture diagnostics' }}
1532:             </Button>
1533:             <div v-if="showAdvancedGestureDiagnostics" :class="['mt-2']">
1534:               <div>candidateGesture: {{ candidateGesture }}</div>
1535:               <div>stableGesture: {{ stableGesture }}</div>
1536:               <div>gestureState: {{ gestureState }}</div>
1537:               <div>gestureConfidence: {{ gestureConfidenceText }}</div>
1538:               <div>gestureVotes: {{ gestureVoteText }}</div>
1539:               <div>geometryPassRate: {{ geometryPassRateText }}</div>
1540:               <div>gestureQualityState: {{ gestureQualityState }}</div>
1541:               <div>handSize: {{ handSizeRatioText }}</div>
1542:               <div>handInsideGuideArea: {{ handInsideGuideArea ? 'true' : 'false' }}</div>
1543:               <div>holdProgress: {{ holdProgressText }}</div>
1544:               <div>cooldownRemainingMs: {{ cooldownRemainingText }}</div>
1545:               <div>releaseRequired: {{ releaseRequired ? 'true' : 'false' }}</div>
1546:               <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
1547:                 {{ gestureCalibrationHint }}
1548:               </div>
1549:               <div :class="['text-neutral-500 dark:text-neutral-400']">
1550:                 Move your hand closer.
1551:               </div>
1552:               <div :class="['text-neutral-500 dark:text-neutral-400']">
1553:                 Keep your hand inside the guide area.
1554:               </div>
1555:               <div :class="['text-neutral-500 dark:text-neutral-400']">
1556:                 Hold the gesture steady.
1557:               </div>
1558:               <div :class="['text-neutral-500 dark:text-neutral-400']">
1559:                 Release your hand to trigger again.
1560:               </div>
1561:               <div :class="['text-neutral-500 dark:text-neutral-400']">
1562:                 Better lighting may help.
1563:               </div>
1564:             </div>
1565:             <div
1566:               v-else
1567:               :class="['mt-1 text-neutral-500 dark:text-neutral-400']"
1568:             >
1569:               Gesture diagnostics are collapsed by default.
1570:             </div>
1571:           </div>
1572:
1573:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1574:             <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
1575:               面部动作信号诊断
1576:             </div>
1577:             <Button
1578:               data-testid="expression-diagnostics-toggle"
1579:               size="sm"
1580:               variant="ghost"
1581:               @click="expressionSignalDiagnosticsExpanded = !expressionSignalDiagnosticsExpanded"
1582:             >
1583:               {{ expressionSignalDiagnosticsExpanded ? '收起信号诊断' : '展开信号诊断' }}
1584:             </Button>
1585:             <div v-if="expressionSignalDiagnosticsExpanded" :class="['mt-2']">
1586:               <div>{{ formatVisionFieldLabel('expressionSignal', statusLocale) }}：{{ formatExpressionSignal(expressionSignal, statusLocale) }}</div>
1587:               <div>候选信号：{{ formatExpressionSignal(expressionSignalCandidate, statusLocale) }}</div>
1588:               <div>{{ formatVisionFieldLabel('stableExpressionSignal', statusLocale) }}：{{ formatExpressionSignal(stableExpressionSignal, statusLocale) }}</div>
1589:               <div>{{ formatVisionFieldLabel('confidence', statusLocale) }}：{{ expressionSignalConfidenceText }}</div>
1590:               <div>{{ formatVisionFieldLabel('reason', statusLocale) }}：{{ expressionSignalReason }}</div>
1591:               <div>{{ formatVisionFieldLabel('source', statusLocale) }}：{{ formatVisionStatusValue(expressionSignalSource, statusLocale) }}</div>
1592:               <div>稳定帧：{{ expressionSignalStableFrames }}</div>
1593:               <div>最近变化：{{ expressionSignalChangedText }}</div>
1594:               <div>{{ formatVisionFieldLabel('cooldown', statusLocale) }}：{{ expressionSignalCooldownRemainingSeconds }}s</div>
1595:               <div>反馈放行：{{ expressionSignalFeedbackAllowed ? formatVisionStatusValue('yes', statusLocale) : formatVisionStatusValue('no', statusLocale) }}</div>
1596:               <div>信号不可用：{{ expressionSignalUnavailable ? formatVisionStatusValue('yes', statusLocale) : formatVisionStatusValue('no', statusLocale) }}</div>
1597:             </div>
1598:           </div>
1599:
1600:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1601:             <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
1602:               最近事件
1603:             </div>
1604:             <div v-if="lastEvent">
1605:               {{ lastEvent.message }} ({{ new Date(lastEvent.at).toLocaleTimeString() }})
1606:             </div>
1607:             <div v-else>
1608:               无
1609:             </div>
1610:           </div>
1611:
1612:           <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1613:             <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
1614:               当前提示
1615:             </div>
1616:             <div v-if="activePrompt">
1617:               {{ activePrompt }}
1618:             </div>
1619:             <div v-else>
1620:               无
1621:             </div>
1622:           </div>
1623:
1624:           <label :class="['mt-2 flex flex-col gap-1 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
1625:             <span :class="['font-600 text-neutral-700 dark:text-neutral-200']">推理停滞补偿（毫秒）</span>
1626:             <input
1627:               v-model="maxInferenceStallInput"
1628:               inputmode="numeric"
1629:               :class="[
1630:                 'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
1631:                 'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
1632:               ]"
1633:               placeholder="1200"
1634:             >
1635:           </label>
1636:         </div>
1637:
1638:         <div v-if="errorMessage" :class="['rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/35 dark:text-rose-300']">
1639:           {{ errorMessage }}
1640:         </div>
1641:
1642:         <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
1643:           摄像头默认关闭。
1644:         </div>
1645:         <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
1646:           识别仅在本地运行。
1647:         </div>
1648:         <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
1649:           人脸门控为可选项，使用本地加密档案。
1650:         </div>
1651:         <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
1652:           不会上传任何摄像头数据。
1653:         </div>
1654:
1655:         <video
1656:           ref="videoRef"
1657:           muted
1658:           playsinline
1659:           :class="['h-0 w-0 op-0 pointer-events-none']"
1660:         />
1661:       </div>
1662:     </div>
1663:   </div>
1664: </template>

(End of file - total 1664 lines)
</content>
```

---

## Assistant (Build · MiMo-V2.5-Pro · 122.5s)

_Thinking:_

现在我已经读取了足够的关键文件来全面了解项目的当前状态。让我继续读取一些辅助文件来补充分析。

现在我已经完成了对项目代码的全面审查。以下是完整的只读型产品迭代审查报告。

---

# Rin 桌宠项目 — 只读型产品迭代审查报告

## 一、当前分支和工作区状态

- **当前分支**: `integration/final-hci-demo`
- **工作区状态**: 干净（无未提交更改）

---

## 二、当前实现地图

### 1. 学习模块当前已实现

| 能力 | 状态 | 代码位置 |
|---|---|---|
| **学习入口** | Controls Island 内嵌面板（book 图标按钮） | `controls-island/index.vue:466-485` |
| **专注计时 / 番茄钟** | ✅ 完整实现：focus / break / paused / idle 四状态机，25分钟专注+5分钟休息，演示模式1分钟+15秒 | `study-companion.ts` store |
| **今日任务** | ✅ 添加/完成/删除任务，跨日自动清空 | `TaskList.vue` + `study-companion.ts` |
| **提醒策略** | ✅ 低打扰提醒策略，30秒节流，专注期抑制，静音支持 | `use-study-reminder-policy.ts` |
| **低打扰机制** | ✅ 静音30分钟，专注期不弹提醒，bubble 文案节流 | `use-study-companion-bubble.ts` |
| **Live2D / Rin 反馈联动** | ✅ 专注→Think，休息→Curious，完成→Happy，任务过多→Awkward | `use-study-stage-feedback.ts` |
| **统计 / 日志 / 导出** | ✅ 今日统计卡片，活动日志（最近50条），JSON 快照导出 | `settings/study/index.vue` |
| **设置页** | ✅ 独立设置页，含统计/日志/导出/清空操作 | `settings/study/index.vue` |
| **持久化** | ✅ localStorage 手动重置，含跨日 rollover | `useLocalStorageManualReset` |
| **主舞台接入** | ✅ StudyBubble 组件显示在主舞台，useStudyStageFeedback 驱动 Live2D | `index.vue` |
| **演示模式** | ✅ 切换后计时缩短为1分钟专注/15秒休息 | `study-companion.ts` |
| **Bubble 文案系统** | ✅ 7类事件×7条文案，去重+节流+上下文感知 | `study-companion-bubble-copy-resolver.ts` |

**半成品/缺失**:
- 无"开始下一轮专注"一键入口（需先重置再开始）
- 无"继续上次任务"功能
- 无任务完成正反馈动画/音效
- 无专注结束后的选择卡片（休息/继续/完成任务）
- 无空状态引导（"还没有今日任务，点击添加"）
- 无快捷键
- 无帮助入口

### 2. 视觉模块当前已实现

| 能力 | 状态 | 代码位置 |
|---|---|---|
| **Vision Island 入口** | Controls Island 内嵌面板（camera 图标按钮） | `controls-island/index.vue:487-506` |
| **Vision Runtime Manager** | ✅ 单例，MediaPipe + OpenCV 双引擎，本地/远程回退 | `use-vision-runtime.ts` |
| **摄像头控制** | ✅ 开启/关闭，权限检测，轨道诊断 | `use-vision-interaction.ts` |
| **Face Gate** | ✅ 本地人脸门控，支持 enable/disable/gated/locked 四状态 | `use-local-face-gate.ts` |
| **Face Enrollment** | ✅ 独立录入页，采样+加密+口令+阈值配置 | `vision-enrollment/index.vue` |
| **本地加密 profile** | ✅ PBKDF2 + AES-GCM 加密，支持记住口令自动解锁 | `use-encrypted-face-profile.ts` |
| **Subject-position response** | ✅ 左/右/上/下/居中方向反馈，7秒 dwell 检测 | `use-vision-interaction.ts` |
| **Contextual Feedback Engine** | ✅ 15种事件类型+6种转场，intensity/locale/variant 三级控制 | `use-vision-pet-feedback.ts` + `vision-feedback-messages.ts` |
| **Localized bubble** | ✅ 中英文模板，支持 namedText，气泡+toast+motion 三通道 | `vision-feedback-messages.ts` |
| **Face Motion Signal** | ✅ 微笑/稳定/偏离/不清晰 四种信号，blendshape+position 双源 | `vision-expression-signals.ts` |
| **Gesture Controls** | ✅ 张开手掌→静音，胜利→庆祝，竖拇指→确认，含几何验证+投票机 | `use-vision-interaction.ts` |
| **OpenCV Face Quality** | ✅ 亮度/清晰度/对比度/人脸尺寸评估，Canvas fallback | `use-opencv-face-quality.ts` |
| **Recovery Panel** | ✅ 摄像头/运行时/门控三类问题自动检测+恢复建议+操作按钮 | `vision-island/index.vue:512-592` |

**默认状态**:
- 摄像头默认**关闭**
- Face Gate 默认**关闭**（需手动开启+录入）
- Gesture Controls 默认**关闭**
- Expression Signals 默认**关闭**
- UI Mode 默认 **novice**（隐藏 Advanced Diagnostics）

**实验/诊断性质**:
- Advanced Diagnostics 面板（运行时状态、启动耗时、模型信息）
- Gesture Diagnostics（候选手势、置信度、投票、几何验证）
- Expression Signal Diagnostics（信号源、置信度、稳定帧）
- Contextual Feedback Diagnostics（事件类型、模板ID、通道、冷却）

### 3. 桌面交互当前已实现

| 能力 | 状态 | 代码位置 |
|---|---|---|
| **Controls Island 布局** | 右下角固定，iOS 风格抽屉面板，3列按钮网格 | `controls-island/index.vue` |
| **展开/收起** | ✅ Transition 动画，收起时仅保留锚点按钮 | `controls-island/index.vue:251-258` |
| **Move Mode** | ✅ 全屏拖拽热区，macOS 用 `startDraggingWindow`，Linux 用 CSS drag-region | `stage-move-overlay.vue` |
| **透明拖拽热区** | ✅ Fade on Hover 功能，鼠标在模型透明区域时窗口可穿透 | `index.vue` + `controls-island-fade-on-hover.vue` |
| **Emergency Anchor** | ✅ 锚点按钮始终可见，可展开面板 | `controls-island/index.vue:790-810` |
| **Zoom In / Zoom Out / Reset Size** | ✅ 按钮+快捷键（Cmd/Ctrl +/-/0），1.1x 缩放因子 | `window-size.ts` |
| **ResizeHandler** | ✅ Windows 平台8方向 resize handles，Stage 布局时加大热区 | `ResizeHandler.vue` |
| **UI Mode** | ✅ Novice/Expert 切换，影响按钮标签和 Vision 面板深度 | `controls-island-store.ts` |
| **Shortcuts Card** | ✅ 可折叠快捷键提示卡 | `controls-island/index.vue:551-586` |
| **Tooltip** | ✅ 所有控制按钮都有 hover tooltip | `control-button-tooltip.vue` |
| **Always on Top** | ✅ 置顶切换 | `controls-island/index.vue:396-413` |
| **Hearing Config** | ✅ 麦克风配置抽屉 | `controls-island-hearing-config.vue` |
| **Profile Picker** | ✅ 角色选择器 | `controls-island-profile-picker.vue` |

---

## 三、HCI 五原则问题分析

### 1. Recognition rather than recall（识别而非回忆）

**学习模块**:
- ✅ 按钮文案清晰："开始专注"、"开始休息"、"暂停"、"继续"、"重置"
- ✅ 状态标签使用用户语言："专注中"、"休息中"、"已暂停"、"空闲"
- ⚠️ "演示模式：开/关"按钮对新用户含义不明确
- ⚠️ 静音按钮只有图标，缺少文字提示
- ❌ 无空状态引导，用户不知道可以添加任务

**视觉模块**:
- ✅ Recovery Panel 使用自然语言描述问题和恢复建议
- ✅ 状态标签已本地化（"已检测到"、"未检测到主体"、"已锁定"）
- ⚠️ Advanced Diagnostics 大量英文状态值（`idle`、`warming`、`ready`）
- ⚠️ Face Gate 状态变化缺乏视觉提示，用户需主动查看
- ❌ "为什么 Rin 没响应？"无解释卡片

### 2. Flexibility and efficiency of use（灵活性与效率）

**学习模块**:
- ✅ 一键开始专注，一键暂停/继续
- ✅ 演示模式缩短计时，适合答辩
- ❌ 无"开始下一轮"一键入口（需先重置再开始）
- ❌ 无"继续上次任务"功能
- ❌ 无快捷键
- ❌ 专注结束后无选择卡片（休息/继续/完成任务）

**视觉模块**:
- ✅ 摄像头一键开关
- ✅ 门控一键开关
- ✅ 录入页独立路由
- ❌ 无"视觉能力自检"一键入口
- ❌ 无演示模式（不依赖真实人脸）
- ❌ 反馈强度需手动选择，无默认推荐

### 3. Aesthetic and minimalist design（审美与极简）

**学习模块**:
- ✅ 面板简洁，信息层次清晰
- ✅ 统计信息折叠在底部
- ⚠️ "演示模式"按钮不应默认显示在主面板
- ⚠️ 静音按钮位置偏僻，不易发现

**视觉模块**:
- ❌ **默认面板信息过载**：运行状态、主体位置反馈、面部动作信号、本地人脸门控 四个区块同时显示
- ❌ Novice 模式仍显示大量调试字段（faceCenter、subjectPosition、stableSubjectPosition、subjectResponseState、petSubjectResponseState）
- ❌ 面部动作信号区块在默认关闭状态下仍占据空间
- ❌ 本地人脸门控区块显示过多技术细节（距离、匹配细分）
- ⚠️ Recovery Panel 和主体位置反馈区块重复显示门控状态

### 4. Help users recognize, diagnose, recover from errors（错误识别与恢复）

**学习模块**:
- ✅ 任务过多时提示"任务较多，建议先选 1 项开始"
- ✅ 空状态显示"暂无学习记录"
- ⚠️ 计时中断后无恢复建议
- ⚠️ 导出失败无错误处理

**视觉模块**:
- ✅ Recovery Panel 检测摄像头/运行时/门控三类问题
- ✅ 每个问题都有操作按钮（重试摄像头、打开设置、打开录入页）
- ✅ 中英文错误提示
- ⚠️ `no_face` / `multiple_faces` 状态只有标签，无自然语言恢复建议
- ⚠️ Runtime `warming` / `failed` 状态仍使用英文

### 5. Help and documentation（帮助与文档）

**学习模块**:
- ❌ 无内置帮助入口
- ❌ 无任务式说明（如何开始专注、如何添加任务、如何查看统计）
- ⚠️ 设置页有 Callout 说明，但主面板无

**视觉模块**:
- ❌ 无内置帮助入口
- ❌ 无"视觉能力自检"按钮
- ⚠️ 录入页有隐私说明，但 Vision Island 无
- ⚠️ 底部隐私声明"不会上传任何摄像头数据"位置不显眼

---

## 四、学习模块迭代表

| 方向 | 用户痛点 | 具体改动 | 代码落点 | 工作量 | 风险 | 演示价值 | 优先级 |
|---|---|---|---|---|---|---|---|
| 专注结束选择卡片 | 专注完成后无明确下一步 | 专注结束时显示"休息5分钟/开始下一轮/完成当前任务"三选一 | `study-island/index.vue` | 2h | 低 | 高 | **P1** |
| 一键开始下一轮 | 需先重置再开始，步骤多 | 专注完成后直接显示"开始下一轮"按钮 | `study-island/index.vue` | 1h | 低 | 高 | **P0** |
| 空状态引导 | 任务列表为空时无提示 | 显示"还没有今日任务，点击添加一个"引导文案 | `TaskList.vue` | 30min | 低 | 中 | **P1** |
| 任务完成正反馈 | 完成任务只有文案变化 | 添加完成动画（checkmark + 文案弹出） | `TaskList.vue` + `study-companion-bubble-copy-resolver.ts` | 1.5h | 低 | 中 | **P1** |
| 演示模式按钮隐藏 | 默认面板不应显示调试按钮 | 将演示模式移到设置页或长按触发 | `study-island/index.vue` | 30min | 低 | 低 | **P2** |
| 帮助入口 | 新用户不知如何使用 | 添加"?"按钮，显示3步快速指南 | `study-island/index.vue` | 1h | 低 | 中 | **P1** |
| 快捷键支持 | 熟练用户需快速操作 | 添加 Cmd+Enter 开始专注、Space 暂停/继续 | `study-island/index.vue` | 1h | 低 | 中 | **P2** |
| 统计卡片可解释性 | 统计数据缺乏上下文 | 添加"今日专注分钟/完成任务数/连续轮次"更直观的标签 | `settings/study/index.vue` | 30min | 低 | 低 | **P2** |
| 演示模式预置数据 | 演示时无数据展示 | 演示模式自动填充预置任务和统计 | `study-companion.ts` | 1.5h | 中 | 高 | **P1** |

---

## 五、视觉模块迭代表

| 方向 | 用户痛点 | 具体改动 | 代码落点 | 工作量 | 风险 | 演示价值 | 优先级 |
|---|---|---|---|---|---|---|---|
| 默认面板简化 | Novice 模式仍信息过载 | 只显示摄像头开关、主体状态、Face Gate、最近反馈、恢复建议 | `vision-island/index.vue` | 3h | 中 | 高 | **P0** |
| 诊断字段折叠 | 调试字段干扰正常用户 | 将 faceCenter、subjectPosition、stableSubjectPosition、subjectResponseState 等移到 Advanced | `vision-island/index.vue` | 1.5h | 低 | 中 | **P1** |
| no_face/locked 恢复建议 | 状态标签不说明原因 | 添加自然语言恢复建议（"请保持单人入镜"/"请先完成人脸录入"） | `vision-island/index.vue` | 1h | 低 | 中 | **P1** |
| Runtime 状态中文化 | warming/failed 等英文状态 | 将 runtimeStatusText、modelWarmupStatusText 等改为中文 | `vision-island/index.vue` | 30min | 低 | 低 | **P2** |
| 视觉能力自检 | 无一键诊断入口 | 添加"自检"按钮，检查摄像头权限+模型就绪+Face Gate+光照 | `vision-island/index.vue` | 2h | 中 | 高 | **P1** |
| 视觉演示模式 | 答辩时无摄像头可用 | 添加模拟状态模式，不依赖真实人脸 | `vision-island/index.vue` + 新 composable | 3h | 高 | 高 | **P1** |
| 减少 bubble/toast/motion 冲突 | 多反馈同时出现 | 添加反馈优先级队列，避免同时触发 | `use-vision-pet-feedback.ts` | 2h | 中 | 中 | **P2** |
| "为什么 Rin 没响应？"解释 | 用户不理解门控机制 | 添加解释卡片，说明门控状态和解决方法 | `vision-island/index.vue` | 1h | 低 | 中 | **P1** |
| Face Enrollment 流程优化 | 录入页信息过多 | 简化为步骤向导（1.开启摄像头→2.输入信息→3.开始录入→4.完成） | `vision-enrollment/index.vue` | 3h | 中 | 中 | **P2** |
| 面部动作信号默认折叠 | 默认显示但默认关闭 | 收起时只显示一行"面部动作信号：关闭" | `vision-island/index.vue` | 30min | 低 | 低 | **P2** |

---

## 六、桌面交互迭代表

| 方向 | 用户痛点 | 具体改动 | 代码落点 | 工作量 | 风险 | 演示价值 | 优先级 |
|---|---|---|---|---|---|---|---|
| Controls Island 布局优化 | 按钮网格可能不齐 | 检查并修复 3 列网格在不同尺寸下的对齐 | `controls-island/index.vue` + CSS | 1h | 低 | 中 | **P1** |
| Move Mode 提示优化 | 用户不知如何退出 Move Mode | 在 Move Mode 状态栏添加"点击任意位置退出"或 ESC 提示 | `stage-move-overlay.vue` | 30min | 低 | 低 | **P2** |
| Resize handles 视觉提示 | 用户不知窗口可缩放 | 在窗口边缘显示半透明 resize 指示器 | `ResizeHandler.vue` | 1h | 低 | 低 | **P2** |
| 面板遮挡问题 | 展开面板可能遮挡 Rin | 确保面板在 Rin 右侧，不遮挡主体 | `controls-island/index.vue` | 30min | 低 | 低 | **P2** |
| Tooltip 完善 | 部分按钮缺少中文 tooltip | 检查所有按钮的 aria-label 和 title | `controls-island/*.vue` | 30min | 低 | 低 | **P2** |

---

## 七、最推荐马上做的 5 个任务

### 1. Vision Island 默认面板简化（P0）

**目标**: Novice 模式下只显示用户关心的信息，隐藏调试字段

**为什么现在做**: 当前面板信息过载严重影响演示效果，答辩时评委看到大量调试字段会降低产品感

**涉及文件**:
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`

**预期改动规模**: ~100 行修改

**风险**: 低（只是条件渲染调整）

**推荐 commit message**: `refactor(vision): simplify novice panel to show only user-facing status`

### 2. 学习模块"开始下一轮"一键入口（P0）

**目标**: 专注完成后直接显示"开始下一轮"按钮，无需先重置再开始

**为什么现在做**: 当前流程需要"重置→开始专注"两步，演示时显得笨拙

**涉及文件**:
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/index.vue`

**预期改动规模**: ~30 行新增

**风险**: 低

**推荐 commit message**: `feat(study): add one-click start next focus round`

### 3. 学习模块空状态引导（P1）

**目标**: 任务列表为空时显示引导文案和添加入口

**为什么现在做**: 新用户打开学习面板看到空列表不知如何开始

**涉及文件**:
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/study-island/TaskList.vue`

**预期改动规模**: ~20 行修改

**风险**: 低

**推荐 commit message**: `feat(study): add empty state guidance for task list`

### 4. 视觉模块 no_face/locked 恢复建议（P1）

**目标**: 当 Face Gate 拦截反馈时，显示自然语言恢复建议

**为什么现在做**: 当前只显示"已锁定"/"未检测到人脸"等状态标签，用户不知如何解决

**涉及文件**:
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`

**预期改动规模**: ~40 行新增

**风险**: 低

**推荐 commit message**: `feat(vision): add recovery hints for face gate blocked states`

### 5. 诊断字段折叠到 Advanced（P1）

**目标**: Novice 模式下隐藏所有调试字段，Expert 模式才显示

**为什么现在做**: 当前 Novice 模式仍显示 faceCenter、subjectPosition、stableSubjectPosition 等技术字段

**涉及文件**:
- `apps/stage-tamagotchi/src/renderer/components/stage-islands/vision-island/index.vue`

**预期改动规模**: ~50 行条件渲染修改

**风险**: 低

**推荐 commit message**: `refactor(vision): move diagnostic fields behind expert mode toggle`

---

## 八、不建议继续做的方向

| 方向 | 原因 |
|---|---|
| **更复杂的手势识别** | 当前 Open_Palm/Victory/Thumb_Up 已足够演示，更多手势增加误触风险且对答辩无帮助 |
| **更强的人脸身份认证** | 当前门控已满足隐私保护需求，更强认证超出 HCI 课程范围 |
| **真正情绪识别** | 当前"面部动作信号"已明确声明不是情绪识别，继续做会引入伦理风险 |
| **云同步** | 本地加密档案已满足隐私需求，云同步增加复杂度和安全风险 |
| **日历/课程表大系统** | 超出桌宠产品定位，增加维护负担 |
| **新 Live2D 美术资源** | 当前模型已足够，新美术资源需额外设计工作 |
| **大规模重写 UI 框架** | 当前 UnoCSS + Vue 组件体系已成熟，重写引入回归风险 |
| **主进程窗口系统大改** | 当前窗口管理已稳定，大改可能破坏跨平台兼容性 |

---

## 九、建议：继续开发 vs 冻结演示

**建议：执行 5 个 P0/P1 任务后进入冻结和演示材料阶段**

理由：
1. 当前功能完成度已经很高，学习模块和视觉模块都有完整闭环
2. 剩余的 P0/P1 任务都是 UI 层面的优化，不涉及架构改动
3. HCI 课程答辩重点是"设计思维+可用性+演示效果"，不是功能数量
4. 继续堆功能会增加回归风险，影响演示稳定性

**推荐时间线**:
- Day 1: 完成任务 1（Vision 面板简化）+ 任务 2（开始下一轮）
- Day 2: 完成任务 3（空状态引导）+ 任务 4（恢复建议）+ 任务 5（诊断折叠）
- Day 3: 冻结代码，准备演示材料（截图、录屏、答辩 PPT）

---

## 十、下一步 Codex 实施 prompt 方向

如果继续开发，建议按以下顺序编写 prompt：

1. **Vision Island Novice 面板简化**: 指导 Codex 将诊断字段用 `v-if="isExpertMode"` 包裹，只保留摄像头开关、主体状态、Face Gate、最近反馈、恢复建议

2. **Study Island 一键开始下一轮**: 指导 Codex 在 `isIdle` 状态下如果刚完成一轮，显示"开始下一轮"按钮

3. **TaskList 空状态引导**: 指导 Codex 在 `tasks.length === 0` 时显示引导卡片

4. **Vision Recovery Panel 增强**: 指导 Codex 为 `no_face`/`locked`/`multiple_faces` 添加具体恢复建议文案

5. **Advanced Diagnostics 条件渲染**: 指导 Codex 将 `vision-island/index.vue` 中的诊断区块用 `isExpertMode` 控制

每个 prompt 应包含：
- 具体的文件路径和行号
- 期望的 UI 行为描述
- 不要修改其他模块的约束
- 完成后运行 `pnpm typecheck` 和 `pnpm lint:fix` 的要求

---

## User

单纯从补充完善学习模块和视觉模块的功能来看，应该补充哪些？

---

## Assistant (Build · MiMo-V2.5-Pro · 133.8s)

_Thinking:_

用户要求我从"补充完善学习模块和视觉模块的功能"角度来分析，而不是从UI/UX优化角度。让我重新审视代码，找出功能层面的缺失。

我需要区分：
- UI/UX 优化（之前分析的重点）
- 功能层面的缺失（用户现在问的重点）

让我重新从功能完整性角度分析。

从功能完整性角度，学习模块和视觉模块分别有以下缺失：

---

## 学习模块功能缺失

### 核心功能缺口

| 缺失功能 | 用户价值 | 当前状态 | 建议落点 |
|---|---|---|---|
| **多日历史统计** | 查看过去几天/几周的学习趋势 | 只有今日统计，跨日清空 | `study-companion.ts` 新增 `historyEntries[]`，设置页新增历史图表 |
| **自定义专注/休息时长** | 不同场景需要不同节奏（30分钟深度/15分钟冲刺） | 硬编码 25+5，只有演示模式可改 | `study-companion.ts` 新增 `customFocusMinutes`/`customBreakMinutes`，设置页暴露输入框 |
| **任务排序/优先级** | 多任务时先做最重要的 | 只有添加顺序，无优先级 | `StudyTask` 新增 `priority: 'high' | 'medium' | 'low'`，TaskList 按优先级分组 |
| **任务截止时间** | 区分紧急/不紧急任务 | 无时间维度 | `StudyTask` 新增 `dueDate?: string`，过期标红 |
| **专注历史曲线** | 可视化学习节奏 | 只有数字统计 | 设置页新增简单柱状图（按日/周） |
| **导出格式增强** | 课程评估需要结构化报告 | 只有 JSON 快照 | 新增 CSV/Markdown 导出，含摘要表格 |
| **跨设备/跨会话恢复** | 关闭重开后继续上次状态 | localStorage 自动恢复，但无显式"继续"入口 | 新增"继续上次专注"按钮，读取 `segmentEndsAt` |
| **任务与专注关联** | 知道这轮专注在做什么任务 | 任务和计时完全独立 | 新增"为当前专注选择任务"功能，完成后自动标记 |
| **休息建议** | 休息时不知道做什么 | 只有计时 | 休息开始时显示随机休息建议（喝水/伸展/闭眼） |
| **专注中途放弃统计** | 知道自己有多少次中断重置 | `focus_reset` 事件已记录，但未展示 | 统计卡片新增"今日中断次数" |

### 非核心但加分

| 功能 | 价值 | 工作量 |
|---|---|---|
| **白噪音/环境音** | 专注时播放雨声/咖啡厅背景音 | 中（需音频资源） |
| **专注目标设定** | "今天计划完成3轮"，完成后庆祝 | 小 |
| **周报/日报** | 生成可分享的学习报告 | 中 |

---

## 视觉模块功能缺失

### 核心功能缺口

| 缺失功能 | 用户价值 | 当前状态 | 建议落点 |
|---|---|---|---|
| **摄像头预览画面** | 用户看不到自己在摄像头里的样子 | `<video>` 元素隐藏（`h-0 w-0 op-0`） | `vision-island/index.vue` 新增可选预览窗口 |
| **人脸检测可视化** | 看到检测框和关键点 | 无绘制层 | 新增 Canvas overlay 绘制 landmarks/bounding box |
| **自检/诊断按钮** | 一键检查摄像头+模型+门控状态 | 只有被动 Recovery Panel | `vision-island/index.vue` 新增"自检"按钮，主动检测并报告 |
| **门控状态持久化** | 重启后保留门控开关和匹配状态 | `gateEnabled` 已持久化，但匹配状态丢失 | `use-local-face-gate.ts` 新增恢复逻辑 |
| **反馈历史记录** | 查看最近触发了哪些反馈 | 只显示最后一条 | 新增 `feedbackHistory[]`，最多保留20条 |
| **光照/质量实时指示** | 告诉用户当前环境是否适合识别 | 只在录入页显示 | Vision Island 运行状态区新增质量指示器 |
| **门控旁路模式** | 调试时不想每次都要匹配 | 只有开/关两态 | 新增"临时旁路5分钟"功能 |
| **手势触发反馈** | 手势识别结果驱动 Live2D 动作 | 只有 open_palm→静音、victory→庆祝、thumbs_up→确认 | 扩展手势映射（如 wave→打招呼） |
| **多人场景处理** | 多人入镜时的降级策略 | 直接锁定门控 | 新增"忽略门控，响应任意主体"选项 |
| **识别性能指标** | 知道推理延迟和帧率 | 只有 `lastInferenceAt` | 新增 FPS/延迟统计卡片 |

### 非核心但加分

| 功能 | 价值 | 工作量 |
|---|---|---|
| **AR 叠加层** | 在摄像头画面上叠加 Rin 表情/气泡 | 高（需 Canvas/WebGL overlay） |
| **手势自定义** | 用户配置哪个手势触发什么动作 | 中 |
| **识别结果截图** | 保存当前检测结果用于调试 | 小 |
| **摄像头切换** | 多摄像头时选择使用哪个 | 中（`enumerateDevices`） |

---

## 两个模块共同缺失

| 缺失功能 | 学习模块 | 视觉模块 |
|---|---|---|
| **通知系统** | 专注结束时系统通知 | 门控状态变化时通知 |
| **快捷键全局注册** | Cmd+S 开始专注 | Cmd+V 开启摄像头 |
| **国际化完善** | 部分硬编码中文 | 部分硬编码英文 |
| **错误边界** | 计时异常无恢复 | 推理异常有恢复但无用户提示 |
| **单元测试覆盖** | store 有测试，UI 无测试 | composable 有测试，UI 无测试 |

---

## 建议优先补充的功能（按投入产出比排序）

**学习模块 Top 3**:
1. **自定义专注/休息时长** — 30分钟，设置页新增两个输入框即可
2. **任务与专注关联** — 2小时，新增任务选择器+完成联动
3. **导出 Markdown 报告** — 1小时，表格化摘要适合课程提交

**视觉模块 Top 3**:
1. **自检按钮** — 1小时，主动检测并报告，演示效果好
2. **摄像头预览画面** — 1.5小时，让用户看到检测效果
3. **反馈历史记录** — 1小时，展示视觉交互的活跃度

---

