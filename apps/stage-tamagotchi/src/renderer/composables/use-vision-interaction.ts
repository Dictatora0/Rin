import type { Category, FaceLandmarkerResult, GestureRecognizerResult } from '@mediapipe/tasks-vision'

import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from '@mediapipe/tasks-vision'
import { errorMessageFrom } from '@moeru/std'
import {
  onBeforeUnmount,
  ref,
  shallowRef,
} from 'vue'

/**
 * Camera lifecycle states exposed to the Vision Island UI.
 */
export type VisionCameraState = 'off' | 'loading' | 'active' | 'error'

/**
 * Face presence state for lightweight in-seat detection.
 */
export type VisionFacePresence = 'present' | 'absent' | 'unknown'

/**
 * Normalized gesture ids surfaced to the experiment UI.
 */
export type VisionGesture = 'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'

/**
 * Lightweight experiment event stream emitted by the recognizer loop.
 */
export type VisionInteractionEventType
  = | 'welcome_back'
    | 'palm_detected'
    | 'victory_detected'
    | 'thumb_up_detected'

/**
 * A single interaction event record with timestamp.
 */
export interface VisionInteractionEvent {
  type: VisionInteractionEventType
  message: string
  at: number
}

/**
 * Runtime options for stability and cooldown controls.
 */
export interface VisionInteractionOptions {
  /** Consecutive frames required to confirm one recognition state. @default 3 */
  stableFrames?: number
  /** Minimum interval between identical events in milliseconds. @default 2000 */
  eventCooldownMs?: number
  /** Target inference interval to avoid over-frequent processing. @default 120 */
  loopIntervalMs?: number
}

const DEFAULT_OPTIONS: Required<VisionInteractionOptions> = {
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
}

const FACE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const GESTURE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
const WASM_ROOT_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const WASM_ESM_LOADER_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_module_internal.js'
const WASM_BINARY_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_internal.wasm'

/**
 * Runs an isolated local-only vision interaction experiment.
 *
 * Use when:
 * - A renderer feature needs camera + face presence + canned gestures
 * - We must keep all processing local and avoid storing media
 *
 * Expects:
 * - Browser/Electron renderer supports `getUserMedia`
 * - Network can fetch MediaPipe wasm/model assets once
 *
 * Returns:
 * - Reactive camera/recognition state and start/stop controls for Vision Island
 */
