// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import VisionEnrollmentPage from './index.vue'

const mocks = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  warmupVisionRuntime: vi.fn(async () => {}),
  retryVisionRuntime: vi.fn(async () => {}),
  resetVisionRuntime: vi.fn(async () => {}),
  setDisplayName: vi.fn(() => {}),
  setFaceGateEnabled: vi.fn((_: boolean) => {}),
  enrollLocalFaceProfile: vi.fn(async () => ({ ok: false as const, reason: 'camera inactive' })),
  unlockFaceProfile: vi.fn(async () => ({ ok: false as const, reason: 'unable to unlock' })),
  lockFaceProfile: vi.fn(() => {}),
  deleteLocalFaceProfile: vi.fn(() => {}),
  setRememberFaceProfileOnDevice: vi.fn(async () => true),
  attachVideoElement: vi.fn(() => {}),
  routerPush: vi.fn(async () => {}),
  toastMessage: vi.fn(() => {}),
  toastSuccess: vi.fn(() => {}),
  toastError: vi.fn(() => {}),
  interactionState: null as any,
}))

function createInteractionState() {
  const gateEnabled = ref(true)
  const hasEncryptedProfile = ref(true)
  const displayName = ref('Alice')
  const profileStatus = ref<'none' | 'encrypted' | 'unlocked'>('unlocked')
  const localFaceGate = {
    gateState: ref<'disabled' | 'enabled' | 'gated' | 'locked'>('enabled'),
    profileStatus: ref<'not_enrolled' | 'enrolling' | 'enrolled' | 'matching' | 'matched' | 'unmatched' | 'uncertain' | 'multiple_faces' | 'no_face'>('matched'),
    profileSampleCount: ref(6),
    threshold: ref(0.42),
    qualityThreshold: ref(0.45),
    stableFrames: ref(3),
    matchScore: ref(0.18),
    setThreshold: vi.fn((value: number) => {
      localFaceGate.threshold.value = value
    }),
    setQualityThreshold: vi.fn((value: number) => {
      localFaceGate.qualityThreshold.value = value
    }),
    setStableFrames: vi.fn((value: number) => {
      localFaceGate.stableFrames.value = value
    }),
  }

  const encryptedProfile = {
    status: profileStatus,
    unlockedProfile: ref<{
      displayName: string
      createdAt: string
      updatedAt: string
    } | null>({
      displayName: 'Alice',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    }),
    errorMessage: ref(''),
  }

  const interactionState = {
    isEnabled: ref(false),
    cameraState: ref<'off' | 'loading' | 'active' | 'error'>('off'),
    cameraPermissionState: ref<'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt'),
    mediaPipeStatus: ref<'idle' | 'loading' | 'ready' | 'failed'>('ready'),
    runtimeStatus: ref<'idle' | 'warming' | 'ready' | 'partial_ready' | 'failed' | 'resetting'>('partial_ready'),
    runtimeWarmupDurationMs: ref<number | null>(1200),
    runtimeRetryCount: ref(2),
    runtimeLastError: ref('MediaPipe warmup timed out'),
    errorMessage: ref(''),
    displayName,
    profileStatus,
    gateEnabled,
    hasEncryptedProfile,
    rememberFaceProfileOnDevice: ref(false),
    secureStoreAvailable: ref(true),
    localFaceGate,
    openCvFaceQuality: {
      latestQuality: ref({
        accepted: true,
        reason: undefined,
        qualityScore: 0.93,
        brightness: 132,
        sharpness: 34,
        contrast: 39,
        faceSize: 0.24,
      }),
      status: ref<'idle' | 'loading' | 'ready' | 'failed' | 'fallback'>('ready'),
      errorMessage: ref(''),
    },
    encryptedProfile,
    cameraDiagnostics: ref({
      trackEndedCount: 1,
      unexpectedTrackEndedCount: 0,
      lastTrackEndedAt: null,
      lastTrackEndedTrackId: null,
      lastTrackEndedTrackLabel: null,
      lastTrackEndedIntentional: null,
      inferenceErrorCount: 3,
      consecutiveInferenceErrorCount: 1,
      lastInferenceErrorAt: null,
      lastInferenceErrorMessage: '',
    }),
    attachVideoElement: mocks.attachVideoElement,
    start: mocks.start,
    stop: mocks.stop,
    warmupVisionRuntime: mocks.warmupVisionRuntime,
    retryVisionRuntime: mocks.retryVisionRuntime,
    resetVisionRuntime: mocks.resetVisionRuntime,
    setDisplayName: mocks.setDisplayName,
    setFaceGateEnabled: mocks.setFaceGateEnabled,
    enrollLocalFaceProfile: mocks.enrollLocalFaceProfile,
    unlockFaceProfile: mocks.unlockFaceProfile,
    lockFaceProfile: mocks.lockFaceProfile,
    deleteLocalFaceProfile: mocks.deleteLocalFaceProfile,
    setRememberFaceProfileOnDevice: mocks.setRememberFaceProfileOnDevice,
  }

  mocks.setFaceGateEnabled.mockImplementation((enabled: boolean) => {
    gateEnabled.value = enabled
    localFaceGate.gateState.value = enabled ? 'enabled' : 'disabled'
  })

  mocks.deleteLocalFaceProfile.mockImplementation(() => {
    hasEncryptedProfile.value = false
    profileStatus.value = 'none'
    encryptedProfile.unlockedProfile.value = null
    localFaceGate.profileSampleCount.value = 0
    localFaceGate.profileStatus.value = 'not_enrolled'
  })

  return interactionState
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

