export interface Live2DFadeTriggerState {
  faded: boolean
  releaseAt: number | null
}

export interface ComputeLive2DFadeTriggerStateInput {
  now: number
  canFade: boolean
  insideFadeTriggerArea: boolean
  releaseDelayMs: number
  previousState: Live2DFadeTriggerState
}

export interface ComputeLive2DFadeTriggerStateResult {
  nextState: Live2DFadeTriggerState
  changed: boolean
}

/**
 * Computes next Live2D fade-trigger state with immediate enter and delayed exit behavior.
 *
 * Use when:
 * - Pointer entering fade trigger area should fade stage immediately
 * - Pointer leaving should wait for a short grace period to avoid edge flicker
 *
 * Expects:
 * - `now` is epoch milliseconds
 * - `releaseDelayMs` is non-negative
 *
 * Returns:
 * - Next state and whether `faded` changed
 */
export function computeLive2DFadeTriggerState(input: ComputeLive2DFadeTriggerStateInput): ComputeLive2DFadeTriggerStateResult {
  if (!input.canFade) {
    const nextState: Live2DFadeTriggerState = { faded: false, releaseAt: null }
    return {
      nextState,
      changed: nextState.faded !== input.previousState.faded,
    }
  }

  if (input.insideFadeTriggerArea) {
    const nextState: Live2DFadeTriggerState = { faded: true, releaseAt: null }
    return {
      nextState,
      changed: nextState.faded !== input.previousState.faded,
    }
  }

  if (!input.previousState.faded) {
    return {
      nextState: { faded: false, releaseAt: null },
      changed: false,
    }
  }

  if (input.previousState.releaseAt == null) {
    return {
      nextState: {
        faded: true,
        releaseAt: input.now + Math.max(0, input.releaseDelayMs),
      },
      changed: false,
    }
  }

  if (input.now < input.previousState.releaseAt) {
    return {
      nextState: {
        faded: true,
        releaseAt: input.previousState.releaseAt,
      },
      changed: false,
    }
  }

  const nextState: Live2DFadeTriggerState = { faded: false, releaseAt: null }
  return {
    nextState,
    changed: nextState.faded !== input.previousState.faded,
  }
}
