// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import VisionIsland from './index.vue'

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(async () => {}),
  toastMessage: vi.fn(() => {}),
  toastSuccess: vi.fn(() => {}),
  toastError: vi.fn(() => {}),
  interactionState: null as unknown as ReturnType<typeof createInteractionState>,
  stageModelRenderer: null as unknown as { value: 'live2d' | 'vrm' | 'godot' },
  currentMotion: null as unknown as { value: { group: string, index?: number } },
  availableMotions: null as unknown as { value: Array<{ motionName: string, motionIndex?: number }> },
  expressionState: {
    modelId: 'vision-live2d-model',
    expressionGroups: new Map<string, number>(),
    expressions: new Map<string, number>(),
  },
  toggleExpression: vi.fn((name: string, durationSeconds: number) => ({ success: true, name, durationSeconds })),
}))

function createInteractionState() {
  const localFaceGate = {
    gateState: ref<'disabled' | 'enabled' | 'gated' | 'locked'>('disabled'),
    profileStatus: ref<'not_enrolled' | 'enrolling' | 'enrolled' | 'matching' | 'matched' | 'unmatched' | 'uncertain' | 'multiple_faces' | 'no_face'>('not_enrolled'),
    matchScore: ref<number | null>(null),
  }

  return {
    isEnabled: ref(false),
    cameraState: ref<'off' | 'loading' | 'active' | 'error'>('off'),
    cameraPermissionState: ref<'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('unknown'),
    mediaPipeStatus: ref<'idle' | 'loading' | 'ready' | 'failed'>('idle'),
    facePresence: ref<'present' | 'absent' | 'unknown'>('unknown'),
    faceCenter: ref<{ x: number, y: number } | null>(null),
    faceDirection: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    subjectPosition: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    lastStableSubjectPosition: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    subjectPositionChangedAt: ref<number | null>(null),
    subjectResponseState: ref<'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'>('idle'),
    lastSubjectResponseEvent: ref<{
      direction: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
      state: 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
      at: number
      message: string
      gated: boolean
    } | null>(null),
    subjectResponseCooldownUntil: ref(0),
    lastGesture: ref<'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'>('none'),
    gestureControlsEnabled: ref(false),
    candidateGesture: ref<'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'>('none'),
    stableGesture: ref<'none' | 'open_palm' | 'victory' | 'thumbs_up'>('none'),
    gestureState: ref<'idle' | 'candidate' | 'stable' | 'armed' | 'triggered' | 'cooldown' | 'waiting_release'>('idle'),
    gestureConfidence: ref(0),
    gestureVoteCount: ref(0),
    gestureVoteWindowSize: ref(10),
    geometryPassRate: ref(0),
    gestureQualityState: ref<'good' | 'too_far' | 'out_of_frame' | 'too_fast' | 'low_confidence' | 'unknown'>('unknown'),
    handSizeRatio: ref(0),
    handInsideGuideArea: ref(false),
    holdProgressMs: ref(0),
    holdDurationMs: ref(0),
    cooldownRemainingMs: ref(0),
    releaseRequired: ref(false),
    lastEvent: ref<{
      id: number
      type: string
      message: string
      at: number
      toastMessage?: string
      subjectPosition?: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
    } | null>(null),
    errorMessage: ref(''),
    quietRemainingMs: ref(0),
    isVisionQuiet: ref(false),
    localCelebrationCount: ref(0),
    activePrompt: ref(''),
    matchedDisplayName: ref(''),
    gateEnabled: ref(false),
    hasEncryptedProfile: ref(false),
    isProfileUnlocked: ref(false),
    profileStatus: ref<'none' | 'encrypted' | 'unlocked'>('none'),
    rememberFaceProfileOnDevice: ref(false),
    secureStoreAvailable: ref(true),
    localFaceGate,
    openCvFaceQuality: {
      status: ref<'loading' | 'ready' | 'failed' | 'fallback'>('ready'),
      errorMessage: ref(''),
    },
    canTriggerInteractiveFeedback: ref(true),
    canTriggerSubjectPositionResponse: ref(true),
    maxInferenceStallMs: ref(1_200),
    lastInferenceAt: ref<number | null>(null),
    modelWarmupStatus: ref<'idle' | 'warming' | 'ready' | 'fallback_remote'>('idle'),
    modelSource: ref<'local' | 'remote' | 'unknown'>('unknown'),
    modelProfile: ref('MediaPipe 官方 float16 v1（本地与远程同规格）'),
    runtimeStatus: ref<'idle' | 'warming' | 'ready' | 'partial_ready' | 'failed' | 'resetting'>('idle'),
    runtimeWarmupDurationMs: ref<number | null>(null),
    runtimeRetryCount: ref(0),
    runtimeLastError: ref(''),
    startTiming: ref({
      startedAt: null,
      finishedAt: null,
      totalMs: null,
      readyForPreviewMs: null,
      permissionMs: null,
      videoPlayMs: null,
      recognizerInitMs: null,
      recognizerSource: 'unknown' as const,
    }),
    attachVideoElement: vi.fn(() => {}),
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    prewarmVisionModels: vi.fn(async () => {}),
    warmupVisionRuntime: vi.fn(async () => {}),
    retryVisionRuntime: vi.fn(async () => {}),
    resetVisionRuntime: vi.fn(async () => {}),
    setFaceGateEnabled: vi.fn(() => {}),
    setGestureControlsEnabled: vi.fn(() => {}),
    setMaxInferenceStallMs: vi.fn(() => {}),
    setRememberFaceProfileOnDevice: vi.fn(async () => true),
    unlockFaceProfile: vi.fn(async () => ({ ok: true as const, profile: null as never })),
  }
}

