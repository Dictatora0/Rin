<script setup lang="ts">
import type { VisionInteractionEvent } from '../../../composables/use-vision-interaction'

import { Button } from '@proj-airi/ui'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'
import { useVisionPetFeedback } from '../../../composables/use-vision-pet-feedback'

const props = withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false,
})

const collapsed = ref(!props.embedded)
const advancedDiagnosticsExpanded = ref(false)
const gestureDiagnosticsExpanded = ref(false)
const expressionSignalDiagnosticsExpanded = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const unlockPassphrase = ref('')
const unlocking = ref(false)
const rememberOnDevice = ref(false)
const isDev = import.meta.env.DEV

const router = useRouter()

const {
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
  subjectResponseState: interactionSubjectResponseState,
  lastSubjectResponseEvent: interactionLastSubjectResponseEvent,
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
  quietRemainingMs,
  isVisionQuiet,
  localCelebrationCount,
  activePrompt,
  matchedDisplayName,
  gateEnabled,
  hasEncryptedProfile,
  isProfileUnlocked,
  profileStatus,
  rememberFaceProfileOnDevice,
  secureStoreAvailable,
  localFaceGate,
  openCvFaceQuality,
  canTriggerInteractiveFeedback,
  canTriggerSubjectPositionResponse,
  maxInferenceStallMs,
  lastInferenceAt,
  modelWarmupStatus,
  modelSource,
  modelProfile,
  runtimeStatus,
  runtimeWarmupDurationMs,
  runtimeRetryCount,
  runtimeLastError,
  startTiming,
  attachVideoElement,
  start,
  stop,
  warmupVisionRuntime,
  retryVisionRuntime,
  resetVisionRuntime,
  setFaceGateEnabled,
  setGestureControlsEnabled,
  setExpressionSignalsEnabled,
  setMaxInferenceStallMs,
  setRememberFaceProfileOnDevice,
  unlockFaceProfile,
} = useVisionInteraction({
  stableFrames: 3,
  gestureStableFrames: 2,
  gestureInferenceIntervalMs: 90,
  gestureScoreThreshold: 0.35,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})
const {
  triggerVisionPetFeedback,
  triggerExpressionSignalFeedback,
  triggerContextualVisionFeedback,
  feedbackIntensity,
  setFeedbackIntensity,
  feedbackLocale,
  setFeedbackLocale,
  feedbackVariant,
  setFeedbackVariant,
  lastFeedbackType,
  lastFeedbackMessage,
  lastFeedbackLevel,
  lastFeedbackPriority,
  lastFeedbackChannels,
  lastFeedbackTemplateId,
  lastResolvedFeedbackEventType,
  lastIsTransitionFeedback,
  nextAllowedFeedbackIn,
  feedbackSuppressedByQuiet,
  feedbackBlockedByGate,
  activeBubbleMessage,
  activeBubbleLevel,
  activeBubbleEventType,
  activeBubbleTemplateId,
  bubbleVisibleUntil,
  bubbleRemainingMs,
  petFeedbackState,
  lastPetFeedback,
  subjectResponseState: petSubjectResponseState,
  lastSubjectResponseEvent: petLastSubjectResponseEvent,
  subjectResponseCooldownUntil: petSubjectResponseCooldownUntil,
  isQuietVisualMode,
  quietRemainingMs: petQuietRemainingMs,
  celebrationCount: petCelebrationCount,
  cancelQuietVisualMode,
  clearBubble,
  clearPetFeedback,
} = useVisionPetFeedback()

const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
const prewarming = ref(false)
const BACKGROUND_WARMUP_DELAY_MS = 1_200
const BACKGROUND_WARMUP_IDLE_TIMEOUT_MS = 2_000
const SUBJECT_DWELL_THRESHOLD_MS = 7_000
let scheduledWarmupTimerId: number | null = null
let scheduledIdleCallbackId: number | null = null
let subjectDwellTimerId: number | null = null
const quietRemainingSeconds = computed(() => Math.ceil(quietRemainingMs.value / 1000))
const petQuietRemainingSeconds = computed(() => Math.ceil(petQuietRemainingMs.value / 1000))
const feedbackIntensityOptions = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'expressive', label: 'Expressive' },
] as const
const feedbackLocaleOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
] as const
const feedbackVariantOptions = [
  { value: 'default', label: 'Default' },
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
] as const
const expressionSignalConfidenceText = computed(() => expressionSignalConfidence.value.toFixed(2))
const currentExpressionSignalText = computed(() => {
  if (stableExpressionSignal.value !== 'none')
    return stableExpressionSignal.value
  return expressionSignal.value
})
const expressionSignalCooldownRemainingMs = computed(() => {
  return Math.max(0, expressionSignalCooldownUntil.value - Date.now())
})
const expressionSignalCooldownRemainingSeconds = computed(() => {
  return Math.ceil(expressionSignalCooldownRemainingMs.value / 1000)
})
const expressionSignalChangedText = computed(() => {
  if (!expressionSignalChangedAt.value)
    return 'none'
  return new Date(expressionSignalChangedAt.value).toLocaleTimeString()
})

const faceCenterText = computed(() => {
  if (!faceCenter.value)
    return '未知'
  return `x=${faceCenter.value.x.toFixed(2)}, y=${faceCenter.value.y.toFixed(2)}`
})

const lastInferenceText = computed(() => {
  if (!lastInferenceAt.value)
    return '无'
  return new Date(lastInferenceAt.value).toLocaleTimeString()
})

const cameraStateText = computed(() => {
  const map: Record<string, string> = {
    off: '关闭',
    loading: '加载中',
    active: '运行中',
    error: '错误',
  }
  return map[cameraState.value] ?? cameraState.value
})
const cameraPermissionStateText = computed(() => {
  const map: Record<string, string> = {
    unknown: 'unknown',
    prompt: 'prompt',
    granted: 'granted',
    denied: 'denied',
    unsupported: 'unsupported',
  }
  return map[cameraPermissionState.value] ?? cameraPermissionState.value
})
const mediaPipeStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    loading: 'loading',
    ready: 'ready',
    failed: 'failed',
  }
  return map[mediaPipeStatus.value] ?? mediaPipeStatus.value
})
const openCvStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    loading: 'loading',
    ready: 'ready',
    failed: 'failed',
    fallback: 'fallback',
  }
  return map[openCvFaceQuality.status.value] ?? openCvFaceQuality.status.value
})

