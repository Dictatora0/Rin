import { describe, expect, it } from 'vitest'

import {
  listVisionFeedbackTemplatesForEvent,
  listVisionFeedbackTemplateTypes,
  resolveVisionFeedbackTransition,
  selectVisionFeedbackMessage,
} from './vision-feedback-messages'

describe('vision feedback templates v2', () => {
  it('covers base and transition event types with non-empty template pools', () => {
    const eventTypes = listVisionFeedbackTemplateTypes()

    expect(eventTypes).toContain('subject_position_left')
    expect(eventTypes).toContain('subject_position_right')
    expect(eventTypes).toContain('subject_position_up')
    expect(eventTypes).toContain('subject_position_down')
    expect(eventTypes).toContain('subject_position_center')
    expect(eventTypes).toContain('subject_returned')
    expect(eventTypes).toContain('subject_absent')
    expect(eventTypes).toContain('subject_gated')
    expect(eventTypes).toContain('subject_matched')
    expect(eventTypes).toContain('subject_uncertain')
    expect(eventTypes).toContain('expression_smile_like')
    expect(eventTypes).toContain('expression_stable_face')
    expect(eventTypes).toContain('expression_looking_away')
    expect(eventTypes).toContain('expression_unclear')
    expect(eventTypes).toContain('subject_dwelled_left')
    expect(eventTypes).toContain('subject_dwelled_right')
    expect(eventTypes).toContain('subject_dwelled_center')
    expect(eventTypes).toContain('transition_absent_to_returned')
    expect(eventTypes).toContain('transition_uncertain_to_matched')
    expect(eventTypes).toContain('transition_gated_to_matched')
    expect(eventTypes).toContain('transition_multiple_faces_to_matched')
    expect(eventTypes).toContain('transition_matched_to_absent')
    expect(eventTypes).toContain('transition_matched_to_uncertain')

    for (const eventType of eventTypes) {
      const templates = listVisionFeedbackTemplatesForEvent(eventType)
      expect(templates.length).toBeGreaterThan(0)
      for (const template of templates) {
        expect(template.id.length).toBeGreaterThan(0)
        expect(template.text.trim().length).toBeGreaterThan(0)
        expect(template.intensities.length).toBeGreaterThan(0)
        expect(template.channels.length).toBeGreaterThan(0)
        if (template.localeText?.['zh-CN']) {
          expect(template.localeText['zh-CN']?.text?.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('selects templates by intensity and level with strict downgrading', () => {
    const minimal = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'minimal',
      random: () => 0,
    })
    const balanced = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'balanced',
      random: () => 0,
    })
    const expressiveStrong = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'expressive',
      preferredLevel: 'strong',
      random: () => 0,
    })
    const balancedDowngraded = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'balanced',
      preferredLevel: 'strong',
      random: () => 0,
    })

    expect(minimal.level).toBe('subtle')
    expect(balanced.level).toBe('normal')
    expect(expressiveStrong.level).toBe('strong')
    expect(balancedDowngraded.level).toBe('normal')
  })

  it('selects expression templates with intensity-aware levels and channels', () => {
    const minimalSmile = selectVisionFeedbackMessage('expression_smile_like', {
      intensity: 'minimal',
      random: () => 0,
    })
    const balancedSmile = selectVisionFeedbackMessage('expression_smile_like', {
      intensity: 'balanced',
      random: () => 0,
    })
    const expressiveSmile = selectVisionFeedbackMessage('expression_smile_like', {
      intensity: 'expressive',
      preferredLevel: 'strong',
      random: () => 0,
    })
    const balancedUnclear = selectVisionFeedbackMessage('expression_unclear', {
      intensity: 'balanced',
      random: () => 0,
    })

    expect(minimalSmile.level).toBe('subtle')
    expect(minimalSmile.channels).toEqual(['ui'])
    expect(balancedSmile.level).toBe('normal')
    expect(balancedSmile.channels).toContain('toast')
    expect(expressiveSmile.level).toBe('strong')
    expect(expressiveSmile.channels).toContain('motion')
    expect(balancedUnclear.level).toBe('subtle')
  })

  it('filters by allowedChannels and falls back safely when no candidate matches', () => {
    const toastFiltered = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'balanced',
      allowedChannels: ['toast'],
      random: () => 0,
    })
    const motionFiltered = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'expressive',
      allowedChannels: ['motion'],
      preferredLevel: 'strong',
      random: () => 0,
    })
    const noCandidateFallback = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'minimal',
      allowedChannels: ['motion'],
      random: () => 0,
    })
    const bubbleDisallowedByFilter = selectVisionFeedbackMessage('subject_matched', {
      intensity: 'expressive',
      preferredLevel: 'strong',
      allowedChannels: ['toast'],
      random: () => 0,
    })
    const bubbleDisallowedByOption = selectVisionFeedbackMessage('subject_matched', {
      intensity: 'expressive',
      preferredLevel: 'strong',
      bubbleAllowed: false,
      random: () => 0,
    })

    expect(toastFiltered.channels).toContain('toast')
    expect(motionFiltered.channels).toContain('motion')
    expect(noCandidateFallback.templateId).toBe('fallback-safe')
    expect(noCandidateFallback.channels).toEqual(['ui'])
    expect(bubbleDisallowedByFilter.shouldShowBubble).toBe(false)
    expect(bubbleDisallowedByOption.shouldShowBubble).toBe(false)
  })

  it('de-duplicates by templateId for the same event and allows repeat when only fallback exists', () => {
    const first = selectVisionFeedbackMessage('subject_position_right', {
      intensity: 'balanced',
      random: () => 0,
    })
    const second = selectVisionFeedbackMessage('subject_position_right', {
      intensity: 'balanced',
      previousTemplateId: first.templateId,
      previousText: first.text,
      random: () => 0,
    })

    expect(first.templateId).not.toBe(second.templateId)

    const fallbackFirst = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'minimal',
      allowedChannels: ['motion'],
      random: () => 0,
    })
    const fallbackSecond = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'minimal',
      allowedChannels: ['motion'],
      previousTemplateId: fallbackFirst.templateId,
      previousText: fallbackFirst.text,
      random: () => 0,
    })

    expect(fallbackFirst.templateId).toBe('fallback-safe')
    expect(fallbackSecond.templateId).toBe('fallback-safe')
    expect(fallbackFirst.text).toBe(fallbackSecond.text)
  })

  it('supports displayName interpolation and safely falls back without unresolved placeholders', () => {
    const withName = selectVisionFeedbackMessage('subject_returned', {
      intensity: 'balanced',
      displayName: 'Rin',
      random: () => 0,
    })
    const withoutName = selectVisionFeedbackMessage('subject_returned', {
      intensity: 'balanced',
      random: () => 0,
    })
    const blankName = selectVisionFeedbackMessage('subject_returned', {
      intensity: 'balanced',
      displayName: '   ',
      random: () => 0,
    })

    expect(withName.text.includes('Rin')).toBe(true)
    expect(withoutName.text.includes('{name}')).toBe(false)
    expect(blankName.text.includes('{name}')).toBe(false)
  })

  it('supports locale text overrides and falls back to default source when locale is missing', () => {
    const zhCentered = selectVisionFeedbackMessage('subject_position_center', {
      intensity: 'balanced',
      locale: 'zh-CN',
      variant: 'a',
      displayName: 'Rin',
      random: () => 0,
    })
    const zhFallbackUp = selectVisionFeedbackMessage('subject_position_up', {
      intensity: 'balanced',
      locale: 'zh-CN',
      displayName: 'Rin',
      random: () => 0,
    })

    expect(zhCentered.templateId).toBe('center-bal-2')
    expect(zhCentered.text).toBe('Rin，你又回到中心位置。')
    expect(zhCentered.selectedTextSource).toBe('locale')
    expect(zhCentered.locale).toBe('zh-CN')
    expect(zhFallbackUp.text).toBe('Rin, looking up?')
    expect(zhFallbackUp.selectedTextSource).toBe('default')
    expect(zhFallbackUp.text.includes('{name}')).toBe(false)
  })

  it('prefers requested variant and falls back to default variant when requested one is unavailable', () => {
    const variantA = selectVisionFeedbackMessage('subject_position_center', {
      intensity: 'balanced',
      variant: 'a',
      random: () => 0,
    })
    const variantB = selectVisionFeedbackMessage('subject_position_center', {
      intensity: 'balanced',
      variant: 'b',
      random: () => 0,
    })
    const fallbackVariant = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'balanced',
      variant: 'b',
      random: () => 0,
    })

    expect(variantA.templateId).toBe('center-bal-2')
    expect(variantA.variant).toBe('a')
    expect(variantB.templateId).toBe('center-bal-1')
    expect(variantB.variant).toBe('default')
    const uncertainVariantB = selectVisionFeedbackMessage('subject_uncertain', {
      intensity: 'balanced',
      variant: 'b',
      random: () => 0,
    })
    expect(uncertainVariantB.templateId).toBe('uncertain-bal-4')
    expect(uncertainVariantB.variant).toBe('b')
    expect(fallbackVariant.variant).toBe('default')
  })

  it('returns bubble visibility metadata from channel selection', () => {
    const bubbleEnabled = selectVisionFeedbackMessage('subject_matched', {
      intensity: 'expressive',
      preferredLevel: 'strong',
      random: () => 0,
    })
    const uiOnly = selectVisionFeedbackMessage('subject_position_left', {
      intensity: 'minimal',
      random: () => 0,
    })

    expect(bubbleEnabled.channels).toEqual(['ui', 'toast', 'motion', 'bubble'])
    expect(bubbleEnabled.shouldShowBubble).toBe(true)
    expect(uiOnly.channels).toEqual(['ui'])
    expect(uiOnly.shouldShowBubble).toBe(false)
  })

  it('stays deterministic with injected random and handles unknown event type via fallback', () => {
    const deterministicA = selectVisionFeedbackMessage('subject_position_center', {
      intensity: 'balanced',
      random: () => 0.42,
    })
    const deterministicB = selectVisionFeedbackMessage('subject_position_center', {
      intensity: 'balanced',
      random: () => 0.42,
    })
    const unknown = selectVisionFeedbackMessage('unknown_event_type', {
      random: () => 0,
    })

    expect(deterministicA.templateId).toBe(deterministicB.templateId)
    expect(deterministicA.text).toBe(deterministicB.text)
    expect(unknown.eventType).toBe('subject_uncertain')
    expect(unknown.text.length).toBeGreaterThan(0)
  })

  it('resolves transition events with priority and falls back to base event when unmatched', () => {
    const absentToReturned = resolveVisionFeedbackTransition(
      { presence: 'absent', profileStatus: 'matched' },
      { presence: 'present', profileStatus: 'matched' },
      'subject_returned',
    )
    const uncertainToMatched = resolveVisionFeedbackTransition(
      { profileStatus: 'uncertain', presence: 'present' },
      { profileStatus: 'matched', presence: 'present' },
      'subject_matched',
    )
    const gatedToMatched = resolveVisionFeedbackTransition(
      { gateState: 'locked', profileStatus: 'unmatched', presence: 'present' },
      { gateState: 'enabled', profileStatus: 'matched', presence: 'present' },
      'subject_matched',
    )
    const multipleToMatched = resolveVisionFeedbackTransition(
      { profileStatus: 'multiple_faces', presence: 'present' },
      { profileStatus: 'matched', presence: 'present' },
      'subject_matched',
    )
    const matchedToAbsent = resolveVisionFeedbackTransition(
      { profileStatus: 'matched', presence: 'present' },
      { profileStatus: 'matched', presence: 'absent' },
      'subject_absent',
    )
    const matchedToUncertain = resolveVisionFeedbackTransition(
      { profileStatus: 'matched', presence: 'present' },
      { profileStatus: 'uncertain', presence: 'present' },
      'subject_uncertain',
    )
    const noTransitionFallback = resolveVisionFeedbackTransition(
      { profileStatus: 'matched', presence: 'present' },
      { profileStatus: 'matched', presence: 'present' },
      'subject_position_center',
    )

    expect(absentToReturned).toBe('transition_absent_to_returned')
    expect(uncertainToMatched).toBe('transition_uncertain_to_matched')
    expect(gatedToMatched).toBe('transition_gated_to_matched')
    expect(multipleToMatched).toBe('transition_multiple_faces_to_matched')
    expect(matchedToAbsent).toBe('transition_matched_to_absent')
    expect(matchedToUncertain).toBe('transition_matched_to_uncertain')
    expect(noTransitionFallback).toBe('subject_position_center')
  })

  it('keeps expression templates free from emotion/mood/fatigue/attention diagnosis language', () => {
    const blockedPatterns = [
      /emotion recognition/i,
      /mood/i,
      /fatigue/i,
      /attention diagnosis/i,
      /anxious/i,
      /angry/i,
      /tired/i,
      /focused/i,
      /distracted/i,
    ]
    const expressionEventTypes = [
      'expression_smile_like',
      'expression_stable_face',
      'expression_looking_away',
      'expression_unclear',
    ] as const

    for (const eventType of expressionEventTypes) {
      const templates = listVisionFeedbackTemplatesForEvent(eventType)
      for (const template of templates) {
        const entries = [template.text, template.namedText ?? '']
        for (const entry of entries) {
          for (const pattern of blockedPatterns)
            expect(pattern.test(entry)).toBe(false)
        }
      }
    }
  })
})
