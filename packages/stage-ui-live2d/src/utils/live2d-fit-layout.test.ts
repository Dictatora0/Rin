import { describe, expect, it } from 'vitest'

import {
  computeLive2DFitLayout,
  resolveLive2DAutoFitMode,
} from './live2d-fit-layout'

describe('resolveLive2DAutoFitMode', () => {
  it('returns tall mode for high viewport', () => {
    expect(resolveLive2DAutoFitMode(720)).toBe('tall')
  })

  it('returns normal mode for medium viewport', () => {
    expect(resolveLive2DAutoFitMode(600)).toBe('normal')
  })

  it('returns small mode for low viewport', () => {
    expect(resolveLive2DAutoFitMode(460)).toBe('small')
  })
})

describe('computeLive2DFitLayout', () => {
  it('uses full-body friendly placement in tall viewport', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 480,
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

  it('keeps a head-safe placement in small viewport', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 380,
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
    expect(Number.isFinite(layout.scale)).toBe(true)
  })

  it('uses explicit full-body fit preference when selected', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(layout.mode).toBe('full-body')
    expect(layout.resolvedFitMode).toBe('full-body')
    expect(Number.isFinite(layout.scale)).toBe(true)
    expect(Number.isFinite(layout.x)).toBe(true)
    expect(Number.isFinite(layout.y)).toBe(true)
  })

  it('uses explicit upper-body fit preference when selected', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'upper-body',
      userScale: 1,
    })

    expect(layout.mode).toBe('upper-body')
    expect(layout.resolvedFitMode).toBe('upper-body')
    expect(Number.isFinite(layout.scale)).toBe(true)
    expect(Number.isFinite(layout.x)).toBe(true)
    expect(Number.isFinite(layout.y)).toBe(true)
  })

  it('keeps full-body preference safe in small viewport', () => {
    const layout = computeLive2DFitLayout({
      viewportWidth: 320,
      viewportHeight: 380,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(layout.mode).toBe('full-body')
    expect(layout.resolvedFitMode).toBe('full-body')
    expect(layout.y).toBeGreaterThan(0)
    expect(layout.y).toBeLessThan(380)
    expect(Number.isFinite(layout.scale)).toBe(true)
  })
})