function resetLive2dState() {
  mocks.stageModelRenderer.value = 'live2d'
  mocks.currentMotion.value = { group: 'Idle' }
  mocks.availableMotions.value = [
    { motionName: 'Idle', motionIndex: 0 },
    { motionName: 'Tap', motionIndex: 0 },
    { motionName: 'Tap@Body', motionIndex: 0 },
    { motionName: 'Flick', motionIndex: 0 },
    { motionName: 'Think', motionIndex: 0 },
    { motionName: 'Neutral', motionIndex: 0 },
    { motionName: 'Happy', motionIndex: 0 },
  ]
  mocks.expressionState.modelId = 'vision-live2d-model'
  mocks.expressionState.expressionGroups = new Map([
    ['neutral', 0],
    ['normal', 0],
    ['happy', 0],
    ['smile', 0],
  ])
  mocks.expressionState.expressions = new Map([
    ['smile', 0],
    ['normal', 0],
  ])
  mocks.toggleExpression.mockReset()
  mocks.toggleExpression.mockReturnValue({ success: true, name: 'neutral', durationSeconds: 1.8 })
}

const LEFT_POSITION_MESSAGES = [
  'I noticed you moved left.',
  'You shifted to the left.',
  'Left side detected.',
  'You are leaning left now.',
  'Left position confirmed.',
]

const GATED_POSITION_MESSAGES = [
  'Detected, but feedback is gated.',
  'Position detected, gate is blocking.',
  'Gate lock: no active feedback.',
  'Feedback paused by face gate.',
]

vi.mock('pinia', () => ({
  storeToRefs: <T extends Record<string, unknown>>(store: T) => store,
}))

vi.mock('@proj-airi/stage-ui/stores/settings', () => ({
  useSettings: () => ({
    stageModelRenderer: mocks.stageModelRenderer,
  }),
}))

