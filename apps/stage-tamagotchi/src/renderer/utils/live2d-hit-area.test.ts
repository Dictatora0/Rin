import { describe, expect, it } from 'vitest'

import {
  computeLive2DHitArea,
  isPointInLive2DHitArea,
} from './live2d-hit-area'

describe('live2d hit area geometry', () => {
  /** @example hit area stays narrower than full window and is clamped to viewport */
  it('computes a character-focused hit area instead of full transparent window', () => {
    const result = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
    })

    expect(result.area.width).toBeGreaterThan(0)
    expect(result.area.height).toBeGreaterThan(0)
    expect(result.area.width).toBeLessThan(450)
    expect(result.area.height).toBeLessThanOrEqual(620)
    expect(result.area.left).toBeGreaterThanOrEqual(0)
    expect(result.area.top).toBeGreaterThanOrEqual(0)
    expect(result.area.right).toBeLessThanOrEqual(450)
    expect(result.area.bottom).toBeLessThanOrEqual(620)
  })

  /** @example stricter preset should be narrower than looser preset */
  it('applies preset density to hit area width', () => {
    const precise = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'precise',
    })

    const loose = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'loose',
    })

    expect(precise.area.width).toBeLessThan(loose.area.width)
  })

  /** @example point-in-rect checks should be deterministic for click-through decisions */
  it('checks whether a point is inside the computed hit area', () => {
    const { area } = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
    })

    const centerPoint = {
      x: (area.left + area.right) / 2,
      y: (area.top + area.bottom) / 2,
    }

    const outsidePoint = {
      x: Math.min(449, area.right + 12),
      y: Math.min(619, area.bottom + 12),
    }

    expect(isPointInLive2DHitArea(centerPoint, area)).toBe(true)
    expect(isPointInLive2DHitArea(outsidePoint, area)).toBe(false)
  })
})
