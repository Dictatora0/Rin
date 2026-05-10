export type VisionExpressionSignal
  = | 'none'
    | 'smile_like_signal'
    | 'stable_face_signal'
    | 'looking_away_signal'
    | 'unclear_face_signal'
    | 'low_confidence'

export type VisionExpressionSignalSource
  = | 'blendshape'
    | 'position'
    | 'quality'
    | 'fallback'

export interface VisionExpressionBlendshapeCategory {
  categoryName: string
  score: number
}

export interface ResolveVisionExpressionSignalInput {
  blendshapes?: VisionExpressionBlendshapeCategory[]
  blendshapeOutputAvailable?: boolean
  hasLandmarks?: boolean
  facePresence: 'present' | 'absent' | 'unknown'
  faceDirection: 'left' | 'center' | 'right' | 'up' | 'down' | 'unknown'
  qualityScore?: number
  faceCenter?: { x: number, y: number } | null
  centeredDurationMs?: number
  awayDurationMs?: number
}

export interface VisionExpressionSignalResult {
  signal: VisionExpressionSignal
  confidence: number
  reason: string
  source: VisionExpressionSignalSource
}

const SMILE_SIGNAL_THRESHOLD = 0.45
const STABLE_FACE_QUALITY_THRESHOLD = 0.65
const UNCLEAR_QUALITY_THRESHOLD = 0.35
const STABLE_FACE_CENTERED_DURATION_MS = 3_000
const LOOKING_AWAY_DURATION_MS = 5_000

/**
 * Resolves local face motion signals from blendshapes, face direction, and quality metrics.
 *
 * Use when:
 * - Visual interaction needs lightweight face motion cues for local avatar feedback.
 * - You need deterministic, testable signal extraction without remote APIs.
 *
 * Expects:
 * - `facePresence` and `faceDirection` reflect the current frame-level visual state.
 * - `qualityScore` is normalized to `[0, 1]` when provided.
 *
 * Returns:
 * - A conservative visual signal classification with confidence, reason, and signal source.
 */
export function resolveVisionExpressionSignal(
  input: ResolveVisionExpressionSignalInput,
): VisionExpressionSignalResult {
  if (input.facePresence === 'absent') {
    return {
      signal: 'none',
      confidence: 0,
      reason: 'no face present',
      source: 'fallback',
    }
  }

  const normalizedQuality = normalizeQualityScore(input.qualityScore)
  const smileScore = resolveSmileScore(input.blendshapes)
  const blendshapeOutputAvailable = input.blendshapeOutputAvailable ?? true
  const hasLandmarks = input.hasLandmarks ?? true

  if (smileScore >= SMILE_SIGNAL_THRESHOLD) {
    return {
      signal: 'smile_like_signal',
      confidence: smileScore,
      reason: 'smile-like face motion',
      source: 'blendshape',
    }
  }

  const centeredDurationMs = normalizeDurationMs(input.centeredDurationMs)
  if (
    input.facePresence === 'present'
    && input.faceDirection === 'center'
    && normalizedQuality >= STABLE_FACE_QUALITY_THRESHOLD
    && centeredDurationMs >= STABLE_FACE_CENTERED_DURATION_MS
  ) {
    return {
      signal: 'stable_face_signal',
      confidence: confidenceFromQualityAndDuration(normalizedQuality, centeredDurationMs, STABLE_FACE_CENTERED_DURATION_MS),
      reason: 'stable face in frame',
      source: 'position',
    }
  }

  const awayDurationMs = normalizeDurationMs(input.awayDurationMs)
  if (
    input.facePresence === 'present'
    && input.faceDirection !== 'center'
    && input.faceDirection !== 'unknown'
    && awayDurationMs >= LOOKING_AWAY_DURATION_MS
  ) {
    return {
      signal: 'looking_away_signal',
      confidence: confidenceFromQualityAndDuration(
        normalizedQuality > 0 ? normalizedQuality : 0.55,
        awayDurationMs,
        LOOKING_AWAY_DURATION_MS,
      ),
      reason: 'face position away from center',
      source: 'position',
    }
  }

  if (
    input.facePresence === 'unknown'
    || normalizedQuality > 0 && normalizedQuality < UNCLEAR_QUALITY_THRESHOLD
    || (input.facePresence === 'present' && (!hasLandmarks || (!blendshapeOutputAvailable && !input.blendshapes?.length)))
  ) {
    return {
      signal: 'unclear_face_signal',
      confidence: normalizedQuality > 0 ? normalizedQuality : 0.2,
      reason: 'visual signal unclear',
      source: normalizedQuality > 0 && normalizedQuality < UNCLEAR_QUALITY_THRESHOLD ? 'quality' : 'fallback',
    }
  }

  if (isMissingCriticalInput(input)) {
    return {
      signal: 'low_confidence',
      confidence: normalizedQuality > 0 ? Math.min(0.4, normalizedQuality) : 0.15,
      reason: 'visual signal confidence is low',
      source: 'fallback',
    }
  }

  return {
    signal: 'none',
    confidence: normalizedQuality > 0 ? Math.min(0.49, normalizedQuality) : 0.3,
    reason: 'no stable expression signal',
    source: 'fallback',
  }
}

function resolveSmileScore(categories?: VisionExpressionBlendshapeCategory[]) {
  if (!Array.isArray(categories) || categories.length === 0)
    return 0

  const smileLikeCategories = new Map<string, number>()
  for (const category of categories) {
    const normalizedName = category.categoryName?.trim().toLowerCase()
    if (!normalizedName)
      continue
    smileLikeCategories.set(normalizedName, normalizeQualityScore(category.score))
  }

  const smileLeft = smileLikeCategories.get('mouthsmileleft')
    ?? smileLikeCategories.get('mouth_smile_left')
    ?? smileLikeCategories.get('smileleft')
    ?? 0
  const smileRight = smileLikeCategories.get('mouthsmileright')
    ?? smileLikeCategories.get('mouth_smile_right')
    ?? smileLikeCategories.get('smileright')
    ?? 0
  const smileGeneral = smileLikeCategories.get('smile')
    ?? smileLikeCategories.get('mouthsmile')
    ?? smileLikeCategories.get('mouth_smile')
    ?? 0

  if (smileLeft > 0 || smileRight > 0)
    return (smileLeft + smileRight) / 2
  return smileGeneral
}

function normalizeDurationMs(value?: number) {
  if (!Number.isFinite(value))
    return 0
  return Math.max(0, Number(value))
}

function normalizeQualityScore(value?: number) {
  if (!Number.isFinite(value))
    return 0
  return Math.min(1, Math.max(0, Number(value)))
}

function confidenceFromQualityAndDuration(qualityScore: number, durationMs: number, thresholdMs: number) {
  const durationFactor = Math.min(1, durationMs / thresholdMs)
  return Math.min(1, Math.max(0.3, (qualityScore * 0.7) + (durationFactor * 0.3)))
}

function isMissingCriticalInput(input: ResolveVisionExpressionSignalInput) {
  if (input.facePresence === 'present' && input.faceDirection === 'unknown')
    return true
  if (input.facePresence === 'present' && !Number.isFinite(input.qualityScore))
    return true
  return false
}
