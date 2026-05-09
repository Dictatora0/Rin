import type { LocalFaceGateState } from './use-local-face-gate'
import type { VisionFaceDirection } from './use-vision-interaction'

import { errorMessageFrom } from '@moeru/std'
import {
  EmotionHappyMotionName,
  EmotionNeutralMotionName,
  EmotionThinkMotionName,
  useExpressionStore,
  useLive2d,
} from '@proj-airi/stage-ui-live2d'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { pickVisionFeedbackMessage } from '../utils/vision-feedback-messages'

type VisionPetFeedbackEventType
  = | 'open_palm'
    | 'victory'
    | 'thumbs_up'
    | 'face_return'
    | 'face_direction_change'
    | 'gated'

type VisionPetFeedbackState = 'idle' | 'quiet' | 'celebrating' | 'acknowledged' | 'gated'
type VisionSubjectPosition = Exclude<VisionFaceDirection, 'unknown'>
type VisionSubjectResponseState = 'idle' | 'following_left' | 'following_right' | 'looking_up' | 'looking_down' | 'centered' | 'gated'
export type VisionFeedbackIntensity = 'minimal' | 'balanced' | 'expressive'
export type VisionFeedbackLevel = 'subtle' | 'normal' | 'strong'
export type VisionContextualFeedbackPriority = 'low' | 'normal' | 'high'
export type VisionContextualFeedbackEventType
  = | 'subject_moved_left'
    | 'subject_moved_right'
    | 'subject_moved_up'
    | 'subject_moved_down'
    | 'subject_centered'
    | 'subject_returned'
    | 'subject_absent'
    | 'subject_matched'
    | 'subject_gated'
    | 'subject_uncertain'
    | 'subject_dwelled_left'
    | 'subject_dwelled_right'
    | 'subject_dwelled_center'

interface VisionPetFeedbackRecord {
  eventType: VisionPetFeedbackEventType
  state: VisionPetFeedbackState
  at: number
  sourceEventId?: number
  motion?: string
  expression?: string
  gated?: boolean
  suppressedByQuiet?: boolean
  faceDirection?: VisionFaceDirection
  summary: string
}

interface VisionSubjectResponseRecord {
  eventType: VisionContextualFeedbackEventType
  direction: VisionSubjectPosition
  state: VisionSubjectResponseState
  at: number
  sourceEventId?: number
  motion?: string
  expression?: string
  gated: boolean
  suppressedByQuiet: boolean
  feedbackLevel: VisionFeedbackLevel
  feedbackPriority: VisionContextualFeedbackPriority
  toastMessage?: string
  summary: string
}

interface TriggerVisionPetFeedbackOptions {
  allowVisualFeedback?: boolean
  gateEnabled?: boolean
  gateState?: LocalFaceGateState
  sourceEventId?: number
  faceDirection?: VisionFaceDirection
  summary?: string
  force?: boolean
}

interface TriggerSubjectPositionFeedbackOptions {
  allowVisualFeedback?: boolean
  gateEnabled?: boolean
  gateState?: LocalFaceGateState
  sourceEventId?: number
  summary?: string
  force?: boolean
  displayName?: string
}

interface TriggerContextualVisionFeedbackOptions {
  allowVisualFeedback?: boolean
  gateEnabled?: boolean
  gateState?: LocalFaceGateState
  sourceEventId?: number
  direction?: VisionFaceDirection
  displayName?: string
  summary?: string
  force?: boolean
}

interface UseVisionPetFeedbackOptions {
  quietDurationMs?: number
  celebrationVisualMs?: number
  acknowledgedVisualMs?: number
  gatedVisualMs?: number
  feedbackCooldownMs?: number
  victoryCooldownMs?: number
  live2dMotionCooldownMs?: number
  subjectResponseCooldownMs?: number
  subjectResponseVisualMs?: number
  subjectReturnedCooldownMs?: number
  subjectMatchedCooldownMs?: number
  subjectAbsentCooldownMs?: number
  subjectGatedCooldownMs?: number
  subjectUncertainCooldownMs?: number
  subjectDwellCooldownMs?: number
  feedbackMessageCooldownMs?: number
  directionToastCooldownMs?: number
  highPriorityToastHoldMs?: number
  random?: () => number
}

