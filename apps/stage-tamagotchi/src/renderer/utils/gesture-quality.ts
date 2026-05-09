import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type GestureQualityState
  = | 'good'
    | 'too_far'
    | 'out_of_frame'
    | 'too_fast'
    | 'low_confidence'
    | 'unknown'

export interface GestureGuideArea {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface GestureQualityThresholds {
  minHandSizeRatio: number
  minConfidence: number
  maxMotionSpeedPerSec: number
  minLandmarkCount: number
  guideArea: GestureGuideArea
}

export interface GestureQualityPoint {
  x: number
  y: number
}

export interface GestureQualityInput {
  landmarks: NormalizedLandmark[] | null | undefined
  confidence: number | null | undefined
  nowMs: number
  previousHandCenter?: GestureQualityPoint | null
  previousTimestampMs?: number | null
  thresholds?: Partial<GestureQualityThresholds>
}

export interface GestureQualityAssessment {
  handSizeRatio: number
  handCenter: GestureQualityPoint | null
  handInsideGuideArea: boolean
  landmarkCompleteness: number
  gestureConfidence: number
  handMotionSpeed: number
  qualityState: GestureQualityState
}

/**
 * Balanced quality thresholds for experimental gesture controls.
 *
 * Use when:
 * - Evaluating whether a per-frame gesture sample is usable for voting.
 * - Providing user-facing calibration diagnostics in Vision Island.
 *
 * Expects:
 * - Landmarks in normalized MediaPipe space (`x`/`y` roughly in `[0, 1]`).
 *
 * Returns:
 * - Threshold bundle that favors robustness over aggressive triggering.
 */
export const DEFAULT_GESTURE_QUALITY_THRESHOLDS: GestureQualityThresholds = {
  minHandSizeRatio: 0.018,
  minConfidence: 0.7,
  maxMotionSpeedPerSec: 1.25,
  minLandmarkCount: 21,
  guideArea: {
    minX: 0.18,
    maxX: 0.82,
    minY: 0.18,
    maxY: 0.82,
  },
}

function finiteOrZero(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

function isFiniteCoordinate(value: number | null | undefined) {
  return Number.isFinite(value)
}

function clamp01(value: number) {
  if (value <= 0)
    return 0
  if (value >= 1)
    return 1
  return value
}

function mergeThresholds(overrides?: Partial<GestureQualityThresholds>): GestureQualityThresholds {
  if (!overrides)
    return DEFAULT_GESTURE_QUALITY_THRESHOLDS

  return {
    ...DEFAULT_GESTURE_QUALITY_THRESHOLDS,
    ...overrides,
    guideArea: {
      ...DEFAULT_GESTURE_QUALITY_THRESHOLDS.guideArea,
      ...overrides.guideArea,
    },
  }
}

/**
 * Evaluates per-frame hand sample quality for robust gesture recognition.
 *
 * Use when:
 * - Building gesture voting inputs.
 * - Explaining why a gesture did not trigger in diagnostics UI.
 *
 * Expects:
 * - Monotonic `nowMs` in the caller loop.
 * - Optional previous hand center/timestamp from the last processed frame.
 *
 * Returns:
 * - Normalized quality metrics and a deterministic `qualityState`.
 */
export function assessGestureQuality(input: GestureQualityInput): GestureQualityAssessment {
  const thresholds = mergeThresholds(input.thresholds)
  const confidence = finiteOrZero(input.confidence)
  const landmarks = Array.isArray(input.landmarks) ? input.landmarks : []

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let validCount = 0

  for (const landmark of landmarks) {
    if (!isFiniteCoordinate(landmark?.x) || !isFiniteCoordinate(landmark?.y))
      continue

    validCount += 1
    minX = Math.min(minX, landmark.x)
    maxX = Math.max(maxX, landmark.x)
    minY = Math.min(minY, landmark.y)
    maxY = Math.max(maxY, landmark.y)
  }

  const expectedLandmarkCount = Math.max(1, thresholds.minLandmarkCount)
  const landmarkCompleteness = clamp01(validCount / expectedLandmarkCount)
  const hasValidBounds = validCount > 0
    && Number.isFinite(minX)
    && Number.isFinite(maxX)
    && Number.isFinite(minY)
    && Number.isFinite(maxY)

  const handCenter = hasValidBounds
    ? {
        x: clamp01((minX + maxX) / 2),
        y: clamp01((minY + maxY) / 2),
      }
    : null

  const handSizeRatio = hasValidBounds
    ? Math.max(0, (maxX - minX) * (maxY - minY))
    : 0

  const handInsideGuideArea = handCenter
    ? handCenter.x >= thresholds.guideArea.minX
    && handCenter.x <= thresholds.guideArea.maxX
    && handCenter.y >= thresholds.guideArea.minY
    && handCenter.y <= thresholds.guideArea.maxY
    : false

  const hasPreviousPoint = Boolean(input.previousHandCenter)
    && Number.isFinite(input.previousHandCenter?.x)
    && Number.isFinite(input.previousHandCenter?.y)
  const hasPreviousTimestamp = Number.isFinite(input.previousTimestampMs)
    && Number(input.previousTimestampMs) >= 0

  let handMotionSpeed = 0
  if (handCenter && hasPreviousPoint && hasPreviousTimestamp && Number.isFinite(input.nowMs) && input.nowMs > Number(input.previousTimestampMs)) {
    const previous = input.previousHandCenter as GestureQualityPoint
    const deltaSeconds = (input.nowMs - Number(input.previousTimestampMs)) / 1000
    if (deltaSeconds > 0) {
      const deltaDistance = Math.hypot(handCenter.x - previous.x, handCenter.y - previous.y)
      handMotionSpeed = deltaDistance / deltaSeconds
    }
  }

  let qualityState: GestureQualityState = 'good'
  if (!handCenter || landmarkCompleteness < 1 || validCount < thresholds.minLandmarkCount) {
    qualityState = 'unknown'
  }
  else if (handSizeRatio < thresholds.minHandSizeRatio) {
    qualityState = 'too_far'
  }
  else if (!handInsideGuideArea) {
    qualityState = 'out_of_frame'
  }
  else if (confidence < thresholds.minConfidence) {
    qualityState = 'low_confidence'
  }
  else if (handMotionSpeed > thresholds.maxMotionSpeedPerSec) {
    qualityState = 'too_fast'
  }

  return {
    handSizeRatio,
    handCenter,
    handInsideGuideArea,
    landmarkCompleteness,
    gestureConfidence: confidence,
    handMotionSpeed,
    qualityState,
  }
}
