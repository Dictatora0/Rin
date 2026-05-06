import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { VisionFaceProfilePayload, VisionFaceProfileSample } from './use-encrypted-face-profile'

import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from '@mediapipe/tasks-vision'
import { errorMessageFrom } from '@moeru/std'
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'

import { useEncryptedFaceProfile } from './use-encrypted-face-profile'
import { createLandmarkDescriptor, useLocalFaceGate } from './use-local-face-gate'
import { useOpenCvFaceQuality } from './use-opencv-face-quality'

export type VisionCameraState = 'off' | 'loading' | 'active' | 'error'
export type VisionFacePresence = 'present' | 'absent' | 'unknown'
export type VisionFaceDirection = 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
export type VisionGesture = 'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'

export type VisionInteractionEventType
  = | 'quiet_mode_requested'
    | 'completion_celebration'
    | 'acknowledged'
    | 'nothing_to_confirm'
    | 'detected_but_gated'
    | 'face_gate_enrolled'
    | 'face_gate_profile_deleted'
    | 'face_profile_locked'
    | 'face_profile_unlocked'
    | 'user_away'
    | 'welcome_back'
    | 'subject_matched'
    | 'user_moved_left'
    | 'user_moved_right'
    | 'user_moved_up'
    | 'user_moved_down'

export interface VisionInteractionEvent {
  id: number
  type: VisionInteractionEventType
  message: string
  at: number
  toastMessage?: string
}

export interface VisionInteractionOptions {
  stableFrames?: number
  eventCooldownMs?: number
  loopIntervalMs?: number
  quietDurationMs?: number
  welcomeBackCooldownMs?: number
  celebrationCooldownMs?: number
  maxInferenceStallMs?: number
  faceGateWelcomeCooldownMs?: number
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
  skipQuietMute?: boolean
}

const DEFAULT_OPTIONS: Required<VisionInteractionOptions> = {
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
  quietDurationMs: 60_000,
  welcomeBackCooldownMs: 8_000,
  celebrationCooldownMs: 4_000,
  maxInferenceStallMs: 1_200,
  faceGateWelcomeCooldownMs: 8_000,
}

const DISPLAY_NAME_LOCAL_STORAGE_KEY = 'airi.vision-experiment.display-name'
const FACE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const GESTURE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
const WASM_ROOT_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const WASM_ESM_LOADER_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_module_internal.js'
const WASM_BINARY_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_internal.wasm'