const facePresenceText = computed(() => {
  const map: Record<string, string> = {
    present: '在位',
    absent: '离开',
    unknown: '未知',
  }
  return map[facePresence.value] ?? facePresence.value
})

const faceDirectionText = computed(() => {
  const map: Record<string, string> = {
    left: '左',
    right: '右',
    up: '上',
    down: '下',
    center: '中',
    unknown: '未知',
  }
  return map[faceDirection.value] ?? faceDirection.value
})

const gestureText = computed(() => {
  const map: Record<string, string> = {
    none: '无',
    open_palm: '张开手掌',
    victory: '胜利手势',
    thumbs_up: '竖拇指',
    unknown: '未知',
  }
  return map[lastGesture.value] ?? lastGesture.value
})
const gestureConfidenceText = computed(() => gestureConfidence.value.toFixed(2))
const gestureVoteText = computed(() => `${gestureVoteCount.value}/${gestureVoteWindowSize.value}`)
const geometryPassRateText = computed(() => geometryPassRate.value.toFixed(2))
const handSizeRatioText = computed(() => handSizeRatio.value.toFixed(3))
const holdProgressText = computed(() => `${Math.round(holdProgressMs.value)}ms / ${Math.round(holdDurationMs.value)}ms`)
const cooldownRemainingText = computed(() => `${Math.max(0, Math.round(cooldownRemainingMs.value))}ms`)
const showAdvancedGestureDiagnostics = computed(() => {
  return gestureControlsEnabled.value && gestureDiagnosticsExpanded.value
})
const gestureCalibrationHint = computed(() => {
  if (!gestureControlsEnabled.value)
    return 'Enable experimental gesture controls to view diagnostics.'
  if (releaseRequired.value)
    return 'Release your hand to trigger again.'
  if (gestureQualityState.value === 'too_far')
    return 'Move your hand closer.'
  if (gestureQualityState.value === 'out_of_frame')
    return 'Keep your hand inside the guide area.'
  if (gestureQualityState.value === 'too_fast')
    return 'Hold the gesture steady.'
  if (gestureQualityState.value === 'low_confidence')
    return 'Better lighting may help.'
  if (gestureState.value === 'candidate' || gestureState.value === 'stable')
    return 'Hold the gesture steady.'
  return 'Gesture input looks good.'
})

const profileStatusText = computed(() => {
  const map: Record<string, string> = {
    none: '未录入',
    encrypted: '已加密（锁定）',
    unlocked: '已解锁',
  }
  return map[profileStatus.value] ?? profileStatus.value
})

const gateStateText = computed(() => {
  const map: Record<string, string> = {
    disabled: '未启用',
    enabled: '已启用',
    gated: '门控中',
    locked: '锁定',
  }
  return map[localFaceGate.gateState.value] ?? localFaceGate.gateState.value
})
const gateProfileStatusText = computed(() => {
  const map: Record<string, string> = {
    not_enrolled: 'not_enrolled',
    enrolling: 'enrolling',
    enrolled: 'enrolled',
    matching: 'matching',
    matched: 'matched',
    unmatched: 'unmatched',
    uncertain: 'uncertain',
    multiple_faces: 'multiple_faces',
    no_face: 'no_face',
  }
  return map[localFaceGate.profileStatus.value] ?? localFaceGate.profileStatus.value
})

const modelWarmupStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: '未预热',
    warming: '预热中',
    ready: '已就绪',
    fallback_remote: '回退远程',
  }
  return map[modelWarmupStatus.value] ?? modelWarmupStatus.value
})

const modelSourceText = computed(() => {
  const map: Record<string, string> = {
    local: '本地',
    remote: '远程',
    unknown: '未知',
  }
  return map[modelSource.value] ?? modelSource.value
})
const runtimeStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    warming: 'warming',
    ready: 'ready',
    partial_ready: 'partial_ready',
    failed: 'failed',
    resetting: 'resetting',
  }
  return map[runtimeStatus.value] ?? runtimeStatus.value
})
const runtimeWarmupDurationText = computed(() => formatTiming(runtimeWarmupDurationMs.value))

