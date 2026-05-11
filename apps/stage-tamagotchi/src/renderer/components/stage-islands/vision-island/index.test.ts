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
    feedbackLocale: ref<'en' | 'zh-CN'>('zh-CN'),
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

function mountVisionIsland(uiMode: 'novice' | 'expert' = 'expert') {
  const host = defineComponent({
    setup() {
      return () => h(VisionIsland, { embedded: true, uiMode })
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

async function openAdvancedDiagnostics(container: HTMLElement) {
  const toggle = container.querySelector('[data-testid="advanced-diagnostics-toggle"]') as HTMLButtonElement | null
  if (!toggle)
    throw new Error('advanced diagnostics toggle not found')
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await Promise.resolve()
  await nextTick()
}

describe('visionIsland presentation layer (mocked composables)', () => {
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

  it('keeps novice mode focused and hides advanced diagnostics entry', async () => {
    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('视觉交互')
    expect(text).toContain('开启摄像头')
    expect(text).toContain('打开人脸录入页')
    expect(text).toContain('运行状态')
    expect(text).toContain('摄像头：未开启')
    expect(text).toContain('人脸门控：未启用')
    expect(text).toContain('匹配状态：未录入')
    expect(text).toContain('本地人脸门控')
    expect(text).toContain('主体位置反馈')
    expect(text).toContain('当前主体位置：未知')
    expect(text).toContain('稳定主体位置：未知')
    expect(text).toContain('位置反馈状态：空闲')
    expect(text).toContain('位置反馈权限：已允许')
    expect(text).toContain('反馈强度：')
    expect(text).toContain('最新气泡：无')
    expect(text).toContain('面部动作信号')
    expect(text).toContain('启用面部动作信号')
    expect(text).toContain('面部动作信号：关闭')
    expect(text).toContain('当前信号：无')
    expect(text).toContain('面部动作信号只是本地视觉线索，不是情绪识别。')
    expect(text).toContain('不会上传任何面部动作数据。')
    expect(text).toContain('最近反馈文案：无')
    expect(text).toContain('这是基于主体位置的类视线反馈，不是严格视线测量。')
    expect(text.includes('展开 Advanced / Diagnostics')).toBe(false)
    expect(container.querySelector('[data-testid="advanced-diagnostics-toggle"]')).toBeNull()
    expect(text.includes('cameraState')).toBe(false)
    expect(text.includes('facePresence')).toBe(false)
    expect(text.includes('faceDirection')).toBe(false)
    expect(text.includes('faceGate:')).toBe(false)
    expect(text.includes('matchStatus')).toBe(false)
    expect(text.includes('interactiveFeedback')).toBe(false)
    expect(text.includes('subjectResponseState')).toBe(false)
    expect(text.includes('petSubjectResponseState')).toBe(false)
    expect(text.includes('looking_away_signal')).toBe(false)
    expect(text).toContain('摄像头默认关闭。')
    expect(text).toContain('识别仅在本地运行。')
    expect(text).toContain('不会上传任何摄像头数据。')
    expect(text.includes('Vision Runtime')).toBe(false)
    expect(text.includes('Vision Diagnostics')).toBe(false)
    expect(text.includes('feedbackTemplateId:')).toBe(false)
    expect(text.includes('feedbackChannels:')).toBe(false)
    expect(text.includes('cooldownRemainingSec:')).toBe(false)
    expect(text.includes('gestureQualityState:')).toBe(false)
    expect(text.includes('expressionSignalCandidate:')).toBe(false)
    expect(text.includes('eye tracking')).toBe(false)
    expect(text.includes('Emotion Recognition')).toBe(false)
    expect(container.querySelector('[data-testid="vision-recovery-panel"]')).toBeNull()
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

  it('shows advanced diagnostics entry in expert mode', async () => {
    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    const advancedToggle = container.querySelector('[data-testid="advanced-diagnostics-toggle"]') as HTMLButtonElement | null
    expect(advancedToggle).not.toBeNull()
    expect(advancedToggle?.textContent).toContain('展开 Advanced / Diagnostics')

    unmount()
  })

  it('renders recovery guidance with actionable handlers for camera, runtime, and gate issues', async () => {
    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    mocks.interactionState.cameraPermissionState.value = 'denied'
    mocks.interactionState.cameraState.value = 'error'
    await nextTick()

    expect((container.textContent ?? '').includes('摄像头暂不可用')).toBe(true)
    const retryCameraButton = container.querySelector('[data-testid="vision-recovery-action-retry-camera"]') as HTMLButtonElement | null
    const openSettingsButton = container.querySelector('[data-testid="vision-recovery-action-open-settings"]') as HTMLButtonElement | null
    expect(retryCameraButton).not.toBeNull()
    expect(openSettingsButton).not.toBeNull()
    retryCameraButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.start).toHaveBeenCalledTimes(1)
    openSettingsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.routerPush).toHaveBeenCalledWith('/settings')

    mocks.interactionState.cameraPermissionState.value = 'granted'
    mocks.interactionState.cameraState.value = 'active'
    mocks.interactionState.runtimeStatus.value = 'failed'
    mocks.interactionState.runtimeLastError.value = 'runtime exploded'
    await nextTick()

    expect((container.textContent ?? '').includes('视觉运行时需要恢复')).toBe(true)
    const retryRuntimeButton = container.querySelector('[data-testid="vision-recovery-action-retry-runtime"]') as HTMLButtonElement | null
    const resetRuntimeButton = container.querySelector('[data-testid="vision-recovery-action-reset-runtime"]') as HTMLButtonElement | null
    expect(retryRuntimeButton).not.toBeNull()
    expect(resetRuntimeButton).not.toBeNull()
    retryRuntimeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => {
      expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)
    })
    await nextTick()
    await Promise.resolve()
    resetRuntimeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await vi.waitFor(() => {
      expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)
    })
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)

    mocks.interactionState.runtimeStatus.value = 'ready'
    mocks.interactionState.runtimeLastError.value = ''
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.profileStatus.value = 'no_face'
    await nextTick()

    expect((container.textContent ?? '').includes('反馈被门控拦截')).toBe(true)
    const openEnrollmentButton = container.querySelector('[data-testid="vision-recovery-action-open-enrollment"]') as HTMLButtonElement | null
    expect(openEnrollmentButton).not.toBeNull()
    openEnrollmentButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.routerPush).toHaveBeenCalledWith('/vision-enrollment')

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

    await openAdvancedDiagnostics(container)
    await clickButton(container, '预加载/重试 Runtime')
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.warmupVisionRuntime).toHaveBeenLastCalledWith({
      background: true,
      includeOpenCv: false,
    })
    expect(mocks.toastMessage).toHaveBeenCalledWith('视觉运行时预热已加入后台队列。')
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

  it('keeps gesture diagnostics collapsed by default and only shows them after explicit expand', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    expect(container.textContent ?? '').not.toContain('Advanced / Experimental Gesture Controls')
    expect(container.textContent ?? '').not.toContain('gestureEnabled:')
    expect(container.textContent ?? '').not.toContain('gestureQualityState:')

    await openAdvancedDiagnostics(container)
    expect(container.textContent ?? '').toContain('Advanced / Experimental Gesture Controls')
    expect(container.textContent ?? '').toContain('gestureEnabled: false')
    expect(container.textContent ?? '').toContain('Gesture diagnostics are collapsed by default.')
    expect(container.textContent ?? '').not.toContain('gestureQualityState:')

    const gestureToggle = container.querySelector('[data-testid="gesture-controls-toggle"]') as HTMLInputElement | null
    if (!gestureToggle) {
      throw new Error('experimental gesture toggle not found')
    }
    gestureToggle.checked = true
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

    await clickButton(container, 'Show gesture diagnostics')
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

    gestureToggle.checked = false
    gestureToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setGestureControlsEnabled).toHaveBeenCalledWith(false)

    unmount()
  })

  it('shows lightweight expression signal state by default and raw diagnostics only in advanced', async () => {
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

    const lightweightText = container.textContent ?? ''
    expect(lightweightText).toContain('面部动作信号：开启')
    expect(lightweightText).toContain('当前信号：类微笑信号')
    expect(lightweightText).not.toContain('expressionSignalCandidate:')
    expect(lightweightText).not.toContain('置信度：0.58')
    expect(lightweightText.includes('Emotion Recognition')).toBe(false)

    await openAdvancedDiagnostics(container)
    await clickButton(container, '展开信号诊断')
    const diagnosticsText = container.textContent ?? ''
    expect(diagnosticsText).toContain('面部动作信号：类微笑信号')
    expect(diagnosticsText).toContain('稳定信号：类微笑信号')
    expect(diagnosticsText).toContain('置信度：0.58')
    expect(diagnosticsText).toContain('原因：smile-like face motion')
    expect(diagnosticsText).toContain('来源：Blendshape')
    expect(diagnosticsText).toContain('反馈放行：是')

    expressionToggle.checked = false
    expressionToggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setExpressionSignalsEnabled).toHaveBeenCalledWith(false)

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

    const coreText = container.textContent ?? ''
    expect(coreText).toContain('最近反馈文案：Right side detected.')
    expect(coreText.includes('lastFeedbackType: subject_moved_right')).toBe(false)

    await openAdvancedDiagnostics(container)
    const text = container.textContent ?? ''
    expect(text).toContain('lastFeedbackType: subject_moved_right')
    expect(text).toContain('feedbackLevel: normal')
    expect(text).toContain('feedbackPriority: low')
    expect(text).toContain('quietSuppressed: yes')
    expect(text).toContain('gateBlocked: no')

    unmount()
  })

  it('updates locale and variant selectors and shows local bubble when active', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    await openAdvancedDiagnostics(container)
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
    expect(text).toContain('最新气泡：欢迎回来。')
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

    await openAdvancedDiagnostics(container)
    await clickButton(container, 'Retry Runtime')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledWith('视觉运行时重试失败。')

    await clickButton(container, 'Reset Runtime')
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)
    expect(mocks.toastMessage).toHaveBeenCalledWith('视觉运行时重置完成。')

    const text = container.textContent ?? ''
    expect(text).toContain('Advanced / Diagnostics')
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
    expect(text.includes('Vision Runtime')).toBe(false)
    expect(text.includes('Vision Diagnostics')).toBe(false)

    await openAdvancedDiagnostics(container)
    const diagnosticsText = container.textContent ?? ''
    expect(diagnosticsText).toContain('Vision Runtime')
    expect(diagnosticsText).toContain('Vision Diagnostics')
    unmount()
  })
})
