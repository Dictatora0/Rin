import { createDefaultStudyCompanionPersisted, useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { STUDY_BUBBLE_COPY_BY_EVENT } from './study-companion-bubble-copy-resolver'
import {
  createStudyBubbleCopyHistory,
  createStudyBubblePolicyHistory,
  createTaskOverloadBubblePayload,
  resolveStudyBubbleText,
  shouldShowStudyBubble,
  useStudyCompanionBubble,
} from './use-study-companion-bubble'

function createSnapshot() {
  return createDefaultStudyCompanionPersisted()
}

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

describe('resolveStudyBubbleText', () => {
  it('returns contextual focus_started copy with consistent payload metadata', () => {
    const history = createStudyBubbleCopyHistory()

    const firstRound = createSnapshot()
    firstRound.todayFocusSessions = 0
    const firstRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, firstRound, history)
    expect(firstRoundCopy).toEqual({
      text: '第一轮开始，先进入状态。',
      kind: 'focus',
      throttleKey: 'focus_started',
      critical: false,
    })

    const laterRound = createSnapshot()
    laterRound.todayFocusSessions = 2
    const laterRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, laterRound, history)
    expect(laterRoundCopy).toMatchObject({
      kind: 'focus',
      throttleKey: 'focus_started',
      critical: false,
    })
    expect(laterRoundCopy?.text).toBe('第 3 轮开始，节奏很不错。')

    const demoRound = createSnapshot()
    demoRound.todayFocusSessions = 1
    demoRound.demoModeEnabled = true
    const demoRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, demoRound, history)
    expect(demoRoundCopy).toMatchObject({
      kind: 'focus',
      throttleKey: 'focus_started',
      critical: false,
    })
    expect(STUDY_BUBBLE_COPY_BY_EVENT.focus_started_demo.includes(demoRoundCopy?.text ?? '')).toBe(true)
  })

  it('returns task_completed copy with accurate pending summary and critical metadata', () => {
    const history = createStudyBubbleCopyHistory()

    const allDone = createSnapshot()
    allDone.tasks = [{ id: '1', title: 'A', done: true, createdAt: Date.now(), completedAt: Date.now() }]
    const allDoneCopy = resolveStudyBubbleText({ type: 'task_completed' }, allDone, history)
    expect(allDoneCopy).toEqual({
      text: '今日任务清空了，可以轻松一点。',
      kind: 'task',
      throttleKey: 'task_completed',
      critical: true,
    })

    const pendingTasks = createSnapshot()
    pendingTasks.tasks = [
      { id: '1', title: 'A', done: true, createdAt: Date.now(), completedAt: Date.now() },
      { id: '2', title: 'B', done: false, createdAt: Date.now() },
      { id: '3', title: 'C', done: false, createdAt: Date.now() },
    ]
    const pendingCopy = resolveStudyBubbleText({ type: 'task_completed' }, pendingTasks, history)
    expect(pendingCopy).toEqual({
      text: '还剩 2 项，先挑最重要的一项。',
      kind: 'task',
      throttleKey: 'task_completed',
      critical: true,
    })
  })

  it('avoids repeating the same copy in the latest two messages for one event type', () => {
    const history = createStudyBubbleCopyHistory()
    const snapshot = createSnapshot()

    const first = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)
    const second = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)
    const third = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)

    expect(first?.text).not.toBe(second?.text)
    expect(first?.text).not.toBe(third?.text)
    expect(second?.text).not.toBe(third?.text)
  })

  it('prefers unseen copy lines before recycling used lines for the same event', () => {
    const history = createStudyBubbleCopyHistory()
    const snapshot = createSnapshot()
    const expectedUniqueCount = STUDY_BUBBLE_COPY_BY_EVENT.session_resumed.length
    const seen = new Set<string>()

    for (let index = 0; index < expectedUniqueCount; index += 1) {
      const payload = resolveStudyBubbleText({ type: 'session_resumed' }, snapshot, history)
      expect(payload).toMatchObject({
        kind: 'focus',
        throttleKey: 'session_resumed',
        critical: false,
      })
      seen.add(payload!.text)
      expect(seen.size).toBe(index + 1)
    }
  })
})

