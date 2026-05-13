// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'

import {
  getClickThroughProtectedElementFromPoint,
  isClickThroughProtectedElement,
  isPointInsideClickThroughProtectedElement,
} from './click-through-protected-elements'

describe('click-through protected elements', () => {
  it('returns true for data-click-through-protected element', () => {
    const element = document.createElement('div')
    element.setAttribute('data-click-through-protected', 'true')
    expect(isClickThroughProtectedElement(element)).toBe(true)
  })

  it('returns true for data-control-button element', () => {
    const element = document.createElement('button')
    element.setAttribute('data-control-button', 'true')
    expect(isClickThroughProtectedElement(element)).toBe(true)
  })

  it('returns true for controls-island control layer element', () => {
    const element = document.createElement('div')
    element.setAttribute('data-control-layer', 'controls-island')
    expect(isClickThroughProtectedElement(element)).toBe(true)
  })

  it('returns true for controls-anchor control layer element', () => {
    const element = document.createElement('div')
    element.setAttribute('data-control-layer', 'controls-anchor')
    expect(isClickThroughProtectedElement(element)).toBe(true)
  })

  it('returns true when child is inside protected ancestor', () => {
    const ancestor = document.createElement('div')
    ancestor.setAttribute('data-click-through-protected', 'true')
    const child = document.createElement('span')
    ancestor.appendChild(child)
    expect(isClickThroughProtectedElement(child)).toBe(true)
  })

  it('returns false for transparent normal div', () => {
    const element = document.createElement('div')
    expect(isClickThroughProtectedElement(element)).toBe(false)
  })

  it('returns false for live2d canvas element without explicit protection', () => {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-testid', 'live2d-canvas')
    expect(isClickThroughProtectedElement(canvas)).toBe(false)
  })

  it('detects protected element from point and returns true', () => {
    const protectedButton = document.createElement('button')
    protectedButton.setAttribute('data-control-button', 'true')
    const fakeDocument = {
      elementFromPoint: vi.fn(() => protectedButton),
    } as unknown as Document

    expect(getClickThroughProtectedElementFromPoint(100, 50, fakeDocument)).toBe(protectedButton)
    expect(isPointInsideClickThroughProtectedElement(100, 50, fakeDocument)).toBe(true)
  })
})
