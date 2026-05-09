import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'

// Constants
export const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000 // 25 minutes
export const DEFAULT_BREAK_DURATION_MS = 5 * 60 * 1000 // 5 minutes

// Types
export type StudyCompanionMode = 'idle' | 'focus' | 'break' | 'paused'

export interface StudyTask {
  id: string
  title: string
  done: boolean
  createdAt: number
}

export type StudyEventType =
  | 'focus_started'
  | 'focus_completed'
  | 'session_paused'
  | 'focus_reset'
  | 'break_started'
  | 'break_completed'
  | 'day_rollover'
  | (string & {})

export interface StudyEventLogEntry {
  id: string
  at: number
  type: StudyEventType
  detail?: string
}

export interface StudyCompanionPersisted {
  statsDate: string // YYYY-MM-DD UTC
  todayFocusSessions: number
  todayFocusMinutes: number
  cycleCount: number
  mode: StudyCompanionMode
  remainingMs: number
  segmentEndsAt: number | null
  pausedCarry: StudyCompanionMode | null
  focusDurationMs: number
  breakDurationMs: number
  tasks: StudyTask[]
  todayReminderCount: number
  mutedUntil: number
  studyEvents: StudyEventLogEntry[]
}

export function createDefaultStudyCompanionPersisted(): StudyCompanionPersisted {
  return {
    statsDate: '',
    todayFocusSessions: 0,
    todayFocusMinutes: 0,
    cycleCount: 0,
    mode: 'idle',
    remainingMs: DEFAULT_FOCUS_DURATION_MS,
    segmentEndsAt: null,
    pausedCarry: null,
    focusDurationMs: DEFAULT_FOCUS_DURATION_MS,
    breakDurationMs: DEFAULT_BREAK_DURATION_MS,
    tasks: [],
    todayReminderCount: 0,
    mutedUntil: 0,
    studyEvents: [],
  }
}

const STORAGE_KEY = 'settings/study-companion/v1'
const MAX_EVENTS = 500

