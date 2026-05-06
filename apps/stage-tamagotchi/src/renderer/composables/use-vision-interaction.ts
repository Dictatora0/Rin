import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from '@mediapipe/tasks-vision'
import { errorMessageFrom } from '@moeru/std'
import {
  computed,
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
 * Coarse face-position tracking directions.
 */
export type VisionFaceDirection = 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'

/**
 * Normalized gesture ids surfaced to the experiment UI.
 */
export type VisionGesture = 'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'

/**
 * Lightweight experiment event stream emitted by the recognizer loop.
 */
export type VisionInteractionEventType
  = | 'quiet_mode_requested'
    | 'completion_celebration'
    | 'acknowledged'
    | 'nothing_to_confirm'
    | 'user_away'
    | 'welcome_back'
    | 'user_moved_left'
    | 'user_moved_right'
    | 'user_moved_up'
    | 'user_moved_down'

/**
 * A single interaction event record with timestamp.
 */
export interface VisionInteractionEvent {
  id: number
  type: VisionInteractionEventType
  message: string
  at: number
  toastMessage?: string
}

/**
 * Runtime options for stability and cooldown controls.
 */
export interface VisionInteractionOptions {
  /** Consecutive frames required to confirm one recognition state. @default 3 */
  stableFrames?: number
  /** Minimum interval between repeated events in milliseconds. @default 2000 */
  eventCooldownMs?: number
  /** Target inference interval to avoid over-frequent processing. @default 120 */
  loopIntervalMs?: number
  /** Quiet-mode duration for open palm gesture. @default 60000 */
  quietDurationMs?: number
  /** Cooldown for welcome-back event after re-entry. @default 8000 */
  welcomeBackCooldownMs?: number
  /** Cooldown for celebration gesture feedback. @default 4000 */
  celebrationCooldownMs?: number
  /** Force an inference if frame-time appears stalled for too long. @default 1200 */
  maxInferenceStallMs?: number
}

interface EmitEventOptions {
  type: VisionInteractionEventType
  message: string
  toastMessage?: string
  nowMs: number
  cooldownMs?: number
  cooldownKey?: string
  isAutomatic?: boolean
  markAsPrompt?: boolean
}

const DEFAULT_OPTIONS: Required<VisionInteractionOptions> = {
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
  quietDurationMs: 60_000,
  welcomeBackCooldownMs: 8_000,
  celebrationCooldownMs: 4_000,
  maxInferenceStallMs: 1_200,
}

const DISPLAY_NAME_LOCAL_STORAGE_KEY = 'airi.vision-experiment.display-name'

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
  const faceDirection = ref<VisionFaceDirection>('unknown')
  const faceCenter = ref<{ x: number, y: number } | null>(null)
  const lastGesture = ref<VisionGesture>('none')
  const lastEvent = ref<VisionInteractionEvent | null>(null)
  const errorMessage = ref('')
  const lastInferenceAt = ref<number | null>(null)

  const displayName = ref(loadDisplayName())
  const localCelebrationCount = ref(0)
  const acknowledgedEventId = ref<number | null>(null)
  const visionQuietUntil = ref(0)
  const quietRemainingMs = ref(0)
  const activePrompt = ref('')

  const lastPresenceTransitionAt = ref<number | null>(null)
  const lastStableFaceDirection = ref<VisionFaceDirection>('unknown')
  const lastGestureTriggeredAt = ref<Record<'open_palm' | 'victory' | 'thumbs_up', number>>({
    open_palm: Number.NEGATIVE_INFINITY,
    victory: Number.NEGATIVE_INFINITY,
    thumbs_up: Number.NEGATIVE_INFINITY,
  })

  const isVisionQuiet = computed(() => quietRemainingMs.value > 0)
  const maxInferenceStallMs = ref(runtimeOptions.maxInferenceStallMs)

  const stream = shallowRef<MediaStream | null>(null)
  const videoElement = shallowRef<HTMLVideoElement | null>(null)

  let faceLandmarker: FaceLandmarker | null = null
  let gestureRecognizer: GestureRecognizer | null = null
  let rafId: number | null = null
  let lastLoopAtMs = 0
  let recognizerInitialized = false

  let quietTickerId: number | null = null
  let nextEventId = 1
  let activePromptEventId: number | null = null
  let lastProcessedVideoTimeSec = -1
  let lastProcessedFrameTimestampMs = -1

  // Stability counters for face presence transitions.
  let presentFrameStreak = 0
  let absentFrameStreak = 0
  let stablePresence: Exclude<VisionFacePresence, 'unknown'> | null = null

  // Stability counters for gestures.
  let candidateGesture: VisionGesture = 'none'
  let candidateGestureFrames = 0

  // Stability counters for face-position tracking.
  let candidateDirection: VisionFaceDirection = 'unknown'
  let candidateDirectionFrames = 0

  const cooldownByEventKey = new Map<string, number>()

  function loadDisplayName() {
    if (typeof localStorage === 'undefined')
      return ''

    try {
      return (localStorage.getItem(DISPLAY_NAME_LOCAL_STORAGE_KEY) ?? '').trim()
    }
    catch {
      return ''
    }
  }

  function setDisplayName(name: string) {
    const nextName = name.trim().slice(0, 48)
    displayName.value = nextName

    if (typeof localStorage === 'undefined')
      return

    try {
      if (nextName)
        localStorage.setItem(DISPLAY_NAME_LOCAL_STORAGE_KEY, nextName)
      else
        localStorage.removeItem(DISPLAY_NAME_LOCAL_STORAGE_KEY)
    }
    catch {
      // ignore storage write failures (private mode / quota)
    }
  }

  function setMaxInferenceStallMs(nextValue: number) {
    const normalized = Number.isFinite(nextValue)
      ? Math.round(nextValue)
      : runtimeOptions.maxInferenceStallMs

    maxInferenceStallMs.value = Math.min(5_000, Math.max(200, normalized))
  }

  function setError(nextError: unknown) {
    errorMessage.value = errorMessageFrom(nextError) ?? 'Vision initialization failed'
    cameraState.value = 'error'
  }

  function syncQuietState(nowMs = Date.now()) {
    quietRemainingMs.value = Math.max(0, visionQuietUntil.value - nowMs)
  }

  function startQuietTicker() {
    if (quietTickerId !== null || typeof window === 'undefined')
      return

    quietTickerId = window.setInterval(() => {
      syncQuietState(Date.now())
    }, 250)
  }

  function stopQuietTicker() {
    if (quietTickerId === null)
      return

    clearInterval(quietTickerId)
    quietTickerId = null
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
    stablePresence = null

    candidateGesture = 'none'
    candidateGestureFrames = 0

    candidateDirection = 'unknown'
    candidateDirectionFrames = 0
    lastStableFaceDirection.value = 'unknown'

    lastGesture.value = 'none'
    facePresence.value = 'unknown'
    faceDirection.value = 'unknown'
    faceCenter.value = null
    lastInferenceAt.value = null

    lastProcessedVideoTimeSec = -1
    lastProcessedFrameTimestampMs = -1
  }

  function resetPromptState() {
    activePrompt.value = ''
    activePromptEventId = null
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
    stopQuietTicker()
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

  function canEmitEvent(key: string, nowMs: number, cooldownMs: number) {
    const lastAt = cooldownByEventKey.get(key) ?? Number.NEGATIVE_INFINITY
    return nowMs - lastAt >= cooldownMs
  }

  function emitEvent(options: EmitEventOptions) {
    const cooldownMs = options.cooldownMs ?? runtimeOptions.eventCooldownMs
    const cooldownKey = options.cooldownKey ?? options.type

    if (!canEmitEvent(cooldownKey, options.nowMs, cooldownMs))
      return null

    cooldownByEventKey.set(cooldownKey, options.nowMs)

    const shouldMuteToast = options.isAutomatic && isVisionQuiet.value
    const event: VisionInteractionEvent = {
      id: nextEventId++,
      type: options.type,
      message: options.message,
      at: options.nowMs,
      toastMessage: shouldMuteToast ? undefined : options.toastMessage,
    }

    if (options.markAsPrompt) {
      activePrompt.value = options.message
      activePromptEventId = event.id
    }

    lastEvent.value = event
    return event
  }

  function activateQuietMode(nowMs: number) {
    visionQuietUntil.value = nowMs + runtimeOptions.quietDurationMs
    syncQuietState(nowMs)
  }

  function computeFaceCenter(landmarks: NormalizedLandmark[]) {
    if (!landmarks.length)
      return null

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x)
      maxX = Math.max(maxX, landmark.x)
      minY = Math.min(minY, landmark.y)
      maxY = Math.max(maxY, landmark.y)
    }

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY))
      return null

    return {
      x: Math.min(1, Math.max(0, (minX + maxX) / 2)),
      y: Math.min(1, Math.max(0, (minY + maxY) / 2)),
    }
  }

  function directionFromFaceCenter(center: { x: number, y: number } | null): VisionFaceDirection {
    if (!center)
      return 'unknown'

    const dx = center.x - 0.5
    const dy = center.y - 0.5
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    const deadZoneX = 0.12
    const deadZoneY = 0.12

    if (absX <= deadZoneX && absY <= deadZoneY)
      return 'center'

    // NOTE:
    // We intentionally map horizontal movement in a user-centric way.
    // Front-facing camera coordinates are often perceived as mirrored by users,
    // so without this inversion left/right feedback feels reversed in practice.
    if (absX >= absY)
      return dx < 0 ? 'right' : 'left'

    return dy < 0 ? 'up' : 'down'
  }

  function applyFaceDirection(center: { x: number, y: number } | null, nowMs: number) {
    faceCenter.value = center

    const rawDirection = directionFromFaceCenter(center)

    if (rawDirection === candidateDirection) {
      candidateDirectionFrames += 1
    }
    else {
      candidateDirection = rawDirection
      candidateDirectionFrames = 1
    }

    if (candidateDirectionFrames < runtimeOptions.stableFrames)
      return

    if (faceDirection.value === rawDirection)
      return

    const previousDirection = faceDirection.value
    faceDirection.value = rawDirection

    if (rawDirection === 'left' && previousDirection !== 'left') {
      emitEvent({
        type: 'user_moved_left',
        message: 'User moved left',
        nowMs,
        isAutomatic: true,
      })
    }
    else if (rawDirection === 'right' && previousDirection !== 'right') {
      emitEvent({
        type: 'user_moved_right',
        message: 'User moved right',
        nowMs,
        isAutomatic: true,
      })
    }
    else if (rawDirection === 'up' && previousDirection !== 'up') {
      emitEvent({
        type: 'user_moved_up',
        message: 'User moved up',
        nowMs,
        isAutomatic: true,
      })
    }
    else if (rawDirection === 'down' && previousDirection !== 'down') {
      emitEvent({
        type: 'user_moved_down',
        message: 'User moved down',
        nowMs,
        isAutomatic: true,
      })
    }

    lastStableFaceDirection.value = rawDirection
  }

  function applyFacePresence(landmarkerResult: FaceLandmarkerResult, nowMs: number) {
    const landmarks = landmarkerResult.faceLandmarks?.[0] ?? []
    const hasFace = landmarks.length > 0

    applyFaceDirection(computeFaceCenter(landmarks), nowMs)

    if (hasFace) {
      presentFrameStreak += 1
      absentFrameStreak = 0
    }
    else {
      absentFrameStreak += 1
      presentFrameStreak = 0
    }

    if (presentFrameStreak >= runtimeOptions.stableFrames) {
      if (stablePresence !== 'present') {
        const previousStable = stablePresence
        stablePresence = 'present'
        facePresence.value = 'present'
        lastPresenceTransitionAt.value = nowMs

        if (previousStable === 'absent') {
          const message = displayName.value
            ? `Welcome back, ${displayName.value}.`
            : 'Welcome back.'

          emitEvent({
            type: 'welcome_back',
            message: 'Welcome back',
            toastMessage: message,
            nowMs,
            cooldownMs: runtimeOptions.welcomeBackCooldownMs,
            cooldownKey: 'welcome_back',
            isAutomatic: true,
            markAsPrompt: true,
          })
        }
      }
      else {
        facePresence.value = 'present'
      }

      return
    }

    if (absentFrameStreak >= runtimeOptions.stableFrames) {
      if (stablePresence !== 'absent') {
        stablePresence = 'absent'
        facePresence.value = 'absent'
        lastPresenceTransitionAt.value = nowMs

        emitEvent({
          type: 'user_away',
          message: 'User away',
          nowMs,
          isAutomatic: true,
        })
      }
      else {
        facePresence.value = 'absent'
      }

      return
    }

    facePresence.value = 'unknown'
  }

  function acknowledgePrompt(nowMs: number) {
    const hasConfirmablePrompt
      = activePromptEventId !== null
        && acknowledgedEventId.value !== activePromptEventId

    if (hasConfirmablePrompt) {
      acknowledgedEventId.value = activePromptEventId
      resetPromptState()

      emitEvent({
        type: 'acknowledged',
        message: 'Acknowledged',
        toastMessage: 'Rin got your confirmation.',
        nowMs,
      })
      return
    }

    emitEvent({
      type: 'nothing_to_confirm',
      message: 'Nothing to confirm.',
      toastMessage: 'Nothing to confirm.',
      nowMs,
      cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
      cooldownKey: 'nothing_to_confirm',
    })
  }

  function handleOpenPalm(nowMs: number) {
    lastGestureTriggeredAt.value.open_palm = nowMs
    const emittedEvent = emitEvent({
      type: 'quiet_mode_requested',
      message: 'Quiet mode requested',
      toastMessage: 'Rin will stay quiet for a while.',
      nowMs,
      cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
      cooldownKey: 'quiet_mode_requested',
      markAsPrompt: true,
    })

    if (emittedEvent)
      activateQuietMode(nowMs)
  }

  function handleVictory(nowMs: number) {
    lastGestureTriggeredAt.value.victory = nowMs
    localCelebrationCount.value += 1

    emitEvent({
      type: 'completion_celebration',
      message: 'Completion celebration',
      toastMessage: 'Rin celebrates your progress.',
      nowMs,
      cooldownMs: runtimeOptions.celebrationCooldownMs,
      cooldownKey: 'completion_celebration',
      markAsPrompt: true,
    })
  }

  function handleThumbsUp(nowMs: number) {
    lastGestureTriggeredAt.value.thumbs_up = nowMs
    acknowledgePrompt(nowMs)
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

    if (gesture === 'unknown') {
      lastGesture.value = 'unknown'
      return
    }

    if (lastGesture.value === gesture)
      return

    lastGesture.value = gesture

    if (gesture === 'open_palm') {
      handleOpenPalm(nowMs)
      return
    }

    if (gesture === 'victory') {
      handleVictory(nowMs)
      return
    }

    if (gesture === 'thumbs_up') {
      handleThumbsUp(nowMs)
    }
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

    const activeFaceLandmarker = faceLandmarker
    const activeGestureRecognizer = gestureRecognizer

    const tick = async (nowMs: number) => {
      if (!isEnabled.value)
        return

      if (nowMs - lastLoopAtMs < runtimeOptions.loopIntervalMs) {
        rafId = requestAnimationFrame(tick)
        return
      }

      lastLoopAtMs = nowMs
      syncQuietState(Date.now())

      try {
        if (video.readyState < 2) {
          rafId = requestAnimationFrame(tick)
          return
        }

        // Prefer using video frame time when it advances; if it stalls for too long,
        // fall back to periodic inference to avoid the loop appearing "dead".
        const wallNowMs = Date.now()
        const frameTimeSec = video.currentTime
        const hasFiniteFrameTime = Number.isFinite(frameTimeSec)
        const frameAdvanced = hasFiniteFrameTime && frameTimeSec !== lastProcessedVideoTimeSec
        const isInferenceStalled = !lastInferenceAt.value || (wallNowMs - lastInferenceAt.value >= maxInferenceStallMs.value)

        if (!frameAdvanced && !isInferenceStalled) {
          rafId = requestAnimationFrame(tick)
          return
        }

        if (video.paused) {
          try {
            await video.play()
          }
          catch {
            // ignore resume failures and continue fallback inference path
          }
        }

        let frameTimestampMs = hasFiniteFrameTime
          ? Math.floor(frameTimeSec * 1000)
          : Math.floor(nowMs)

        if (frameTimestampMs <= lastProcessedFrameTimestampMs)
          frameTimestampMs = lastProcessedFrameTimestampMs + 1

        if (hasFiniteFrameTime)
          lastProcessedVideoTimeSec = frameTimeSec

        lastProcessedFrameTimestampMs = frameTimestampMs

        const faceResult = activeFaceLandmarker.detectForVideo(video, frameTimestampMs)
        applyFacePresence(faceResult, frameTimestampMs)

        const gestureResult = activeGestureRecognizer.recognizeForVideo(video, frameTimestampMs)
        const topGesture = extractTopGesture(gestureResult)
        applyGesture(topGesture, frameTimestampMs)
        lastInferenceAt.value = Date.now()
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
    lastGesture.value = 'none'
    lastEvent.value = null
    resetPromptState()
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
      syncQuietState(Date.now())
      startQuietTicker()
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
    cameraState.value = 'off'
    syncQuietState(Date.now())
  }

  function attachVideoElement(element: HTMLVideoElement | null) {
    videoElement.value = element
  }

  // Keep quiet countdown alive even if camera is not enabled.
  syncQuietState(Date.now())
  startQuietTicker()

  onBeforeUnmount(() => {
    cleanupAll()
  })

  return {
    isEnabled,
    cameraState,
    facePresence,
    faceCenter,
    faceDirection,
    lastGesture,
    lastEvent,
    errorMessage,
    visionQuietUntil,
    quietRemainingMs,
    isVisionQuiet,
    localCelebrationCount,
    acknowledgedEventId,
    activePrompt,
    displayName,
    maxInferenceStallMs,
    lastPresenceTransitionAt,
    lastStableFaceDirection,
    lastGestureTriggeredAt,
    lastInferenceAt,
    attachVideoElement,
    start,
    stop,
    setDisplayName,
    setMaxInferenceStallMs,
    acknowledgePrompt,
  }
}