describe('shouldShowStudyBubble', () => {
  it('applies the default 30s throttle window and records throttle timestamp', () => {
    const history = createStudyBubblePolicyHistory()
    const payload = {
      text: '暂停一下也没关系，回来继续就好。',
      kind: 'focus' as const,
      throttleKey: 'session_paused',
      critical: false,
    }

    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 1000 }, history)).toBe(true)
    expect(history.lastShownAtByKey.get('session_paused')).toBe(1000)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 20_000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 31_500 }, history)).toBe(true)
  })

  it('applies the 5-minute throttle window for task_overload', () => {
    const copyHistory = createStudyBubbleCopyHistory()
    const policyHistory = createStudyBubblePolicyHistory()
    const payload = createTaskOverloadBubblePayload(copyHistory)

    expect(payload.throttleMs).toBe(5 * 60 * 1000)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 1000 }, policyHistory)).toBe(true)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 240_000 }, policyHistory)).toBe(false)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 301_000 }, policyHistory)).toBe(true)
  })

  it('suppresses non-critical bubbles when muted and allows critical bubbles', () => {
    const history = createStudyBubblePolicyHistory()
    const nonCritical = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }
    const critical = {
      text: '这一轮完成了，先让眼睛休息一下吧。',
      kind: 'focus' as const,
      throttleKey: 'focus_completed',
      critical: true,
    }

    expect(shouldShowStudyBubble(nonCritical, { mode: 'idle', isMuted: true, now: 1000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(critical, { mode: 'idle', isMuted: true, now: 2000 }, history)).toBe(true)
  })

  it('suppresses non-critical bubbles during focus mode except focus_started', () => {
    const history = createStudyBubblePolicyHistory()
    const paused = {
      text: '先停在这里，我帮你记着进度。',
      kind: 'focus' as const,
      throttleKey: 'session_paused',
      critical: false,
    }
    const started = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }

    expect(shouldShowStudyBubble(paused, { mode: 'focus', isMuted: false, now: 1000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(started, { mode: 'focus', isMuted: false, now: 2000 }, history)).toBe(true)
  })

  it('suppresses repeated copy text within the same cooldown window', () => {
    const history = createStudyBubblePolicyHistory()
    const firstPayload = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }
    const secondPayload = {
      text: '好，先专注这一小段。',
      kind: 'task' as const,
      throttleKey: 'task_completed',
      critical: true,
    }

    expect(shouldShowStudyBubble(firstPayload, { mode: 'idle', isMuted: false, now: 1000 }, history)).toBe(true)
    expect(shouldShowStudyBubble(secondPayload, { mode: 'idle', isMuted: false, now: 10_000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(secondPayload, { mode: 'idle', isMuted: false, now: 32_000 }, history)).toBe(true)
  })
})

describe('useStudyCompanionBubble integration', () => {
  beforeEach(() => {
    installLocalStorageMock()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-10T10:00:00.000Z'))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('ignores historical tail event on mount, then shows bubble for fresh events and auto-hides', async () => {
    const studyStore = useStudyCompanionStore()
    studyStore.appendEvent('focus_started', { from: 'idle' })

    const scope = effectScope()
    const bubble = scope.run(() => useStudyCompanionBubble())!

    await nextTick()
    expect(bubble.currentBubble.value).toBeNull()

    studyStore.appendEvent('focus_completed', {})
    await nextTick()
    expect(bubble.currentBubble.value).toBeNull()

    studyStore.appendEvent('focus_completed', {})
    await nextTick()
    expect(bubble.currentBubble.value).toMatchObject({
      kind: 'focus',
      durationMs: 4500,
    })

    vi.advanceTimersByTime(4500)
    expect(bubble.currentBubble.value).toBeNull()

    scope.stop()
  })

  it('suppresses non-critical events when muted but still shows critical events', async () => {
    const studyStore = useStudyCompanionStore()
    const scope = effectScope()
    const bubble = scope.run(() => useStudyCompanionBubble())!

    studyStore.appendEvent('focus_started', { from: 'idle' })
    await nextTick()

    studyStore.persisted.mutedUntil = Date.now() + 60_000
    studyStore.appendEvent('session_paused', { carry: 'focus' })
    await nextTick()
    expect(bubble.currentBubble.value).toBeNull()

    studyStore.appendEvent('task_completed', { id: 'task-1', title: 'A' })
    await nextTick()
    expect(bubble.currentBubble.value).toMatchObject({
      kind: 'task',
      durationMs: 4500,
    })

    scope.stop()
  })

  it('throttles task_overload bubbles for five minutes in reactive watcher path', async () => {
    const studyStore = useStudyCompanionStore()
    const scope = effectScope()
    const bubble = scope.run(() => useStudyCompanionBubble())!

    for (let index = 0; index < 5; index += 1)
      studyStore.addTask(`任务-${index + 1}`)

    await nextTick()
    expect(STUDY_BUBBLE_COPY_BY_EVENT.task_overload.includes(bubble.currentBubble.value?.text ?? '')).toBe(true)

    bubble.hideBubble()
    vi.setSystemTime(new Date('2026-05-10T10:01:00.000Z'))
    studyStore.addTask('任务-6')
    await nextTick()
    expect(bubble.currentBubble.value).toBeNull()

    vi.setSystemTime(new Date('2026-05-10T10:06:10.000Z'))
    studyStore.addTask('任务-7')
    await nextTick()
    expect(STUDY_BUBBLE_COPY_BY_EVENT.task_overload.includes(bubble.currentBubble.value?.text ?? '')).toBe(true)

    scope.stop()
  })
})
