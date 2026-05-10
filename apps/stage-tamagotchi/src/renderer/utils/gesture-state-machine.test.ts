import { describe, expect, it } from 'vitest'

import { createGestureStateMachine } from './gesture-state-machine'

function ingestGesture(machine: ReturnType<typeof createGestureStateMachine>, options: {
  nowMs: number
  candidateGesture: 'open_palm' | 'victory' | 'thumbs_up' | 'none' | 'unknown'
  confidence?: number
  geometryPass?: boolean
  qualityState?: 'good' | 'too_far' | 'out_of_frame' | 'too_fast' | 'low_confidence' | 'unknown'
}) {
  return machine.ingest({
    nowMs: options.nowMs,
    candidateGesture: options.candidateGesture,
    confidence: options.confidence ?? 0.9,
    geometryPass: options.geometryPass ?? true,
    qualityState: options.qualityState ?? 'good',
  })
}

describe('gesture state machine', () => {
  /** @example one frame should not trigger any gesture */
  it('does not trigger on a single frame', () => {
    const machine = createGestureStateMachine()
    const result = ingestGesture(machine, {
      nowMs: 100,
      candidateGesture: 'open_palm',
    })

    expect(result.triggeredGesture).toBeNull()
    expect(result.diagnostics.gestureState).toBe('candidate')
  })

  /** @example 6/10 votes is below minVotes=7 */
  it('does not become stable when votes are below threshold', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 6; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'open_palm',
      })
    }
    for (let index = 0; index < 4; index += 1) {
      ingestGesture(machine, {
        nowMs: 800 + (index * 100),
        candidateGesture: 'none',
      })
    }

    const diagnostics = machine.getDiagnostics()
    expect(diagnostics.stableGesture).toBe('none')
    expect(diagnostics.gestureState).toBe('idle')
  })

  /** @example 7/10 votes should pass base voting threshold */
  it('marks candidate stable when votes, confidence, and geometry pass thresholds', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 7; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'victory',
      })
    }
    ingestGesture(machine, { nowMs: 900, candidateGesture: 'none' })
    ingestGesture(machine, { nowMs: 1_000, candidateGesture: 'none' })
    const stableTransition = ingestGesture(machine, {
      nowMs: 1_100,
      candidateGesture: 'none',
    })

    expect(stableTransition.diagnostics.stableGesture).toBe('victory')
    expect(stableTransition.diagnostics.gestureVotes).toBe(7)
  })

  /** @example geometry pass ratio below 0.7 must block stability */
  it('rejects stable transition when geometry pass rate is too low', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 7; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'open_palm',
        geometryPass: index < 4,
      })
    }
    ingestGesture(machine, { nowMs: 900, candidateGesture: 'none' })
    ingestGesture(machine, { nowMs: 1_000, candidateGesture: 'none' })
    const result = ingestGesture(machine, {
      nowMs: 1_100,
      candidateGesture: 'none',
    })

    expect(result.diagnostics.stableGesture).toBe('none')
    expect(result.triggeredGesture).toBeNull()
  })

  /** @example only qualityState=good can be counted */
  it('excludes low-quality frames from voting', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 7; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'thumbs_up',
        qualityState: 'low_confidence',
      })
    }
    const result = ingestGesture(machine, {
      nowMs: 900,
      candidateGesture: 'thumbs_up',
      qualityState: 'low_confidence',
    })

    expect(result.diagnostics.stableGesture).toBe('none')
    expect(result.diagnostics.gestureVotes).toBe(0)
  })

  /** @example hold duration must elapse before trigger */
  it('triggers only after hold duration is satisfied', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 8; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'open_palm',
      })
    }

    const beforeHold = ingestGesture(machine, {
      nowMs: 1_100,
      candidateGesture: 'open_palm',
    })
    expect(beforeHold.triggeredGesture).toBeNull()

    ingestGesture(machine, {
      nowMs: 1_500,
      candidateGesture: 'open_palm',
    })
    const triggered = ingestGesture(machine, {
      nowMs: 1_600,
      candidateGesture: 'open_palm',
    })

    expect(triggered.triggeredGesture).toBe('open_palm')
    expect(triggered.diagnostics.gestureState).toBe('triggered')
  })

  /** @example gesture must be released before retrigger, even after cooldown */
  it('enforces cooldown and release-to-retrigger behavior', () => {
    const machine = createGestureStateMachine()

    for (let index = 0; index < 8; index += 1) {
      ingestGesture(machine, {
        nowMs: 100 + (index * 100),
        candidateGesture: 'victory',
      })
    }
    ingestGesture(machine, { nowMs: 1_500, candidateGesture: 'victory' })
    const firstTrigger = ingestGesture(machine, { nowMs: 1_600, candidateGesture: 'victory' })
    expect(firstTrigger.triggeredGesture).toBe('victory')

    const cooldownFrame = ingestGesture(machine, { nowMs: 1_700, candidateGesture: 'victory' })
    expect(cooldownFrame.triggeredGesture).toBeNull()
    expect(cooldownFrame.diagnostics.gestureState).toBe('cooldown')

    const waitingRelease = ingestGesture(machine, { nowMs: 5_700, candidateGesture: 'victory' })
    expect(waitingRelease.triggeredGesture).toBeNull()
    expect(waitingRelease.diagnostics.gestureState).toBe('waiting_release')

    const releaseFrame = ingestGesture(machine, { nowMs: 5_800, candidateGesture: 'none' })
    expect(releaseFrame.diagnostics.releaseRequired).toBe(false)

    let triggeredAgain = false
    for (let index = 0; index < 24; index += 1) {
      const result = ingestGesture(machine, {
        nowMs: 6_000 + (index * 100),
        candidateGesture: 'victory',
      })
      if (result.triggeredGesture === 'victory') {
        triggeredAgain = true
        break
      }
    }

    expect(triggeredAgain).toBe(true)
  })
})
