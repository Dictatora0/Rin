import type { StudyCompanionMode } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, onScopeDispose, ref, watch } from 'vue'

/**
 * Reminder type produced by the policy when a key transition occurs.
 *
 * Use when:
 * - Displaying a toast notification in the Study Island panel
 *
 * Expects:
 * - The consumer reads `currentReminder` and renders the message
 * - The consumer calls `dismissReminder()` to clear the toast
 */
export interface StudyReminder {
  id: number
  message: string
  type: 'focus_completed' | 'break_completed' | 'task_completed'
  timestamp: number
}

/** Minimum gap between two consecutive reminders in milliseconds. */
const THROTTLE_INTERVAL_MS = 30 * 1000

/** How long a toast stays visible before auto-dismiss in milliseconds. */
const AUTO_DISMISS_MS = 4000

/**
 * Low-interruption reminder policy for the study companion.
 *
 * Use when:
 * - The Study Island UI needs to show non-intrusive toasts at key moments
 * - The system must respect mute state, focus-period suppression, and throttling
 *
 * Expects:
 * - `study-companion` store is initialized
 * - Consumer renders `currentReminder` and handles `dismissReminder`
 *
 * Returns:
 * - `currentReminder`: the active reminder to display, or null
 * - `dismissReminder()`: manually dismiss the current reminder
 * - `todayReminderCount`: how many reminders were shown today
 */
export function useStudyReminderPolicy() {
  const store = useStudyCompanionStore()
  const { isMuted, persisted } = storeToRefs(store)

  const currentReminder = ref<StudyReminder | null>(null)
  let lastReminderAt = 0
  let nextId = 1
  let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

  const todayReminderCount = computed(() => persisted.value.todayReminderCount)

  function clearAutoDismissTimer() {
    if (autoDismissTimer !== null) {
      clearTimeout(autoDismissTimer)
      autoDismissTimer = null
    }
  }

  function dismissReminder() {
    currentReminder.value = null
    clearAutoDismissTimer()
  }

  /**
   * Decide whether a reminder should fire and, if so, show it.
   *
   * Suppression rules (checked in order):
   * 1. User has muted reminders → skip
   * 2. Throttle window has not elapsed since last reminder → skip
   * 3. All checks pass → show reminder, bump counter, start auto-dismiss
   */
  function tryShowReminder(message: string, type: StudyReminder['type']) {
    if (isMuted.value)
      return

    const now = Date.now()
    if (now - lastReminderAt < THROTTLE_INTERVAL_MS)
      return

    lastReminderAt = now
    persisted.value.todayReminderCount += 1
    store.appendEvent('reminder_shown', { message, type })

    clearAutoDismissTimer()

    currentReminder.value = {
      id: nextId++,
      message,
      type,
      timestamp: now,
    }

    autoDismissTimer = setTimeout(() => {
      dismissReminder()
    }, AUTO_DISMISS_MS)
  }

  // Watch mode transitions to trigger reminders at key moments
  watch(
    () => persisted.value.mode,
    (newMode: StudyCompanionMode, oldMode: StudyCompanionMode | undefined) => {
      if (oldMode === undefined)
        return

      if (oldMode === 'focus' && newMode === 'break') {
        tryShowReminder('Focus complete! Time for a break.', 'focus_completed')
      }

      if (oldMode === 'break' && newMode === 'idle') {
        tryShowReminder('Break is over. Ready to focus?', 'break_completed')
      }
    },
  )

  watch(
    () => persisted.value.studyEvents.at(-1)?.id,
    () => {
      const latestEvent = persisted.value.studyEvents.at(-1)
      if (!latestEvent || latestEvent.type !== 'task_completed')
        return

      tryShowReminder('Task completed. Keep it up!', 'task_completed')
    },
  )

  onScopeDispose(() => {
    clearAutoDismissTimer()
  })

  return {
    currentReminder,
    dismissReminder,
    todayReminderCount,
  }
}