vi.mock('@proj-airi/stage-ui/components', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    LocalPrivacyCard: defineComponent({
      name: 'LocalPrivacyCard',
      props: {
        title: { type: String, default: 'Local-first vision and privacy' },
      },
      setup(props) {
        return () => h('section', { 'data-testid': 'local-privacy-card' }, props.title)
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

vi.mock('../../composables/use-vision-interaction', () => ({
  useVisionInteraction: () => mocks.interactionState,
}))

function mountPage() {
  const host = defineComponent({
    setup() {
      return () => h(VisionEnrollmentPage)
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

async function openDetails(container: HTMLElement, selector: string) {
  const details = container.querySelector(selector) as HTMLDetailsElement | null
  if (!details)
    throw new Error(`details "${selector}" missing`)
  details.open = true
  details.dispatchEvent(new Event('toggle', { bubbles: true }))
  await nextTick()
  return details
}

describe('vision enrollment page information architecture', () => {
  beforeEach(() => {
    mocks.start.mockReset()
    mocks.stop.mockReset()
    mocks.warmupVisionRuntime.mockReset()
    mocks.retryVisionRuntime.mockReset()
    mocks.resetVisionRuntime.mockReset()
    mocks.setDisplayName.mockReset()
    mocks.setFaceGateEnabled.mockReset()
    mocks.enrollLocalFaceProfile.mockReset()
    mocks.unlockFaceProfile.mockReset()
    mocks.lockFaceProfile.mockReset()
    mocks.deleteLocalFaceProfile.mockReset()
    mocks.setRememberFaceProfileOnDevice.mockReset()
    mocks.attachVideoElement.mockReset()
    mocks.routerPush.mockReset()
    mocks.toastMessage.mockReset()
    mocks.toastSuccess.mockReset()
    mocks.toastError.mockReset()

    mocks.interactionState = createInteractionState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders guided enrollment structure and keeps diagnostics hidden by default', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('人脸录入与门控')
    expect(text).toContain('Rin Vision Privacy')
    expect(text).toContain('当前状态')
    expect(text).toContain('四步录入向导')
    expect(text).toContain('步骤 1 / 4：开启摄像头')
    expect(text).toContain('步骤 2 / 4：设置本地档案')
    expect(text).toContain('步骤 3 / 4：采集人脸样本')
    expect(text).toContain('步骤 4 / 4：完成并启用')
    expect(text).toContain('采样进度：0 / 6')

    expect(text).toContain('人脸门控已配置')
    expect(text).toContain('昵称：Alice')
    expect(text).toContain('样本数量：6')
    expect(text).toContain('档案状态：已解锁')
    expect(text).toContain('门控状态：已启用')

    expect(text).toContain('高级录入参数')
    expect(text).toContain('诊断详情')
    expect(text).not.toContain('匹配阈值')
    expect(text).not.toContain('质量阈值')
    expect(text).not.toContain('目标采样数')
    expect(text).not.toContain('稳定判定帧数')

    expect(text).not.toContain('runtimeStatus')
    expect(text).not.toContain('runtimeWarmup')
    expect(text).not.toContain('retryCount')
    expect(text).not.toContain('MediaPipe：')
    expect(text).not.toContain('OpenCV：')
    expect(text).not.toContain('摄像头诊断日志')
    expect(text).not.toContain('轨道结束次数')
    expect(text).not.toContain('识别异常总数')
    expect(text).not.toContain('亮度：')
    expect(text).not.toContain('清晰度：')
    expect(text).not.toContain('对比度：')
    expect(text).not.toContain('人脸尺寸：')

    expect(text).not.toContain('First startup may take a moment')
    expect(text).not.toContain('Models are reused after warmup')
    expect(text).not.toContain('Stop Camera releases camera only')
    expect(text).not.toContain('Retry Runtime')
    expect(text).not.toContain('Reset Runtime')
    expect(text).not.toContain('Vision Diagnostics')

    unmount()
  })

  it('shows camera permission recovery path and enrollment retry guidance', async () => {
    mocks.interactionState.cameraPermissionState.value = 'denied'
    mocks.interactionState.cameraState.value = 'error'
    mocks.interactionState.localFaceGate.profileStatus.value = 'no_face'
    mocks.enrollLocalFaceProfile.mockResolvedValue({ ok: false as const, reason: 'low quality' })

    const { container, unmount } = mountPage()
    await nextTick()

    expect(container.textContent).toContain('macOS 还没有给 Rin 摄像头权限。请到 系统设置 > 隐私与安全性 > 摄像头，为 Rin 打开权限后回到这里重试。')

    await clickButton(container, '继续采样')
    await nextTick()

    expect(container.textContent).toContain('恢复建议：样本质量不足，请调整光线或姿态后重试。建议保持正脸、补充光线，并在单人入镜时重新采样。')

    unmount()
  })

  it('expands advanced parameters section and shows enrollment tuning fields', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    await openDetails(container, '[data-testid="advanced-enrollment-details"]')

    const text = container.textContent ?? ''
    expect(text).toContain('匹配阈值')
    expect(text).toContain('质量阈值')
    expect(text).toContain('目标采样数')
    expect(text).toContain('稳定判定帧数')

    unmount()
  })

  it('expands diagnostics section and keeps runtime actions available', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    await openDetails(container, '[data-testid="diagnostics-details"]')

    const text = container.textContent ?? ''
    expect(text).toContain('视觉运行状态（runtimeStatus）')
    expect(text).toContain('MediaPipe：')
    expect(text).toContain('OpenCV：')
    expect(text).toContain('摄像头诊断日志')
    expect(text).toContain('轨道结束次数：1')
    expect(text).toContain('识别异常总数：3')

    await clickButton(container, '重试视觉运行环境')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)

    await clickButton(container, '重置视觉运行环境')
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('keeps delete action in danger zone with confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container, unmount } = mountPage()
    await nextTick()

    const dangerCard = Array.from(container.querySelectorAll('section'))
      .find(section => section.textContent?.includes('危险操作'))
    if (!dangerCard)
      throw new Error('danger zone missing')

    expect(dangerCard.textContent).toContain('删除档案')
    expect(dangerCard.textContent).toContain('重新录入')
    expect(dangerCard.textContent).toContain('锁定档案')

    await clickButton(container, '删除档案')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledWith('确认删除本地加密人脸档案？删除后需重新录入。')
    expect(mocks.deleteLocalFaceProfile).toHaveBeenCalledTimes(1)
    expect(mocks.setFaceGateEnabled).toHaveBeenCalledWith(false)

    const text = container.textContent ?? ''
    expect(text).toContain('档案已清除。')

    unmount()
  })

  it('does not delete profile when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { container, unmount } = mountPage()
    await nextTick()

    await clickButton(container, '删除档案')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mocks.deleteLocalFaceProfile).toHaveBeenCalledTimes(0)
    expect(mocks.setFaceGateEnabled).toHaveBeenCalledTimes(0)

    unmount()
  })

  it('keeps unlock failure behavior unchanged in configured profile area', async () => {
    mocks.unlockFaceProfile.mockResolvedValue({ ok: false as const, reason: 'Unable to unlock local face profile.' })
    mocks.interactionState.profileStatus.value = 'encrypted'
    mocks.interactionState.encryptedProfile.unlockedProfile.value = null

    const { container, unmount } = mountPage()
    await nextTick()

    const input = container.querySelector('input[placeholder="输入解锁口令"]') as HTMLInputElement | null
    if (!input)
      throw new Error('unlock passphrase input missing')
    input.value = 'wrong-passphrase'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    await clickButton(container, '解锁档案')

    expect(mocks.unlockFaceProfile).toHaveBeenCalledTimes(1)
    expect(mocks.unlockFaceProfile).toHaveBeenCalledWith('wrong-passphrase', {
      rememberOnDevice: false,
    })
    expect(mocks.toastError).toHaveBeenCalledWith('无法解锁本地人脸档案。')

    unmount()
  })

  it('shows localized status labels in overview card', async () => {
    mocks.interactionState.cameraState.value = 'off'
    mocks.interactionState.runtimeStatus.value = 'partial_ready'
    mocks.interactionState.profileStatus.value = 'encrypted'
    mocks.interactionState.localFaceGate.gateState.value = 'gated'
    mocks.interactionState.localFaceGate.profileStatus.value = 'matching'

    const { container, unmount } = mountPage()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('摄像头：已关闭')
    expect(text).toContain('模型：部分就绪')
    expect(text).toContain('人脸档案：已锁定')
    expect(text).toContain('人脸门控：等待匹配')

    unmount()
  })
})
