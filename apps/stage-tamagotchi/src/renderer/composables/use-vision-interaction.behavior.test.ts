// @vitest-environment jsdom

import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

import { useVisionInteraction } from './use-vision-interaction'
import { useVisionRuntime } from './use-vision-runtime'

const queuedFaceResults: FaceLandmarkerResult[] = []
const queuedGestureResults: GestureRecognizerResult[] = []
const rafCallbacks: FrameRequestCallback[] = []

const gateEnabledRef = ref(false)
const gateStateRef = ref<'disabled' | 'enabled' | 'gated' | 'locked'>('disabled')
const gateProfileStatusRef = ref('not_enrolled')
const gateDisplayNameRef = ref('')
const gateMatchScoreRef = ref<number | null>(null)
const interactionBehaviorHarness = vi.hoisted(() => {
  const openCvStatusRef = { value: 'ready' as 'idle' | 'loading' | 'ready' | 'failed' | 'fallback' }
  const openCvErrorMessageRef = { value: '' }
  const initializeOpenCvMock = vi.fn(async () => {})
  const markOpenCvFallbackMock = vi.fn((message: string) => {
    openCvStatusRef.value = 'fallback'
    openCvErrorMessageRef.value = message
  })
  const resetOpenCvRuntimeMock = vi.fn(() => {
    openCvStatusRef.value = 'idle'
    openCvErrorMessageRef.value = ''
  })
  const evaluateFaceQualityMock = vi.fn(async () => ({
    accepted: true,
    qualityScore: 0.96,
    brightness: 130,
    sharpness: 32,
    contrast: 38,
    faceSize: 0.22,
  }))
  return {
    openCvStatusRef,
    openCvErrorMessageRef,
    initializeOpenCvMock,
    markOpenCvFallbackMock,
    resetOpenCvRuntimeMock,
    evaluateFaceQualityMock,
  }
})

const gestureRecognizerRuntimeHarness = vi.hoisted(() => {
  const recognizeForVideoMock = vi.fn(() => {
    return queuedGestureResults.shift() ?? ({ gestures: [[{ categoryName: 'None' }]] } as any)
  })
  return {
    recognizeForVideoMock,
  }
})

const {
  openCvStatusRef,
  openCvErrorMessageRef,
  initializeOpenCvMock,
  markOpenCvFallbackMock,
  resetOpenCvRuntimeMock,
  evaluateFaceQualityMock,
} = interactionBehaviorHarness
const { recognizeForVideoMock } = gestureRecognizerRuntimeHarness

const evaluateFrameMock = vi.fn(() => ({ status: 'no_face' as const }))
const consumeJustMatchedWelcomeMock = vi.fn(() => false)
const saveEncryptedProfileMock = vi.fn(async () => ({ ok: true as const }))

function createFaceLandmarkerResult(
  landmarks: NormalizedLandmark[][],
  options?: {
    blendshapeCategories?: Array<{ categoryName: string, score: number }>
  },
): FaceLandmarkerResult {
  const blendshapeRows = options?.blendshapeCategories
    ? [{ categories: options.blendshapeCategories as unknown as Category[] }]
    : undefined
  return {
    faceLandmarks: landmarks,
    faceBlendshapes: blendshapeRows,
  } as FaceLandmarkerResult
}

function createOpenPalmHandLandmarks(): NormalizedLandmark[] {
  return [
    { x: 0.5, y: 0.85, z: 0.01, visibility: 0 }, // wrist
    { x: 0.42, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.37, y: 0.72, z: 0.01, visibility: 0 }, // thumb mcp
    { x: 0.32, y: 0.60, z: 0.01, visibility: 0 }, // thumb ip
    { x: 0.26, y: 0.46, z: 0.01, visibility: 0 }, // thumb tip
    { x: 0.44, y: 0.69, z: 0.01, visibility: 0 }, // index mcp
    { x: 0.43, y: 0.55, z: 0.01, visibility: 0 }, // index pip
    { x: 0.42, y: 0.44, z: 0.01, visibility: 0 },
    { x: 0.40, y: 0.34, z: 0.01, visibility: 0 }, // index tip
    { x: 0.52, y: 0.69, z: 0.01, visibility: 0 }, // middle mcp
    { x: 0.52, y: 0.53, z: 0.01, visibility: 0 }, // middle pip
    { x: 0.52, y: 0.42, z: 0.01, visibility: 0 },
    { x: 0.52, y: 0.31, z: 0.01, visibility: 0 }, // middle tip
    { x: 0.60, y: 0.70, z: 0.01, visibility: 0 }, // ring mcp
    { x: 0.61, y: 0.57, z: 0.01, visibility: 0 }, // ring pip
    { x: 0.62, y: 0.47, z: 0.01, visibility: 0 },
    { x: 0.63, y: 0.36, z: 0.01, visibility: 0 }, // ring tip
    { x: 0.68, y: 0.71, z: 0.01, visibility: 0 }, // pinky mcp
    { x: 0.70, y: 0.60, z: 0.01, visibility: 0 }, // pinky pip
    { x: 0.71, y: 0.51, z: 0.01, visibility: 0 },
    { x: 0.72, y: 0.41, z: 0.01, visibility: 0 }, // pinky tip
  ]
}

