// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

import { useVisionPetFeedback } from './use-vision-pet-feedback'

const stageModelRenderer = ref<'live2d' | 'vrm' | 'godot'>('live2d')
const currentMotion = ref<{ group: string, index?: number }>({ group: 'Idle' })
const availableMotions = ref<Array<{ motionName: string, motionIndex?: number }>>([])
const toggleExpression = vi.fn<(name: string, durationSeconds: number) => { success: boolean }>()

const expressionStoreState = {
  modelId: 'live2d-model-id',
  expressionGroups: new Map<string, number>(),
  expressions: new Map<string, number>(),
}

vi.mock('pinia', () => ({
  storeToRefs: <T extends Record<string, unknown>>(store: T) => store,
}))

vi.mock('@proj-airi/stage-ui/stores/settings', () => ({
  useSettings: () => ({
    stageModelRenderer,
  }),
}))

vi.mock('@proj-airi/stage-ui-live2d', () => ({
  EmotionHappyMotionName: 'Happy',
  EmotionNeutralMotionName: 'Neutral',
  EmotionThinkMotionName: 'Think',
  useLive2d: () => ({
    currentMotion,
    availableMotions,
  }),
  useExpressionStore: () => ({
    modelId: expressionStoreState.modelId,
    expressionGroups: expressionStoreState.expressionGroups,
    expressions: expressionStoreState.expressions,
    toggle: toggleExpression,
  }),
}))

function resetLive2dMocks() {
  stageModelRenderer.value = 'live2d'
  currentMotion.value = { group: 'Idle' }
  availableMotions.value = [
    { motionName: 'Idle', motionIndex: 0 },
    { motionName: 'Tap', motionIndex: 0 },
    { motionName: 'Tap@Body', motionIndex: 0 },
    { motionName: 'Flick', motionIndex: 0 },
    { motionName: 'Think', motionIndex: 0 },
    { motionName: 'Neutral', motionIndex: 0 },
    { motionName: 'Happy', motionIndex: 0 },
  ]
  expressionStoreState.modelId = 'live2d-model-id'
  expressionStoreState.expressionGroups = new Map([
    ['neutral', 0],
    ['normal', 0],
    ['happy', 0],
    ['smile', 0],
  ])
  expressionStoreState.expressions = new Map([
    ['smile', 0],
    ['normal', 0],
  ])
  toggleExpression.mockReset()
  toggleExpression.mockReturnValue({ success: true })
}

function assertFeedbackReady(
  feedback: ReturnType<typeof useVisionPetFeedback> | null,
): ReturnType<typeof useVisionPetFeedback> {
  if (!feedback)
    throw new Error('feedback should be initialized')
  return feedback
}

