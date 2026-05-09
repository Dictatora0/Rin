<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useStudyReminderPolicy } from '../../../composables/use-study-reminder-policy'

const studyStore = useStudyCompanionStore()
const { persisted, formattedRemaining, modeDisplayText, isMuted } = storeToRefs(studyStore)
const { startFocus, startBreak, pause, resume, resetSession, muteFor30Min, unmute } = studyStore

const isIdle = computed(() => persisted.value.mode === 'idle')
const isPaused = computed(() => persisted.value.mode === 'paused')
const isFocusing = computed(() => persisted.value.mode === 'focus')
const isBreaking = computed(() => persisted.value.mode === 'break')
const isRunning = computed(() => isFocusing.value || isBreaking.value)

const todayFocusSessions = computed(() => persisted.value.todayFocusSessions)
const todayFocusMinutes = computed(() => persisted.value.todayFocusMinutes)

const { currentReminder, dismissReminder, todayReminderCount } = useStudyReminderPolicy()

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

function handleMuteToggle() {
  if (isMuted.value) {
    unmute()
  }
  else {
    muteFor30Min()
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
    :class="[
      'fixed left-3 bottom-12 z-20',
      'flex flex-col items-start gap-2',
      'rounded-2xl border-2 px-4 py-3',
      'bg-white/90 dark:bg-neutral-900/90',
      'shadow-lg backdrop-blur-md',
      'dark:border-neutral-700',
    ]"
  >
    <!-- Reminder Toast -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="currentReminder"
        :class="[
          'flex items-center gap-2 w-full',
          'rounded-lg px-3 py-2 text-sm font-medium',
          currentReminder.type === 'focus_completed'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        ]"
      >
        <div
          :class="[
            'shrink-0 size-4',
            currentReminder.type === 'focus_completed'
              ? 'i-solar:check-circle-bold'
              : 'i-solar:alarm-bold',
          ]"
        />
        <span :class="['flex-1']">{{ currentReminder.message }}</span>
        <button
          type="button"
          :class="['shrink-0 size-4 i-solar:close-circle-bold', 'opacity-60 hover:opacity-100 transition-opacity']"
          @click="dismissReminder"
        />
      </div>
    </Transition>

    <!-- Mode & Time Display -->
    <div :class="['flex items-center gap-3']">
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
        :class="[
          'font-mono text-2xl font-bold tabular-nums',
          isFocusing ? 'text-rose-600 dark:text-rose-400' :
            isBreaking ? 'text-emerald-600 dark:text-emerald-400' :
              'text-neutral-800 dark:text-neutral-200',
        ]"
      >
        {{ formattedRemaining }}
      </div>
    </div>

    <!-- Control Buttons -->
    <div :class="['flex items-center gap-2']">
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
        <div :class="[mainButtonIcon, 'size-4']" />
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
        <div class="i-solar:cup-bold size-4" />
        Start Break
      </button>

      <!-- Reset Button -->
      <button
        v-if="!isIdle"
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
          'bg-neutral-200 text-neutral-600 hover:scale-105 hover:bg-neutral-300 active:scale-95',
          'dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
        ]"
        @click="resetSession"
      >
        <div class="i-solar:restart-bold size-4" />
        Reset
      </button>

      <!-- Mute Toggle Button -->
      <button
        type="button"
        :class="[
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-all',
          'hover:scale-105 active:scale-95',
          isMuted
            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
        ]"
        :title="isMuted ? 'Unmute reminders' : 'Mute reminders for 30 min'"
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
    <div :class="['flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400']">
      <div :class="['flex items-center gap-1']">
        <div class="i-solar:list-check-bold size-3.5" />
        <span>Today: {{ todayFocusSessions }} rounds</span>
      </div>
      <div :class="['flex items-center gap-1']">
        <div class="i-solar:clock-circle-bold size-3.5" />
        <span>{{ todayFocusMinutes }} mins</span>
      </div>
      <div v-if="todayReminderCount > 0" :class="['flex items-center gap-1']">
        <div class="i-solar:bell-bold size-3.5" />
        <span>{{ todayReminderCount }} reminders</span>
      </div>
    </div>
  </div>
</template>
