// @vitest-environment jsdom

import type { VisionInteractionOptions } from './use-vision-interaction'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

import { useVisionInteraction } from './use-vision-interaction'
import { useVisionRuntime } from './use-vision-runtime'

const interactionTestHarness = vi.hoisted(() => {
  const openCvStatusRef = { value: 'ready' as 'idle' | 'loading' | 'ready' | 'failed' | 'fallback' }
  const openCvErrorMessageRef = { value: '' }
  const openCvInitializeMock = vi.fn(async () => {})
  const openCvMarkFallbackMock = vi.fn((message: string) => {
    openCvStatusRef.value = 'fallback'
    openCvErrorMessageRef.value = message
  })
  const openCvResetRuntimeMock = vi.fn(() => {
    openCvStatusRef.value = 'idle'
    openCvErrorMessageRef.value = ''
  })
  const openCvEvaluateFaceQualityMock = vi.fn(async () => ({
    accepted: true,
    qualityScore: 0.95,
    brightness: 0.5,
    sharpness: 0.5,
    contrast: 0.5,
    faceSize: 0.4,
  }))
  return {
    openCvStatusRef,
    openCvErrorMessageRef,
    openCvInitializeMock,
    openCvMarkFallbackMock,
    openCvResetRuntimeMock,
    openCvEvaluateFaceQualityMock,
  }
})

const {
  openCvStatusRef,
  openCvErrorMessageRef,
  openCvInitializeMock,
  openCvMarkFallbackMock,
  openCvResetRuntimeMock,
  openCvEvaluateFaceQualityMock,
} = interactionTestHarness

vi.mock('@mediapipe/tasks-vision', () => ({
  FaceLandmarker: {
    createFromOptions: vi.fn(),
  },
  GestureRecognizer: {
    createFromOptions: vi.fn(),
  },
  FilesetResolver: {
    forVisionTasks: vi.fn(),
  },
}))

vi.mock('./use-opencv-face-quality', () => ({
  useOpenCvFaceQuality: () => ({
    status: interactionTestHarness.openCvStatusRef,
    errorMessage: interactionTestHarness.openCvErrorMessageRef,
    initializeOpenCv: interactionTestHarness.openCvInitializeMock,
    markFallback: interactionTestHarness.openCvMarkFallbackMock,
    resetRuntime: interactionTestHarness.openCvResetRuntimeMock,
    evaluateFaceQuality: interactionTestHarness.openCvEvaluateFaceQualityMock,
  }),
}))

vi.mock('./use-encrypted-face-profile', () => ({
  useEncryptedFaceProfile: () => ({
    unlockedProfile: { value: null },
    hasEncryptedProfile: { value: false },
    isUnlocked: { value: false },
    status: { value: 'none' },
    lastSuccessfulPassphrase: { value: '' },
    saveEncryptedProfile: vi.fn(async () => ({ ok: true })),
    unlockProfile: vi.fn(async () => ({ ok: false })),
    lockProfile: vi.fn(() => {}),
    deleteProfile: vi.fn(() => {}),
  }),
}))

vi.mock('./use-local-face-gate', () => ({
  createLandmarkDescriptor: vi.fn(() => []),
  useLocalFaceGate: () => ({
    gateEnabled: { value: false },
    gateState: { value: 'disabled' },
    profileStatus: { value: 'none' },
    unlockedDisplayName: { value: '' },
    matchScore: { value: null },
    setGateEnabled: vi.fn(() => {}),
    syncProfileFromPayload: vi.fn(() => {}),
    setLockedByProfile: vi.fn(() => {}),
    resetForCameraStop: vi.fn(() => {}),
    consumeJustMatchedWelcome: vi.fn(() => false),
    evaluateFrame: vi.fn(() => ({ status: 'no_face' })),
  }),
}))

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve
  })
  return { promise, resolve }
}

function createMockVideoElement() {
  return {
    srcObject: null as MediaStream | null,
    muted: false,
    playsInline: false,
    readyState: 3,
    paused: false,
    currentTime: 0,
    play: vi.fn(async () => {}),
    pause: vi.fn(() => {}),
    load: vi.fn(() => {}),
  } as unknown as HTMLVideoElement
}

