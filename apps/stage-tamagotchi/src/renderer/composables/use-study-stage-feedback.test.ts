import { useLive2d } from '@proj-airi/stage-ui/stores/live2d'
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { resolveStudyFeedbackEmotion, useStudyStageFeedback } from './use-study-stage-feedback'

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

describe('resolveStudyFeedbackEmotion', () => {
  it('maps study modes to Live2D feedback emotions', () => {
    // Stable mode mapping is the contract other HCI modules rely on.
    expect(resolveStudyFeedbackEmotion('idle', false)).toBe('neutral')
    expect(resolveStudyFeedbackEmotion('focus', false)).toBe('think')
    expect(resolveStudyFeedbackEmotion('break', false)).toBe('curious')
    expect(resolveStudyFeedbackEmotion('paused', false)).toBe('question')
    expect(resolveStudyFeedbackEmotion('focus_completed', false)).toBe('happy')
    expect(resolveStudyFeedbackEmotion('task_completed', false)).toBe('happy')
    expect(resolveStudyFeedbackEmotion('task_overload', false)).toBe('awkward')
  })

  it('uses neutral feedback while study reminders are muted', () => {
    // Static and momentary feedback both respect mute so Rin stays low-interruption.
    expect(resolveStudyFeedbackEmotion('focus', true)).toBe('neutral')
    expect(resolveStudyFeedbackEmotion('focus_completed', true)).toBe('neutral')
  })
})

describe('useStudyStageFeedback', () => {
  beforeEach(() => {
    installLocalStorageMock()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T12:00:00.000Z'))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('updates Live2D motion when the study mode changes', async () => {
    // The test uses only Pinia stores, so it verifies the integration without
    // requiring Electron, Pixi, or a real Live2D model file.
    const live2dStore = useLive2d()
    live2dStore.availableMotions = [
      { motionName: 'Idle', motionIndex: 0, fileName: 'idle.motion3.json' },
      { motionName: 'Think', motionIndex: 0, fileName: 'think.motion3.json' },
      { motionName: 'Curious', motionIndex: 0, fileName: 'curious.motion3.json' },
      { motionName: 'Question', motionIndex: 0, fileName: 'question.motion3.json' },
    ]

    const stop = useStudyStageFeedback()
    const studyStore = useStudyCompanionStore()

    studyStore.startFocus()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Think')

    studyStore.pause()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Question')

    studyStore.resetSession()
    studyStore.startBreak()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Curious')

    stop()
  })

  it('falls back to Idle when a target emotion motion is missing', async () => {
    // ROOT CAUSE:
    //
    // User-supplied Live2D models may not define AIRI's named emotion motions.
    // Without a fallback, study feedback could repeatedly request missing motion
    // groups and depend on Model.vue's error handling.
    //
    // We fixed this by resolving unavailable emotion motions to Idle first.
    const live2dStore = useLive2d()
    live2dStore.availableMotions = [
      { motionName: 'Idle', motionIndex: 0, fileName: 'idle.motion3.json' },
    ]

    const stop = useStudyStageFeedback()
    const studyStore = useStudyCompanionStore()

    studyStore.startFocus()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Idle')

    stop()
  })

  it('uses Happy feedback for completion events unless muted', async () => {
    // Completion events are stored in `studyEvents`, not `mode`, so this covers
    // the momentary feedback channel separately from the ambient state watcher.
    const live2dStore = useLive2d()
    live2dStore.availableMotions = [
      { motionName: 'Idle', motionIndex: 0, fileName: 'idle.motion3.json' },
      { motionName: 'Happy', motionIndex: 0, fileName: 'happy.motion3.json' },
    ]

    const stop = useStudyStageFeedback()
    const studyStore = useStudyCompanionStore()

    studyStore.appendEvent('focus_completed', {})
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Happy')

    studyStore.persisted.mutedUntil = Date.now() + 30 * 60 * 1000
    studyStore.appendEvent('break_completed', {})
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Idle')

    stop()
  })

  it('uses Awkward feedback for task_overload event when matching motion exists', async () => {
    const live2dStore = useLive2d()
    live2dStore.availableMotions = [
      { motionName: 'Idle', motionIndex: 0, fileName: 'idle.motion3.json' },
      { motionName: 'Awkward', motionIndex: 0, fileName: 'awkward.motion3.json' },
    ]

    const stop = useStudyStageFeedback()
    const studyStore = useStudyCompanionStore()

    studyStore.appendEvent('task_overload', { pending: 6 })
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Awkward')

    stop()
  })

  it('stops reacting to mode/event changes after stop() is called', async () => {
    const live2dStore = useLive2d()
    live2dStore.availableMotions = [
      { motionName: 'Idle', motionIndex: 0, fileName: 'idle.motion3.json' },
      { motionName: 'Think', motionIndex: 0, fileName: 'think.motion3.json' },
      { motionName: 'Question', motionIndex: 0, fileName: 'question.motion3.json' },
      { motionName: 'Happy', motionIndex: 0, fileName: 'happy.motion3.json' },
    ]

    const stop = useStudyStageFeedback()
    const studyStore = useStudyCompanionStore()

    studyStore.startFocus()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Think')

    stop()

    studyStore.pause()
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Think')

    studyStore.appendEvent('focus_completed', {})
    await nextTick()
    expect(live2dStore.currentMotion.group).toBe('Think')
  })
})
