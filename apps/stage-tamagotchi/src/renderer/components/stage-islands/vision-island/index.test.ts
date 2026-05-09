// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import VisionIsland from './index.vue'

const mocks = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  prewarmVisionModels: vi.fn(async () => {}),
  warmupVisionRuntime: vi.fn(async () => {}),
  retryVisionRuntime: vi.fn(async () => {}),
  resetVisionRuntime: vi.fn(async () => {}),
  setFaceGateEnabled: vi.fn(() => {}),
  setGestureControlsEnabled: vi.fn(() => {}),
  setExpressionSignalsEnabled: vi.fn(() => {}),
  setMaxInferenceStallMs: vi.fn(() => {}),
  setRememberFaceProfileOnDevice: vi.fn(async () => true),
  unlockFaceProfile: vi.fn(async () => ({ ok: true as const, profile: null as never })),

  triggerVisionPetFeedback: vi.fn(() => true),
  triggerExpressionSignalFeedback: vi.fn(() => true),
  triggerSubjectPositionFeedback: vi.fn(() => true),
  triggerContextualVisionFeedback: vi.fn(() => true),
  setFeedbackIntensity: vi.fn(() => {}),
  setFeedbackLocale: vi.fn(() => {}),
  setFeedbackVariant: vi.fn(() => {}),
  cancelQuietVisualMode: vi.fn(() => {}),
  clearBubble: vi.fn(() => {}),
  clearPetFeedback: vi.fn(() => {}),

  routerPush: vi.fn(async () => {}),
  toastMessage: vi.fn(() => {}),
  toastSuccess: vi.fn(() => {}),
  toastError: vi.fn(() => {}),

  interactionState: null as any,
  petFeedbackState: null as any,
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
    enableExpressionSignals: ref(false),
    expressionSignal: ref<'none' | 'smile_like_signal' | 'stable_face_signal' | 'looking_away_signal' | 'unclear_face_signal' | 'low_confidence'>('none'),
    expressionSignalCandidate: ref<'none' | 'smile_like_signal' | 'stable_face_signal' | 'looking_away_signal' | 'unclear_face_signal' | 'low_confidence'>('none'),
    stableExpressionSignal: ref<'none' | 'smile_like_signal' | 'stable_face_signal' | 'looking_away_signal' | 'unclear_face_signal' | 'low_confidence'>('none'),
    expressionSignalStableFrames: ref(0),
    expressionSignalConfidence: ref(0),
    expressionSignalReason: ref('Expression signals are disabled.'),
    expressionSignalSource: ref<'blendshape' | 'position' | 'quality' | 'fallback'>('fallback'),
    expressionSignalChangedAt: ref<number | null>(null),
    expressionSignalCooldownUntil: ref(0),
    expressionSignalFeedbackAllowed: ref(false),
    expressionSignalUnavailable: ref(false),
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
      status: ref<'idle' | 'loading' | 'ready' | 'failed' | 'fallback'>('ready'),
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
    start: mocks.start,
    stop: mocks.stop,
    prewarmVisionModels: mocks.prewarmVisionModels,
    warmupVisionRuntime: mocks.warmupVisionRuntime,
    retryVisionRuntime: mocks.retryVisionRuntime,
    resetVisionRuntime: mocks.resetVisionRuntime,
    setFaceGateEnabled: mocks.setFaceGateEnabled,
    setGestureControlsEnabled: mocks.setGestureControlsEnabled,
    setExpressionSignalsEnabled: mocks.setExpressionSignalsEnabled,
    setMaxInferenceStallMs: mocks.setMaxInferenceStallMs,
    setRememberFaceProfileOnDevice: mocks.setRememberFaceProfileOnDevice,
    unlockFaceProfile: mocks.unlockFaceProfile,
  }
}

