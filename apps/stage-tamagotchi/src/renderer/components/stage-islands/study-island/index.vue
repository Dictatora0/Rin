<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import StudyHistoryChart from './StudyHistoryChart.vue'
import TaskList from './TaskList.vue'

import { createStudyBreakSuggestionPicker } from '../../../utils/study-break-suggestions'

const emit = defineEmits<{
  close: []
  interactionLockChange: [locked: boolean]
}>()
const studyStore = useStudyCompanionStore()
const { persisted, isMuted, demoModeEnabled, selectedFocusTask, todayInterruptCount, sortedPendingTasks } = storeToRefs(studyStore)
const {
  startFocus,
  startBreak,
  pause,
  resume,
  resetSession,
  appendEvent,
  toggleDemoMode,
  setSelectedFocusTaskId,
  completeSelectedFocusTask,
  getLast7DaysStats,
} = studyStore
const MUTE_DURATION_MS = 30 * 60 * 1000
const hiddenCompletionEventId = ref<string | null>(null)
const currentBreakSuggestion = ref<string | null>(null)
const completionFeedbackVisible = ref(false)
const completionFeedbackText = ref('已完成，做得不错')
let completionFeedbackTimer: ReturnType<typeof setTimeout> | null = null
const pickBreakSuggestion = createStudyBreakSuggestionPicker()

const isIdle = computed(() => persisted.value.mode === 'idle')
const isPaused = computed(() => persisted.value.mode === 'paused')
const isFocusing = computed(() => persisted.value.mode === 'focus')
const isBreaking = computed(() => persisted.value.mode === 'break')
const isRunning = computed(() => isFocusing.value || isBreaking.value)

