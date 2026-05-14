import { describe, expect, it } from 'vitest'

import {
  computeLive2DFadeTriggerArea,
  computeLive2DHitArea,
  isPointInLive2DFadeTriggerArea,
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

  /** @example normal preset should remain conservative to avoid transparent-window over-capture */
  it('keeps normal preset narrower than the previous broad default baseline', () => {
    const result = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
    })

    // NOTICE:
    // Prior default profile produced roughly 0.5 * projected width (~336px in this fixture),
    // which was too broad for click-through in transparent areas.
    // After tightening, width should stay below this baseline.
    expect(result.area.width).toBeLessThan(320)
    expect(result.area.width).toBeLessThan(450)
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

  it('computes fade trigger area larger than interaction hit area', () => {
    const hit = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
    })

    const fade = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
      fadeMarginX: 36,
      fadeMarginY: 48,
    })

    expect(fade.area.width).toBeGreaterThanOrEqual(hit.area.width)
    expect(fade.area.height).toBeGreaterThanOrEqual(hit.area.height)
    expect(fade.area.left).toBeLessThanOrEqual(hit.area.left)
    expect(fade.area.right).toBeGreaterThanOrEqual(hit.area.right)
    expect(fade.area.top).toBeLessThanOrEqual(hit.area.top)
    expect(fade.area.bottom).toBeGreaterThanOrEqual(hit.area.bottom)
  })

  it('supports hit=true fade=true at hit-area center', () => {
    const hit = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'full-body',
      userScale: 1,
      zonePreset: 'normal',
    })
    const fade = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'full-body',
      userScale: 1,
      zonePreset: 'normal',
    })
    const centerPoint = {
      x: (hit.area.left + hit.area.right) / 2,
      y: (hit.area.top + hit.area.bottom) / 2,
    }

    expect(isPointInLive2DHitArea(centerPoint, hit.area)).toBe(true)
    expect(isPointInLive2DFadeTriggerArea(centerPoint, fade.area)).toBe(true)
  })

  it('supports hit=false fade=true for points in fade-margin ring', () => {
    const hit = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'upper-body',
      userScale: 1,
      zonePreset: 'normal',
    })
    const fade = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'upper-body',
      userScale: 1,
      zonePreset: 'normal',
      fadeMarginX: 36,
      fadeMarginY: 48,
    })

    const ringPoint = {
      x: Math.min(fade.area.right - 1, hit.area.right + 18),
      y: (hit.area.top + hit.area.bottom) / 2,
    }

    expect(isPointInLive2DHitArea(ringPoint, hit.area)).toBe(false)
    expect(isPointInLive2DFadeTriggerArea(ringPoint, fade.area)).toBe(true)
  })

  it('keeps upper-body fade trigger noticeably wider than interaction hit area', () => {
    const hit = computeLive2DHitArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'upper-body',
      userScale: 1,
      zonePreset: 'normal',
    })
    const fade = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'upper-body',
      userScale: 1,
      zonePreset: 'normal',
      fadeMarginX: 48,
      fadeMarginY: 60,
    })

    expect(fade.area.width).toBeGreaterThan(hit.area.width + 80)
    expect(fade.area.top).toBeLessThan(hit.area.top)
  })

  it('expands fade trigger area differently for upper-body and full-body modes', () => {
    const upperBody = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'upper-body',
      userScale: 1,
      zonePreset: 'normal',
      fadeMarginX: 48,
      fadeMarginY: 60,
    })
    const fullBody = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'full-body',
      userScale: 1,
      zonePreset: 'normal',
      fadeMarginX: 48,
      fadeMarginY: 60,
    })

    expect(upperBody.area.width).toBeGreaterThan(fullBody.area.width)
    expect(upperBody.area.top).toBeLessThanOrEqual(fullBody.area.top)
  })

  it('returns fade=false outside fade trigger area', () => {
    const fade = computeLive2DFadeTriggerArea({
      viewportWidth: 450,
      viewportHeight: 620,
      modelWidth: 1200,
      modelHeight: 2100,
      fitPreference: 'auto',
      userScale: 1,
      zonePreset: 'normal',
    })

    const outsidePoint
      = fade.area.left > 0
        ? { x: fade.area.left - 1, y: (fade.area.top + fade.area.bottom) / 2 }
        : fade.area.top > 0
          ? { x: (fade.area.left + fade.area.right) / 2, y: fade.area.top - 1 }
          : fade.area.right < 450
            ? { x: fade.area.right + 1, y: (fade.area.top + fade.area.bottom) / 2 }
            : { x: (fade.area.left + fade.area.right) / 2, y: fade.area.bottom + 1 }

    expect(isPointInLive2DFadeTriggerArea(outsidePoint, fade.area)).toBe(false)
  })

  it('keeps fade trigger area finite and clamped in all fit preferences', () => {
    const fitPreferences: Array<'auto' | 'full-body' | 'upper-body'> = ['auto', 'full-body', 'upper-body']

    for (const fitPreference of fitPreferences) {
      const fade = computeLive2DFadeTriggerArea({
        viewportWidth: 450,
        viewportHeight: 620,
        modelWidth: 1200,
        modelHeight: 2100,
        fitPreference,
        userScale: 1,
        zonePreset: 'normal',
      })

      expect(Number.isFinite(fade.area.left)).toBe(true)
      expect(Number.isFinite(fade.area.top)).toBe(true)
      expect(Number.isFinite(fade.area.right)).toBe(true)
      expect(Number.isFinite(fade.area.bottom)).toBe(true)
      expect(fade.area.left).toBeGreaterThanOrEqual(0)
      expect(fade.area.top).toBeGreaterThanOrEqual(0)
      expect(fade.area.right).toBeLessThanOrEqual(450)
      expect(fade.area.bottom).toBeLessThanOrEqual(620)
    }
  })
})