export function useVisionInteraction(options?: VisionInteractionOptions) {
  const runtimeOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const isEnabled = ref(false)
  const cameraState = ref<VisionCameraState>('off')
  const facePresence = ref<VisionFacePresence>('unknown')
  const lastGesture = ref<VisionGesture>('none')
  const lastEvent = ref<VisionInteractionEvent | null>(null)
  const errorMessage = ref('')

  const stream = shallowRef<MediaStream | null>(null)
  const videoElement = shallowRef<HTMLVideoElement | null>(null)

  let faceLandmarker: FaceLandmarker | null = null
  let gestureRecognizer: GestureRecognizer | null = null
  let rafId: number | null = null
  let lastLoopAtMs = 0
  let recognizerInitialized = false

  // Stability counters for face presence transitions.
  let presentFrameStreak = 0
  let absentFrameStreak = 0

  // Stability counters for gestures.
  let candidateGesture: VisionGesture = 'none'
  let candidateGestureFrames = 0

  const cooldownByEventType = new Map<VisionInteractionEventType, number>()

  function setError(nextError: unknown) {
    errorMessage.value = errorMessageFrom(nextError) ?? 'Vision initialization failed'
    cameraState.value = 'error'
  }

  function clearLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function stopTracks() {
    const currentStream = stream.value
    if (!currentStream)
      return

    currentStream.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  function clearVideoBinding() {
    const video = videoElement.value
    if (!video)
      return

    try {
      video.pause()
    }
    catch {
      // ignore pause errors from detached elements
    }

    video.srcObject = null
    video.load()
  }

  function resetFrameState() {
    presentFrameStreak = 0
    absentFrameStreak = 0
    candidateGesture = 'none'
    candidateGestureFrames = 0
    lastGesture.value = 'none'
  }

  function cleanupRecognizers() {
    try {
      faceLandmarker?.close()
    }
    catch {
      // noop
    }

    try {
      gestureRecognizer?.close()
    }
    catch {
      // noop
    }

    faceLandmarker = null
    gestureRecognizer = null
    recognizerInitialized = false
  }

  function cleanupAll() {
    clearLoop()
    cleanupRecognizers()
    stopTracks()
    clearVideoBinding()
    resetFrameState()
    isEnabled.value = false
  }

  function normalizeGestureName(categoryName: string | null | undefined): VisionGesture {
    if (!categoryName)
      return 'none'

    const normalized = categoryName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')

    if (normalized === 'none')
      return 'none'

    if (normalized === 'open_palm')
      return 'open_palm'

    if (normalized === 'victory')
      return 'victory'

    if (normalized === 'thumb_up' || normalized === 'thumbs_up')
      return 'thumbs_up'

    return 'unknown'
  }

  function extractTopGesture(result: GestureRecognizerResult): VisionGesture {
    const topCategory = result.gestures?.[0]?.[0] as Category | undefined
    return normalizeGestureName(topCategory?.categoryName)
  }

  function canEmitEvent(type: VisionInteractionEventType, nowMs: number) {
    const lastAt = cooldownByEventType.get(type) ?? Number.NEGATIVE_INFINITY
    return nowMs - lastAt >= runtimeOptions.eventCooldownMs
  }

  function emitEvent(type: VisionInteractionEventType, message: string, nowMs: number) {
    if (!canEmitEvent(type, nowMs))
      return

    cooldownByEventType.set(type, nowMs)
    lastEvent.value = {
      type,
      message,
      at: nowMs,
    }
  }

  function applyFacePresence(landmarkerResult: FaceLandmarkerResult, nowMs: number) {
    const hasFace = (landmarkerResult.faceLandmarks?.length ?? 0) > 0

    if (hasFace) {
      presentFrameStreak += 1
      absentFrameStreak = 0
    }
    else {
      absentFrameStreak += 1
      presentFrameStreak = 0
    }

    if (hasFace && presentFrameStreak >= runtimeOptions.stableFrames && facePresence.value !== 'present') {
      const previous = facePresence.value
      facePresence.value = 'present'

      if (previous === 'absent') {
        emitEvent('welcome_back', 'Welcome back', nowMs)
      }
    }

    if (!hasFace && absentFrameStreak >= runtimeOptions.stableFrames && facePresence.value !== 'absent') {
      facePresence.value = 'absent'
    }
  }

  function applyGesture(gesture: VisionGesture, nowMs: number) {
    if (gesture === candidateGesture) {
      candidateGestureFrames += 1
    }
    else {
      candidateGesture = gesture
      candidateGestureFrames = 1
    }

    if (candidateGestureFrames < runtimeOptions.stableFrames)
      return

    if (gesture === 'none') {
      lastGesture.value = 'none'
      return
    }

    lastGesture.value = gesture

    if (gesture === 'open_palm')
      emitEvent('palm_detected', 'Palm detected', nowMs)
    else if (gesture === 'victory')
      emitEvent('victory_detected', 'Victory detected', nowMs)
    else if (gesture === 'thumbs_up')
      emitEvent('thumb_up_detected', 'Thumb up detected', nowMs)
  }

  async function ensureRecognizers() {
    if (recognizerInitialized)
      return

    const fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> = await FilesetResolver.forVisionTasks(WASM_ROOT_URL)
      .catch(async () => {
        // NOTICE:
        // Some bundled/Electron environments cannot resolve MediaPipe's loader
        // from a computed base path string. We provide explicit WASM file URLs
        // so initialization can still proceed with the same package/runtime.
        //
        // Removal condition:
        // Remove this fallback once `forVisionTasks(WASM_ROOT_URL)` is confirmed
        // to be stable across all target build/runtime modes.
        return {
          wasmLoaderPath: WASM_ESM_LOADER_URL,
          wasmBinaryPath: WASM_BINARY_URL,
        }
      })

    faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_ASSET_URL },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    })

    gestureRecognizer = await GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: GESTURE_MODEL_ASSET_URL },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    recognizerInitialized = true
  }

  function bindVideoStream(nextStream: MediaStream) {
    const video = videoElement.value
    if (!video)
      throw new Error('Vision video element is not attached')

    video.srcObject = nextStream
    video.muted = true
    video.playsInline = true
  }

  async function startLoop() {
    const video = videoElement.value
    if (!video || !faceLandmarker || !gestureRecognizer)
      return

    const tick = async (nowMs: number) => {
      if (!isEnabled.value)
        return

      if (nowMs - lastLoopAtMs < runtimeOptions.loopIntervalMs) {
        rafId = requestAnimationFrame(tick)
        return
      }

      lastLoopAtMs = nowMs

      try {
        if (video.readyState >= 2) {
          const faceResult = faceLandmarker.detectForVideo(video, nowMs)
          applyFacePresence(faceResult, nowMs)

          const gestureResult = gestureRecognizer.recognizeForVideo(video, nowMs)
          const topGesture = extractTopGesture(gestureResult)
          applyGesture(topGesture, nowMs)
        }
      }
      catch (caughtError) {
        setError(caughtError)
        await stop()
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  async function start() {
    if (isEnabled.value)
      return

    errorMessage.value = ''
    cameraState.value = 'loading'
    facePresence.value = 'unknown'
    lastGesture.value = 'none'
    lastEvent.value = null
    resetFrameState()

    try {
      await ensureRecognizers()

      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      })

      stream.value = nextStream
      bindVideoStream(nextStream)

      const video = videoElement.value
      if (!video)
        throw new Error('Vision video element is not attached')

      await video.play()

      isEnabled.value = true
      cameraState.value = 'active'
      await startLoop()
    }
    catch (caughtError) {
      setError(caughtError)
      cleanupAll()
    }
  }

  async function stop() {
    isEnabled.value = false
    clearLoop()
    stopTracks()
    clearVideoBinding()
    resetFrameState()
    facePresence.value = 'unknown'
    cameraState.value = 'off'
  }

  function attachVideoElement(element: HTMLVideoElement | null) {
    videoElement.value = element
  }

  onBeforeUnmount(() => {
    cleanupAll()
  })

  return {
    isEnabled,
    cameraState,
    facePresence,
    lastGesture,
    lastEvent,
    errorMessage,
    attachVideoElement,
    start,
    stop,
  }
}
