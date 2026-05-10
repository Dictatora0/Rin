import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

import { describe, expect, it } from 'vitest'

import {
  verifyGestureGeometry,
  verifyOpenPalm,
  verifyThumbsUp,
  verifyVictory,
} from './gesture-geometry'

function createOpenPalmLandmarks(): NormalizedLandmark[] {
  return [
    { x: 0.5, y: 0.85, z: 0.01, visibility: 0 },
    { x: 0.42, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.37, y: 0.72, z: 0.01, visibility: 0 },
    { x: 0.32, y: 0.6, z: 0.01, visibility: 0 },
    { x: 0.26, y: 0.46, z: 0.01, visibility: 0 },
    { x: 0.44, y: 0.69, z: 0.01, visibility: 0 },
    { x: 0.43, y: 0.55, z: 0.01, visibility: 0 },
    { x: 0.42, y: 0.44, z: 0.01, visibility: 0 },
    { x: 0.4, y: 0.34, z: 0.01, visibility: 0 },
    { x: 0.52, y: 0.69, z: 0.01, visibility: 0 },
    { x: 0.52, y: 0.53, z: 0.01, visibility: 0 },
    { x: 0.52, y: 0.42, z: 0.01, visibility: 0 },
    { x: 0.52, y: 0.31, z: 0.01, visibility: 0 },
    { x: 0.6, y: 0.7, z: 0.01, visibility: 0 },
    { x: 0.61, y: 0.57, z: 0.01, visibility: 0 },
    { x: 0.62, y: 0.47, z: 0.01, visibility: 0 },
    { x: 0.63, y: 0.36, z: 0.01, visibility: 0 },
    { x: 0.68, y: 0.71, z: 0.01, visibility: 0 },
    { x: 0.7, y: 0.6, z: 0.01, visibility: 0 },
    { x: 0.71, y: 0.51, z: 0.01, visibility: 0 },
    { x: 0.72, y: 0.41, z: 0.01, visibility: 0 },
  ]
}

function createVictoryLandmarks(): NormalizedLandmark[] {
  return [
    { x: 0.5, y: 0.85, z: 0.01, visibility: 0 },
    { x: 0.43, y: 0.79, z: 0.01, visibility: 0 },
    { x: 0.38, y: 0.74, z: 0.01, visibility: 0 },
    { x: 0.34, y: 0.68, z: 0.01, visibility: 0 },
    { x: 0.3, y: 0.63, z: 0.01, visibility: 0 },
    { x: 0.35, y: 0.68, z: 0.01, visibility: 0 },
    { x: 0.3, y: 0.52, z: 0.01, visibility: 0 },
    { x: 0.27, y: 0.43, z: 0.01, visibility: 0 },
    { x: 0.24, y: 0.33, z: 0.01, visibility: 0 },
    { x: 0.65, y: 0.68, z: 0.01, visibility: 0 },
    { x: 0.7, y: 0.52, z: 0.01, visibility: 0 },
    { x: 0.73, y: 0.43, z: 0.01, visibility: 0 },
    { x: 0.76, y: 0.33, z: 0.01, visibility: 0 },
    { x: 0.58, y: 0.7, z: 0.01, visibility: 0 },
    { x: 0.6, y: 0.76, z: 0.01, visibility: 0 },
    { x: 0.61, y: 0.8, z: 0.01, visibility: 0 },
    { x: 0.62, y: 0.84, z: 0.01, visibility: 0 },
    { x: 0.66, y: 0.72, z: 0.01, visibility: 0 },
    { x: 0.69, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.71, y: 0.82, z: 0.01, visibility: 0 },
    { x: 0.72, y: 0.86, z: 0.01, visibility: 0 },
  ]
}

