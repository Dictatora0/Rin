/**
 * Local break suggestions shown when a break segment starts.
 */
export const STUDY_BREAK_SUGGESTIONS = [
  '喝一口水',
  '站起来伸展一下',
  '看远处 20 秒',
  '放松肩颈',
  '深呼吸几次',
  '活动一下手腕',
] as const

export type StudyBreakSuggestion = (typeof STUDY_BREAK_SUGGESTIONS)[number]

/**
 * Creates a stable picker that avoids repeating the same suggestion immediately.
 *
 * Use when:
 * - Study Island enters break mode and needs one lightweight suggestion.
 *
 * Expects:
 * - `random` returns a value in `[0, 1)`.
 *
 * Returns:
 * - A function that picks one suggestion per invocation.
 */
export function createStudyBreakSuggestionPicker(random: () => number = Math.random) {
  let previousSuggestion: StudyBreakSuggestion | null = null

  return (): StudyBreakSuggestion => {
    const candidatePool = previousSuggestion
      ? STUDY_BREAK_SUGGESTIONS.filter(suggestion => suggestion !== previousSuggestion)
      : STUDY_BREAK_SUGGESTIONS

    const availablePool = candidatePool.length > 0 ? candidatePool : STUDY_BREAK_SUGGESTIONS
    const randomIndex = Math.floor(random() * availablePool.length)
    const selectedSuggestion = availablePool[randomIndex] ?? availablePool[0]
    previousSuggestion = selectedSuggestion
    return selectedSuggestion
  }
}