function createGestureRecognizerResult(categoryName: string): GestureRecognizerResult {
  const normalized = categoryName.trim().toLowerCase()
  const score = normalized === 'none' ? 0.99 : 0.92
  const handLandmarks = normalized === 'open_palm'
    ? [createOpenPalmHandLandmarks()]
    : normalized === 'victory'
      ? [createVictoryHandLandmarks()]
      : normalized === 'thumb_up' || normalized === 'thumbs_up'
        ? [createThumbsUpHandLandmarks()]
        : []

  return {
    gestures: [[{ categoryName, score }]],
    landmarks: handLandmarks,
    handedness: handLandmarks.length ? [[{ categoryName: 'Right', score: 0.99 } as any]] : [],
  } as GestureRecognizerResult
}

function createGestureRecognizerResultWithCandidates(
  options: {
    candidates: Array<{ categoryName: string, score?: number }>
    landmarks?: NormalizedLandmark[][]
    handedness?: string
  },
): GestureRecognizerResult {
  return {
    gestures: [options.candidates],
    landmarks: options.landmarks ?? [],
    handedness: options.handedness ? [[{ categoryName: options.handedness } as any]] : [],
  } as GestureRecognizerResult
}

function createFaceAt(centerX: number, centerY: number): NormalizedLandmark[] {
  const landmark = (x: number, y: number): NormalizedLandmark => ({ x, y, z: 0.01, visibility: 0 })
  return [
    landmark(centerX - 0.12, centerY - 0.14),
    landmark(centerX + 0.12, centerY - 0.14),
    landmark(centerX - 0.11, centerY + 0.14),
    landmark(centerX + 0.11, centerY + 0.14),
  ]
}

function createSmileBlendshapeCategories(options?: {
  left?: number
  right?: number
}) {
  return [
    { categoryName: 'mouthSmileLeft', score: options?.left ?? 0.6 },
    { categoryName: 'mouthSmileRight', score: options?.right ?? 0.6 },
  ]
}

function queueFrames(options: {
  gesture: string
  face: NormalizedLandmark[][]
  count: number
  blendshapeCategories?: Array<{ categoryName: string, score: number }>
}) {
  for (let i = 0; i < options.count; i += 1) {
    queuedFaceResults.push(createFaceLandmarkerResult(options.face, {
      blendshapeCategories: options.blendshapeCategories,
    }))
    queuedGestureResults.push(createGestureRecognizerResult(options.gesture))
  }
}

function queueFramesWithGestureCandidates(options: {
  candidates: Array<{ categoryName: string, score?: number }>
  face: NormalizedLandmark[][]
  count: number
  handLandmarks?: NormalizedLandmark[][]
  handedness?: string
  blendshapeCategories?: Array<{ categoryName: string, score: number }>
}) {
  for (let i = 0; i < options.count; i += 1) {
    queuedFaceResults.push(createFaceLandmarkerResult(options.face, {
      blendshapeCategories: options.blendshapeCategories,
    }))
    queuedGestureResults.push(createGestureRecognizerResultWithCandidates({
      candidates: options.candidates,
      landmarks: options.handLandmarks,
      handedness: options.handedness,
    }))
  }
}

function createVictoryHandLandmarks(): NormalizedLandmark[] {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.72, z: 0.01, visibility: 0 } as NormalizedLandmark))
  points[0] = { x: 0.5, y: 0.85, z: 0.01, visibility: 0 } // wrist
  points[1] = { x: 0.43, y: 0.79, z: 0.01, visibility: 0 }
  points[2] = { x: 0.38, y: 0.74, z: 0.01, visibility: 0 } // thumb mcp
  points[3] = { x: 0.34, y: 0.68, z: 0.01, visibility: 0 } // thumb ip
  points[4] = { x: 0.30, y: 0.63, z: 0.01, visibility: 0 } // thumb tip
  points[5] = { x: 0.35, y: 0.68, z: 0.01, visibility: 0 } // index mcp
  points[6] = { x: 0.30, y: 0.52, z: 0.01, visibility: 0 } // index pip
  points[7] = { x: 0.27, y: 0.43, z: 0.01, visibility: 0 }
  points[8] = { x: 0.24, y: 0.33, z: 0.01, visibility: 0 } // index tip
  points[9] = { x: 0.65, y: 0.68, z: 0.01, visibility: 0 } // middle mcp
  points[10] = { x: 0.70, y: 0.52, z: 0.01, visibility: 0 } // middle pip
  points[11] = { x: 0.73, y: 0.43, z: 0.01, visibility: 0 }
  points[12] = { x: 0.76, y: 0.33, z: 0.01, visibility: 0 } // middle tip
  points[13] = { x: 0.58, y: 0.70, z: 0.01, visibility: 0 } // ring mcp
  points[14] = { x: 0.60, y: 0.76, z: 0.01, visibility: 0 } // ring pip
  points[15] = { x: 0.61, y: 0.80, z: 0.01, visibility: 0 }
  points[16] = { x: 0.62, y: 0.84, z: 0.01, visibility: 0 } // ring tip
  points[17] = { x: 0.66, y: 0.72, z: 0.01, visibility: 0 } // pinky mcp
  points[18] = { x: 0.69, y: 0.78, z: 0.01, visibility: 0 } // pinky pip
  points[19] = { x: 0.71, y: 0.82, z: 0.01, visibility: 0 }
  points[20] = { x: 0.72, y: 0.86, z: 0.01, visibility: 0 } // pinky tip
  return points
}