function createThumbsUpLandmarks(): NormalizedLandmark[] {
  return [
    { x: 0.5, y: 0.85, z: 0.01, visibility: 0 },
    { x: 0.44, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.4, y: 0.72, z: 0.01, visibility: 0 },
    { x: 0.34, y: 0.58, z: 0.01, visibility: 0 },
    { x: 0.27, y: 0.4, z: 0.01, visibility: 0 },
    { x: 0.46, y: 0.69, z: 0.01, visibility: 0 },
    { x: 0.46, y: 0.75, z: 0.01, visibility: 0 },
    { x: 0.46, y: 0.79, z: 0.01, visibility: 0 },
    { x: 0.46, y: 0.83, z: 0.01, visibility: 0 },
    { x: 0.53, y: 0.69, z: 0.01, visibility: 0 },
    { x: 0.53, y: 0.76, z: 0.01, visibility: 0 },
    { x: 0.53, y: 0.8, z: 0.01, visibility: 0 },
    { x: 0.53, y: 0.84, z: 0.01, visibility: 0 },
    { x: 0.6, y: 0.7, z: 0.01, visibility: 0 },
    { x: 0.61, y: 0.77, z: 0.01, visibility: 0 },
    { x: 0.62, y: 0.81, z: 0.01, visibility: 0 },
    { x: 0.63, y: 0.85, z: 0.01, visibility: 0 },
    { x: 0.67, y: 0.72, z: 0.01, visibility: 0 },
    { x: 0.69, y: 0.78, z: 0.01, visibility: 0 },
    { x: 0.7, y: 0.83, z: 0.01, visibility: 0 },
    { x: 0.71, y: 0.87, z: 0.01, visibility: 0 },
  ]
}

describe('gesture geometry verification', () => {
  /** @example open palm must pass conservative geometry constraints */
  it('accepts valid open_palm landmarks', () => {
    const result = verifyOpenPalm(createOpenPalmLandmarks(), { handedness: 'right' })
    expect(result).toBe(true)
  })

  /** @example incomplete landmarks must be rejected safely */
  it('rejects open_palm landmarks when inputs are incomplete', () => {
    const result = verifyOpenPalm(createOpenPalmLandmarks().slice(0, 12), { handedness: 'right' })
    expect(result).toBe(false)
  })

  /** @example victory requires two extended fingers and folded ring/pinky */
  it('accepts valid victory landmarks', () => {
    const result = verifyVictory(createVictoryLandmarks())
    expect(result).toBe(true)
  })

  /** @example victory must fail when ring finger is fully extended */
  it('rejects victory when finger geometry does not match', () => {
    const invalid = createVictoryLandmarks()
    invalid[14] = { ...invalid[14], y: 0.55 }
    invalid[15] = { ...invalid[15], y: 0.45 }
    invalid[16] = { ...invalid[16], y: 0.35 }
    const result = verifyVictory(invalid)
    expect(result).toBe(false)
  })

  /** @example thumbs-up should pass with curled non-thumb fingers */
  it('accepts valid thumbs_up landmarks', () => {
    const result = verifyThumbsUp(createThumbsUpLandmarks(), { handedness: 'right' })
    expect(result).toBe(true)
  })

  /** @example thumbs-up fails when non-thumb fingers are extended */
  it('rejects thumbs_up when folded finger constraints fail', () => {
    const invalid = createThumbsUpLandmarks()
    invalid[6] = { ...invalid[6], y: 0.55 }
    invalid[7] = { ...invalid[7], y: 0.46 }
    invalid[8] = { ...invalid[8], y: 0.34 }
    const result = verifyThumbsUp(invalid, { handedness: 'right' })
    expect(result).toBe(false)
  })

  /** @example dispatcher should route to requested geometry verifier */
  it('dispatches through verifyGestureGeometry safely', () => {
    expect(verifyGestureGeometry('open_palm', createOpenPalmLandmarks(), { handedness: 'right' })).toBe(true)
    expect(verifyGestureGeometry('victory', null)).toBe(false)
    expect(verifyGestureGeometry('thumbs_up', createThumbsUpLandmarks(), { handedness: 'right' })).toBe(true)
  })
})