function createPetFeedbackState() {
  return {
    triggerVisionPetFeedback: mocks.triggerVisionPetFeedback,
    triggerExpressionSignalFeedback: mocks.triggerExpressionSignalFeedback,
    triggerSubjectPositionFeedback: mocks.triggerSubjectPositionFeedback,
    triggerContextualVisionFeedback: mocks.triggerContextualVisionFeedback,
    feedbackIntensity: ref<'minimal' | 'balanced' | 'expressive'>('balanced'),
    setFeedbackIntensity: mocks.setFeedbackIntensity,
    feedbackLocale: ref<'en' | 'zh-CN'>('en'),
    setFeedbackLocale: mocks.setFeedbackLocale,
    feedbackVariant: ref<'default' | 'a' | 'b'>('default'),
    setFeedbackVariant: mocks.setFeedbackVariant,
    lastFeedbackType: ref<string | null>(null),
    lastFeedbackMessage: ref(''),
    lastFeedbackLevel: ref<'subtle' | 'normal' | 'strong'>('subtle'),
    lastFeedbackPriority: ref<'low' | 'normal' | 'high'>('low'),
    lastFeedbackChannels: ref<Array<'ui' | 'toast' | 'bubble' | 'motion'>>([]),
    lastFeedbackTemplateId: ref<string | null>(null),
    lastResolvedFeedbackEventType: ref<string | null>(null),
    lastIsTransitionFeedback: ref(false),
    lastFeedbackAt: ref<number | null>(null),
    nextAllowedFeedbackAt: ref(0),
    nextAllowedFeedbackIn: ref(0),
    feedbackSuppressedByQuiet: ref(false),
    feedbackBlockedByGate: ref(false),
    activeBubbleMessage: ref(''),
    activeBubbleLevel: ref<'subtle' | 'normal' | 'strong' | null>(null),
    activeBubbleEventType: ref<string | null>(null),
    activeBubbleTemplateId: ref<string | null>(null),
    bubbleVisibleUntil: ref(0),
    bubbleRemainingMs: ref(0),
    petFeedbackState: ref<'idle' | 'quiet' | 'celebrating' | 'acknowledged' | 'gated'>('idle'),
    lastPetFeedback: ref<{ summary: string, at: number } | null>(null),
    subjectResponseState: ref<'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'>('idle'),
    lastSubjectResponseEvent: ref<{
      direction: 'left' | 'center' | 'right' | 'up' | 'down'
      state: 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
      at: number
      summary: string
      gated: boolean
      suppressedByQuiet: boolean
    } | null>(null),
    subjectResponseCooldownUntil: ref(0),
    isQuietVisualMode: ref(false),
    quietRemainingMs: ref(0),
    celebrationCount: ref(0),
    cancelQuietVisualMode: mocks.cancelQuietVisualMode,
    clearBubble: mocks.clearBubble,
    clearPetFeedback: mocks.clearPetFeedback,
  }
}

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

