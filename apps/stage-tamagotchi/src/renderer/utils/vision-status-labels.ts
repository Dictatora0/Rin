export type VisionStatusLocale = 'zh-CN' | 'en'

const FIELD_LABELS: Record<string, Record<VisionStatusLocale, string>> = {
  cameraState: { 'zh-CN': '摄像头', 'en': 'Camera' },
  facePresence: { 'zh-CN': '主体状态', 'en': 'Subject' },
  faceDirection: { 'zh-CN': '主体方向', 'en': 'Direction' },
  faceGate: { 'zh-CN': '人脸门控', 'en': 'Face gate' },
  matchStatus: { 'zh-CN': '匹配状态', 'en': 'Match status' },
  interactiveFeedback: { 'zh-CN': '反馈权限', 'en': 'Feedback gate' },
  feedbackIntensity: { 'zh-CN': '反馈强度', 'en': 'Feedback intensity' },
  latestBubble: { 'zh-CN': '最新气泡', 'en': 'Latest bubble' },
  faceCenter: { 'zh-CN': '主体中心', 'en': 'Face center' },
  subjectPosition: { 'zh-CN': '当前主体位置', 'en': 'Subject position' },
  stableSubjectPosition: { 'zh-CN': '稳定主体位置', 'en': 'Stable subject position' },
  subjectResponseState: { 'zh-CN': '位置反馈状态', 'en': 'Subject response state' },
  petSubjectResponseState: { 'zh-CN': 'Rin 反馈状态', 'en': 'Rin response state' },
  subjectResponseGate: { 'zh-CN': '位置反馈权限', 'en': 'Subject response gate' },
  lastFeedbackMessage: { 'zh-CN': '最近反馈文案', 'en': 'Last feedback message' },
  lastSubjectResponseEvent: { 'zh-CN': '最近位置事件', 'en': 'Last subject event' },
  faceMotionSignals: { 'zh-CN': '面部动作信号', 'en': 'Face motion signals' },
  currentSignal: { 'zh-CN': '当前信号', 'en': 'Current signal' },
  expressionSignal: { 'zh-CN': '面部动作信号', 'en': 'Expression signal' },
  stableExpressionSignal: { 'zh-CN': '稳定信号', 'en': 'Stable signal' },
  confidence: { 'zh-CN': '置信度', 'en': 'Confidence' },
  reason: { 'zh-CN': '原因', 'en': 'Reason' },
  source: { 'zh-CN': '来源', 'en': 'Source' },
  cooldown: { 'zh-CN': '冷却', 'en': 'Cooldown' },
}

const VALUE_LABELS: Record<string, Record<VisionStatusLocale, string>> = {
  active: { 'zh-CN': '运行中', 'en': 'Active' },
  running: { 'zh-CN': '运行中', 'en': 'Running' },
  off: { 'zh-CN': '未开启', 'en': 'Off' },
  loading: { 'zh-CN': '加载中', 'en': 'Loading' },
  error: { 'zh-CN': '异常', 'en': 'Error' },
  present: { 'zh-CN': '已检测到', 'en': 'Present' },
  absent: { 'zh-CN': '未检测到主体', 'en': 'Absent' },
  unknown: { 'zh-CN': '未知', 'en': 'Unknown' },
  left: { 'zh-CN': '左侧', 'en': 'Left' },
  right: { 'zh-CN': '右侧', 'en': 'Right' },
  up: { 'zh-CN': '上方', 'en': 'Up' },
  down: { 'zh-CN': '下方', 'en': 'Down' },
  center: { 'zh-CN': '居中', 'en': 'Centered' },
  locked: { 'zh-CN': '已锁定', 'en': 'Locked' },
  gated: { 'zh-CN': '已拦截', 'en': 'Gated' },
  enabled: { 'zh-CN': '已允许', 'en': 'Enabled' },
  disabled: { 'zh-CN': '未启用', 'en': 'Disabled' },
  matched: { 'zh-CN': '已匹配', 'en': 'Matched' },
  unmatched: { 'zh-CN': '未匹配', 'en': 'Unmatched' },
  no_face: { 'zh-CN': '未检测到人脸', 'en': 'No face' },
  multiple_faces: { 'zh-CN': '多人入镜', 'en': 'Multiple faces' },
  uncertain: { 'zh-CN': '不稳定', 'en': 'Uncertain' },
  low_confidence: { 'zh-CN': '置信度较低', 'en': 'Low confidence' },
  not_enrolled: { 'zh-CN': '未录入', 'en': 'Not enrolled' },
  enrolling: { 'zh-CN': '录入中', 'en': 'Enrolling' },
  enrolled: { 'zh-CN': '已录入', 'en': 'Enrolled' },
  matching: { 'zh-CN': '匹配中', 'en': 'Matching' },
  prompt: { 'zh-CN': '等待授权', 'en': 'Prompt' },
  granted: { 'zh-CN': '已授权', 'en': 'Granted' },
  denied: { 'zh-CN': '已拒绝', 'en': 'Denied' },
  unsupported: { 'zh-CN': '不支持', 'en': 'Unsupported' },
  ready: { 'zh-CN': '已就绪', 'en': 'Ready' },
  failed: { 'zh-CN': '失败', 'en': 'Failed' },
  fallback: { 'zh-CN': '降级模式', 'en': 'Fallback' },
  warming: { 'zh-CN': '预热中', 'en': 'Warming' },
  partial_ready: { 'zh-CN': '部分就绪', 'en': 'Partially ready' },
  resetting: { 'zh-CN': '重置中', 'en': 'Resetting' },
  allowed: { 'zh-CN': '已允许', 'en': 'Allowed' },
  none: { 'zh-CN': '无', 'en': 'None' },
  idle: { 'zh-CN': '空闲', 'en': 'Idle' },
  following_left: { 'zh-CN': '跟随左侧', 'en': 'Following left' },
  following_right: { 'zh-CN': '跟随右侧', 'en': 'Following right' },
  looking_up: { 'zh-CN': '看向上方', 'en': 'Looking up' },
  looking_down: { 'zh-CN': '看向下方', 'en': 'Looking down' },
  centered: { 'zh-CN': '回到中心', 'en': 'Centered' },
  minimal: { 'zh-CN': '克制', 'en': 'Minimal' },
  balanced: { 'zh-CN': '平衡', 'en': 'Balanced' },
  expressive: { 'zh-CN': '活跃', 'en': 'Expressive' },
  on: { 'zh-CN': '开启', 'en': 'On' },
  smile_like_signal: { 'zh-CN': '类微笑信号', 'en': 'Smile-like signal' },
  stable_face_signal: { 'zh-CN': '稳定面部信号', 'en': 'Stable face signal' },
  looking_away_signal: { 'zh-CN': '偏离中心信号', 'en': 'Off-center signal' },
  unclear_face_signal: { 'zh-CN': '面部信号不清晰', 'en': 'Unclear face signal' },
  blendshape: { 'zh-CN': 'Blendshape', 'en': 'Blendshape' },
  position: { 'zh-CN': '位置推断', 'en': 'Position' },
  quality: { 'zh-CN': '质量评估', 'en': 'Quality' },
  yes: { 'zh-CN': '是', 'en': 'Yes' },
  no: { 'zh-CN': '否', 'en': 'No' },
}

