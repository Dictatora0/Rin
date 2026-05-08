// @vitest-environment jsdom

import type { FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

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

const {
  openCvStatusRef,
  openCvErrorMessageRef,
  initializeOpenCvMock,
  markOpenCvFallbackMock,
  resetOpenCvRuntimeMock,
  evaluateFaceQualityMock,
} = interactionBehaviorHarness

const evaluateFrameMock = vi.fn(() => ({ status: 'no_face' as const }))
const consumeJustMatchedWelcomeMock = vi.fn(() => false)
const saveEncryptedProfileMock = vi.fn(async () => ({ ok: true as const }))

function createFaceLandmarkerResult(landmarks: NormalizedLandmark[][]): FaceLandmarkerResult {
  return { faceLandmarks: landmarks } as FaceLandmarkerResult
}

function createGestureRecognizerResult(categoryName: string): GestureRecognizerResult {
  return {
    gestures: [[{ categoryName }]],
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

function queueFrames(options: {
  gesture: string
  face: NormalizedLandmark[][]
  count: number
}) {
  for (let i = 0; i < options.count; i += 1) {
    queuedFaceResults.push(createFaceLandmarkerResult(options.face))
    queuedGestureResults.push(createGestureRecognizerResult(options.gesture))
  }
}

function queueFramesWithGestureCandidates(options: {
  candidates: Array<{ categoryName: string, score?: number }>
  face: NormalizedLandmark[][]
  count: number
  handLandmarks?: NormalizedLandmark[][]
  handedness?: string
}) {
  for (let i = 0; i < options.count; i += 1) {
    queuedFaceResults.push(createFaceLandmarkerResult(options.face))
    queuedGestureResults.push(createGestureRecognizerResultWithCandidates({
      candidates: options.candidates,
      landmarks: options.handLandmarks,
      handedness: options.handedness,
    }))
  }
}

function createVictoryHandLandmarks(): NormalizedLandmark[] {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.7, z: 0.01, visibility: 0 } as NormalizedLandmark))
  points[0] = { x: 0.5, y: 0.82, z: 0.01, visibility: 0 } // wrist
  points[1] = { x: 0.44, y: 0.78, z: 0.01, visibility: 0 }
  points[2] = { x: 0.41, y: 0.73, z: 0.01, visibility: 0 } // thumb mcp
  points[3] = { x: 0.38, y: 0.68, z: 0.01, visibility: 0 } // thumb ip
  points[4] = { x: 0.34, y: 0.63, z: 0.01, visibility: 0 } // thumb tip
  points[5] = { x: 0.45, y: 0.67, z: 0.01, visibility: 0 } // index mcp
  points[6] = { x: 0.44, y: 0.53, z: 0.01, visibility: 0 } // index pip
  points[7] = { x: 0.43, y: 0.45, z: 0.01, visibility: 0 }
  points[8] = { x: 0.42, y: 0.36, z: 0.01, visibility: 0 } // index tip
  points[9] = { x: 0.52, y: 0.68, z: 0.01, visibility: 0 } // middle mcp
  points[10] = { x: 0.53, y: 0.54, z: 0.01, visibility: 0 } // middle pip
  points[11] = { x: 0.54, y: 0.45, z: 0.01, visibility: 0 }
  points[12] = { x: 0.55, y: 0.35, z: 0.01, visibility: 0 } // middle tip
  points[13] = { x: 0.58, y: 0.69, z: 0.01, visibility: 0 } // ring mcp
  points[14] = { x: 0.60, y: 0.73, z: 0.01, visibility: 0 } // ring pip
  points[15] = { x: 0.61, y: 0.76, z: 0.01, visibility: 0 }
  points[16] = { x: 0.62, y: 0.79, z: 0.01, visibility: 0 } // ring tip
  points[17] = { x: 0.64, y: 0.70, z: 0.01, visibility: 0 } // pinky mcp
  points[18] = { x: 0.66, y: 0.74, z: 0.01, visibility: 0 } // pinky pip
  points[19] = { x: 0.67, y: 0.77, z: 0.01, visibility: 0 }
  points[20] = { x: 0.68, y: 0.80, z: 0.01, visibility: 0 } // pinky tip
  return points
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
        recognizeForVideo: vi.fn(() => {
          return queuedGestureResults.shift() ?? createGestureRecognizerResult('None')
        }),
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

async function setupInteractionHarness(options?: Parameters<typeof useVisionInteraction>[0]) {
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
        gestureStableFrames: options?.gestureStableFrames ?? 3,
        gestureInferenceIntervalMs: options?.gestureInferenceIntervalMs ?? 180,
        loopIntervalMs: options?.loopIntervalMs ?? 120,
      })
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

  it('reacts on the second stable frame when fast gesture mode is enabled', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness({
      gestureStableFrames: 2,
      gestureInferenceIntervalMs: 80,
      loopIntervalMs: 80,
    })

    queueFrames({
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 1,
    })
    await runNextAnimationFrame(200, videoElement, 1)
    expect(interaction.lastEvent.value).toBeNull()

    queueFrames({
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 1,
    })
    await runNextAnimationFrame(320, videoElement, 2)
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')

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

    queueFrames({
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 2,
    })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    expect(interaction.lastEvent.value).toBeNull()

    queueFrames({
      gesture: 'Open_Palm',
      face: [createFaceAt(0.5, 0.5)],
      count: 1,
    })
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')
    const firstEventId = interaction.lastEvent.value?.id ?? -1

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)

    queueFrames({ gesture: 'Open_Palm', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(1_400, videoElement, 7)
    await runNextAnimationFrame(1_600, videoElement, 8)
    await runNextAnimationFrame(1_800, videoElement, 9)
    expect(interaction.lastEvent.value?.id).toBe(firstEventId)

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(2_000, videoElement, 10)
    await runNextAnimationFrame(2_200, videoElement, 11)
    await runNextAnimationFrame(2_400, videoElement, 12)

    queueFrames({ gesture: 'Open_Palm', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_200, videoElement, 13)
    await runNextAnimationFrame(3_400, videoElement, 14)
    await runNextAnimationFrame(3_600, videoElement, 15)
    expect(interaction.lastEvent.value?.type).toBe('quiet_mode_requested')
    expect((interaction.lastEvent.value?.id ?? -1)).toBeGreaterThan(firstEventId)

    queueFrames({ gesture: 'Unknown', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_800, videoElement, 16)
    await runNextAnimationFrame(4_000, videoElement, 17)
    await runNextAnimationFrame(4_200, videoElement, 18)
    expect(interaction.lastGesture.value).toBe('unknown')
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

  it('respects gate integration for allowed and gated gestures', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    gateEnabledRef.value = false
    gateStateRef.value = 'disabled'
    queueFrames({ gesture: 'Victory', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(1)

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)

    gateEnabledRef.value = true
    gateStateRef.value = 'enabled'
    queueFrames({ gesture: 'Victory', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_200, videoElement, 7)
    await runNextAnimationFrame(3_400, videoElement, 8)
    await runNextAnimationFrame(3_600, videoElement, 9)
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(2)

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_800, videoElement, 10)
    await runNextAnimationFrame(4_000, videoElement, 11)
    await runNextAnimationFrame(4_200, videoElement, 12)

    gateEnabledRef.value = true
    gateStateRef.value = 'gated'
    queueFrames({ gesture: 'Victory', face: [createFaceAt(0.5, 0.5), createFaceAt(0.2, 0.5)], count: 3 })
    await runNextAnimationFrame(6_600, videoElement, 13)
    await runNextAnimationFrame(6_800, videoElement, 14)
    await runNextAnimationFrame(7_000, videoElement, 15)
    expect(interaction.lastEvent.value?.type).toBe('detected_but_gated')
    expect(interaction.lastEvent.value?.message).toBe('Victory detected but gated')
    expect(interaction.localCelebrationCount.value).toBe(2)

    gateStateRef.value = 'locked'
    queueFrames({ gesture: 'Open_Palm', face: [], count: 3 })
    await runNextAnimationFrame(9_400, videoElement, 16)
    await runNextAnimationFrame(9_600, videoElement, 17)
    await runNextAnimationFrame(9_800, videoElement, 18)
    expect(interaction.lastEvent.value?.type).toBe('detected_but_gated')
    expect(interaction.lastEvent.value?.message).toBe('Open palm detected but gated')
    expect(interaction.localCelebrationCount.value).toBe(2)

    await interaction.stop()
    app.unmount()
  })

  it('acknowledges current prompt once on thumbs_up and then emits nothing_to_confirm', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFrames({ gesture: 'Victory', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    const celebrationEventId = interaction.lastEvent.value?.id
    expect(celebrationEventId).not.toBeUndefined()
    expect(interaction.activePrompt.value).toBe('Completion celebration')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(800, videoElement, 4)
    await runNextAnimationFrame(1_000, videoElement, 5)
    await runNextAnimationFrame(1_200, videoElement, 6)

    queueFrames({ gesture: 'Thumb_Up', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_200, videoElement, 7)
    await runNextAnimationFrame(3_400, videoElement, 8)
    await runNextAnimationFrame(3_600, videoElement, 9)
    expect(interaction.lastEvent.value?.type).toBe('acknowledged')
    expect(interaction.acknowledgedEventId.value).toBe(celebrationEventId)
    expect(interaction.activePrompt.value).toBe('')

    queueFrames({ gesture: 'None', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(3_800, videoElement, 10)
    await runNextAnimationFrame(4_000, videoElement, 11)
    await runNextAnimationFrame(4_200, videoElement, 12)

    queueFrames({ gesture: 'Thumb_Up', face: [createFaceAt(0.5, 0.5)], count: 3 })
    await runNextAnimationFrame(6_400, videoElement, 13)
    await runNextAnimationFrame(6_600, videoElement, 14)
    await runNextAnimationFrame(6_800, videoElement, 15)
    expect(interaction.lastEvent.value?.type).toBe('nothing_to_confirm')

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

    queueFrames({ gesture: 'Victory', face: stableFace, count: 3 })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)

    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.lastGesture.value).toBe('victory')
    expect(interaction.localCelebrationCount.value).toBe(1)
    expect(interaction.openCvFaceQuality.status.value).toBe('fallback')
    expect(initializeOpenCvMock).toHaveBeenCalledTimes(0)
    expect(evaluateFaceQualityMock).toHaveBeenCalledTimes(2)
    expect(evaluateFaceQualityMock).toHaveBeenNthCalledWith(1, videoElement, stableFace[0])
    expect(evaluateFaceQualityMock).toHaveBeenNthCalledWith(2, videoElement, stableFace[0])

    await interaction.stop()
    app.unmount()
  })

  it('recognizes victory when None is the first candidate but Victory is still present', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFramesWithGestureCandidates({
      candidates: [
        { categoryName: 'None', score: 0.71 },
        { categoryName: 'Victory', score: 0.63 },
      ],
      face: [createFaceAt(0.5, 0.5)],
      count: 3,
    })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)

    expect(interaction.lastGesture.value).toBe('victory')
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(1)

    await interaction.stop()
    app.unmount()
  })

  it('uses landmark heuristic fallback when category candidates are None but hand shape is Victory', async () => {
    const { interaction, videoElement, app } = await setupInteractionHarness()

    queueFramesWithGestureCandidates({
      candidates: [
        { categoryName: 'None', score: 0.61 },
      ],
      face: [createFaceAt(0.5, 0.5)],
      handLandmarks: [createVictoryHandLandmarks()],
      handedness: 'Right',
      count: 3,
    })
    await runNextAnimationFrame(200, videoElement, 1)
    await runNextAnimationFrame(400, videoElement, 2)
    await runNextAnimationFrame(600, videoElement, 3)

    expect(interaction.lastGesture.value).toBe('victory')
    expect(interaction.lastEvent.value?.type).toBe('completion_celebration')
    expect(interaction.localCelebrationCount.value).toBe(1)

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
