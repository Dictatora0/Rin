import type { Category, FaceLandmarkerResult, GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { GestureQualityPoint, GestureQualityState } from '../utils/gesture-quality'
import type { GestureCandidateGesture, GestureMachineGesture, GestureMachineState } from '../utils/gesture-state-machine'
import type {
  VisionExpressionSignal,
  VisionExpressionSignalResult,
  VisionExpressionSignalSource,
} from '../utils/vision-expression-signals'
import type { FaceSampleQuality, VisionFaceProfilePayload, VisionFaceProfileSample } from './use-encrypted-face-profile'
import type { VisionRuntimeWarmupOptions } from './use-vision-runtime'

import { defineInvoke } from '@moeru/eventa'
import { errorMessageFrom } from '@moeru/std'
import { getElectronEventaContext } from '@proj-airi/electron-vueuse'
import { isElectronWindow } from '@proj-airi/stage-shared'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { electronSecureStoreDelete, electronSecureStoreGet, electronSecureStoreSet } from '../../shared/eventa'
import { verifyGestureGeometry } from '../utils/gesture-geometry'
import {
  assessGestureQuality,
  DEFAULT_GESTURE_QUALITY_THRESHOLDS,

} from '../utils/gesture-quality'
import {
  createGestureStateMachine,
  DEFAULT_GESTURE_STATE_MACHINE_CONFIG,

} from '../utils/gesture-state-machine'
import { resolveVisionExpressionSignal } from '../utils/vision-expression-signals'
import { useEncryptedFaceProfile } from './use-encrypted-face-profile'
import { createLandmarkDescriptor, useLocalFaceGate } from './use-local-face-gate'
import { useVisionRuntime } from './use-vision-runtime'

export type VisionCameraState = 'off' | 'loading' | 'active' | 'error'
export type VisionCameraPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'
export type VisionMediaPipeStatus = 'idle' | 'loading' | 'ready' | 'failed'
export type VisionFacePresence = 'present' | 'absent' | 'unknown'
export type VisionFaceDirection = 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
export type VisionGesture = 'none' | 'open_palm' | 'victory' | 'thumbs_up' | 'unknown'
export type VisionGestureQualityState = GestureQualityState
export type VisionSubjectResponseState = 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
type VisionFaceDirectionDecision = VisionFaceDirection | 'ambiguous'
export type { VisionExpressionSignal }
export type { VisionExpressionSignalSource }

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
    | 'user_centered'
    | 'subject_position_gated'
    | 'expression_smile_like_detected'
    | 'expression_stable_face_detected'
    | 'expression_looking_away_detected'
    | 'expression_unclear_detected'

export interface VisionInteractionEvent {
  id: number
  type: VisionInteractionEventType
  message: string
  at: number
  toastMessage?: string
  subjectPosition?: VisionFaceDirection
}

export interface VisionSubjectResponseEvent {
  direction: VisionFaceDirection
  state: VisionSubjectResponseState
  at: number
  message: string
  gated: boolean
}

export interface VisionInteractionOptions {
  stableFrames?: number
  subjectPositionStableFrames?: number
  subjectDirectionDeadZoneX?: number
  subjectDirectionDeadZoneY?: number
  directionEnterThresholdX?: number
  directionEnterThresholdY?: number
  directionExitThresholdX?: number
  directionExitThresholdY?: number
  directionAxisDominanceRatio?: number
  gestureStableFrames?: number
  gestureInferenceIntervalMs?: number
  gestureScoreThreshold?: number
  eventCooldownMs?: number
  loopIntervalMs?: number
  quietDurationMs?: number
  welcomeBackCooldownMs?: number
  celebrationCooldownMs?: number
  maxInferenceStallMs?: number
  faceGateWelcomeCooldownMs?: number
  autoUnlockFaceProfile?: boolean
  subjectResponseCooldownMs?: number
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

export interface VisionDirectionScoresSnapshot {
  dx: number
  dy: number
  scoreX: number
  scoreY: number
  confidence: number
  dominantAxis: 'x' | 'y' | 'none'
  ambiguous: boolean
}

export interface VisionDirectionDistributionSnapshot {
  windowMs: number
  total: number
  center: number
  left: number
  right: number
  up: number
  down: number
  ambiguous: number
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
  subjectPosition?: VisionFaceDirection
}

interface GestureTopCandidate {
  gesture: GestureCandidateGesture
  confidence: number
  landmarks: NormalizedLandmark[] | null
  handedness: 'left' | 'right' | 'unknown'
}

const DEFAULT_OPTIONS: Required<VisionInteractionOptions> = {
  stableFrames: 3,
  subjectPositionStableFrames: 2,
  subjectDirectionDeadZoneX: 0.09,
  subjectDirectionDeadZoneY: 0.1,
  directionEnterThresholdX: 0.1,
  directionEnterThresholdY: 0.1,
  directionExitThresholdX: 0.07,
  directionExitThresholdY: 0.07,
  directionAxisDominanceRatio: 1.2,
  gestureStableFrames: 2,
  gestureInferenceIntervalMs: 90,
  gestureScoreThreshold: 0.35,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
  quietDurationMs: 60_000,
  welcomeBackCooldownMs: 8_000,
  celebrationCooldownMs: 4_000,
  maxInferenceStallMs: 1_200,
  faceGateWelcomeCooldownMs: 8_000,
  autoUnlockFaceProfile: true,
  subjectResponseCooldownMs: 3_500,
}

const DISPLAY_NAME_LOCAL_STORAGE_KEY = 'airi.vision-experiment.display-name'
const GATE_ENABLED_STORAGE_KEY = 'airi.vision-experiment.local-face-gate-enabled.v1'
const GESTURE_CONTROLS_ENABLED_STORAGE_KEY = 'airi.vision-experiment.gesture-controls-enabled.v1'
const EXPRESSION_SIGNALS_ENABLED_STORAGE_KEY = 'airi.vision-experiment.expression-signals-enabled.v1'
const SUBJECT_NEUTRAL_CENTER_STORAGE_KEY = 'airi.vision-experiment.subject-neutral-center.v1'
const INFERENCE_ERROR_LOG_COOLDOWN_MS = 1_500
const TIMESTAMP_MISMATCH_RECOVERY_COOLDOWN_MS = 3_000
const QUALITY_EVALUATION_INTERVAL_MS = 400
const UI_YIELD_INTERVAL_MS = 240
const EXPRESSION_SIGNAL_STABLE_FRAMES = 5
const EXPRESSION_LOOKING_AWAY_DIRECTION_SETTLE_MS = 2_500
const EXPRESSION_SIGNAL_COOLDOWN_MS: Record<VisionExpressionSignal, number> = {
  none: 0,
  smile_like_signal: 10_000,
  stable_face_signal: 12_000,
  looking_away_signal: 15_000,
  unclear_face_signal: 9_000,
  low_confidence: 9_000,
}
const FACE_PROFILE_AUTO_UNLOCK_STORE_KEY = 'vision.face-profile.auto-unlock.passphrase.v1'
const ENABLE_VISION_VERBOSE_DEBUG_LOGS = import.meta.env.DEV
  && import.meta.env.VITE_VISION_DEBUG_LOGS === 'true'
const DIRECTION_DISTRIBUTION_WINDOW_MS = 60_000

const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 960, max: 1280 },
  height: { ideal: 540, max: 720 },
  frameRate: { ideal: 24, max: 30 },
}
const CAMERA_PERMISSION_TIMEOUT_MS = 12_000
const VIDEO_ELEMENT_ATTACH_TIMEOUT_MS = 1_500

