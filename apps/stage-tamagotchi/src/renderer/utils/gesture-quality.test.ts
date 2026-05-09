import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

import { describe, expect, it } from 'vitest'

import { assessGestureQuality, DEFAULT_GESTURE_QUALITY_THRESHOLDS } from './gesture-quality'

function createHandLandmarks(options: {
  centerX: number
  centerY: number
  width: number
  height: number
}) {
  const minX = options.centerX - (options.width / 2)
  const maxX = options.centerX + (options.width / 2)
  const minY = options.centerY - (options.height / 2)
  const maxY = options.centerY + (options.height / 2)

  const points: NormalizedLandmark[] = []
  for (let index = 0; index < 21; index += 1) {
    const x = minX + ((maxX - minX) * (index % 7) / 6)
    const y = minY + ((maxY - minY) * Math.floor(index / 7) / 2)
    points.push({ x, y, z: 0.01, visibility: 0 })
  }
  return points
}

describe('assessGestureQuality', () => {
  /** @example hand is too small for reliable gesture recognition */
  it('returns too_far when hand size ratio is below threshold', () => {
    const landmarks = createHandLandmarks({
      centerX: 0.5,
      centerY: 0.5,
      width: 0.08,
      height: 0.08,
    })

    const result = assessGestureQuality({
      landmarks,
      confidence: 0.95,
      nowMs: 1_000,
    })

    expect(result.qualityState).toBe('too_far')
    expect(result.handInsideGuideArea).toBe(true)
    expect(result.handSizeRatio).toBeLessThan(DEFAULT_GESTURE_QUALITY_THRESHOLDS.minHandSizeRatio)
  })

  /** @example hand center leaves the configured guide area */
  it('returns out_of_frame when hand center is outside guide area', () => {
    const landmarks = createHandLandmarks({
      centerX: 0.1,
      centerY: 0.5,
      width: 0.24,
      height: 0.24,
    })

    const result = assessGestureQuality({
      landmarks,
      confidence: 0.94,
      nowMs: 1_000,
    })

    expect(result.qualityState).toBe('out_of_frame')
    expect(result.handInsideGuideArea).toBe(false)
    expect(result.handSizeRatio).toBeGreaterThan(DEFAULT_GESTURE_QUALITY_THRESHOLDS.minHandSizeRatio)
  })

  /** @example classifier confidence drops below required threshold */
  it('returns low_confidence when score is below threshold', () => {
    const landmarks = createHandLandmarks({
      centerX: 0.5,
      centerY: 0.5,
      width: 0.24,
      height: 0.24,
    })

    const result = assessGestureQuality({
      landmarks,
      confidence: 0.45,
      nowMs: 1_000,
    })

    expect(result.qualityState).toBe('low_confidence')
    expect(result.gestureConfidence).toBe(0.45)
  })

  /** @example fast hand movement is rejected to avoid accidental triggers */
  it('returns too_fast when hand motion speed exceeds threshold', () => {
    const landmarks = createHandLandmarks({
      centerX: 0.8,
      centerY: 0.5,
      width: 0.24,
      height: 0.24,
    })

    const result = assessGestureQuality({
      landmarks,
      confidence: 0.92,
      nowMs: 1_100,
      previousHandCenter: { x: 0.2, y: 0.5 },
      previousTimestampMs: 1_000,
    })

    expect(result.qualityState).toBe('too_fast')
    expect(result.handMotionSpeed).toBeGreaterThan(DEFAULT_GESTURE_QUALITY_THRESHOLDS.maxMotionSpeedPerSec)
  })

  /** @example high-quality stable input should pass all gates */
  it('returns good for stable, in-frame, high-confidence samples', () => {
    const landmarks = createHandLandmarks({
      centerX: 0.5,
      centerY: 0.5,
      width: 0.28,
      height: 0.28,
    })

    const result = assessGestureQuality({
      landmarks,
      confidence: 0.93,
      nowMs: 1_500,
      previousHandCenter: { x: 0.48, y: 0.5 },
      previousTimestampMs: 1_300,
    })

    expect(result.qualityState).toBe('good')
    expect(result.handInsideGuideArea).toBe(true)
    expect(result.landmarkCompleteness).toBe(1)
    expect(result.handSizeRatio).toBeGreaterThan(DEFAULT_GESTURE_QUALITY_THRESHOLDS.minHandSizeRatio)
    expect(result.handMotionSpeed).toBeLessThan(DEFAULT_GESTURE_QUALITY_THRESHOLDS.maxMotionSpeedPerSec)
  })
})
