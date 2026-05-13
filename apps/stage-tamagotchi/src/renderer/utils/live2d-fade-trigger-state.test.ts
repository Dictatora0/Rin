import { describe, expect, it } from 'vitest'

import { computeLive2DFadeTriggerState } from './live2d-fade-trigger-state'

describe('live2d fade trigger state', () => {
  it('enters faded state immediately when pointer enters fade trigger area', () => {
    const result = computeLive2DFadeTriggerState({
      now: 1000,
      canFade: true,
      insideFadeTriggerArea: true,
      releaseDelayMs: 180,
      previousState: { faded: false, releaseAt: null },
    })

    expect(result.nextState.faded).toBe(true)
    expect(result.nextState.releaseAt).toBe(null)
    expect(result.changed).toBe(true)
  })

  it('delays fade release after pointer leaves fade trigger area', () => {
    const stage1 = computeLive2DFadeTriggerState({
      now: 1000,
      canFade: true,
      insideFadeTriggerArea: false,
      releaseDelayMs: 180,
      previousState: { faded: true, releaseAt: null },
    })
    expect(stage1.nextState.faded).toBe(true)
    expect(stage1.nextState.releaseAt).toBe(1180)
    expect(stage1.changed).toBe(false)

    const stage2 = computeLive2DFadeTriggerState({
      now: 1179,
      canFade: true,
      insideFadeTriggerArea: false,
      releaseDelayMs: 180,
      previousState: stage1.nextState,
    })
    expect(stage2.nextState.faded).toBe(true)
    expect(stage2.changed).toBe(false)

    const stage3 = computeLive2DFadeTriggerState({
      now: 1181,
      canFade: true,
      insideFadeTriggerArea: false,
      releaseDelayMs: 180,
      previousState: stage2.nextState,
    })
    expect(stage3.nextState.faded).toBe(false)
    expect(stage3.nextState.releaseAt).toBe(null)
    expect(stage3.changed).toBe(true)
  })

  it('cancels pending release and stays faded when pointer re-enters quickly', () => {
    const pendingRelease = computeLive2DFadeTriggerState({
      now: 1000,
      canFade: true,
      insideFadeTriggerArea: false,
      releaseDelayMs: 180,
      previousState: { faded: true, releaseAt: null },
    })
    const reenter = computeLive2DFadeTriggerState({
      now: 1050,
      canFade: true,
      insideFadeTriggerArea: true,
      releaseDelayMs: 180,
      previousState: pendingRelease.nextState,
    })

    expect(reenter.nextState.faded).toBe(true)
    expect(reenter.nextState.releaseAt).toBe(null)
    expect(reenter.changed).toBe(false)
  })

  it('forces non-faded when fading is disabled by runtime state', () => {
    const result = computeLive2DFadeTriggerState({
      now: 1000,
      canFade: false,
      insideFadeTriggerArea: true,
      releaseDelayMs: 180,
      previousState: { faded: true, releaseAt: 1180 },
    })

    expect(result.nextState.faded).toBe(false)
    expect(result.nextState.releaseAt).toBe(null)
    expect(result.changed).toBe(true)
  })
})
