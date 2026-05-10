import type { StudyCompanionMode, StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { Emotion, EMOTION_EmotionMotionName_value, EmotionNeutralMotionName } from '@proj-airi/stage-ui-live2d/constants/emotions'
import { useLive2d } from '@proj-airi/stage-ui/stores/live2d'
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

/**
 * Maps Study Companion state to the closest AIRI emotion.
 *
 * Before:
 * - "focus"
 * - "task_completed"
 *
 * After:
 * - "think"
 * - "happy"
 */
export function resolveStudyFeedbackEmotion(input: StudyCompanionMode | StudyEventLogEntry['type'], muted: boolean): Emotion {
  // Muted study mode should keep Rin calm even when completion events arrive.
  // This lets member 5's low-interruption policy remain the stronger signal.
  if (muted)
    return Emotion.Neutral

  // Long-lived Pomodoro states become ambient posture/emotion cues.
  if (input === 'focus')
    return Emotion.Think
  if (input === 'break')
    return Emotion.Curious
  if (input === 'paused')
    return Emotion.Question

  // Momentary events use brighter feedback so users can notice task progress
  // without requiring a toast or modal interruption.
  if (input === 'focus_completed' || input === 'break_completed' || input === 'task_completed')
    return Emotion.Happy
  if (input === 'task_overload')
    return Emotion.Awkward

  return Emotion.Neutral
}

function isMomentaryFeedbackEvent(type: StudyEventLogEntry['type']): boolean {
  // Only positive/attention events should override the ambient mode watcher.
  // Lifecycle events like focus_started are already represented by `mode`.
  return type === 'focus_completed'
    || type === 'break_completed'
    || type === 'task_completed'
    || type === 'task_overload'
}

/**
 * Drives Live2D peripheral feedback from the Study Companion store.
 *
 * Use when:
 * - The desktop stage should visibly reflect study mode changes.
 * - Study completion or task events should produce brief character feedback.
 *
 * Expects:
 * - {@link useStudyCompanionStore} is the only source of learning state.
 * - Live2D motions may be absent on some models, so motion names need fallback.
 *
 * Returns:
 * - A stop handle that disposes the internal watchers.
 */
export function useStudyStageFeedback() {
  const studyStore = useStudyCompanionStore()
  const { currentMotion, availableMotions } = storeToRefs(useLive2d())

  function resolveMotionGroup(emotion: Emotion): string {
    const preferred = EMOTION_EmotionMotionName_value[emotion] ?? EmotionNeutralMotionName
    const availableGroups = new Set(availableMotions.value.map(motion => motion.motionName))

    // NOTICE:
    // Live2D models are user-provided and do not always include AIRI's named emotion motions.
    // The current Live2D model component catches failed motion calls, but choosing a known
    // group here keeps study feedback stable instead of repeatedly requesting missing motions.
    // Source/context: packages/stage-ui-live2d/src/components/scenes/live2d/Model.vue setMotion().
    // Removal condition: remove this fallback once model-level emotion mapping is configurable.
    if (availableGroups.size === 0 || availableGroups.has(preferred))
      return preferred
    if (availableGroups.has(EmotionNeutralMotionName))
      return EmotionNeutralMotionName

    return availableMotions.value[0]?.motionName ?? EmotionNeutralMotionName
  }

  function applyEmotion(emotion: Emotion) {
    // Live2D Model.vue observes `currentMotion` and performs the actual model call.
    // Keeping this composable at the store layer avoids coupling study feedback to Pixi.
    currentMotion.value = { group: resolveMotionGroup(emotion) }
  }

  const stopModeWatch = watch(
    () => [studyStore.persisted.mode, studyStore.persisted.mutedUntil] as const,
    ([mode]) => applyEmotion(resolveStudyFeedbackEmotion(mode, studyStore.isMuted)),
    { immediate: true },
  )

  const stopEventWatch = watch(
    () => studyStore.persisted.studyEvents.at(-1)?.type,
    (type) => {
      if (!type || !isMomentaryFeedbackEvent(type))
        return

      // Completion/task events are short feedback pulses layered on top of the
      // current mode. The next mode/mute change will restore ambient feedback.
      applyEmotion(resolveStudyFeedbackEmotion(type, studyStore.isMuted))
    },
  )

  return () => {
    stopModeWatch()
    stopEventWatch()
  }
}
