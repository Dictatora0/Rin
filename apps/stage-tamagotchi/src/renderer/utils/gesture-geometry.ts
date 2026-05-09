import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export type GeometryGesture = 'open_palm' | 'victory' | 'thumbs_up'
export type GestureHandedness = 'left' | 'right' | 'unknown'

export interface GestureGeometryOptions {
  handedness?: GestureHandedness
}

const HAND = {
  wrist: 0,
  thumbMcp: 2,
  thumbIp: 3,
  thumbTip: 4,
  indexMcp: 5,
  indexPip: 6,
  indexTip: 8,
  middleMcp: 9,
  middlePip: 10,
  middleTip: 12,
  ringMcp: 13,
  ringPip: 14,
  ringTip: 16,
  pinkyMcp: 17,
  pinkyPip: 18,
  pinkyTip: 20,
} as const

function isFinitePoint(point: NormalizedLandmark | null | undefined) {
  return Boolean(point)
    && Number.isFinite(point?.x)
    && Number.isFinite(point?.y)
}

function getPoint(landmarks: NormalizedLandmark[], index: number) {
  const point = landmarks[index]
  return isFinitePoint(point) ? point : null
}

function distance2d(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getBoundingArea(landmarks: NormalizedLandmark[]) {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const point of landmarks) {
    if (!isFinitePoint(point))
      continue
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY))
    return 0
  return Math.max(0, (maxX - minX) * (maxY - minY))
}

function validateLandmarks(landmarks: NormalizedLandmark[] | null | undefined) {
  if (!Array.isArray(landmarks) || landmarks.length < 21)
    return null

  const required = [
    HAND.wrist,
    HAND.thumbMcp,
    HAND.thumbIp,
    HAND.thumbTip,
    HAND.indexMcp,
    HAND.indexPip,
    HAND.indexTip,
    HAND.middleMcp,
    HAND.middlePip,
    HAND.middleTip,
    HAND.ringMcp,
    HAND.ringPip,
    HAND.ringTip,
    HAND.pinkyMcp,
    HAND.pinkyPip,
    HAND.pinkyTip,
  ]

  for (const index of required) {
    if (!isFinitePoint(landmarks[index]))
      return null
  }
  return landmarks
}

function isFingerExtended(landmarks: NormalizedLandmark[], tipIndex: number, pipIndex: number, mcpIndex: number) {
  const tip = getPoint(landmarks, tipIndex)
  const pip = getPoint(landmarks, pipIndex)
  const mcp = getPoint(landmarks, mcpIndex)
  const wrist = getPoint(landmarks, HAND.wrist)
  if (!tip || !pip || !mcp || !wrist)
    return false

  const tipToWrist = distance2d(tip, wrist)
  const pipToWrist = distance2d(pip, wrist)
  const mcpToWrist = distance2d(mcp, wrist)

  return tipToWrist > pipToWrist * 1.08
    && tipToWrist > mcpToWrist * 1.15
    && tip.y < pip.y
}

function isFingerCurled(landmarks: NormalizedLandmark[], tipIndex: number, pipIndex: number, mcpIndex: number) {
  const tip = getPoint(landmarks, tipIndex)
  const pip = getPoint(landmarks, pipIndex)
  const mcp = getPoint(landmarks, mcpIndex)
  const wrist = getPoint(landmarks, HAND.wrist)
  if (!tip || !pip || !mcp || !wrist)
    return false

  const tipToWrist = distance2d(tip, wrist)
  const pipToWrist = distance2d(pip, wrist)
  const verticalCurl = tip.y > pip.y && pip.y > mcp.y
  const compactCurl = tipToWrist < pipToWrist * 1.02
  return verticalCurl || compactCurl
}

function isThumbExtended(landmarks: NormalizedLandmark[], handedness: GestureHandedness) {
  const thumbTip = getPoint(landmarks, HAND.thumbTip)
  const thumbIp = getPoint(landmarks, HAND.thumbIp)
  const thumbMcp = getPoint(landmarks, HAND.thumbMcp)
  const wrist = getPoint(landmarks, HAND.wrist)
  const indexMcp = getPoint(landmarks, HAND.indexMcp)
  if (!thumbTip || !thumbIp || !thumbMcp || !wrist || !indexMcp)
    return false

  const raisedByY = thumbTip.y < thumbIp.y && thumbIp.y < thumbMcp.y
  const awayFromPalm = distance2d(thumbTip, wrist) > distance2d(thumbMcp, wrist) * 1.18
  const horizontalByHandedness = handedness === 'right'
    ? thumbTip.x < thumbMcp.x
    : handedness === 'left'
      ? thumbTip.x > thumbMcp.x
      : true
  const separatedFromIndex = distance2d(thumbTip, indexMcp) > distance2d(thumbMcp, indexMcp) * 1.05
  return raisedByY && awayFromPalm && horizontalByHandedness && separatedFromIndex
}

/**
 * Verifies whether landmarks represent a conservative open-palm gesture.
 *
 * Use when:
 * - The classifier returned `open_palm` and a geometric second check is required.
 *
 * Expects:
 * - A complete MediaPipe hand landmark array (length >= 21).
 *
 * Returns:
 * - `true` only when all fingers are clearly extended with enough hand spread.
 */