vi.mock('../../../composables/use-vision-pet-feedback', () => ({
  useVisionPetFeedback: () => mocks.petFeedbackState,
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
    app,
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function findButton(container: HTMLElement, text: string) {
  const buttons = Array.from(container.querySelectorAll('button'))
  const button = buttons.find(item => item.textContent?.includes(text))
  if (!button)
    throw new Error(`button "${text}" not found`)
  return button
}

async function clickButton(container: HTMLElement, text: string) {
  const button = findButton(container, text)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await Promise.resolve()
  await nextTick()
}

describe('visionIsland UI behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.start.mockReset()
    mocks.stop.mockReset()
    mocks.prewarmVisionModels.mockReset()
    mocks.warmupVisionRuntime.mockReset()
    mocks.retryVisionRuntime.mockReset()
    mocks.resetVisionRuntime.mockReset()
    mocks.setFaceGateEnabled.mockReset()
    mocks.setGestureControlsEnabled.mockReset()
    mocks.setExpressionSignalsEnabled.mockReset()
    mocks.setMaxInferenceStallMs.mockReset()
    mocks.setRememberFaceProfileOnDevice.mockReset()
    mocks.unlockFaceProfile.mockReset()
    mocks.triggerVisionPetFeedback.mockReset()
    mocks.triggerExpressionSignalFeedback.mockReset()
    mocks.triggerSubjectPositionFeedback.mockReset()
    mocks.triggerContextualVisionFeedback.mockReset()
    mocks.setFeedbackIntensity.mockReset()
    mocks.cancelQuietVisualMode.mockReset()
    mocks.clearPetFeedback.mockReset()
    mocks.routerPush.mockReset()
    mocks.toastMessage.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()

    mocks.interactionState = createInteractionState()
    mocks.petFeedbackState = createPetFeedbackState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows default privacy guidance, mapping hints, and camera-off status', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('视觉交互')
    expect(text).toContain('摄像头：关闭')
    expect(text).toContain('Open Palm: quiet Rin visually')
    expect(text).toContain('Victory: trigger Rin celebration')
    expect(text).toContain('Thumbs Up: acknowledge current prompt')
    expect(text).toContain('Advanced / Experimental Gesture Controls')
    expect(text).toContain('gestureEnabled: false')
    expect(text).toContain('Experimental gesture controls are currently disabled.')
    expect(text.includes('candidateGesture:')).toBe(false)
    expect(text).toContain('本地人脸门控')
    expect(text).toContain('摄像头默认关闭。')
    expect(text).toContain('识别仅在本地运行。')
    expect(text).toContain('不会上传任何摄像头数据。')
    expect(text).toContain('Vision Runtime')
    expect(text).toContain('status: idle')
    expect(text).toContain('retryCount: 0')
    expect(text).toContain('Vision Diagnostics')
    expect(text).toContain('runtimeStatus: idle')
    expect(text).toContain('cameraState: off')
    expect(text).toContain('cameraPermission: unknown')
    expect(text).toContain('MediaPipe: idle')
    expect(text).toContain('OpenCV: ready')
    expect(text).toContain('lastError: none')
    expect(text).toContain('Subject-position response')
    expect(text).toContain('subjectPosition: unknown')
    expect(text).toContain('stableSubjectPosition: unknown')
    expect(text).toContain('subjectResponseState: idle')
    expect(text).toContain('subjectResponseGate: allowed')
    expect(text).toContain('Feedback intensity:')
    expect(text).toContain('Expression Signal')
    expect(text).toContain('Enable Expression Signals')
    expect(text).toContain('expressionSignal: none')
    expect(text).toContain('Expression signals are local visual cues, not emotion detection.')
    expect(text).toContain('No expression data is uploaded.')
    expect(text).toContain('lastFeedbackType: none')
    expect(text).toContain('lastFeedbackMessage: none')
    expect(text).toContain('feedbackPriority: low')
    expect(text).toContain('This is gaze-like feedback, not strict gaze measurement.')
    expect(text.includes('eye tracking')).toBe(false)
    expect(text.includes('Emotion Recognition')).toBe(false)
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(1_200)
    await Promise.resolve()
    await nextTick()
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledWith({
      background: true,
      includeOpenCv: false,
    })

    unmount()
  })

  it('wires camera, runtime actions, and enrollment routing to composable handlers', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    await clickButton(container, '开启摄像头')
    expect(mocks.start).toHaveBeenCalledTimes(1)

    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    await nextTick()

    await clickButton(container, '关闭摄像头')
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    await clickButton(container, '预加载/重试 Runtime')
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.warmupVisionRuntime).toHaveBeenLastCalledWith({
      background: true,
      includeOpenCv: false,
    })
    expect(mocks.toastMessage).toHaveBeenCalledWith('Vision runtime warmup queued for idle background.')
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledTimes(0)

    await clickButton(container, 'Retry Runtime')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)

    await clickButton(container, 'Reset Runtime')
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)

    await clickButton(container, '打开人脸录入页')
    expect(mocks.routerPush).toHaveBeenCalledWith('/vision-enrollment')

    unmount()
  })

  it('toggles experimental gesture controls and shows diagnostics only when enabled', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    expect(container.textContent ?? '').toContain('gestureEnabled: false')
    expect(container.textContent ?? '').not.toContain('gestureQualityState:')

    const gestureToggle = container.querySelector('input[type="checkbox"]')
    if (!gestureToggle) {
      throw new Error('experimental gesture toggle not found')
    }(gestureToggle as HTMLInputElement).checked = true
    gestureToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setGestureControlsEnabled).toHaveBeenCalledTimes(1)
    expect(mocks.setGestureControlsEnabled).toHaveBeenCalledWith(true)

    mocks.interactionState.gestureControlsEnabled.value = true
    mocks.interactionState.candidateGesture.value = 'victory'
    mocks.interactionState.stableGesture.value = 'victory'
    mocks.interactionState.gestureState.value = 'stable'
    mocks.interactionState.gestureConfidence.value = 0.83
    mocks.interactionState.gestureVoteCount.value = 7
    mocks.interactionState.gestureVoteWindowSize.value = 10
    mocks.interactionState.geometryPassRate.value = 0.8
    mocks.interactionState.gestureQualityState.value = 'good'
    mocks.interactionState.handSizeRatio.value = 0.032
    mocks.interactionState.handInsideGuideArea.value = true
    mocks.interactionState.holdProgressMs.value = 420
    mocks.interactionState.holdDurationMs.value = 500
    mocks.interactionState.cooldownRemainingMs.value = 2600
    mocks.interactionState.releaseRequired.value = true
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('gestureEnabled: true')
    expect(text).toContain('candidateGesture: victory')
    expect(text).toContain('stableGesture: victory')
    expect(text).toContain('gestureState: stable')
    expect(text).toContain('gestureVotes: 7/10')
    expect(text).toContain('gestureQualityState: good')
    expect(text).toContain('releaseRequired: true')
    expect(text).toContain('Move your hand closer.')
    expect(text).toContain('Keep your hand inside the guide area.')
    expect(text).toContain('Hold the gesture steady.')
    expect(text).toContain('Release your hand to trigger again.')
    expect(text).toContain('Better lighting may help.')
    expect(text.includes('eye tracking')).toBe(false)

    ;(gestureToggle as HTMLInputElement).checked = false
    gestureToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setGestureControlsEnabled).toHaveBeenCalledWith(false)

    unmount()
  })

  it('toggles expression signals and renders expression diagnostics in panel', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    const expressionToggle = container.querySelector('[data-testid="expression-signal-toggle"]') as HTMLInputElement | null
    if (!expressionToggle)
      throw new Error('expression signal toggle not found')

    expressionToggle.checked = true
    expressionToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setExpressionSignalsEnabled).toHaveBeenCalledTimes(1)
    expect(mocks.setExpressionSignalsEnabled).toHaveBeenCalledWith(true)

    mocks.interactionState.enableExpressionSignals.value = true
    mocks.interactionState.expressionSignal.value = 'smile_like_signal'
    mocks.interactionState.expressionSignalCandidate.value = 'smile_like_signal'
    mocks.interactionState.stableExpressionSignal.value = 'smile_like_signal'
    mocks.interactionState.expressionSignalStableFrames.value = 5
    mocks.interactionState.expressionSignalConfidence.value = 0.58
    mocks.interactionState.expressionSignalReason.value = 'smile-like face motion'
    mocks.interactionState.expressionSignalSource.value = 'blendshape'
    mocks.interactionState.expressionSignalFeedbackAllowed.value = true
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('expressionSignal: smile_like_signal')
    expect(text).toContain('stableExpressionSignal: smile_like_signal')
    expect(text).toContain('confidence: 0.58')
    expect(text).toContain('reason: smile-like face motion')
    expect(text).toContain('source: blendshape')
    expect(text).toContain('feedbackAllowed: yes')
    expect(text.includes('Emotion Recognition')).toBe(false)

    expressionToggle.checked = false
    expressionToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setExpressionSignalsEnabled).toHaveBeenCalledWith(false)

    unmount()
  })

  it('routes expression signal events to expression feedback trigger with gate-safe options', async () => {
    const { unmount } = mountVisionIsland()
    await nextTick()

    mocks.interactionState.expressionSignalConfidence.value = 0.51
    mocks.interactionState.expressionSignalReason.value = 'smile-like face motion'
    mocks.interactionState.expressionSignalSource.value = 'blendshape'
    mocks.interactionState.expressionSignalFeedbackAllowed.value = true
    mocks.interactionState.lastEvent.value = {
      id: 9901,
      type: 'expression_smile_like_detected',
      message: 'Smile-like signal detected.',
      at: Date.now(),
    }
    await nextTick()

    expect(mocks.triggerExpressionSignalFeedback).toHaveBeenCalledTimes(1)
    expect(mocks.triggerExpressionSignalFeedback).toHaveBeenCalledWith(expect.objectContaining({
      signal: 'smile_like_signal',
      confidence: 0.51,
      reason: 'smile-like face motion',
      source: 'blendshape',
      gateAllowed: true,
      sourceEventId: 9901,
    }))

    unmount()
  })

  it('renders pet feedback and gate status changes deterministically', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'
    mocks.interactionState.canTriggerInteractiveFeedback.value = false
    mocks.interactionState.canTriggerSubjectPositionResponse.value = false
    mocks.interactionState.profileStatus.value = 'encrypted'
    mocks.interactionState.cameraPermissionState.value = 'denied'
    mocks.interactionState.mediaPipeStatus.value = 'failed'
    mocks.interactionState.openCvFaceQuality.status.value = 'fallback'
    mocks.interactionState.openCvFaceQuality.errorMessage.value = 'OpenCV initialization failed'
    mocks.interactionState.errorMessage.value = 'Vision prewarm failed'
    mocks.interactionState.lastEvent.value = {
      id: 71,
      type: 'detected_but_gated',
      message: 'Victory detected but gated',
      at: Date.now(),
    }
    mocks.petFeedbackState.petFeedbackState.value = 'quiet'
    mocks.petFeedbackState.isQuietVisualMode.value = true
    mocks.petFeedbackState.quietRemainingMs.value = 4_500
    mocks.petFeedbackState.celebrationCount.value = 3
    mocks.petFeedbackState.lastPetFeedback.value = {
      summary: 'Quiet visual mode activated.',
      at: Date.now(),
    }
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('门控状态：锁定')
    expect(text).toContain('交互结果：拦截')
    expect(text).toContain('Current pet state: quiet')
    expect(text).toContain('Quiet remaining seconds: 5')
    expect(text).toContain('Celebration count: 3')
    expect(text).toContain('Gesture detected but pet feedback gated.')
    expect(text).toContain('cameraPermission: denied')
    expect(text).toContain('MediaPipe: failed')
    expect(text).toContain('OpenCV: fallback')
    expect(text).toContain('faceGate: locked / multiple_faces')
    expect(text).toContain('lastError: Vision prewarm failed')
    expect(text).toContain('subjectResponseGate: gated')
    expect(mocks.triggerVisionPetFeedback).toHaveBeenCalledWith('gated', expect.objectContaining({
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      sourceEventId: 71,
    }))

    unmount()
  })

  it('routes stable subject-position events to subject response feedback handler', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    mocks.triggerContextualVisionFeedback.mockClear()
    mocks.interactionState.lastEvent.value = {
      id: 901,
      type: 'user_moved_left',
      message: 'I noticed you moved left.',
      at: Date.now(),
      subjectPosition: 'left',
    }
    await nextTick()

    expect(mocks.triggerContextualVisionFeedback).toHaveBeenCalledTimes(1)
    expect(mocks.triggerContextualVisionFeedback).toHaveBeenCalledWith('subject_moved_left', expect.objectContaining({
      allowVisualFeedback: true,
      gateEnabled: false,
      gateState: 'disabled',
      sourceEventId: 901,
      direction: 'left',
    }))

    mocks.triggerContextualVisionFeedback.mockClear()
    mocks.interactionState.lastEvent.value = {
      id: 902,
      type: 'subject_position_gated',
      message: 'Subject position detected but gated.',
      at: Date.now(),
      subjectPosition: 'right',
    }
    await nextTick()

    expect(mocks.triggerContextualVisionFeedback).toHaveBeenCalledTimes(1)
    expect(mocks.triggerContextualVisionFeedback).toHaveBeenCalledWith('subject_gated', expect.objectContaining({
      allowVisualFeedback: false,
      sourceEventId: 902,
      direction: 'right',
    }))

    expect(container.textContent ?? '').toContain('Subject-position response')
    unmount()
  })

  it('updates feedback intensity via select and renders contextual feedback diagnostics', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    const intensitySelect = container.querySelector('[data-testid="feedback-intensity-select"]') as HTMLSelectElement | null
    if (!intensitySelect)
      throw new Error('feedback intensity select not found')

    intensitySelect.value = 'expressive'
    intensitySelect.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setFeedbackIntensity).toHaveBeenCalledTimes(1)
    expect(mocks.setFeedbackIntensity).toHaveBeenCalledWith('expressive')

    mocks.petFeedbackState.lastFeedbackType.value = 'subject_moved_right'
    mocks.petFeedbackState.lastFeedbackMessage.value = 'Right side detected.'
    mocks.petFeedbackState.lastFeedbackLevel.value = 'normal'
    mocks.petFeedbackState.lastFeedbackPriority.value = 'low'
    mocks.petFeedbackState.feedbackSuppressedByQuiet.value = true
    mocks.petFeedbackState.feedbackBlockedByGate.value = false
    mocks.petFeedbackState.nextAllowedFeedbackIn.value = 2_400
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('lastFeedbackType: subject_moved_right')
    expect(text).toContain('lastFeedbackMessage: Right side detected.')
    expect(text).toContain('feedbackLevel: normal')
    expect(text).toContain('feedbackPriority: low')
    expect(text).toContain('quietSuppressed: yes')
    expect(text).toContain('gateBlocked: no')

    unmount()
  })

  it('updates locale and variant selectors and shows local bubble when active', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    const localeSelect = container.querySelector('[data-testid="feedback-locale-select"]') as HTMLSelectElement | null
    const variantSelect = container.querySelector('[data-testid="feedback-variant-select"]') as HTMLSelectElement | null
    if (!localeSelect || !variantSelect)
      throw new Error('locale or variant select not found')

    localeSelect.value = 'zh-CN'
    localeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    variantSelect.value = 'b'
    variantSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setFeedbackLocale).toHaveBeenCalledTimes(1)
    expect(mocks.setFeedbackLocale).toHaveBeenCalledWith('zh-CN')
    expect(mocks.setFeedbackVariant).toHaveBeenCalledTimes(1)
    expect(mocks.setFeedbackVariant).toHaveBeenCalledWith('b')

    mocks.petFeedbackState.activeBubbleMessage.value = '欢迎回来。'
    mocks.petFeedbackState.activeBubbleLevel.value = 'normal'
    mocks.petFeedbackState.activeBubbleEventType.value = 'transition_absent_to_returned'
    mocks.petFeedbackState.activeBubbleTemplateId.value = 't-absent-returned-1'
    mocks.petFeedbackState.bubbleVisibleUntil.value = Date.now() + 4_000
    mocks.petFeedbackState.bubbleRemainingMs.value = 4_000
    await nextTick()

    const bubble = container.querySelector('[data-testid="vision-feedback-bubble"]')
    expect(bubble).not.toBeNull()
    expect(bubble?.textContent ?? '').toContain('Rin: 欢迎回来。')

    const text = container.textContent ?? ''
    expect(text).toContain('Bubble feedback is local to the vision experiment.')
    expect(text).toContain('Locale changes only local feedback templates.')
    expect(text.includes('eye tracking')).toBe(false)

    mocks.petFeedbackState.activeBubbleMessage.value = ''
    mocks.petFeedbackState.bubbleRemainingMs.value = 0
    await nextTick()
    expect(container.querySelector('[data-testid="vision-feedback-bubble"]')).toBeNull()
    unmount()
  })

  it('keeps critical guidance visible after runtime retry failure and reset flow', async () => {
    mocks.retryVisionRuntime.mockRejectedValueOnce(new Error('runtime retry failed in test'))
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    await clickButton(container, 'Retry Runtime')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledWith('Vision runtime retry failed.')

    await clickButton(container, 'Reset Runtime')
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.toastMessage).toHaveBeenCalledWith('Vision runtime reset complete.')

    const text = container.textContent ?? ''
    expect(text).toContain('Open Palm: quiet Rin visually')
    expect(text).toContain('Victory: trigger Rin celebration')
    expect(text).toContain('Thumbs Up: acknowledge current prompt')
    expect(text).toContain('摄像头默认关闭。')
    expect(text).toContain('识别仅在本地运行。')
    expect(text).toContain('不会上传任何摄像头数据。')
    expect(text).toContain('Vision Diagnostics')
    expect(text).toContain('Vision Runtime')

    unmount()
  })

  it('uses branch-specific camera toggle actions without double-triggering start', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    await clickButton(container, '开启摄像头')
    expect(mocks.start).toHaveBeenCalledTimes(1)
    expect(mocks.stop).toHaveBeenCalledTimes(0)

    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    await nextTick()

    await clickButton(container, '关闭摄像头')
    expect(mocks.stop).toHaveBeenCalledTimes(1)
    expect(mocks.start).toHaveBeenCalledTimes(1)

    const text = container.textContent ?? ''
    expect(text).toContain('Vision Runtime')
    expect(text).toContain('Vision Diagnostics')
    unmount()
  })

  it('does not emit pet feedback for non-gesture/non-direction events', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    mocks.triggerVisionPetFeedback.mockClear()
    mocks.interactionState.lastEvent.value = {
      id: 802,
      type: 'face_gate_enrolled',
      message: 'Face profile enrolled locally.',
      at: Date.now(),
    }
    await nextTick()

    expect(mocks.triggerVisionPetFeedback).toHaveBeenCalledTimes(0)
    const text = container.textContent ?? ''
    expect(text).toContain('Face profile enrolled locally.')
    expect(text).toContain('Vision Diagnostics')
    unmount()
  })
})
