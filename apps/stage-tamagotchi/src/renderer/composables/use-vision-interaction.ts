import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { FaceSampleQuality, VisionFaceProfilePayload, VisionFaceProfileSample } from './use-encrypted-face-profile'

import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from '@mediapipe/tasks-vision'
import { defineInvoke } from '@moeru/eventa'
import { errorMessageFrom } from '@moeru/std'
import { getElectronEventaContext } from '@proj-airi/electron-vueuse'
import { isElectronWindow } from '@proj-airi/stage-shared'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { electronSecureStoreDelete, electronSecureStoreGet, electronSecureStoreSet } from '../../shared/eventa'
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
  autoUnlockFaceProfile?: boolean
}

export type VisionModelWarmupStatus = 'idle' | 'warming' | 'ready' | 'fallback_remote'
export type VisionModelSource = 'local' | 'remote' | 'unknown'

export interface VisionStartTimingSnapshot {
  startedAt: number | null
  finishedAt: number | null
  totalMs: number | null
  readyForPreviewMs: number | null
  permissionMs: number | null
  videoPlayMs: number | null
  recognizerInitMs: number | null
  recognizerSource: VisionModelSource
}

export interface VisionCameraDiagnosticsSnapshot {
  trackEndedCount: number
  unexpectedTrackEndedCount: number
  lastTrackEndedAt: number | null
  lastTrackEndedTrackId: string | null
  lastTrackEndedTrackLabel: string | null
  lastTrackEndedIntentional: boolean | null
  inferenceErrorCount: number
  consecutiveInferenceErrorCount: number
  lastInferenceErrorAt: number | null
  lastInferenceErrorMessage: string
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
  autoUnlockFaceProfile: true,
}

const DISPLAY_NAME_LOCAL_STORAGE_KEY = 'airi.vision-experiment.display-name'
const LOCAL_FACE_MODEL_ASSET_URL = './assets/vision/models/face_landmarker.task'
const LOCAL_GESTURE_MODEL_ASSET_URL = './assets/vision/models/gesture_recognizer.task'
const LOCAL_WASM_ROOT_URL = './assets/vision/wasm'
const FACE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const GESTURE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
const WASM_ROOT_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const WASM_ESM_LOADER_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_module_internal.js'
const WASM_BINARY_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm/vision_wasm_internal.wasm'
const ENABLE_REMOTE_MODEL_FALLBACK = import.meta.env.VITE_VISION_ALLOW_REMOTE_FALLBACK === 'true'

const GATE_ENABLED_STORAGE_KEY = 'airi.vision-experiment.local-face-gate-enabled.v1'
const VISION_MODEL_PROFILE = 'MediaPipe 官方 float16 v1（本地与远程同规格）'
const INFERENCE_ERROR_LOG_COOLDOWN_MS = 1_500
const TIMESTAMP_MISMATCH_RECOVERY_COOLDOWN_MS = 3_000
const QUALITY_EVALUATION_INTERVAL_MS = 400
const GESTURE_INFERENCE_INTERVAL_MS = 180
const UI_YIELD_INTERVAL_MS = 240
const FACE_PROFILE_AUTO_UNLOCK_STORE_KEY = 'vision.face-profile.auto-unlock.passphrase.v1'
const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 960, max: 1280 },
  height: { ideal: 540, max: 720 },
  frameRate: { ideal: 24, max: 30 },
}

/**
 * Shared recognizer runtime across Vision Island and enrollment page.
 * This prevents route switches from dropping warmup state.
 */
