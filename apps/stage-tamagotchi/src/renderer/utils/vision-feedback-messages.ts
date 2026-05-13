/**
 * Feedback intensity controls how expressive local vision feedback should be.
 */
export type VisionFeedbackIntensity = 'minimal' | 'balanced' | 'expressive'

/**
 * Feedback level controls how strong a selected template should feel.
 */
export type VisionFeedbackLevel = 'subtle' | 'normal' | 'strong'

/**
 * Channels describe where a selected template can be surfaced.
 */
export type VisionFeedbackChannel = 'ui' | 'toast' | 'bubble' | 'motion'

/**
 * Locale used by local vision feedback templates.
 */
export type VisionFeedbackLocale = 'en' | 'zh-CN'

/**
 * Template variant marker for local A/B style experiments.
 */
export type VisionFeedbackVariant = 'default' | 'a' | 'b'

/**
 * Locale-specific text payload.
 */
export interface VisionFeedbackTextVariant {
  text: string
  namedText?: string
}

/**
 * Base vision feedback event types emitted by the interaction pipeline.
 */
export type VisionFeedbackBaseEventType
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
    | 'expression_smile_like'
    | 'expression_stable_face'
    | 'expression_looking_away'
    | 'expression_unclear'
    | 'subject_dwelled_left'
    | 'subject_dwelled_right'
    | 'subject_dwelled_center'

/**
 * Transition-aware feedback event types used for smoother state changes.
 */
export type VisionFeedbackTransitionEventType
  = | 'transition_absent_to_returned'
    | 'transition_uncertain_to_matched'
    | 'transition_gated_to_matched'
    | 'transition_multiple_faces_to_matched'
    | 'transition_matched_to_absent'
    | 'transition_matched_to_uncertain'

/**
 * Full event type surface supported by template selection.
 */
export type VisionFeedbackEventType = VisionFeedbackBaseEventType | VisionFeedbackTransitionEventType

/**
 * Backward-compatible alias for existing call sites.
 */
export type VisionFeedbackMessageTemplateType = VisionFeedbackEventType

/**
 * Structured local feedback template for v2 selector logic.
 */
export interface VisionFeedbackTemplate {
  /** Unique identifier used for strict de-duplication and diagnostics. */
  id: string
  /** Default text used when no display name is available. */
  text: string
  /** Optional name-aware variant, using `{name}` placeholder. */
  namedText?: string
  /** Optional locale-specific overrides. */
  localeText?: Partial<Record<VisionFeedbackLocale, VisionFeedbackTextVariant>>
  /** Optional template variant for lightweight A/B testing. */
  variant?: VisionFeedbackVariant
  /** Feedback intensity tiers that are allowed to use this template. */
  intensities: VisionFeedbackIntensity[]
  /** Template strength level. */
  level: VisionFeedbackLevel
  /** Supported render channels for this template. */
  channels: VisionFeedbackChannel[]
  /** Optional per-template cooldown override. */
  cooldownMs?: number
  /** Optional tags for future extension/filtering. */
  tags?: string[]
}

/**
 * Snapshot used by transition resolver.
 */
export interface VisionFeedbackTransitionSnapshot {
  presence?: 'present' | 'absent' | 'unknown'
  gateState?: 'disabled' | 'enabled' | 'gated' | 'locked' | 'unknown'
  profileStatus?:
    | 'not_enrolled'
    | 'enrolling'
    | 'enrolled'
    | 'matching'
    | 'matched'
    | 'unmatched'
    | 'uncertain'
    | 'multiple_faces'
    | 'no_face'
    | 'unknown'
}

export interface SelectVisionFeedbackMessageOptions {
  intensity?: VisionFeedbackIntensity
  displayName?: string
  previousText?: string | null
  previousTemplateId?: string | null
  recentTemplateIds?: string[]
  random?: () => number
  preferredLevel?: VisionFeedbackLevel
  allowedChannels?: VisionFeedbackChannel[]
  locale?: VisionFeedbackLocale
  variant?: VisionFeedbackVariant
  bubbleAllowed?: boolean
}

export interface SelectedVisionFeedbackMessage {
  text: string
  level: VisionFeedbackLevel
  channels: VisionFeedbackChannel[]
  cooldownMs: number
  eventType: VisionFeedbackEventType
  templateId: string
  locale: VisionFeedbackLocale
  variant: VisionFeedbackVariant
  selectedTextSource: 'locale' | 'default'
  shouldShowBubble: boolean
}

/**
 * Legacy selection options kept for backward compatibility.
 */
export interface PickVisionFeedbackMessageOptions {
  displayName?: string
  previousMessage?: string | null
  random?: () => number
}

const DEFAULT_RANDOM = Math.random
const MAX_RANDOM = 0.999_999_999

const FEEDBACK_LEVELS_BY_INTENSITY: Record<VisionFeedbackIntensity, VisionFeedbackLevel[]> = {
  minimal: ['subtle'],
  balanced: ['normal', 'subtle'],
  expressive: ['strong', 'normal', 'subtle'],
}

