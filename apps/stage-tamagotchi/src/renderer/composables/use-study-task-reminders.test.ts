// @vitest-environment jsdom

import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudyTaskReminders } from './use-study-task-reminders'

const mocks = vi.hoisted(() => ({
  notifyInvoke: vi.fn(async () => true),
}))

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaContext: () => ({ value: {} }),
}))

vi.mock('@moeru/eventa', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@moeru/eventa')>()
  return {
    ...actual,
    defineInvoke: () => mocks.notifyInvoke,
  }
})

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

describe('useStudyTaskReminders', () => {
  beforeEach(() => {
    installLocalStorageMock()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 8, 0, 10, 0))
    setActivePinia(createPinia())
    mocks.notifyInvoke.mockReset()
    mocks.notifyInvoke.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('sends notification and marks delivery only when notification succeeds', async () => {
    const store = useStudyCompanionStore()
    store.persisted.tasks = [
      {
        id: 'task-1',
        title: '复习课程',
        done: false,
        createdAt: new Date(2026, 4, 6, 10, 0, 0).toISOString(),
        priority: 'high',
        dueDate: '2026-05-08',
        reminders: [{
          id: 'reminder-1d',
          amount: 1,
          unit: 'day',
          enabled: true,
          source: 'user-custom',
          label: '自定义：提前 1 天',
        }],
        reminderDeliveries: [],
      },
    ]

    const scheduler = useStudyTaskReminders({ intervalMs: 60_000 })
    await scheduler.runOnce()
    await Promise.resolve()
    expect(mocks.notifyInvoke).toHaveBeenCalledTimes(1)
    expect(store.persisted.tasks[0]?.reminderDeliveries).toHaveLength(1)

    mocks.notifyInvoke.mockResolvedValue(false)
    store.persisted.tasks[0]!.reminderDeliveries = []
    await scheduler.runOnce()
    await Promise.resolve()
    expect(mocks.notifyInvoke).toHaveBeenCalledTimes(2)
    expect(store.persisted.tasks[0]?.reminderDeliveries).toHaveLength(0)
  })

  it('does not notify when global due reminder switch is disabled', async () => {
    const store = useStudyCompanionStore()
    store.persisted.taskDueReminderEnabled = false
    store.persisted.tasks = [
      {
        id: 'task-1',
        title: '复习课程',
        done: false,
        createdAt: new Date(2026, 4, 6, 10, 0, 0).toISOString(),
        priority: 'high',
        dueDate: '2026-05-08',
        reminders: [{
          id: 'reminder-1d',
          amount: 1,
          unit: 'day',
          enabled: true,
          source: 'user-custom',
        }],
        reminderDeliveries: [],
      },
    ]

    const scheduler = useStudyTaskReminders({ intervalMs: 60_000 })
    await scheduler.runOnce()
    expect(mocks.notifyInvoke).toHaveBeenCalledTimes(0)
    expect(store.persisted.tasks[0]?.reminderDeliveries).toHaveLength(0)
  })

  it('start is idempotent and stop clears interval polling', async () => {
    const store = useStudyCompanionStore()
    store.persisted.tasks = [
      {
        id: 'task-1',
        title: '复习课程',
        done: false,
        createdAt: new Date(2026, 4, 6, 10, 0, 0).toISOString(),
        priority: 'high',
        dueDate: '2026-05-08',
        reminders: [{
          id: 'reminder-1d',
          amount: 1,
          unit: 'day',
          enabled: true,
          source: 'user-custom',
        }],
        reminderDeliveries: [],
      },
    ]

    const scheduler = useStudyTaskReminders({ intervalMs: 10_000 })
    scheduler.start()
    scheduler.start()
    await Promise.resolve()
    expect(mocks.notifyInvoke).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(20_000)
    await vi.runOnlyPendingTimersAsync()
    expect(mocks.notifyInvoke.mock.calls.length).toBeGreaterThanOrEqual(3)

    scheduler.stop()
    const calledBeforeStopAdvance = mocks.notifyInvoke.mock.calls.length
    vi.advanceTimersByTime(30_000)
    await vi.runOnlyPendingTimersAsync()
    expect(mocks.notifyInvoke.mock.calls.length).toBe(calledBeforeStopAdvance)
  })
})
