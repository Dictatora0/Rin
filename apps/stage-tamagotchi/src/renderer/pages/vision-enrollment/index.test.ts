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
    runtimeStatus: ref<'idle' | 'warming' | 'ready' | 'partial_ready' | 'failed' | 'resetting'>('idle'),
    runtimeWarmupDurationMs: ref<number | null>(null),
    runtimeRetryCount: ref(0),
    runtimeLastError: ref(''),
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
      trackEndedCount: 0,
      unexpectedTrackEndedCount: 0,
      lastTrackEndedAt: null,
      lastTrackEndedTrackId: null,
      lastTrackEndedTrackLabel: null,
      lastTrackEndedIntentional: null,
      inferenceErrorCount: 0,
      consecutiveInferenceErrorCount: 0,
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

describe('vision enrollment page stability behaviors', () => {
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

  it('shows vision diagnostics statuses for demo troubleshooting', async () => {
    mocks.interactionState.runtimeStatus.value = 'failed'
    mocks.interactionState.runtimeWarmupDurationMs.value = 1200
    mocks.interactionState.runtimeRetryCount.value = 2
    mocks.interactionState.runtimeLastError.value = 'MediaPipe warmup timed out'
    mocks.interactionState.cameraState.value = 'error'
    mocks.interactionState.cameraPermissionState.value = 'denied'
    mocks.interactionState.mediaPipeStatus.value = 'failed'
    mocks.interactionState.openCvFaceQuality.status.value = 'fallback'
    mocks.interactionState.profileStatus.value = 'encrypted'
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'
    mocks.interactionState.errorMessage.value = 'Vision prewarm failed'

    const { container, unmount } = mountPage()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('Vision Runtime')
    expect(text).toContain('status：failed')
    expect(text).toContain('retryCount：2')
    expect(text).toContain('lastError：MediaPipe warmup timed out')
    expect(text).toContain('Vision Diagnostics')
    expect(text).toContain('runtimeStatus：failed')
    expect(text).toContain('cameraState：error')
    expect(text).toContain('cameraPermission：已拒绝')
    expect(text).toContain('MediaPipe：failed')
    expect(text).toContain('OpenCV：降级模式')
    expect(text).toContain('faceProfile：encrypted')
    expect(text).toContain('faceGate：locked / multiple_faces')
    expect(text).toContain('lastError：Vision prewarm failed')
    expect(mocks.warmupVisionRuntime).toHaveBeenCalledWith({
      background: true,
      includeOpenCv: false,
    })

    unmount()
  })

  it('wires runtime retry and reset buttons to shared runtime controls', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    await clickButton(container, 'Retry Runtime')
    expect(mocks.retryVisionRuntime).toHaveBeenCalledTimes(1)

    await clickButton(container, 'Reset Runtime')
    expect(mocks.resetVisionRuntime).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('uses opaque panel shell and cards for better readability', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    const markup = container.innerHTML
    expect(markup).toContain('bg-neutral-100')
    expect(markup).toContain('dark:bg-neutral-950')
    expect(markup).toContain('bg-white')
    expect(markup).toContain('dark:bg-neutral-900')
    expect(markup).not.toContain('bg-white/88')
    expect(markup).not.toContain('dark:bg-neutral-900/80')
    expect(markup).not.toContain('border-neutral-200/70')
    expect(markup).not.toContain('dark:border-neutral-700/70')

    unmount()
  })

  it('deletes profile only after confirmation and reflects cleared state in UI', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container, unmount } = mountPage()
    await nextTick()

    await clickButton(container, '删除档案')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledWith('确认删除本地加密人脸档案？此操作不可撤销。')
    expect(mocks.deleteLocalFaceProfile).toHaveBeenCalledTimes(1)
    expect(mocks.setFaceGateEnabled).toHaveBeenCalledWith(false)
    expect(mocks.toastMessage).toHaveBeenCalledWith('本地加密人脸档案已删除。')

    const text = container.textContent ?? ''
    expect(text).toContain('档案状态：未录入')
    expect(text).toContain('门控状态：未启用')
    expect(text).toContain('样本数量：0')
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
    expect(mocks.toastMessage).toHaveBeenCalledTimes(0)

    unmount()
  })

  it('keeps encrypted profile when unlock passphrase is wrong and surfaces safe error', async () => {
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
    expect(mocks.interactionState.hasEncryptedProfile.value).toBe(true)
    expect(mocks.interactionState.profileStatus.value).toBe('encrypted')

    unmount()
  })
})