const sharedModelWarmupStatus = ref<VisionModelWarmupStatus>('idle')
const sharedModelSource = ref<VisionModelSource>('unknown')
let sharedFaceLandmarker: FaceLandmarker | null = null
let sharedGestureRecognizer: GestureRecognizer | null = null
let sharedRecognizerInitPromise: Promise<void> | null = null
let sharedRecognizerInitialized = false
let sharedLastInferenceTimestampMs = -1

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
  const modelWarmupStatus = sharedModelWarmupStatus
  const modelSource = sharedModelSource
  const modelProfile = ref(VISION_MODEL_PROFILE)
  const startTiming = ref<VisionStartTimingSnapshot>({
    startedAt: null,
    finishedAt: null,
    totalMs: null,
    readyForPreviewMs: null,
    permissionMs: null,
    videoPlayMs: null,
    recognizerInitMs: null,
    recognizerSource: 'unknown',
  })
  const cameraDiagnostics = ref<VisionCameraDiagnosticsSnapshot>({
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
  })

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
  if (encryptedProfile.hasEncryptedProfile.value && !encryptedProfile.unlockedProfile.value)
    localFaceGate.setLockedByProfile()

  watch(
    () => encryptedProfile.unlockedProfile.value,
    (nextProfile) => {
      if (nextProfile) {
        localFaceGate.syncProfileFromPayload(nextProfile)
        return
      }

      if (encryptedProfile.hasEncryptedProfile.value) {
        localFaceGate.setLockedByProfile()
        return
      }

      localFaceGate.syncProfileFromPayload(null)
    },
    { immediate: true },
  )

  let faceLandmarker: FaceLandmarker | null = sharedFaceLandmarker
  let gestureRecognizer: GestureRecognizer | null = sharedGestureRecognizer
  let recognizerInitPromise: Promise<void> | null = sharedRecognizerInitPromise
  let rafId: number | null = null
  let lastLoopAtMs = 0
  let recognizerInitialized = sharedRecognizerInitialized

  let quietTickerId: number | null = null
  let nextEventId = 1
  let activePromptEventId: number | null = null
  let lastProcessedVideoTimeSec = -1
  let lastProcessedFrameTimestampMs = sharedLastInferenceTimestampMs

  let presentFrameStreak = 0
  let absentFrameStreak = 0
  let stablePresence: Exclude<VisionFacePresence, 'unknown'> | null = null

  let candidateGesture: VisionGesture = 'none'
  let candidateGestureFrames = 0

  let candidateDirection: VisionFaceDirection = 'unknown'
  let candidateDirectionFrames = 0

  const cooldownByEventKey = new Map<string, number>()
  let isStoppingTracksIntentionally = false
  let lastInferenceErrorLoggedAt = Number.NEGATIVE_INFINITY
  let lastQualityEvaluatedAt = Number.NEGATIVE_INFINITY
  let cachedQualityMetrics: FaceSampleQuality | null = null
  let lastGestureInferenceAtMs = Number.NEGATIVE_INFINITY
  let lastUiYieldAtMs = Number.NEGATIVE_INFINITY
  let lastTimestampMismatchRecoveryAtMs = Number.NEGATIVE_INFINITY
  let isRecoveringFromTimestampMismatch = false
  let streamLifecycleToken = 0
  const trackedCameraStreams = new Set<MediaStream>()

  function invalidateStreamLifecycle() {
    streamLifecycleToken += 1
  }

  function nowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function')
      return performance.now()
    return Date.now()
  }

  function roundedMs(value: number | null) {
    if (value === null || !Number.isFinite(value))
      return null
    return Math.round(value * 10) / 10
  }

  function nextMonotonicInferenceTimestampMs(frameNowMs: number) {
    const candidateTimestampMs = Math.floor(frameNowMs)
    const floorTimestampMs = Math.max(lastProcessedFrameTimestampMs, sharedLastInferenceTimestampMs)
    const nextTimestampMs = candidateTimestampMs > floorTimestampMs
      ? candidateTimestampMs
      : (floorTimestampMs + 1)
    lastProcessedFrameTimestampMs = nextTimestampMs
    sharedLastInferenceTimestampMs = nextTimestampMs
    return nextTimestampMs
  }

  function isTimestampMismatchInferenceError(message: string) {
    const normalizedMessage = message.toLowerCase()
    return normalizedMessage.includes('packet timestamp mismatch')
      || normalizedMessage.includes('current minimum expected timestamp')
      || (normalizedMessage.includes('minimum expected timestamp') && normalizedMessage.includes('received 0'))
  }

  function resetStartTiming() {
    startTiming.value = {
      startedAt: null,
      finishedAt: null,
      totalMs: null,
      readyForPreviewMs: null,
      permissionMs: null,
      videoPlayMs: null,
      recognizerInitMs: null,
      recognizerSource: modelSource.value,
    }
  }

  function resetCameraDiagnostics() {
    cameraDiagnostics.value = {
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
    }
    lastInferenceErrorLoggedAt = Number.NEGATIVE_INFINITY
  }

  function markInferenceSuccess() {
    if (cameraDiagnostics.value.consecutiveInferenceErrorCount === 0)
      return
    cameraDiagnostics.value = {
      ...cameraDiagnostics.value,
      consecutiveInferenceErrorCount: 0,
      lastInferenceErrorMessage: '',
    }
  }

  function recordInferenceError(error: unknown) {
    const message = errorMessageFrom(error) ?? 'Vision inference failed'
    const now = Date.now()
    cameraDiagnostics.value = {
      ...cameraDiagnostics.value,
      inferenceErrorCount: cameraDiagnostics.value.inferenceErrorCount + 1,
      consecutiveInferenceErrorCount: cameraDiagnostics.value.consecutiveInferenceErrorCount + 1,
      lastInferenceErrorAt: now,
      lastInferenceErrorMessage: message,
    }

    if (now - lastInferenceErrorLoggedAt >= INFERENCE_ERROR_LOG_COOLDOWN_MS) {
      lastInferenceErrorLoggedAt = now
      console.warn('[vision] inference error', {
        message,
        inferenceErrorCount: cameraDiagnostics.value.inferenceErrorCount,
        consecutiveInferenceErrorCount: cameraDiagnostics.value.consecutiveInferenceErrorCount,
      })
    }

    return message
  }

  function recordTrackEnded(track: MediaStreamTrack) {
    const now = Date.now()
    const intentional = isStoppingTracksIntentionally
    cameraDiagnostics.value = {
      ...cameraDiagnostics.value,
      trackEndedCount: cameraDiagnostics.value.trackEndedCount + 1,
      unexpectedTrackEndedCount: intentional
        ? cameraDiagnostics.value.unexpectedTrackEndedCount
        : (cameraDiagnostics.value.unexpectedTrackEndedCount + 1),
      lastTrackEndedAt: now,
      lastTrackEndedTrackId: track.id || null,
      lastTrackEndedTrackLabel: track.label || null,
      lastTrackEndedIntentional: intentional,
    }

    console.warn('[vision] video track ended', {
      intentional,
      trackId: track.id,
      trackLabel: track.label,
      trackReadyState: track.readyState,
      trackEndedCount: cameraDiagnostics.value.trackEndedCount,
      unexpectedTrackEndedCount: cameraDiagnostics.value.unexpectedTrackEndedCount,
    })
  }

  const canTriggerInteractiveFeedback = computed(() => {
    if (!localFaceGate.gateEnabled.value)
      return true
    return localFaceGate.gateState.value === 'enabled'
  })

  const hasEncryptedProfile = computed(() => encryptedProfile.hasEncryptedProfile.value)
  const isProfileUnlocked = computed(() => encryptedProfile.isUnlocked.value)
  const profileStatus = computed(() => encryptedProfile.status.value)
  const matchedDisplayName = computed(() => localFaceGate.unlockedDisplayName.value || '')
  const rememberFaceProfileOnDevice = ref(false)
  const secureStoreAvailable = ref(false)
  const autoUnlockAttempted = ref(false)
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

  function getSecureStoreInvokes() {
    if (typeof window === 'undefined' || !isElectronWindow(window))
      return null

    try {
      const context = getElectronEventaContext()
      return {
        setSecureValue: defineInvoke(context, electronSecureStoreSet),
        getSecureValue: defineInvoke(context, electronSecureStoreGet),
        deleteSecureValue: defineInvoke(context, electronSecureStoreDelete),
      }
    }
    catch {
      return null
    }
  }

  async function detectSecureStoreAvailability() {
    const invokes = getSecureStoreInvokes()
    if (!invokes) {
      secureStoreAvailable.value = false
      return false
    }

    try {
      await invokes.getSecureValue({ key: FACE_PROFILE_AUTO_UNLOCK_STORE_KEY })
      secureStoreAvailable.value = true
      return true
    }
    catch {
      secureStoreAvailable.value = false
      return false
    }
  }

  async function persistTrustedFaceProfilePassphrase(passphrase: string) {
    const invokes = getSecureStoreInvokes()
    if (!invokes)
      return false

    try {
      await invokes.setSecureValue({
        key: FACE_PROFILE_AUTO_UNLOCK_STORE_KEY,
        value: passphrase,
      })
      secureStoreAvailable.value = true
      return true
    }
    catch (error) {
      secureStoreAvailable.value = false
      console.warn('[vision] failed to persist trusted face profile passphrase', {
        errorMessage: errorMessageFrom(error) ?? 'unknown error',
      })
      return false
    }
  }

  async function removeTrustedFaceProfilePassphrase() {
    const invokes = getSecureStoreInvokes()
    if (!invokes)
      return

    try {
      await invokes.deleteSecureValue({ key: FACE_PROFILE_AUTO_UNLOCK_STORE_KEY })
    }
    catch (error) {
      console.warn('[vision] failed to clear trusted face profile passphrase', {
        errorMessage: errorMessageFrom(error) ?? 'unknown error',
      })
    }
  }

  async function tryAutoUnlockFaceProfile() {
    if (!runtimeOptions.autoUnlockFaceProfile || autoUnlockAttempted.value)
      return
    autoUnlockAttempted.value = true

    if (!encryptedProfile.hasEncryptedProfile.value || encryptedProfile.isUnlocked.value)
      return

    const invokes = getSecureStoreInvokes()
    if (!invokes)
      return

    let trustedSecret: string | undefined
    try {
      const result = await invokes.getSecureValue({ key: FACE_PROFILE_AUTO_UNLOCK_STORE_KEY })
      secureStoreAvailable.value = true
      if (!result.hasValue || !result.value) {
        rememberFaceProfileOnDevice.value = false
        return
      }
      rememberFaceProfileOnDevice.value = true
      trustedSecret = result.value
    }
    catch (error) {
      secureStoreAvailable.value = false
      console.warn('[vision] trusted auto-unlock is unavailable on this device', {
        errorMessage: errorMessageFrom(error) ?? 'unknown error',
      })
      return
    }

    const unlockResult = await encryptedProfile.unlockProfile(trustedSecret)
    if (!unlockResult.ok) {
      await removeTrustedFaceProfilePassphrase()
      rememberFaceProfileOnDevice.value = false
      localFaceGate.setLockedByProfile()
      console.warn('[vision] trusted auto-unlock failed; cleared stale trusted secret')
      return
    }

    localFaceGate.syncProfileFromPayload(unlockResult.profile)
    emitEvent({
      type: 'face_profile_unlocked',
      message: 'Face profile auto-unlocked on trusted device.',
      toastMessage: '已自动解锁本地人脸档案。',
      nowMs: Date.now(),
      cooldownKey: 'face_profile_auto_unlocked',
      cooldownMs: 1_000,
    })
  }

  async function setRememberFaceProfileOnDevice(enabled: boolean) {
    if (enabled) {
      const available = await detectSecureStoreAvailability()
      if (!available) {
        rememberFaceProfileOnDevice.value = false
        return false
      }

      rememberFaceProfileOnDevice.value = true
      if (encryptedProfile.isUnlocked.value && encryptedProfile.lastSuccessfulPassphrase.value) {
        await persistTrustedFaceProfilePassphrase(encryptedProfile.lastSuccessfulPassphrase.value)
      }
      return true
    }

    rememberFaceProfileOnDevice.value = false
    await removeTrustedFaceProfilePassphrase()
    return true
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

  function trackCameraStream(nextStream: MediaStream) {
    trackedCameraStreams.add(nextStream)
  }

  function stopCameraStream(nextStream: MediaStream, reason: string) {
    nextStream.getTracks().forEach((track) => {
      track.onended = null
      track.stop()
    })
    trackedCameraStreams.delete(nextStream)

    if (import.meta.env.DEV) {
      console.info('[vision] camera stream stopped', {
        reason,
        remainingTrackedStreams: trackedCameraStreams.size,
      })
    }
  }

  function stopAllCameraStreams(reason: string) {
    const streamsToStop = new Set<MediaStream>(trackedCameraStreams)
    if (stream.value)
      streamsToStop.add(stream.value)

    if (streamsToStop.size === 0)
      return

    isStoppingTracksIntentionally = true
    streamsToStop.forEach(nextStream => stopCameraStream(nextStream, reason))
    isStoppingTracksIntentionally = false
    stream.value = null
  }

  function stopTracks() {
    stopAllCameraStreams('stopTracks')
  }

  function hasLiveVideoTrack() {
    const currentStream = stream.value
    if (!currentStream)
      return false
    return currentStream.getVideoTracks().some(track => track.readyState === 'live')
  }

  function attachStreamTrackDiagnostics(nextStream: MediaStream) {
    const tracks = nextStream.getVideoTracks()
    for (const track of tracks) {
      track.onended = () => {
        recordTrackEnded(track)
      }
    }
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
    lastQualityEvaluatedAt = Number.NEGATIVE_INFINITY
    cachedQualityMetrics = null
    lastGestureInferenceAtMs = Number.NEGATIVE_INFINITY
    lastUiYieldAtMs = Number.NEGATIVE_INFINITY
    localFaceGate.resetForCameraStop()
  }

  function resetPromptState() {
    activePrompt.value = ''
    activePromptEventId = null
  }

  function cleanupRecognizers() {
    recognizerInitPromise = null
    sharedRecognizerInitPromise = null
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
    sharedFaceLandmarker = null
    sharedGestureRecognizer = null
    sharedRecognizerInitialized = false
    sharedLastInferenceTimestampMs = -1
    modelWarmupStatus.value = 'idle'
    modelSource.value = 'unknown'
    resetStartTiming()
  }

  function cleanupAll() {
    invalidateStreamLifecycle()
    clearLoop()
    stopQuietTicker()
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

  function logGestureDebug(message: string, payload: Record<string, unknown>) {
    if (!import.meta.env.DEV)
      return

    console.info(`[vision][gesture] ${message}`, payload)
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

    const qualityResult = await evaluateQualityMetricsForFrame({
      hasFace,
      primaryLandmarks,
      nowMs,
    })

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

  async function evaluateQualityMetricsForFrame(options: {
    hasFace: boolean
    primaryLandmarks: NormalizedLandmark[]
    nowMs: number
  }) {
    if (!options.hasFace || !options.primaryLandmarks.length || !videoElement.value) {
      cachedQualityMetrics = null
      return null
    }

    const shouldEvaluateNow = !cachedQualityMetrics
      || ((options.nowMs - lastQualityEvaluatedAt) >= QUALITY_EVALUATION_INTERVAL_MS)

    if (!shouldEvaluateNow)
      return cachedQualityMetrics

    if (openCvFaceQuality.status.value !== 'ready' && openCvFaceQuality.status.value !== 'loading')
      void openCvFaceQuality.initializeOpenCv()

    const metrics = await openCvFaceQuality.evaluateFaceQuality(videoElement.value, options.primaryLandmarks)
    cachedQualityMetrics = metrics
    lastQualityEvaluatedAt = options.nowMs
    return metrics
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
      logGestureDebug('open_palm blocked by gate', {
        nowMs,
        gateEnabled: localFaceGate.gateEnabled.value,
        gateState: localFaceGate.gateState.value,
        profileStatus: localFaceGate.profileStatus.value,
        canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
        faceGateStatusText: faceGateStatusText.value,
      })
      emitEvent({
        type: 'detected_but_gated',
        message: 'Open palm detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:open_palm',
      })
      return
    }

    logGestureDebug('open_palm accepted', {
      nowMs,
      gateEnabled: localFaceGate.gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      profileStatus: localFaceGate.profileStatus.value,
      canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
      faceGateStatusText: faceGateStatusText.value,
    })

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
      logGestureDebug('victory blocked by gate', {
        nowMs,
        gateEnabled: localFaceGate.gateEnabled.value,
        gateState: localFaceGate.gateState.value,
        profileStatus: localFaceGate.profileStatus.value,
        canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
        faceGateStatusText: faceGateStatusText.value,
      })
      emitEvent({
        type: 'detected_but_gated',
        message: 'Victory detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.celebrationCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:victory',
      })
      return
    }

    logGestureDebug('victory accepted', {
      nowMs,
      gateEnabled: localFaceGate.gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      profileStatus: localFaceGate.profileStatus.value,
      canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
      faceGateStatusText: faceGateStatusText.value,
    })

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
      logGestureDebug('thumbs_up blocked by gate', {
        nowMs,
        gateEnabled: localFaceGate.gateEnabled.value,
        gateState: localFaceGate.gateState.value,
        profileStatus: localFaceGate.profileStatus.value,
        canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
        faceGateStatusText: faceGateStatusText.value,
      })
      emitEvent({
        type: 'detected_but_gated',
        message: 'Thumbs up detected but gated',
        nowMs,
        cooldownMs: Math.max(runtimeOptions.eventCooldownMs, 3_000),
        cooldownKey: 'detected_but_gated:thumbs_up',
      })
      return
    }

    logGestureDebug('thumbs_up accepted', {
      nowMs,
      gateEnabled: localFaceGate.gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      profileStatus: localFaceGate.profileStatus.value,
      canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
      faceGateStatusText: faceGateStatusText.value,
    })

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

    logGestureDebug('raw gesture sample', {
      nowMs,
      rawGesture: gesture,
      candidateGesture,
      candidateGestureFrames,
      requiredStableFrames: runtimeOptions.stableFrames,
      lastGesture: lastGesture.value,
      gateEnabled: localFaceGate.gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      profileStatus: localFaceGate.profileStatus.value,
      canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
      faceGateStatusText: faceGateStatusText.value,
    })

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
    faceLandmarker = sharedFaceLandmarker
    gestureRecognizer = sharedGestureRecognizer
    recognizerInitialized = sharedRecognizerInitialized
    recognizerInitPromise = sharedRecognizerInitPromise

    if (recognizerInitialized)
      return
    if (recognizerInitPromise)
      return recognizerInitPromise

    modelWarmupStatus.value = 'warming'

    recognizerInitPromise = (async () => {
      const localFileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> = await FilesetResolver.forVisionTasks(LOCAL_WASM_ROOT_URL)
        .catch(() => {
          return {
            wasmLoaderPath: `${LOCAL_WASM_ROOT_URL}/vision_wasm_module_internal.js`,
            wasmBinaryPath: `${LOCAL_WASM_ROOT_URL}/vision_wasm_internal.wasm`,
          }
        })

      try {
        await initializeRecognizersFromAssets(localFileset, {
          faceModelAssetPath: LOCAL_FACE_MODEL_ASSET_URL,
          gestureModelAssetPath: LOCAL_GESTURE_MODEL_ASSET_URL,
        })
        recognizerInitialized = true
        sharedRecognizerInitialized = true
        modelSource.value = 'local'
        modelWarmupStatus.value = 'ready'
      }
      catch {
        if (!ENABLE_REMOTE_MODEL_FALLBACK)
          throw new Error('本地视觉模型加载失败。请确认构建产物包含 ./assets/vision/models 和 ./assets/vision/wasm。')

        const remoteFileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> = await FilesetResolver.forVisionTasks(WASM_ROOT_URL)
          .catch(async () => {
            return {
              wasmLoaderPath: WASM_ESM_LOADER_URL,
              wasmBinaryPath: WASM_BINARY_URL,
            }
          })
        await initializeRecognizersFromAssets(remoteFileset, {
          faceModelAssetPath: FACE_MODEL_ASSET_URL,
          gestureModelAssetPath: GESTURE_MODEL_ASSET_URL,
        })
        recognizerInitialized = true
        sharedRecognizerInitialized = true
        modelSource.value = 'remote'
        modelWarmupStatus.value = 'fallback_remote'
      }
    })()
      .catch((caughtError) => {
        modelWarmupStatus.value = 'idle'
        modelSource.value = 'unknown'
        sharedRecognizerInitialized = false
        throw caughtError
      })
      .finally(() => {
        recognizerInitPromise = null
        sharedRecognizerInitPromise = null
      })

    sharedRecognizerInitPromise = recognizerInitPromise
    return recognizerInitPromise
  }

  async function initializeRecognizersFromAssets(
    fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
    modelAssetPath: {
      faceModelAssetPath: string
      gestureModelAssetPath: string
    },
  ) {
    const nextFaceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: modelAssetPath.faceModelAssetPath },
      runningMode: 'VIDEO',
      numFaces: 2,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    })

    try {
      const nextGestureRecognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: modelAssetPath.gestureModelAssetPath },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceLandmarker = nextFaceLandmarker
      gestureRecognizer = nextGestureRecognizer
      sharedFaceLandmarker = nextFaceLandmarker
      sharedGestureRecognizer = nextGestureRecognizer
    }
    catch (caughtError) {
      try {
        nextFaceLandmarker.close()
      }
      catch {}
      throw caughtError
    }
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
    if (!video)
      return

    const tick = async (nowMs: number) => {
      if (!isEnabled.value)
        return
      if (!hasLiveVideoTrack()) {
        cameraState.value = 'off'
        isEnabled.value = false
        clearLoop()
        clearVideoBinding()
        resetFrameState()
        return
      }
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

        if (!recognizerInitialized || !faceLandmarker || !gestureRecognizer) {
          if (!recognizerInitPromise && modelWarmupStatus.value === 'warming') {
            void ensureRecognizers().catch((caughtError) => {
              errorMessage.value = errorMessageFrom(caughtError) ?? 'Vision initialization failed'
              cleanupRecognizers()
            })
          }
          if (!errorMessage.value && modelWarmupStatus.value === 'idle')
            errorMessage.value = '视觉模型尚未预热。请先点击“预热视觉模型”，再进行识别。'
          rafId = requestAnimationFrame(tick)
          return
        }

        if (errorMessage.value === '视觉模型尚未预热。请先点击“预热视觉模型”，再进行识别。')
          errorMessage.value = ''

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

        if (hasFiniteFrameTime)
          lastProcessedVideoTimeSec = frameTimeSec

        const previousSharedInferenceTimestampMs = sharedLastInferenceTimestampMs
        const frameTimestampMs = nextMonotonicInferenceTimestampMs(nowMs)
        if (import.meta.env.DEV) {
          const deltaMs = previousSharedInferenceTimestampMs < 0
            ? null
            : (frameTimestampMs - previousSharedInferenceTimestampMs)
          console.info('[vision] inference timestamp', {
            frameTimestampMs,
            previousTimestampMs: previousSharedInferenceTimestampMs < 0 ? null : previousSharedInferenceTimestampMs,
            deltaMs,
            isMonotonic: previousSharedInferenceTimestampMs < 0 || frameTimestampMs > previousSharedInferenceTimestampMs,
          })
        }

        const activeFaceLandmarker = faceLandmarker
        const activeGestureRecognizer = gestureRecognizer
        if (!activeFaceLandmarker || !activeGestureRecognizer) {
          rafId = requestAnimationFrame(tick)
          return
        }

        if (wallNowMs - lastUiYieldAtMs >= UI_YIELD_INTERVAL_MS) {
          lastUiYieldAtMs = wallNowMs
          await sleep(0)
        }

        const faceResult = activeFaceLandmarker.detectForVideo(video, frameTimestampMs)
        await applyFacePresence(faceResult, frameTimestampMs)
        if ((wallNowMs - lastGestureInferenceAtMs) >= GESTURE_INFERENCE_INTERVAL_MS) {
          const gestureResult = activeGestureRecognizer.recognizeForVideo(video, frameTimestampMs)
          const topGesture = extractTopGesture(gestureResult)
          applyGesture(topGesture, frameTimestampMs)
          lastGestureInferenceAtMs = wallNowMs
        }
        lastInferenceAt.value = Date.now()
        markInferenceSuccess()
      }
      catch (caughtError) {
        const message = recordInferenceError(caughtError)
        errorMessage.value = message

        if (isTimestampMismatchInferenceError(message)) {
          const now = Date.now()
          const shouldRecover = !isRecoveringFromTimestampMismatch
            && now - lastTimestampMismatchRecoveryAtMs >= TIMESTAMP_MISMATCH_RECOVERY_COOLDOWN_MS

          if (shouldRecover) {
            isRecoveringFromTimestampMismatch = true
            lastTimestampMismatchRecoveryAtMs = now
            try {
              clearLoop()
              cleanupRecognizers()
              lastProcessedVideoTimeSec = -1
              lastProcessedFrameTimestampMs = sharedLastInferenceTimestampMs

              if (isEnabled.value && hasLiveVideoTrack()) {
                await ensureRecognizers()
                errorMessage.value = ''
                await startLoop()
              }
            }
            catch (recoveryError) {
              errorMessage.value = errorMessageFrom(recoveryError) ?? message
            }
            finally {
              isRecoveringFromTimestampMismatch = false
            }

            return
          }
        }

        rafId = requestAnimationFrame(tick)
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  async function start() {
    if (isEnabled.value)
      return
    const startToken = ++streamLifecycleToken
    errorMessage.value = ''
    cameraState.value = 'loading'
    resetStartTiming()
    resetCameraDiagnostics()
    lastGesture.value = 'none'
    lastEvent.value = null
    resetPromptState()
    resetFrameState()
    try {
      const launchStartedAt = nowMs()
      startTiming.value = {
        startedAt: roundedMs(launchStartedAt),
        finishedAt: null,
        totalMs: null,
        readyForPreviewMs: null,
        permissionMs: null,
        videoPlayMs: null,
        recognizerInitMs: null,
        recognizerSource: modelSource.value,
      }
      const permissionStartedAt = nowMs()
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: CAMERA_VIDEO_CONSTRAINTS,
      })
      trackCameraStream(nextStream)
      if (startToken !== streamLifecycleToken) {
        stopCameraStream(nextStream, 'stale-start-after-getUserMedia')
        return
      }

      console.info('[vision] camera start stage: permission granted', {
        permissionElapsedMs: roundedMs(nowMs() - permissionStartedAt),
      })
      const permissionMs = nowMs() - permissionStartedAt
      const previousStream = stream.value
      stream.value = nextStream
      if (previousStream && previousStream !== nextStream)
        stopCameraStream(previousStream, 'replaced-by-new-start')

      attachStreamTrackDiagnostics(nextStream)
      bindVideoStream(nextStream)
      const video = videoElement.value
      if (!video) {
        stopCameraStream(nextStream, 'video-element-missing-during-start')
        throw new Error('Vision video element is not attached')
      }
      const videoPlayStartedAt = nowMs()
      await video.play()
      if (startToken !== streamLifecycleToken) {
        stopCameraStream(nextStream, 'stale-start-after-video-play')
        clearVideoBinding()
        return
      }

      console.info('[vision] camera start stage: video.play resolved', {
        videoPlayElapsedMs: roundedMs(nowMs() - videoPlayStartedAt),
      })
      const videoPlayMs = nowMs() - videoPlayStartedAt
      isEnabled.value = true
      cameraState.value = 'active'
      syncQuietState(Date.now())
      startQuietTicker()
      await startLoop()
      console.info('[vision] camera start stage: loop started')

      const afterVideoReadyAt = nowMs()
      startTiming.value = {
        startedAt: roundedMs(launchStartedAt),
        finishedAt: roundedMs(afterVideoReadyAt),
        totalMs: roundedMs(afterVideoReadyAt - launchStartedAt),
        readyForPreviewMs: roundedMs(afterVideoReadyAt - launchStartedAt),
        permissionMs: roundedMs(permissionMs),
        videoPlayMs: roundedMs(videoPlayMs),
        recognizerInitMs: startTiming.value.recognizerInitMs,
        recognizerSource: modelSource.value,
      }
    }
    catch (caughtError) {
      setError(caughtError)
      cleanupAll()
    }
  }

  async function stop() {
    invalidateStreamLifecycle()
    isEnabled.value = false
    clearLoop()
    stopTracks()
    clearVideoBinding()
    resetFrameState()
    cameraState.value = 'off'
    syncQuietState(Date.now())
  }

  async function prewarmVisionModels() {
    if (modelWarmupStatus.value === 'warming')
      return
    const warmupStartedAt = nowMs()
    try {
      await ensureRecognizers()
      const durationMs = nowMs() - warmupStartedAt
      startTiming.value = {
        ...startTiming.value,
        recognizerInitMs: roundedMs(durationMs),
        totalMs: startTiming.value.readyForPreviewMs === null
          ? roundedMs(durationMs)
          : roundedMs(startTiming.value.readyForPreviewMs + durationMs),
        recognizerSource: modelSource.value,
      }
    }
    catch (caughtError) {
      errorMessage.value = errorMessageFrom(caughtError) ?? 'Vision prewarm failed'
      throw caughtError
    }
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

  async function unlockFaceProfile(passphrase: string, options?: { rememberOnDevice?: boolean }) {
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
    const shouldRememberOnDevice = options?.rememberOnDevice ?? rememberFaceProfileOnDevice.value
    if (shouldRememberOnDevice) {
      const persisted = await persistTrustedFaceProfilePassphrase(passphrase)
      if (!persisted)
        rememberFaceProfileOnDevice.value = false
    }
    else {
      await removeTrustedFaceProfilePassphrase()
      rememberFaceProfileOnDevice.value = false
    }

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
    void removeTrustedFaceProfilePassphrase()
    rememberFaceProfileOnDevice.value = false
    autoUnlockAttempted.value = false
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
  void detectSecureStoreAvailability()
  void tryAutoUnlockFaceProfile()
  onBeforeUnmount(() => {
    invalidateStreamLifecycle()
    clearLoop()
    stopQuietTicker()
    stopTracks()
    clearVideoBinding()
    resetFrameState()
    isEnabled.value = false
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
    modelWarmupStatus,
    modelSource,
    modelProfile,
    startTiming,
    cameraDiagnostics,
    faceGateStatusText,
    matchedDisplayName,
    gateEnabled,
    hasEncryptedProfile,
    isProfileUnlocked,
    profileStatus,
    rememberFaceProfileOnDevice,
    secureStoreAvailable,
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
    setRememberFaceProfileOnDevice,
    acknowledgePrompt,
    prewarmVisionModels,
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