function createMockStream() {
  const videoTrack = {
    id: 'track_vision_0',
    label: 'Vision Camera',
    readyState: 'live',
    stop: vi.fn(() => {}),
    onended: null as null | (() => void),
  } as unknown as MediaStreamTrack

  const stream = {
    getTracks: vi.fn(() => [videoTrack]),
    getVideoTracks: vi.fn(() => [videoTrack]),
  } as unknown as MediaStream

  return { stream, videoTrack }
}

function mountInteractionWithVideo(videoElement: HTMLVideoElement, options?: VisionInteractionOptions) {
  let interaction: ReturnType<typeof useVisionInteraction> | null = null

  const host = defineComponent({
    setup() {
      interaction = useVisionInteraction(options)
      interaction.attachVideoElement(videoElement)
      return () => h('div')
    },
  })

  const container = document.createElement('div')
  const app = createApp(host)
  app.mount(container)

  return {
    app,
    interaction: assertInteractionReady(interaction),
  }
}

function assertInteractionReady(
  interaction: ReturnType<typeof useVisionInteraction> | null,
): ReturnType<typeof useVisionInteraction> {
  if (!interaction)
    throw new Error('interaction should be initialized')
  return interaction
}

async function getVisionRuntimeMocks() {
  const visionModule = await import('@mediapipe/tasks-vision')
  const faceCreateFromOptions = vi.mocked(visionModule.FaceLandmarker.createFromOptions)
  const gestureCreateFromOptions = vi.mocked(visionModule.GestureRecognizer.createFromOptions)
  const resolveFileset = vi.mocked(visionModule.FilesetResolver.forVisionTasks)
  return {
    faceCreateFromOptions,
    gestureCreateFromOptions,
    resolveFileset,
  }
}

/**
 * ROOT CAUSE:
 *
 * The vision panel is mounted with `v-if`, so opening/closing the panel can unmount the composable.
 * Before this regression fix, if `start()` was still waiting for `getUserMedia`, unmount did stop
 * current tracks but did not invalidate the pending async start token.
 *
 * <before-patch behavior/code>
 *
 * After unmount, the delayed `getUserMedia` promise could still resolve and continue start flow,
 * rebinding camera stream and leaving camera active unexpectedly.
 *
 * We fixed this by invalidating lifecycle tokens on unmount/cleanup/stop, so stale starts are
 * force-cancelled and stream tracks are stopped as soon as they resolve.
 */
