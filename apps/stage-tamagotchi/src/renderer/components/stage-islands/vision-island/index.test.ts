// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import VisionIsland from './index.vue'

const mocks = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  warmupVisionRuntime: vi.fn(async () => {}),
  retryVisionRuntime: vi.fn(async () => {}),
  resetVisionRuntime: vi.fn(async () => {}),
  setFaceGateEnabled: vi.fn(() => {}),
  setGestureControlsEnabled: vi.fn(() => {}),
  setExpressionSignalsEnabled: vi.fn(() => {}),
  calibrateSubjectNeutralCenter: vi.fn(() => ({ ok: true as const, center: { x: 0.5, y: 0.5 } })),
  resetSubjectNeutralCenter: vi.fn(() => {}),
  setMaxInferenceStallMs: vi.fn(() => {}),
  setRememberFaceProfileOnDevice: vi.fn(async () => true),
  unlockFaceProfile: vi.fn(async () => ({ ok: true as const, profile: null as never })),

  triggerVisionPetFeedback: vi.fn(() => true),
  triggerExpressionSignalFeedback: vi.fn(() => true),
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
    subjectNeutralCenter: ref<{ x: number, y: number } | null>(null),
    subjectNeutralCenterUpdatedAt: ref<string | null>(null),
    directionScores: ref({
      dx: 0,
      dy: 0,
      scoreX: 0,
      scoreY: 0,
      confidence: 0,
      dominantAxis: 'none' as const,
      ambiguous: false,
    }),
    directionDistribution: ref({
      windowMs: 60_000,
      total: 0,
      center: 0,
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      ambiguous: 0,
    }),
    faceDirection: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    subjectPosition: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    lastStableSubjectPosition: ref<'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'>('unknown'),
    subjectPositionChangedAt: ref<number | null>(null),
    subjectResponseState: ref<'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'>('idle'),
    lastSubjectResponseEvent: ref<{ direction: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown', state: 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated', at: number, message: string, gated: boolean } | null>(null),
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
    lastEvent: ref<{ id: number, type: string, message: string, at: number, toastMessage?: string, subjectPosition?: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown' } | null>(null),
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
      latestQuality: ref<{ accepted: boolean, qualityScore: number } | null>(null),
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
    warmupVisionRuntime: mocks.warmupVisionRuntime,
    retryVisionRuntime: mocks.retryVisionRuntime,
    resetVisionRuntime: mocks.resetVisionRuntime,
    setFaceGateEnabled: mocks.setFaceGateEnabled,
    setGestureControlsEnabled: mocks.setGestureControlsEnabled,
    setExpressionSignalsEnabled: mocks.setExpressionSignalsEnabled,
    calibrateSubjectNeutralCenter: mocks.calibrateSubjectNeutralCenter,
    resetSubjectNeutralCenter: mocks.resetSubjectNeutralCenter,
    setMaxInferenceStallMs: mocks.setMaxInferenceStallMs,
    setRememberFaceProfileOnDevice: mocks.setRememberFaceProfileOnDevice,
    unlockFaceProfile: mocks.unlockFaceProfile,
  }
}

