import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

/** Pomodoro run mode: single source of truth for Study Island & Live2D feedback. */
export type StudyCompanionMode = 'idle' | 'focus' | 'break' | 'paused'

/**
 * Default focus segment length (25 minutes), in milliseconds.
 *
 * @default 25 * 60 * 1000
 */
export const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000

/**
 * Default short break length (5 minutes), in milliseconds.
 *
 * @default 5 * 60 * 1000
 */
export const DEFAULT_BREAK_DURATION_MS = 5 * 60 * 1000

const STORAGE_KEY = 'settings/study-companion/v1'

const MAX_EVENT_LOG = 500

/**
 * Lightweight today-task row (member 4 extends actions; shape is stable for UI).
 */
export interface StudyTask {
  id: string
  title: string
  done: boolean
  createdAt: number
}

/**
 * Append-only study analytics / export row (member 7 extends types & export UI).
 */
export interface StudyEventLogEntry {
  id: string
  at: number
  type: 'focus_started' | 'focus_completed' | 'session_paused' | 'focus_reset'
    | 'break_started' | 'break_completed' | 'day_rollover' | (string & {})
  detail?: Record<string, unknown>
}

/**
 * Persisted snapshot: timer + daily stats + collaboration fields (tasks, reminders, log).
 */
export interface StudyCompanionPersisted {
  /** Calendar day (UTC `YYYY-MM-DD`) for `today*` counters. */
  statsDate: string
  /** Completed focus sessions today (a session completes when the focus timer reaches zero). */
  todayFocusSessions: number
  /** Sum of completed focus minutes today (from configured focus duration). */
  todayFocusMinutes: number
  /** Lifetime count of completed focus sessions (not cleared on day rollover). */
  cycleCount: number
  mode: StudyCompanionMode
  /** Countdown display; while running, derived from `segmentEndsAt` on each tick. */
  remainingMs: number
  /** Wall-clock end timestamp while `focus` or `break` is actively counting; `null` when idle or paused. */
  segmentEndsAt: number | null
  /** When `mode === 'paused'`, which phase to resume. */
  pausedCarry: 'focus' | 'break' | null
  focusDurationMs: number
  breakDurationMs: number
  tasks: StudyTask[]
  /** Shown / fired reminders today (member 5). */
  todayReminderCount: number
  /** Epoch ms until reminders are suppressed; `0` means not muted (member 5). */
  mutedUntil: number
  studyEvents: StudyEventLogEntry[]
}

/**
 * Serializable snapshot payload for study statistics export.
 */
export interface StudyCompanionSnapshot {
  project: 'Rin Study Companion'
  exportedAt: string
  statsDate: string
  summary: {
    todayFocusSessions: number
    todayFocusMinutes: number
    cycleCount: number
    todayReminderCount: number
    taskTotal: number
    taskCompleted: number
    taskPending: number
    mode: StudyCompanionMode
    isRunning: boolean
    isMuted: boolean
  }
  timer: {
    remainingMs: number
    segmentEndsAt: number | null
    focusDurationMs: number
    breakDurationMs: number
  }
  tasks: StudyTask[]
  events: StudyEventLogEntry[]
}

function utcCalendarDay(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function cloneJsonRecord(record: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!record)
    return undefined

  try {
    return JSON.parse(JSON.stringify(record)) as Record<string, unknown>
  }
  catch {
    return {
      notice: 'detail_not_serializable',
    }
  }
}

function cloneStudyTasks(tasks: StudyTask[]): StudyTask[] {
  return tasks.map(task => ({
    id: `${task.id}`,
    title: `${task.title}`,
    done: Boolean(task.done),
    createdAt: Number.isFinite(task.createdAt) ? task.createdAt : 0,
  }))
}

function cloneStudyEvents(events: StudyEventLogEntry[]): StudyEventLogEntry[] {
  return events.map(event => ({
    id: `${event.id}`,
    at: Number.isFinite(event.at) ? event.at : 0,
    type: event.type,
    detail: cloneJsonRecord(event.detail),
  }))
}

/**
 * Default persisted shape for first run or partial migrations.
 */