export function verifyOpenPalm(
  landmarksInput: NormalizedLandmark[] | null | undefined,
  options?: GestureGeometryOptions,
) {
  const landmarks = validateLandmarks(landmarksInput)
  if (!landmarks)
    return false

  const handedness = options?.handedness ?? 'unknown'
  const indexExtended = isFingerExtended(landmarks, HAND.indexTip, HAND.indexPip, HAND.indexMcp)
  const middleExtended = isFingerExtended(landmarks, HAND.middleTip, HAND.middlePip, HAND.middleMcp)
  const ringExtended = isFingerExtended(landmarks, HAND.ringTip, HAND.ringPip, HAND.ringMcp)
  const pinkyExtended = isFingerExtended(landmarks, HAND.pinkyTip, HAND.pinkyPip, HAND.pinkyMcp)
  const thumbExtended = isThumbExtended(landmarks, handedness)

  if (!indexExtended || !middleExtended || !ringExtended || !pinkyExtended || !thumbExtended)
    return false

  const handArea = getBoundingArea(landmarks)
  if (handArea < 0.014)
    return false

  const indexTip = getPoint(landmarks, HAND.indexTip)
  const middleTip = getPoint(landmarks, HAND.middleTip)
  const ringTip = getPoint(landmarks, HAND.ringTip)
  const pinkyTip = getPoint(landmarks, HAND.pinkyTip)
  if (!indexTip || !middleTip || !ringTip || !pinkyTip)
    return false

  const tipSpread = distance2d(indexTip, middleTip) + distance2d(middleTip, ringTip) + distance2d(ringTip, pinkyTip)
  return tipSpread >= 0.14
}

/**
 * Verifies whether landmarks represent a conservative victory gesture.
 *
 * Use when:
 * - The classifier returned `victory` and we need to filter false positives.
 *
 * Expects:
 * - Complete landmark points with visible index/middle/ring/pinky tips.
 *
 * Returns:
 * - `true` only when index/middle are extended and ring/pinky are curled.
 */
export function verifyVictory(landmarksInput: NormalizedLandmark[] | null | undefined) {
  const landmarks = validateLandmarks(landmarksInput)
  if (!landmarks)
    return false

  const indexExtended = isFingerExtended(landmarks, HAND.indexTip, HAND.indexPip, HAND.indexMcp)
  const middleExtended = isFingerExtended(landmarks, HAND.middleTip, HAND.middlePip, HAND.middleMcp)
  const ringCurled = isFingerCurled(landmarks, HAND.ringTip, HAND.ringPip, HAND.ringMcp)
  const pinkyCurled = isFingerCurled(landmarks, HAND.pinkyTip, HAND.pinkyPip, HAND.pinkyMcp)

  if (!indexExtended || !middleExtended || !ringCurled || !pinkyCurled)
    return false

  const indexTip = getPoint(landmarks, HAND.indexTip)
  const middleTip = getPoint(landmarks, HAND.middleTip)
  const ringTip = getPoint(landmarks, HAND.ringTip)
  const pinkyTip = getPoint(landmarks, HAND.pinkyTip)
  if (!indexTip || !middleTip || !ringTip || !pinkyTip)
    return false

  const splitDistance = distance2d(indexTip, middleTip)
  const ringDistance = distance2d(ringTip, middleTip)
  return splitDistance > 0.05 && splitDistance > ringDistance * 0.85
}

/**
 * Verifies whether landmarks represent a conservative thumbs-up gesture.
 *
 * Use when:
 * - The classifier returned `thumbs_up` and gesture-trigger safety matters more than recall.
 *
 * Expects:
 * - Complete landmark points and optional handedness hint.
 *
 * Returns:
 * - `true` only when thumb is clearly raised and the other fingers stay curled.
 */
export function verifyThumbsUp(
  landmarksInput: NormalizedLandmark[] | null | undefined,
  options?: GestureGeometryOptions,
) {
  const landmarks = validateLandmarks(landmarksInput)
  if (!landmarks)
    return false

  const handedness = options?.handedness ?? 'unknown'
  const thumbExtended = isThumbExtended(landmarks, handedness)
  if (!thumbExtended)
    return false

  const indexCurled = isFingerCurled(landmarks, HAND.indexTip, HAND.indexPip, HAND.indexMcp)
  const middleCurled = isFingerCurled(landmarks, HAND.middleTip, HAND.middlePip, HAND.middleMcp)
  const ringCurled = isFingerCurled(landmarks, HAND.ringTip, HAND.ringPip, HAND.ringMcp)
  const pinkyCurled = isFingerCurled(landmarks, HAND.pinkyTip, HAND.pinkyPip, HAND.pinkyMcp)
  if (!indexCurled || !middleCurled || !ringCurled || !pinkyCurled)
    return false

  const thumbTip = getPoint(landmarks, HAND.thumbTip)
  const indexMcp = getPoint(landmarks, HAND.indexMcp)
  if (!thumbTip || !indexMcp)
    return false

  return thumbTip.y < indexMcp.y - 0.03
}

/**
 * Runs geometry validation for one of the supported experimental gestures.
 *
 * Use when:
 * - Mapping classifier candidates to trigger-eligible gesture samples.
 *
 * Expects:
 * - `gesture` to be one of the supported three categories.
 *
 * Returns:
 * - `true` when the geometry check passes for the requested gesture.
 */
export function verifyGestureGeometry(
  gesture: GeometryGesture,
  landmarks: NormalizedLandmark[] | null | undefined,
  options?: GestureGeometryOptions,
) {
  if (gesture === 'open_palm')
    return verifyOpenPalm(landmarks, options)
  if (gesture === 'victory')
    return verifyVictory(landmarks)
  return verifyThumbsUp(landmarks, options)
}
