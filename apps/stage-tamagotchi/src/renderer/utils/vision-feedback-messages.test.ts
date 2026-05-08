import { describe, expect, it } from 'vitest'

import {
  listVisionFeedbackTemplateTypes,
  pickVisionFeedbackMessage,
} from './vision-feedback-messages'

describe('vision feedback message templates', () => {
  it('covers required template event types', () => {
    const templateTypes = listVisionFeedbackTemplateTypes()
    expect(templateTypes).toContain('subject_position_left')
    expect(templateTypes).toContain('subject_position_right')
    expect(templateTypes).toContain('subject_position_up')
    expect(templateTypes).toContain('subject_position_down')
    expect(templateTypes).toContain('subject_position_center')
    expect(templateTypes).toContain('subject_returned')
    expect(templateTypes).toContain('subject_absent')
    expect(templateTypes).toContain('subject_gated')
    expect(templateTypes).toContain('subject_matched')
    expect(templateTypes).toContain('subject_uncertain')
  })

  it('does not pick the exact same message twice for the same event when alternatives exist', () => {
    const first = pickVisionFeedbackMessage('subject_position_left', {
      random: () => 0,
    })
    const second = pickVisionFeedbackMessage('subject_position_left', {
      previousMessage: first,
      random: () => 0,
    })

    expect(first).not.toBe(second)
    expect(first).toBe('I noticed you moved left.')
    expect(second).toBe('You shifted to the left.')
  })

  it('uses displayName variants when provided and falls back safely when omitted', () => {
    const withName = pickVisionFeedbackMessage('subject_returned', {
      displayName: 'Rin',
      random: () => 0,
    })
    const withoutName = pickVisionFeedbackMessage('subject_returned', {
      random: () => 0,
    })

    expect(withName).toBe('Welcome back, Rin.')
    expect(withoutName).toBe('Welcome back.')
  })

  it('remains deterministic with injected random provider', () => {
    const pickA = pickVisionFeedbackMessage('subject_position_center', {
      random: () => 0.74,
    })
    const pickB = pickVisionFeedbackMessage('subject_position_center', {
      random: () => 0.74,
    })
    const pickC = pickVisionFeedbackMessage('subject_position_center', {
      random: () => 0.1,
    })

    expect(pickA).toBe('Center position confirmed.')
    expect(pickB).toBe('Center position confirmed.')
    expect(pickC).toBe('Back to center.')
  })
})