export function createDefaultStudyCompanionPersisted(): StudyCompanionPersisted {
  return {
    statsDate: utcCalendarDay(),
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

function coercePersisted(raw: unknown): StudyCompanionPersisted {
  const base = createDefaultStudyCompanionPersisted()
  if (!raw || typeof raw !== 'object')
    return base

  const o = raw as Record<string, unknown>
  return {
    ...base,
    statsDate: typeof o.statsDate === 'string' ? o.statsDate : base.statsDate,
    todayFocusSessions: typeof o.todayFocusSessions === 'number' ? o.todayFocusSessions : base.todayFocusSessions,
    todayFocusMinutes: typeof o.todayFocusMinutes === 'number' ? o.todayFocusMinutes : base.todayFocusMinutes,
    cycleCount: typeof o.cycleCount === 'number' ? o.cycleCount : base.cycleCount,
    mode: o.mode === 'idle' || o.mode === 'focus' || o.mode === 'break' || o.mode === 'paused'
      ? o.mode
      : base.mode,
    remainingMs: typeof o.remainingMs === 'number' && o.remainingMs >= 0 ? o.remainingMs : base.remainingMs,
    segmentEndsAt: typeof o.segmentEndsAt === 'number' || o.segmentEndsAt === null
      ? o.segmentEndsAt as number | null
      : base.segmentEndsAt,
    pausedCarry: o.pausedCarry === 'focus' || o.pausedCarry === 'break' || o.pausedCarry === null
      ? o.pausedCarry
      : base.pausedCarry,
    focusDurationMs: typeof o.focusDurationMs === 'number' && o.focusDurationMs > 0 ? o.focusDurationMs : base.focusDurationMs,
    breakDurationMs: typeof o.breakDurationMs === 'number' && o.breakDurationMs > 0 ? o.breakDurationMs : base.breakDurationMs,
    tasks: Array.isArray(o.tasks) ? o.tasks as StudyTask[] : base.tasks,
    todayReminderCount: typeof o.todayReminderCount === 'number' ? o.todayReminderCount : base.todayReminderCount,
    mutedUntil: typeof o.mutedUntil === 'number' ? o.mutedUntil : base.mutedUntil,
    studyEvents: Array.isArray(o.studyEvents) ? o.studyEvents as StudyEventLogEntry[] : base.studyEvents,
  }
}

/**
 * Pinia store: Pomodoro state machine + persisted daily stats.
 *
 * Use when:
 * - Building Study Island controls (start / pause / resume / reset / break).
 * - Driving reminders, Live2D, or exports — read from this store only.
 *
 * Expects:
 * - A browser `localStorage` (Electron renderer satisfies this).
 *
 * Returns:
 * - Reactive persisted snapshot, actions, and a wall-clock aligned ticker.
 */
export const useStudyCompanionStore = defineStore('study-companion', () => {
  const persisted = useLocalStorageManualReset<StudyCompanionPersisted>(
    STORAGE_KEY,
    createDefaultStudyCompanionPersisted(),
    { deep: true },
  )

  persisted.value = coercePersisted(persisted.value)

  function appendEvent(type: StudyEventLogEntry['type'], detail?: Record<string, unknown>) {
    const entry: StudyEventLogEntry = {
      id: randomId(),
      at: Date.now(),
      type,
      detail,
    }
    const next = [...persisted.value.studyEvents, entry]
    if (next.length > MAX_EVENT_LOG)
      next.splice(0, next.length - MAX_EVENT_LOG)
    persisted.value.studyEvents = next
  }

  /**
   * Rolls daily counters when `statsDate` is not today (UTC). Idempotent.
   */
  function rolloverIfNeeded() {
    const today = utcCalendarDay()
    const p = persisted.value
    if (p.statsDate === today)
      return

    const previousStatsDate = p.statsDate
    p.statsDate = today
    p.todayFocusSessions = 0
    p.todayFocusMinutes = 0
    p.todayReminderCount = 0
    p.mutedUntil = 0
    p.tasks = []
    p.mode = 'idle'
    p.segmentEndsAt = null
    p.pausedCarry = null
    p.remainingMs = p.focusDurationMs
    appendEvent('day_rollover', { previousStatsDate })
  }

  function reconcileRunningTimerFromWallClock() {
    const p = persisted.value
    if ((p.mode !== 'focus' && p.mode !== 'break') || p.segmentEndsAt == null)
      return

    const nextRemaining = Math.max(0, p.segmentEndsAt - Date.now())
    p.remainingMs = nextRemaining
    if (nextRemaining <= 0)
      completeCurrentPhase()
  }

  function completeCurrentPhase() {
    const p = persisted.value
    if (p.mode === 'focus') {
      p.todayFocusSessions += 1
      p.todayFocusMinutes += Math.round(p.focusDurationMs / 60_000)
      p.cycleCount += 1
      p.mode = 'break'
      p.remainingMs = p.breakDurationMs
      p.segmentEndsAt = Date.now() + p.breakDurationMs
      p.pausedCarry = 'break'
      appendEvent('focus_completed', {})
      return
    }

    if (p.mode === 'break') {
      p.mode = 'idle'
      p.remainingMs = p.focusDurationMs
      p.segmentEndsAt = null
      p.pausedCarry = null
      appendEvent('break_completed', {})
    }
  }

  function tick() {
    rolloverIfNeeded()
    reconcileRunningTimerFromWallClock()
  }

  useIntervalFn(tick, 250, { immediate: false }).resume()

  watch(
    () => persisted.value.mode,
    (mode: StudyCompanionMode) => {
      if (mode === 'idle' || mode === 'paused')
        reconcileRunningTimerFromWallClock()
    },
  )

  const isRunning = computed(() => {
    const p = persisted.value
    return (p.mode === 'focus' || p.mode === 'break') && p.segmentEndsAt != null
  })

  const isMuted = computed(() => persisted.value.mutedUntil > Date.now())

  /**
   * Starts a focus segment from `idle`, or resumes when already paused in focus.
   */
  function startFocus() {
    rolloverIfNeeded()
    const p = persisted.value
    if (p.mode === 'paused' && p.pausedCarry === 'focus') {
      resume()
      return
    }
    if (p.mode === 'focus' && p.segmentEndsAt != null)
      return

    const from = p.mode
    p.mode = 'focus'
    p.remainingMs = p.focusDurationMs
    p.segmentEndsAt = Date.now() + p.focusDurationMs
    p.pausedCarry = 'focus'
    appendEvent('focus_started', { from })
  }

  /**
   * Starts a short break from `idle` (manual rest). Does not mutate completed focus stats.
   */
  function startBreak() {
    rolloverIfNeeded()
    const p = persisted.value
    if (p.mode === 'focus' && p.segmentEndsAt != null)
      return
    if (p.mode === 'paused' && p.pausedCarry === 'focus')
      return
    if (p.mode === 'paused' && p.pausedCarry === 'break') {
      resume()
      return
    }
    if (p.mode === 'break' && p.segmentEndsAt != null)
      return

    p.mode = 'break'
    p.remainingMs = p.breakDurationMs
    p.segmentEndsAt = Date.now() + p.breakDurationMs
    p.pausedCarry = 'break'
    appendEvent('break_started', { manual: true })
  }

  /**
   * Pauses an active focus or break segment.
   */
  function pause() {
    const p = persisted.value
    if (p.mode !== 'focus' && p.mode !== 'break')
      return
    if (p.segmentEndsAt == null)
      return

    p.remainingMs = Math.max(0, p.segmentEndsAt - Date.now())
    p.segmentEndsAt = null
    p.pausedCarry = p.mode === 'focus' ? 'focus' : 'break'
    p.mode = 'paused'
    appendEvent('session_paused', { carry: p.pausedCarry })
  }

  /**
   * Resumes from `paused` into the carried phase.
   */
  function resume() {
    const p = persisted.value
    if (p.mode !== 'paused' || !p.pausedCarry)
      return

    p.mode = p.pausedCarry
    p.segmentEndsAt = Date.now() + p.remainingMs
  }

  /**
   * Returns to `idle` and clears the active segment (no stats change).
   */
  function resetSession() {
    const p = persisted.value
    p.mode = 'idle'
    p.segmentEndsAt = null
    p.pausedCarry = null
    p.remainingMs = p.focusDurationMs
    appendEvent('focus_reset', {})
  }

  /**
   * Hydrates countdown after tab sleep: call when `document` becomes visible if needed.
   */
  function syncFromWallClock() {
    tick()
  }

  /**
   * Creates a JSON-ready snapshot for Study Island stats/log export.
   */
  function exportStudySnapshot(): StudyCompanionSnapshot {
    const p = persisted.value
    appendEvent('study_log_exported', { statsDate: p.statsDate })

    const taskSnapshot = cloneStudyTasks(p.tasks)
    const eventSnapshot = cloneStudyEvents(p.studyEvents)
    const taskCompleted = taskSnapshot.filter(task => task.done).length

    return {
      project: 'Rin Study Companion',
      exportedAt: new Date().toISOString(),
      statsDate: p.statsDate,
      summary: {
        todayFocusSessions: p.todayFocusSessions,
        todayFocusMinutes: p.todayFocusMinutes,
        cycleCount: p.cycleCount,
        todayReminderCount: p.todayReminderCount,
        taskTotal: taskSnapshot.length,
        taskCompleted,
        taskPending: taskSnapshot.length - taskCompleted,
        mode: p.mode,
        isRunning: isRunning.value,
        isMuted: isMuted.value,
      },
      timer: {
        remainingMs: p.remainingMs,
        segmentEndsAt: p.segmentEndsAt,
        focusDurationMs: p.focusDurationMs,
        breakDurationMs: p.breakDurationMs,
      },
      tasks: taskSnapshot,
      events: eventSnapshot,
    }
  }

  /**
   * Clears the activity log and keeps a single marker event.
   */
  function clearStudyEvents() {
    persisted.value.studyEvents = []
    appendEvent('study_events_cleared', { statsDate: persisted.value.statsDate })
  }

  /**
   * Clears today's counters and today's event log only.
   */
  function clearTodayStudyStats() {
    const p = persisted.value
    p.todayFocusSessions = 0
    p.todayFocusMinutes = 0
    p.todayReminderCount = 0
    p.studyEvents = []
    appendEvent('study_stats_cleared', { statsDate: p.statsDate })
  }

  return {
    persisted,
    isRunning,
    isMuted,
    startFocus,
    startBreak,
    pause,
    resume,
    resetSession,
    syncFromWallClock,
    rolloverIfNeeded,
    appendEvent,
    exportStudySnapshot,
    clearStudyEvents,
    clearTodayStudyStats,
  }
})
