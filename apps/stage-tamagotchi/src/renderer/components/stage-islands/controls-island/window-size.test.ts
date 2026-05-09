import { describe, expect, it } from 'vitest'

import {
  calculateStageWindowBoundsForAction,
  resolveStageWindowSizeLimits,
  STAGE_WINDOW_DEFAULT_SIZE,
  STAGE_WINDOW_MIN_SIZE,
} from './window-size'

/**
 * @example
 * describe('stage window sizing helpers', () => {
 *   it('keeps zoom operations inside safe bounds', () => {})
 * })
 */
describe('stage window sizing helpers', () => {
  /**
   * @example
   * it('clamps zoom in to resolved max size', () => {
   *   const bounds = calculateStageWindowBoundsForAction(...)
   * })
   */
  it('clamps zoom in to resolved max size', () => {
    const workArea = { x: 0, y: 0, width: 600, height: 700 }
    const limits = resolveStageWindowSizeLimits(workArea)

    const nextBounds = calculateStageWindowBoundsForAction({
      action: 'zoom-in',
      currentBounds: {
        x: 20,
        y: 20,
        width: limits.maxWidth - 5,
        height: limits.maxHeight - 5,
      },
      workArea,
    })

    expect(nextBounds.width).toBe(limits.maxWidth)
    expect(nextBounds.height).toBe(limits.maxHeight)
  })

  /**
   * @example
   * it('clamps zoom out to safe minimum size', () => {
   *   const bounds = calculateStageWindowBoundsForAction(...)
   * })
   */
  it('clamps zoom out to safe minimum size', () => {
    const workArea = { x: 10, y: 10, width: 1200, height: 900 }
    const nextBounds = calculateStageWindowBoundsForAction({
      action: 'zoom-out',
      currentBounds: {
        x: 200,
        y: 100,
        width: STAGE_WINDOW_MIN_SIZE.width + 10,
        height: STAGE_WINDOW_MIN_SIZE.height + 10,
      },
      workArea,
    })

    expect(nextBounds.width).toBe(STAGE_WINDOW_MIN_SIZE.width)
    expect(nextBounds.height).toBe(STAGE_WINDOW_MIN_SIZE.height)
  })

  /**
   * @example
   * it('resets window size to default and keeps bounds in work area', () => {
   *   const bounds = calculateStageWindowBoundsForAction(...)
   * })
   */
  it('resets window size to default and keeps bounds in work area', () => {
    const workArea = { x: 100, y: 50, width: 900, height: 760 }
    const nextBounds = calculateStageWindowBoundsForAction({
      action: 'reset-size',
      currentBounds: { x: 700, y: 500, width: 300, height: 300 },
      workArea,
    })

    expect(nextBounds.width).toBe(STAGE_WINDOW_DEFAULT_SIZE.width)
    expect(nextBounds.height).toBe(STAGE_WINDOW_DEFAULT_SIZE.height)
    expect(nextBounds.x).toBeGreaterThanOrEqual(workArea.x)
    expect(nextBounds.y).toBeGreaterThanOrEqual(workArea.y)
    expect(nextBounds.x + nextBounds.width).toBeLessThanOrEqual(workArea.x + workArea.width)
    expect(nextBounds.y + nextBounds.height).toBeLessThanOrEqual(workArea.y + workArea.height)
  })
})