const FALLBACK_TEMPLATE: VisionFeedbackTemplate = {
  id: 'fallback-safe',
  text: 'Feedback updated.',
  namedText: '{name}, feedback updated.',
  variant: 'default',
  intensities: ['minimal', 'balanced', 'expressive'],
  level: 'subtle',
  channels: ['ui'],
  cooldownMs: 5_000,
  tags: ['fallback'],
}

const EVENT_DEFAULT_COOLDOWN_MS: Record<VisionFeedbackEventType, number> = {
  subject_position_left: 5_000,
  subject_position_right: 5_000,
  subject_position_up: 5_000,
  subject_position_down: 5_000,
  subject_position_center: 5_000,
  subject_returned: 10_000,
  subject_absent: 8_000,
  subject_gated: 5_000,
  subject_matched: 10_000,
  subject_uncertain: 8_000,
  expression_smile_like: 10_000,
  expression_stable_face: 12_000,
  expression_looking_away: 15_000,
  expression_unclear: 9_000,
  subject_dwelled_left: 14_000,
  subject_dwelled_right: 14_000,
  subject_dwelled_center: 14_000,
  transition_absent_to_returned: 10_000,
  transition_uncertain_to_matched: 10_000,
  transition_gated_to_matched: 10_000,
  transition_multiple_faces_to_matched: 10_000,
  transition_matched_to_absent: 8_000,
  transition_matched_to_uncertain: 8_000,
}

