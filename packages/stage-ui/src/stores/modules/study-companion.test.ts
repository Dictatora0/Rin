import { createPinia, setActivePinia } from 'pinia'
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
})