/**
 * Normalizes locale for vision status formatting.
 *
 * Use when:
 * - UI needs deterministic locale fallback for local vision diagnostics labels.
 *
 * Expects:
 * - Any runtime locale-like string, including null/undefined.
 *
 * Returns:
 * - `zh-CN` or `en` with `zh-CN` as default fallback.
 */
export function normalizeVisionStatusLocale(locale?: string | null): VisionStatusLocale {
  if (locale === 'en')
    return 'en'
  return 'zh-CN'
}

/**
 * Formats a field label used by vision diagnostics panels.
 *
 * Use when:
 * - Rendering user-facing field names such as camera state or gate status.
 *
 * Expects:
 * - Stable key names used by the view layer.
 *
 * Returns:
 * - Localized label when known, otherwise the original key.
 */
export function formatVisionFieldLabel(key: string, locale: VisionStatusLocale = 'zh-CN') {
  const field = FIELD_LABELS[key]
  return field?.[locale] ?? key
}

/**
 * Formats a status value into localized plain text.
 *
 * Use when:
 * - Rendering vision state values in user-facing diagnostics.
 *
 * Expects:
 * - String-like status values from composables.
 *
 * Returns:
 * - Localized value label when known; otherwise the raw value.
 */
export function formatVisionStatusLabel(
  key: string,
  value: string | null | undefined,
  locale: VisionStatusLocale = 'zh-CN',
) {
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return locale === 'zh-CN' ? '未知' : 'Unknown'
  }

  const normalized = String(value)
  const mappedValue = VALUE_LABELS[normalized]?.[locale] ?? normalized
  return `${formatVisionFieldLabel(key, locale)}：${mappedValue}`
}

/**
 * Formats face presence state value.
 *
 * Use when:
 * - Rendering current face presence for end users.
 *
 * Expects:
 * - `present | absent | unknown` like values.
 *
 * Returns:
 * - Localized presence value label.
 */
export function formatFacePresence(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats face direction value.
 *
 * Use when:
 * - Rendering directional cues from face center.
 *
 * Expects:
 * - Direction-like state value.
 *
 * Returns:
 * - Localized direction label.
 */
export function formatFaceDirection(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats gate state value.
 *
 * Use when:
 * - Rendering gate lock/allow statuses.
 *
 * Expects:
 * - Gate state-like string.
 *
 * Returns:
 * - Localized gate status label.
 */
export function formatGateStatus(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats face-gate match status value.
 *
 * Use when:
 * - Rendering match/no-face/multiple-faces statuses.
 *
 * Expects:
 * - Profile status-like string.
 *
 * Returns:
 * - Localized match status label.
 */
export function formatMatchStatus(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats feedback intensity level.
 *
 * Use when:
 * - Rendering feedback intensity controls and diagnostics.
 *
 * Expects:
 * - `minimal | balanced | expressive`.
 *
 * Returns:
 * - Localized intensity label.
 */
export function formatFeedbackIntensity(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats expression signal value.
 *
 * Use when:
 * - Rendering local face motion signal summaries.
 *
 * Expects:
 * - Expression signal enum-like value.
 *
 * Returns:
 * - Localized expression signal label.
 */
export function formatExpressionSignal(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats subject response state.
 *
 * Use when:
 * - Rendering subject-position response state values.
 *
 * Expects:
 * - Subject response state-like value.
 *
 * Returns:
 * - Localized subject response state label.
 */
export function formatSubjectResponseState(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}

/**
 * Formats generic status value.
 *
 * Use when:
 * - A specific formatter is not available.
 *
 * Expects:
 * - Any status-like string value.
 *
 * Returns:
 * - Localized value when known; raw value otherwise.
 */
export function formatVisionStatusValue(value: string, locale: VisionStatusLocale = 'zh-CN') {
  return VALUE_LABELS[value]?.[locale] ?? value
}