function createThumbsUpHandLandmarks(): NormalizedLandmark[] {
  return [
    { x: 0.5, y: 0.85, z: 0.01, visibility: 0 }, // wrist
    { x: 0.44, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.40, y: 0.72, z: 0.01, visibility: 0 }, // thumb mcp
    { x: 0.34, y: 0.58, z: 0.01, visibility: 0 }, // thumb ip
    { x: 0.27, y: 0.40, z: 0.01, visibility: 0 }, // thumb tip
    { x: 0.46, y: 0.69, z: 0.01, visibility: 0 }, // index mcp
    { x: 0.46, y: 0.75, z: 0.01, visibility: 0 }, // index pip
    { x: 0.46, y: 0.79, z: 0.01, visibility: 0 },
    { x: 0.46, y: 0.83, z: 0.01, visibility: 0 }, // index tip
    { x: 0.53, y: 0.69, z: 0.01, visibility: 0 }, // middle mcp
    { x: 0.53, y: 0.76, z: 0.01, visibility: 0 }, // middle pip
    { x: 0.53, y: 0.80, z: 0.01, visibility: 0 },
    { x: 0.53, y: 0.84, z: 0.01, visibility: 0 }, // middle tip
    { x: 0.60, y: 0.70, z: 0.01, visibility: 0 }, // ring mcp
    { x: 0.61, y: 0.77, z: 0.01, visibility: 0 }, // ring pip
    { x: 0.62, y: 0.81, z: 0.01, visibility: 0 },
    { x: 0.63, y: 0.85, z: 0.01, visibility: 0 }, // ring tip
    { x: 0.67, y: 0.72, z: 0.01, visibility: 0 }, // pinky mcp
    { x: 0.69, y: 0.78, z: 0.01, visibility: 0 }, // pinky pip
    { x: 0.70, y: 0.83, z: 0.01, visibility: 0 },
    { x: 0.71, y: 0.87, z: 0.01, visibility: 0 }, // pinky tip
  ]
}

vi.mock('@mediapipe/tasks-vision', () => {
  return {
    FilesetResolver: {
      forVisionTasks: vi.fn(async () => ({
        wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
        wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
      })),
    },
    FaceLandmarker: {
      createFromOptions: vi.fn(async () => ({
        detectForVideo: vi.fn(() => {
          return queuedFaceResults.shift() ?? createFaceLandmarkerResult([createFaceAt(0.5, 0.5)])
        }),
        close: vi.fn(() => {}),
      })),
    },
    GestureRecognizer: {
      createFromOptions: vi.fn(async () => ({
        recognizeForVideo: recognizeForVideoMock,
        close: vi.fn(() => {}),
      })),
    },
  }
})

vi.mock('./use-encrypted-face-profile', () => ({
  useEncryptedFaceProfile: () => ({
    unlockedProfile: { value: null },
    hasEncryptedProfile: { value: false },
    isUnlocked: { value: false },
    status: { value: 'none' },
    lastSuccessfulPassphrase: { value: '' },
    saveEncryptedProfile: saveEncryptedProfileMock,
    unlockProfile: vi.fn(async () => ({ ok: false })),
    lockProfile: vi.fn(() => {}),
    deleteProfile: vi.fn(() => {}),
  }),
}))

vi.mock('./use-opencv-face-quality', () => ({
  useOpenCvFaceQuality: () => ({
    status: interactionBehaviorHarness.openCvStatusRef,
    errorMessage: interactionBehaviorHarness.openCvErrorMessageRef,
    initializeOpenCv: interactionBehaviorHarness.initializeOpenCvMock,
    markFallback: interactionBehaviorHarness.markOpenCvFallbackMock,
    resetRuntime: interactionBehaviorHarness.resetOpenCvRuntimeMock,
    evaluateFaceQuality: interactionBehaviorHarness.evaluateFaceQualityMock,
  }),
}))

vi.mock('./use-local-face-gate', () => ({
  createLandmarkDescriptor: vi.fn(() => []),
  useLocalFaceGate: () => ({
    gateEnabled: gateEnabledRef,
    gateState: gateStateRef,
    profileStatus: gateProfileStatusRef,
    unlockedDisplayName: gateDisplayNameRef,
    matchScore: gateMatchScoreRef,
    setGateEnabled: vi.fn((enabled: boolean) => {
      gateEnabledRef.value = enabled
    }),
    syncProfileFromPayload: vi.fn(() => {}),
    setLockedByProfile: vi.fn(() => {}),
    resetForCameraStop: vi.fn(() => {}),
    consumeJustMatchedWelcome: consumeJustMatchedWelcomeMock,
    evaluateFrame: evaluateFrameMock,
  }),
}))

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
    id: 'track-frame-loop',
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

function assertInteractionReady(
  interaction: ReturnType<typeof useVisionInteraction> | null,
): ReturnType<typeof useVisionInteraction> {
  if (!interaction)
    throw new Error('interaction should be initialized')
  return interaction
}

function resetInteractionMocks() {
  queuedFaceResults.length = 0
  queuedGestureResults.length = 0
  rafCallbacks.length = 0
  gateEnabledRef.value = false
  gateStateRef.value = 'disabled'
  gateProfileStatusRef.value = 'not_enrolled'
  gateDisplayNameRef.value = ''
  gateMatchScoreRef.value = null
  openCvStatusRef.value = 'ready'
  openCvErrorMessageRef.value = ''
  initializeOpenCvMock.mockReset()
  initializeOpenCvMock.mockImplementation(async () => {
    openCvStatusRef.value = 'ready'
    openCvErrorMessageRef.value = ''
  })
  markOpenCvFallbackMock.mockClear()
  resetOpenCvRuntimeMock.mockClear()
  evaluateFrameMock.mockReset()
  evaluateFrameMock.mockReturnValue({ status: 'no_face' })
  consumeJustMatchedWelcomeMock.mockReset()
  consumeJustMatchedWelcomeMock.mockReturnValue(false)
  evaluateFaceQualityMock.mockReset()
  evaluateFaceQualityMock.mockResolvedValue({
    accepted: true,
    qualityScore: 0.96,
    brightness: 130,
    sharpness: 32,
    contrast: 38,
    faceSize: 0.22,
  })
  saveEncryptedProfileMock.mockReset()
  saveEncryptedProfileMock.mockResolvedValue({ ok: true })
  recognizeForVideoMock.mockClear()
}

