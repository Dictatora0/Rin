import { createPinia, setActivePinia, storeToRefs } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useStudyCompanionStore,
} from './study-companion'

/**
 * @example
 * ```ts
 * beforeEach(() => {
 *   installLocalStorageMock()
 *   setActivePinia(createPinia())
 * })
 * ```
 */
function installLocalStorageMock() {
  const storage = new Map<string, string>()
  const ls = {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size
    },
  }
  vi.stubGlobal('localStorage', ls)
}

describe('useStudyCompanionStore', () => {
  beforeEach(() => {
    installLocalStorageMock()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-06T12:00:00.000Z'))
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('starts focus, completes into break, then returns idle after break', () => {
    const store = useStudyCompanionStore()
    store.persisted.focusDurationMs = 2_000
    store.persisted.breakDurationMs = 1_000

    store.startFocus()
    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.segmentEndsAt).not.toBeNull()

    vi.setSystemTime(new Date('2026-05-06T12:00:03.000Z'))
    store.syncFromWallClock()

    expect(store.persisted.mode).toBe('break')
    expect(store.persisted.todayFocusSessions).toBe(1)
    expect(store.persisted.cycleCount).toBe(1)

    vi.setSystemTime(new Date('2026-05-06T12:00:05.000Z'))
    store.syncFromWallClock()

    expect(store.persisted.mode).toBe('idle')
  })

  it('pauses and resumes without losing remaining wall-clock budget', () => {
    const store = useStudyCompanionStore()
    store.persisted.focusDurationMs = 10_000

    store.startFocus()
    vi.setSystemTime(new Date('2026-05-06T12:00:04.000Z'))
    store.syncFromWallClock()
    expect(store.persisted.remainingMs).toBe(6_000)

    store.pause()
    expect(store.persisted.mode).toBe('paused')
    expect(store.persisted.segmentEndsAt).toBeNull()
    expect(store.persisted.remainingMs).toBe(6_000)

    vi.setSystemTime(new Date('2026-05-06T12:00:10.000Z'))
    store.resume()
    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.segmentEndsAt).toBe(Date.now() + 6_000)
  })

  it('rolls daily counters when statsDate is behind UTC calendar day', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-01-01'
    store.persisted.todayFocusSessions = 3
    store.persisted.todayFocusMinutes = 90
    store.persisted.todayReminderCount = 5
    store.persisted.tasks = [{ id: 't1', title: 'x', done: false, createdAt: 1 }]

    vi.setSystemTime(new Date('2026-05-07T08:00:00.000Z'))
    store.rolloverIfNeeded()

    expect(store.persisted.statsDate).toBe('2026-05-07')
    expect(store.persisted.todayFocusSessions).toBe(0)
    expect(store.persisted.todayFocusMinutes).toBe(0)
    expect(store.persisted.todayReminderCount).toBe(0)
    expect(store.persisted.tasks).toEqual([])
    expect(store.persisted.studyEvents.some(e => e.type === 'day_rollover')).toBe(true)
  })

  it('manages today tasks and writes task lifecycle events', () => {
    const store = useStudyCompanionStore()
    const { taskTotal, taskCompleted, taskPending } = storeToRefs(store)

    store.addTask('   ')
    expect(store.persisted.tasks).toHaveLength(0)
    expect(taskTotal.value).toBe(0)

    store.addTask('  复习离散数学  ')
    expect(store.persisted.tasks).toHaveLength(1)
    expect(store.persisted.tasks[0]?.title).toBe('复习离散数学')
    expect(store.persisted.tasks[0]?.done).toBe(false)
    expect(taskTotal.value).toBe(1)
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(1)
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('task_added')

    const taskId = store.persisted.tasks[0]!.id
    store.toggleTaskDone(taskId)
    expect(store.persisted.tasks[0]?.done).toBe(true)
    expect(store.persisted.tasks[0]?.completedAt).toBeTypeOf('number')
    expect(taskCompleted.value).toBe(1)
    expect(taskPending.value).toBe(0)
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('task_completed')

    store.toggleTaskDone(taskId)
    expect(store.persisted.tasks[0]?.done).toBe(false)
    expect(store.persisted.tasks[0]?.completedAt).toBeUndefined()
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(1)
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('task_reopened')

    store.deleteTask(taskId)
    expect(store.persisted.tasks).toEqual([])
    expect(taskTotal.value).toBe(0)
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(0)
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('task_deleted')
  })

  it('clears only completed tasks in the task list', () => {
    const store = useStudyCompanionStore()
    const { taskTotal, taskCompleted, taskPending } = storeToRefs(store)
    store.persisted.tasks = [
      { id: 'task-1', title: '阅读', done: true, createdAt: 1, completedAt: 2 },
      { id: 'task-2', title: '整理笔记', done: false, createdAt: 3 },
      { id: 'task-3', title: '做题', done: true, createdAt: 4, completedAt: 5 },
    ]

    store.clearCompletedTasks()

    expect(store.persisted.tasks).toEqual([
      { id: 'task-2', title: '整理笔记', done: false, createdAt: 3 },
    ])
    expect(taskTotal.value).toBe(1)
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(1)
  })

  /**
   * @example
   * ```ts
   * const snapshot = store.exportStudySnapshot()
   * expect(snapshot.summary.taskPending).toBe(1)
   * ```
   */
  it('exports a JSON-safe study snapshot and appends export event', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-05-06'
    store.persisted.todayFocusSessions = 2
    store.persisted.todayFocusMinutes = 50
    store.persisted.cycleCount = 4
    store.persisted.todayReminderCount = 3
    store.persisted.mode = 'paused'
    store.persisted.remainingMs = 12_345
    store.persisted.segmentEndsAt = null
    store.persisted.focusDurationMs = 1_500_000
    store.persisted.breakDurationMs = 300_000
    store.persisted.tasks = [
      { id: 'task-1', title: 'Read chapter', done: true, createdAt: 1 },
      { id: 'task-2', title: 'Solve problems', done: false, createdAt: 2 },
    ]
    store.persisted.mutedUntil = Date.now() + 5_000
    store.persisted.studyEvents = [
      { id: 'evt-1', at: 100, type: 'focus_started', detail: { from: 'idle' } },
    ]

    const snapshot = store.exportStudySnapshot()

    expect(snapshot.project).toBe('Rin Study Companion')
    expect(snapshot.statsDate).toBe('2026-05-06')
    expect(snapshot.summary.todayFocusSessions).toBe(2)
    expect(snapshot.summary.todayFocusMinutes).toBe(50)
    expect(snapshot.summary.cycleCount).toBe(4)
    expect(snapshot.summary.todayReminderCount).toBe(3)
    expect(snapshot.summary.taskTotal).toBe(2)
    expect(snapshot.summary.taskCompleted).toBe(1)
    expect(snapshot.summary.taskPending).toBe(1)
    expect(snapshot.summary.mode).toBe('paused')
    expect(snapshot.summary.isRunning).toBe(false)
    expect(snapshot.summary.isMuted).toBe(true)
    expect(snapshot.timer.remainingMs).toBe(12_345)
    expect(snapshot.timer.segmentEndsAt).toBeNull()
    expect(snapshot.tasks).toEqual(store.persisted.tasks)
    expect(snapshot.events.at(-1)?.type).toBe('study_log_exported')
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('study_log_exported')
    expect(() => JSON.stringify(snapshot)).not.toThrow()
  })

  /**
   * @example
   * ```ts
   * store.clearStudyEvents()
   * expect(store.persisted.studyEvents).toEqual([])
   * ```
   */
  it('clears activity events and preserves a clear marker event', () => {
    const store = useStudyCompanionStore()
    store.persisted.studyEvents = [
      { id: 'evt-1', at: 100, type: 'focus_started' },
      { id: 'evt-2', at: 200, type: 'focus_completed' },
    ]

    store.clearStudyEvents()

    expect(store.persisted.studyEvents).toHaveLength(1)
    expect(store.persisted.studyEvents[0]?.type).toBe('study_events_cleared')
  })

  /**
   * @example
   * ```ts
   * store.clearTodayStudyStats()
   * expect(store.persisted.todayFocusSessions).toBe(0)
   * ```
   */
  it('clears only today counters and today event log', () => {
    const store = useStudyCompanionStore()
    store.persisted.todayFocusSessions = 5
    store.persisted.todayFocusMinutes = 120
    store.persisted.todayReminderCount = 8
    store.persisted.studyEvents = [
      { id: 'evt-1', at: 100, type: 'focus_started' },
      { id: 'evt-2', at: 200, type: 'focus_completed' },
    ]
    store.persisted.cycleCount = 10
    store.persisted.mode = 'focus'
    store.persisted.remainingMs = 60_000
    store.persisted.segmentEndsAt = Date.now() + 60_000
    store.persisted.focusDurationMs = 1_500_000
    store.persisted.breakDurationMs = 300_000
    store.persisted.tasks = [{ id: 'task-1', title: 'Read chapter', done: false, createdAt: 1 }]

    store.clearTodayStudyStats()

    expect(store.persisted.todayFocusSessions).toBe(0)
    expect(store.persisted.todayFocusMinutes).toBe(0)
    expect(store.persisted.todayReminderCount).toBe(0)
    expect(store.persisted.studyEvents).toHaveLength(1)
    expect(store.persisted.studyEvents[0]?.type).toBe('study_stats_cleared')
    expect(store.persisted.cycleCount).toBe(10)
    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.remainingMs).toBe(60_000)
    expect(store.persisted.segmentEndsAt).toBe(Date.now() + 60_000)
    expect(store.persisted.focusDurationMs).toBe(1_500_000)
    expect(store.persisted.breakDurationMs).toBe(300_000)
    expect(store.persisted.tasks).toEqual([{ id: 'task-1', title: 'Read chapter', done: false, createdAt: 1 }])
  })
})