describe('useVisionInteraction camera lifecycle regression locks', () => {
  const originalMediaDevices = navigator.mediaDevices
  const originalPermissions = navigator.permissions

  beforeEach(async () => {
    vi.restoreAllMocks()
    openCvStatusRef.value = 'ready'
    openCvErrorMessageRef.value = ''
    openCvInitializeMock.mockReset()
    openCvInitializeMock.mockImplementation(async () => {
      openCvStatusRef.value = 'ready'
      openCvErrorMessageRef.value = ''
    })
    openCvMarkFallbackMock.mockClear()
    openCvResetRuntimeMock.mockClear()
    openCvEvaluateFaceQualityMock.mockReset()
    openCvEvaluateFaceQualityMock.mockResolvedValue({
      accepted: true,
      qualityScore: 0.95,
      brightness: 0.5,
      sharpness: 0.5,
      contrast: 0.5,
      faceSize: 0.4,
    })

    const { faceCreateFromOptions, gestureCreateFromOptions, resolveFileset } = await getVisionRuntimeMocks()
    resolveFileset.mockReset()
    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    faceCreateFromOptions.mockReset()
    faceCreateFromOptions.mockResolvedValue({
      detectForVideo: vi.fn(() => ({ faceLandmarks: [] })),
      close: vi.fn(() => {}),
    } as any)
    gestureCreateFromOptions.mockReset()
    gestureCreateFromOptions.mockResolvedValue({
      recognizeForVideo: vi.fn(() => ({ gestures: [] })),
      close: vi.fn(() => {}),
    } as any)

    await useVisionRuntime().resetVisionRuntime()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    })
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: originalPermissions,
    })
  })

  it('stops stale stream when component unmounts before getUserMedia resolves', async () => {
    const deferredStream = createDeferred<MediaStream>()
    const getUserMedia = vi.fn(async () => deferredStream.promise)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    let interaction: ReturnType<typeof useVisionInteraction> | null = null

    const host = defineComponent({
      setup() {
        interaction = useVisionInteraction()
        interaction.attachVideoElement(videoElement)
        return () => h('div')
      },
    })

    const container = document.createElement('div')
    const app = createApp(host)
    app.mount(container)

    const readyInteraction = assertInteractionReady(interaction)
    const startPromise = readyInteraction.start()
    app.unmount()

    const { stream, videoTrack } = createMockStream()
    deferredStream.resolve(stream)
    await startPromise

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(videoTrack.stop).toHaveBeenCalledTimes(1)
    expect(videoElement.play).not.toHaveBeenCalled()
    expect(readyInteraction.isEnabled.value).toBe(false)
    expect(readyInteraction.cameraState.value).not.toBe('active')
  })

  it('keeps camera off when stop is requested during pending getUserMedia', async () => {
    const deferredStream = createDeferred<MediaStream>()
    const getUserMedia = vi.fn(async () => deferredStream.promise)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    let interaction: ReturnType<typeof useVisionInteraction> | null = null

    const host = defineComponent({
      setup() {
        interaction = useVisionInteraction()
        interaction.attachVideoElement(videoElement)
        return () => h('div')
      },
    })

    const container = document.createElement('div')
    const app = createApp(host)
    app.mount(container)

    const readyInteraction = assertInteractionReady(interaction)
    const startPromise = readyInteraction.start()
    await readyInteraction.stop()

    const { stream, videoTrack } = createMockStream()
    deferredStream.resolve(stream)
    await startPromise

    expect(videoTrack.stop).toHaveBeenCalledTimes(1)
    expect(readyInteraction.isEnabled.value).toBe(false)
    expect(readyInteraction.cameraState.value).toBe('off')

    app.unmount()
  })

  it('transitions camera state off -> active -> off and releases tracks/video binding on stop', async () => {
    const requestAnimationFrameMock = vi.fn(() => 1)
    const cancelAnimationFrameMock = vi.fn(() => {})
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock)

    const { stream, videoTrack } = createMockStream()
    const getUserMedia = vi.fn(async () => stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    expect(interaction.cameraState.value).toBe('off')
    expect(interaction.isEnabled.value).toBe(false)

    await interaction.start()

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(interaction.cameraState.value).toBe('active')
    expect(interaction.isEnabled.value).toBe(true)
    expect(videoElement.srcObject).toBe(stream)

    await interaction.stop()

    expect(interaction.cameraState.value).toBe('off')
    expect(interaction.isEnabled.value).toBe(false)
    expect(videoTrack.stop).toHaveBeenCalledTimes(1)
    expect(videoElement.srcObject).toBeNull()
    expect(videoElement.pause).toHaveBeenCalledTimes(1)
    expect(videoElement.load).toHaveBeenCalledTimes(1)
    expect(requestAnimationFrameMock.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(cancelAnimationFrameMock).toHaveBeenCalledTimes(1)

    app.unmount()
  })

  it('sets error state and message when camera permission request fails', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => {}))

    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: undefined,
    })

    const getUserMedia = vi.fn(async () => {
      throw new Error('Permission denied in test')
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    await interaction.start()

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(interaction.isEnabled.value).toBe(false)
    expect(interaction.cameraState.value).toBe('error')
    expect(interaction.errorMessage.value).toContain('Permission denied in test')
    expect(interaction.cameraPermissionState.value).toBe('unsupported')

    app.unmount()
  })

  it('marks permission denied on NotAllowedError and allows retry to recover on next start', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => {}))

    const notAllowedError = new DOMException('User denied camera access', 'NotAllowedError')
    const { stream } = createMockStream()
    const getUserMedia = vi.fn()
      .mockRejectedValueOnce(notAllowedError)
      .mockResolvedValueOnce(stream)

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    await interaction.start()
    expect(interaction.cameraState.value).toBe('error')
    expect(interaction.cameraPermissionState.value).toBe('denied')
    expect(interaction.isEnabled.value).toBe(false)

    await interaction.start()
    expect(interaction.cameraState.value).toBe('active')
    expect(interaction.cameraPermissionState.value).toBe('granted')
    expect(interaction.isEnabled.value).toBe(true)
    expect(getUserMedia).toHaveBeenCalledTimes(2)

    await interaction.stop()
    app.unmount()
  })

  it('keeps camera recoverable when MediaPipe initialization fails and stop still releases resources', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => {}))

    const { faceCreateFromOptions, gestureCreateFromOptions, resolveFileset } = await getVisionRuntimeMocks()
    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    faceCreateFromOptions.mockRejectedValue(new Error('MediaPipe face model init failed in test'))
    gestureCreateFromOptions.mockResolvedValue({
      recognizeForVideo: vi.fn(() => ({ gestures: [] })),
      close: vi.fn(() => {}),
    } as any)

    const { stream, videoTrack } = createMockStream()
    const getUserMedia = vi.fn(async () => stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    await interaction.start()
    expect(interaction.cameraState.value).toBe('error')
    expect(interaction.mediaPipeStatus.value).toBe('failed')
    expect(interaction.errorMessage.value).toContain('MediaPipe face model init failed in test')
    expect(interaction.isEnabled.value).toBe(false)

    await interaction.stop()
    expect(videoTrack.stop).toHaveBeenCalledTimes(1)
    expect(interaction.cameraState.value).toBe('off')
    expect(interaction.isEnabled.value).toBe(false)

    app.unmount()
  })

  it('deduplicates concurrent prewarm requests to avoid duplicate wasm loader initialization', async () => {
    const { faceCreateFromOptions, gestureCreateFromOptions, resolveFileset } = await getVisionRuntimeMocks()
    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    faceCreateFromOptions.mockResolvedValue({
      detectForVideo: vi.fn(() => ({ faceLandmarks: [] })),
      close: vi.fn(() => {}),
    } as any)
    gestureCreateFromOptions.mockResolvedValue({
      recognizeForVideo: vi.fn(() => ({ gestures: [] })),
      close: vi.fn(() => {}),
    } as any)

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    resolveFileset.mockClear()
    faceCreateFromOptions.mockClear()
    gestureCreateFromOptions.mockClear()

    const [firstPrewarm, secondPrewarm] = await Promise.allSettled([
      interaction.prewarmVisionModels(),
      interaction.prewarmVisionModels(),
    ])

    expect(firstPrewarm.status).toBe('fulfilled')
    expect(secondPrewarm.status).toBe('fulfilled')
    expect(faceCreateFromOptions).toHaveBeenCalledTimes(1)
    expect(gestureCreateFromOptions).toHaveBeenCalledTimes(1)
    expect(resolveFileset).toHaveBeenCalledTimes(1)
    expect(interaction.modelWarmupStatus.value).toBe('ready')
    expect(interaction.mediaPipeStatus.value).toBe('ready')

    app.unmount()
  })

  it('configures gesture recognizer with practical gesture allowlist and score threshold', async () => {
    const { faceCreateFromOptions, gestureCreateFromOptions, resolveFileset } = await getVisionRuntimeMocks()
    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    faceCreateFromOptions.mockResolvedValue({
      detectForVideo: vi.fn(() => ({ faceLandmarks: [] })),
      close: vi.fn(() => {}),
    } as any)
    gestureCreateFromOptions.mockResolvedValue({
      recognizeForVideo: vi.fn(() => ({ gestures: [] })),
      close: vi.fn(() => {}),
    } as any)

    const videoElement = createMockVideoElement()
    const { app, interaction } = mountInteractionWithVideo(videoElement)

    await interaction.prewarmVisionModels()

    expect(gestureCreateFromOptions).toHaveBeenCalledTimes(1)
    const [, options] = gestureCreateFromOptions.mock.calls[0] ?? []
    expect(options).toMatchObject({
      runningMode: 'VIDEO',
      numHands: 1,
      cannedGesturesClassifierOptions: {
        categoryAllowlist: ['Open_Palm', 'Victory', 'Thumb_Up'],
        maxResults: 3,
        scoreThreshold: 0.35,
      },
    })

    app.unmount()
  })
})