const GATE_ENABLED_STORAGE_KEY = 'airi.vision-experiment.local-face-gate-enabled.v1'

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
  const latestFaceResult = shallowRef<FaceLandmarkerResult | null>(null)

  const encryptedProfile = useEncryptedFaceProfile()
  const openCvFaceQuality = useOpenCvFaceQuality()
  const localFaceGate = useLocalFaceGate({
    stableFrames: runtimeOptions.stableFrames,
  })

  const gateEnabled = ref(loadGateEnabled())
  localFaceGate.setGateEnabled(gateEnabled.value)
  if (encryptedProfile.unlockedProfile.value)
    localFaceGate.syncProfileFromPayload(encryptedProfile.unlockedProfile.value)

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

  let presentFrameStreak = 0
  let absentFrameStreak = 0
  let stablePresence: Exclude<VisionFacePresence, 'unknown'> | null = null

  let candidateGesture: VisionGesture = 'none'
  let candidateGestureFrames = 0

  let candidateDirection: VisionFaceDirection = 'unknown'
  let candidateDirectionFrames = 0

  const cooldownByEventKey = new Map<string, number>()

  const canTriggerInteractiveFeedback = computed(() => {
    if (!localFaceGate.gateEnabled.value)
      return true
    return localFaceGate.gateState.value === 'enabled'
  })

  const hasEncryptedProfile = computed(() => encryptedProfile.hasEncryptedProfile.value)
  const isProfileUnlocked = computed(() => encryptedProfile.isUnlocked.value)
  const profileStatus = computed(() => encryptedProfile.status.value)
  const matchedDisplayName = computed(() => localFaceGate.unlockedDisplayName.value || '')
  const faceGateStatusText = computed(() => {
    if (!localFaceGate.gateEnabled.value)
      return 'disabled'
    if (!hasEncryptedProfile.value)
      return 'not_enrolled'
    if (!isProfileUnlocked.value)
      return 'locked'
    return localFaceGate.profileStatus.value
  })

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

  function loadGateEnabled() {
    if (typeof localStorage === 'undefined')
      return false
    try {
      return localStorage.getItem(GATE_ENABLED_STORAGE_KEY) === 'true'
    }
    catch {
      return false
    }
  }

  function persistGateEnabled(enabled: boolean) {
    if (typeof localStorage === 'undefined')
      return
    try {
      localStorage.setItem(GATE_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
    }
    catch {
      // ignore
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
      // ignore storage write failures
    }
  }

  function setFaceGateEnabled(enabled: boolean) {
    gateEnabled.value = enabled
    localFaceGate.setGateEnabled(enabled)
    persistGateEnabled(enabled)
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
    catch {}
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
    latestFaceResult.value = null

    lastProcessedVideoTimeSec = -1
    lastProcessedFrameTimestampMs = -1
    localFaceGate.resetForCameraStop()
  }

  function resetPromptState() {
    activePrompt.value = ''
    activePromptEventId = null
  }

  function cleanupRecognizers() {
    try {
      faceLandmarker?.close()
    }
    catch {}
    try {
      gestureRecognizer?.close()
    }
    catch {}
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
    const normalized = categoryName.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
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

  function shouldGateInteraction() {
    return !canTriggerInteractiveFeedback.value
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
    const shouldMuteToast = options.isAutomatic && isVisionQuiet.value && !options.skipQuietMute
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
    if (absX >= absY)
      return dx < 0 ? 'right' : 'left'
    return dy < 0 ? 'up' : 'down'
  }

  function applyFaceDirection(center: { x: number, y: number } | null, nowMs: number, allowFeedback: boolean) {
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

    if (!allowFeedback) {
      lastStableFaceDirection.value = rawDirection
      return
    }

    if (rawDirection === 'left' && previousDirection !== 'left')
      emitEvent({ type: 'user_moved_left', message: 'User moved left', nowMs, isAutomatic: true })
    else if (rawDirection === 'right' && previousDirection !== 'right')
      emitEvent({ type: 'user_moved_right', message: 'User moved right', nowMs, isAutomatic: true })
    else if (rawDirection === 'up' && previousDirection !== 'up')
      emitEvent({ type: 'user_moved_up', message: 'User moved up', nowMs, isAutomatic: true })
    else if (rawDirection === 'down' && previousDirection !== 'down')
      emitEvent({ type: 'user_moved_down', message: 'User moved down', nowMs, isAutomatic: true })

    lastStableFaceDirection.value = rawDirection
  }

  async function applyFacePresence(faceResult: FaceLandmarkerResult, nowMs: number) {
    latestFaceResult.value = faceResult
    const faceLandmarks = faceResult.faceLandmarks ?? []
    const primaryLandmarks = faceLandmarks[0] ?? []
    const hasFace = faceLandmarks.length > 0 && primaryLandmarks.length > 0

    const qualityResult = hasFace && videoElement.value
      ? await openCvFaceQuality.evaluateFaceQuality(videoElement.value, primaryLandmarks)
      : null

    const gateResult = localFaceGate.evaluateFrame({
      faceResult,
      profile: encryptedProfile.unlockedProfile.value,
      qualityMetrics: qualityResult,
    })

    const allowFeedback = !localFaceGate.gateEnabled.value || localFaceGate.gateState.value === 'enabled'

    const hasSingleFace = faceLandmarks.length === 1
    const center = hasSingleFace ? computeFaceCenter(primaryLandmarks) : null
    applyFaceDirection(center, nowMs, allowFeedback)

    if (localFaceGate.gateEnabled.value && allowFeedback && localFaceGate.consumeJustMatchedWelcome(nowMs, runtimeOptions.faceGateWelcomeCooldownMs)) {
      const name = localFaceGate.unlockedDisplayName.value || displayName.value
      const toastMessage = name ? `Welcome back, ${name}.` : 'Welcome back.'
      emitEvent({
        type: 'subject_matched',
        message: 'Welcome back',
        toastMessage,
        nowMs,
        cooldownMs: runtimeOptions.faceGateWelcomeCooldownMs,
        cooldownKey: 'subject_matched_welcome',
        isAutomatic: true,
        skipQuietMute: true,
        markAsPrompt: true,
      })
    }

    if (!localFaceGate.gateEnabled.value && hasFace) {
      presentFrameStreak += 1
      absentFrameStreak = 0
    }
    else if (!localFaceGate.gateEnabled.value) {
      absentFrameStreak += 1
      presentFrameStreak = 0
    }

    if (!localFaceGate.gateEnabled.value && presentFrameStreak >= runtimeOptions.stableFrames) {
      if (stablePresence !== 'present') {
        const previousStable = stablePresence
        stablePresence = 'present'
        facePresence.value = 'present'
        lastPresenceTransitionAt.value = nowMs
        if (previousStable === 'absent') {
          const message = displayName.value ? `Welcome back, ${displayName.value}.` : 'Welcome back.'
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

    if (!localFaceGate.gateEnabled.value && absentFrameStreak >= runtimeOptions.stableFrames) {
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

    if (!localFaceGate.gateEnabled.value)
      facePresence.value = 'unknown'
    else
      facePresence.value = gateResult.status === 'no_face' ? 'absent' : (hasFace ? 'present' : 'unknown')
  }

  function acknowledgePrompt(nowMs: number) {
    const hasConfirmablePrompt = activePromptEventId !== null && acknowledgedEventId.value !== activePromptEventId
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
    if (shouldGateInteraction()) {
      emitEvent({
        type: 'detected_but_gated',
        message: 'Open palm detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:open_palm',
      })
      return
    }
    const emitted = emitEvent({
      type: 'quiet_mode_requested',
      message: 'Quiet mode requested',
      toastMessage: 'Rin will stay quiet for a while.',
      nowMs,
      cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
      cooldownKey: 'quiet_mode_requested',
      markAsPrompt: true,
    })
    if (emitted)
      activateQuietMode(nowMs)
  }

  function handleVictory(nowMs: number) {
    lastGestureTriggeredAt.value.victory = nowMs
    if (shouldGateInteraction()) {
      emitEvent({
        type: 'detected_but_gated',
        message: 'Victory detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.celebrationCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:victory',
      })
      return
    }
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
    if (shouldGateInteraction()) {
      emitEvent({
        type: 'detected_but_gated',
        message: 'Thumbs up detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:thumbs_up',
      })
      return
    }
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
    if (gesture === 'open_palm')
      handleOpenPalm(nowMs)
    else if (gesture === 'victory')
      handleVictory(nowMs)
    else if (gesture === 'thumbs_up')
      handleThumbsUp(nowMs)
  }

  async function ensureRecognizers() {
    if (recognizerInitialized)
      return
    const fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> = await FilesetResolver.forVisionTasks(WASM_ROOT_URL)
      .catch(async () => {
        return {
          wasmLoaderPath: WASM_ESM_LOADER_URL,
          wasmBinaryPath: WASM_BINARY_URL,
        }
      })

    faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL_ASSET_URL },
      runningMode: 'VIDEO',
      numFaces: 2,
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
          catch {}
        }

        let frameTimestampMs = hasFiniteFrameTime ? Math.floor(frameTimeSec * 1000) : Math.floor(nowMs)
        if (frameTimestampMs <= lastProcessedFrameTimestampMs)
          frameTimestampMs = lastProcessedFrameTimestampMs + 1

        if (hasFiniteFrameTime)
          lastProcessedVideoTimeSec = frameTimeSec
        lastProcessedFrameTimestampMs = frameTimestampMs

        const faceResult = activeFaceLandmarker.detectForVideo(video, frameTimestampMs)
        await applyFacePresence(faceResult, frameTimestampMs)
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
      await openCvFaceQuality.initializeOpenCv()
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
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

  async function enrollLocalFaceProfile(options: {
    displayName: string
    passphrase: string
    confirmPassphrase?: string
    threshold: number
    qualityThreshold: number
    stableFrames: number
    enrollSampleCount: number
  }) {
    const nowMs = Date.now()
    if (!isEnabled.value || cameraState.value !== 'active') {
      emitEvent({
        type: 'detected_but_gated',
        message: 'Enrollment failed: camera inactive',
        nowMs,
      })
      return { ok: false as const, reason: 'camera inactive' }
    }
    if (!options.displayName.trim()) {
      return { ok: false as const, reason: 'displayName required' }
    }
    if (!options.passphrase.trim())
      return { ok: false as const, reason: 'passphrase required' }
    if (options.confirmPassphrase !== undefined && options.passphrase !== options.confirmPassphrase)
      return { ok: false as const, reason: 'passphrase mismatch' }
    if (!latestFaceResult.value)
      return { ok: false as const, reason: 'no face' }

    const faces = latestFaceResult.value.faceLandmarks ?? []
    if (!faces.length)
      return { ok: false as const, reason: 'no face' }
    if (faces.length > 1)
      return { ok: false as const, reason: 'multiple faces' }

    const targetCount = Math.max(5, Math.min(10, Math.round(options.enrollSampleCount)))
    const samples: VisionFaceProfileSample[] = []
    let rejected = 0
    for (let i = 0; i < targetCount * 3 && samples.length < targetCount; i += 1) {
      const frame = latestFaceResult.value
      const currentLandmarks = frame?.faceLandmarks?.[0] ?? []
      if (!currentLandmarks.length) {
        await sleep(100)
        continue
      }
      const video = videoElement.value
      if (!video || video.readyState < 2)
        return { ok: false as const, reason: 'camera inactive' }

      const quality = await openCvFaceQuality.evaluateFaceQuality(video, currentLandmarks)
      if (!quality.accepted || quality.qualityScore < options.qualityThreshold) {
        rejected += 1
        await sleep(120)
        continue
      }

      const descriptor = createLandmarkDescriptor(currentLandmarks, { descriptorVersion: 'landmark-signature-v1' })
      if (!descriptor) {
        rejected += 1
        await sleep(120)
        continue
      }

      samples.push({
        descriptor,
        quality: quality.qualityScore,
        brightness: quality.brightness,
        sharpness: quality.sharpness,
        contrast: quality.contrast,
        faceSize: quality.faceSize,
        capturedAt: new Date().toISOString(),
      })
      await sleep(120)
    }

    if (samples.length < targetCount)
      return { ok: false as const, reason: rejected > 0 ? 'low quality' : 'descriptor failed' }

    const nowIso = new Date().toISOString()
    const payload: VisionFaceProfilePayload = {
      schemaVersion: 'vision-face-profile-v1',
      id: globalThis.crypto?.randomUUID?.() ?? `vision-${Date.now()}`,
      displayName: options.displayName.trim().slice(0, 48),
      createdAt: nowIso,
      updatedAt: nowIso,
      model: 'mediapipe-face-landmarker',
      descriptorVersion: 'landmark-signature-v1',
      threshold: options.threshold,
      qualityThreshold: options.qualityThreshold,
      enrollSampleCount: targetCount,
      stableFrames: options.stableFrames,
      samples,
    }

    const saveResult = await encryptedProfile.saveEncryptedProfile(payload, options.passphrase)
    if (!saveResult.ok)
      return { ok: false as const, reason: saveResult.reason ?? 'save failed' }

    localFaceGate.syncProfileFromPayload(payload)
    setDisplayName(payload.displayName)
    emitEvent({
      type: 'face_gate_enrolled',
      message: 'Face profile enrolled locally.',
      toastMessage: 'Face profile enrolled locally.',
      nowMs,
      cooldownKey: 'face_gate_enrolled',
    })
    return { ok: true as const, profile: payload, captured: samples.length, target: targetCount }
  }

  async function unlockFaceProfile(passphrase: string) {
    const result = await encryptedProfile.unlockProfile(passphrase)
    if (!result.ok) {
      emitEvent({
        type: 'detected_but_gated',
        message: 'Unable to unlock local face profile.',
        nowMs: Date.now(),
        cooldownKey: 'unlock_failed',
        cooldownMs: 1_500,
      })
      localFaceGate.setLockedByProfile()
      return result
    }
    localFaceGate.syncProfileFromPayload(result.profile)
    emitEvent({
      type: 'face_profile_unlocked',
      message: 'Face profile unlocked.',
      toastMessage: 'Face profile unlocked.',
      nowMs: Date.now(),
      cooldownKey: 'face_profile_unlocked',
    })
    return result
  }

  function lockFaceProfile() {
    encryptedProfile.lockProfile()
    localFaceGate.setLockedByProfile()
    emitEvent({
      type: 'face_profile_locked',
      message: 'Face profile locked.',
      nowMs: Date.now(),
      cooldownKey: 'face_profile_locked',
      cooldownMs: 1_000,
    })
  }

  function deleteLocalFaceProfile() {
    encryptedProfile.deleteProfile()
    localFaceGate.syncProfileFromPayload(null)
    emitEvent({
      type: 'face_gate_profile_deleted',
      message: 'Local face profile deleted.',
      toastMessage: 'Local face profile deleted.',
      nowMs: Date.now(),
      cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 1_000),
      cooldownKey: 'face_gate_profile_deleted',
    })
  }

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
    faceGateStatusText,
    matchedDisplayName,
    gateEnabled,
    hasEncryptedProfile,
    isProfileUnlocked,
    profileStatus,
    localFaceGate,
    encryptedProfile,
    openCvFaceQuality,
    canTriggerInteractiveFeedback,
    attachVideoElement,
    start,
    stop,
    setDisplayName,
    setFaceGateEnabled,
    setMaxInferenceStallMs,
    enrollLocalFaceProfile,
    unlockFaceProfile,
    lockFaceProfile,
    deleteLocalFaceProfile,
    acknowledgePrompt,
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
