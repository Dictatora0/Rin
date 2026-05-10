import type { StudyCompanionPersisted } from '@proj-airi/stage-ui/stores/modules/study-companion'

import type {
  BubbleKind,
  StudyBubblePayload,
} from './study-companion-bubble-copy-resolver'

import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, onScopeDispose, ref, watch } from 'vue'

import {
  createStudyBubbleCopyHistory,
  createTaskOverloadBubblePayload,
  resolveStudyBubbleText,
} from './study-companion-bubble-copy-resolver'
import { useStudyReminderPolicy } from './use-study-reminder-policy'

export type { BubbleKind, StudyBubbleCopyHistory, StudyBubblePayload } from './study-companion-bubble-copy-resolver'
export {
  createStudyBubbleCopyHistory,
  createTaskOverloadBubblePayload,
  resolveStudyBubbleText,
  STUDY_BUBBLE_COPY_BY_EVENT,
} from './study-companion-bubble-copy-resolver'

export interface StudyBubbleMessage {
  id: string
  text: string
  kind: BubbleKind
  createdAt: number
  durationMs: number
}

interface ShowBubbleOptions {
  kind?: BubbleKind
  durationMs?: number
  throttleKey?: string
  critical?: boolean
  throttleMs?: number
}

export interface StudyBubblePolicyHistory {
  lastShownAtByKey: Map<string, number>
  lastShownAtByCopy: Map<string, number>
}

export interface StudyBubblePolicyContext {
  mode: StudyCompanionPersisted['mode']
  isMuted: boolean
  now: number
}

const DEFAULT_DURATION_MS = 4500
const DEFAULT_THROTTLE_MS = 30 * 1000
const SAME_COPY_COOLDOWN_MS = 30 * 1000

export function createStudyBubblePolicyHistory(): StudyBubblePolicyHistory {
  return {
    lastShownAtByKey: new Map<string, number>(),
    lastShownAtByCopy: new Map<string, number>(),
  }
}

export function shouldShowStudyBubble(
  payload: StudyBubblePayload,
  context: StudyBubblePolicyContext,
  history: StudyBubblePolicyHistory,
): boolean {
  if (context.isMuted && !payload.critical && payload.throttleKey !== 'muted')
    return false

  if (context.mode === 'focus' && !payload.critical && payload.throttleKey !== 'focus_started')
    return false

  const throttleMs = payload.throttleMs ?? DEFAULT_THROTTLE_MS
  const lastShownAt = history.lastShownAtByKey.get(payload.throttleKey)
  if (lastShownAt != null && context.now - lastShownAt < throttleMs)
    return false

  const lastCopyShownAt = history.lastShownAtByCopy.get(payload.text)
  if (lastCopyShownAt != null && context.now - lastCopyShownAt < SAME_COPY_COOLDOWN_MS)
    return false

  history.lastShownAtByKey.set(payload.throttleKey, context.now)
  history.lastShownAtByCopy.set(payload.text, context.now)
  return true
}

export function useStudyCompanionBubble() {
  const studyStore = useStudyCompanionStore()
  const { persisted, isMuted } = storeToRefs(studyStore)

  // Keep existing reminder policy counters/logging alive while bubble becomes main presentation.
  useStudyReminderPolicy()

  const currentBubble = ref<StudyBubbleMessage | null>(null)
  const lastHandledEventId = ref<string | null>(null)
  const copyHistory = createStudyBubbleCopyHistory()
  const policyHistory = createStudyBubblePolicyHistory()
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const taskPending = computed(() => persisted.value.tasks.filter(task => !task.done).length)

  function clearHideTimer() {
    if (hideTimer != null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function hideBubble() {
    currentBubble.value = null
    clearHideTimer()
  }

  function showPayloadBubble(payload: StudyBubblePayload, durationMs = DEFAULT_DURATION_MS) {
    const now = Date.now()
    const allowed = shouldShowStudyBubble(payload, {
      mode: persisted.value.mode,
      isMuted: isMuted.value,
      now,
    }, policyHistory)

    if (!allowed)
      return

    currentBubble.value = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      text: payload.text,
      kind: payload.kind,
      createdAt: now,
      durationMs,
    }

    clearHideTimer()
    hideTimer = setTimeout(() => {
      hideBubble()
    }, durationMs)
  }

  function showBubble(text: string, options: ShowBubbleOptions = {}) {
    const payload: StudyBubblePayload = {
      text,
      kind: options.kind ?? 'reminder',
      throttleKey: options.throttleKey ?? text,
      critical: options.critical ?? false,
      throttleMs: options.throttleMs,
    }
    showPayloadBubble(payload, options.durationMs ?? DEFAULT_DURATION_MS)
  }

  watch(
    () => persisted.value.studyEvents.at(-1)?.id,
    (latestEventId) => {
      if (!latestEventId)
        return

      const latestEvent = persisted.value.studyEvents.at(-1)
      if (!latestEvent)
        return

      if (lastHandledEventId.value == null) {
        lastHandledEventId.value = latestEvent.id
        return
      }

      if (latestEvent.id === lastHandledEventId.value)
        return

      lastHandledEventId.value = latestEvent.id

      const payload = resolveStudyBubbleText(latestEvent, persisted.value, copyHistory)
      if (!payload)
        return

      showPayloadBubble(payload)
    },
    { flush: 'post' },
  )

  watch(
    taskPending,
    (pending, previousPending) => {
      if (pending < 5)
        return

      const crossedThreshold = (previousPending ?? 0) < 5
      if (!crossedThreshold && persisted.value.mode === 'focus')
        return

      showPayloadBubble(createTaskOverloadBubblePayload(copyHistory))
    },
  )

  onScopeDispose(() => {
    clearHideTimer()
  })

  return {
    currentBubble,
    showBubble,
    hideBubble,
  }
}