async function runNextAnimationFrame(nowMs: number, video: HTMLVideoElement, timeSeconds: number) {
  const callback = rafCallbacks.shift()
  if (!callback)
    throw new Error('requestAnimationFrame callback queue is empty')

  vi.setSystemTime(new Date(1_000 + nowMs))
  ;(video as any).currentTime = timeSeconds
  const framePromise = callback(nowMs)
  await vi.advanceTimersByTimeAsync(1)
  await framePromise
}

async function runQueuedFrames(options: {
  video: HTMLVideoElement
  gesture: string
  face: NormalizedLandmark[][]
  count: number
  startNowMs: number
  startTimeSeconds: number
  stepMs?: number
  blendshapeCategories?: Array<{ categoryName: string, score: number }>
}) {
  queueFrames({
    gesture: options.gesture,
    face: options.face,
    count: options.count,
    blendshapeCategories: options.blendshapeCategories,
  })

  const stepMs = options.stepMs ?? 200
  for (let index = 0; index < options.count; index += 1) {
    await runNextAnimationFrame(
      options.startNowMs + (stepMs * index),
      options.video,
      options.startTimeSeconds + index,
    )
  }
}

async function setupInteractionHarness(
  options?: Parameters<typeof useVisionInteraction>[0] & { gestureControlsEnabled?: boolean },
) {
  const { stream, videoTrack } = createMockStream()
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => stream) },
  })

  let interaction: ReturnType<typeof useVisionInteraction> | null = null
  const videoElement = createMockVideoElement()

  const host = defineComponent({
    setup() {
      interaction = useVisionInteraction({
        stableFrames: options?.stableFrames ?? 3,
        subjectPositionStableFrames: options?.subjectPositionStableFrames ?? 3,
        subjectDirectionDeadZoneX: options?.subjectDirectionDeadZoneX ?? 0.12,
        subjectDirectionDeadZoneY: options?.subjectDirectionDeadZoneY ?? 0.12,
        gestureStableFrames: options?.gestureStableFrames ?? 3,
        gestureInferenceIntervalMs: options?.gestureInferenceIntervalMs ?? 180,
        loopIntervalMs: options?.loopIntervalMs ?? 120,
      })
      interaction.setGestureControlsEnabled(options?.gestureControlsEnabled ?? true)
      interaction.attachVideoElement(videoElement)
      return () => h('div')
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  app.mount(container)

  const readyInteraction = assertInteractionReady(interaction)

  const prewarmPromise = readyInteraction.prewarmVisionModels()
  await vi.advanceTimersByTimeAsync(300)
  await prewarmPromise
  await readyInteraction.start()

  return {
    interaction: readyInteraction,
    videoElement,
    app,
    videoTrack,
  }
}

describe('useVisionInteraction behavior locks', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1_000))
    localStorage.removeItem('airi.vision-experiment.expression-signals-enabled.v1')
    resetInteractionMocks()
    await useVisionRuntime().resetVisionRuntime()
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(() => {}))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('waits for delayed video element attachment before enabling camera', async () => {
    const { stream } = createMockStream()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => stream) },
    })

    let interaction: ReturnType<typeof useVisionInteraction> | null = null
    const host = defineComponent({
      setup() {
        interaction = useVisionInteraction({
          stableFrames: 3,
          subjectPositionStableFrames: 2,
          loopIntervalMs: 120,
        })
        return () => h('div')
      },
    })

    const app = createApp(host)
    const container = document.createElement('div')
    app.mount(container)
    const readyInteraction = assertInteractionReady(interaction)
    const videoElement = createMockVideoElement()

    const prewarmPromise = readyInteraction.prewarmVisionModels()
    await vi.advanceTimersByTimeAsync(300)
    await prewarmPromise

    const startPromise = readyInteraction.start()
    await vi.advanceTimersByTimeAsync(120)
    readyInteraction.attachVideoElement(videoElement)
    await startPromise

    expect(readyInteraction.isEnabled.value).toBe(true)
    expect(readyInteraction.cameraState.value).toBe('active')

    await readyInteraction.stop()
    app.unmount()
  })

  it('reacts after robust vote + hold when fast gesture mode is enabled', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureStableFrames: 2,
      gestureInferenceIntervalMs: 80,
      loopIntervalMs: 80,
    })

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 8,
      startNowMs: 200,
      startTimeSeconds: 1,
      stepMs: 120,
    })
    expect(interaction.lastEvent.value?.type).not.toBe('quiet_mode_requested')

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 5,
      startNowMs: 1_200,
      startTimeSeconds: 9,
      stepMs: 120,
    })
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')
    const quietEventId = interaction.lastEvent.value?.id

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 6,
      startNowMs: 2_000,
      startTimeSeconds: 14,
      stepMs: 120,
    })
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')
    expect(interaction.lastEvent.value?.id).toBe(quietEventId)

    await interaction.stop()
    app.unmount()
  })

  it('does not run gesture inference when experimental gesture controls are disabled', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
      gestureInferenceIntervalMs: 80,
      loopIntervalMs: 80,
    })

    queueFrames({
      gesture: 'Victory',
      face: [createFaceAt(0.5, 0.5)],
      count: 1,
    })
    await runNextAnimationFrame(200, videoElement, 1)

    expect(recognizeForVideoMock).toHaveBeenCalledTimes(0)
    expect(interaction.lastGesture.value).toBe('none')
    expect(interaction.gestureState.value).toBe('idle')
    expect(interaction.lastEvent.value).toBeNull()

    await interaction.stop()
    app.unmount()
  })

  it('keeps OpenCV lazy during runtime prewarm and still evaluates face quality through fallback', async () => {
    openCvStatusRef.value = 'idle'

    const { interaction, videoElement, app } = await setupInteractionHarness()

    expect(initializeOpenCvMock).toHaveBeenCalledTimes(0)
    expect(interaction.openCvFaceQuality.status.value).toBe('idle')
    expect(evaluateFaceQualityMock).toHaveBeenCalledTimes(0)

    queueFrames({
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      count: 1,
    })
    await runNextAnimationFrame(200, videoElement, 1)

    expect(initializeOpenCvMock).toHaveBeenCalledTimes(0)
    expect(interaction.openCvFaceQuality.status.value).toBe('idle')
    expect(evaluateFaceQualityMock).toHaveBeenCalledTimes(1)

    await interaction.stop()
    app.unmount()
  })

  it('requires stable gesture frames and enforces gesture cooldowns', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 6,
      startNowMs: 200,
      startTimeSeconds: 1,
    })
    expect(interaction.lastEvent.value?.type).not.toBe('quiet_mode_requested')

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 6,
      startNowMs: 1_400,
      startTimeSeconds: 7,
    })
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')
    const firstEventId = interaction.lastEvent.value?.id ?? -1

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      count: 3,
      startNowMs: 2_200,
      startTimeSeconds: 11,
    })

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 12,
      startNowMs: 2_800,
      startTimeSeconds: 14,
    })
    expect(interaction.lastEvent.value?.id).toBe(firstEventId)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Unknown',
      face: [createFaceAt(0.5, 0.5)],
      count: 3,
      startNowMs: 5_400,
      startTimeSeconds: 27,
    })
    expect(interaction.lastGesture.value).toBe('open_palm')
    expect(interaction.lastEvent.value?.id).toBe(firstEventId)
    expect(interaction.lastEvent.value?.type).not.toBe('completion_celebration')

    await interaction.stop()
    app.unmount()
  })

  it('switches facePresence only after stable frames and welcome_back is emitted once with cooldown', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFrames({ gesture: 'None', face: [], count: 1 })
    await runNextAnimationFrame(200, videoElement, 1)
    expect(interaction.facePresence.value).toBe('unknown')

    queueFrames({ gesture: 'None', face: [], count: 2 })
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.facePresence.value).toBe('absent')
    expect(interaction.lastEvent.value?.type).toBe('user_away')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)
    expect(interaction.facePresence.value).toBe('present')
    expect(interaction.lastEvent.value?.type).toBe('welcome_back')
    const firstWelcomeId = interaction.lastEvent.value?.id ?? -1

    queueFrames({ gesture: 'None', face: [], count: 3 })
    await runNextAnimationFrame(1_400, videoElement, 7)
    await runNextAnimationFrame(1_600, videoElement, 8)
    await runNextAnimationFrame(1_800, videoElement, 9)
    expect(interaction.facePresence.value).toBe('absent')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(2_000, videoElement, 10)
    await runNextAnimationFrame(2_200, videoElement, 11)
    await runNextAnimationFrame(2_400, videoElement, 12)
    expect(interaction.facePresence.value).toBe('present')
    expect(interaction.lastEvent.value?.id).toBe(firstWelcomeId)

    await interaction.stop()
    app.unmount()
  })

  it('maps face direction with stable frames and falls back to unknown when no face', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 3 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.faceDirection.value).toBe('left')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.2, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)
    expect(interaction.faceDirection.value).toBe('right')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.2)], count: 3 })
    await runNextAnimationFrame(1_400, videoElement, 7)
    await runNextAnimationFrame(1_600, videoElement, 8)
    await runNextAnimationFrame(1_800, videoElement, 9)
    expect(interaction.faceDirection.value).toBe('up')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.8)], count: 3 })
    await runNextAnimationFrame(2_000, videoElement, 10)
    await runNextAnimationFrame(2_200, videoElement, 11)
    await runNextAnimationFrame(2_400, videoElement, 12)
    expect(interaction.faceDirection.value).toBe('down')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(2_600, videoElement, 13)
    await runNextAnimationFrame(2_800, videoElement, 14)
    await runNextAnimationFrame(3_000, videoElement, 15)
    expect(interaction.faceDirection.value).toBe('center')

    queueFrames({ gesture: 'None', face: [], count: 3 })
    await runNextAnimationFrame(3_200, videoElement, 16)
    await runNextAnimationFrame(3_400, videoElement, 17)
    await runNextAnimationFrame(3_600, videoElement, 18)
    expect(interaction.faceDirection.value).toBe('unknown')

    await interaction.stop()
    app.unmount()
  })

  it('detects near-center movement using tuned subject-position dead zone', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
      subjectPositionStableFrames: 2,
      subjectDirectionDeadZoneX: 0.09,
      subjectDirectionDeadZoneY: 0.1,
    })

    queueFrames({ gesture: 'None', face: [createFaceAt(0.595, 0.5)], count: 2 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)

    expect(interaction.faceDirection.value).toBe('left')
    expect(interaction.subjectPosition.value).toBe('left')
    expect(interaction.lastEvent.value?.type).toBe('user_moved_left')

    await interaction.stop()
    app.unmount()
  })

  it('uses fewer stable frames for subject position than expression signals', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      stableFrames: 5,
      gestureControlsEnabled: false,
      subjectPositionStableFrames: 2,
    })
    interaction.setExpressionSignalsEnabled(true)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.8, 0.5)],
      count: 2,
      startNowMs: 200,
      startTimeSeconds: 1,
      blendshapeCategories: [],
    })

    expect(interaction.faceDirection.value).toBe('left')
    expect(interaction.subjectPosition.value).toBe('left')
    expect(interaction.lastStableSubjectPosition.value).toBe('left')
    expect(interaction.subjectResponseState.value).toBe('following_left')
    expect(interaction.lastEvent.value?.type).toBe('user_moved_left')
    expect(interaction.stableExpressionSignal.value).toBe('none')
    expect(interaction.expressionSignalStableFrames.value).toBeLessThan(5)

    await interaction.stop()
    app.unmount()
  })

  it('emits subject-position response only after stable direction changes and prevents same-direction spam', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 1 })
    await runNextAnimationFrame(200, videoElement, 1)
    expect(interaction.faceDirection.value).toBe('unknown')
    expect(interaction.lastSubjectResponseEvent.value).toBeNull()
    expect(interaction.lastEvent.value).toBeNull()

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 2 })
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.faceDirection.value).toBe('left')
    expect(interaction.lastStableSubjectPosition.value).toBe('left')
    expect(interaction.subjectResponseState.value).toBe('following_left')
    expect(interaction.lastEvent.value?.type).toBe('user_moved_left')
    expect(interaction.lastEvent.value?.subjectPosition).toBe('left')
    const leftEventId = interaction.lastEvent.value?.id ?? -1

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)
    expect(interaction.lastEvent.value?.id).toBe(leftEventId)

    queueFrames({ gesture: 'None', face: [createFaceAt(0.2, 0.5)], count: 3 })
    await runNextAnimationFrame(1_400, videoElement, 7)
    await runNextAnimationFrame(1_600, videoElement, 8)
    await runNextAnimationFrame(1_800, videoElement, 9)
    expect(interaction.faceDirection.value).toBe('right')
    expect(interaction.lastStableSubjectPosition.value).toBe('right')
    expect(interaction.subjectResponseState.value).toBe('following_right')
    expect(interaction.lastEvent.value?.type).toBe('user_moved_right')
    expect(interaction.lastEvent.value?.subjectPosition).toBe('right')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(2_000, videoElement, 10)
    await runNextAnimationFrame(2_200, videoElement, 11)
    await runNextAnimationFrame(2_400, videoElement, 12)
    expect(interaction.faceDirection.value).toBe('center')
    expect(interaction.lastStableSubjectPosition.value).toBe('center')
    expect(interaction.subjectResponseState.value).toBe('centered')
    expect(interaction.lastEvent.value?.type).toBe('user_centered')
    expect(interaction.lastEvent.value?.subjectPosition).toBe('center')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 3 })
    await runNextAnimationFrame(2_600, videoElement, 13)
    await runNextAnimationFrame(2_800, videoElement, 14)
    await runNextAnimationFrame(3_000, videoElement, 15)
    expect(interaction.faceDirection.value).toBe('left')
    expect(interaction.lastEvent.value?.type).toBe('user_centered')

    await interaction.stop()
    app.unmount()
  })

  it('blocks subject-position response under gate lock and skips response for multiple/no face', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    gateEnabledRef.value = true
    gateStateRef.value = 'locked'
    gateProfileStatusRef.value = 'unmatched'

    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5)], count: 3 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.canTriggerSubjectPositionResponse.value).toBe(false)
    expect(interaction.lastEvent.value?.type).toBe('subject_position_gated')
    expect(interaction.lastEvent.value?.message).toBe('Subject position detected but gated.')
    expect(interaction.lastEvent.value?.subjectPosition).toBe('left')
    expect(interaction.subjectResponseState.value).toBe('gated')

    const gatedEventId = interaction.lastEvent.value?.id ?? -1
    gateProfileStatusRef.value = 'multiple_faces'
    queueFrames({ gesture: 'None', face: [createFaceAt(0.8, 0.5), createFaceAt(0.2, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)
    expect(interaction.faceDirection.value).toBe('unknown')
    expect(interaction.lastEvent.value?.id).toBe(gatedEventId)

    gateProfileStatusRef.value = 'no_face'
    queueFrames({ gesture: 'None', face: [], count: 3 })
    await runNextAnimationFrame(1_400, videoElement, 7)
    await runNextAnimationFrame(1_600, videoElement, 8)
    await runNextAnimationFrame(1_800, videoElement, 9)
    expect(interaction.faceDirection.value).toBe('unknown')
    expect(interaction.subjectPosition.value).toBe('unknown')
    expect(interaction.lastStableSubjectPosition.value).toBe('unknown')
    expect(interaction.lastEvent.value?.id).toBe(gatedEventId)

    await interaction.stop()
    app.unmount()
  })

  it('does not accumulate looking-away duration across away-direction flips', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
    })
    interaction.setExpressionSignalsEnabled(true)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.8, 0.5)],
      count: 20,
      startNowMs: 200,
      startTimeSeconds: 1,
      blendshapeCategories: [],
    })
    expect(interaction.lastEvent.value?.type).toBe('user_moved_left')

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.2, 0.5)],
      count: 10,
      startNowMs: 4_400,
      startTimeSeconds: 21,
      blendshapeCategories: [],
    })

    expect(interaction.faceDirection.value).toBe('right')
    expect(interaction.lastEvent.value?.type).toBe('user_moved_right')
    expect(interaction.lastEvent.value?.type).not.toBe('expression_looking_away_detected')

    await interaction.stop()
    app.unmount()
  })

  it('stabilizes expression signal for five frames before emitting smile-like feedback event', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
    })
    interaction.setExpressionSignalsEnabled(true)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      blendshapeCategories: createSmileBlendshapeCategories(),
      count: 4,
      startNowMs: 200,
      startTimeSeconds: 1,
    })
    expect(interaction.stableExpressionSignal.value).toBe('none')
    expect(interaction.expressionSignalStableFrames.value).toBeLessThan(5)
    expect(interaction.lastEvent.value?.type).not.toBe('expression_smile_like_detected')

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      blendshapeCategories: createSmileBlendshapeCategories(),
      count: 1,
      startNowMs: 1_000,
      startTimeSeconds: 5,
    })
    expect(interaction.stableExpressionSignal.value).toBe('smile_like_signal')
    expect(interaction.expressionSignalFeedbackAllowed.value).toBe(true)
    expect(interaction.expressionSignalConfidence.value).toBeGreaterThanOrEqual(0.45)
    expect(interaction.lastEvent.value?.type).toBe('expression_smile_like_detected')

    await interaction.stop()
    app.unmount()
  })

  it('keeps expression feedback disabled when expression signals toggle is off', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
    })
    interaction.setExpressionSignalsEnabled(false)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      blendshapeCategories: createSmileBlendshapeCategories(),
      count: 6,
      startNowMs: 200,
      startTimeSeconds: 1,
    })

    expect(interaction.expressionSignal.value).toBe('none')
    expect(interaction.stableExpressionSignal.value).toBe('none')
    expect(interaction.expressionSignalReason.value).toBe('Expression signals are disabled.')
    expect(interaction.expressionSignalFeedbackAllowed.value).toBe(false)
    expect(interaction.lastEvent.value?.type).not.toBe('expression_smile_like_detected')

    await interaction.stop()
    app.unmount()
  })

  it('detects expression signal but blocks expression feedback when face gate is locked', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureControlsEnabled: false,
    })
    interaction.setExpressionSignalsEnabled(true)
    gateEnabledRef.value = true
    gateStateRef.value = 'locked'
    gateProfileStatusRef.value = 'unmatched'
    evaluateFrameMock.mockReturnValue({ status: 'unmatched' } as any)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      blendshapeCategories: createSmileBlendshapeCategories(),
      count: 6,
      startNowMs: 200,
      startTimeSeconds: 1,
    })

    expect(interaction.expressionSignal.value).toBe('smile_like_signal')
    expect(interaction.stableExpressionSignal.value).toBe('smile_like_signal')
    expect(interaction.expressionSignalFeedbackAllowed.value).toBe(false)
    expect(interaction.lastEvent.value?.type).toBe('subject_position_gated')
    expect(interaction.lastEvent.value?.type).not.toBe('expression_smile_like_detected')

    await interaction.stop()
    app.unmount()
  })

  it('respects gate integration for allowed and gated gestures', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    gateEnabledRef.value = false
    gateStateRef.value = 'disabled'
    await runQueuedFrames({
      video: videoElement,
      gesture: 'Victory',
      face: [createFaceAt(0.5, 0.5)],
      count: 12,
      startNowMs: 200,
      startTimeSeconds: 1,
    })
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(1)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      count: 3,
      startNowMs: 2_200,
      startTimeSeconds: 11,
    })

    gateEnabledRef.value = true
    gateStateRef.value = 'enabled'
    await runQueuedFrames({
      video: videoElement,
      gesture: 'Victory',
      face: [createFaceAt(0.5, 0.5)],
      count: 12,
      startNowMs: 6_400,
      startTimeSeconds: 14,
    })
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(2)

    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [createFaceAt(0.5, 0.5)],
      count: 3,
      startNowMs: 8_600,
      startTimeSeconds: 24,
    })

    gateEnabledRef.value = true
    gateStateRef.value = 'gated'
    await runQueuedFrames({
      video: videoElement,
      gesture: 'Victory',
      face: [createFaceAt(0.5, 0.5), createFaceAt(0.2, 0.5)],
      count: 12,
      startNowMs: 12_200,
      startTimeSeconds: 27,
    })
    expect(interaction.lastEvent.value?.type).toBe('detected_but_gated')
    expect(interaction.lastEvent.value?.message).toBe('Victory detected but gated')
    expect(interaction.localCelebrationCount.value).toBe(2)

    gateStateRef.value = 'locked'
    await runQueuedFrames({
      video: videoElement,
      gesture: 'None',
      face: [],
      count: 10,
      startNowMs: 14_400,
      startTimeSeconds: 37,
    })
    await runQueuedFrames({
      video: videoElement,
      gesture: 'Open_Palm',
      face: [],
      count: 12,
      startNowMs: 16_600,
      startTimeSeconds: 47,
    })
    expect(interaction.lastEvent.value?.type).toBe('detected_but_gated')
    expect(interaction.lastEvent.value?.message).toContain('gated')
    expect(interaction.localCelebrationCount.value).toBe(2)

    await interaction.stop()
    app.unmount()
  })

  it('triggers nothing_to_confirm on thumbs_up when there is no active prompt', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Thumb_Up',
      face: [createFaceAt(0.5, 0.5)],
      count: 12,
      startNowMs: 200,
      startTimeSeconds: 1,
    })
    expect(interaction.lastEvent.value?.type).toBe('nothing_to_confirm')
    expect(interaction.acknowledgedEventId.value).toBeNull()
    expect(interaction.activePrompt.value).toBe('')

    await interaction.stop()
    app.unmount()
  })

  it('keeps basic gesture recognition available when OpenCV is in fallback mode', async () => {
    openCvStatusRef.value = 'fallback'
    evaluateFaceQualityMock.mockResolvedValue({
      accepted: true,
      qualityScore: 0.82,
      brightness: 118,
      sharpness: 24,
      contrast: 28,
      faceSize: 0.21,
    })

    const { interaction, videoElement, app } = await setupInteractionHarness()
    const stableFace = [createFaceAt(0.5, 0.5)]

    await runQueuedFrames({
      video: videoElement,
      gesture: 'Victory',
      face: stableFace,
      count: 12,
      startNowMs: 200,
      startTimeSeconds: 1,
    })

    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.lastGesture.value).toBe('victory')
    expect(interaction.localCelebrationCount.value).toBe(1)
    expect(interaction.openCvFaceQuality.status.value).toBe('fallback')
    expect(initializeOpenCvMock).toHaveBeenCalledTimes(0)
    expect(evaluateFaceQualityMock).toHaveBeenCalledTimes(6)
    expect(evaluateFaceQualityMock).toHaveBeenNthCalledWith(1, videoElement, stableFace[0])
    expect(evaluateFaceQualityMock).toHaveBeenNthCalledWith(6, videoElement, stableFace[0])

    await interaction.stop()
    app.unmount()
  })

  it('recognizes victory when None is the first candidate but Victory is still present', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFramesWithGestureCandidates({
      candidates: [
        { categoryName: 'None', score: 0.95 },
        { categoryName: 'Victory', score: 0.83 },
      ],
      face: [createFaceAt(0.5, 0.5)],
      handLandmarks: [createVictoryHandLandmarks()],
      handedness: 'Right',
      count: 12,
    })
    for (let index = 0; index < 12; index += 1)
      await runNextAnimationFrame(200 + (200 * index), videoElement, index + 1)

    expect(interaction.lastGesture.value).toBe('victory')
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(1)

    await interaction.stop()
    app.unmount()
  })

  it('does not promote none-only classifier output even when landmarks resemble victory', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFramesWithGestureCandidates({
      candidates: [
        { categoryName: 'None', score: 0.91 },
      ],
      face: [createFaceAt(0.5, 0.5)],
      handLandmarks: [createVictoryHandLandmarks()],
      handedness: 'Right',
      count: 12,
    })
    for (let index = 0; index < 12; index += 1)
      await runNextAnimationFrame(200 + (200 * index), videoElement, index + 1)

    expect(interaction.lastGesture.value).toBe('none')
    expect(interaction.lastEvent.value?.type).toBe('user_centered')
    expect(interaction.localCelebrationCount.value).toBe(0)

    await interaction.stop()
    app.unmount()
  })

  it('rejects enrollment when captured samples stay below quality threshold', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 1 })
    await runNextAnimationFrame(200, videoElement, 1)

    evaluateFaceQualityMock.mockResolvedValue({
      accepted: false,
      qualityScore: 0.1,
      brightness: 18,
      sharpness: 2,
      contrast: 3,
      faceSize: 0.21,
    })

    const enrollPromise = interaction.enrollLocalFaceProfile({
      displayName: 'Alice',
      passphrase: 'test-passphrase',
      threshold: 0.42,
      qualityThreshold: 0.45,
      stableFrames: 3,
      enrollSampleCount: 5,
    })
    await vi.advanceTimersByTimeAsync(2_200)
    const result = await enrollPromise

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.reason).toBe('low quality')
    expect(evaluateFaceQualityMock).toHaveBeenCalledTimes(16)
    expect(saveEncryptedProfileMock).toHaveBeenCalledTimes(0)

    await interaction.stop()
    app.unmount()
  })

  it('cancels enrollment when camera is stopped midway and never persists half profile', async () => {
    const { interaction, videoElement, app, videoTrack } = await setupInteractionHarness()

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 1 })
    await runNextAnimationFrame(200, videoElement, 1)

    evaluateFaceQualityMock.mockResolvedValue({
      accepted: true,
      qualityScore: 0.95,
      brightness: 132,
      sharpness: 33,
      contrast: 39,
      faceSize: 0.24,
    })

    const enrollPromise = interaction.enrollLocalFaceProfile({
      displayName: 'Alice',
      passphrase: 'test-passphrase',
      threshold: 0.42,
      qualityThreshold: 0.45,
      stableFrames: 3,
      enrollSampleCount: 6,
    })

    await vi.advanceTimersByTimeAsync(320)
    await interaction.stop()
    await vi.advanceTimersByTimeAsync(800)
    const result = await enrollPromise

    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(result.reason).toBe('enrollment cancelled')
    expect(saveEncryptedProfileMock).toHaveBeenCalledTimes(0)
    expect(interaction.cameraState.value).toBe('off')
    expect(videoTrack.stop).toHaveBeenCalledTimes(1)

    app.unmount()
  })
})
