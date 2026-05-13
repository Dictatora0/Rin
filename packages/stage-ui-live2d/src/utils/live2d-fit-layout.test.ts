import { describe, expect, it } from 'vitest'

import {
  computeLive2DFitLayout,
  resolveLive2DAutoFitMode,
} from './live2d-fit-layout'

function assertFiniteLayout(layout: ReturnType<typeof computeLive2DFitLayout>) {
  expect(Number.isFinite(layout.scale)).toBe(true)
  expect(Number.isFinite(layout.x)).toBe(true)
  expect(Number.isFinite(layout.y)).toBe(true)
}

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
  it('keeps auto tall as full-body-friendly framing', () => {
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
    expect(layout.y).toBeLessThan(820)
    expect(layout.y).toBeGreaterThan(0)
    assertFiniteLayout(layout)
  })

  it('maps auto small to legacy-style upper-body framing intent', () => {
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
    // ROOT CAUSE:
    //
    // The previous strategy anchored non-full-body modes to "head-safe" Y.
    // That made small mode expose too much lower body.
    // Legacy framing used bottom anchoring (`y ~= viewportHeight`) with larger scale.
    // We keep this behavior in small mode for strong upper-body emphasis.
    expect(layout.y).toBe(460)
    assertFiniteLayout(layout)
  })

  it('keeps auto normal closer to upper-body framing than full-body framing', () => {
    const autoNormal = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'auto',
      userScale: 1,
    })
    const fullBody = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(autoNormal.mode).toBe('normal')
    expect(autoNormal.resolvedFitMode).toBe('normal')
    expect(autoNormal.y).toBe(560)
    expect(autoNormal.scale).toBeGreaterThan(fullBody.scale)
    expect(autoNormal.y).toBeGreaterThan(fullBody.y)
    assertFiniteLayout(autoNormal)
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
    expect(layout.y).toBeLessThan(560)
    assertFiniteLayout(layout)
  })

  it('aligns explicit upper-body preference with legacy upper-body framing', () => {
    const upperBody = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'upper-body',
      userScale: 1,
    })
    const fullBody = computeLive2DFitLayout({
      viewportWidth: 420,
      viewportHeight: 560,
      modelWidth: 1000,
      modelHeight: 2000,
      fitPreference: 'full-body',
      userScale: 1,
    })

    expect(upperBody.mode).toBe('upper-body')
    expect(upperBody.resolvedFitMode).toBe('upper-body')
    expect(upperBody.y).toBe(560)
    expect(upperBody.scale).toBeGreaterThan(fullBody.scale)
    expect(upperBody.y).toBeGreaterThan(fullBody.y)
    assertFiniteLayout(upperBody)
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
    assertFiniteLayout(layout)
  })

  it('keeps all modes as finite values in extremely small viewport', () => {
    const modes = ['auto', 'full-body', 'upper-body'] as const

    for (const fitPreference of modes) {
      const layout = computeLive2DFitLayout({
        viewportWidth: 220,
        viewportHeight: 240,
        modelWidth: 1000,
        modelHeight: 2000,
        fitPreference,
        userScale: 1,
      })
      assertFiniteLayout(layout)
    }
  })
})
