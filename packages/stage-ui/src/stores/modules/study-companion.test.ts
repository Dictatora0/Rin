import { createPinia, setActivePinia, storeToRefs } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_BREAK_DURATION_MS,
  DEFAULT_FOCUS_DURATION_MS,
  DEMO_BREAK_DURATION_MS,
  DEMO_FOCUS_DURATION_MS,
  getLocalDayKey,
  isStudyTaskDueToday,
  isStudyTaskOverdue,
  MAX_BREAK_MINUTES,
  MAX_FOCUS_MINUTES,
  MIN_BREAK_MINUTES,
  MIN_FOCUS_MINUTES,
  sortStudyTasks,
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

  it('formats local day key as YYYY-MM-DD', () => {
    const date = new Date(2026, 4, 6, 1, 2, 3)
    const dayKey = getLocalDayKey(date)
    expect(dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(dayKey).toBe('2026-05-06')
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
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('session_resumed')
  })

  it('rolls daily counters when statsDate is behind local calendar day', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-01-01'
    store.persisted.todayFocusSessions = 3
    store.persisted.todayFocusMinutes = 90
    store.persisted.todayReminderCount = 5
    store.persisted.tasks = [{ id: 't1', title: 'x', done: false, createdAt: '2026-05-06T11:00:00.000Z', priority: 'medium' }]

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
    expect(store.persisted.studyEvents.at(-1)).toMatchObject({
      type: 'task_added',
      detail: {
        title: '复习离散数学',
      },
    })

    const taskId = store.persisted.tasks[0]!.id
    expect(store.persisted.studyEvents.at(-1)?.detail?.id).toBe(taskId)
    store.toggleTaskDone(taskId)
    expect(store.persisted.tasks[0]?.done).toBe(true)
    expect(store.persisted.tasks[0]?.completedAt).toBeTypeOf('string')
    expect(taskCompleted.value).toBe(1)
    expect(taskPending.value).toBe(0)
    expect(store.persisted.studyEvents.at(-1)).toMatchObject({
      type: 'task_completed',
      detail: {
        id: taskId,
        title: '复习离散数学',
      },
    })

    store.toggleTaskDone(taskId)
    expect(store.persisted.tasks[0]?.done).toBe(false)
    expect(store.persisted.tasks[0]?.completedAt).toBeUndefined()
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(1)
    expect(store.persisted.studyEvents.at(-1)).toMatchObject({
      type: 'task_reopened',
      detail: {
        id: taskId,
        title: '复习离散数学',
      },
    })

    store.deleteTask(taskId)
    expect(store.persisted.tasks).toEqual([])
    expect(taskTotal.value).toBe(0)
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(0)
    expect(store.persisted.studyEvents.at(-1)).toMatchObject({
      type: 'task_deleted',
      detail: {
        id: taskId,
        title: '复习离散数学',
      },
    })
  })

  it('generates rin recommended reminders only when dueDate is newly set/changed, not bulk for old tasks', () => {
    const store = useStudyCompanionStore()
    store.persisted.tasks = [
      {
        id: 'legacy-task',
        title: '历史任务',
        done: false,
        createdAt: '2026-05-06T09:00:00.000Z',
        priority: 'medium',
        dueDate: '2026-05-10',
      } as any,
    ]

    expect(store.persisted.tasks[0]?.reminders ?? []).toEqual([])

    store.ensureTaskReminderRules('legacy-task', { forceRecommend: true })
    expect((store.persisted.tasks[0]?.reminders ?? []).length).toBeGreaterThan(0)
    expect(store.persisted.tasks[0]?.reminders?.every(rule => rule.source === 'rin-recommended')).toBe(true)
    expect(store.persisted.tasks[0]?.reminders?.every(rule => rule.label?.includes('Rin 推荐') === true)).toBe(true)

    store.persisted.tasks[0]!.reminders = [
      {
        id: 'custom-1',
        amount: 2,
        unit: 'hour',
        enabled: true,
        source: 'user-custom',
        label: '自定义：提前 2 小时',
      },
      {
        id: 'legacy-rin',
        amount: 1,
        unit: 'day',
        enabled: true,
        source: 'rin-recommended',
        label: 'Rin 推荐：提前 1 天',
      },
    ]
    store.setTaskDueDate('legacy-task', '2026-05-12')
    const reminders = store.persisted.tasks[0]?.reminders ?? []
    expect(reminders.some(rule => rule.id === 'custom-1')).toBe(true)
    expect(reminders.some(rule => rule.source === 'rin-recommended')).toBe(true)
  })

  it('supports custom reminder CRUD, max 5 rules, and recommendation-to-custom mutation on edit', () => {
    const store = useStudyCompanionStore()
    store.addTask({
      title: '准备答辩',
      priority: 'high',
      dueDate: '2026-05-10',
    })
    const taskId = store.persisted.tasks[0]!.id
    store.ensureTaskReminderRules(taskId, { forceRecommend: true })

    const firstRecommended = store.persisted.tasks[0]?.reminders?.[0]
    expect(firstRecommended?.source).toBe('rin-recommended')
    if (!firstRecommended)
      throw new Error('first recommended reminder missing')

    const editedResult = store.updateTaskReminder(taskId, firstRecommended.id, { amount: 2, unit: 'hour' })
    expect(editedResult).toEqual({ ok: true })
    const editedRule = store.persisted.tasks[0]?.reminders?.find(rule => rule.id === firstRecommended.id)
    expect(editedRule?.source).toBe('user-custom')
    expect(editedRule?.label).toContain('自定义')

    store.persisted.tasks[0]!.reminders = []
    expect(store.addTaskReminder(taskId, { amount: 1, unit: 'hour' })).toEqual({ ok: true })
    expect(store.addTaskReminder(taskId, { amount: 2, unit: 'hour' })).toEqual({ ok: true })
    expect(store.addTaskReminder(taskId, { amount: 3, unit: 'hour' })).toEqual({ ok: true })
    expect(store.addTaskReminder(taskId, { amount: 4, unit: 'hour' })).toEqual({ ok: true })
    expect(store.addTaskReminder(taskId, { amount: 5, unit: 'hour' })).toEqual({ ok: true })
    expect(store.addTaskReminder(taskId, { amount: 6, unit: 'hour' })).toEqual({ ok: false, reason: 'limit' })

    const firstRule = store.persisted.tasks[0]?.reminders?.[0]
    if (!firstRule)
      throw new Error('first rule missing')
    expect(store.removeTaskReminder(taskId, firstRule.id)).toBe(true)
    expect(store.persisted.tasks[0]?.reminders?.some(rule => rule.id === firstRule.id)).toBe(false)
  })

  it('marks delivery once and never reminds done task through due reminder matcher inputs', () => {
    const store = useStudyCompanionStore()
    store.addTask({
      title: '课程汇报',
      priority: 'medium',
      dueDate: '2026-05-08',
    })
    const taskId = store.persisted.tasks[0]!.id
    expect(store.addTaskReminder(taskId, { amount: 1, unit: 'day' })).toEqual({ ok: true })
    const reminderId = store.persisted.tasks[0]!.reminders![0]!.id

    expect(store.markTaskReminderDelivered(taskId, reminderId)).toBe(true)
    expect(store.markTaskReminderDelivered(taskId, reminderId)).toBe(false)

    store.toggleTaskDone(taskId)
    expect(store.persisted.tasks[0]?.done).toBe(true)
  })

  it('clears only completed tasks in the task list', () => {
    const store = useStudyCompanionStore()
    const { taskTotal, taskCompleted, taskPending } = storeToRefs(store)
    store.persisted.tasks = [
      { id: 'task-1', title: '阅读', done: true, createdAt: '2026-05-06T08:00:00.000Z', completedAt: '2026-05-06T08:30:00.000Z', priority: 'high' },
      { id: 'task-2', title: '整理笔记', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
      { id: 'task-3', title: '做题', done: true, createdAt: '2026-05-06T10:00:00.000Z', completedAt: '2026-05-06T10:30:00.000Z', priority: 'low' },
    ]

    store.clearCompletedTasks()

    expect(store.persisted.tasks).toEqual([
      { id: 'task-2', title: '整理笔记', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
    ])
    expect(taskTotal.value).toBe(1)
    expect(taskCompleted.value).toBe(0)
    expect(taskPending.value).toBe(1)
  })

  it('toggles demo mode durations and restores previous values', () => {
    const store = useStudyCompanionStore()
    store.persisted.focusDurationMs = 35 * 60 * 1000
    store.persisted.breakDurationMs = 7 * 60 * 1000

    store.enableDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(true)
    expect(store.persisted.focusDurationMs).toBe(DEMO_FOCUS_DURATION_MS)
    expect(store.persisted.breakDurationMs).toBe(DEMO_BREAK_DURATION_MS)
    expect(store.persisted.previousFocusDurationMs).toBe(35 * 60 * 1000)
    expect(store.persisted.previousBreakDurationMs).toBe(7 * 60 * 1000)
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('demo_mode_enabled')

    store.disableDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(false)
    expect(store.persisted.focusDurationMs).toBe(35 * 60 * 1000)
    expect(store.persisted.breakDurationMs).toBe(7 * 60 * 1000)
    expect(store.persisted.previousFocusDurationMs).toBeNull()
    expect(store.persisted.previousBreakDurationMs).toBeNull()
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('demo_mode_disabled')

    store.toggleDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(true)
    store.toggleDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(false)
  })

  it('clamps running focus remaining budget when enabling demo mode during an active segment', () => {
    const store = useStudyCompanionStore()
    store.persisted.focusDurationMs = 120_000
    store.persisted.breakDurationMs = 30_000

    store.startFocus()
    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.remainingMs).toBe(120_000)

    store.enableDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(true)
    expect(store.persisted.focusDurationMs).toBe(DEMO_FOCUS_DURATION_MS)
    expect(store.persisted.breakDurationMs).toBe(DEMO_BREAK_DURATION_MS)
    expect(store.persisted.remainingMs).toBe(DEMO_FOCUS_DURATION_MS)
    expect(store.persisted.segmentEndsAt).toBe(Date.now() + DEMO_FOCUS_DURATION_MS)

    store.disableDemoMode()
    expect(store.persisted.demoModeEnabled).toBe(false)
    expect(store.persisted.focusDurationMs).toBe(120_000)
    expect(store.persisted.breakDurationMs).toBe(30_000)
    expect(store.persisted.remainingMs).toBe(DEMO_FOCUS_DURATION_MS)
    expect(store.persisted.segmentEndsAt).toBe(Date.now() + DEMO_FOCUS_DURATION_MS)
  })

  it('uses default durations if demo mode has no previous values', () => {
    const store = useStudyCompanionStore()
    store.persisted.demoModeEnabled = true
    store.persisted.previousFocusDurationMs = null
    store.persisted.previousBreakDurationMs = null
    store.persisted.focusDurationMs = DEMO_FOCUS_DURATION_MS
    store.persisted.breakDurationMs = DEMO_BREAK_DURATION_MS

    store.disableDemoMode()

    expect(store.persisted.focusDurationMs).toBe(DEFAULT_FOCUS_DURATION_MS)
    expect(store.persisted.breakDurationMs).toBe(DEFAULT_BREAK_DURATION_MS)
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
    const circularDetail = {} as Record<string, unknown> & { self?: unknown }
    circularDetail.self = circularDetail
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
      { id: 'task-1', title: 'Read chapter', done: true, createdAt: '2026-05-06T09:00:00.000Z', priority: 'high' },
      { id: 'task-2', title: 'Solve problems', done: false, createdAt: '2026-05-06T10:00:00.000Z', priority: 'medium' },
    ]
    store.persisted.mutedUntil = Date.now() + 5_000
    store.persisted.studyEvents = [
      { id: 'evt-1', at: 100, type: 'focus_started', detail: { from: 'idle' } },
      { id: 'evt-2', at: 200, type: 'detail_invalid', detail: circularDetail },
    ]

    const snapshot = store.exportStudySnapshot()

    expect(snapshot.schemaVersion).toBe(1)
    expect(snapshot.app).toBe('Rin')
    expect(snapshot.feature).toBe('study-companion')
    expect(snapshot.project).toBe('Rin Study Companion')
    expect(snapshot.demoModeEnabled).toBe(false)
    expect(snapshot.statsDate).toBe('2026-05-06')
    expect(snapshot.summary.todayFocusSessions).toBe(2)
    expect(snapshot.summary.todayFocusMinutes).toBe(50)
    expect(snapshot.summary.cycleCount).toBe(4)
    expect(snapshot.summary.todayReminderCount).toBe(3)
    expect(snapshot.summary.taskTotal).toBe(2)
    expect(snapshot.summary.taskCompleted).toBe(1)
    expect(snapshot.summary.taskPending).toBe(1)
    expect(snapshot.summary.todayInterruptCount).toBe(0)
    expect(snapshot.summary.mode).toBe('paused')
    expect(snapshot.summary.isRunning).toBe(false)
    expect(snapshot.summary.isMuted).toBe(true)
    expect(snapshot.timer.remainingMs).toBe(12_345)
    expect(snapshot.timer.segmentEndsAt).toBeNull()
    expect(snapshot.tasks).toHaveLength(2)
    expect(snapshot.tasks).not.toBe(store.persisted.tasks)
    expect(snapshot.tasks[0]).toMatchObject({
      id: 'task-2',
      done: false,
      priority: 'medium',
    })
    expect(snapshot.tasks[1]).toMatchObject({
      id: 'task-1',
      done: true,
      priority: 'high',
    })
    expect(snapshot.events).not.toBe(store.persisted.studyEvents)
    expect(snapshot.events.find(event => event.id === 'evt-2')?.detail).toEqual({
      notice: 'detail_not_serializable',
    })
    snapshot.tasks[0]!.title = 'mutated-title'
    expect(store.persisted.tasks[0]?.title).toBe('Read chapter')
    expect(snapshot.events.at(-1)?.type).toBe('study_log_exported')
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('study_log_exported')
    const encodedSnapshot = JSON.stringify(snapshot)
    expect(JSON.parse(encodedSnapshot).schemaVersion).toBe(1)
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
    expect(store.persisted.studyEvents[0]).toMatchObject({
      type: 'study_events_cleared',
      detail: {
        statsDate: '2026-05-06',
      },
    })
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
    store.persisted.tasks = [{ id: 'task-1', title: 'Read chapter', done: false, createdAt: '2026-05-06T11:00:00.000Z', priority: 'medium' }]

    store.clearTodayStudyStats()

    expect(store.persisted.todayFocusSessions).toBe(0)
    expect(store.persisted.todayFocusMinutes).toBe(0)
    expect(store.persisted.todayReminderCount).toBe(0)
    expect(store.persisted.studyEvents).toHaveLength(1)
    expect(store.persisted.studyEvents[0]).toMatchObject({
      type: 'study_stats_cleared',
      detail: {
        statsDate: store.persisted.statsDate,
      },
    })
    expect(store.persisted.cycleCount).toBe(10)
    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.remainingMs).toBe(60_000)
    expect(store.persisted.segmentEndsAt).toBe(Date.now() + 60_000)
    expect(store.persisted.focusDurationMs).toBe(1_500_000)
    expect(store.persisted.breakDurationMs).toBe(300_000)
    expect(store.persisted.tasks).toEqual([{ id: 'task-1', title: 'Read chapter', done: false, createdAt: '2026-05-06T11:00:00.000Z', priority: 'medium' }])
  })

  it('keeps default focus/break minutes as 25/5', () => {
    const store = useStudyCompanionStore()
    expect(store.focusMinutes).toBe(25)
    expect(store.breakMinutes).toBe(5)
  })

  it('persists custom focus/break minutes using setters', () => {
    const store = useStudyCompanionStore()
    store.setFocusMinutes(30)
    store.setBreakMinutes(10)

    expect(store.focusMinutes).toBe(30)
    expect(store.breakMinutes).toBe(10)
    expect(store.persisted.focusDurationMs).toBe(30 * 60 * 1000)
    expect(store.persisted.breakDurationMs).toBe(10 * 60 * 1000)
  })

  it('clamps focus minutes into allowed range', () => {
    const store = useStudyCompanionStore()

    store.setFocusMinutes(1)
    expect(store.focusMinutes).toBe(MIN_FOCUS_MINUTES)

    store.setFocusMinutes(999)
    expect(store.focusMinutes).toBe(MAX_FOCUS_MINUTES)
  })

  it('clamps break minutes into allowed range', () => {
    const store = useStudyCompanionStore()

    store.setBreakMinutes(0)
    expect(store.breakMinutes).toBe(MIN_BREAK_MINUTES)

    store.setBreakMinutes(999)
    expect(store.breakMinutes).toBe(MAX_BREAK_MINUTES)
  })

  it('does not reset an active timer when changing durations and uses new duration on next round', () => {
    const store = useStudyCompanionStore()
    store.startFocus()
    const runningRemaining = store.persisted.remainingMs

    store.setFocusMinutes(30)
    store.setBreakMinutes(8)

    expect(store.persisted.mode).toBe('focus')
    expect(store.persisted.remainingMs).toBe(runningRemaining)
    expect(store.persisted.focusDurationMs).toBe(30 * 60 * 1000)
    expect(store.persisted.breakDurationMs).toBe(8 * 60 * 1000)

    store.resetSession()
    store.startFocus()
    expect(store.persisted.remainingMs).toBe(30 * 60 * 1000)
  })

  it('supports selected focus task lifecycle', () => {
    const store = useStudyCompanionStore()
    store.addTask('任务 A')
    store.addTask('任务 B')

    const taskAId = store.persisted.tasks[0]!.id
    const taskBId = store.persisted.tasks[1]!.id
    expect(store.persisted.selectedFocusTaskId).toBeNull()

    store.setSelectedFocusTaskId(taskAId)
    expect(store.persisted.selectedFocusTaskId).toBe(taskAId)
    expect(store.getSelectedFocusTask()?.title).toBe('任务 A')

    store.toggleTaskDone(taskAId)
    expect(store.persisted.selectedFocusTaskId).toBeNull()
    expect(store.getSelectedFocusTask()).toBeNull()

    store.setSelectedFocusTaskId(taskAId)
    expect(store.persisted.selectedFocusTaskId).toBeNull()

    store.setSelectedFocusTaskId(taskBId)
    store.deleteTask(taskBId)
    expect(store.persisted.selectedFocusTaskId).toBeNull()
  })

  it('falls back to medium priority for legacy task rows without priority field', () => {
    const store = useStudyCompanionStore()
    store.persisted.tasks = [
      {
        id: 'legacy-task',
        title: '旧任务',
        done: false,
        createdAt: '2026-05-06T09:00:00.000Z',
      } as any,
    ]

    const snapshot = store.exportStudySnapshot()
    expect(snapshot.tasks[0]?.priority).toBe('medium')
  })

  it('sorts tasks with smart mode: pending first, then priority, then due date, then createdAt', () => {
    const sorted = sortStudyTasks([
      { id: 'done', title: 'done', done: true, createdAt: '2026-05-06T08:00:00.000Z', priority: 'high' },
      { id: 'low', title: 'low', done: false, createdAt: '2026-05-06T08:20:00.000Z', priority: 'low' },
      { id: 'high-late', title: 'high-late', done: false, createdAt: '2026-05-06T08:30:00.000Z', priority: 'high', dueDate: '2026-05-08' },
      { id: 'high-early', title: 'high-early', done: false, createdAt: '2026-05-06T08:10:00.000Z', priority: 'high', dueDate: '2026-05-07' },
    ], 'smart')

    expect(sorted.map(task => task.id)).toEqual(['high-early', 'high-late', 'low', 'done'])
  })

  it('identifies due-today and overdue tasks correctly', () => {
    const now = new Date('2026-05-06T12:00:00.000Z')
    const dueTodayTask = { id: 'due-today', title: 'today', done: false, createdAt: '2026-05-06T08:00:00.000Z', priority: 'medium', dueDate: '2026-05-06' } as const
    const overdueTask = { id: 'overdue', title: 'old', done: false, createdAt: '2026-05-06T07:00:00.000Z', priority: 'medium', dueDate: '2026-05-05' } as const
    const doneTask = { id: 'done', title: 'done', done: true, createdAt: '2026-05-06T07:30:00.000Z', priority: 'medium', dueDate: '2026-05-05' } as const

    expect(isStudyTaskDueToday(dueTodayTask, now)).toBe(true)
    expect(isStudyTaskOverdue(dueTodayTask, now)).toBe(false)
    expect(isStudyTaskOverdue(overdueTask, now)).toBe(true)
    expect(isStudyTaskDueToday(doneTask, now)).toBe(false)
    expect(isStudyTaskOverdue(doneTask, now)).toBe(false)
  })

  it('returns continuous last-7-day history and fills missing dates with zero values', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-05-06'
    store.persisted.todayFocusMinutes = 60
    store.persisted.todayFocusSessions = 2
    store.persisted.historyEntries = [
      {
        dayKey: '2026-05-04',
        focusMinutes: 25,
        focusSessions: 1,
        completedTasks: 1,
        interruptCount: 0,
        createdTasks: 1,
        focusTaskIds: [],
      },
    ]

    const range = store.getLast7DaysStats()
    expect(range).toHaveLength(7)
    expect(range[0]?.dayKey).toBe('2026-04-30')
    expect(range[6]?.dayKey).toBe('2026-05-06')
    expect(range.find(entry => entry.dayKey === '2026-05-05')?.focusMinutes).toBe(0)
    expect(range.find(entry => entry.dayKey === '2026-05-06')?.focusMinutes).toBe(60)
  })

  it('uses continuous local day keys for history range generation', () => {
    const store = useStudyCompanionStore()
    vi.setSystemTime(new Date(2026, 4, 7, 0, 10, 0))

    const expectedTodayDayKey = getLocalDayKey(new Date())
    store.persisted.statsDate = expectedTodayDayKey
    const range = store.getHistoryRange(3)

    const expectedDays = [2, 1, 0].map(offset => getLocalDayKey(new Date(2026, 4, 7 - offset, 0, 10, 0)))
    expect(range.map(entry => entry.dayKey)).toEqual(expectedDays)
  })

  it('preserves previous-day history when rolling over to a new day', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-05-06'
    store.persisted.todayFocusMinutes = 50
    store.persisted.todayFocusSessions = 2
    store.persisted.studyEvents = [
      { id: 'evt-1', at: Date.parse('2026-05-06T09:00:00.000Z'), type: 'task_added' },
      { id: 'evt-2', at: Date.parse('2026-05-06T10:00:00.000Z'), type: 'task_completed' },
      { id: 'evt-3', at: Date.parse('2026-05-06T11:00:00.000Z'), type: 'focus_reset' },
    ]

    vi.setSystemTime(new Date('2026-05-07T08:00:00.000Z'))
    store.rolloverIfNeeded()

    const dayEntry = store.persisted.historyEntries.find(entry => entry.dayKey === '2026-05-06')
    expect(dayEntry?.focusMinutes).toBe(50)
    expect(dayEntry?.focusSessions).toBe(2)
    expect(dayEntry?.completedTasks).toBe(1)
    expect(dayEntry?.interruptCount).toBe(1)
  })

  it('uses local day key when rolling over across local midnight', () => {
    vi.setSystemTime(new Date(2026, 4, 6, 23, 59, 0))
    const store = useStudyCompanionStore()
    store.persisted.statsDate = getLocalDayKey(new Date(2026, 4, 6, 23, 59, 0))
    store.persisted.todayFocusMinutes = 20
    store.persisted.todayFocusSessions = 1

    vi.setSystemTime(new Date(2026, 4, 7, 0, 1, 0))
    store.rolloverIfNeeded()

    expect(store.persisted.statsDate).toBe(getLocalDayKey(new Date(2026, 4, 7, 0, 1, 0)))
    expect(store.persisted.historyEntries.some(entry => entry.dayKey === '2026-05-06')).toBe(true)
  })

  it('keeps existing history entries when adding new local-day rollup entries', () => {
    const store = useStudyCompanionStore()
    store.persisted.historyEntries = [
      {
        dayKey: '2026-05-01',
        focusMinutes: 30,
        focusSessions: 1,
        completedTasks: 1,
        interruptCount: 0,
        createdTasks: 1,
        focusTaskIds: ['legacy-task'],
      },
    ]
    store.persisted.statsDate = '2026-05-06'
    store.persisted.todayFocusMinutes = 40
    store.persisted.todayFocusSessions = 2

    vi.setSystemTime(new Date('2026-05-07T08:00:00.000Z'))
    store.rolloverIfNeeded()

    expect(store.persisted.historyEntries.some(entry => entry.dayKey === '2026-05-01')).toBe(true)
    expect(store.persisted.historyEntries.some(entry => entry.dayKey === '2026-05-06')).toBe(true)
  })

  it('records selected task id when starting focus and can complete selected task in one action', () => {
    const store = useStudyCompanionStore()
    store.addTask('完成课程实验')
    const taskId = store.persisted.tasks[0]!.id
    store.setSelectedFocusTaskId(taskId)

    store.startFocus()
    expect(store.persisted.studyEvents.at(-1)).toMatchObject({
      type: 'focus_started',
      detail: {
        taskId,
      },
    })

    store.resetSession()
    const completed = store.completeSelectedFocusTask()
    expect(completed).toBe(true)
    expect(store.persisted.tasks[0]?.done).toBe(true)
    expect(store.persisted.selectedFocusTaskId).toBeNull()
  })

  it('counts today interrupts by focus_reset only', () => {
    const store = useStudyCompanionStore()
    const baseDay = new Date(2026, 4, 6, 12, 0, 0)
    store.persisted.statsDate = getLocalDayKey(baseDay)
    store.persisted.studyEvents = [
      { id: 'evt-1', at: new Date(2026, 4, 6, 1, 0, 0).getTime(), type: 'focus_reset' },
      { id: 'evt-2', at: new Date(2026, 4, 6, 2, 0, 0).getTime(), type: 'focus_reset' },
      { id: 'evt-3', at: new Date(2026, 4, 6, 3, 0, 0).getTime(), type: 'session_paused' },
      { id: 'evt-4', at: new Date(2026, 4, 5, 23, 59, 59).getTime(), type: 'focus_reset' },
    ]

    expect(store.todayInterruptCount).toBe(2)
    expect(store.getTodayInterruptCount()).toBe(2)
  })

  it('builds markdown report with summary, tasks, interrupts and recent events', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-05-06'
    store.persisted.todayFocusMinutes = 50
    store.persisted.todayFocusSessions = 2
    store.persisted.tasks = [
      { id: 'task-1', title: '读书', done: true, createdAt: '2026-05-06T08:00:00.000Z', completedAt: '2026-05-06T10:00:00.000Z', priority: 'high', dueDate: '2026-05-06' },
      { id: 'task-2', title: '写总结', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium', dueDate: '2026-05-07' },
    ]
    store.persisted.studyEvents = [
      { id: 'evt-focus-reset', at: Date.parse('2026-05-06T11:00:00.000Z'), type: 'focus_reset', detail: {} },
      { id: 'evt-task-completed', at: Date.parse('2026-05-06T11:30:00.000Z'), type: 'task_completed', detail: { id: 'task-1' } },
    ]

    const markdown = store.buildStudyMarkdownReport()
    expect(markdown).toContain('# Rin 学习陪伴报告')
    expect(markdown).toContain('日期：2026-05-06')
    expect(markdown).toContain('| 今日专注分钟 | 50 |')
    expect(markdown).toContain('| 今日专注轮数 | 2 |')
    expect(markdown).toContain('| 今日完成任务数 | 1 |')
    expect(markdown).toContain('| 今日中断次数 | 1 |')
    expect(markdown).toContain('| 任务 | 状态 | 优先级 | 截止日期 | 完成时间 |')
    expect(markdown).toContain('| 读书 | 已完成 | 高 | 2026-05-06 |')
    expect(markdown).toContain('## 最近 7 天学习趋势')
    expect(markdown).toContain('## 最近 14 天趋势摘要')
    expect(markdown).toContain('## 任务完成结构')
    expect(markdown).toContain('## 专注质量概览')
    expect(markdown).toContain('## 优先级任务分布')
    expect(markdown).toContain('| 任务状态 | 数量 |')
    expect(markdown).toContain('| 优先级 | 数量 | 已完成 | 未完成 |')
    expect(markdown).toContain('## 最近学习事件（最多 10 条）')
  })

  it('exports markdown report with expected file name format', () => {
    const store = useStudyCompanionStore()
    store.persisted.statsDate = '2026-05-06'

    const report = store.exportStudyMarkdownReport()

    expect(report.filename).toBe('rin-study-report-2026-05-06.md')
    expect(report.markdown).toContain('# Rin 学习陪伴报告')
    expect(store.persisted.studyEvents.at(-1)?.type).toBe('study_markdown_report_exported')
  })

  it('uses local day key as markdown report date', () => {
    vi.setSystemTime(new Date(2026, 4, 6, 10, 0, 0))
    const store = useStudyCompanionStore()
    const expectedDayKey = getLocalDayKey(new Date())
    store.persisted.statsDate = expectedDayKey

    const report = store.exportStudyMarkdownReport()
    expect(report.statsDate).toBe(expectedDayKey)
    expect(report.filename).toBe(`rin-study-report-${expectedDayKey}.md`)
    expect(report.markdown).toContain(`- 日期：${expectedDayKey}`)
  })
})