const MESSAGE_TEMPLATES: Record<VisionFeedbackEventType, VisionFeedbackTemplate[]> = {
  subject_position_left: [
    { id: 'left-min-1', text: 'Left side noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
    { id: 'left-bal-1', text: 'I noticed you moved left.', namedText: '{name}, you moved left.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'left-bal-2', text: 'You shifted to the left.', namedText: '{name}, you shifted left.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'left-bal-3', text: 'Left position confirmed.', namedText: '{name}, left position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'left-exp-1', text: 'Nice move to the left.', namedText: '{name}, nice move to the left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'left-exp-2', text: 'You are leaning left now.', namedText: '{name}, you are leaning left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'left-subtle-2', text: 'Left side detected.', namedText: '{name}, left side detected.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
  ],
  subject_position_right: [
    { id: 'right-min-1', text: 'Right side noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
    { id: 'right-bal-1', text: 'I noticed you moved right.', namedText: '{name}, you moved right.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'right-bal-2', text: 'You shifted to the right.', namedText: '{name}, you shifted right.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'right-bal-3', text: 'Right position confirmed.', namedText: '{name}, right position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'right-exp-1', text: 'Nice move to the right.', namedText: '{name}, nice move to the right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'right-exp-2', text: 'You are leaning right now.', namedText: '{name}, you are leaning right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'right-subtle-2', text: 'Right side detected.', namedText: '{name}, right side detected.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
  ],
  subject_position_up: [
    { id: 'up-min-1', text: 'Upper position noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
    { id: 'up-bal-1', text: 'You moved slightly toward the top of frame.', namedText: '{name}, you moved slightly toward the top of frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'up-bal-2', text: 'You moved higher in frame.', namedText: '{name}, you moved higher in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'up-exp-1', text: 'Upper position looks steady.', namedText: '{name}, upper position looks steady.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'up-subtle-2', text: 'Head moved upward.', namedText: '{name}, your head moved upward.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
  ],
  subject_position_down: [
    { id: 'down-min-1', text: 'Lower position noted.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
    { id: 'down-bal-1', text: 'You moved slightly toward the bottom of frame.', namedText: '{name}, you moved slightly toward the bottom of frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'down-bal-2', text: 'You moved lower in frame.', namedText: '{name}, you moved lower in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'down-exp-1', text: 'Lower position looks steady.', namedText: '{name}, lower position looks steady.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'down-subtle-2', text: 'Head moved downward.', namedText: '{name}, your head moved downward.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
  ],
  subject_position_center: [
    { id: 'center-min-1', text: 'Centered.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
    {
      id: 'center-bal-1',
      text: 'Back to center.',
      namedText: '{name}, back to center.',
      localeText: {
        'zh-CN': {
          text: '回到中心了。',
          namedText: '{name}，你回到中心了。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast'],
      tags: ['direction'],
    },
    {
      id: 'center-bal-2',
      text: 'Centered again.',
      namedText: '{name}, centered again.',
      localeText: {
        'zh-CN': {
          text: '又回到中心位置。',
          namedText: '{name}，你又回到中心位置。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast'],
      tags: ['direction'],
      variant: 'a',
    },
    { id: 'center-bal-3', text: 'Center position confirmed.', namedText: '{name}, center position confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['direction'] },
    { id: 'center-exp-1', text: 'Nice, back in the center.', namedText: '{name}, nice, back in the center.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'center-exp-2', text: 'Center lock looks clean.', namedText: '{name}, center lock looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['direction'] },
    { id: 'center-subtle-2', text: 'You are centered now.', namedText: '{name}, you are centered now.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['direction'] },
  ],
  subject_returned: [
    { id: 'returned-min-1', text: 'You are back.', namedText: '{name}, you are back.', intensities: ['minimal'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'returned-bal-1', text: 'Welcome back.', namedText: 'Welcome back, {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
    { id: 'returned-bal-2', text: 'Good to see you again.', namedText: 'Good to see you again, {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
    { id: 'returned-bal-3', text: 'You are back in frame.', namedText: '{name}, you are back in frame.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'returned-bal-4', text: 'Return detected.', namedText: '{name}, return detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'returned-exp-1', text: 'Nice return, welcome back.', namedText: 'Nice return, {name}.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['presence'] },
    { id: 'returned-exp-2', text: 'You are right back on track.', namedText: '{name}, you are right back on track.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['presence'] },
    { id: 'returned-exp-3', text: 'Welcome back to center flow.', namedText: '{name}, welcome back to center flow.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['presence'] },
    { id: 'returned-subtle-2', text: 'Presence restored.', namedText: '{name}, presence restored.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['presence'] },
  ],
  subject_absent: [
    { id: 'absent-min-1', text: 'Subject absent.', intensities: ['minimal'], level: 'subtle', channels: ['ui'], tags: ['presence'] },
    { id: 'absent-bal-1', text: 'You stepped away.', namedText: '{name}, you stepped away.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'absent-bal-2', text: 'Subject left the frame.', namedText: '{name} left the frame.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'absent-bal-3', text: 'No subject in frame now.', namedText: 'No subject in frame now, {name}.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['presence'] },
    { id: 'absent-exp-1', text: 'I will wait here.', namedText: 'I will wait here, {name}.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['presence'] },
    { id: 'absent-exp-2', text: 'Frame is clear for now.', namedText: '{name}, frame is clear for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['presence'] },
  ],
  subject_gated: [
    {
      id: 'gated-min-1',
      text: 'Feedback is gated.',
      localeText: {
        'zh-CN': {
          text: '反馈暂时被门控限制。',
        },
      },
      intensities: ['minimal'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['gate'],
    },
    {
      id: 'gated-bal-1',
      text: 'Detected, but feedback is gated.',
      localeText: {
        'zh-CN': {
          text: '检测到了，但反馈被门控拦截。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast'],
      tags: ['gate'],
    },
    { id: 'gated-bal-2', text: 'Position detected, gate is blocking.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'gated-bal-3', text: 'Gate lock: no active feedback.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'gated-bal-4', text: 'Feedback paused by face gate.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'gated-exp-1', text: 'Gate is active, waiting for match.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
    {
      id: 'gated-exp-2',
      text: 'Match needed before stronger feedback.',
      localeText: {
        'zh-CN': {
          text: '需要先匹配成功，才能触发更强反馈。',
        },
      },
      intensities: ['expressive'],
      level: 'normal',
      channels: ['ui', 'toast'],
      tags: ['gate'],
      variant: 'b',
    },
  ],
  subject_matched: [
    {
      id: 'matched-min-1',
      text: 'Matched subject confirmed.',
      namedText: 'Matched subject confirmed, {name}.',
      localeText: {
        'zh-CN': {
          text: '已确认匹配主体。',
          namedText: '已确认匹配主体，{name}。',
        },
      },
      intensities: ['minimal', 'balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast'],
      tags: ['gate'],
    },
    { id: 'matched-bal-1', text: 'Face gate matched.', namedText: '{name} matched by face gate.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
    { id: 'matched-bal-2', text: 'Identity match completed.', namedText: 'Identity match completed for {name}.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
    { id: 'matched-bal-3', text: 'You are verified for feedback.', namedText: '{name}, you are verified for feedback.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['gate'] },
    {
      id: 'matched-bal-4',
      text: 'Gate is open for you now.',
      namedText: '{name}, gate is open for you now.',
      localeText: {
        'zh-CN': {
          text: '门控已为你放行。',
          namedText: '{name}，门控已为你放行。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast'],
      tags: ['gate'],
      variant: 'a',
    },
    { id: 'matched-exp-1', text: 'Great, match is stable now.', namedText: 'Great, {name}, match is stable now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['gate'] },
    {
      id: 'matched-exp-2',
      text: 'Match locked, feedback unlocked.',
      namedText: '{name}, match locked, feedback unlocked.',
      intensities: ['expressive'],
      level: 'strong',
      channels: ['ui', 'toast', 'motion', 'bubble'],
      tags: ['gate'],
      variant: 'a',
    },
    { id: 'matched-exp-3', text: 'You are fully matched.', namedText: '{name}, you are fully matched.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['gate'] },
    { id: 'matched-subtle-2', text: 'Verified subject active.', namedText: '{name}, verified subject active.', intensities: ['minimal', 'balanced'], level: 'subtle', channels: ['ui'], tags: ['gate'] },
  ],
  subject_uncertain: [
    {
      id: 'uncertain-min-1',
      text: 'Match uncertain.',
      localeText: {
        'zh-CN': {
          text: '当前匹配不够稳定。',
        },
      },
      intensities: ['minimal'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['gate'],
    },
    { id: 'uncertain-bal-1', text: 'Identity uncertain right now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'uncertain-bal-2', text: 'Match is uncertain for now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'uncertain-bal-3', text: 'I need a steadier face sample.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['gate'] },
    {
      id: 'uncertain-bal-4',
      text: 'Uncertain match, waiting for stability.',
      localeText: {
        'zh-CN': {
          text: '匹配暂不确定，正在等待更稳定画面。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast'],
      tags: ['gate'],
      variant: 'b',
    },
    { id: 'uncertain-exp-1', text: 'Match drifted, trying to recover.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
    { id: 'uncertain-exp-2', text: 'Still checking match quality.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['gate'] },
  ],
  expression_smile_like: [
    {
      id: 'expr-smile-min-1',
      text: 'Smile-like signal noted.',
      intensities: ['minimal'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['expression', 'smile_like'],
    },
    {
      id: 'expr-smile-bal-1',
      text: 'I caught a smile-like signal.',
      namedText: '{name}, I caught a smile-like signal.',
      localeText: {
        'zh-CN': {
          text: '检测到一个微笑样信号。',
          namedText: '{name}，检测到一个微笑样信号。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast', 'bubble'],
      tags: ['expression', 'smile_like'],
      cooldownMs: 10_000,
    },
    { id: 'expr-smile-bal-2', text: 'Smile-like motion is visible.', namedText: '{name}, smile-like motion is visible.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
    { id: 'expr-smile-exp-1', text: 'Nice smile-like cue in frame.', namedText: '{name}, nice smile-like cue in frame.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
    { id: 'expr-smile-exp-2', text: 'Smile-like signal looks clear.', namedText: '{name}, smile-like signal looks clear.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'smile_like'], cooldownMs: 10_000 },
  ],
  expression_stable_face: [
    {
      id: 'expr-stable-min-1',
      text: 'Stable face signal recorded.',
      intensities: ['minimal'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['expression', 'stable_face'],
      cooldownMs: 12_000,
    },
    {
      id: 'expr-stable-bal-1',
      text: 'Your face looks steady in frame.',
      namedText: '{name}, your face looks steady in frame.',
      localeText: {
        'zh-CN': {
          text: '你的画面内人脸很稳定。',
          namedText: '{name}，你的画面内人脸很稳定。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast', 'bubble'],
      tags: ['expression', 'stable_face'],
      cooldownMs: 12_000,
    },
    { id: 'expr-stable-bal-2', text: 'Stable face signal confirmed.', namedText: '{name}, stable face signal confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
    { id: 'expr-stable-exp-1', text: 'Frame stability looks clean.', namedText: '{name}, frame stability looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'bubble', 'motion'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
    { id: 'expr-stable-exp-2', text: 'Stable face cue is strong now.', namedText: '{name}, stable face cue is strong now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['expression', 'stable_face'], cooldownMs: 12_000 },
  ],
  expression_looking_away: [
    {
      id: 'expr-away-min-1',
      text: 'Slightly off center.',
      localeText: {
        'zh-CN': {
          text: '你暂时偏离了画面中心。',
        },
      },
      intensities: ['minimal'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['expression', 'looking_away'],
      cooldownMs: 15_000,
    },
    {
      id: 'expr-away-bal-1',
      text: 'I noticed you moved away from center.',
      namedText: '{name}, I noticed you moved away from center.',
      localeText: {
        'zh-CN': {
          text: '我看到你偏离了画面中心。',
          namedText: '{name}，我看到你偏离了画面中心。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast', 'bubble'],
      tags: ['expression', 'looking_away'],
      cooldownMs: 15_000,
    },
    {
      id: 'expr-away-bal-2',
      text: 'You are a little off center.',
      namedText: '{name}, you are a little off center.',
      localeText: {
        'zh-CN': {
          text: '你暂时不在画面中央，我会安静一点。',
          namedText: '{name}，你暂时不在画面中央，我会安静一点。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast'],
      tags: ['expression', 'looking_away'],
      cooldownMs: 15_000,
    },
    {
      id: 'expr-away-exp-1',
      text: 'The visual signal is not stable yet.',
      namedText: '{name}, the visual signal is not stable yet.',
      localeText: {
        'zh-CN': {
          text: '画面里的主体位置不太稳定。',
          namedText: '{name}，画面里的主体位置不太稳定。',
        },
      },
      intensities: ['expressive'],
      level: 'normal',
      channels: ['ui', 'toast', 'bubble', 'motion'],
      tags: ['expression', 'looking_away'],
      cooldownMs: 15_000,
    },
  ],
  expression_unclear: [
    {
      id: 'expr-unclear-min-1',
      text: 'Visual signal is unclear.',
      localeText: {
        'zh-CN': {
          text: '当前视觉信号不够清晰。',
        },
      },
      intensities: ['minimal', 'balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui'],
      tags: ['expression', 'unclear'],
      cooldownMs: 9_000,
    },
    { id: 'expr-unclear-bal-1', text: 'The visual signal is unclear.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'bubble'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
    { id: 'expr-unclear-bal-2', text: 'Face motion signal is not stable yet.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
    { id: 'expr-unclear-exp-1', text: 'Signal quality dropped for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['expression', 'unclear'], cooldownMs: 9_000 },
  ],
  subject_dwelled_left: [
    { id: 'dwell-left-1', text: 'You stayed on the left side.', namedText: '{name}, you stayed on the left side.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-left-2', text: 'Left dwell detected.', namedText: '{name}, left dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-left-3', text: 'Still leaning left.', namedText: '{name}, still leaning left.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
    { id: 'dwell-left-4', text: 'Holding left position.', namedText: '{name}, holding left position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-left-5', text: 'Left hold looks stable.', namedText: '{name}, left hold looks stable.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
  ],
  subject_dwelled_right: [
    { id: 'dwell-right-1', text: 'You stayed on the right side.', namedText: '{name}, you stayed on the right side.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-right-2', text: 'Right dwell detected.', namedText: '{name}, right dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-right-3', text: 'Still leaning right.', namedText: '{name}, still leaning right.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
    { id: 'dwell-right-4', text: 'Holding right position.', namedText: '{name}, holding right position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-right-5', text: 'Right hold looks stable.', namedText: '{name}, right hold looks stable.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
  ],
  subject_dwelled_center: [
    { id: 'dwell-center-1', text: 'You held center steadily.', namedText: '{name}, you held center steadily.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-center-2', text: 'Center dwell detected.', namedText: '{name}, center dwell detected.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-center-3', text: 'Stable centered position.', namedText: '{name}, stable centered position.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-center-4', text: 'You stayed centered.', namedText: '{name}, you stayed centered.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['dwell'] },
    { id: 'dwell-center-5', text: 'Center hold looks clean.', namedText: '{name}, center hold looks clean.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['dwell'] },
  ],
  transition_absent_to_returned: [
    {
      id: 't-absent-returned-1',
      text: 'Welcome back from a short break.',
      namedText: 'Welcome back, {name}.',
      localeText: {
        'zh-CN': {
          text: '欢迎回来。',
          namedText: '欢迎回来，{name}。',
        },
      },
      intensities: ['minimal', 'balanced', 'expressive'],
      level: 'subtle',
      channels: ['ui', 'toast'],
      tags: ['transition', 'return'],
      variant: 'a',
    },
    { id: 't-absent-returned-2', text: 'You are back in view.', namedText: '{name}, you are back in view.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
    { id: 't-absent-returned-3', text: 'Return transition confirmed.', namedText: '{name}, return transition confirmed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
    {
      id: 't-absent-returned-4',
      text: 'Frame picked you up again.',
      namedText: '{name}, frame picked you up again.',
      localeText: {
        'zh-CN': {
          text: '画面再次捕捉到你了。',
          namedText: '{name}，画面再次捕捉到你了。',
        },
      },
      intensities: ['balanced', 'expressive'],
      level: 'normal',
      channels: ['ui', 'toast'],
      tags: ['transition', 'return'],
      variant: 'b',
    },
    { id: 't-absent-returned-5', text: 'Nice return, tracking resumed.', namedText: '{name}, tracking resumed.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion', 'bubble'], tags: ['transition', 'return'] },
    { id: 't-absent-returned-6', text: 'Back online for feedback.', namedText: '{name}, back online for feedback.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'return'] },
    { id: 't-absent-returned-7', text: 'Presence recovered smoothly.', namedText: '{name}, presence recovered smoothly.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
    { id: 't-absent-returned-8', text: 'You are back at center flow.', namedText: '{name}, you are back at center flow.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'return'] },
    { id: 't-absent-returned-9', text: 'Return transition complete.', namedText: '{name}, return transition complete.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'return'] },
  ],
  transition_uncertain_to_matched: [
    { id: 't-uncertain-matched-1', text: 'Match recovered from uncertainty.', namedText: '{name}, match recovered from uncertainty.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-2', text: 'Uncertain state cleared, now matched.', namedText: '{name}, uncertain state cleared.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-3', text: 'Match is stable again.', namedText: '{name}, match is stable again.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-4', text: 'Identity lock restored.', namedText: '{name}, identity lock restored.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-5', text: 'Great, certainty is back.', namedText: '{name}, certainty is back.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-6', text: 'Transition to matched completed.', namedText: '{name}, transition to matched completed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'match'] },
    { id: 't-uncertain-matched-7', text: 'You are matched again.', namedText: '{name}, you are matched again.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'match'] },
  ],
  transition_gated_to_matched: [
    { id: 't-gated-matched-1', text: 'Gate lifted, matched subject ready.', namedText: '{name}, gate lifted and matched.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-2', text: 'Gated state resolved to matched.', namedText: '{name}, gated state resolved.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-3', text: 'Face gate reopened for you.', namedText: '{name}, face gate reopened for you.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-4', text: 'Match restored after gating.', namedText: '{name}, match restored after gating.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-5', text: 'Great unlock, feedback can resume.', namedText: '{name}, feedback can resume now.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-6', text: 'Gate transition complete.', namedText: '{name}, gate transition complete.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-gated-matched-7', text: 'You moved from gated to matched.', namedText: '{name}, now moving from gated to matched.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'gate'] },
  ],
  transition_multiple_faces_to_matched: [
    { id: 't-multi-matched-1', text: 'Single matched subject recovered.', namedText: '{name}, single matched subject recovered.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-2', text: 'Multiple-face lock cleared.', namedText: '{name}, multiple-face lock cleared.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-3', text: 'Now tracking one matched subject.', namedText: '{name}, now tracking one matched subject.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-4', text: 'Crowd state resolved to matched.', namedText: '{name}, crowd state resolved to matched.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-5', text: 'Nice, focus is back on you.', namedText: 'Nice, {name}, focus is back on you.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-6', text: 'Multiple-face transition completed.', namedText: '{name}, multiple-face transition completed.', intensities: ['balanced', 'expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'multi'] },
    { id: 't-multi-matched-7', text: 'Clear frame, matched subject active.', namedText: '{name}, clear frame and matched subject active.', intensities: ['expressive'], level: 'strong', channels: ['ui', 'toast', 'motion'], tags: ['transition', 'multi'] },
  ],
  transition_matched_to_absent: [
    { id: 't-matched-absent-1', text: 'Matched subject stepped away.', namedText: '{name}, you stepped away from frame.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-2', text: 'Matched presence moved to absent.', namedText: '{name}, matched presence moved to absent.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-3', text: 'Match paused because frame is clear.', namedText: '{name}, match paused because frame is clear.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-4', text: 'Matched state dropped to absent.', namedText: '{name}, matched state dropped to absent.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-5', text: 'I will wait for your return.', namedText: '{name}, I will wait for your return.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast', 'bubble'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-6', text: 'Tracking paused for now.', namedText: '{name}, tracking paused for now.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
    { id: 't-matched-absent-7', text: 'Absent transition confirmed.', namedText: '{name}, absent transition confirmed.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'presence'] },
  ],
  transition_matched_to_uncertain: [
    { id: 't-matched-uncertain-1', text: 'Matched state turned uncertain.', namedText: '{name}, matched state turned uncertain.', intensities: ['minimal', 'balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-2', text: 'Match confidence dropped a bit.', namedText: '{name}, match confidence dropped a bit.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-3', text: 'Moving from matched to uncertain.', namedText: '{name}, moving from matched to uncertain.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-4', text: 'Identity lock is unstable now.', namedText: '{name}, identity lock is unstable now.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-5', text: 'I am rechecking the match.', namedText: '{name}, I am rechecking the match.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-6', text: 'Uncertain transition detected.', namedText: '{name}, uncertain transition detected.', intensities: ['balanced', 'expressive'], level: 'subtle', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
    { id: 't-matched-uncertain-7', text: 'Please hold steady for rematch.', namedText: '{name}, please hold steady for rematch.', intensities: ['expressive'], level: 'normal', channels: ['ui', 'toast'], tags: ['transition', 'gate'] },
  ],
}

function normalizeDisplayName(displayName?: string) {
  if (!displayName)
    return ''
  return displayName.trim().slice(0, 32)
}

function normalizeLocale(locale?: VisionFeedbackLocale): VisionFeedbackLocale {
  if (locale === 'zh-CN')
    return 'zh-CN'
  return 'en'
}

function normalizeVariant(variant?: VisionFeedbackVariant): VisionFeedbackVariant {
  if (variant === 'a' || variant === 'b')
    return variant
  return 'default'
}

function normalizeRandomValue(randomValue: number) {
  if (!Number.isFinite(randomValue))
    return 0
  if (randomValue <= 0)
    return 0
  if (randomValue >= MAX_RANDOM)
    return MAX_RANDOM
  return randomValue
}

function resolveTemplateVariant(template: VisionFeedbackTemplate): VisionFeedbackVariant {
  return template.variant ?? 'default'
}

function resolveTemplateText(
  template: VisionFeedbackTemplate,
  locale: VisionFeedbackLocale,
  displayName: string,
): { text: string, selectedTextSource: 'locale' | 'default' } {
  const localeVariant = template.localeText?.[locale]
  if (localeVariant && localeVariant.text.trim().length > 0) {
    if (displayName && localeVariant.namedText)
      return { text: localeVariant.namedText.replace('{name}', displayName), selectedTextSource: 'locale' }
    return { text: localeVariant.text, selectedTextSource: 'locale' }
  }

  if (displayName && template.namedText)
    return { text: template.namedText.replace('{name}', displayName), selectedTextSource: 'default' }
  return { text: template.text, selectedTextSource: 'default' }
}

function containsAllowedChannel(templateChannels: VisionFeedbackChannel[], allowedChannels: VisionFeedbackChannel[]) {
  if (allowedChannels.length === 0)
    return true
  return templateChannels.some(channel => allowedChannels.includes(channel))
}

function normalizeRequestedLevel(
  intensity: VisionFeedbackIntensity,
  preferredLevel?: VisionFeedbackLevel,
) {
  if (!preferredLevel)
    return null
  if (FEEDBACK_LEVELS_BY_INTENSITY[intensity].includes(preferredLevel))
    return preferredLevel
  if (preferredLevel === 'strong' && intensity === 'balanced')
    return 'normal' as const
  return 'subtle' as const
}

function pickFromTemplates(
  templates: VisionFeedbackTemplate[],
  random: () => number,
) {
  const randomValue = normalizeRandomValue(random())
  const index = Math.floor(randomValue * templates.length)
  return templates[index] ?? templates[0] ?? FALLBACK_TEMPLATE
}

function resolveVariantCandidates(
  templates: VisionFeedbackTemplate[],
  requestedVariant: VisionFeedbackVariant,
) {
  const defaultTemplates = templates.filter(template => resolveTemplateVariant(template) === 'default')
  if (requestedVariant === 'default')
    return [...defaultTemplates, ...templates.filter(template => resolveTemplateVariant(template) !== 'default')]

  const preferredTemplates = templates.filter(template => resolveTemplateVariant(template) === requestedVariant)
  const remainingTemplates = templates.filter(template => resolveTemplateVariant(template) !== requestedVariant && resolveTemplateVariant(template) !== 'default')
  return [...preferredTemplates, ...defaultTemplates, ...remainingTemplates]
}

function pickLeastRecentTemplates(
  templates: VisionFeedbackTemplate[],
  recentTemplateIds: Set<string>,
) {
  const templatesNotInRecent = templates.filter(template => !recentTemplateIds.has(template.id))
  if (templatesNotInRecent.length > 0)
    return templatesNotInRecent
  return templates
}

function normalizeTransitionSnapshot(snapshot?: VisionFeedbackTransitionSnapshot | null) {
  return {
    presence: snapshot?.presence ?? 'unknown',
    gateState: snapshot?.gateState ?? 'unknown',
    profileStatus: snapshot?.profileStatus ?? 'unknown',
  } as const
}

function isGatedLikeSnapshot(snapshot: ReturnType<typeof normalizeTransitionSnapshot>) {
  if (snapshot.gateState === 'gated' || snapshot.gateState === 'locked')
    return true
  return snapshot.profileStatus === 'unmatched' || snapshot.profileStatus === 'no_face'
}

/**
 * Resolves transition-aware event type for contextual feedback.
 *
 * Use when:
 * - Feedback should prefer state transitions over single-frame event labels.
 *
 * Expects:
 * - `previousSnapshot` represents the prior stable feedback state.
 * - `currentSnapshot` represents the latest stable feedback state.
 *
 * Returns:
 * - Transition event type when a known state transition is detected,
 *   otherwise returns `baseEventType`.
 */
export function resolveVisionFeedbackTransition(
  previousSnapshot: VisionFeedbackTransitionSnapshot | null | undefined,
  currentSnapshot: VisionFeedbackTransitionSnapshot | null | undefined,
  baseEventType: VisionFeedbackBaseEventType,
): VisionFeedbackEventType {
  const previous = normalizeTransitionSnapshot(previousSnapshot)
  const current = normalizeTransitionSnapshot(currentSnapshot)

  if (baseEventType === 'subject_returned' && previous.presence === 'absent' && current.presence === 'present')
    return 'transition_absent_to_returned'

  if (baseEventType === 'subject_matched' && previous.profileStatus === 'uncertain' && current.profileStatus === 'matched')
    return 'transition_uncertain_to_matched'

  if (baseEventType === 'subject_matched' && previous.profileStatus === 'multiple_faces' && current.profileStatus === 'matched')
    return 'transition_multiple_faces_to_matched'

  if (baseEventType === 'subject_matched' && isGatedLikeSnapshot(previous) && current.profileStatus === 'matched')
    return 'transition_gated_to_matched'

  if (baseEventType === 'subject_absent' && previous.profileStatus === 'matched' && current.presence === 'absent')
    return 'transition_matched_to_absent'

  if (baseEventType === 'subject_uncertain' && previous.profileStatus === 'matched' && current.profileStatus === 'uncertain')
    return 'transition_matched_to_uncertain'

  return baseEventType
}

/**
 * Selects a structured feedback template with intensity and transition awareness.
 *
 * Use when:
 * - You need deterministic, local-only feedback selection.
 * - Selection must respect intensity, level, channel, and de-duplication rules.
 *
 * Expects:
 * - `eventType` can be any runtime string; unknown values are safely handled.
 *
 * Returns:
 * - Selected structured payload for UI/toast/motion routing.
 */
export function selectVisionFeedbackMessage(
  eventType: VisionFeedbackEventType | string,
  options?: SelectVisionFeedbackMessageOptions,
): SelectedVisionFeedbackMessage {
  const normalizedEventType = isKnownVisionFeedbackEventType(eventType)
    ? eventType
    : ('subject_uncertain' as const)
  const intensity = options?.intensity ?? 'balanced'
  const displayName = normalizeDisplayName(options?.displayName)
  const previousText = options?.previousText ?? null
  const previousTemplateId = options?.previousTemplateId ?? null
  const recentTemplateIds = new Set(options?.recentTemplateIds ?? [])
  const random = options?.random ?? DEFAULT_RANDOM
  const allowedChannels = options?.allowedChannels ?? []
  const requestedLocale = normalizeLocale(options?.locale)
  const requestedVariant = normalizeVariant(options?.variant)
  const bubbleAllowed = options?.bubbleAllowed !== false
  const requestedLevel = normalizeRequestedLevel(intensity, options?.preferredLevel)
  const availableLevels = FEEDBACK_LEVELS_BY_INTENSITY[intensity]

  const templatesForEvent = MESSAGE_TEMPLATES[normalizedEventType] ?? []

  const intensityCandidates = templatesForEvent.filter((template) => {
    if (!template.intensities.includes(intensity))
      return false
    return containsAllowedChannel(template.channels, allowedChannels)
  })

  const levelCandidates = requestedLevel
    ? intensityCandidates.filter(template => template.level === requestedLevel)
    : []

  const rankedCandidates = levelCandidates.length > 0
    ? levelCandidates
    : availableLevels.flatMap(level => intensityCandidates.filter(template => template.level === level))

  const variantCandidates = resolveVariantCandidates(rankedCandidates, requestedVariant)

  const nonRepeatingCandidates = variantCandidates.filter((template) => {
    if (recentTemplateIds.has(template.id) && variantCandidates.length > 1)
      return false
    if (previousTemplateId && template.id === previousTemplateId && variantCandidates.length > 1)
      return false
    if (!previousText)
      return true
    const text = resolveTemplateText(template, requestedLocale, displayName).text
    if (text === previousText && variantCandidates.length > 1)
      return false
    return true
  })

  const selectedTemplate = pickFromTemplates(
    nonRepeatingCandidates.length > 0
      ? nonRepeatingCandidates
      : (variantCandidates.length > 0 ? pickLeastRecentTemplates(variantCandidates, recentTemplateIds) : [FALLBACK_TEMPLATE]),
    random,
  )

  const resolvedText = resolveTemplateText(selectedTemplate, requestedLocale, displayName)
  const selectedVariant = resolveTemplateVariant(selectedTemplate)
  const bubbleChannelAllowedByFilter = allowedChannels.length === 0 || allowedChannels.includes('bubble')
  const shouldShowBubble = selectedTemplate.channels.includes('bubble')
    && bubbleAllowed
    && bubbleChannelAllowedByFilter

  return {
    text: resolvedText.text,
    level: selectedTemplate.level,
    channels: selectedTemplate.channels,
    cooldownMs: selectedTemplate.cooldownMs ?? EVENT_DEFAULT_COOLDOWN_MS[normalizedEventType] ?? (FALLBACK_TEMPLATE.cooldownMs ?? 5_000),
    eventType: normalizedEventType,
    templateId: selectedTemplate.id,
    locale: requestedLocale,
    variant: selectedVariant,
    selectedTextSource: resolvedText.selectedTextSource,
    shouldShowBubble,
  }
}

/**
 * Backward-compatible text-only selector.
 *
 * Use when:
 * - Existing call sites only need `text`.
 */
export function pickVisionFeedbackMessage(
  eventType: VisionFeedbackMessageTemplateType,
  options?: PickVisionFeedbackMessageOptions,
) {
  return selectVisionFeedbackMessage(eventType, {
    displayName: options?.displayName,
    previousText: options?.previousMessage ?? null,
    random: options?.random,
  }).text
}

/**
 * Exposes template keys for strict unit tests and diagnostics.
 *
 * Returns:
 * - Ordered template key array including transition event types.
 */
export function listVisionFeedbackTemplateTypes() {
  return Object.keys(MESSAGE_TEMPLATES) as VisionFeedbackMessageTemplateType[]
}

/**
 * Exposes templates for strict structural unit tests.
 */
export function listVisionFeedbackTemplatesForEvent(eventType: VisionFeedbackEventType) {
  return MESSAGE_TEMPLATES[eventType]
}

/**
 * Runtime guard for dynamic event values.
 */
export function isKnownVisionFeedbackEventType(value: string): value is VisionFeedbackEventType {
  return Object.hasOwn(MESSAGE_TEMPLATES, value)
}
