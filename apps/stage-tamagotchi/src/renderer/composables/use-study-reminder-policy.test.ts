import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { useStudyReminderPolicy } from './use-study-reminder-policy'

/**
 * @example
 * ```ts
 * beforeEach(() => {
 *   installLocalStorageMock()
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

describe('useStudyReminderPolicy', () => {
  beforeEach(() => {
    installLocalStorageMock()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('shows reminders for focus/break completion transitions and auto-dismisses after 4s', async () => {
    const store = useStudyCompanionStore()

    const scope = effectScope()
    const reminder = scope.run(() => useStudyReminderPolicy())!

    store.persisted.mode = 'focus'
    await nextTick()
    store.persisted.mode = 'break'
    await nextTick()

    expect(reminder.currentReminder.value).toMatchObject({
      type: 'focus_completed',
      message: 'Focus complete! Time for a break.',
    })
    expect(reminder.todayReminderCount.value).toBe(1)

    vi.advanceTimersByTime(4_000)
    expect(reminder.currentReminder.value).toBeNull()

    vi.setSystemTime(new Date('2026-05-10T12:00:35.000Z'))
    store.persisted.mode = 'idle'
    await nextTick()

    expect(reminder.currentReminder.value).toMatchObject({
      type: 'break_completed',
      message: 'Break is over. Ready to focus?',
    })
    expect(reminder.todayReminderCount.value).toBe(2)

    scope.stop()
  })

  it('throttles task reminders within 30s and suppresses reminders when muted', async () => {
    const store = useStudyCompanionStore()
    const scope = effectScope()
    const reminder = scope.run(() => useStudyReminderPolicy())!

    store.appendEvent('task_completed', { id: 'task-1' })
    await nextTick()
    expect(reminder.currentReminder.value).toMatchObject({
      type: 'task_completed',
      message: 'Task completed. Keep it up!',
    })
    expect(reminder.todayReminderCount.value).toBe(1)

    reminder.dismissReminder()
    vi.setSystemTime(new Date('2026-05-10T12:00:10.000Z'))
    store.appendEvent('task_completed', { id: 'task-2' })
    await nextTick()
    expect(reminder.currentReminder.value).toBeNull()
    expect(reminder.todayReminderCount.value).toBe(1)

    vi.setSystemTime(new Date('2026-05-10T12:00:45.000Z'))
    store.persisted.mutedUntil = Date.now() + 60_000
    store.appendEvent('task_completed', { id: 'task-3' })
    await nextTick()
    expect(reminder.currentReminder.value).toBeNull()
    expect(reminder.todayReminderCount.value).toBe(1)

    scope.stop()
  })
})
