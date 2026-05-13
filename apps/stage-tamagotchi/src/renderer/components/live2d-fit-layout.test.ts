import { describe, expect, it } from 'vitest'

import {
  computeLive2DFitLayout,
  resolveLive2DAutoFitMode,
} from '../../../../../packages/stage-ui-live2d/src/utils/live2d-fit-layout'

describe('live2d fit mode', () => {
  it('uses tall mode for high viewport', () => {
    expect(resolveLive2DAutoFitMode(800)).toBe('tall')
  })

  it('uses normal mode for medium viewport', () => {
    expect(resolveLive2DAutoFitMode(600)).toBe('normal')
  })

  it('uses small mode for low viewport', () => {
    expect(resolveLive2DAutoFitMode(460)).toBe('small')
  })

  it('keeps model y inside viewport in tall mode', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 820,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'auto',
      userScale: 1,
    })

    expect(layout.mode).toBe('tall')
    expect(layout.resolvedFitMode).toBe('tall')
    expect(layout.y).toBeGreaterThan(0)
    expect(layout.y).toBeLessThan(820)
    expect(Number.isFinite(layout.scale)).toBe(true)
  })

  it('uses legacy upper-body framing for auto small', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 360,
      viewportHeight: 460,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'auto',
      userScale: 1,
    })

    expect(layout.mode).toBe('small')
    expect(layout.resolvedFitMode).toBe('small')
    expect(layout.y).toBe(460)
    expect(Number.isFinite(layout.scale)).toBe(true)
  })

  it('keeps auto normal as upper-body leaning framing', () => {
    const autoNormal = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 600,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'auto',
      userScale: 1,
    })
    const fullBody = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 600,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(autoNormal.mode).toBe('normal')
    expect(autoNormal.resolvedFitMode).toBe('normal')
    expect(autoNormal.y).toBe(600)
    expect(autoNormal.scale).toBeGreaterThan(fullBody.scale)
    expect(autoNormal.y).toBeGreaterThan(fullBody.y)
  })

  it('returns full-body resolved mode for explicit full-body preference', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 820,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(layout.mode).toBe('full-body')
    expect(layout.resolvedFitMode).toBe('full-body')
    expect(layout.y).toBeLessThan(820)
    expect(Number.isFinite(layout.scale)).toBe(true)
  })

  it('returns explicit upper-body preference with stronger upper-body framing', () => {
    const upperBody = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 820,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'upper-body',
      userScale: 1,
    })
    const fullBody = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 820,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(upperBody.mode).toBe('upper-body')
    expect(upperBody.resolvedFitMode).toBe('upper-body')
    expect(upperBody.y).toBe(820)
    expect(upperBody.scale).toBeGreaterThan(fullBody.scale)
    expect(upperBody.y).toBeGreaterThan(fullBody.y)
  })
})
