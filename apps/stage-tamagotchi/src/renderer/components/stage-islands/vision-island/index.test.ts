// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import VisionIsland from './index.vue'

const mocks = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  prewarmVisionModels: vi.fn(async () => {}),
  setFaceGateEnabled: vi.fn(() => {}),
  setMaxInferenceStallMs: vi.fn(() => {}),
  setRememberFaceProfileOnDevice: vi.fn(async () => true),
  unlockFaceProfile: vi.fn(async () => ({ ok: true as const, profile: null as never })),

  triggerVisionPetFeedback: vi.fn(() => true),
  cancelQuietVisualMode: vi.fn(() => {}),
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
    setFaceGateEnabled: mocks.setFaceGateEnabled,
    setMaxInferenceStallMs: mocks.setMaxInferenceStallMs,
    setRememberFaceProfileOnDevice: mocks.setRememberFaceProfileOnDevice,
    unlockFaceProfile: mocks.unlockFaceProfile,
  }
}

function createPetFeedbackState() {
  return {
    triggerVisionPetFeedback: mocks.triggerVisionPetFeedback,
    petFeedbackState: ref<'idle' | 'quiet' | 'celebrating' | 'acknowledged' | 'gated'>('idle'),
    lastPetFeedback: ref<{ summary: string, at: number } | null>(null),
    isQuietVisualMode: ref(false),
    quietRemainingMs: ref(0),
    celebrationCount: ref(0),
    cancelQuietVisualMode: mocks.cancelQuietVisualMode,
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
    mocks.start.mockReset()
    mocks.stop.mockReset()
    mocks.prewarmVisionModels.mockReset()
    mocks.setFaceGateEnabled.mockReset()
    mocks.setMaxInferenceStallMs.mockReset()
    mocks.setRememberFaceProfileOnDevice.mockReset()
    mocks.unlockFaceProfile.mockReset()
    mocks.triggerVisionPetFeedback.mockReset()
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
    expect(text).toContain('本地人脸门控')
    expect(text).toContain('摄像头默认关闭。')
    expect(text).toContain('识别仅在本地运行。')
    expect(text).toContain('不会上传任何摄像头数据。')
    expect(text).toContain('Vision Diagnostics')
    expect(text).toContain('cameraState: off')
    expect(text).toContain('cameraPermission: unknown')
    expect(text).toContain('MediaPipe: idle')
    expect(text).toContain('OpenCV: ready')
    expect(text).toContain('lastError: none')

    unmount()
  })

  it('wires camera, prewarm, and enrollment actions to composable/router handlers', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    await clickButton(container, '开启摄像头')
    expect(mocks.start).toHaveBeenCalledTimes(1)

    mocks.interactionState.isEnabled.value = true
    mocks.interactionState.cameraState.value = 'active'
    await nextTick()

    await clickButton(container, '关闭摄像头')
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    await clickButton(container, '预热视觉模型')
    expect(mocks.prewarmVisionModels).toHaveBeenCalledTimes(1)
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1)
    expect(mocks.toastError).toHaveBeenCalledTimes(0)

    await clickButton(container, '打开人脸录入页')
    expect(mocks.routerPush).toHaveBeenCalledWith('/vision-enrollment')

    unmount()
  })

  it('renders pet feedback and gate status changes deterministically', async () => {
    const { container, unmount } = mountVisionIsland()
    await nextTick()

    mocks.interactionState.gateEnabled.value = true
    mocks.interactionState.localFaceGate.gateState.value = 'locked'
    mocks.interactionState.localFaceGate.profileStatus.value = 'multiple_faces'
    mocks.interactionState.canTriggerInteractiveFeedback.value = false
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
    expect(mocks.triggerVisionPetFeedback).toHaveBeenCalledWith('gated', expect.objectContaining({
      allowVisualFeedback: false,
      gateEnabled: true,
      gateState: 'locked',
      sourceEventId: 71,
    }))

    unmount()
  })
})