const permissionTimingText = computed(() => formatTiming(startTiming.value.permissionMs))
const videoPlayTimingText = computed(() => formatTiming(startTiming.value.videoPlayMs))
const recognizerInitTimingText = computed(() => formatTiming(startTiming.value.recognizerInitMs))
const totalTimingText = computed(() => formatTiming(startTiming.value.totalMs))
const readyForPreviewTimingText = computed(() => formatTiming(startTiming.value.readyForPreviewMs))
const petFeedbackStateText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    quiet: 'quiet',
    celebrating: 'celebrating',
    acknowledged: 'acknowledged',
    gated: 'gated',
  }
  return map[petFeedbackState.value] ?? petFeedbackState.value
})
const lastPetFeedbackSummary = computed(() => {
  if (!lastPetFeedback.value)
    return '无'
  return `${lastPetFeedback.value.summary} (${new Date(lastPetFeedback.value.at).toLocaleTimeString()})`
})
const shouldShowPetFeedbackGatedHint = computed(() => {
  if (petFeedbackState.value === 'gated')
    return true
  return lastEvent.value?.type === 'detected_but_gated'
    || lastEvent.value?.type === 'subject_position_gated'
})
const subjectPositionText = computed(() => {
  const map: Record<string, string> = {
    left: 'left',
    right: 'right',
    up: 'up',
    down: 'down',
    center: 'center',
    unknown: 'unknown',
  }
  return map[subjectPosition.value] ?? subjectPosition.value
})
const stableSubjectPositionText = computed(() => {
  const map: Record<string, string> = {
    left: 'left',
    right: 'right',
    up: 'up',
    down: 'down',
    center: 'center',
    unknown: 'unknown',
  }
  return map[lastStableSubjectPosition.value] ?? lastStableSubjectPosition.value
})
const interactionSubjectResponseStateText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    following_left: 'following_left',
    following_right: 'following_right',
    looking_up: 'looking_up',
    looking_down: 'looking_down',
    centered: 'centered',
    gated: 'gated',
  }
  return map[interactionSubjectResponseState.value] ?? interactionSubjectResponseState.value
})
const petSubjectResponseStateText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    following_left: 'following_left',
    following_right: 'following_right',
    looking_up: 'looking_up',
    looking_down: 'looking_down',
    centered: 'centered',
    gated: 'gated',
  }
  return map[petSubjectResponseState.value] ?? petSubjectResponseState.value
})
const subjectResponseGateText = computed(() => {
  return canTriggerSubjectPositionResponse.value ? 'allowed' : 'gated'
})
const subjectResponseCooldownSeconds = computed(() => {
  const now = Date.now()
  const interactionRemainingMs = Math.max(0, subjectResponseCooldownUntil.value - now)
  const petRemainingMs = Math.max(0, petSubjectResponseCooldownUntil.value - now)
  const remainingMs = Math.max(interactionRemainingMs, petRemainingMs)
  return Math.ceil(remainingMs / 1000)
})
const subjectPositionChangedText = computed(() => {
  if (!subjectPositionChangedAt.value)
    return 'none'
  return new Date(subjectPositionChangedAt.value).toLocaleTimeString()
})
const lastSubjectResponseSummary = computed(() => {
  if (interactionLastSubjectResponseEvent.value) {
    const when = new Date(interactionLastSubjectResponseEvent.value.at).toLocaleTimeString()
    return `${interactionLastSubjectResponseEvent.value.message} (${when})`
  }
  if (petLastSubjectResponseEvent.value) {
    const when = new Date(petLastSubjectResponseEvent.value.at).toLocaleTimeString()
    return `${petLastSubjectResponseEvent.value.summary} (${when})`
  }
  return 'none'
})
const lastContextualFeedbackTypeText = computed(() => {
  return lastFeedbackType.value ?? 'none'
})
const lastContextualFeedbackMessageText = computed(() => {
  if (!lastFeedbackMessage.value)
    return 'none'
  return lastFeedbackMessage.value
})
const contextualFeedbackLevelText = computed(() => {
  return lastFeedbackLevel.value
})
const contextualFeedbackPriorityText = computed(() => {
  return lastFeedbackPriority.value
})
const contextualFeedbackChannelsText = computed(() => {
  if (lastFeedbackChannels.value.length === 0)
    return 'none'
  return lastFeedbackChannels.value.join(', ')
})
const contextualFeedbackTemplateIdText = computed(() => {
  return lastFeedbackTemplateId.value ?? 'none'
})
const resolvedFeedbackEventTypeText = computed(() => {
  return lastResolvedFeedbackEventType.value ?? 'none'
})
const transitionFeedbackBadgeText = computed(() => {
  return lastIsTransitionFeedback.value ? 'transition' : 'base'
})
const activeBubbleMessageText = computed(() => {
  if (!activeBubbleMessage.value)
    return 'none'
  return activeBubbleMessage.value
})
const activeBubbleLevelText = computed(() => {
  return activeBubbleLevel.value ?? 'none'
})
const activeBubbleEventTypeText = computed(() => {
  return activeBubbleEventType.value ?? 'none'
})
const activeBubbleTemplateIdText = computed(() => {
  return activeBubbleTemplateId.value ?? 'none'
})
const bubbleRemainingSeconds = computed(() => {
  return Math.ceil(bubbleRemainingMs.value / 1000)
})
const bubbleVisible = computed(() => {
  return activeBubbleMessage.value.trim().length > 0 && bubbleRemainingMs.value > 0
})
const nextAllowedFeedbackSeconds = computed(() => {
  return Math.ceil(nextAllowedFeedbackIn.value / 1000)
})
const dwellStatusText = computed(() => {
  if (!lastFeedbackType.value)
    return 'none'
  if (lastFeedbackType.value === 'subject_dwelled_left')
    return 'dwelled_left'
  if (lastFeedbackType.value === 'subject_dwelled_right')
    return 'dwelled_right'
  if (lastFeedbackType.value === 'subject_dwelled_center')
    return 'dwelled_center'
  return 'inactive'
})
const visionDiagnosticsLastError = computed(() => {
  if (errorMessage.value)
    return errorMessage.value
  if (runtimeLastError.value)
    return runtimeLastError.value
  if (openCvFaceQuality.errorMessage.value)
    return openCvFaceQuality.errorMessage.value
  return 'none'
})
const rootClasses = computed(() => {
  if (props.embedded) {
    return [
      'relative w-full',
      'max-h-[68vh] overflow-y-auto',
    ]
  }

  return ['fixed left-3 top-14 z-20']
})

watch(videoRef, element => attachVideoElement(element), { immediate: true })

watch(maxInferenceStallMs, (value) => {
  const text = String(value)
  if (text !== maxInferenceStallInput.value)
    maxInferenceStallInput.value = text
})

watch(maxInferenceStallInput, (value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed))
    return
  setMaxInferenceStallMs(parsed)
})

watch(lastEvent, (event) => {
  if (!event)
    return
  if (event.toastMessage && !isContextualInteractionEvent(event.type))
    toast.message(event.toastMessage)
  applyPetFeedbackForEvent(event)
})

watch(isEnabled, (enabled) => {
  if (!enabled) {
    clearSubjectDwellTimer()
    clearPetFeedback()
  }
})

watch(
  [lastStableSubjectPosition, subjectPosition, facePresence, canTriggerSubjectPositionResponse],
  () => {
    scheduleSubjectDwellFeedback()
  },
)

