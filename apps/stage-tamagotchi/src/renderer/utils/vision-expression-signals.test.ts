import { describe, expect, it } from 'vitest'

import { resolveVisionExpressionSignal } from './vision-expression-signals'

function createBlendshape(categoryName: string, score: number) {
  return { categoryName, score }
}

describe('resolveVisionExpressionSignal', () => {
  it('returns smile_like_signal when smile blendshape average is above threshold', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [
        createBlendshape('mouthSmileLeft', 0.52),
        createBlendshape('mouthSmileRight', 0.48),
      ],
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.9,
      centeredDurationMs: 3_500,
    })

    expect(result.signal).toBe('smile_like_signal')
    expect(result.reason).toBe('smile-like face motion')
    expect(result.source).toBe('blendshape')
    expect(result.confidence).toBe(0.5)
  })

  it('returns none (not smile_like_signal) when smile score is below threshold without other qualifying signals', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [
        createBlendshape('mouthSmileLeft', 0.2),
        createBlendshape('mouthSmileRight', 0.21),
      ],
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.8,
      centeredDurationMs: 1_000,
    })

    expect(result.signal).toBe('none')
    expect(result.reason).toBe('no stable expression signal')
    expect(result.source).toBe('fallback')
    expect(result.confidence).toBe(0.49)
  })

  it('returns stable_face_signal for centered present face with stable duration and quality', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.78,
      centeredDurationMs: 3_200,
      awayDurationMs: 0,
    })

    expect(result.signal).toBe('stable_face_signal')
    expect(result.reason).toBe('stable face in frame')
    expect(result.source).toBe('position')
    expect(result.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('returns looking_away_signal when non-center direction stays long enough', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'present',
      faceDirection: 'left',
      qualityScore: 0.72,
      awayDurationMs: 5_100,
      centeredDurationMs: 0,
    })

    expect(result.signal).toBe('looking_away_signal')
    expect(result.reason).toBe('face position away from center')
    expect(result.source).toBe('position')
  })

  it('returns unclear_face_signal when quality score is too low', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.2,
      centeredDurationMs: 5_000,
    })

    expect(result.signal).toBe('unclear_face_signal')
    expect(result.reason).toBe('visual signal unclear')
    expect(result.source).toBe('quality')
  })

  it('returns unclear_face_signal when face presence is unknown', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'unknown',
      faceDirection: 'unknown',
      qualityScore: 0.6,
    })

    expect(result.signal).toBe('unclear_face_signal')
    expect(result.reason).toBe('visual signal unclear')
  })

  it('returns unclear_face_signal when landmarks are unavailable for present face', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      blendshapeOutputAvailable: false,
      hasLandmarks: false,
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.8,
    })

    expect(result.signal).toBe('unclear_face_signal')
    expect(result.source).toBe('fallback')
  })

  it('returns low_confidence when critical fields are missing for present face', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'present',
      faceDirection: 'unknown',
      qualityScore: undefined,
    })

    expect(result.signal).toBe('low_confidence')
    expect(result.reason).toBe('visual signal confidence is low')
  })

  it('returns none when face is absent', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [],
      facePresence: 'absent',
      faceDirection: 'unknown',
      qualityScore: 0.1,
    })

    expect(result.signal).toBe('none')
    expect(result.reason).toBe('no face present')
    expect(result.confidence).toBe(0)
  })

  it('does not throw for malformed blendshape values', () => {
    const result = resolveVisionExpressionSignal({
      blendshapes: [
        createBlendshape('mouthSmileLeft', Number.NaN),
        createBlendshape('mouthSmileRight', Number.POSITIVE_INFINITY),
      ],
      facePresence: 'present',
      faceDirection: 'center',
      qualityScore: 0.7,
      centeredDurationMs: 2_000,
    })

    expect(result.signal).toBe('none')
    expect(result.reason).toBe('no stable expression signal')
    expect(result.source).toBe('fallback')
    expect(result.confidence).toBe(0.49)
  })
})