function createPetFeedbackState() {
  return {
    triggerVisionPetFeedback: mocks.triggerVisionPetFeedback,
    triggerExpressionSignalFeedback: mocks.triggerExpressionSignalFeedback,
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
    lastSubjectResponseEvent: ref<{ direction: 'left' | 'center' | 'right' | 'up' | 'down', state: 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated', at: number, summary: string, gated: boolean, suppressedByQuiet: boolean } | null>(null),
    subjectResponseCooldownUntil: ref(0),
    isQuietVisualMode: ref(false),
    quietRemainingMs: ref(0),
    celebrationCount: ref(0),
    cancelQuietVisualMode: mocks.cancelQuietVisualMode,
    clearBubble: mocks.clearBubble,
    visionFeedbackHistory: ref<Array<{
      id: string
      at: string
      source: 'subject-position' | 'face-gate' | 'expression-signal' | 'system'
      message: string
      level: 'subtle' | 'normal' | 'strong'
      eventType: string
      resolvedEventType?: string
    }>>([]),
    recentVisionFeedbackHistory: ref<Array<{
      id: string
      at: string
      source: 'subject-position' | 'face-gate' | 'expression-signal' | 'system'
      message: string
      level: 'subtle' | 'normal' | 'strong'
      eventType: string
      resolvedEventType?: string
    }>>([]),
    clearVisionFeedbackHistory: vi.fn(() => {}),
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

function mountVisionIsland(
  uiMode: 'novice' | 'expert' = 'novice',
  options: { onCameraRunningChange?: (running: boolean) => void } = {},
) {
  const host = defineComponent({
    setup() {
      return () => h(VisionIsland, {
        embedded: true,
        uiMode,
        onCameraRunningChange: options.onCameraRunningChange,
      })
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

async function openAdvancedDiagnostics(container: HTMLElement) {
  const toggle = container.querySelector('[data-testid="advanced-diagnostics-toggle"]') as HTMLButtonElement | null
  if (!toggle)
    throw new Error('advanced diagnostics toggle not found')
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await Promise.resolve()
  await nextTick()
}

async function clickButton(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(item => item.textContent?.includes(text))
  if (!button)
    throw new Error(`button ${text} not found`)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await Promise.resolve()
  await nextTick()
}

describe('vision island usability pass', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.start.mockReset()
    mocks.stop.mockReset()
    mocks.warmupVisionRuntime.mockReset()
    mocks.retryVisionRuntime.mockReset()
    mocks.resetVisionRuntime.mockReset()
    mocks.setFaceGateEnabled.mockReset()
    mocks.setGestureControlsEnabled.mockReset()
    mocks.setExpressionSignalsEnabled.mockReset()
    mocks.calibrateSubjectNeutralCenter.mockReset()
    mocks.calibrateSubjectNeutralCenter.mockReturnValue({ ok: true, center: { x: 0.5, y: 0.5 } })
    mocks.resetSubjectNeutralCenter.mockReset()
    mocks.setMaxInferenceStallMs.mockReset()
    mocks.setRememberFaceProfileOnDevice.mockReset()
    mocks.unlockFaceProfile.mockReset()
    mocks.triggerVisionPetFeedback.mockReset()
    mocks.triggerExpressionSignalFeedback.mockReset()
    mocks.triggerContextualVisionFeedback.mockReset()
    mocks.setFeedbackIntensity.mockReset()
    mocks.setFeedbackLocale.mockReset()
    mocks.setFeedbackVariant.mockReset()
    mocks.cancelQuietVisualMode.mockReset()
    mocks.clearBubble.mockReset()
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

  it('shows simplified default panel with core status and controls', async () => {
    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('视觉交互')
    expect(text).toContain('开启摄像头')
    expect(text).toContain('打开人脸录入页')
    expect(text).toContain('摄像头：未开启')
    expect(text).toContain('主体状态：未知')
    expect(text).toContain('人脸门控：未启用')
    expect(text).toContain('最近反馈')
    expect(text).toContain('为什么 Rin 没响应？')
    expect(text).toContain('视觉自检')
    expect(text).toContain('主体位置校准')
    expect(text).toContain('当前基准：默认中心')

    unmount()
  })

  it('does not render raw debug keys in default view', async () => {
    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text.includes('cameraState')).toBe(false)
    expect(text.includes('faceGate')).toBe(false)
    expect(text.includes('looking_away_signal')).toBe(false)
    expect(text.includes('templateId')).toBe(false)
    expect(text.includes('channels')).toBe(false)
    expect(text.includes('variant')).toBe(false)
    expect(text.toLowerCase().includes('gaze')).toBe(false)
    expect(text.toLowerCase().includes('eye tracking')).toBe(false)
    expect(text.toLowerCase().includes('look down')).toBe(false)

    unmount()
  })

  it('calibrates subject neutral center and shows toast feedback', async () => {
    mocks.interactionState.faceCenter.value = { x: 0.55, y: 0.62 }
    mocks.interactionState.subjectNeutralCenter.value = { x: 0.55, y: 0.62 }
    mocks.interactionState.subjectNeutralCenterUpdatedAt.value = '2026-05-13T08:00:00.000Z'

    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    await clickButton(container, '校准当前坐姿')
    expect(mocks.calibrateSubjectNeutralCenter).toHaveBeenCalledTimes(1)
    expect(mocks.toastSuccess).toHaveBeenCalledWith('已校准当前坐姿。')

    const text = container.textContent ?? ''
    expect(text).toContain('当前基准：已校准')
    expect(text).toContain('基准坐标：x=0.55, y=0.62')

    unmount()
  })

  it('shows warning when calibrating without detected face', async () => {
    mocks.interactionState.faceCenter.value = null
    mocks.calibrateSubjectNeutralCenter.mockImplementationOnce(() => ({ ok: false, reason: 'no face' } as any))

    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    await clickButton(container, '校准当前坐姿')
    expect(mocks.calibrateSubjectNeutralCenter).toHaveBeenCalledTimes(1)
    expect(mocks.toastMessage).toHaveBeenCalledWith('请先让摄像头检测到你。')

    unmount()
  })

  it('avoids fixed viewport height class in embedded mode and keeps root unconstrained', async () => {
    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    const root = container.querySelector('[data-testid="vision-island-root"]') as HTMLElement | null
    if (!root)
      throw new Error('vision island root not found')

    expect(root.className.includes('max-h-[68vh]')).toBe(false)
    expect(root.style.maxHeight).toBe('')

    unmount()
  })

  it('shows diagnostics fields only after expanding advanced panel', async () => {
    mocks.interactionState.facePresence.value = 'present'
    mocks.interactionState.faceCenter.value = { x: 0.32, y: 0.61 }
    mocks.interactionState.subjectPosition.value = 'left'
    mocks.interactionState.lastStableSubjectPosition.value = 'left'
    mocks.interactionState.subjectResponseState.value = 'following_left'
    mocks.interactionState.lastSubjectResponseEvent.value = {
      direction: 'left',
      state: 'following_left',
      at: Date.now(),
      message: '向左跟随',
      gated: false,
    }
    mocks.petFeedbackState.lastFeedbackTemplateId.value = 'template-1'
    mocks.petFeedbackState.lastFeedbackChannels.value = ['bubble', 'ui']
    mocks.petFeedbackState.nextAllowedFeedbackIn.value = 2500
    mocks.interactionState.expressionSignalConfidence.value = 0.73
    mocks.interactionState.expressionSignalSource.value = 'blendshape'
    mocks.interactionState.expressionSignalReason.value = 'smile-like signal'
    mocks.interactionState.directionDistribution.value = {
      windowMs: 60_000,
      total: 24,
      center: 8,
      left: 5,
      right: 4,
      up: 3,
      down: 2,
      ambiguous: 2,
    }

    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    const defaultText = container.textContent ?? ''
    expect(defaultText.includes('主体中心')).toBe(false)
    expect(defaultText.includes('模板 ID')).toBe(false)
    expect(defaultText.includes('反馈通道')).toBe(false)

    await openAdvancedDiagnostics(container)
    await clickButton(container, '展开信号诊断')

    const diagnosticsText = container.textContent ?? ''
    expect(diagnosticsText).toContain('主体中心')
    expect(diagnosticsText).toContain('当前主体位置')
    expect(diagnosticsText).toContain('稳定主体位置')
    expect(diagnosticsText).toContain('位置反馈状态')
    expect(diagnosticsText).toContain('最近位置事件')
    expect(diagnosticsText).toContain('模板 ID')
    expect(diagnosticsText).toContain('反馈通道')
    expect(diagnosticsText).toContain('反馈冷却')
    expect(diagnosticsText).toContain('信号置信度')
    expect(diagnosticsText).toContain('信号来源')
    expect(diagnosticsText).toContain('信号原因')
    expect(diagnosticsText).toContain('最近方向分布')
    expect(diagnosticsText).toContain('居中 8 / 偏左 5 / 偏右 4 / 偏上 3 / 偏下 2 / 不确定 2')

    unmount()
  })

  it('shows no_face recovery guidance with natural language', async () => {
    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.profileStatus.value = 'no_face'

    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('Rin 暂时没有响应')
    expect(text).toContain('请让面部出现在画面中。')

    unmount()
  })

  it('shows multiple_faces recovery guidance with specific suggestion', async () => {
    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'

    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('检测到多人入镜，请确保画面中只有你一人。')

    unmount()
  })

  it('shows locked and unmatched recovery guidance with actionable enrollment hint', async () => {
    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'unmatched'
    mocks.interactionState.hasEncryptedProfile.value = true
    mocks.interactionState.isProfileUnlocked.value = false

    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    let text = container.textContent ?? ''
    expect(text).toContain('当前不是已录入用户，Rin 不会响应主体反馈。')
    await clickButton(container, '打开人脸录入')
    expect(mocks.routerPush).toHaveBeenCalledWith('/vision-enrollment')

    mocks.interactionState.localFaceGate.gateState.value = 'gated'
    mocks.interactionState.localFaceGate.profileStatus.value = 'unmatched'
    mocks.interactionState.hasEncryptedProfile.value = false
    mocks.interactionState.isProfileUnlocked.value = true
    await nextTick()
    text = container.textContent ?? ''
    expect(text).toContain('当前不是已录入用户，Rin 不会响应主体反馈。')

    unmount()
  })

  it('shows camera off guidance and lets user trigger camera start', async () => {
    mocks.interactionState.cameraState.value = 'off'
    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('请先开启摄像头。')
    await clickButton(container, '开启摄像头')
    expect(mocks.start).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('shows runtime failed guidance with retry action', async () => {
    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    mocks.interactionState.runtimeStatus.value = 'failed'
    mocks.interactionState.runtimeLastError.value = 'runtime exploded'

    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('视觉运行环境初始化失败，请重试视觉运行环境。')
    await clickButton(container, '重试视觉运行环境')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('expands self-check report with actionable items', async () => {
    mocks.interactionState.cameraState.value = 'off'
    const { container, unmount } = mountVisionIsland('novice')
    await nextTick()

    await clickButton(container, '开始自检')
    const text = container.textContent ?? ''
    expect(text).toContain('Rin 暂时不会响应，需要处理')
    expect(text).toContain('请先开启摄像头。')
    expect(text).toContain('开启摄像头')

    unmount()
  })

  it('renders feedback history and supports clear action', async () => {
    const now = new Date('2026-05-13T08:30:00.000Z').toISOString()
    const entry = {
      id: 'h-1',
      at: now,
      source: 'subject-position' as const,
      message: '你回到画面中心',
      level: 'normal' as const,
      eventType: 'subject_centered',
      resolvedEventType: 'subject_position_center',
    }
    mocks.petFeedbackState.visionFeedbackHistory.value = [entry]
    mocks.petFeedbackState.recentVisionFeedbackHistory.value = [entry]

    const { container, unmount } = mountVisionIsland('expert')
    await nextTick()

    let text = container.textContent ?? ''
    expect(text).toContain('最近反馈')
    expect(text).toContain('你回到画面中心')
    expect(text).toContain('清空历史')

    await clickButton(container, '清空历史')
    expect(mocks.petFeedbackState.clearVisionFeedbackHistory).toHaveBeenCalledTimes(1)

    mocks.petFeedbackState.visionFeedbackHistory.value = []
    mocks.petFeedbackState.recentVisionFeedbackHistory.value = []
    await nextTick()
    text = container.textContent ?? ''
    expect(text).toContain('暂无反馈记录')

    unmount()
  })

  it('emits camera running status for floating panel entry indicator', async () => {
    const cameraRunningChanges: boolean[] = []
    mocks.interactionState.isEnabled.value = false
    mocks.interactionState.cameraState.value = 'off'

    const { unmount } = mountVisionIsland('novice', {
      onCameraRunningChange: running => cameraRunningChanges.push(running),
    })
    await nextTick()

    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    await nextTick()

    mocks.interactionState.cameraState.value = 'off'
    await nextTick()

    expect(cameraRunningChanges).toEqual([false, true, false])

    unmount()
  })
})
