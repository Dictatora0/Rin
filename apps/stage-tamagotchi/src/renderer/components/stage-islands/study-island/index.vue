<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import TaskList from './TaskList.vue'

const studyStore = useStudyCompanionStore()
const { persisted, formattedRemaining, modeDisplayText } = storeToRefs(studyStore)
const { startFocus, startBreak, pause, resume, resetSession } = studyStore

const isIdle = computed(() => persisted.value.mode === 'idle')
const isPaused = computed(() => persisted.value.mode === 'paused')
const isFocusing = computed(() => persisted.value.mode === 'focus')
const isBreaking = computed(() => persisted.value.mode === 'break')
const isRunning = computed(() => isFocusing.value || isBreaking.value)

const todayFocusSessions = computed(() => persisted.value.todayFocusSessions)
const todayFocusMinutes = computed(() => persisted.value.todayFocusMinutes)

function handleMainAction() {
  if (isIdle.value) {
    startFocus()
  }
  else if (isPaused.value) {
    resume()
  }
  else if (isRunning.value) {
    pause()
  }
}

const mainButtonLabel = computed(() => {
  if (isIdle.value)
    return 'Start Focus'
  if (isPaused.value)
    return 'Resume'
  if (isRunning.value)
    return 'Pause'
  return ''
})

const mainButtonIcon = computed(() => {
  if (isIdle.value)
    return 'i-solar:play-bold'
  if (isPaused.value)
    return 'i-solar:play-bold'
  if (isRunning.value)
    return 'i-solar:pause-bold'
  return ''
})
</script>

<template>
  <div
    fixed
    left-3
    bottom-12
    z-20
    flex
    flex-col
    items-start
    gap-2
    rounded-2xl
    border-2
    bg-white/90
    px-4
    py-3
    shadow-lg
    backdrop-blur-md
    dark:border-neutral-700
    dark:bg-neutral-900/90
  >
    <!-- Mode & Time Display -->
    <div flex items-center gap-3>
      <div
        :class="[
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
          isIdle ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300' :
            isFocusing ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300' :
              isBreaking ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300' :
                'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
        ]"
      >
        {{ modeDisplayText }}
      </div>

      <div
        class="font-mono text-2xl font-bold tabular-nums"
        :class="[
          isFocusing ? 'text-rose-600 dark:text-rose-400' :
            isBreaking ? 'text-emerald-600 dark:text-emerald-400' :
              'text-neutral-800 dark:text-neutral-200',
        ]"
      >
        {{ formattedRemaining }}
      </div>
    </div>

    <!-- Control Buttons -->
    <div flex items-center gap-2>
      <!-- Start/Pause/Resume Button -->
      <button
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
          'hover:scale-105 active:scale-95',
          isIdle ? 'bg-rose-500 text-white hover:bg-rose-600' :
            isPaused ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
              'bg-amber-500 text-white hover:bg-amber-600',
        ]"
        @click="handleMainAction"
      >
        <div :class="mainButtonIcon" class="size-4" />
        {{ mainButtonLabel }}
      </button>

      <!-- Start Break Button -->
      <button
        v-if="isIdle || isPaused"
        type="button"
        :disabled="isFocusing"
        :class="[
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
          'hover:scale-105 active:scale-95',
          isFocusing
            ? 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500'
            : 'bg-emerald-500 text-white hover:bg-emerald-600',
        ]"
        @click="startBreak"
      >
        <div i-solar:cup-bold class="size-4" />
        Start Break
      </button>

      <!-- Reset Button -->
      <button
        v-if="!isIdle"
        type="button"
        class="flex items-center gap-1.5 rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all hover:scale-105 hover:bg-neutral-300 active:scale-95 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
        @click="resetSession"
      >
        <div i-solar:restart-bold class="size-4" />
        Reset
      </button>
    </div>

    <!-- Stats Panel -->
    <div flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400>
      <div flex items-center gap-1>
        <div i-solar:list-check-bold class="size-3.5" />
        <span>Today: {{ todayFocusSessions }} rounds</span>
      </div>
      <div flex items-center gap-1>
        <div i-solar:clock-circle-bold class="size-3.5" />
        <span>{{ todayFocusMinutes }} mins</span>
      </div>
    </div>

    <TaskList />
  </div>
</template>