export function useVisionInteraction(options?: VisionInteractionOptions) {
  const runtimeOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  const normalizeNumericOption = (value: unknown, fallback: number) => {
    return Number.isFinite(value) ? Number(value) : fallback
  }
  const directionAxisDominanceRatio = normalizeNumericOption(
    runtimeOptions.directionAxisDominanceRatio,
    DEFAULT_OPTIONS.directionAxisDominanceRatio,
  )
  const subjectDirectionEnterThresholdX = normalizeNumericOption(
    options?.directionEnterThresholdX
    ?? options?.subjectDirectionDeadZoneX
    ?? runtimeOptions.directionEnterThresholdX,
    DEFAULT_OPTIONS.directionEnterThresholdX,
  )
  const subjectDirectionEnterThresholdY = normalizeNumericOption(
    options?.directionEnterThresholdY
    ?? options?.subjectDirectionDeadZoneY
    ?? runtimeOptions.directionEnterThresholdY,
    DEFAULT_OPTIONS.directionEnterThresholdY,
  )
  const subjectDirectionExitThresholdX = options?.directionExitThresholdX
    ?? Math.min(subjectDirectionEnterThresholdX, normalizeNumericOption(
      runtimeOptions.directionExitThresholdX,
      DEFAULT_OPTIONS.directionExitThresholdX,
    ))
  const subjectDirectionExitThresholdY = options?.directionExitThresholdY
    ?? Math.min(subjectDirectionEnterThresholdY, normalizeNumericOption(
      runtimeOptions.directionExitThresholdY,
      DEFAULT_OPTIONS.directionExitThresholdY,
    ))
  const initialSubjectNeutralCenterState = loadSubjectNeutralCenterState()
  const effectiveGestureInferenceIntervalMs = Math.max(40, Math.round(runtimeOptions.gestureInferenceIntervalMs))
  const effectiveGestureScoreThreshold = Math.min(0.9, Math.max(0.05, runtimeOptions.gestureScoreThreshold))
  const visionRuntime = useVisionRuntime()

  const isEnabled = ref(false)
  const cameraState = ref<VisionCameraState>('off')
  const cameraPermissionState = ref<VisionCameraPermissionState>('unknown')
  const mediaPipeStatus = computed<VisionMediaPipeStatus>(() => visionRuntime.mediaPipeStatus.value)
  const facePresence = ref<VisionFacePresence>('unknown')
  const faceDirection = ref<VisionFaceDirection>('unknown')
  const faceCenter = ref<{ x: number, y: number } | null>(null)
  const subjectNeutralCenter = ref<{ x: number, y: number } | null>(initialSubjectNeutralCenterState.center)
  const subjectNeutralCenterUpdatedAt = ref<string | null>(initialSubjectNeutralCenterState.updatedAt)
  const directionScores = ref<VisionDirectionScoresSnapshot>({
    dx: 0,
    dy: 0,
    scoreX: 0,
    scoreY: 0,
    confidence: 0,
    dominantAxis: 'none',
    ambiguous: false,
  })
  const directionDistribution = ref<VisionDirectionDistributionSnapshot>({
    windowMs: DIRECTION_DISTRIBUTION_WINDOW_MS,
    total: 0,
    center: 0,
    left: 0,
    right: 0,
    up: 0,
    down: 0,
    ambiguous: 0,
  })
  const subjectPosition = ref<VisionFaceDirection>('unknown')
  const lastStableSubjectPosition = ref<VisionFaceDirection>('unknown')
  const subjectPositionChangedAt = ref<number | null>(null)
  const subjectResponseState = ref<VisionSubjectResponseState>('idle')
  const lastSubjectResponseEvent = ref<VisionSubjectResponseEvent | null>(null)
  const subjectResponseCooldownUntil = ref(0)
  const enableExpressionSignals = ref(loadExpressionSignalsEnabled())
  const expressionSignal = ref<VisionExpressionSignal>('none')
  const expressionSignalCandidate = ref<VisionExpressionSignal>('none')
  const stableExpressionSignal = ref<VisionExpressionSignal>('none')
  const expressionSignalStableFrames = ref(0)
  const expressionSignalConfidence = ref(0)
  const expressionSignalReason = ref(enableExpressionSignals.value
    ? 'No stable expression signal.'
    : 'Expression signals are disabled.')
  const expressionSignalSource = ref<VisionExpressionSignalSource>('fallback')
  const expressionSignalChangedAt = ref<number | null>(null)
  const expressionSignalCooldownUntil = ref(0)
  const expressionSignalFeedbackAllowed = ref(false)
  const expressionSignalUnavailable = ref(false)
  const lastGesture = ref<VisionGesture>('none')
  const gestureControlsEnabled = ref(loadGestureControlsEnabled())
  const candidateGesture = ref<GestureCandidateGesture>('none')
  const stableGesture = ref<GestureCandidateGesture>('none')
  const gestureState = ref<GestureMachineState>('idle')
  const gestureConfidence = ref(0)
  const gestureVoteCount = ref(0)
  const gestureVoteWindowSize = ref(DEFAULT_GESTURE_STATE_MACHINE_CONFIG.voting.windowSize)
  const geometryPassRate = ref(0)
  const gestureQualityState = ref<VisionGestureQualityState>('unknown')
  const handSizeRatio = ref(0)
  const handInsideGuideArea = ref(false)
  const holdProgressMs = ref(0)
  const holdDurationMs = ref(0)
  const cooldownRemainingMs = ref(0)
  const releaseRequired = ref(false)
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
  const modelWarmupStatus = computed<VisionModelWarmupStatus>(() => {
    if (visionRuntime.mediaPipeStatus.value === 'loading' || visionRuntime.runtimeStatus.value === 'warming')
      return 'warming'
    if (visionRuntime.mediaPipeStatus.value === 'ready' && visionRuntime.modelSource.value === 'remote')
      return 'fallback_remote'
    if (visionRuntime.mediaPipeStatus.value === 'ready')
      return 'ready'
    return 'idle'
  })
  const modelSource = visionRuntime.modelSource
  const modelProfile = visionRuntime.modelProfile
  const runtimeStatus = visionRuntime.runtimeStatus
  const runtimeWarmupDurationMs = visionRuntime.warmupDurationMs
  const runtimeRetryCount = visionRuntime.retryCount
  const runtimeLastError = visionRuntime.lastError
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
  const openCvFaceQuality = visionRuntime.getOpenCVRuntime()
  const gestureStateMachine = createGestureStateMachine(DEFAULT_GESTURE_STATE_MACHINE_CONFIG)
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

  let rafId: number | null = null
  let lastLoopAtMs = 0

  let quietTickerId: number | null = null
  let nextEventId = 1
  let activePromptEventId: number | null = null
  let lastProcessedVideoTimeSec = -1
  let lastProcessedFrameTimestampMs = -1

  let presentFrameStreak = 0
  let absentFrameStreak = 0
  let stablePresence: Exclude<VisionFacePresence, 'unknown'> | null = null

  let candidateDirection: VisionFaceDirection = 'unknown'
  let candidateDirectionFrames = 0
  let lastDirectionDecision: VisionFaceDirectionDecision = 'unknown'
  let expressionSignalCandidateFrames = 0
  let centeredDirectionStartedAt: number | null = null
  let awayDirectionStartedAt: number | null = null
  let awayDirectionCandidate: Exclude<VisionFaceDirection, 'unknown' | 'center'> | null = null
  const directionHistory: Array<{ at: number, direction: VisionFaceDirectionDecision }> = []

  let previousGestureHandCenter: GestureQualityPoint | null = null
  let previousGestureHandTimestampMs: number | null = null

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
  let cameraPermissionStatus: PermissionStatus | null = null

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
    const floorTimestampMs = lastProcessedFrameTimestampMs
    const nextTimestampMs = candidateTimestampMs > floorTimestampMs
      ? candidateTimestampMs
      : (floorTimestampMs + 1)
    lastProcessedFrameTimestampMs = nextTimestampMs
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
  const canTriggerSubjectPositionResponse = computed(() => {
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

  function loadGestureControlsEnabled() {
    if (typeof localStorage === 'undefined')
      return false
    try {
      return localStorage.getItem(GESTURE_CONTROLS_ENABLED_STORAGE_KEY) === 'true'
    }
    catch {
      return false
    }
  }

  function loadExpressionSignalsEnabled() {
    if (typeof localStorage === 'undefined')
      return false
    try {
      return localStorage.getItem(EXPRESSION_SIGNALS_ENABLED_STORAGE_KEY) === 'true'
    }
    catch {
      return false
    }
  }

  function normalizeCenterValue(value: unknown) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric))
      return null
    return Math.min(1, Math.max(0, numeric))
  }

  function loadSubjectNeutralCenterState() {
    if (typeof localStorage === 'undefined') {
      return {
        center: null as { x: number, y: number } | null,
        updatedAt: null as string | null,
      }
    }

    try {
      const raw = localStorage.getItem(SUBJECT_NEUTRAL_CENTER_STORAGE_KEY)
      if (!raw) {
        return {
          center: null,
          updatedAt: null,
        }
      }
      const parsed = JSON.parse(raw) as { x?: unknown, y?: unknown, updatedAt?: unknown } | null
      const x = normalizeCenterValue(parsed?.x)
      const y = normalizeCenterValue(parsed?.y)
      if (x === null || y === null) {
        return {
          center: null,
          updatedAt: null,
        }
      }
      const updatedAt = typeof parsed?.updatedAt === 'string' && parsed.updatedAt.trim().length > 0
        ? parsed.updatedAt
        : null
      return {
        center: { x, y },
        updatedAt,
      }
    }
    catch {
      return {
        center: null,
        updatedAt: null,
      }
    }
  }

  function persistSubjectNeutralCenter(
    center: { x: number, y: number } | null,
    updatedAt: string | null,
  ) {
    if (typeof localStorage === 'undefined')
      return

    try {
      if (!center) {
        localStorage.removeItem(SUBJECT_NEUTRAL_CENTER_STORAGE_KEY)
        return
      }
      localStorage.setItem(SUBJECT_NEUTRAL_CENTER_STORAGE_KEY, JSON.stringify({
        x: center.x,
        y: center.y,
        updatedAt,
      }))
    }
    catch {
      // ignore storage write failures
    }
  }

  function calibrateSubjectNeutralCenter() {
    if (!faceCenter.value) {
      return {
        ok: false as const,
        reason: 'no face',
      }
    }

    const calibrated = {
      x: Math.min(1, Math.max(0, faceCenter.value.x)),
      y: Math.min(1, Math.max(0, faceCenter.value.y)),
    }
    const updatedAt = new Date().toISOString()
    subjectNeutralCenter.value = calibrated
    subjectNeutralCenterUpdatedAt.value = updatedAt
    persistSubjectNeutralCenter(calibrated, updatedAt)
    return {
      ok: true as const,
      center: calibrated,
    }
  }

  function resetSubjectNeutralCenter() {
    subjectNeutralCenter.value = null
    subjectNeutralCenterUpdatedAt.value = null
    persistSubjectNeutralCenter(null, null)
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

  function persistGestureControlsEnabled(enabled: boolean) {
    if (typeof localStorage === 'undefined')
      return
    try {
      localStorage.setItem(GESTURE_CONTROLS_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
    }
    catch {
      // ignore storage write failures
    }
  }

  function persistExpressionSignalsEnabled(enabled: boolean) {
    if (typeof localStorage === 'undefined')
      return
    try {
      localStorage.setItem(EXPRESSION_SIGNALS_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
    }
    catch {
      // ignore storage write failures
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

  function setGestureControlsEnabled(enabled: boolean) {
    gestureControlsEnabled.value = enabled
    persistGestureControlsEnabled(enabled)
    if (!enabled)
      resetGesturePipelineState()
  }

  function setExpressionSignalsEnabled(enabled: boolean) {
    enableExpressionSignals.value = enabled
    persistExpressionSignalsEnabled(enabled)
    if (!enabled) {
      expressionSignal.value = 'none'
      expressionSignalCandidate.value = 'none'
      stableExpressionSignal.value = 'none'
      expressionSignalStableFrames.value = 0
      expressionSignalConfidence.value = 0
      expressionSignalReason.value = 'Expression signals are disabled.'
      expressionSignalSource.value = 'fallback'
      expressionSignalChangedAt.value = null
      expressionSignalCooldownUntil.value = 0
      expressionSignalFeedbackAllowed.value = false
      expressionSignalUnavailable.value = false
      expressionSignalCandidateFrames = 0
      centeredDirectionStartedAt = null
      awayDirectionStartedAt = null
      awayDirectionCandidate = null
    }
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

  function resetGesturePipelineState() {
    gestureStateMachine.reset()
    const diagnostics = gestureStateMachine.getDiagnostics()
    candidateGesture.value = diagnostics.candidateGesture
    stableGesture.value = diagnostics.stableGesture
    gestureState.value = diagnostics.gestureState
    gestureConfidence.value = diagnostics.gestureConfidence
    gestureVoteCount.value = diagnostics.gestureVotes
    gestureVoteWindowSize.value = diagnostics.windowSize
    geometryPassRate.value = diagnostics.geometryPassRate
    gestureQualityState.value = diagnostics.qualityState
    handSizeRatio.value = 0
    handInsideGuideArea.value = false
    holdProgressMs.value = diagnostics.holdProgressMs
    holdDurationMs.value = diagnostics.holdDurationMs
    cooldownRemainingMs.value = diagnostics.cooldownRemainingMs
    releaseRequired.value = diagnostics.releaseRequired
    previousGestureHandCenter = null
    previousGestureHandTimestampMs = null
  }

  function resetFrameState() {
    presentFrameStreak = 0
    absentFrameStreak = 0
    stablePresence = null

    candidateDirection = 'unknown'
    candidateDirectionFrames = 0
    lastDirectionDecision = 'unknown'
    directionHistory.length = 0
    directionDistribution.value = {
      windowMs: DIRECTION_DISTRIBUTION_WINDOW_MS,
      total: 0,
      center: 0,
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      ambiguous: 0,
    }
    directionScores.value = {
      dx: 0,
      dy: 0,
      scoreX: 0,
      scoreY: 0,
      confidence: 0,
      dominantAxis: 'none',
      ambiguous: false,
    }
    lastStableFaceDirection.value = 'unknown'
    subjectPosition.value = 'unknown'
    lastStableSubjectPosition.value = 'unknown'
    subjectPositionChangedAt.value = null
    subjectResponseState.value = 'idle'
    lastSubjectResponseEvent.value = null
    subjectResponseCooldownUntil.value = 0
    expressionSignal.value = 'none'
    expressionSignalCandidate.value = 'none'
    stableExpressionSignal.value = 'none'
    expressionSignalStableFrames.value = 0
    expressionSignalConfidence.value = 0
    expressionSignalReason.value = enableExpressionSignals.value
      ? 'No stable expression signal.'
      : 'Expression signals are disabled.'
    expressionSignalSource.value = 'fallback'
    expressionSignalChangedAt.value = null
    expressionSignalCooldownUntil.value = 0
    expressionSignalFeedbackAllowed.value = false
    expressionSignalUnavailable.value = false
    expressionSignalCandidateFrames = 0
    centeredDirectionStartedAt = null
    awayDirectionStartedAt = null
    awayDirectionCandidate = null

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
    resetGesturePipelineState()
    localFaceGate.resetForCameraStop()
  }

  function resetPromptState() {
    activePrompt.value = ''
    activePromptEventId = null
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

  function normalizePermissionState(state: PermissionState): VisionCameraPermissionState {
    if (state === 'granted')
      return 'granted'
    if (state === 'denied')
      return 'denied'
    return 'prompt'
  }

  async function refreshCameraPermissionState() {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
      cameraPermissionState.value = 'unsupported'
      return cameraPermissionState.value
    }

    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName })
      cameraPermissionStatus = status
      const sync = () => {
        cameraPermissionState.value = normalizePermissionState(status.state)
      }
      sync()
      status.onchange = sync
      return cameraPermissionState.value
    }
    catch {
      if (cameraPermissionState.value === 'unknown')
        cameraPermissionState.value = 'unsupported'
      return cameraPermissionState.value
    }
  }

  function inferPermissionStateFromError(error: unknown): VisionCameraPermissionState {
    const errorName = String((error as { name?: unknown })?.name ?? '')
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorName === 'SecurityError')
      return 'denied'
    return cameraPermissionState.value
  }

  function normalizeGestureName(categoryName: string | null | undefined): VisionGesture {
    if (!categoryName)
      return 'none'
    const normalized = categoryName.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
    if (normalized === 'none')
      return 'none'
    if (normalized === 'open_palm')
      return 'open_palm'
    if (normalized === 'victory' || normalized === 'peace' || normalized === 'v_sign')
      return 'victory'
    if (normalized === 'thumb_up' || normalized === 'thumbs_up')
      return 'thumbs_up'
    return 'unknown'
  }

  function normalizeHandednessLabel(label: string | null | undefined) {
    const normalized = label?.trim().toLowerCase()
    if (normalized === 'left')
      return 'left'
    if (normalized === 'right')
      return 'right'
    return 'unknown'
  }

  function logGestureDebug(message: string, payload: Record<string, unknown>) {
    if (!ENABLE_VISION_VERBOSE_DEBUG_LOGS)
      return

    console.info(`[vision][gesture] ${message}`, payload)
  }

  function shouldGateInteraction() {
    return !canTriggerInteractiveFeedback.value
  }

  function isTriggerGesture(gesture: GestureCandidateGesture): gesture is GestureMachineGesture {
    return gesture === 'open_palm' || gesture === 'victory' || gesture === 'thumbs_up'
  }

  function extractTopGestureCandidate(result: GestureRecognizerResult): GestureTopCandidate {
    const gestureRows = Array.isArray(result.gestures) ? result.gestures : []
    const landmarkRows = Array.isArray(result.landmarks) ? result.landmarks : []
    const handednessRows = (Array.isArray(result.handedness) ? result.handedness : result.handednesses) ?? []

    let bestCandidate: GestureTopCandidate | null = null
    let sawNone = false
    let sawUnknown = false
    let firstHandLandmarks: NormalizedLandmark[] | null = null
    let firstHandedness: 'left' | 'right' | 'unknown' = 'unknown'
    let fallbackConfidence = 0

    for (let handIndex = 0; handIndex < Math.max(gestureRows.length, 1); handIndex += 1) {
      const categories = (gestureRows[handIndex] ?? []) as Category[]
      const landmarks = landmarkRows[handIndex] ?? null
      const handedness = normalizeHandednessLabel(
        handednessRows[handIndex]?.[0]?.categoryName ?? null,
      )

      if (handIndex === 0) {
        firstHandLandmarks = landmarks
        firstHandedness = handedness
      }

      for (const category of categories) {
        const normalized = normalizeGestureName(category.categoryName)
        const score = Number.isFinite(category.score) ? Number(category.score) : 0
        if (score < effectiveGestureScoreThreshold)
          continue

        if (normalized === 'none') {
          sawNone = true
          fallbackConfidence = Math.max(fallbackConfidence, score)
          continue
        }
        if (normalized === 'unknown') {
          sawUnknown = true
          fallbackConfidence = Math.max(fallbackConfidence, score)
          continue
        }

        const nextCandidate: GestureTopCandidate = {
          gesture: normalized,
          confidence: score,
          landmarks,
          handedness,
        }
        if (!bestCandidate || nextCandidate.confidence > bestCandidate.confidence)
          bestCandidate = nextCandidate
      }
    }

    if (bestCandidate)
      return bestCandidate
    if (sawNone) {
      return {
        gesture: 'none',
        confidence: fallbackConfidence,
        landmarks: firstHandLandmarks,
        handedness: firstHandedness,
      }
    }
    if (sawUnknown) {
      return {
        gesture: 'unknown',
        confidence: fallbackConfidence,
        landmarks: firstHandLandmarks,
        handedness: firstHandedness,
      }
    }
    return {
      gesture: 'none',
      confidence: 0,
      landmarks: firstHandLandmarks,
      handedness: firstHandedness,
    }
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
      subjectPosition: options.subjectPosition,
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

  function getNeutralCenter() {
    return subjectNeutralCenter.value ?? { x: 0.5, y: 0.5 }
  }

  function isDirectionalValue(
    direction: VisionFaceDirectionDecision,
  ): direction is Exclude<VisionFaceDirection, 'unknown' | 'center'> {
    return direction === 'left' || direction === 'right' || direction === 'up' || direction === 'down'
  }

  function pushDirectionHistory(direction: VisionFaceDirectionDecision, nowMs: number) {
    directionHistory.push({ at: nowMs, direction })
    const cutoff = nowMs - DIRECTION_DISTRIBUTION_WINDOW_MS
    while (directionHistory.length > 0 && directionHistory[0]!.at < cutoff)
      directionHistory.shift()

    const distribution: VisionDirectionDistributionSnapshot = {
      windowMs: DIRECTION_DISTRIBUTION_WINDOW_MS,
      total: directionHistory.length,
      center: 0,
      left: 0,
      right: 0,
      up: 0,
      down: 0,
      ambiguous: 0,
    }
    for (const item of directionHistory) {
      if (item.direction === 'center')
        distribution.center += 1
      else if (item.direction === 'left')
        distribution.left += 1
      else if (item.direction === 'right')
        distribution.right += 1
      else if (item.direction === 'up')
        distribution.up += 1
      else if (item.direction === 'down')
        distribution.down += 1
      else if (item.direction === 'ambiguous')
        distribution.ambiguous += 1
    }
    directionDistribution.value = distribution
  }

  function computeDirectionDecision(center: { x: number, y: number } | null): VisionFaceDirectionDecision {
    if (!center) {
      directionScores.value = {
        dx: 0,
        dy: 0,
        scoreX: 0,
        scoreY: 0,
        confidence: 0,
        dominantAxis: 'none',
        ambiguous: false,
      }
      return 'unknown'
    }
    const neutralCenter = getNeutralCenter()
    const dx = center.x - neutralCenter.x
    const dy = center.y - neutralCenter.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    const hasDirectionalState = isDirectionalValue(lastDirectionDecision)
    const thresholdX = hasDirectionalState ? subjectDirectionExitThresholdX : subjectDirectionEnterThresholdX
    const thresholdY = hasDirectionalState ? subjectDirectionExitThresholdY : subjectDirectionEnterThresholdY
    const scoreX = thresholdX > 0 ? absX / thresholdX : 0
    const scoreY = thresholdY > 0 ? absY / thresholdY : 0
    const maxScore = Math.max(scoreX, scoreY)
    const minScore = Math.min(scoreX, scoreY)
    const dominance = minScore > 0 ? maxScore / minScore : Number.POSITIVE_INFINITY
    const dominantAxis = scoreX > scoreY ? 'x' : scoreY > scoreX ? 'y' : 'none'

    if (scoreX < 1 && scoreY < 1) {
      directionScores.value = {
        dx,
        dy,
        scoreX,
        scoreY,
        confidence: Math.min(1, maxScore),
        dominantAxis,
        ambiguous: false,
      }
      return 'center'
    }

    const isAmbiguous = scoreX >= 1
      && scoreY >= 1
      && dominance < directionAxisDominanceRatio
    directionScores.value = {
      dx,
      dy,
      scoreX,
      scoreY,
      confidence: Math.min(1, Math.max(0, maxScore - 1)),
      dominantAxis,
      ambiguous: isAmbiguous,
    }
    if (isAmbiguous)
      return 'ambiguous'

    if (scoreX >= scoreY)
      return dx < 0 ? 'right' : 'left'
    return dy < 0 ? 'up' : 'down'
  }

  function mapSubjectResponseState(direction: VisionFaceDirection): VisionSubjectResponseState {
    if (direction === 'left')
      return 'following_left'
    if (direction === 'right')
      return 'following_right'
    if (direction === 'up')
      return 'looking_up'
    if (direction === 'down')
      return 'looking_down'
    if (direction === 'center')
      return 'centered'
    return 'idle'
  }

  function updateSubjectResponseEvent(event: VisionSubjectResponseEvent) {
    lastSubjectResponseEvent.value = event
    subjectResponseState.value = event.state
    subjectPosition.value = event.direction
    subjectPositionChangedAt.value = event.at
  }

  function applyFaceDirection(center: { x: number, y: number } | null, nowMs: number, options: {
    allowFeedback: boolean
    gateBlockingActive: boolean
  }) {
    faceCenter.value = center
    const directionDecision = computeDirectionDecision(center)
    pushDirectionHistory(directionDecision, nowMs)
    if (directionDecision === 'ambiguous')
      return

    const rawDirection = directionDecision
    lastDirectionDecision = directionDecision
    if (rawDirection === candidateDirection) {
      candidateDirectionFrames += 1
    }
    else {
      candidateDirection = rawDirection
      candidateDirectionFrames = 1
    }

    if (candidateDirectionFrames < runtimeOptions.subjectPositionStableFrames)
      return
    if (faceDirection.value === rawDirection)
      return

    const previousDirection = faceDirection.value
    faceDirection.value = rawDirection
    lastStableFaceDirection.value = rawDirection
    subjectPosition.value = rawDirection

    if (rawDirection === 'unknown') {
      lastStableSubjectPosition.value = 'unknown'
      subjectResponseState.value = options.gateBlockingActive ? 'gated' : 'idle'
      return
    }

    if (!options.allowFeedback) {
      if (options.gateBlockingActive) {
        const gatedMessage = 'Subject position detected but gated.'
        updateSubjectResponseEvent({
          direction: rawDirection,
          state: 'gated',
          at: nowMs,
          message: gatedMessage,
          gated: true,
        })
        emitEvent({
          type: 'subject_position_gated',
          message: gatedMessage,
          toastMessage: gatedMessage,
          nowMs,
          cooldownMs: runtimeOptions.subjectResponseCooldownMs,
          cooldownKey: `subject_position_gated:${rawDirection}`,
          isAutomatic: true,
          subjectPosition: rawDirection,
        })
      }
      else {
        subjectResponseState.value = 'idle'
      }
      lastStableSubjectPosition.value = rawDirection
      return
    }

    const isSameStableDirection = lastStableSubjectPosition.value === rawDirection
    if (isSameStableDirection && nowMs < subjectResponseCooldownUntil.value)
      return
    if (isSameStableDirection)
      return

    let eventType: VisionInteractionEventType = 'user_centered'
    let eventMessage = '已回到画面中心。'
    if (rawDirection === 'left') {
      eventType = 'user_moved_left'
      eventMessage = '你稍微偏到画面左侧。'
    }
    else if (rawDirection === 'right') {
      eventType = 'user_moved_right'
      eventMessage = '你稍微偏到画面右侧。'
    }
    else if (rawDirection === 'up') {
      eventType = 'user_moved_up'
      eventMessage = '你稍微偏到画面上方。'
    }
    else if (rawDirection === 'down') {
      eventType = 'user_moved_down'
      eventMessage = '你稍微偏到画面下方。'
    }

    if (rawDirection === previousDirection)
      return

    const emitted = emitEvent({
      type: eventType,
      message: eventMessage,
      toastMessage: eventMessage,
      nowMs,
      cooldownMs: runtimeOptions.subjectResponseCooldownMs,
      cooldownKey: `subject_position:${rawDirection}`,
      isAutomatic: true,
      subjectPosition: rawDirection,
    })
    if (!emitted)
      return

    lastStableSubjectPosition.value = rawDirection
    subjectResponseCooldownUntil.value = nowMs + runtimeOptions.subjectResponseCooldownMs
    updateSubjectResponseEvent({
      direction: rawDirection,
      state: mapSubjectResponseState(rawDirection),
      at: nowMs,
      message: eventMessage,
      gated: false,
    })
  }

  function mapExpressionSignalToEventType(signal: VisionExpressionSignal): VisionInteractionEventType | null {
    if (signal === 'smile_like_signal')
      return 'expression_smile_like_detected'
    if (signal === 'stable_face_signal')
      return 'expression_stable_face_detected'
    if (signal === 'looking_away_signal')
      return 'expression_looking_away_detected'
    if (signal === 'unclear_face_signal' || signal === 'low_confidence')
      return 'expression_unclear_detected'
    return null
  }

  function buildExpressionSignalEventMessage(signal: VisionExpressionSignal) {
    if (signal === 'smile_like_signal')
      return 'Smile-like signal detected.'
    if (signal === 'stable_face_signal')
      return 'Stable face signal detected.'
    if (signal === 'looking_away_signal')
      return '检测到主体位置偏离中心。'
    return 'Visual signal is unclear.'
  }

  function updateExpressionSignalDurations(nowMs: number) {
    if (facePresence.value !== 'present' || faceDirection.value === 'unknown') {
      centeredDirectionStartedAt = null
      awayDirectionStartedAt = null
      awayDirectionCandidate = null
      return {
        centeredDurationMs: 0,
        awayDurationMs: 0,
      }
    }

    if (faceDirection.value === 'center') {
      if (centeredDirectionStartedAt === null)
        centeredDirectionStartedAt = nowMs
      awayDirectionStartedAt = null
      awayDirectionCandidate = null
      return {
        centeredDurationMs: Math.max(0, nowMs - centeredDirectionStartedAt),
        awayDurationMs: 0,
      }
    }

    if (awayDirectionCandidate !== faceDirection.value) {
      awayDirectionCandidate = faceDirection.value as Exclude<VisionFaceDirection, 'unknown' | 'center'>
      awayDirectionStartedAt = nowMs
    }
    if (awayDirectionStartedAt === null)
      awayDirectionStartedAt = nowMs
    centeredDirectionStartedAt = null
    return {
      centeredDurationMs: 0,
      awayDurationMs: Math.max(0, nowMs - awayDirectionStartedAt),
    }
  }

  function applyExpressionSignal(options: {
    nowMs: number
    faceLandmarksLength: number
    blendshapeCategories: Category[]
    blendshapeOutputAvailable: boolean
    qualityScore: number | undefined
  }) {
    if (!enableExpressionSignals.value) {
      expressionSignal.value = 'none'
      expressionSignalCandidate.value = 'none'
      stableExpressionSignal.value = 'none'
      expressionSignalStableFrames.value = 0
      expressionSignalConfidence.value = 0
      expressionSignalReason.value = 'Expression signals are disabled.'
      expressionSignalSource.value = 'fallback'
      expressionSignalChangedAt.value = null
      expressionSignalCooldownUntil.value = 0
      expressionSignalFeedbackAllowed.value = false
      expressionSignalUnavailable.value = false
      expressionSignalCandidateFrames = 0
      centeredDirectionStartedAt = null
      awayDirectionStartedAt = null
      awayDirectionCandidate = null
      return
    }

    const hasSingleFace = options.faceLandmarksLength === 1
    const gateAllowsFeedback = canTriggerSubjectPositionResponse.value
    const feedbackAllowed = gateAllowsFeedback
      && facePresence.value === 'present'
      && hasSingleFace
      && !isVisionQuiet.value

    expressionSignalFeedbackAllowed.value = feedbackAllowed
    expressionSignalUnavailable.value = facePresence.value === 'present'
      && hasSingleFace
      && (!options.blendshapeOutputAvailable || options.blendshapeCategories.length === 0)

    const durations = updateExpressionSignalDurations(options.nowMs)
    const resolvedSignal: VisionExpressionSignalResult = resolveVisionExpressionSignal({
      blendshapes: options.blendshapeCategories.map(category => ({
        categoryName: category.categoryName,
        score: Number.isFinite(category.score) ? Number(category.score) : 0,
      })),
      blendshapeOutputAvailable: options.blendshapeOutputAvailable,
      hasLandmarks: hasSingleFace,
      facePresence: facePresence.value,
      faceDirection: faceDirection.value,
      qualityScore: options.qualityScore,
      faceCenter: faceCenter.value,
      centeredDurationMs: durations.centeredDurationMs,
      awayDurationMs: durations.awayDurationMs,
    })

    expressionSignal.value = resolvedSignal.signal
    expressionSignalConfidence.value = resolvedSignal.confidence
    expressionSignalReason.value = resolvedSignal.reason
    expressionSignalSource.value = resolvedSignal.source

    if (resolvedSignal.signal === expressionSignalCandidate.value) {
      expressionSignalCandidateFrames += 1
    }
    else {
      expressionSignalCandidate.value = resolvedSignal.signal
      expressionSignalCandidateFrames = 1
    }
    expressionSignalStableFrames.value = expressionSignalCandidateFrames

    if (expressionSignalCandidateFrames < EXPRESSION_SIGNAL_STABLE_FRAMES)
      return
    if (stableExpressionSignal.value === resolvedSignal.signal)
      return

    stableExpressionSignal.value = resolvedSignal.signal
    expressionSignalChangedAt.value = options.nowMs

    if (resolvedSignal.signal === 'none')
      return

    if (!feedbackAllowed)
      return

    const cooldownMs = EXPRESSION_SIGNAL_COOLDOWN_MS[resolvedSignal.signal]
    if (cooldownMs > 0 && options.nowMs < expressionSignalCooldownUntil.value)
      return
    if (
      resolvedSignal.signal === 'looking_away_signal'
      && subjectPositionChangedAt.value !== null
      && (options.nowMs - subjectPositionChangedAt.value) < EXPRESSION_LOOKING_AWAY_DIRECTION_SETTLE_MS
    ) {
      return
    }

    const eventType = mapExpressionSignalToEventType(resolvedSignal.signal)
    if (!eventType)
      return

    const eventMessage = buildExpressionSignalEventMessage(resolvedSignal.signal)
    const emitted = emitEvent({
      type: eventType,
      message: eventMessage,
      toastMessage: eventMessage,
      nowMs: options.nowMs,
      cooldownMs: Math.max(runtimeOptions.eventCooldownMs, cooldownMs),
      cooldownKey: `expression_signal:${resolvedSignal.signal}`,
      isAutomatic: true,
    })
    if (!emitted)
      return
    expressionSignalCooldownUntil.value = options.nowMs + cooldownMs
  }

  async function applyFacePresence(faceResult: FaceLandmarkerResult, nowMs: number) {
    latestFaceResult.value = faceResult
    const faceLandmarks = faceResult.faceLandmarks ?? []
    const primaryLandmarks = faceLandmarks[0] ?? []
    const hasFace = faceLandmarks.length > 0 && primaryLandmarks.length > 0
    const hasSingleFace = faceLandmarks.length === 1

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
    const gateBlockingActive = localFaceGate.gateEnabled.value && localFaceGate.gateState.value !== 'enabled'

    const center = hasSingleFace ? computeFaceCenter(primaryLandmarks) : null
    applyFaceDirection(center, nowMs, {
      allowFeedback: allowFeedback && hasSingleFace,
      gateBlockingActive: gateBlockingActive && hasSingleFace,
    })

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

    let nextPresence: VisionFacePresence = 'unknown'
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
      nextPresence = 'present'
    }
    else if (!localFaceGate.gateEnabled.value && absentFrameStreak >= runtimeOptions.stableFrames) {
      if (stablePresence !== 'absent') {
        stablePresence = 'absent'
        lastPresenceTransitionAt.value = nowMs
        emitEvent({
          type: 'user_away',
          message: 'User away',
          nowMs,
          isAutomatic: true,
        })
      }
      nextPresence = 'absent'
    }
    else if (!localFaceGate.gateEnabled.value) {
      nextPresence = 'unknown'
    }
    else {
      nextPresence = gateResult.status === 'no_face' ? 'absent' : (hasFace ? 'present' : 'unknown')
    }

    facePresence.value = nextPresence

    const blendshapeRows = faceResult.faceBlendshapes ?? []
    const primaryBlendshapeCategories = blendshapeRows[0]?.categories ?? []
    applyExpressionSignal({
      nowMs,
      faceLandmarksLength: faceLandmarks.length,
      blendshapeCategories: primaryBlendshapeCategories,
      blendshapeOutputAvailable: Array.isArray(faceResult.faceBlendshapes),
      qualityScore: qualityResult?.qualityScore,
    })
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

  function applyGestureCandidate(candidate: GestureTopCandidate, nowMs: number) {
    const qualityAssessment = assessGestureQuality({
      landmarks: candidate.landmarks,
      confidence: candidate.confidence,
      nowMs,
      previousHandCenter: previousGestureHandCenter,
      previousTimestampMs: previousGestureHandTimestampMs,
      thresholds: DEFAULT_GESTURE_QUALITY_THRESHOLDS,
    })

    if (qualityAssessment.handCenter) {
      previousGestureHandCenter = qualityAssessment.handCenter
      previousGestureHandTimestampMs = nowMs
    }
    else {
      previousGestureHandCenter = null
      previousGestureHandTimestampMs = null
    }

    const geometryPass = isTriggerGesture(candidate.gesture)
      ? verifyGestureGeometry(candidate.gesture, candidate.landmarks, {
          handedness: candidate.handedness,
        })
      : false

    const stateResult = gestureStateMachine.ingest({
      nowMs,
      candidateGesture: candidate.gesture,
      confidence: qualityAssessment.gestureConfidence,
      geometryPass,
      qualityState: qualityAssessment.qualityState,
    })

    const diagnostics = stateResult.diagnostics
    candidateGesture.value = diagnostics.candidateGesture
    stableGesture.value = diagnostics.stableGesture
    gestureState.value = diagnostics.gestureState
    gestureConfidence.value = diagnostics.gestureConfidence
    gestureVoteCount.value = diagnostics.gestureVotes
    gestureVoteWindowSize.value = diagnostics.windowSize
    geometryPassRate.value = diagnostics.geometryPassRate
    gestureQualityState.value = diagnostics.qualityState
    handSizeRatio.value = qualityAssessment.handSizeRatio
    handInsideGuideArea.value = qualityAssessment.handInsideGuideArea
    holdProgressMs.value = diagnostics.holdProgressMs
    holdDurationMs.value = diagnostics.holdDurationMs
    cooldownRemainingMs.value = diagnostics.cooldownRemainingMs
    releaseRequired.value = diagnostics.releaseRequired

    if (diagnostics.stableGesture !== 'none') {
      lastGesture.value = diagnostics.stableGesture
    }
    else if (diagnostics.candidateGesture === 'unknown') {
      lastGesture.value = 'unknown'
    }
    else {
      lastGesture.value = 'none'
    }

    logGestureDebug('gesture sample processed', {
      nowMs,
      candidateGesture: diagnostics.candidateGesture,
      stableGesture: diagnostics.stableGesture,
      state: diagnostics.gestureState,
      votes: diagnostics.gestureVotes,
      windowSize: diagnostics.windowSize,
      gestureConfidence: Number(diagnostics.gestureConfidence.toFixed(3)),
      geometryPassRate: Number(diagnostics.geometryPassRate.toFixed(3)),
      qualityState: diagnostics.qualityState,
      handSizeRatio: Number(qualityAssessment.handSizeRatio.toFixed(4)),
      handInsideGuideArea: qualityAssessment.handInsideGuideArea,
      holdProgressMs: diagnostics.holdProgressMs,
      holdDurationMs: diagnostics.holdDurationMs,
      cooldownRemainingMs: diagnostics.cooldownRemainingMs,
      releaseRequired: diagnostics.releaseRequired,
      gateEnabled: localFaceGate.gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      profileStatus: localFaceGate.profileStatus.value,
      canTriggerInteractiveFeedback: canTriggerInteractiveFeedback.value,
      faceGateStatusText: faceGateStatusText.value,
    })

    if (!stateResult.triggeredGesture)
      return

    if (stateResult.triggeredGesture === 'open_palm')
      handleOpenPalm(nowMs)
    else if (stateResult.triggeredGesture === 'victory')
      handleVictory(nowMs)
    else
      handleThumbsUp(nowMs)
  }

  async function ensureVisionRuntimeReady(options?: VisionRuntimeWarmupOptions) {
    await visionRuntime.warmupVisionRuntime({
      background: options?.background ?? false,
      includeOpenCv: options?.includeOpenCv ?? true,
      force: options?.force ?? false,
    })

    const runtime = visionRuntime.getMediaPipeRuntime()
    if (!runtime) {
      const runtimeError = visionRuntime.lastError.value
      throw new Error(runtimeError || 'Vision runtime is not ready')
    }
    return runtime
  }

  function bindVideoStream(nextStream: MediaStream, targetVideo?: HTMLVideoElement) {
    const video = targetVideo ?? videoElement.value
    if (!video)
      throw new Error('Vision video element is not attached')
    video.srcObject = nextStream
    video.muted = true
    video.playsInline = true
  }

  async function waitForAttachedVideoElement(timeoutMs = VIDEO_ELEMENT_ATTACH_TIMEOUT_MS) {
    if (videoElement.value)
      return videoElement.value

    return await new Promise<HTMLVideoElement>((resolve, reject) => {
      let settled = false
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const stopWatch = watch(videoElement, (element) => {
        if (!element || settled)
          return
        settled = true
        if (timeoutId !== null)
          clearTimeout(timeoutId)
        stopWatch()
        resolve(element)
      }, { immediate: true })

      timeoutId = setTimeout(() => {
        if (settled)
          return
        settled = true
        stopWatch()
        reject(new Error('Vision video element is not attached'))
      }, timeoutMs)
    })
  }

  async function requestCameraStream() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia)
      throw new Error('Camera API is unavailable')

    return await new Promise<MediaStream>((resolve, reject) => {
      let settled = false
      const timeoutId = setTimeout(() => {
        if (settled)
          return
        settled = true
        reject(new Error('Camera permission request timed out'))
      }, CAMERA_PERMISSION_TIMEOUT_MS)

      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: CAMERA_VIDEO_CONSTRAINTS,
      }).then((nextStream) => {
        if (settled) {
          stopCameraStream(nextStream, 'camera-request-timeout-after-resolve')
          return
        }
        settled = true
        clearTimeout(timeoutId)
        resolve(nextStream)
      }).catch((error) => {
        if (settled)
          return
        settled = true
        clearTimeout(timeoutId)
        reject(error)
      })
    })
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

        const activeRuntime = visionRuntime.getMediaPipeRuntime()
        if (!activeRuntime) {
          if (visionRuntime.runtimeStatus.value !== 'warming' && visionRuntime.mediaPipeStatus.value !== 'loading') {
            void visionRuntime.warmupVisionRuntime({ background: true, includeOpenCv: false }).catch((runtimeError) => {
              errorMessage.value = errorMessageFrom(runtimeError) ?? 'Vision runtime warmup failed'
            })
          }
          if (visionRuntime.runtimeStatus.value === 'failed') {
            errorMessage.value = visionRuntime.lastError.value || 'Vision runtime failed'
          }
          else if (!errorMessage.value) {
            errorMessage.value = 'Vision runtime warming in background.'
          }
          rafId = requestAnimationFrame(tick)
          return
        }

        if (errorMessage.value === 'Vision runtime warming in background.')
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

        const previousInferenceTimestampMs = lastProcessedFrameTimestampMs
        const frameTimestampMs = nextMonotonicInferenceTimestampMs(nowMs)
        if (ENABLE_VISION_VERBOSE_DEBUG_LOGS) {
          const deltaMs = previousInferenceTimestampMs < 0
            ? null
            : (frameTimestampMs - previousInferenceTimestampMs)
          console.info('[vision] inference timestamp', {
            frameTimestampMs,
            previousTimestampMs: previousInferenceTimestampMs < 0 ? null : previousInferenceTimestampMs,
            deltaMs,
            isMonotonic: previousInferenceTimestampMs < 0 || frameTimestampMs > previousInferenceTimestampMs,
          })
        }

        const activeFaceLandmarker = activeRuntime.faceLandmarker
        const activeGestureRecognizer = activeRuntime.gestureRecognizer

        if (wallNowMs - lastUiYieldAtMs >= UI_YIELD_INTERVAL_MS) {
          lastUiYieldAtMs = wallNowMs
          await sleep(0)
        }

        const faceResult = activeFaceLandmarker.detectForVideo(video, frameTimestampMs)
        await applyFacePresence(faceResult, frameTimestampMs)
        if (gestureControlsEnabled.value && (wallNowMs - lastGestureInferenceAtMs) >= effectiveGestureInferenceIntervalMs) {
          const gestureResult = activeGestureRecognizer.recognizeForVideo(video, frameTimestampMs)
          const topGesture = extractTopGestureCandidate(gestureResult)
          applyGestureCandidate(topGesture, frameTimestampMs)
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
              lastProcessedVideoTimeSec = -1
              lastProcessedFrameTimestampMs = -1

              if (isEnabled.value && hasLiveVideoTrack()) {
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
      void refreshCameraPermissionState()
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
      const nextStream = await requestCameraStream()
      cameraPermissionState.value = 'granted'
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
      const video = await waitForAttachedVideoElement()
      if (startToken !== streamLifecycleToken) {
        stopCameraStream(nextStream, 'stale-start-after-video-attach')
        return
      }
      bindVideoStream(nextStream, video)
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
      const recognizerInitStartedAt = nowMs()
      await ensureVisionRuntimeReady({ background: false, includeOpenCv: false })
      if (startToken !== streamLifecycleToken) {
        stopCameraStream(nextStream, 'stale-start-after-runtime-warmup')
        clearVideoBinding()
        return
      }
      const recognizerInitMs = nowMs() - recognizerInitStartedAt
      startTiming.value = {
        ...startTiming.value,
        recognizerInitMs: roundedMs(recognizerInitMs),
        recognizerSource: modelSource.value,
      }

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
        recognizerInitMs: startTiming.value.recognizerInitMs ?? roundedMs(nowMs() - recognizerInitStartedAt),
        recognizerSource: modelSource.value,
      }
    }
    catch (caughtError) {
      cameraPermissionState.value = inferPermissionStateFromError(caughtError)
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
    if (visionRuntime.runtimeStatus.value === 'warming')
      return
    const warmupStartedAt = nowMs()
    try {
      await visionRuntime.warmupVisionRuntime({
        background: true,
        includeOpenCv: false,
      })
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
      errorMessage.value = errorMessageFrom(caughtError) ?? visionRuntime.lastError.value ?? 'Vision prewarm failed'
      throw caughtError
    }
  }

  async function warmupVisionRuntime(options?: VisionRuntimeWarmupOptions) {
    await visionRuntime.warmupVisionRuntime({
      background: options?.background ?? false,
      includeOpenCv: options?.includeOpenCv ?? true,
      force: options?.force ?? false,
    })
  }

  async function retryVisionRuntime() {
    try {
      await visionRuntime.retryVisionRuntime({
        includeOpenCv: false,
      })
      if (errorMessage.value === (runtimeLastError.value || errorMessage.value))
        errorMessage.value = ''
    }
    catch (caughtError) {
      errorMessage.value = errorMessageFrom(caughtError) ?? runtimeLastError.value ?? 'Vision runtime retry failed'
      throw caughtError
    }
  }

  async function resetVisionRuntime() {
    await visionRuntime.resetVisionRuntime()
    errorMessage.value = ''
    resetStartTiming()
    lastProcessedFrameTimestampMs = -1
  }

  function attachVideoElement(element: HTMLVideoElement | null) {
    videoElement.value = element
    if (!element || !stream.value || element.srcObject === stream.value)
      return

    try {
      bindVideoStream(stream.value, element)
    }
    catch (error) {
      errorMessage.value = errorMessageFrom(error) ?? 'Vision video element is not attached'
      return
    }

    if (cameraState.value === 'active' || cameraState.value === 'loading') {
      void element.play().catch(() => {})
    }
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
    const enrollmentStartToken = streamLifecycleToken
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
    const isEnrollmentActive = () => {
      return isEnabled.value
        && cameraState.value === 'active'
        && streamLifecycleToken === enrollmentStartToken
    }
    for (let i = 0; i < targetCount * 3 && samples.length < targetCount; i += 1) {
      if (!isEnrollmentActive())
        return { ok: false as const, reason: 'enrollment cancelled' }

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

    if (!isEnrollmentActive())
      return { ok: false as const, reason: 'enrollment cancelled' }

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
  void refreshCameraPermissionState()
  void tryAutoUnlockFaceProfile()
  onBeforeUnmount(() => {
    if (cameraPermissionStatus)
      cameraPermissionStatus.onchange = null
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
    cameraPermissionState,
    mediaPipeStatus,
    facePresence,
    faceCenter,
    faceDirection,
    subjectPosition,
    lastStableSubjectPosition,
    subjectPositionChangedAt,
    subjectResponseState,
    lastSubjectResponseEvent,
    subjectResponseCooldownUntil,
    enableExpressionSignals,
    expressionSignal,
    expressionSignalCandidate,
    stableExpressionSignal,
    expressionSignalStableFrames,
    expressionSignalConfidence,
    expressionSignalReason,
    expressionSignalSource,
    expressionSignalChangedAt,
    expressionSignalCooldownUntil,
    expressionSignalFeedbackAllowed,
    expressionSignalUnavailable,
    lastGesture,
    gestureControlsEnabled,
    candidateGesture,
    stableGesture,
    gestureState,
    gestureConfidence,
    gestureVoteCount,
    gestureVoteWindowSize,
    geometryPassRate,
    gestureQualityState,
    handSizeRatio,
    handInsideGuideArea,
    holdProgressMs,
    holdDurationMs,
    cooldownRemainingMs,
    releaseRequired,
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
    runtimeStatus,
    runtimeWarmupDurationMs,
    runtimeRetryCount,
    runtimeLastError,
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
    subjectNeutralCenter,
    subjectNeutralCenterUpdatedAt,
    directionScores,
    directionDistribution,
    localFaceGate,
    encryptedProfile,
    openCvFaceQuality,
    canTriggerInteractiveFeedback,
    canTriggerSubjectPositionResponse,
    attachVideoElement,
    start,
    stop,
    setDisplayName,
    setFaceGateEnabled,
    setGestureControlsEnabled,
    setExpressionSignalsEnabled,
    calibrateSubjectNeutralCenter,
    resetSubjectNeutralCenter,
    setMaxInferenceStallMs,
    enrollLocalFaceProfile,
    unlockFaceProfile,
    lockFaceProfile,
    deleteLocalFaceProfile,
    setRememberFaceProfileOnDevice,
    acknowledgePrompt,
    prewarmVisionModels,
    warmupVisionRuntime,
    retryVisionRuntime,
    resetVisionRuntime,
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
