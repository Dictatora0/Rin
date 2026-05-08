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
import { computed, onBeforeUnmount, ref } from 'vue'

type VisionPetFeedbackEventType
  = | 'open_palm'
    | 'victory'
    | 'thumbs_up'
    | 'face_return'
    | 'face_direction_change'
    | 'gated'

type VisionPetFeedbackState = 'idle' | 'quiet' | 'celebrating' | 'acknowledged' | 'gated'

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

interface TriggerVisionPetFeedbackOptions {
  allowVisualFeedback?: boolean
  gateEnabled?: boolean
  gateState?: LocalFaceGateState
  sourceEventId?: number
  faceDirection?: VisionFaceDirection
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
}

const DEFAULT_OPTIONS: Required<UseVisionPetFeedbackOptions> = {
  quietDurationMs: 30_000,
  celebrationVisualMs: 3_000,
  acknowledgedVisualMs: 2_000,
  gatedVisualMs: 2_000,
  feedbackCooldownMs: 2_000,
  victoryCooldownMs: 3_000,
  live2dMotionCooldownMs: 1_100,
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
  const quietVisualUntil = ref(0)
  const quietRemainingMs = ref(0)
  const celebrationCount = ref(0)
  const isQuietVisualMode = computed(() => quietRemainingMs.value > 0)

  const lastTriggeredAt = ref<Record<VisionPetFeedbackEventType, number>>({
    open_palm: Number.NEGATIVE_INFINITY,
    victory: Number.NEGATIVE_INFINITY,
    thumbs_up: Number.NEGATIVE_INFINITY,
    face_return: Number.NEGATIVE_INFINITY,
    face_direction_change: Number.NEGATIVE_INFINITY,
    gated: Number.NEGATIVE_INFINITY,
  })
  const lastMotionTriggeredAt = ref(Number.NEGATIVE_INFINITY)
  let stateResetTimer: ReturnType<typeof setTimeout> | null = null
  let quietTickerId: ReturnType<typeof setInterval> | null = null

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

  function shouldAllowVisualFeedback(options?: TriggerVisionPetFeedbackOptions) {
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
    lastPetFeedback.value = null
    celebrationCount.value = 0
  }

  onBeforeUnmount(() => {
    clearStateResetTimer()
    stopQuietTicker()
  })

  return {
    triggerVisionPetFeedback,
    petFeedbackState,
    lastPetFeedback,
    isQuietVisualMode,
    quietVisualUntil,
    quietRemainingMs,
    celebrationCount,
    cancelQuietVisualMode,
    clearPetFeedback,
  }
}
