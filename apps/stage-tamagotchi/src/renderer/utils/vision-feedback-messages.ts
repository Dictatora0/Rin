export type VisionFeedbackMessageTemplateType
  = | 'subject_position_left'
    | 'subject_position_right'
    | 'subject_position_up'
    | 'subject_position_down'
    | 'subject_position_center'
    | 'subject_returned'
    | 'subject_absent'
    | 'subject_gated'
    | 'subject_matched'
    | 'subject_uncertain'
    | 'subject_dwelled_left'
    | 'subject_dwelled_right'
    | 'subject_dwelled_center'

interface VisionFeedbackMessageTemplateEntry {
  plain: string
  named?: string
}

export interface PickVisionFeedbackMessageOptions {
  displayName?: string
  previousMessage?: string | null
  random?: () => number
}

const DEFAULT_RANDOM = Math.random

const MESSAGE_TEMPLATES: Record<VisionFeedbackMessageTemplateType, VisionFeedbackMessageTemplateEntry[]> = {
  subject_position_left: [
    { plain: 'I noticed you moved left.', named: '{name}, you moved left.' },
    { plain: 'You shifted to the left.', named: '{name}, you shifted left.' },
    { plain: 'Left side detected.', named: '{name}, left side detected.' },
    { plain: 'You are leaning left now.', named: '{name}, you are leaning left.' },
    { plain: 'Left position confirmed.', named: '{name}, left position confirmed.' },
  ],
  subject_position_right: [
    { plain: 'I noticed you moved right.', named: '{name}, you moved right.' },
    { plain: 'You shifted to the right.', named: '{name}, you shifted right.' },
    { plain: 'Right side detected.', named: '{name}, right side detected.' },
    { plain: 'You are leaning right now.', named: '{name}, you are leaning right.' },
    { plain: 'Right position confirmed.', named: '{name}, right position confirmed.' },
  ],
  subject_position_up: [
    { plain: 'Looking up?', named: '{name}, looking up?' },
    { plain: 'Upper position detected.', named: '{name}, upper position detected.' },
    { plain: 'You moved higher in frame.', named: '{name}, you moved higher in frame.' },
    { plain: 'Head moved upward.', named: '{name}, your head moved upward.' },
  ],
  subject_position_down: [
    { plain: 'Looking down?', named: '{name}, looking down?' },
    { plain: 'Lower position detected.', named: '{name}, lower position detected.' },
    { plain: 'You moved lower in frame.', named: '{name}, you moved lower in frame.' },
    { plain: 'Head moved downward.', named: '{name}, your head moved downward.' },
  ],
  subject_position_center: [
    { plain: 'Back to center.', named: '{name}, back to center.' },
    { plain: 'Centered again.', named: '{name}, centered again.' },
    { plain: 'Center position confirmed.', named: '{name}, center position confirmed.' },
    { plain: 'You are centered now.', named: '{name}, you are centered now.' },
  ],
  subject_returned: [
    { plain: 'Welcome back.', named: 'Welcome back, {name}.' },
    { plain: 'Good to see you again.', named: 'Good to see you again, {name}.' },
    { plain: 'You are back in frame.', named: '{name}, you are back in frame.' },
    { plain: 'Return detected.', named: '{name}, return detected.' },
  ],
  subject_absent: [
    { plain: 'You stepped away.', named: '{name}, you stepped away.' },
    { plain: 'Subject left the frame.', named: '{name} left the frame.' },
    { plain: 'No subject in frame now.', named: 'No subject in frame now, {name}.' },
    { plain: 'I will wait here.', named: 'I will wait here, {name}.' },
  ],
  subject_gated: [
    { plain: 'Detected, but feedback is gated.' },
    { plain: 'Position detected, gate is blocking.' },
    { plain: 'Gate lock: no active feedback.' },
    { plain: 'Feedback paused by face gate.' },
  ],
  subject_matched: [
    { plain: 'Matched subject confirmed.', named: 'Matched subject confirmed, {name}.' },
    { plain: 'Face gate matched.', named: '{name} matched by face gate.' },
    { plain: 'Identity match completed.', named: 'Identity match completed for {name}.' },
    { plain: 'You are verified for feedback.', named: '{name}, you are verified for feedback.' },
  ],
  subject_uncertain: [
    { plain: 'Identity uncertain right now.' },
    { plain: 'Match is uncertain for now.' },
    { plain: 'I need a steadier face sample.' },
    { plain: 'Uncertain match, waiting for stability.' },
  ],
  subject_dwelled_left: [
    { plain: 'You stayed on the left side.', named: '{name}, you stayed on the left side.' },
    { plain: 'Left dwell detected.', named: '{name}, left dwell detected.' },
    { plain: 'Still leaning left.', named: '{name}, still leaning left.' },
    { plain: 'Holding left position.', named: '{name}, holding left position.' },
  ],
  subject_dwelled_right: [
    { plain: 'You stayed on the right side.', named: '{name}, you stayed on the right side.' },
    { plain: 'Right dwell detected.', named: '{name}, right dwell detected.' },
    { plain: 'Still leaning right.', named: '{name}, still leaning right.' },
    { plain: 'Holding right position.', named: '{name}, holding right position.' },
  ],
  subject_dwelled_center: [
    { plain: 'You held center steadily.', named: '{name}, you held center steadily.' },
    { plain: 'Center dwell detected.', named: '{name}, center dwell detected.' },
    { plain: 'Stable centered position.', named: '{name}, stable centered position.' },
    { plain: 'You stayed centered.', named: '{name}, you stayed centered.' },
  ],
}