watch(() => localFaceGate.profileStatus.value, (status) => {
  if (status !== 'uncertain')
    return
  triggerContextualVisionFeedback('subject_uncertain', {
    allowVisualFeedback: canTriggerSubjectPositionResponse.value,
    gateEnabled: gateEnabled.value,
    gateState: localFaceGate.gateState.value,
    gateProfileStatus: localFaceGate.profileStatus.value,
    presence: facePresence.value,
    direction: subjectPosition.value,
    displayName: matchedDisplayName.value || undefined,
  })
  if (petLastSubjectResponseEvent.value?.toastMessage)
    toast.message(petLastSubjectResponseEvent.value.toastMessage)
})

onMounted(() => {
  scheduleRuntimeWarmup({
    delayMs: BACKGROUND_WARMUP_DELAY_MS,
    trackLoadingState: false,
    reportToast: false,
  })
})

onBeforeUnmount(() => {
  clearScheduledWarmup()
  clearSubjectDwellTimer()
})

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

function toggleGate() {
  setFaceGateEnabled(!gateEnabled.value)
}

function toggleGestureControls(event: Event) {
  const enabled = (event.target as HTMLInputElement).checked
  setGestureControlsEnabled(enabled)
}

function toggleExpressionSignals(event: Event) {
  const enabled = (event.target as HTMLInputElement).checked
  setExpressionSignalsEnabled(enabled)
}

function openEnrollmentPage() {
  void router.push('/vision-enrollment')
}

async function unlockProfile() {
  if (!unlockPassphrase.value.trim())
    return
  unlocking.value = true
  try {
    const result = await unlockFaceProfile(unlockPassphrase.value, {
      rememberOnDevice: rememberOnDevice.value,
    })
    if (result.ok)
      unlockPassphrase.value = ''
  }
  finally {
    unlocking.value = false
  }
}

watch(rememberFaceProfileOnDevice, (value) => {
  rememberOnDevice.value = value
}, { immediate: true })

async function toggleRememberOnDevice(event: Event) {
  const nextValue = (event.target as HTMLInputElement).checked
  const accepted = await setRememberFaceProfileOnDevice(nextValue)
  rememberOnDevice.value = accepted && nextValue
}

async function handlePrewarmVision() {
  if (prewarming.value)
    return
  toast.message('Vision runtime warmup queued for idle background.')
  scheduleRuntimeWarmup({
    delayMs: 0,
    trackLoadingState: true,
    reportToast: true,
  })
}

async function handleRetryRuntime() {
  if (prewarming.value)
    return
  prewarming.value = true
  try {
    await retryVisionRuntime()
    toast.success('Vision runtime retry completed.')
  }
  catch {
    toast.error('Vision runtime retry failed.')
  }
  finally {
    prewarming.value = false
  }
}

async function handleResetRuntime() {
  if (prewarming.value)
    return
  prewarming.value = true
  try {
    await resetVisionRuntime()
    toast.message('Vision runtime reset complete.')
  }
  finally {
    prewarming.value = false
  }
}

function formatTiming(ms: number | null) {
  if (ms === null || !Number.isFinite(ms))
    return '无'
  return `${ms.toFixed(1)} ms`
}

function clearScheduledWarmup() {
  if (scheduledWarmupTimerId !== null) {
    clearTimeout(scheduledWarmupTimerId)
    scheduledWarmupTimerId = null
  }

  if (scheduledIdleCallbackId !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(scheduledIdleCallbackId)
    scheduledIdleCallbackId = null
  }
}

function clearSubjectDwellTimer() {
  if (subjectDwellTimerId === null)
    return
  clearTimeout(subjectDwellTimerId)
  subjectDwellTimerId = null
}

function isContextualInteractionEvent(eventType: VisionInteractionEvent['type']) {
  return eventType === 'user_moved_left'
    || eventType === 'user_moved_right'
    || eventType === 'user_moved_up'
    || eventType === 'user_moved_down'
    || eventType === 'user_centered'
    || eventType === 'expression_smile_like_detected'
    || eventType === 'expression_stable_face_detected'
    || eventType === 'expression_looking_away_detected'
    || eventType === 'expression_unclear_detected'
    || eventType === 'subject_position_gated'
    || eventType === 'subject_matched'
    || eventType === 'welcome_back'
    || eventType === 'user_away'
    || eventType === 'detected_but_gated'
}

function emitLastContextualToastForEvent(sourceEventId: number) {
  const event = petLastSubjectResponseEvent.value
  if (!event)
    return
  if (event.sourceEventId !== sourceEventId)
    return
  if (!event.toastMessage)
    return
  toast.message(event.toastMessage)
}

function onFeedbackIntensityChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value !== 'minimal' && value !== 'balanced' && value !== 'expressive')
    return
  setFeedbackIntensity(value)
}

function onFeedbackLocaleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value !== 'en' && value !== 'zh-CN')
    return
  setFeedbackLocale(value)
}

function onFeedbackVariantChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value !== 'default' && value !== 'a' && value !== 'b')
    return
  setFeedbackVariant(value)
}

function scheduleSubjectDwellFeedback() {
  clearSubjectDwellTimer()
  const stablePosition = lastStableSubjectPosition.value
  const shouldTrackDwell = stablePosition === 'left'
    || stablePosition === 'right'
    || stablePosition === 'center'

  if (!shouldTrackDwell)
    return
  if (facePresence.value !== 'present')
    return
  if (subjectPosition.value !== stablePosition)
    return

  const eventType = stablePosition === 'left'
    ? 'subject_dwelled_left'
    : stablePosition === 'right'
      ? 'subject_dwelled_right'
      : 'subject_dwelled_center'

  subjectDwellTimerId = window.setTimeout(() => {
    subjectDwellTimerId = null
    if (facePresence.value !== 'present')
      return
    if (lastStableSubjectPosition.value !== stablePosition)
      return

    triggerContextualVisionFeedback(eventType, {
      allowVisualFeedback: canTriggerSubjectPositionResponse.value,
      gateEnabled: gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      gateProfileStatus: localFaceGate.profileStatus.value,
      presence: facePresence.value,
      direction: stablePosition,
      displayName: matchedDisplayName.value || undefined,
    })
    if (petLastSubjectResponseEvent.value?.toastMessage)
      toast.message(petLastSubjectResponseEvent.value.toastMessage)
  }, SUBJECT_DWELL_THRESHOLD_MS)
}