function getTodayUTC(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

export const useStudyCompanionStore = defineStore('modules:study-companion', () => {
  // Persisted state (synced with localStorage)
  const persisted = useLocalStorageManualReset<StudyCompanionPersisted>(STORAGE_KEY, createDefaultStudyCompanionPersisted)

  // Internal timer reference
  let tickInterval: ReturnType<typeof setInterval> | null = null

  // Ensure statsDate is initialized
  if (!persisted.value.statsDate) {
    persisted.value.statsDate = getTodayUTC()
  }

  // Check for UTC day rollover
  function rolloverIfNeeded() {
    const today = getTodayUTC()
    if (persisted.value.statsDate !== today) {
      persisted.value.statsDate = today
      persisted.value.todayFocusSessions = 0
      persisted.value.todayFocusMinutes = 0
      persisted.value.todayReminderCount = 0
      appendEvent('day_rollover')
    }
  }

  // Sync with wall clock (e.g., on visibilitychange)
  function syncFromWallClock() {
    rolloverIfNeeded()

    if (persisted.value.mode === 'focus' || persisted.value.mode === 'break') {
      if (persisted.value.segmentEndsAt !== null) {
        const now = Date.now()
        const remaining = persisted.value.segmentEndsAt - now

        if (remaining <= 0) {
          // Timer has expired
          if (persisted.value.mode === 'focus') {
            handleFocusComplete()
          }
          else {
            handleBreakComplete()
          }
        }
        else {
          persisted.value.remainingMs = remaining
        }
      }
    }
  }

  // Start tick interval for running modes
  function startTick() {
    if (tickInterval !== null)
      return

    tickInterval = setInterval(() => {
      syncFromWallClock()
    }, 1000)
  }

  // Stop tick interval
  function stopTick() {
    if (tickInterval !== null) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }

  // Watch for mode changes to start/stop tick
  watch(
    () => persisted.value.mode,
    (mode) => {
      if (mode === 'focus' || mode === 'break') {
        startTick()
      }
      else {
        stopTick()
      }
    },
    { immediate: true },
  )

  // Handle focus session completion
  function handleFocusComplete() {
    const completedMinutes = Math.round(persisted.value.focusDurationMs / 60000)

    persisted.value.todayFocusSessions += 1
    persisted.value.todayFocusMinutes += completedMinutes
    persisted.value.cycleCount += 1
    persisted.value.mode = 'idle'
    persisted.value.segmentEndsAt = null
    persisted.value.remainingMs = persisted.value.focusDurationMs

    appendEvent('focus_completed', `Completed ${completedMinutes} min session`)
  }

  // Handle break completion
  function handleBreakComplete() {
    persisted.value.mode = 'idle'
    persisted.value.segmentEndsAt = null
    persisted.value.remainingMs = persisted.value.focusDurationMs

    appendEvent('break_completed')
  }

  // Append event to log
  function appendEvent(type: StudyEventType, detail?: string) {
    const event: StudyEventLogEntry = {
      id: nanoid(),
      at: Date.now(),
      type,
      detail,
    }

    persisted.value.studyEvents.push(event)

    // Keep only last MAX_EVENTS
    if (persisted.value.studyEvents.length > MAX_EVENTS) {
      persisted.value.studyEvents = persisted.value.studyEvents.slice(-MAX_EVENTS)
    }
  }

  // Actions
  function startFocus() {
    rolloverIfNeeded()

    if (persisted.value.mode === 'paused' && persisted.value.pausedCarry === 'focus') {
      resume()
      return
    }

    if (persisted.value.mode === 'break') {
      console.warn('[StudyCompanion] Cannot start focus while on break')
      return
    }

    const now = Date.now()
    persisted.value.mode = 'focus'
    persisted.value.segmentEndsAt = now + persisted.value.focusDurationMs
    persisted.value.remainingMs = persisted.value.focusDurationMs
    persisted.value.pausedCarry = null

    appendEvent('focus_started')
  }

  function startBreak() {
    rolloverIfNeeded()

    if (persisted.value.mode === 'focus') {
      console.warn('[StudyCompanion] Cannot start break while focusing')
      return
    }

    if (persisted.value.mode === 'paused' && persisted.value.pausedCarry === 'break') {
      resume()
      return
    }

    const now = Date.now()
    persisted.value.mode = 'break'
    persisted.value.segmentEndsAt = now + persisted.value.breakDurationMs
    persisted.value.remainingMs = persisted.value.breakDurationMs
    persisted.value.pausedCarry = null

    appendEvent('break_started')
  }

  function pause() {
    if (persisted.value.mode !== 'focus' && persisted.value.mode !== 'break') {
      return
    }

    if (persisted.value.segmentEndsAt !== null) {
      // Calculate remaining time at pause moment
      const now = Date.now()
      persisted.value.remainingMs = Math.max(0, persisted.value.segmentEndsAt - now)
    }

    persisted.value.pausedCarry = persisted.value.mode
    persisted.value.mode = 'paused'
    persisted.value.segmentEndsAt = null

    appendEvent('session_paused')
  }

  function resume() {
    if (persisted.value.mode !== 'paused' || persisted.value.pausedCarry === null) {
      return
    }

    const now = Date.now()
    const carryMode = persisted.value.pausedCarry

    persisted.value.mode = carryMode
    persisted.value.segmentEndsAt = now + persisted.value.remainingMs
    persisted.value.pausedCarry = null

    appendEvent(`${carryMode}_started`, 'Resumed from pause')
  }

  function resetSession() {
    stopTick()

    persisted.value.mode = 'idle'
    persisted.value.segmentEndsAt = null
    persisted.value.remainingMs = persisted.value.focusDurationMs
    persisted.value.pausedCarry = null

    appendEvent('focus_reset')
  }

  /** Suppress all visual reminders for 30 minutes. */
  function muteFor30Min() {
    const MUTE_DURATION_MS = 30 * 60 * 1000
    persisted.value.mutedUntil = Date.now() + MUTE_DURATION_MS
    appendEvent('muted', 'Muted for 30 minutes')
  }

  /** Cancel an active mute immediately. */
  function unmute() {
    persisted.value.mutedUntil = 0
    appendEvent('unmuted')
  }

  /** Increment today's reminder counter by one. */
  function incrementReminderCount() {
    persisted.value.todayReminderCount += 1
  }

  // Computed
  const isRunning = computed(() => {
    return (persisted.value.mode === 'focus' || persisted.value.mode === 'break') && persisted.value.segmentEndsAt !== null
  })

  const isMuted = computed(() => {
    return persisted.value.mutedUntil > Date.now()
  })

  // Format remaining time as mm:ss
  const formattedRemaining = computed(() => {
    const totalSeconds = Math.ceil(persisted.value.remainingMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  // Current mode display text
  const modeDisplayText = computed(() => {
    switch (persisted.value.mode) {
      case 'idle':
        return 'Ready'
      case 'focus':
        return 'Focusing'
      case 'break':
        return 'Break'
      case 'paused':
        return persisted.value.pausedCarry === 'focus' ? 'Paused (Focus)' : 'Paused (Break)'
      default:
        return ''
    }
  })

  return {
    // Persisted state
    persisted,

    // Computed
    isRunning,
    isMuted,
    formattedRemaining,
    modeDisplayText,

    // Actions
    startFocus,
    startBreak,
    pause,
    resume,
    resetSession,
    syncFromWallClock,
    rolloverIfNeeded,
    appendEvent,
    muteFor30Min,
    unmute,
    incrementReminderCount,
  }
})