function normalizeDisplayName(displayName?: string) {
  if (!displayName)
    return ''
  return displayName.trim().slice(0, 32)
}

function resolveTemplateMessage(template: VisionFeedbackMessageTemplateEntry, displayName: string) {
  if (displayName && template.named)
    return template.named.replace('{name}', displayName)
  return template.plain
}

function normalizeRandomValue(randomValue: number) {
  if (!Number.isFinite(randomValue))
    return 0
  if (randomValue <= 0)
    return 0
  if (randomValue >= 0.999_999_999)
    return 0.999_999_999
  return randomValue
}

/**
 * Picks a local vision feedback message from template pools.
 *
 * Use when:
 * - Visual feedback must stay deterministic-testable and local.
 * - Reactions should vary without relying on remote text generation.
 *
 * Expects:
 * - `eventType` maps to a known message template pool.
 * - `previousMessage` is the last emitted message for the same event type.
 *
 * Returns:
 * - One short message suitable for toast/bubble display.
 */
export function pickVisionFeedbackMessage(
  eventType: VisionFeedbackMessageTemplateType,
  options?: PickVisionFeedbackMessageOptions,
) {
  const templates = MESSAGE_TEMPLATES[eventType]
  const displayName = normalizeDisplayName(options?.displayName)
  const previousMessage = options?.previousMessage ?? null
  const random = options?.random ?? DEFAULT_RANDOM

  const resolvedMessages = templates.map(template => resolveTemplateMessage(template, displayName))
  const deduplicatedMessages = Array.from(new Set(resolvedMessages))
  const nonRepeatingMessages = previousMessage
    ? deduplicatedMessages.filter(message => message !== previousMessage)
    : deduplicatedMessages

  const selectableMessages = nonRepeatingMessages.length > 0
    ? nonRepeatingMessages
    : deduplicatedMessages

  const randomValue = normalizeRandomValue(random())
  const index = Math.floor(randomValue * selectableMessages.length)
  return selectableMessages[index] ?? selectableMessages[0] ?? ''
}

/**
 * Exposes template keys for strict unit tests and diagnostics.
 *
 * Use when:
 * - Tests need to assert complete template coverage.
 *
 * Returns:
 * - Ordered template key array.
 */
export function listVisionFeedbackTemplateTypes() {
  return Object.keys(MESSAGE_TEMPLATES) as VisionFeedbackMessageTemplateType[]
}