function scheduleRuntimeWarmup(options: {
  delayMs: number
  trackLoadingState: boolean
  reportToast: boolean
}) {
  clearScheduledWarmup()

  const runWarmup = async () => {
    if (options.trackLoadingState)
      prewarming.value = true

    try {
      await warmupVisionRuntime({
        background: true,
        includeOpenCv: false,
      })
      if (options.reportToast)
        toast.success('Vision runtime warmed up.')
    }
    catch {
      if (options.reportToast)
        toast.error('Vision runtime warmup failed.')
    }
    finally {
      if (options.trackLoadingState)
        prewarming.value = false
    }
  }

  const dispatchWarmup = () => {
    const hasIdleCallback = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    if (hasIdleCallback) {
      scheduledIdleCallbackId = window.requestIdleCallback(() => {
        scheduledIdleCallbackId = null
        void runWarmup()
      }, { timeout: BACKGROUND_WARMUP_IDLE_TIMEOUT_MS })
      return
    }

    void runWarmup()
  }

  if (options.delayMs <= 0) {
    dispatchWarmup()
    return
  }

  scheduledWarmupTimerId = window.setTimeout(() => {
    scheduledWarmupTimerId = null
    dispatchWarmup()
  }, options.delayMs)
}

function createPetFeedbackOptions(event: VisionInteractionEvent) {
  return {
    allowVisualFeedback: canTriggerInteractiveFeedback.value,
    gateEnabled: gateEnabled.value,
    gateState: localFaceGate.gateState.value,
    gateProfileStatus: localFaceGate.profileStatus.value,
    presence: facePresence.value,
    sourceEventId: event.id,
    displayName: matchedDisplayName.value || undefined,
  }
}

function directionFromEventType(eventType: VisionInteractionEvent['type']) {
  if (eventType === 'user_moved_left')
    return 'left'
  if (eventType === 'user_moved_right')
    return 'right'
  if (eventType === 'user_moved_up')
    return 'up'
  if (eventType === 'user_moved_down')
    return 'down'
  return 'center'
}

