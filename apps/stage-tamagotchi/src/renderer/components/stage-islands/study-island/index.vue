<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import TaskList from './TaskList.vue'

const emit = defineEmits<{
  close: []
  interactionLockChange: [locked: boolean]
}>()
const studyStore = useStudyCompanionStore()
const { persisted, isMuted, demoModeEnabled } = storeToRefs(studyStore)
const { startFocus, startBreak, pause, resume, resetSession, appendEvent, toggleDemoMode } = studyStore
const MUTE_DURATION_MS = 30 * 60 * 1000

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

function handleTaskInteractionLock(locked: boolean) {
  emit('interactionLockChange', locked)
}
</script>

<template>
  <div
    :class="[
      'h-full w-full min-h-0',
      'flex flex-col overflow-hidden',
      'rounded-xl border border-neutral-200/60 px-3 py-3',
      'bg-white/90 shadow-md backdrop-blur-md dark:border-neutral-700/70 dark:bg-neutral-900/90',
    ]"
  >
    <div
      :class="[
        'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4',
        'gap-2',
        'pr-1 pb-8',
      ]"
    >
      <div :class="['flex items-center justify-between gap-2']">
        <span :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-100']">学习计时</span>
        <div :class="['flex items-center gap-1.5']">
          <button
            type="button"
            :class="[
              'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
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
              'rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700',
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
          'rounded-md border border-orange-200/80 bg-orange-50/80 px-2 py-1 text-[11px]',
          'text-orange-700 dark:border-orange-800/70 dark:bg-orange-950/40 dark:text-orange-200',
        ]"
      >
        演示模式已启用，{{ demoDurationText }}
      </p>

      <!-- Mode & Time Display -->
      <div :class="['flex items-center justify-between gap-2']">
        <div
          :class="[
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
            isIdle ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            : isFocusing ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300'
              : isBreaking ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
          ]"
        >
          {{ modeDisplayText }}
        </div>

        <div
          :class="[
            'font-mono text-lg font-semibold tabular-nums',
            isFocusing ? 'text-rose-600 dark:text-rose-400'
            : isBreaking ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-800 dark:text-neutral-200',
          ]"
        >
          {{ formattedRemaining }}
        </div>
      </div>
      <p :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        {{ modeHintText }}
      </p>

      <!-- Control Buttons -->
      <div :class="['grid grid-cols-2 gap-1.5']">
        <button
          type="button"
          :disabled="!canStartFocus"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canStartFocus
              ? 'bg-rose-500 text-white hover:bg-rose-600'
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
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canStartBreak
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
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
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            'bg-amber-500 text-white hover:bg-amber-600',
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
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            'bg-sky-500 text-white hover:bg-sky-600',
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
            'col-span-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            'bg-neutral-200 text-neutral-700 hover:bg-neutral-300',
            'dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600',
          ]"
          @click="resetSession"
        >
          <div class="i-solar:restart-bold size-4" />
          重置
        </button>
      </div>

      <div :class="['flex items-center justify-end']">
        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-all',
            'hover:scale-105 active:scale-95',
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
      <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        <div :class="['flex flex-wrap items-center gap-1']">
          <div class="i-solar:list-check-bold size-3.5" />
          <span>今日：{{ todayFocusSessions }} 轮 · {{ todayFocusMinutes }} 分钟</span>
        </div>
        <div v-if="todayReminderCount > 0" :class="['mt-1 flex items-center gap-1']">
          <div class="i-solar:bell-bold size-3.5" />
          <span>{{ todayReminderCount }} 条提醒</span>
        </div>
        <div v-if="isMuted" :class="['mt-1 flex items-center gap-1']">
          <div class="i-solar:bell-off-bold size-3.5" />
          <span>已静音</span>
        </div>
        <div v-if="showNoStudyRecord" :class="['mt-1 text-neutral-400 dark:text-neutral-500']">
          暂无学习记录。
        </div>
      </div>

      <TaskList @interaction-lock-change="handleTaskInteractionLock" />
    </div>
  </div>
</template>
