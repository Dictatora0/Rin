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
    lastGesture: ref<'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'>('none'),
    lastEvent: ref<{
      id: number
      type: string
      message: string
      at: number
      toastMessage?: string
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
}) {
  mocks.interactionState.lastEvent.value = {
    ...event,
    at: event.at ?? Date.now(),
  }
  await nextTick()
}

describe('vision Island pet feedback integration path', () => {
  beforeEach(() => {
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