const DEFAULT_OPTIONS: Required<UseVisionPetFeedbackOptions> = {
  quietDurationMs: 30_000,
  celebrationVisualMs: 3_000,
  acknowledgedVisualMs: 2_000,
  gatedVisualMs: 2_000,
  feedbackCooldownMs: 2_000,
  victoryCooldownMs: 3_000,
  live2dMotionCooldownMs: 1_100,
  subjectResponseCooldownMs: 3_500,
  subjectResponseVisualMs: 1_400,
  subjectReturnedCooldownMs: 10_000,
  subjectMatchedCooldownMs: 10_000,
  subjectAbsentCooldownMs: 8_000,
  subjectGatedCooldownMs: 5_000,
  subjectUncertainCooldownMs: 8_000,
  subjectDwellCooldownMs: 14_000,
  feedbackMessageCooldownMs: 5_000,
  directionToastCooldownMs: 2_500,
  highPriorityToastHoldMs: 3_000,
  random: Math.random,
}

const FEEDBACK_INTENSITY_STORAGE_KEY = 'airi.vision-experiment.feedback-intensity.v1'

function normalizeFeedbackIntensity(value: string | null): VisionFeedbackIntensity {
  if (value === 'minimal' || value === 'balanced' || value === 'expressive')
    return value
  return 'balanced'
}

function loadFeedbackIntensity() {
  if (typeof localStorage === 'undefined')
    return 'balanced' as const
  try {
    return normalizeFeedbackIntensity(localStorage.getItem(FEEDBACK_INTENSITY_STORAGE_KEY))
  }
  catch {
    return 'balanced' as const
  }
}

function persistFeedbackIntensity(intensity: VisionFeedbackIntensity) {
  if (typeof localStorage === 'undefined')
    return
  try {
    localStorage.setItem(FEEDBACK_INTENSITY_STORAGE_KEY, intensity)
  }
  catch {
    // ignore storage write failures
  }
}

/**
 * Drives short-lived Live2D feedback for vision gestures.
 *
 * Use when:
 * - Gesture detection events should trigger visible pet reactions.
 * - Feedback must stay local to Vision Island experiments.
 *
 * Expects:
 * - Caller passes gate context for each trigger when available.
 * - Live2D motion/expression availability may vary by model.
 *
 * Returns:
 * - Trigger API, short-lived visual state, cooldown-safe feedback snapshots,
 *   and quiet-mode controls for Vision Island UI.
 */
