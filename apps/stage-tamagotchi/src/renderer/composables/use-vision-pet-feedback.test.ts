// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

import { listVisionFeedbackTemplatesForEvent } from '../utils/vision-feedback-messages'
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
      feedback = useVisionPetFeedback({
        random: () => 0,
        ...options,
      })
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
    localStorage.clear()
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

  it('triggers subject-position response with cooldown and direction-change gating', () => {
    const { feedback, unmount } = createFeedbackHarness({
      subjectResponseCooldownMs: 3_500,
      subjectResponseVisualMs: 1_500,
      feedbackMessageCooldownMs: 3_500,
    })

    const firstLeft = feedback.triggerSubjectPositionFeedback('left', {
      allowVisualFeedback: true,
      sourceEventId: 9001,
    })
    expect(firstLeft).toBe(true)
    expect(feedback.subjectResponseState.value).toBe('following_left')
    expect(feedback.lastSubjectResponseEvent.value).toEqual(expect.objectContaining({
      eventType: 'subject_position_left',
      direction: 'left',
      state: 'following_left',
      sourceEventId: 9001,
      gated: false,
      suppressedByQuiet: false,
      summary: 'I noticed you moved left.',
      motion: 'Think',
      expression: 'normal',
      isTransition: false,
      resolvedEventType: 'subject_position_left',
      templateId: 'left-bal-1',
      feedbackChannels: ['ui', 'toast'],
    }))
    expect(feedback.subjectResponseCooldownUntil.value).toBe(Date.now() + 3_500)

    const duplicateLeftInCooldown = feedback.triggerSubjectPositionFeedback('left', {
      allowVisualFeedback: true,
      sourceEventId: 9002,
    })
    expect(duplicateLeftInCooldown).toBe(false)
    expect(feedback.lastSubjectResponseEvent.value?.sourceEventId).toBe(9001)

    vi.advanceTimersByTime(3_600)
    const duplicateLeftAfterCooldown = feedback.triggerSubjectPositionFeedback('left', {
      allowVisualFeedback: true,
      sourceEventId: 9003,
    })
    expect(duplicateLeftAfterCooldown).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.sourceEventId).toBe(9003)
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('You shifted to the left.')

    const switchRightAfterCooldown = feedback.triggerSubjectPositionFeedback('right', {
      allowVisualFeedback: true,
      sourceEventId: 9004,
    })
    expect(switchRightAfterCooldown).toBe(true)
    expect(feedback.subjectResponseState.value).toBe('following_right')
    expect(feedback.lastSubjectResponseEvent.value).toEqual(expect.objectContaining({
      eventType: 'subject_position_right',
      direction: 'right',
      state: 'following_right',
      sourceEventId: 9004,
      gated: false,
      suppressedByQuiet: false,
      summary: 'I noticed you moved right.',
      motion: 'Think',
      expression: 'normal',
      isTransition: false,
      resolvedEventType: 'subject_position_right',
      templateId: 'right-bal-1',
      feedbackChannels: ['ui', 'toast'],
    }))
    expect(toggleExpression).toHaveBeenCalledWith('normal', 1.5)
    unmount()
  })

  it('blocks subject-position response when gate is locked and records gated state', () => {
    const { feedback, unmount } = createFeedbackHarness()

    const previousMotion = { ...currentMotion.value }
    const blocked = feedback.triggerSubjectPositionFeedback('down', {
      gateEnabled: true,
      gateState: 'locked',
      sourceEventId: 9101,
      summary: 'Subject position detected but gated.',
    })

    expect(blocked).toBe(true)
    expect(feedback.subjectResponseState.value).toBe('gated')
    expect(feedback.lastSubjectResponseEvent.value).toEqual(expect.objectContaining({
      eventType: 'subject_gated',
      direction: 'down',
      state: 'gated',
      sourceEventId: 9101,
      gated: true,
      suppressedByQuiet: false,
      summary: 'Subject position detected but gated.',
    }))
    expect(currentMotion.value).toEqual(previousMotion)
    expect(toggleExpression).toHaveBeenCalledTimes(0)
    unmount()
  })

  it('keeps subject-position feedback lightweight during quiet mode', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 10_000,
    })

    const quietTriggered = feedback.triggerVisionPetFeedback('open_palm', {
      allowVisualFeedback: true,
    })
    expect(quietTriggered).toBe(true)
    expect(feedback.petFeedbackState.value).toBe('quiet')
    expect(toggleExpression).toHaveBeenCalledWith('neutral', 1.8)

    toggleExpression.mockClear()
    const quietDirection = feedback.triggerSubjectPositionFeedback('center', {
      allowVisualFeedback: true,
      sourceEventId: 9201,
    })
    expect(quietDirection).toBe(true)
    expect(feedback.subjectResponseState.value).toBe('centered')
    expect(feedback.lastSubjectResponseEvent.value).toEqual(expect.objectContaining({
      eventType: 'subject_position_center',
      direction: 'center',
      state: 'centered',
      sourceEventId: 9201,
      gated: false,
      suppressedByQuiet: true,
      motion: undefined,
      expression: undefined,
      summary: 'Back to center.',
      isTransition: false,
      resolvedEventType: 'subject_position_center',
      templateId: 'center-bal-1',
      feedbackChannels: ['ui', 'toast'],
    }))
    expect(toggleExpression).toHaveBeenCalledTimes(0)
    unmount()
  })

  it('uses contextual cooldown per event type and allows returned events less frequently than direction changes', () => {
    const { feedback, unmount } = createFeedbackHarness({
      feedbackMessageCooldownMs: 5_000,
      subjectReturnedCooldownMs: 10_000,
    })

    const left = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
    })
    expect(left).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_moved_left')
    expect(feedback.nextAllowedFeedbackAt.value).toBe(Date.now() + 5_000)

    const leftInCooldown = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
    })
    expect(leftInCooldown).toBe(false)

    vi.advanceTimersByTime(5_100)
    const leftAfterCooldown = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
    })
    expect(leftAfterCooldown).toBe(true)

    const returned = feedback.triggerContextualVisionFeedback('subject_returned', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(returned).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_returned')
    expect(feedback.nextAllowedFeedbackAt.value).toBe(Date.now() + 10_000)

    const returnedInCooldown = feedback.triggerContextualVisionFeedback('subject_returned', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(returnedInCooldown).toBe(false)
    unmount()
  })

  it('suppresses rapid directional toasts while keeping directional state updates', () => {
    const { feedback, unmount } = createFeedbackHarness({
      directionToastCooldownMs: 2_500,
      feedbackMessageCooldownMs: 300,
    })

    const movedLeft = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
    })
    expect(movedLeft).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBe('I noticed you moved left.')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBe('Think')
    expect(feedback.lastSubjectResponseEvent.value?.state).toBe('following_left')

    const movedRightImmediately = feedback.triggerContextualVisionFeedback('subject_moved_right', {
      allowVisualFeedback: true,
      direction: 'right',
    })
    expect(movedRightImmediately).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_moved_right')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('I noticed you moved right.')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBe('normal')
    expect(feedback.lastSubjectResponseEvent.value?.state).toBe('following_right')

    vi.advanceTimersByTime(2_600)
    const centeredAfterDirectionalToastCooldown = feedback.triggerContextualVisionFeedback('subject_centered', {
      allowVisualFeedback: true,
      direction: 'center',
    })
    expect(centeredAfterDirectionalToastCooldown).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_centered')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBe('Back to center.')
    unmount()
  })

  it('prioritizes returned and matched toasts over noisy directional changes', () => {
    const { feedback, unmount } = createFeedbackHarness({
      directionToastCooldownMs: 2_500,
      feedbackMessageCooldownMs: 300,
      highPriorityToastHoldMs: 3_000,
    })

    const movedLeft = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
      displayName: 'Rin',
    })
    expect(movedLeft).toBe(true)
    expect(feedback.lastFeedbackPriority.value).toBe('low')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBe('Rin, you moved left.')

    const returned = feedback.triggerContextualVisionFeedback('subject_returned', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(returned).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_returned')
    expect(feedback.lastFeedbackPriority.value).toBe('high')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBe('Welcome back, Rin.')
    expect(feedback.lastSubjectResponseEvent.value?.feedbackPriority).toBe('high')

    const movedRightDuringHighPriorityHold = feedback.triggerContextualVisionFeedback('subject_moved_right', {
      allowVisualFeedback: true,
      direction: 'right',
      displayName: 'Rin',
    })
    expect(movedRightDuringHighPriorityHold).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_moved_right')
    expect(feedback.lastFeedbackPriority.value).toBe('low')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin, you moved right.')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()

    const matchedDuringDirectionalNoise = feedback.triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(matchedDuringDirectionalNoise).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_matched')
    expect(feedback.lastFeedbackPriority.value).toBe('high')
    expect(feedback.lastSubjectResponseEvent.value?.feedbackPriority).toBe('high')
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('subject_matched')
    expect(feedback.lastIsTransitionFeedback.value).toBe(false)
    const matchedTemplateTexts = new Set(
      listVisionFeedbackTemplatesForEvent('subject_matched')
        .map(template => template.namedText ?? template.text)
        .map(text => text.replace('{name}', 'Rin')),
    )
    expect(matchedTemplateTexts.has(feedback.lastSubjectResponseEvent.value?.toastMessage ?? '')).toBe(true)
    unmount()
  })

  it('supports feedback intensity levels and persists intensity across composable recreation', () => {
    const { feedback, unmount } = createFeedbackHarness()
    expect(feedback.feedbackIntensity.value).toBe('balanced')

    feedback.setFeedbackIntensity('minimal')
    expect(feedback.feedbackIntensity.value).toBe('minimal')

    const minimalMoved = feedback.triggerContextualVisionFeedback('subject_moved_right', {
      allowVisualFeedback: true,
      direction: 'right',
    })
    expect(minimalMoved).toBe(true)
    expect(feedback.lastFeedbackLevel.value).toBe('subtle')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()

    feedback.setFeedbackIntensity('expressive')
    expect(feedback.feedbackIntensity.value).toBe('expressive')
    expect(localStorage.getItem('airi.vision-experiment.feedback-intensity.v1')).toBe('expressive')
    unmount()

    const secondHarness = createFeedbackHarness()
    expect(secondHarness.feedback.feedbackIntensity.value).toBe('expressive')
    secondHarness.unmount()
  })

  it('handles expression smile-like signal across intensity levels', () => {
    const { feedback, unmount } = createFeedbackHarness()

    feedback.setFeedbackIntensity('minimal')
    const minimalResult = feedback.triggerExpressionSignalFeedback({
      signal: 'smile_like_signal',
      confidence: 0.62,
      reason: 'smile-like face motion',
      source: 'blendshape',
      gateAllowed: true,
      gateEnabled: false,
      gateState: 'disabled',
      presence: 'present',
    })
    expect(minimalResult).toBe(true)
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('expression_smile_like')
    expect(feedback.lastFeedbackLevel.value).toBe('subtle')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()

    vi.advanceTimersByTime(10_100)
    feedback.setFeedbackIntensity('balanced')
    const balancedResult = feedback.triggerExpressionSignalFeedback({
      signal: 'smile_like_signal',
      confidence: 0.68,
      reason: 'smile-like face motion',
      source: 'blendshape',
      gateAllowed: true,
      gateEnabled: false,
      gateState: 'disabled',
      presence: 'present',
      displayName: 'Rin',
    })
    expect(balancedResult).toBe(true)
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('expression_smile_like')
    expect(feedback.lastFeedbackLevel.value).toBe('normal')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBe('Happy')
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBe('smile')
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBe('Rin, I caught a smile-like signal.')

    vi.advanceTimersByTime(10_100)
    feedback.setFeedbackIntensity('expressive')
    const expressiveResult = feedback.triggerExpressionSignalFeedback({
      signal: 'smile_like_signal',
      confidence: 0.72,
      reason: 'smile-like face motion',
      source: 'blendshape',
      gateAllowed: true,
      gateEnabled: false,
      gateState: 'disabled',
      presence: 'present',
      displayName: 'Rin',
    })
    expect(expressiveResult).toBe(true)
    expect(feedback.lastFeedbackLevel.value).toBe('strong')
    expect(feedback.lastSubjectResponseEvent.value?.feedbackChannels).toContain('motion')
    unmount()
  })

  it('blocks expression signal feedback when gate disallows and when multiple subjects are reported', () => {
    const { feedback, unmount } = createFeedbackHarness()

    const blockedByGate = feedback.triggerExpressionSignalFeedback({
      signal: 'stable_face_signal',
      confidence: 0.8,
      reason: 'stable face in frame',
      source: 'position',
      gateAllowed: false,
      gateEnabled: true,
      gateState: 'locked',
      gateProfileStatus: 'multiple_faces',
      presence: 'present',
    })
    expect(blockedByGate).toBe(true)
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('subject_gated')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    expect(feedback.activeBubbleMessage.value).toBe('')

    const blockedByMultipleSubjects = feedback.triggerExpressionSignalFeedback({
      signal: 'smile_like_signal',
      confidence: 0.86,
      reason: 'smile-like face motion',
      source: 'blendshape',
      gateAllowed: true,
      gateEnabled: true,
      gateState: 'enabled',
      gateProfileStatus: 'multiple_faces',
      presence: 'present',
      force: true,
    })

    expect(blockedByMultipleSubjects).toBe(true)
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('subject_gated')
    expect(feedback.lastFeedbackType.value).toBe('subject_gated')
    expect(feedback.lastSubjectResponseEvent.value?.gated).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    expect(feedback.activeBubbleMessage.value).toBe('')
    unmount()
  })

  it('suppresses strong expression signal feedback during quiet mode', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 8_000,
    })

    feedback.triggerVisionPetFeedback('open_palm', { allowVisualFeedback: true })
    expect(feedback.isQuietVisualMode.value).toBe(true)

    const quietExpression = feedback.triggerExpressionSignalFeedback({
      signal: 'stable_face_signal',
      confidence: 0.84,
      reason: 'stable face in frame',
      source: 'position',
      gateAllowed: true,
      gateEnabled: false,
      gateState: 'disabled',
      presence: 'present',
      displayName: 'Rin',
    })
    expect(quietExpression).toBe(true)
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('expression_stable_face')
    expect(feedback.lastSubjectResponseEvent.value?.suppressedByQuiet).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()
    unmount()
  })

  it('suppresses contextual toast and motion while quiet mode is active but keeps UI event state', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 8_000,
    })

    feedback.triggerVisionPetFeedback('open_palm', { allowVisualFeedback: true })
    expect(feedback.isQuietVisualMode.value).toBe(true)

    const returned = feedback.triggerContextualVisionFeedback('subject_returned', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(returned).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_returned')
    expect(feedback.lastFeedbackMessage.value).toBe('Welcome back, Rin.')
    expect(feedback.feedbackSuppressedByQuiet.value).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()
    unmount()
  })

  it('blocks contextual feedback when gate disallows and records gated message only', () => {
    const { feedback, unmount } = createFeedbackHarness()
    const previousMotion = { ...currentMotion.value }

    const gated = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      direction: 'left',
    })

    expect(gated).toBe(true)
    expect(feedback.feedbackBlockedByGate.value).toBe(true)
    expect(feedback.subjectResponseState.value).toBe('gated')
    expect(feedback.lastFeedbackType.value).toBe('subject_gated')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Detected, but feedback is gated.')
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    expect(currentMotion.value).toEqual(previousMotion)
    expect(toggleExpression).toHaveBeenCalledTimes(0)
    unmount()
  })

  it('emits dwell feedback once then respects dwell cooldown', () => {
    const { feedback, unmount } = createFeedbackHarness({
      subjectDwellCooldownMs: 12_000,
    })

    const firstDwell = feedback.triggerContextualVisionFeedback('subject_dwelled_center', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(firstDwell).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_dwelled_center')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin, you held center steadily.')

    const repeatedDwell = feedback.triggerContextualVisionFeedback('subject_dwelled_center', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(repeatedDwell).toBe(false)

    vi.advanceTimersByTime(12_100)
    const dwellAfterCooldown = feedback.triggerContextualVisionFeedback('subject_dwelled_center', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(dwellAfterCooldown).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_dwelled_center')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin, center dwell detected.')
    unmount()
  })

  it('allows contextual feedback when gate is disabled or matched, and blocks when locked', () => {
    const { feedback, unmount } = createFeedbackHarness()

    const allowedWithoutGate = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      gateEnabled: false,
      direction: 'left',
    })
    expect(allowedWithoutGate).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_moved_left')
    expect(feedback.lastSubjectResponseEvent.value?.gated).toBe(false)

    vi.advanceTimersByTime(5_100)
    const allowedWithMatchedGate = feedback.triggerContextualVisionFeedback('subject_moved_right', {
      allowVisualFeedback: true,
      gateEnabled: true,
      gateState: 'enabled',
      direction: 'right',
    })
    expect(allowedWithMatchedGate).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_moved_right')
    expect(feedback.lastSubjectResponseEvent.value?.gated).toBe(false)

    vi.advanceTimersByTime(5_100)
    const blockedWithLockedGate = feedback.triggerContextualVisionFeedback('subject_moved_up', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      direction: 'up',
    })
    expect(blockedWithLockedGate).toBe(true)
    expect(feedback.lastFeedbackType.value).toBe('subject_gated')
    expect(feedback.lastSubjectResponseEvent.value?.gated).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    unmount()
  })

  it('renders transient local bubble for bubble-enabled templates and clears after timeout', () => {
    const { feedback, unmount } = createFeedbackHarness({
      bubbleDurationMs: 4_000,
    })

    feedback.setFeedbackIntensity('expressive')
    const matched = feedback.triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })

    expect(matched).toBe(true)
    expect(feedback.activeBubbleMessage.value).toBe('Great, Rin, match is stable now.')
    expect(feedback.activeBubbleLevel.value).toBe('strong')
    expect(feedback.activeBubbleEventType.value).toBe('subject_matched')
    expect(feedback.activeBubbleTemplateId.value).toBe('matched-exp-1')
    expect(feedback.bubbleRemainingMs.value).toBe(4_000)

    vi.advanceTimersByTime(4_100)
    expect(feedback.activeBubbleMessage.value).toBe('')
    expect(feedback.activeBubbleLevel.value).toBeNull()
    expect(feedback.activeBubbleEventType.value).toBeNull()
    expect(feedback.activeBubbleTemplateId.value).toBeNull()
    unmount()
  })

  it('clears local bubble immediately when clearBubble is called', () => {
    const { feedback, unmount } = createFeedbackHarness({
      bubbleDurationMs: 4_000,
    })

    feedback.setFeedbackIntensity('expressive')
    feedback.triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })

    expect(feedback.activeBubbleMessage.value).toBe('Great, Rin, match is stable now.')
    feedback.clearBubble()
    expect(feedback.activeBubbleMessage.value).toBe('')
    expect(feedback.bubbleRemainingMs.value).toBe(0)
    expect(feedback.activeBubbleTemplateId.value).toBeNull()
    unmount()
  })

  it('suppresses bubble when gate blocks or quiet mode is active', () => {
    const { feedback, unmount } = createFeedbackHarness({
      quietDurationMs: 8_000,
      bubbleDurationMs: 4_000,
    })

    feedback.setFeedbackIntensity('expressive')
    const gateBlocked = feedback.triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      direction: 'center',
      displayName: 'Rin',
    })
    expect(gateBlocked).toBe(true)
    expect(feedback.activeBubbleMessage.value).toBe('')

    feedback.triggerVisionPetFeedback('open_palm', { allowVisualFeedback: true })
    expect(feedback.isQuietVisualMode.value).toBe(true)

    const quietMatched = feedback.triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(quietMatched).toBe(true)
    expect(feedback.activeBubbleMessage.value).toBe('')
    expect(feedback.lastResolvedFeedbackEventType.value).toBe('transition_gated_to_matched')
    expect(feedback.lastFeedbackLevel.value).toBe('strong')
    expect(feedback.lastSubjectResponseEvent.value?.suppressedByQuiet).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.toastMessage).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.motion).toBeUndefined()
    expect(feedback.lastSubjectResponseEvent.value?.expression).toBeUndefined()
    unmount()
  })

  it('applies locale and variant with fallback while keeping deterministic selection', () => {
    const { feedback, unmount } = createFeedbackHarness()

    feedback.setFeedbackLocale('zh-CN')
    feedback.setFeedbackVariant('a')
    const centeredZh = feedback.triggerContextualVisionFeedback('subject_centered', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(centeredZh).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin，你又回到中心位置。')
    expect(feedback.lastFeedbackTemplateId.value).toBe('center-bal-2')

    vi.advanceTimersByTime(5_100)
    feedback.setFeedbackVariant('b')
    const centeredVariantB = feedback.triggerContextualVisionFeedback('subject_centered', {
      allowVisualFeedback: true,
      direction: 'center',
      displayName: 'Rin',
    })
    expect(centeredVariantB).toBe(true)
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin，你回到中心了。')
    expect(feedback.lastFeedbackTemplateId.value).toBe('center-bal-1')

    vi.advanceTimersByTime(5_100)
    feedback.setFeedbackVariant('a')
    const upFallbackDefaultText = feedback.triggerContextualVisionFeedback('subject_moved_up', {
      allowVisualFeedback: true,
      direction: 'up',
      displayName: 'Rin',
    })
    expect(upFallbackDefaultText).toBe(true)
    expect(feedback.lastFeedbackTemplateId.value).toBe('up-bal-1')
    expect(feedback.lastSubjectResponseEvent.value?.summary).toBe('Rin, you moved slightly toward the top of frame.')
    expect(localStorage.getItem('airi.vision-experiment.feedback-locale.v1')).toBe('zh-CN')
    expect(localStorage.getItem('airi.vision-experiment.feedback-variant.v1')).toBe('a')
    unmount()
  })

  it('avoids repeating recent templates during rapid same-event triggers', () => {
    const { feedback, unmount } = createFeedbackHarness({
      feedbackMessageCooldownMs: 0,
      subjectResponseCooldownMs: 0,
      random: () => 0,
    })

    const first = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
      force: true,
    })
    expect(first).toBe(true)
    const firstTemplateId = feedback.lastFeedbackTemplateId.value

    const second = feedback.triggerContextualVisionFeedback('subject_moved_left', {
      allowVisualFeedback: true,
      direction: 'left',
      force: true,
    })
    expect(second).toBe(true)
    const secondTemplateId = feedback.lastFeedbackTemplateId.value

    expect(firstTemplateId).not.toBeNull()
    expect(secondTemplateId).not.toBeNull()
    expect(secondTemplateId).not.toBe(firstTemplateId)

    unmount()
  })
})