const formattedRemaining = computed(() => {
  const totalSeconds = Math.ceil(persisted.value.remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

const modeDisplayText = computed(() => {
  if (persisted.value.mode === 'focus')
    return '专注中'
  if (persisted.value.mode === 'break')
    return '休息中'
  if (persisted.value.mode === 'paused')
    return '已暂停'
  return '空闲'
})

const todayFocusSessions = computed(() => persisted.value.todayFocusSessions)
const todayFocusMinutes = computed(() => persisted.value.todayFocusMinutes)
const todayReminderCount = computed(() => persisted.value.todayReminderCount)
const showNoStudyRecord = computed(() => persisted.value.studyEvents.length === 0)
const pendingTasks = computed(() => sortedPendingTasks.value)
const hasPendingTask = computed(() => pendingTasks.value.length > 0)
const last7DaysStats = computed(() => getLast7DaysStats())
const hasSelectedFocusTask = computed(() => selectedFocusTask.value != null)
const lastReminderFailureEvent = computed(() => {
  for (let index = persisted.value.studyEvents.length - 1; index >= 0; index -= 1) {
    const event = persisted.value.studyEvents[index]
    if (event?.type === 'reminder_delivery_failed')
      return event
  }
  return null
})
const hasHistoryStats = computed(() => {
  return last7DaysStats.value.some(entry => entry.focusMinutes > 0 || entry.focusSessions > 0 || entry.completedTasks > 0)
})
const selectedFocusTaskIdModel = computed({
  get() {
    return persisted.value.selectedFocusTaskId ?? ''
  },
  set(taskId: string) {
    setSelectedFocusTaskId(taskId || null)
  },
})

const latestFocusCompletedEvent = computed(() => {
  for (let index = persisted.value.studyEvents.length - 1; index >= 0; index -= 1) {
    const event = persisted.value.studyEvents[index]
    if (event?.type === 'focus_completed')
      return event
  }
  return null
})

const latestSessionContinuationAt = computed(() => {
  for (let index = persisted.value.studyEvents.length - 1; index >= 0; index -= 1) {
    const event = persisted.value.studyEvents[index]
    if (!event)
      continue
    if (event.type === 'focus_started' || event.type === 'focus_reset' || event.type === 'focus_completion_choice')
      return event.at
  }
  return Number.NEGATIVE_INFINITY
})

const showFocusCompletionCard = computed(() => {
  const completionEvent = latestFocusCompletedEvent.value
  if (!completionEvent)
    return false
  if (hiddenCompletionEventId.value === completionEvent.id)
    return false
  return completionEvent.at > latestSessionContinuationAt.value
})

function handleMuteToggle() {
  if (isMuted.value) {
    persisted.value.mutedUntil = 0
    appendEvent('unmuted', {})
  }
  else {
    persisted.value.mutedUntil = Date.now() + MUTE_DURATION_MS
    appendEvent('muted', { durationMinutes: 30 })
  }
}

const canStartFocus = computed(() => isIdle.value)
const canStartBreak = computed(() => isIdle.value)
const canPause = computed(() => isRunning.value)
const canResume = computed(() => isPaused.value)

const modeHintText = computed(() => {
  if (isFocusing.value)
    return '保持当前节奏，Rin 会安静陪你。'
  if (isBreaking.value)
    return '短暂休息一下，稍后再继续。'
  if (isPaused.value)
    return '已暂停，可继续或重置。'
  return '准备开始今天的专注。'
})

const demoDurationText = computed(() => {
  const focusSeconds = Math.round(persisted.value.focusDurationMs / 1000)
  const breakSeconds = Math.round(persisted.value.breakDurationMs / 1000)
  return `专注 ${focusSeconds} 秒 / 休息 ${breakSeconds} 秒`
})
const noTaskHintText = computed(() => {
  return demoModeEnabled.value
    ? '先创建一个任务，再开始专注。演示模式只会缩短计时，不会自动生成任务或历史数据。'
    : '先创建第一个任务，再开始专注。完成一轮后，统计图表和导出报告才会出现真实数据。'
})
const noHistoryHintText = computed(() => {
  return demoModeEnabled.value
    ? '还没有历史统计。演示模式只会缩短计时，请先完成至少一轮专注。'
    : '还没有历史统计。请先完成至少一轮专注，图表才会生成。'
})
const reminderFailureHintText = computed(() => {
  const taskTitle = typeof lastReminderFailureEvent.value?.detail?.taskTitle === 'string'
    ? lastReminderFailureEvent.value.detail.taskTitle
    : '当前任务'
  return `最近一次提醒未能显示：${taskTitle}。请检查 macOS 通知权限，并确保 Rin 保持运行。`
})

function handleTaskInteractionLock(locked: boolean) {
  emit('interactionLockChange', locked)
}

function clearCompletionFeedbackTimer() {
  if (!completionFeedbackTimer)
    return
  clearTimeout(completionFeedbackTimer)
  completionFeedbackTimer = null
}

function showCompletionFeedback() {
  clearCompletionFeedbackTimer()
  completionFeedbackVisible.value = true
  completionFeedbackTimer = setTimeout(() => {
    completionFeedbackVisible.value = false
    completionFeedbackTimer = null
  }, 1700)
}

function hideCompletionCard() {
  hiddenCompletionEventId.value = latestFocusCompletedEvent.value?.id ?? null
}

function handleStartNextRound() {
  startFocus()
  hideCompletionCard()
}

function handleStartBreakFromCompletion() {
  startBreak()
  appendEvent('focus_completion_choice', { action: 'break' })
  hideCompletionCard()
}

function handleCompleteCurrentTaskFromCompletion() {
  const completed = completeSelectedFocusTask()
  if (!completed)
    return
  showCompletionFeedback()
  appendEvent('focus_completion_choice', { action: 'complete_task' })
  hideCompletionCard()
}

function handleResetSession() {
  resetSession()
  hideCompletionCard()
}

watch(
  () => persisted.value.mode,
  (mode, previousMode) => {
    if (mode === 'break' && previousMode !== 'break') {
      currentBreakSuggestion.value = pickBreakSuggestion()
      return
    }

    if (mode !== 'break')
      currentBreakSuggestion.value = null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearCompletionFeedbackTimer()
})
</script>

<template>
  <div
    :class="[
      'w-full',
      'flex flex-col',
      'rounded-2xl border border-neutral-200/70 p-3',
      'bg-neutral-50 shadow-sm dark:border-neutral-700/70 dark:bg-neutral-900',
    ]"
  >
    <div
      :class="[
        'flex flex-col gap-2.5',
        'pr-1 pb-3',
      ]"
    >
      <div :class="['flex items-center justify-between gap-2']">
        <span :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-100']">学习计时</span>
        <div :class="['flex items-center gap-1.5']">
          <button
            type="button"
            :class="[
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              demoModeEnabled
                ? 'bg-orange-500 text-white hover:bg-orange-400'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
            ]"
            @click="toggleDemoMode"
          >
            {{ demoModeEnabled ? '演示模式：开' : '演示模式：关' }}
          </button>
          <button
            type="button"
            :class="[
              'rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700',
              'dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200',
            ]"
            title="关闭学习面板"
            @click="emit('close')"
          >
            <span :class="['i-solar:close-circle-outline size-4']" />
          </button>
        </div>
      </div>
      <p
        v-if="demoModeEnabled"
        :class="[
          'rounded-lg border border-orange-200/80 bg-orange-50/80 px-2.5 py-1.5 text-xs leading-5',
          'text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/40 dark:text-orange-200',
        ]"
      >
        演示模式已启用，{{ demoDurationText }}
      </p>

      <!-- Mode & Time Display -->
      <div :class="['flex items-center justify-between gap-2']">
        <div
          :class="[
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
            isIdle ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            : isFocusing ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/35 dark:text-primary-200'
              : isBreaking ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/35 dark:text-teal-200'
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
          ]"
        >
          {{ modeDisplayText }}
        </div>

        <div
          :class="[
            'font-mono text-xl font-semibold tabular-nums',
            isFocusing ? 'text-primary-600 dark:text-primary-300'
            : isBreaking ? 'text-teal-600 dark:text-teal-300'
              : 'text-neutral-800 dark:text-neutral-200',
          ]"
        >
          {{ formattedRemaining }}
        </div>
      </div>
      <p :class="['text-[12px] leading-5 text-neutral-500 dark:text-neutral-400']">
        {{ modeHintText }}
      </p>

      <section
        :class="[
          'rounded-lg border border-neutral-200/80 bg-white px-2.5 py-2',
          'dark:border-neutral-700/70 dark:bg-neutral-800/70',
        ]"
      >
        <div :class="['text-xs font-medium text-neutral-700 dark:text-neutral-200']">
          当前专注任务
        </div>
        <p
          v-if="!hasPendingTask"
          :class="['mt-1 text-xs text-neutral-500 dark:text-neutral-400']"
        >
          {{ noTaskHintText }}
        </p>
        <div
          v-else
          :class="['mt-1 flex flex-col gap-1']"
        >
          <select
            v-model="selectedFocusTaskIdModel"
            data-testid="study-selected-task-select"
            :class="[
              'rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700',
              'outline-none transition-colors focus:border-primary-500',
              'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
            <option value="">
              不指定任务
            </option>
            <option
              v-for="task in pendingTasks"
              :key="task.id"
              :value="task.id"
            >
              {{ task.title }}
            </option>
          </select>
          <p
            v-if="selectedFocusTask"
            :class="['text-[11px] text-neutral-500 dark:text-neutral-400']"
          >
            已选择：{{ selectedFocusTask.title }}
          </p>
        </div>
      </section>

      <section
        v-if="isBreaking && currentBreakSuggestion"
        data-testid="study-break-suggestion"
        :class="[
          'rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-xs text-teal-800',
          'dark:border-teal-700/60 dark:bg-teal-900/25 dark:text-teal-200',
        ]"
      >
        休息建议：{{ currentBreakSuggestion }}
      </section>

      <section
        v-if="showFocusCompletionCard"
        :class="[
          'rounded-lg border border-primary-200 bg-primary-50 p-2.5',
          'text-xs text-primary-900',
          'dark:border-primary-700/60 dark:bg-primary-900/20 dark:text-primary-100',
        ]"
      >
        <h3 :class="['text-[13px] font-semibold']">
          本轮专注已完成
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-primary-700 dark:text-primary-200']">
          可以休息一下，也可以继续下一轮
        </p>
        <div :class="['mt-2.5 grid grid-cols-1 gap-2']">
          <button
            type="button"
            :class="[
              'rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 transition-colors',
              'hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
            ]"
            @click="handleStartBreakFromCompletion"
          >
            休息 5 分钟
          </button>
          <button
            type="button"
            :class="[
              'rounded-md bg-primary-600 px-2.5 py-1.5 text-left text-xs font-medium text-white transition-colors',
              'hover:bg-primary-500',
            ]"
            @click="handleStartNextRound"
          >
            开始下一轮
          </button>
          <button
            type="button"
            :disabled="!hasSelectedFocusTask"
            :class="[
              'rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
              hasSelectedFocusTask
                ? 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700'
                : 'cursor-not-allowed bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
            ]"
            @click="handleCompleteCurrentTaskFromCompletion"
          >
            完成当前任务
          </button>
        </div>
      </section>

      <div
        v-if="completionFeedbackVisible"
        data-testid="study-completion-feedback"
        :class="[
          'rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1.5 text-xs text-primary-700',
          'dark:border-primary-700/60 dark:bg-primary-900/20 dark:text-primary-200',
        ]"
      >
        {{ completionFeedbackText }}
      </div>

      <!-- Control Buttons -->
      <div :class="['grid grid-cols-2 gap-1.5']">
        <button
          type="button"
          :disabled="!canStartFocus"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
            canStartFocus
              ? 'bg-primary-600 text-white hover:bg-primary-500'
              : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500',
          ]"
          @click="startFocus"
        >
          <div class="i-solar:play-bold size-4" />
          开始专注
        </button>

        <button
          type="button"
          :disabled="!canStartBreak"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
            canStartBreak
              ? 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700'
              : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500',
          ]"
          @click="startBreak"
        >
          <div class="i-solar:cup-bold size-4" />
          开始休息
        </button>

        <button
          v-if="canPause"
          type="button"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
            'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
          ]"
          @click="pause"
        >
          <div class="i-solar:pause-bold size-4" />
          暂停
        </button>

        <button
          v-if="canResume"
          type="button"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
            'bg-primary-500 text-white hover:bg-primary-400',
          ]"
          @click="resume"
        >
          <div class="i-solar:play-bold size-4" />
          继续
        </button>

        <button
          v-if="!isIdle"
          type="button"
          :class="[
            'col-span-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all',
            'bg-neutral-200 text-neutral-700 hover:bg-neutral-300',
            'dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
          ]"
          @click="handleResetSession"
        >
          <div class="i-solar:restart-bold size-4" />
          重置
        </button>
      </div>

      <div :class="['flex items-center justify-end']">
        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
            isMuted
              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
          ]"
          :title="isMuted ? '取消静音提醒' : '静音提醒 30 分钟'"
          @click="handleMuteToggle"
        >
          <div
            :class="[
              'size-4',
              isMuted ? 'i-solar:bell-off-bold' : 'i-solar:bell-bold',
            ]"
          />
        </button>
      </div>

      <!-- Stats Panel -->
      <div :class="['rounded-lg bg-neutral-100 px-2.5 py-2 text-xs text-neutral-500 dark:bg-neutral-800/70 dark:text-neutral-400']">
        <div :class="['flex flex-wrap items-center gap-1']">
          <div class="i-solar:list-check-bold size-3.5" />
          <span>今日：{{ todayFocusSessions }} 轮 · {{ todayFocusMinutes }} 分钟</span>
        </div>
        <div v-if="todayReminderCount > 0" :class="['mt-1 flex items-center gap-1']">
          <div class="i-solar:bell-bold size-3.5" />
          <span>{{ todayReminderCount }} 条提醒</span>
        </div>
        <div :class="['mt-1 flex items-center gap-1']">
          <div class="i-solar:danger-circle-bold size-3.5" />
          <span>今日中断：{{ todayInterruptCount }} 次</span>
        </div>
        <div v-if="isMuted" :class="['mt-1 flex items-center gap-1']">
          <div class="i-solar:bell-off-bold size-3.5" />
          <span>已静音</span>
        </div>
        <div v-if="lastReminderFailureEvent" :class="['mt-1 text-amber-600 dark:text-amber-300']">
          {{ reminderFailureHintText }}
        </div>
        <div v-if="showNoStudyRecord" :class="['mt-1 text-neutral-400 dark:text-neutral-500']">
          {{ noHistoryHintText }}
        </div>
      </div>

      <StudyHistoryChart :entries="last7DaysStats" />

      <section
        v-if="!hasHistoryStats"
        :class="[
          'rounded-lg border border-dashed border-neutral-300/70 px-3 py-2 text-xs',
          'text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400',
        ]"
      >
        {{ noHistoryHintText }}
      </section>

      <TaskList @interaction-lock-change="handleTaskInteractionLock" />
    </div>
  </div>
</template>