function createFeedbackHarness(options?: Parameters<typeof useVisionPetFeedback>[0]) {
  let feedback: ReturnType<typeof useVisionPetFeedback> | null = null

  const host = defineComponent({
    setup() {
      feedback = useVisionPetFeedback(options)
      return () => h('div')
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  app.mount(container)

  const readyFeedback = assertFeedbackReady(feedback)

  return {
    feedback: readyFeedback,
    unmount: () => app.unmount(),
  }
}

describe('useVisionPetFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T00:00:00.000Z'))
    resetLive2dMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('enters quiet mode on open_palm and counts down remaining milliseconds', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 30_000,
      feedbackCooldownMs: 2_000,
    })

    const triggered = feedback.triggerVisionPetFeedback('open_palm', {
      allowVisualFeedback: true,
      gateEnabled: false,
      sourceEventId: 11,
    })

    expect(triggered).toBe(true)
    expect(feedback.petFeedbackState.value).toBe('quiet')
    expect(feedback.isQuietVisualMode.value).toBe(true)
    expect(feedback.quietRemainingMs.value).toBe(30_000)
    expect(feedback.lastPetFeedback.value?.eventType).toBe('open_palm')
    expect(feedback.lastPetFeedback.value?.motion).toBe('Idle')
    expect(toggleExpression).toHaveBeenCalledWith('neutral', 1.8)

    vi.advanceTimersByTime(1_000)
    expect(feedback.quietRemainingMs.value).toBe(29_000)
    unmount()
  })

  it('suppresses strong feedback while quiet mode is active', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 30_000,
      victoryCooldownMs: 3_000,
    })

    feedback.triggerVisionPetFeedback('open_palm', { allowVisualFeedback: true })
    const celebrationBefore = feedback.celebrationCount.value

    const victoryTriggered = feedback.triggerVisionPetFeedback('victory', { allowVisualFeedback: true })
    const thumbsTriggered = feedback.triggerVisionPetFeedback('thumbs_up', { allowVisualFeedback: true })

    expect(victoryTriggered).toBe(true)
    expect(thumbsTriggered).toBe(true)
    expect(feedback.celebrationCount.value).toBe(celebrationBefore)
    expect(feedback.petFeedbackState.value).toBe('quiet')
    expect(feedback.lastPetFeedback.value?.suppressedByQuiet).toBe(true)
    expect(feedback.lastPetFeedback.value?.state).toBe('quiet')
    expect(toggleExpression).toHaveBeenCalledTimes(1)
    expect(currentMotion.value.group).toBe('Idle')
    unmount()
  })

  it('triggers celebration once and enforces victory cooldown', () => {
    const { feedback, unmount } = createFeedbackHarness({
      victoryCooldownMs: 3_000,
      celebrationVisualMs: 2_500,
    })

    const first = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: true,
      gateEnabled: true,
      gateState: 'enabled',
      sourceEventId: 301,
    })
    const secondInCooldown = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: true,
      gateEnabled: true,
      gateState: 'enabled',
      sourceEventId: 302,
    })

    expect(first).toBe(true)
    expect(secondInCooldown).toBe(false)
    expect(feedback.celebrationCount.value).toBe(1)
    expect(feedback.petFeedbackState.value).toBe('celebrating')
    expect(feedback.lastPetFeedback.value?.state).toBe('celebrating')
    expect(feedback.lastPetFeedback.value?.motion).toBe('Tap@Body')
    expect(toggleExpression).toHaveBeenCalledWith('happy', 2.5)

    vi.advanceTimersByTime(3_001)
    const afterCooldown = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: true,
      gateEnabled: true,
      gateState: 'enabled',
      sourceEventId: 303,
    })
    expect(afterCooldown).toBe(true)
    expect(feedback.celebrationCount.value).toBe(2)
    unmount()
  })

  it('acknowledges thumbs_up as lightweight feedback', () => {
    const { feedback, unmount } = createFeedbackHarness({
      acknowledgedVisualMs: 1_200,
    })

    const triggered = feedback.triggerVisionPetFeedback('thumbs_up', {
      allowVisualFeedback: true,
      summary: 'Acknowledged current prompt.',
      sourceEventId: 91,
    })

    expect(triggered).toBe(true)
    expect(feedback.petFeedbackState.value).toBe('acknowledged')
    expect(feedback.lastPetFeedback.value?.eventType).toBe('thumbs_up')
    expect(feedback.lastPetFeedback.value?.summary).toBe('Acknowledged current prompt.')
    expect(feedback.lastPetFeedback.value?.motion).toBe('Tap')
    expect(toggleExpression).toHaveBeenCalledWith('smile', 1.2)
    unmount()
  })

  it('records gated feedback and blocks motion/expression/count when gate disallows', () => {
    const { feedback, unmount } = createFeedbackHarness()

    const result = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'gated',
      sourceEventId: 401,
    })

    expect(result).toBe(false)
    expect(feedback.petFeedbackState.value).toBe('gated')
    expect(feedback.lastPetFeedback.value).toEqual(expect.objectContaining({
      eventType: 'gated',
      state: 'gated',
      sourceEventId: 401,
      gated: true,
    }))
    expect(feedback.celebrationCount.value).toBe(0)
    expect(toggleExpression).not.toHaveBeenCalled()
    expect(currentMotion.value.group).toBe('Idle')
    unmount()
  })

  it('keeps celebration blocked for multiple_faces gate state without mutating motion or expression', () => {
    const { feedback, unmount } = createFeedbackHarness()

    currentMotion.value = { group: 'Idle' }
    const result = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      summary: 'Gesture detected but pet feedback gated.',
      sourceEventId: 777,
    })

    expect(result).toBe(false)
    expect(feedback.petFeedbackState.value).toBe('gated')
    expect(feedback.lastPetFeedback.value?.eventType).toBe('gated')
    expect(feedback.lastPetFeedback.value?.summary).toBe('Gesture detected but pet feedback gated.')
    expect(feedback.lastPetFeedback.value?.sourceEventId).toBe(777)
    expect(feedback.celebrationCount.value).toBe(0)
    expect(currentMotion.value.group).toBe('Idle')
    expect(toggleExpression).toHaveBeenCalledTimes(0)
    unmount()
  })

  it('falls back safely when motion or expression candidates are unavailable', () => {
    availableMotions.value = []
    expressionStoreState.expressionGroups = new Map()
    expressionStoreState.expressions = new Map()

    const { feedback, unmount } = createFeedbackHarness({
      celebrationVisualMs: 2_000,
      acknowledgedVisualMs: 1_500,
    })

    const victory = feedback.triggerVisionPetFeedback('victory', { allowVisualFeedback: true })
    expect(victory).toBe(true)
    expect(feedback.celebrationCount.value).toBe(1)
    expect(feedback.lastPetFeedback.value?.motion).toBeUndefined()
    expect(feedback.lastPetFeedback.value?.expression).toBeUndefined()

    const thumbs = feedback.triggerVisionPetFeedback('thumbs_up', { allowVisualFeedback: true, force: true })
    expect(thumbs).toBe(true)
    expect(feedback.lastPetFeedback.value?.eventType).toBe('thumbs_up')
    expect(feedback.lastPetFeedback.value?.motion).toBeUndefined()
    expect(feedback.lastPetFeedback.value?.expression).toBeUndefined()
    unmount()
  })

  it('does not throw when renderer is not live2d and still updates UI state', () => {
    stageModelRenderer.value = 'vrm'
    const { feedback, unmount } = createFeedbackHarness()

    const openPalm = feedback.triggerVisionPetFeedback('open_palm', { allowVisualFeedback: true })
    expect(openPalm).toBe(true)
    expect(feedback.petFeedbackState.value).toBe('quiet')
    expect(feedback.lastPetFeedback.value?.eventType).toBe('open_palm')

    const victory = feedback.triggerVisionPetFeedback('victory', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      sourceEventId: 600,
    })

    expect(victory).toBe(false)
    expect(feedback.petFeedbackState.value).toBe('gated')
    expect(feedback.lastPetFeedback.value?.eventType).toBe('gated')
    expect(feedback.celebrationCount.value).toBe(0)
    unmount()
  })
})
