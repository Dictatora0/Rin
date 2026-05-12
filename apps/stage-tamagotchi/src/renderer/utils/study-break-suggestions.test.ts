import { describe, expect, it } from 'vitest'

import {
  createStudyBreakSuggestionPicker,
  STUDY_BREAK_SUGGESTIONS,
} from './study-break-suggestions'

describe('study break suggestions', () => {
  it('picks one suggestion from the local pool', () => {
    const picker = createStudyBreakSuggestionPicker(() => 0)
    const suggestion = picker()
    expect(STUDY_BREAK_SUGGESTIONS.includes(suggestion)).toBe(true)
  })

  it('avoids returning the same suggestion immediately when pool size > 1', () => {
    const picker = createStudyBreakSuggestionPicker(() => 0)
    const first = picker()
    const second = picker()
    expect(second).not.toBe(first)
  })
})