vi.mock('@proj-airi/stage-ui-live2d', () => ({
  EmotionHappyMotionName: 'Happy',
  EmotionNeutralMotionName: 'Neutral',
  EmotionThinkMotionName: 'Think',
  useLive2d: () => ({
    currentMotion: mocks.currentMotion,
    availableMotions: mocks.availableMotions,
  }),
  useExpressionStore: () => ({
    modelId: mocks.expressionState.modelId,
    expressionGroups: mocks.expressionState.expressionGroups,
    expressions: mocks.expressionState.expressions,
    toggle: mocks.toggleExpression,
  }),
}))

vi.mock('@proj-airi/ui', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    Button: defineComponent({
      name: 'Button',
      emits: ['click'],
      inheritAttrs: false,
      setup(_, { attrs, emit, slots }) {
        return () => h('button', {
          type: 'button',
          ...(attrs as Record<string, unknown>),
          onClick: (event: MouseEvent) => emit('click', event),
        }, slots.default?.())
      },
    }),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('vue-sonner', () => ({
  toast: {
    message: mocks.toastMessage,
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock('../../../composables/use-vision-interaction', () => ({
  useVisionInteraction: () => mocks.interactionState,
}))

function mountVisionIsland() {
  const host = defineComponent({
    setup() {
      return () => h(VisionIsland, { embedded: true })
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)
  return {
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

async function emitVisionEvent(event: {
  id: number
  type: string
  message: string
  at?: number
  toastMessage?: string
  subjectPosition?: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
}) {
  mocks.interactionState.lastEvent.value = {
    ...event,
    at: event.at ?? Date.now(),
  }
  await nextTick()
}

describe('vision Island pet feedback integration path', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    localStorage.clear()
    mocks.stageModelRenderer = ref<'live2d' | 'vrm' | 'godot'>('live2d')
    mocks.currentMotion = ref<{ group: string, index?: number }>({ group: 'Idle' })
    mocks.availableMotions = ref<Array<{ motionName: string, motionIndex?: number }>>([])
    mocks.routerPush.mockReset()
    mocks.toastMessage.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()
    resetLive2dState()
    mocks.interactionState = createInteractionState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps open_palm event to quiet feedback with neutral/idle reaction', async () => {
    const { container, unmount } = mountVisionIsland()
    await emitVisionEvent({
      id: 1,
      type: 'quiet_mode_requested',
      message: 'Quiet mode requested',
    })

    expect(mocks.currentMotion.value.group).toBe('Idle')
    expect(mocks.toggleExpression).toHaveBeenCalledWith('neutral', 1.8)
    expect(container.textContent).toContain('Current pet state: quiet')

    unmount()
  })

  it('maps victory event to celebration feedback with happy fallback motion/expression', async () => {
    const { container, unmount } = mountVisionIsland()
    await emitVisionEvent({
      id: 2,
      type: 'completion_celebration',
      message: 'Completion celebration',
    })

    expect(mocks.currentMotion.value.group).toBe('Tap@Body')
    expect(mocks.toggleExpression).toHaveBeenCalledWith('happy', 3)
    expect(container.textContent).toContain('Current pet state: celebrating')
    expect(container.textContent).toContain('Celebration count: 1')

    unmount()
  })

  it('maps thumbs_up acknowledge event to lightweight feedback', async () => {
    const { container, unmount } = mountVisionIsland()
    await emitVisionEvent({
      id: 3,
      type: 'acknowledged',
      message: 'Acknowledged',
    })

    expect(mocks.currentMotion.value.group).toBe('Tap')
    expect(mocks.toggleExpression).toHaveBeenCalledWith('smile', 2)
    expect(container.textContent).toContain('Current pet state: acknowledged')

    unmount()
  })

  it('blocks motion/expression when gate reports detected_but_gated', async () => {
    const { container, unmount } = mountVisionIsland()
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'
    mocks.interactionState.canTriggerInteractiveFeedback.value = false

    await emitVisionEvent({
      id: 4,
      type: 'detected_but_gated',
      message: 'Victory detected but gated',
    })

    expect(mocks.currentMotion.value.group).toBe('Idle')
    expect(mocks.toggleExpression).toHaveBeenCalledTimes(0)
    expect(container.textContent).toContain('Current pet state: gated')
    expect(container.textContent).toContain('Gesture detected but pet feedback gated.')

    unmount()
  })

  it('maps subject-position event to gaze-like feedback motion/expression path', async () => {
    const { container, unmount } = mountVisionIsland()

    await emitVisionEvent({
      id: 41,
      type: 'user_moved_left',
      message: 'I noticed you moved left.',
      subjectPosition: 'left',
    })

    expect(mocks.currentMotion.value.group).toBe('Think')
    expect(mocks.toggleExpression).toHaveBeenCalledWith('normal', 1.4)
    expect(container.textContent).toContain('petSubjectResponseState: following_left')
    expect(container.textContent).toContain('lastFeedbackType: subject_moved_left')
    const hasAllowedLeftMessage = LEFT_POSITION_MESSAGES.some((message) => {
      return container.textContent?.includes(`lastFeedbackMessage: ${message}`) ?? false
    })
    expect(hasAllowedLeftMessage).toBe(true)

    await emitVisionEvent({
      id: 42,
      type: 'user_centered',
      message: 'Back to center.',
      subjectPosition: 'center',
    })

    expect(mocks.currentMotion.value.group).toBe('Think')
    expect(mocks.toggleExpression).toHaveBeenCalledWith('smile', 1.4)
    expect(container.textContent).toContain('petSubjectResponseState: centered')

    unmount()
  })

  it('keeps subject-position response gated when face gate blocks matched subject', async () => {
    const { container, unmount } = mountVisionIsland()
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'
    mocks.interactionState.canTriggerInteractiveFeedback.value = false
    mocks.interactionState.canTriggerSubjectPositionResponse.value = false

    await emitVisionEvent({
      id: 43,
      type: 'subject_position_gated',
      message: 'Subject position detected but gated.',
      subjectPosition: 'right',
    })

    expect(mocks.currentMotion.value.group).toBe('Idle')
    expect(mocks.toggleExpression).toHaveBeenCalledTimes(0)
    expect(container.textContent).toContain('subjectResponseGate: gated')
    expect(container.textContent).toContain('petSubjectResponseState: gated')
    expect(container.textContent).toContain('lastFeedbackType: subject_gated')
    const hasAllowedGatedMessage = GATED_POSITION_MESSAGES.some((message) => {
      return container.textContent?.includes(`lastFeedbackMessage: ${message}`) ?? false
    })
    expect(hasAllowedGatedMessage).toBe(true)

    unmount()
  })

  it('falls back safely when motion/expression are unavailable and keeps running', async () => {
    const { container, unmount } = mountVisionIsland()
    mocks.availableMotions.value = []
    mocks.expressionState.expressionGroups.clear()
    mocks.expressionState.expressions.clear()

    await emitVisionEvent({
      id: 5,
      type: 'completion_celebration',
      message: 'Completion celebration',
    })

    expect(mocks.currentMotion.value.group).toBe('Idle')
    expect(mocks.toggleExpression).toHaveBeenCalledTimes(0)
    expect(container.textContent).toContain('Current pet state: celebrating')
    expect(container.textContent).toContain('Celebration count: 1')

    unmount()
  })

  it('suppresses strong celebration while quiet state is active', async () => {
    const { container, unmount } = mountVisionIsland()
    await emitVisionEvent({
      id: 6,
      type: 'quiet_mode_requested',
      message: 'Quiet mode requested',
    })
    await emitVisionEvent({
      id: 7,
      type: 'completion_celebration',
      message: 'Completion celebration',
    })

    expect(container.textContent).toContain('Current pet state: quiet')
    expect(container.textContent).toContain('Celebration count: 0')
    expect(container.textContent).toContain('Quiet visual mode active, celebration motion suppressed.')

    unmount()
  })
})
