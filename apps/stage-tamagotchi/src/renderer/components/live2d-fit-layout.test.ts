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
  })

  it('keeps model y inside viewport in small mode', () => {
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
    expect(layout.y).toBeGreaterThan(0)
    expect(layout.y).toBeLessThan(460)
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
  })

  it('returns upper-body resolved mode for explicit upper-body preference', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 450,
      viewportHeight: 820,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'upper-body',
      userScale: 1,
    })

    expect(layout.mode).toBe('upper-body')
    expect(layout.resolvedFitMode).toBe('upper-body')
  })
})