export function useVisionPetFeedback(options?: UseVisionPetFeedbackOptions) {
  const runtimeOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const settingsStore = useSettings()
  const { stageModelRenderer } = storeToRefs(settingsStore)
  const live2dStore = useLive2d()
  const expressionStore = useExpressionStore()
  const { currentMotion, availableMotions } = storeToRefs(live2dStore)

  const petFeedbackState = ref<VisionPetFeedbackState>('idle')
  const lastPetFeedback = ref<VisionPetFeedbackRecord | null>(null)
  const subjectResponseState = ref<VisionSubjectResponseState>('idle')
  const lastSubjectResponseEvent = ref<VisionSubjectResponseRecord | null>(null)
  const subjectResponseCooldownUntil = ref(0)
  const lastSubjectStableDirection = ref<VisionFaceDirection>('unknown')
  const quietVisualUntil = ref(0)
  const quietRemainingMs = ref(0)
  const celebrationCount = ref(0)
  const isQuietVisualMode = computed(() => quietRemainingMs.value > 0)
  const feedbackIntensity = ref<VisionFeedbackIntensity>(loadFeedbackIntensity())
  const lastFeedbackType = ref<VisionContextualFeedbackEventType | null>(null)
  const lastFeedbackMessage = ref('')
  const lastFeedbackLevel = ref<VisionFeedbackLevel>('subtle')
  const lastFeedbackPriority = ref<VisionContextualFeedbackPriority>('low')
  const lastFeedbackAt = ref<number | null>(null)
  const nextAllowedFeedbackAt = ref(0)
  const feedbackSuppressedByQuiet = ref(false)
  const feedbackBlockedByGate = ref(false)

  const lastTriggeredAt = ref<Record<VisionPetFeedbackEventType, number>>({
    open_palm: Number.NEGATIVE_INFINITY,
    victory: Number.NEGATIVE_INFINITY,
    thumbs_up: Number.NEGATIVE_INFINITY,
    face_return: Number.NEGATIVE_INFINITY,
    face_direction_change: Number.NEGATIVE_INFINITY,
    gated: Number.NEGATIVE_INFINITY,
  })
  const lastDirectionalToastAt = ref(Number.NEGATIVE_INFINITY)
  const highPriorityToastUntil = ref(Number.NEGATIVE_INFINITY)
  const lastMotionTriggeredAt = ref(Number.NEGATIVE_INFINITY)
  const contextualLastTriggeredAt = ref<Record<VisionContextualFeedbackEventType, number>>({
    subject_moved_left: Number.NEGATIVE_INFINITY,
    subject_moved_right: Number.NEGATIVE_INFINITY,
    subject_moved_up: Number.NEGATIVE_INFINITY,
    subject_moved_down: Number.NEGATIVE_INFINITY,
    subject_centered: Number.NEGATIVE_INFINITY,
    subject_returned: Number.NEGATIVE_INFINITY,
    subject_absent: Number.NEGATIVE_INFINITY,
    subject_matched: Number.NEGATIVE_INFINITY,
    subject_gated: Number.NEGATIVE_INFINITY,
    subject_uncertain: Number.NEGATIVE_INFINITY,
    subject_dwelled_left: Number.NEGATIVE_INFINITY,
    subject_dwelled_right: Number.NEGATIVE_INFINITY,
    subject_dwelled_center: Number.NEGATIVE_INFINITY,
  })
  const previousMessageByEventType = ref<Record<VisionContextualFeedbackEventType, string | null>>({
    subject_moved_left: null,
    subject_moved_right: null,
    subject_moved_up: null,
    subject_moved_down: null,
    subject_centered: null,
    subject_returned: null,
    subject_absent: null,
    subject_matched: null,
    subject_gated: null,
    subject_uncertain: null,
    subject_dwelled_left: null,
    subject_dwelled_right: null,
    subject_dwelled_center: null,
  })
  let stateResetTimer: ReturnType<typeof setTimeout> | null = null
  let quietTickerId: ReturnType<typeof setInterval> | null = null

  const nextAllowedFeedbackIn = computed(() => {
    return Math.max(0, nextAllowedFeedbackAt.value - Date.now())
  })

  function startQuietTicker() {
    if (quietTickerId !== null || typeof window === 'undefined')
      return
    quietTickerId = setInterval(() => syncQuietRemainingMs(Date.now()), 250)
  }

  function stopQuietTicker() {
    if (quietTickerId === null)
      return
    clearInterval(quietTickerId)
    quietTickerId = null
  }

  function clearStateResetTimer() {
    if (stateResetTimer === null)
      return
    clearTimeout(stateResetTimer)
    stateResetTimer = null
  }

  function setTransientState(nextState: VisionPetFeedbackState, holdMs: number) {
    clearStateResetTimer()
    petFeedbackState.value = nextState
    stateResetTimer = setTimeout(() => {
      petFeedbackState.value = isQuietVisualMode.value ? 'quiet' : 'idle'
      stateResetTimer = null
    }, holdMs)
  }

  function normalizeKey(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
  }

  function syncQuietRemainingMs(nowMs: number) {
    quietRemainingMs.value = Math.max(0, quietVisualUntil.value - nowMs)
    if (quietRemainingMs.value === 0) {
      if (petFeedbackState.value === 'quiet')
        petFeedbackState.value = 'idle'
      stopQuietTicker()
    }
  }

  function activateQuietVisualMode(nowMs: number) {
    quietVisualUntil.value = nowMs + runtimeOptions.quietDurationMs
    syncQuietRemainingMs(nowMs)
    clearStateResetTimer()
    petFeedbackState.value = 'quiet'
    startQuietTicker()
  }

  function cancelQuietVisualMode() {
    quietVisualUntil.value = 0
    syncQuietRemainingMs(Date.now())
    if (petFeedbackState.value === 'quiet')
      petFeedbackState.value = 'idle'
  }

  function setFeedbackIntensity(nextIntensity: VisionFeedbackIntensity) {
    feedbackIntensity.value = nextIntensity
    persistFeedbackIntensity(nextIntensity)
  }

  watch(feedbackIntensity, (nextIntensity) => {
    persistFeedbackIntensity(nextIntensity)
  }, { immediate: true })

  function shouldAllowVisualFeedback(options?: TriggerVisionPetFeedbackOptions | TriggerContextualVisionFeedbackOptions) {
    if (options?.allowVisualFeedback !== undefined)
      return options.allowVisualFeedback
    if (options?.gateEnabled === undefined)
      return true
    if (!options.gateEnabled)
      return true
    return options.gateState === 'enabled'
  }

  function getCooldownMs(eventType: VisionPetFeedbackEventType) {
    if (eventType === 'victory')
      return runtimeOptions.victoryCooldownMs
    return runtimeOptions.feedbackCooldownMs
  }

  function isInCooldown(eventType: VisionPetFeedbackEventType, nowMs: number, force = false) {
    if (force)
      return false
    return nowMs - lastTriggeredAt.value[eventType] < getCooldownMs(eventType)
  }

  function resolveMotionCandidate(motionCandidates: string[]): { group: string, index?: number } | null {
    const motionLookup = new Map<string, { group: string, index: number }>()
    for (const motion of availableMotions.value) {
      const key = normalizeKey(motion.motionName)
      if (!motionLookup.has(key)) {
        motionLookup.set(key, {
          group: motion.motionName,
          index: motion.motionIndex,
        })
      }
    }

    for (const candidate of motionCandidates) {
      const match = motionLookup.get(normalizeKey(candidate))
      if (match)
        return match
    }

    return null
  }

  function triggerMotionWithFallback(motionCandidates: string[]) {
    if (stageModelRenderer.value !== 'live2d')
      return undefined

    const nowMs = Date.now()
    if ((nowMs - lastMotionTriggeredAt.value) < runtimeOptions.live2dMotionCooldownMs)
      return undefined

    const resolved = resolveMotionCandidate(motionCandidates)
    if (!resolved)
      return undefined

    const previousMotion = currentMotion.value
    if (previousMotion.group === resolved.group && previousMotion.index === resolved.index)
      return resolved.group

    try {
      currentMotion.value = resolved.index === undefined
        ? { group: resolved.group }
        : { group: resolved.group, index: resolved.index }
      lastMotionTriggeredAt.value = nowMs
      return resolved.group
    }
    catch (error) {
      console.warn('[vision][pet-feedback] failed to set motion', {
        motionCandidates,
        resolved,
        message: errorMessageFrom(error) ?? 'unknown error',
      })
      return undefined
    }
  }

  function resolveExpressionCandidate(expressionCandidates: string[]) {
    const groupEntries = Array.from(expressionStore.expressionGroups.keys()).map((name) => {
      return [normalizeKey(name), name] as const
    })
    const parameterEntries = Array.from(expressionStore.expressions.keys()).map((name) => {
      return [normalizeKey(name), name] as const
    })
    const groupLookup = new Map<string, string>(groupEntries)
    const parameterLookup = new Map<string, string>(parameterEntries)

    for (const candidate of expressionCandidates) {
      const key = normalizeKey(candidate)
      const match = groupLookup.get(key) ?? parameterLookup.get(key)
      if (match)
        return match
    }

    return undefined
  }

  function triggerExpressionWithFallback(expressionCandidates: string[], durationMs: number) {
    if (stageModelRenderer.value !== 'live2d')
      return undefined
    if (!expressionStore.modelId)
      return undefined

    const resolved = resolveExpressionCandidate(expressionCandidates)
    if (!resolved)
      return undefined

    try {
      const result = expressionStore.toggle(resolved, Math.max(0, durationMs) / 1000)
      if (!result.success)
        return undefined
      return resolved
    }
    catch (error) {
      console.warn('[vision][pet-feedback] failed to set expression', {
        expressionCandidates,
        resolved,
        message: errorMessageFrom(error) ?? 'unknown error',
      })
      return undefined
    }
  }

  function commitFeedbackRecord(record: VisionPetFeedbackRecord) {
    lastPetFeedback.value = record
  }

  function mapSubjectResponseState(direction: VisionSubjectPosition): VisionSubjectResponseState {
    if (direction === 'left')
      return 'following_left'
    if (direction === 'right')
      return 'following_right'
    if (direction === 'up')
      return 'looking_up'
    if (direction === 'down')
      return 'looking_down'
    return 'centered'
  }

  function directionFromContextualEvent(eventType: VisionContextualFeedbackEventType): VisionSubjectPosition {
    if (eventType === 'subject_moved_left' || eventType === 'subject_dwelled_left')
      return 'left'
    if (eventType === 'subject_moved_right' || eventType === 'subject_dwelled_right')
      return 'right'
    if (eventType === 'subject_moved_up')
      return 'up'
    if (eventType === 'subject_moved_down')
      return 'down'
    return 'center'
  }

  function templateTypeFromContextualEvent(eventType: VisionContextualFeedbackEventType) {
    if (eventType === 'subject_moved_left')
      return 'subject_position_left' as const
    if (eventType === 'subject_moved_right')
      return 'subject_position_right' as const
    if (eventType === 'subject_moved_up')
      return 'subject_position_up' as const
    if (eventType === 'subject_moved_down')
      return 'subject_position_down' as const
    if (eventType === 'subject_centered')
      return 'subject_position_center' as const
    if (eventType === 'subject_returned')
      return 'subject_returned' as const
    if (eventType === 'subject_absent')
      return 'subject_absent' as const
    if (eventType === 'subject_matched')
      return 'subject_matched' as const
    if (eventType === 'subject_uncertain')
      return 'subject_uncertain' as const
    if (eventType === 'subject_dwelled_left')
      return 'subject_dwelled_left' as const
    if (eventType === 'subject_dwelled_right')
      return 'subject_dwelled_right' as const
    if (eventType === 'subject_dwelled_center')
      return 'subject_dwelled_center' as const
    return 'subject_gated' as const
  }

  function getContextualCooldownMs(eventType: VisionContextualFeedbackEventType) {
    if (eventType === 'subject_returned')
      return runtimeOptions.subjectReturnedCooldownMs
    if (eventType === 'subject_matched')
      return runtimeOptions.subjectMatchedCooldownMs
    if (eventType === 'subject_absent')
      return runtimeOptions.subjectAbsentCooldownMs
    if (eventType === 'subject_gated')
      return runtimeOptions.subjectGatedCooldownMs
    if (eventType === 'subject_uncertain')
      return runtimeOptions.subjectUncertainCooldownMs
    if (eventType === 'subject_dwelled_left' || eventType === 'subject_dwelled_right' || eventType === 'subject_dwelled_center')
      return runtimeOptions.subjectDwellCooldownMs
    return runtimeOptions.feedbackMessageCooldownMs
  }

  function resolveFeedbackLevel(eventType: VisionContextualFeedbackEventType, intensity: VisionFeedbackIntensity) {
    if (intensity === 'minimal') {
      if (eventType === 'subject_returned' || eventType === 'subject_matched')
        return 'subtle' as const
      return null
    }

    if (intensity === 'balanced') {
      if (eventType === 'subject_dwelled_left' || eventType === 'subject_dwelled_right')
        return null
      if (eventType === 'subject_returned' || eventType === 'subject_matched')
        return 'strong' as const
      if (eventType === 'subject_absent' || eventType === 'subject_uncertain')
        return 'subtle' as const
      return 'normal' as const
    }

    if (eventType === 'subject_returned' || eventType === 'subject_matched')
      return 'strong' as const
    if (eventType === 'subject_absent' || eventType === 'subject_uncertain')
      return 'subtle' as const
    return 'normal' as const
  }

  function resolveSubjectResponseMotionCandidates(direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
    if (level === 'subtle') {
      return [
        EmotionNeutralMotionName,
        'Idle',
      ]
    }

    if (direction === 'left' || direction === 'right') {
      if (level === 'strong') {
        return [
          'Curious',
          EmotionHappyMotionName,
          EmotionThinkMotionName,
          EmotionNeutralMotionName,
          'Idle',
        ]
      }
      return [
        'Curious',
        EmotionThinkMotionName,
        'Think',
        EmotionNeutralMotionName,
        'Idle',
      ]
    }

    if (direction === 'up' || direction === 'down') {
      if (level === 'strong') {
        return [
          EmotionHappyMotionName,
          EmotionThinkMotionName,
          'Think',
          EmotionNeutralMotionName,
          'Idle',
        ]
      }
      return [
        EmotionThinkMotionName,
        'Think',
        EmotionNeutralMotionName,
        'Idle',
      ]
    }

    if (level === 'strong') {
      return [
        EmotionHappyMotionName,
        'Happy',
        'Curious',
        EmotionNeutralMotionName,
        'Idle',
      ]
    }

    return [
      EmotionHappyMotionName,
      'Happy',
      EmotionNeutralMotionName,
      'Idle',
    ]
  }

  function resolveSubjectResponseExpressionCandidates(direction: VisionSubjectPosition, level: VisionFeedbackLevel) {
    if (level === 'subtle')
      return ['normal', 'neutral']
    if (direction === 'left' || direction === 'right') {
      return level === 'strong'
        ? ['curious', 'smile', 'normal', 'neutral']
        : ['curious', 'normal', 'neutral']
    }
    if (direction === 'center') {
      return level === 'strong'
        ? ['smile', 'happy', 'normal']
        : ['smile', 'normal', 'happy']
    }
    return ['normal', 'neutral']
  }

  function shouldAllowContextualToast(eventType: VisionContextualFeedbackEventType, level: VisionFeedbackLevel) {
    if (feedbackIntensity.value === 'minimal')
      return eventType === 'subject_returned' || eventType === 'subject_matched'
    if (feedbackIntensity.value === 'balanced')
      return level !== 'subtle' || eventType === 'subject_returned' || eventType === 'subject_matched'
    return true
  }

  function resolveContextualState(eventType: VisionContextualFeedbackEventType, direction: VisionSubjectPosition) {
    if (eventType === 'subject_gated')
      return 'gated' as const
    if (eventType === 'subject_absent')
      return 'idle' as const
    if (eventType === 'subject_uncertain')
      return 'idle' as const
    return mapSubjectResponseState(direction)
  }

  function resolveContextualFeedbackPriority(eventType: VisionContextualFeedbackEventType): VisionContextualFeedbackPriority {
    if (eventType === 'subject_returned' || eventType === 'subject_matched')
      return 'high'
    if (eventType === 'subject_gated' || eventType === 'subject_absent' || eventType === 'subject_uncertain')
      return 'normal'
    return 'low'
  }

  function isDirectionalContextualEvent(eventType: VisionContextualFeedbackEventType) {
    return eventType === 'subject_moved_left'
      || eventType === 'subject_moved_right'
      || eventType === 'subject_moved_up'
      || eventType === 'subject_moved_down'
      || eventType === 'subject_centered'
      || eventType === 'subject_dwelled_left'
      || eventType === 'subject_dwelled_right'
      || eventType === 'subject_dwelled_center'
  }

  function isContextualInCooldown(eventType: VisionContextualFeedbackEventType, nowMs: number, force = false) {
    if (force)
      return false
    const cooldownMs = getContextualCooldownMs(eventType)
    const lastAt = contextualLastTriggeredAt.value[eventType]
    return nowMs - lastAt < cooldownMs
  }

  function triggerContextualVisionFeedback(
    eventType: VisionContextualFeedbackEventType,
    options?: TriggerContextualVisionFeedbackOptions,
  ) {
    const nowMs = Date.now()
    const isGateBlocked = !shouldAllowVisualFeedback(options)
    feedbackBlockedByGate.value = isGateBlocked
    feedbackSuppressedByQuiet.value = false

    const direction = options?.direction && options.direction !== 'unknown'
      ? options.direction
      : directionFromContextualEvent(eventType)
    const nextEventType = isGateBlocked ? 'subject_gated' : eventType
    const feedbackPriority = resolveContextualFeedbackPriority(nextEventType)
    if (isContextualInCooldown(nextEventType, nowMs, options?.force))
      return false
    const feedbackLevel = resolveFeedbackLevel(nextEventType, feedbackIntensity.value)
    const templateType = templateTypeFromContextualEvent(nextEventType)
    const previousMessage = previousMessageByEventType.value[nextEventType]
    const summary = options?.summary ?? pickVisionFeedbackMessage(templateType, {
      displayName: options?.displayName,
      previousMessage,
      random: runtimeOptions.random,
    })
    previousMessageByEventType.value[nextEventType] = summary

    const suppressedByQuiet = isQuietVisualMode.value || feedbackLevel === null
    feedbackSuppressedByQuiet.value = isQuietVisualMode.value
    const nextLevel: VisionFeedbackLevel = feedbackLevel ?? 'subtle'
    const shouldRunVisualEffects = !isGateBlocked && !suppressedByQuiet && feedbackLevel !== null
    const motionCandidates = shouldRunVisualEffects
      ? resolveSubjectResponseMotionCandidates(direction, nextLevel)
      : []
    const expressionCandidates = shouldRunVisualEffects
      ? resolveSubjectResponseExpressionCandidates(direction, nextLevel)
      : []
    const motion = shouldRunVisualEffects
      ? triggerMotionWithFallback(motionCandidates)
      : undefined
    const expression = shouldRunVisualEffects
      ? triggerExpressionWithFallback(expressionCandidates, runtimeOptions.subjectResponseVisualMs)
      : undefined

    let shouldToast = !suppressedByQuiet
      && feedbackLevel !== null
      && shouldAllowContextualToast(nextEventType, nextLevel)
    if (shouldToast && feedbackPriority === 'low' && nowMs < highPriorityToastUntil.value)
      shouldToast = false
    if (shouldToast && isDirectionalContextualEvent(nextEventType)) {
      const inDirectionalToastCooldown = (nowMs - lastDirectionalToastAt.value) < runtimeOptions.directionToastCooldownMs
      if (inDirectionalToastCooldown)
        shouldToast = false
      else
        lastDirectionalToastAt.value = nowMs
    }
    if (shouldToast && feedbackPriority === 'high')
      highPriorityToastUntil.value = nowMs + runtimeOptions.highPriorityToastHoldMs

    const state = resolveContextualState(nextEventType, direction)
    subjectResponseState.value = state
    subjectResponseCooldownUntil.value = nowMs + runtimeOptions.subjectResponseCooldownMs
    lastSubjectStableDirection.value = direction
    lastSubjectResponseEvent.value = {
      eventType: nextEventType,
      direction,
      state,
      at: nowMs,
      sourceEventId: options?.sourceEventId,
      motion,
      expression,
      gated: isGateBlocked,
      suppressedByQuiet,
      feedbackLevel: nextLevel,
      feedbackPriority,
      toastMessage: shouldToast ? summary : undefined,
      summary,
    }

    contextualLastTriggeredAt.value[nextEventType] = nowMs
    const cooldownMs = getContextualCooldownMs(nextEventType)
    nextAllowedFeedbackAt.value = nowMs + cooldownMs
    lastFeedbackType.value = nextEventType
    lastFeedbackMessage.value = summary
    lastFeedbackLevel.value = nextLevel
    lastFeedbackPriority.value = feedbackPriority
    lastFeedbackAt.value = nowMs

    if (isGateBlocked || nextEventType === 'subject_gated')
      setTransientState('gated', runtimeOptions.gatedVisualMs)
    else if (isQuietVisualMode.value)
      petFeedbackState.value = 'quiet'

    return true
  }

  function triggerSubjectPositionFeedback(
    direction: VisionFaceDirection,
    options?: TriggerSubjectPositionFeedbackOptions,
  ) {
    if (direction === 'unknown')
      return false

    const eventType: VisionContextualFeedbackEventType
      = direction === 'left'
        ? 'subject_moved_left'
        : direction === 'right'
          ? 'subject_moved_right'
          : direction === 'up'
            ? 'subject_moved_up'
            : direction === 'down'
              ? 'subject_moved_down'
              : 'subject_centered'

    return triggerContextualVisionFeedback(eventType, {
      allowVisualFeedback: options?.allowVisualFeedback,
      gateEnabled: options?.gateEnabled,
      gateState: options?.gateState,
      sourceEventId: options?.sourceEventId,
      direction,
      displayName: options?.displayName,
      summary: options?.summary,
      force: options?.force,
    })
  }

  function recordGatedFeedback(nowMs: number, options?: TriggerVisionPetFeedbackOptions) {
    setTransientState('gated', runtimeOptions.gatedVisualMs)
    commitFeedbackRecord({
      eventType: 'gated',
      state: 'gated',
      at: nowMs,
      sourceEventId: options?.sourceEventId,
      gated: true,
      summary: options?.summary ?? 'Gesture detected but pet feedback gated.',
    })
  }

  function recordQuietSuppressedFeedback(eventType: 'victory' | 'thumbs_up', nowMs: number, options?: TriggerVisionPetFeedbackOptions) {
    commitFeedbackRecord({
      eventType,
      state: 'quiet',
      at: nowMs,
      sourceEventId: options?.sourceEventId,
      suppressedByQuiet: true,
      summary: eventType === 'victory'
        ? 'Quiet visual mode active, celebration motion suppressed.'
        : 'Quiet visual mode active, acknowledgement motion suppressed.',
    })
    petFeedbackState.value = 'quiet'
  }

  function triggerVisionPetFeedback(eventType: VisionPetFeedbackEventType, options?: TriggerVisionPetFeedbackOptions) {
    const nowMs = Date.now()
    if (eventType === 'gated') {
      lastTriggeredAt.value.gated = nowMs
      recordGatedFeedback(nowMs, options)
      return false
    }

    if (!shouldAllowVisualFeedback(options)) {
      lastTriggeredAt.value.gated = nowMs
      recordGatedFeedback(nowMs, options)
      return false
    }

    if (isInCooldown(eventType, nowMs, options?.force))
      return false

    lastTriggeredAt.value[eventType] = nowMs

    if (isQuietVisualMode.value && (eventType === 'victory' || eventType === 'thumbs_up')) {
      recordQuietSuppressedFeedback(eventType, nowMs, options)
      return true
    }

    if (eventType === 'open_palm') {
      const motion = triggerMotionWithFallback([
        'Idle',
        'FlickDown',
        EmotionNeutralMotionName,
        EmotionThinkMotionName,
        'Neutral',
        'idle',
      ])
      const expression = triggerExpressionWithFallback([
        'neutral',
        'normal',
        'idle',
      ], 1_800)
      activateQuietVisualMode(nowMs)
      commitFeedbackRecord({
        eventType,
        state: 'quiet',
        at: nowMs,
        sourceEventId: options?.sourceEventId,
        motion,
        expression,
        summary: options?.summary ?? 'Quiet visual mode activated.',
      })
      return true
    }

    if (eventType === 'victory') {
      const motion = triggerMotionWithFallback([
        'Tap@Body',
        'Tap',
        'Flick@Body',
        'Flick',
        EmotionHappyMotionName,
        EmotionNeutralMotionName,
      ])
      const expression = triggerExpressionWithFallback([
        'happy',
        'smile',
      ], runtimeOptions.celebrationVisualMs)
      celebrationCount.value += 1
      setTransientState('celebrating', runtimeOptions.celebrationVisualMs)
      commitFeedbackRecord({
        eventType,
        state: 'celebrating',
        at: nowMs,
        sourceEventId: options?.sourceEventId,
        motion,
        expression,
        summary: options?.summary ?? 'Rin celebrates your completed moment.',
      })
      return true
    }

    if (eventType === 'thumbs_up') {
      const motion = triggerMotionWithFallback([
        'Tap',
        'Flick',
        'Tap@Body',
        EmotionHappyMotionName,
        EmotionThinkMotionName,
        EmotionNeutralMotionName,
      ])
      const expression = triggerExpressionWithFallback([
        'smile',
        'normal',
        'happy',
      ], runtimeOptions.acknowledgedVisualMs)
      setTransientState('acknowledged', runtimeOptions.acknowledgedVisualMs)
      commitFeedbackRecord({
        eventType,
        state: 'acknowledged',
        at: nowMs,
        sourceEventId: options?.sourceEventId,
        motion,
        expression,
        summary: options?.summary ?? 'Rin acknowledged your prompt.',
      })
      return true
    }

    if (eventType === 'face_return') {
      const motion = triggerMotionWithFallback([
        EmotionThinkMotionName,
        EmotionNeutralMotionName,
      ])
      commitFeedbackRecord({
        eventType,
        state: isQuietVisualMode.value ? 'quiet' : 'idle',
        at: nowMs,
        sourceEventId: options?.sourceEventId,
        motion,
        summary: options?.summary ?? 'Subject returned to frame.',
      })
      return true
    }

    commitFeedbackRecord({
      eventType,
      state: isQuietVisualMode.value ? 'quiet' : 'idle',
      at: nowMs,
      sourceEventId: options?.sourceEventId,
      faceDirection: options?.faceDirection,
      summary: options?.summary ?? `Face direction changed: ${options?.faceDirection ?? 'unknown'}.`,
    })
    return true
  }

  function clearPetFeedback() {
    clearStateResetTimer()
    stopQuietTicker()
    quietVisualUntil.value = 0
    quietRemainingMs.value = 0
    petFeedbackState.value = 'idle'
    subjectResponseState.value = 'idle'
    subjectResponseCooldownUntil.value = 0
    lastSubjectStableDirection.value = 'unknown'
    lastPetFeedback.value = null
    lastSubjectResponseEvent.value = null
    lastFeedbackType.value = null
    lastFeedbackMessage.value = ''
    lastFeedbackLevel.value = 'subtle'
    lastFeedbackPriority.value = 'low'
    lastFeedbackAt.value = null
    nextAllowedFeedbackAt.value = 0
    feedbackSuppressedByQuiet.value = false
    feedbackBlockedByGate.value = false
    lastDirectionalToastAt.value = Number.NEGATIVE_INFINITY
    highPriorityToastUntil.value = Number.NEGATIVE_INFINITY
    celebrationCount.value = 0
  }

  onBeforeUnmount(() => {
    clearStateResetTimer()
    stopQuietTicker()
  })

  return {
    triggerVisionPetFeedback,
    triggerSubjectPositionFeedback,
    triggerContextualVisionFeedback,
    feedbackIntensity,
    setFeedbackIntensity,
    lastFeedbackType,
    lastFeedbackMessage,
    lastFeedbackLevel,
    lastFeedbackPriority,
    lastFeedbackAt,
    nextAllowedFeedbackAt,
    nextAllowedFeedbackIn,
    feedbackSuppressedByQuiet,
    feedbackBlockedByGate,
    petFeedbackState,
    lastPetFeedback,
    subjectResponseState,
    lastSubjectResponseEvent,
    subjectResponseCooldownUntil,
    isQuietVisualMode,
    quietVisualUntil,
    quietRemainingMs,
    celebrationCount,
    cancelQuietVisualMode,
    clearPetFeedback,
  }
}