function applyPetFeedbackForEvent(event: VisionInteractionEvent) {
  if (event.type === 'quiet_mode_requested') {
    triggerVisionPetFeedback('open_palm', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'completion_celebration') {
    triggerVisionPetFeedback('victory', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'acknowledged') {
    triggerVisionPetFeedback('thumbs_up', createPetFeedbackOptions(event))
    return
  }

  if (
    event.type === 'expression_smile_like_detected'
    || event.type === 'expression_stable_face_detected'
    || event.type === 'expression_looking_away_detected'
    || event.type === 'expression_unclear_detected'
  ) {
    const mappedSignal = event.type === 'expression_smile_like_detected'
      ? 'smile_like_signal'
      : event.type === 'expression_stable_face_detected'
        ? 'stable_face_signal'
        : event.type === 'expression_looking_away_detected'
          ? 'looking_away_signal'
          : 'unclear_face_signal'

    triggerExpressionSignalFeedback({
      signal: mappedSignal,
      confidence: expressionSignalConfidence.value,
      reason: expressionSignalReason.value,
      source: expressionSignalSource.value,
      gateAllowed: expressionSignalFeedbackAllowed.value,
      gateEnabled: gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      gateProfileStatus: localFaceGate.profileStatus.value,
      quietMode: isVisionQuiet.value,
      locale: feedbackLocale.value,
      variant: feedbackVariant.value,
      displayName: matchedDisplayName.value || undefined,
      sourceEventId: event.id,
      presence: facePresence.value,
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'subject_matched') {
    triggerContextualVisionFeedback('subject_matched', {
      allowVisualFeedback: canTriggerSubjectPositionResponse.value,
      gateEnabled: gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      gateProfileStatus: localFaceGate.profileStatus.value,
      presence: facePresence.value,
      sourceEventId: event.id,
      direction: subjectPosition.value,
      displayName: matchedDisplayName.value || undefined,
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'welcome_back') {
    triggerContextualVisionFeedback('subject_returned', {
      allowVisualFeedback: canTriggerSubjectPositionResponse.value,
      gateEnabled: gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      gateProfileStatus: localFaceGate.profileStatus.value,
      presence: facePresence.value,
      sourceEventId: event.id,
      direction: subjectPosition.value,
      displayName: matchedDisplayName.value || undefined,
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_away') {
    triggerContextualVisionFeedback('subject_absent', {
      allowVisualFeedback: canTriggerSubjectPositionResponse.value,
      gateEnabled: gateEnabled.value,
      gateState: localFaceGate.gateState.value,
      gateProfileStatus: localFaceGate.profileStatus.value,
      presence: facePresence.value,
      sourceEventId: event.id,
      direction: subjectPosition.value,
      displayName: matchedDisplayName.value || undefined,
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_moved_left') {
    triggerContextualVisionFeedback('subject_moved_left', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? directionFromEventType(event.type),
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_moved_right') {
    triggerContextualVisionFeedback('subject_moved_right', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? directionFromEventType(event.type),
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_moved_up') {
    triggerContextualVisionFeedback('subject_moved_up', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? directionFromEventType(event.type),
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_moved_down') {
    triggerContextualVisionFeedback('subject_moved_down', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? directionFromEventType(event.type),
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'user_centered') {
    triggerContextualVisionFeedback('subject_centered', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? directionFromEventType(event.type),
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'subject_position_gated') {
    triggerContextualVisionFeedback('subject_gated', {
      ...createPetFeedbackOptions(event),
      direction: event.subjectPosition ?? 'unknown',
      allowVisualFeedback: false,
    })
    emitLastContextualToastForEvent(event.id)
    return
  }

  if (event.type === 'detected_but_gated') {
    triggerVisionPetFeedback('gated', {
      ...createPetFeedbackOptions(event),
      allowVisualFeedback: false,
      summary: 'Gesture detected but pet feedback gated.',
    })
  }
}
</script>

<template>
  <div :class="rootClasses">
    <div
      :class="[
        props.embedded ? 'w-full' : 'w-80',
        'rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
        'dark:border-neutral-700/70 dark:bg-neutral-900/80',
      ]"
    >
      <div :class="['mb-2 flex items-center justify-between gap-2']">
        <div :class="['text-sm font-700 text-neutral-800 dark:text-neutral-100']">
          视觉交互
        </div>
        <Button v-if="!props.embedded" size="sm" variant="ghost" @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '收起' }}
        </Button>
      </div>

      <div v-if="props.embedded || !collapsed" :class="['flex flex-col gap-2']">
        <div :class="['flex flex-wrap items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
          </Button>
          <Button size="sm" variant="ghost" @click="openEnrollmentPage">
            打开人脸录入页
          </Button>
          <Button
            data-testid="advanced-diagnostics-toggle"
            size="sm"
            variant="ghost"
            @click="advancedDiagnosticsExpanded = !advancedDiagnosticsExpanded"
          >
            {{ advancedDiagnosticsExpanded ? '收起 Advanced / Diagnostics' : '展开 Advanced / Diagnostics' }}
          </Button>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            Core status
          </div>
          <div>cameraState: {{ cameraStateText }}</div>
          <div>facePresence: {{ facePresenceText }}</div>
          <div>faceDirection: {{ faceDirectionText }}</div>
          <div>faceGate: {{ gateStateText }}</div>
          <div>matchStatus: {{ gateProfileStatusText }}</div>
          <div v-if="matchedDisplayName">
            matchedUser: {{ matchedDisplayName }}
          </div>
          <div>interactiveFeedback: {{ canTriggerInteractiveFeedback ? 'allowed' : 'gated' }}</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            Subject-position response
          </div>
          <label :class="['mb-2 flex items-center gap-2']">
            <span>Feedback intensity:</span>
            <select
              data-testid="feedback-intensity-select"
              :value="feedbackIntensity"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
              @change="onFeedbackIntensityChange"
            >
              <option
                v-for="option in feedbackIntensityOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <div
            v-if="bubbleVisible"
            data-testid="vision-feedback-bubble"
            :class="[
              'mb-2 rounded-lg border px-2 py-1 text-xs',
              activeBubbleLevel === 'strong'
                ? 'border-sky-500 bg-sky-100/80 text-sky-700 dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-200'
                : activeBubbleLevel === 'normal'
                  ? 'border-emerald-500 bg-emerald-100/80 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-200'
                  : 'border-neutral-400 bg-neutral-100 text-neutral-700 dark:border-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-200',
            ]"
          >
            <div>Rin: {{ activeBubbleMessage }}</div>
            <div :class="['mt-1 text-[11px] opacity-80']">
              {{ activeBubbleLevelText }} · {{ bubbleRemainingSeconds }}s
            </div>
          </div>
          <div>latestBubble: {{ activeBubbleMessageText }}</div>
          <div>faceCenter: {{ faceCenterText }}</div>
          <div>subjectPosition: {{ subjectPositionText }}</div>
          <div>stableSubjectPosition: {{ stableSubjectPositionText }}</div>
          <div>subjectResponseState: {{ interactionSubjectResponseStateText }}</div>
          <div>petSubjectResponseState: {{ petSubjectResponseStateText }}</div>
          <div>subjectResponseGate: {{ subjectResponseGateText }}</div>
          <div>lastFeedbackMessage: {{ lastContextualFeedbackMessageText }}</div>
          <div>lastSubjectResponseEvent: {{ lastSubjectResponseSummary }}</div>
          <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
            Rin reacts only to the matched subject.
          </div>
          <div :class="['text-neutral-500 dark:text-neutral-400']">
            This is gaze-like feedback, not strict gaze measurement.
          </div>
          <div v-if="bubbleVisible" :class="['mt-1']">
            <Button size="sm" variant="ghost" @click="clearBubble">
              Clear bubble
            </Button>
          </div>
        </div>

        <div data-testid="expression-signal-panel" :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            Face Motion Signals
          </div>
          <label :class="['mb-2 flex items-center gap-2']">
            <input
              data-testid="expression-signal-toggle"
              type="checkbox"
              :checked="enableExpressionSignals"
              @change="toggleExpressionSignals"
            >
            <span>Enable Expression Signals</span>
          </label>
          <div>faceMotionSignals: {{ enableExpressionSignals ? 'on' : 'off' }}</div>
          <div>currentSignal: {{ currentExpressionSignalText }}</div>
          <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
            Expression signals are local visual cues, not emotion detection.
          </div>
          <div :class="['text-neutral-500 dark:text-neutral-400']">
            Rin uses them only for local feedback.
          </div>
          <div :class="['text-neutral-500 dark:text-neutral-400']">
            No expression data is uploaded.
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            本地人脸门控
          </div>
          <div>门控开关：{{ gateEnabled ? '开启' : '关闭' }}</div>
          <div>门控状态：{{ gateStateText }}</div>
          <div>匹配状态：{{ profileStatusText }}</div>
          <div>匹配细分：{{ gateProfileStatusText }}</div>
          <div>距离：{{ localFaceGate.matchScore ?? '未知' }}</div>
          <div>交互结果：{{ canTriggerInteractiveFeedback ? '放行' : '拦截' }}</div>
          <div :class="['mt-2 flex items-center gap-2']">
            <Button size="sm" :variant="gateEnabled ? 'secondary' : 'primary'" @click="toggleGate">
              {{ gateEnabled ? '关闭人脸门控' : '开启人脸门控' }}
            </Button>
          </div>
          <div v-if="matchedDisplayName" :class="['mt-1']">
            当前匹配用户：{{ matchedDisplayName }}
          </div>
          <div v-if="gateEnabled && hasEncryptedProfile && !isProfileUnlocked" :class="['mt-1 text-amber-600 dark:text-amber-300']">
            人脸档案已锁定，解锁后才能启用门控交互。
          </div>
          <div v-if="hasEncryptedProfile && !isProfileUnlocked" :class="['mt-2 flex flex-col gap-1']">
            <input
              v-model="unlockPassphrase"
              type="password"
              placeholder="输入口令以解锁"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
            >
            <Button size="sm" variant="primary" :disabled="unlocking" @click="unlockProfile">
              {{ unlocking ? '解锁中...' : '解锁档案' }}
            </Button>
            <label :class="['mt-1 flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300']">
              <input
                :checked="rememberOnDevice"
                type="checkbox"
                :disabled="!secureStoreAvailable"
                @change="toggleRememberOnDevice"
              >
              <span>在本机记住并自动解锁</span>
            </label>
            <div
              v-if="!secureStoreAvailable && isDev"
              :class="['text-xs text-amber-600 dark:text-amber-300']"
            >
              当前环境未启用安全存储，无法开启无感自动解锁。
            </div>
          </div>
        </div>

        <div
          v-if="advancedDiagnosticsExpanded"
          data-testid="advanced-diagnostics-panel"
          :class="['rounded-xl border border-neutral-200/80 bg-neutral-50/85 p-2 text-xs dark:border-neutral-700/70 dark:bg-neutral-900/55']"
        >
          <div :class="['mb-2 font-600 text-neutral-700 dark:text-neutral-200']">
            Advanced / Diagnostics
          </div>

          <div :class="['mb-2 flex flex-wrap items-center gap-2']">
            <Button size="sm" variant="ghost" :disabled="prewarming" @click="handlePrewarmVision">
              {{ prewarming ? '处理中...' : '预加载/重试 Runtime' }}
            </Button>
            <Button size="sm" variant="ghost" :disabled="prewarming" @click="handleRetryRuntime">
              Retry Runtime
            </Button>
            <Button size="sm" variant="ghost" :disabled="prewarming" @click="handleResetRuntime">
              Reset Runtime
            </Button>
          </div>

          <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              Vision Runtime
            </div>
            <div>status: {{ runtimeStatusText }}</div>
            <div>warmupDuration: {{ runtimeWarmupDurationText }}</div>
            <div>retryCount: {{ runtimeRetryCount }}</div>
            <div>lastError: {{ runtimeLastError || 'none' }}</div>
            <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
              First startup may take a moment.
            </div>
            <div :class="['text-neutral-500 dark:text-neutral-400']">
              Models are reused after warmup.
            </div>
            <div :class="['text-neutral-500 dark:text-neutral-400']">
              Stop Camera releases camera only; models stay ready.
            </div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              模型状态
            </div>
            <div>预热状态：{{ modelWarmupStatusText }}</div>
            <div>当前来源：{{ modelSourceText }}</div>
            <div>模型规格：{{ modelProfile }}</div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              Vision Diagnostics
            </div>
            <div>runtimeStatus: {{ runtimeStatusText }}</div>
            <div>cameraState: {{ cameraState }}</div>
            <div>cameraPermission: {{ cameraPermissionStateText }}</div>
            <div>MediaPipe: {{ mediaPipeStatusText }}</div>
            <div>OpenCV: {{ openCvStatusText }}</div>
            <div>faceProfile: {{ profileStatus }}</div>
            <div>faceGate: {{ localFaceGate.gateState }} / {{ gateProfileStatusText }}</div>
            <div>lastError: {{ visionDiagnosticsLastError }}</div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              启动耗时
            </div>
            <div>权限请求：{{ permissionTimingText }}</div>
            <div>video.play：{{ videoPlayTimingText }}</div>
            <div>识别器初始化：{{ recognizerInitTimingText }}</div>
            <div>可见画面就绪：{{ readyForPreviewTimingText }}</div>
            <div>总耗时：{{ totalTimingText }}</div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div>最近手势：{{ gestureText }}</div>
            <div>最近推理：{{ lastInferenceText }}</div>
            <div>交互安静模式：{{ isVisionQuiet ? `进行中（${quietRemainingSeconds}秒）` : '未开启' }}</div>
            <div>quietSuppressed: {{ feedbackSuppressedByQuiet ? 'yes' : 'no' }}</div>
            <div>gateBlocked: {{ feedbackBlockedByGate ? 'yes' : 'no' }}</div>
            <div>本地庆祝计数：{{ localCelebrationCount }}</div>
            <div>Current pet state: {{ petFeedbackStateText }}</div>
            <div>Last pet feedback: {{ lastPetFeedbackSummary }}</div>
            <div>Quiet remaining seconds: {{ isQuietVisualMode ? petQuietRemainingSeconds : 0 }}</div>
            <div>Celebration count: {{ petCelebrationCount }}</div>
            <div
              v-if="shouldShowPetFeedbackGatedHint"
              :class="['mt-1 text-amber-600 dark:text-amber-300']"
            >
              Gesture detected but pet feedback gated.
            </div>
            <div v-if="isQuietVisualMode" :class="['mt-2 flex items-center gap-2']">
              <Button size="sm" variant="ghost" @click="cancelQuietVisualMode">
                关闭 quiet visual mode
              </Button>
            </div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              Contextual feedback diagnostics
            </div>
            <label :class="['mb-2 flex items-center gap-2']">
              <span>Locale:</span>
              <select
                data-testid="feedback-locale-select"
                :value="feedbackLocale"
                :class="[
                  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                  'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
                ]"
                @change="onFeedbackLocaleChange"
              >
                <option
                  v-for="option in feedbackLocaleOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label :class="['mb-2 flex items-center gap-2']">
              <span>Variant:</span>
              <select
                data-testid="feedback-variant-select"
                :value="feedbackVariant"
                :class="[
                  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                  'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
                ]"
                @change="onFeedbackVariantChange"
              >
                <option
                  v-for="option in feedbackVariantOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <div>lastFeedbackType: {{ lastContextualFeedbackTypeText }}</div>
            <div>resolvedFeedbackEventType: {{ resolvedFeedbackEventTypeText }}</div>
            <div>transitionFeedback: {{ transitionFeedbackBadgeText }}</div>
            <div>feedbackLevel: {{ contextualFeedbackLevelText }}</div>
            <div>feedbackPriority: {{ contextualFeedbackPriorityText }}</div>
            <div>feedbackChannels: {{ contextualFeedbackChannelsText }}</div>
            <div>feedbackTemplateId: {{ contextualFeedbackTemplateIdText }}</div>
            <div>activeBubbleLevel: {{ activeBubbleLevelText }}</div>
            <div>activeBubbleEventType: {{ activeBubbleEventTypeText }}</div>
            <div>activeBubbleTemplateId: {{ activeBubbleTemplateIdText }}</div>
            <div>bubbleVisibleUntil: {{ bubbleVisibleUntil }}</div>
            <div>bubbleRemainingSec: {{ bubbleRemainingSeconds }}</div>
            <div>nextAllowedFeedbackIn: {{ nextAllowedFeedbackSeconds }}</div>
            <div>dwellStatus: {{ dwellStatusText }}</div>
            <div>subjectResponseCooldownSec: {{ subjectResponseCooldownSeconds }}</div>
            <div>subjectPositionChangedAt: {{ subjectPositionChangedText }}</div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              Advanced / Experimental Gesture Controls
            </div>
            <label :class="['mb-2 flex items-center gap-2']">
              <input
                data-testid="gesture-controls-toggle"
                type="checkbox"
                :checked="gestureControlsEnabled"
                @change="toggleGestureControls"
              >
              <span>Enable experimental gesture controls</span>
            </label>
            <div>gestureEnabled: {{ gestureControlsEnabled ? 'true' : 'false' }}</div>
            <Button
              data-testid="gesture-diagnostics-toggle"
              size="sm"
              variant="ghost"
              @click="gestureDiagnosticsExpanded = !gestureDiagnosticsExpanded"
            >
              {{ gestureDiagnosticsExpanded ? 'Hide gesture diagnostics' : 'Show gesture diagnostics' }}
            </Button>
            <div v-if="showAdvancedGestureDiagnostics" :class="['mt-2']">
              <div>candidateGesture: {{ candidateGesture }}</div>
              <div>stableGesture: {{ stableGesture }}</div>
              <div>gestureState: {{ gestureState }}</div>
              <div>gestureConfidence: {{ gestureConfidenceText }}</div>
              <div>gestureVotes: {{ gestureVoteText }}</div>
              <div>geometryPassRate: {{ geometryPassRateText }}</div>
              <div>gestureQualityState: {{ gestureQualityState }}</div>
              <div>handSize: {{ handSizeRatioText }}</div>
              <div>handInsideGuideArea: {{ handInsideGuideArea ? 'true' : 'false' }}</div>
              <div>holdProgress: {{ holdProgressText }}</div>
              <div>cooldownRemainingMs: {{ cooldownRemainingText }}</div>
              <div>releaseRequired: {{ releaseRequired ? 'true' : 'false' }}</div>
              <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
                {{ gestureCalibrationHint }}
              </div>
              <div :class="['text-neutral-500 dark:text-neutral-400']">
                Move your hand closer.
              </div>
              <div :class="['text-neutral-500 dark:text-neutral-400']">
                Keep your hand inside the guide area.
              </div>
              <div :class="['text-neutral-500 dark:text-neutral-400']">
                Hold the gesture steady.
              </div>
              <div :class="['text-neutral-500 dark:text-neutral-400']">
                Release your hand to trigger again.
              </div>
              <div :class="['text-neutral-500 dark:text-neutral-400']">
                Better lighting may help.
              </div>
            </div>
            <div
              v-else
              :class="['mt-1 text-neutral-500 dark:text-neutral-400']"
            >
              Gesture diagnostics are collapsed by default.
            </div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
              Expression Signal diagnostics
            </div>
            <Button
              data-testid="expression-diagnostics-toggle"
              size="sm"
              variant="ghost"
              @click="expressionSignalDiagnosticsExpanded = !expressionSignalDiagnosticsExpanded"
            >
              {{ expressionSignalDiagnosticsExpanded ? 'Hide expression diagnostics' : 'Show expression diagnostics' }}
            </Button>
            <div v-if="expressionSignalDiagnosticsExpanded" :class="['mt-2']">
              <div>expressionSignal: {{ expressionSignal }}</div>
              <div>expressionSignalCandidate: {{ expressionSignalCandidate }}</div>
              <div>stableExpressionSignal: {{ stableExpressionSignal }}</div>
              <div>confidence: {{ expressionSignalConfidenceText }}</div>
              <div>reason: {{ expressionSignalReason }}</div>
              <div>source: {{ expressionSignalSource }}</div>
              <div>stableFrames: {{ expressionSignalStableFrames }}</div>
              <div>signalChangedAt: {{ expressionSignalChangedText }}</div>
              <div>cooldownRemainingSec: {{ expressionSignalCooldownRemainingSeconds }}</div>
              <div>feedbackAllowed: {{ expressionSignalFeedbackAllowed ? 'yes' : 'no' }}</div>
              <div>signalUnavailable: {{ expressionSignalUnavailable ? 'yes' : 'no' }}</div>
            </div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
              最近事件
            </div>
            <div v-if="lastEvent">
              {{ lastEvent.message }} ({{ new Date(lastEvent.at).toLocaleTimeString() }})
            </div>
            <div v-else>
              无
            </div>
          </div>

          <div :class="['mt-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
              当前提示
            </div>
            <div v-if="activePrompt">
              {{ activePrompt }}
            </div>
            <div v-else>
              无
            </div>
          </div>

          <label :class="['mt-2 flex flex-col gap-1 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
            <span :class="['font-600 text-neutral-700 dark:text-neutral-200']">推理停滞补偿（毫秒）</span>
            <input
              v-model="maxInferenceStallInput"
              inputmode="numeric"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
              placeholder="1200"
            >
          </label>
        </div>

        <div v-if="errorMessage" :class="['rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/35 dark:text-rose-300']">
          {{ errorMessage }}
        </div>

        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          摄像头默认关闭。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          识别仅在本地运行。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          人脸门控为可选项，使用本地加密档案。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          不会上传任何摄像头数据。
        </div>

        <video
          ref="videoRef"
          muted
          playsinline
          :class="['h-0 w-0 op-0 pointer-events-none']"
        />
      </div>
    </div>
  </div>
</template>
