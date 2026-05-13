import type { Live2DResolvedFitMode } from '@proj-airi/stage-ui-live2d/utils/live2d-fit-layout'

export interface ComputeWindowMouseIgnorePolicyInput {
  stagePaused: boolean
  moveModeEnabled: boolean
  controlsPanelExpanded: boolean
  hearingDialogOpen: boolean
  studyPanelPinned: boolean
  visionPanelPinned: boolean
  hasFocusedFormField: boolean
  isPointerInsideControls: boolean
  isNearWindowBorder: boolean
  isPointerInsideLive2DHitArea: boolean
  fadeOnHoverEnabled: boolean
}

export interface WindowMouseIgnorePolicyResult {
  shouldIgnoreMouseEvents: boolean
  shouldFadeStage: boolean
  reason:
    | 'paused'
    | 'move-mode'
    | 'controls-panel'
    | 'dialog-open'
    | 'study-panel'
    | 'vision-panel'
    | 'input-focused'
    | 'controls-hover'
    | 'window-border'
    | 'character-hit-area'
    | 'fallback-click-through'
}

export interface BuildLive2DHitAreaDebugPayloadInput {
  fitMode: Live2DResolvedFitMode
  fitPreference: 'auto' | 'full-body' | 'upper-body'
  hitArea: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
  pointer: {
    x: number
    y: number
    inside: boolean
  }
}

export interface BuildLive2DHitAreaDebugPayloadResult {
  fitMode: Live2DResolvedFitMode
  fitPreference: 'auto' | 'full-body' | 'upper-body'
  hitArea: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
  pointer: {
    x: number
    y: number
    inside: boolean
  }
}

/**
 * Resolves whether the transparent stage window should ignore mouse events.
 *
 * Use when:
 * - Renderer decides if mouse input should pass through to underlying desktop apps
 * - UI interaction guards (panel, input, drag/resize affordance) must override click-through
 *
 * Expects:
 * - Each boolean reflects latest interaction state for the current frame
 *
 * Returns:
 * - Ignore decision plus reasoning tag for diagnostics/tests
 */
export function computeWindowMouseIgnorePolicy(input: ComputeWindowMouseIgnorePolicyInput): WindowMouseIgnorePolicyResult {
  if (input.stagePaused) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'paused',
    }
  }

  if (input.moveModeEnabled) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'move-mode',
    }
  }

  if (input.controlsPanelExpanded) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'controls-panel',
    }
  }

  if (input.hearingDialogOpen) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'dialog-open',
    }
  }

  if (input.studyPanelPinned) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'study-panel',
    }
  }

  if (input.visionPanelPinned) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'vision-panel',
    }
  }

  if (input.hasFocusedFormField) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'input-focused',
    }
  }

  if (input.isPointerInsideControls) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'controls-hover',
    }
  }

  if (input.isNearWindowBorder) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'window-border',
    }
  }

  if (input.isPointerInsideLive2DHitArea) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: input.fadeOnHoverEnabled,
      reason: 'character-hit-area',
    }
  }

  return {
    shouldIgnoreMouseEvents: true,
    shouldFadeStage: input.fadeOnHoverEnabled,
    reason: 'fallback-click-through',
  }
}

/**
 * Deduplicates window mouse-ignore transitions to avoid redundant high-frequency IPC.
 *
 * Use when:
 * - Mouse move updates happen frequently
 * - Renderer should invoke Electron setIgnoreMouseEvents only on state changes
 *
 * Expects:
 * - Call `shouldEmit` with desired state each frame/tick
 *
 * Returns:
 * - `true` only when desired state changed since last emission
 */
export class WindowMouseIgnoreStateEmitter {
  private lastState: boolean | null = null

  shouldEmit(nextState: boolean) {
    if (this.lastState === nextState)
      return false

    this.lastState = nextState
    return true
  }

  reset() {
    this.lastState = null
  }
}

/**
 * Creates a serializable debug payload for live2d hit area traces.
 *
 * Use when:
 * - Logging click-through decisions for diagnostics
 *
 * Expects:
 * - Coordinates are window-relative values
 *
 * Returns:
 * - Stable plain object without reactive refs
 */
export function buildLive2DHitAreaDebugPayload(input: BuildLive2DHitAreaDebugPayloadInput): BuildLive2DHitAreaDebugPayloadResult {
  return {
    fitMode: input.fitMode,
    fitPreference: input.fitPreference,
    hitArea: {
      left: input.hitArea.left,
      top: input.hitArea.top,
      right: input.hitArea.right,
      bottom: input.hitArea.bottom,
      width: input.hitArea.width,
      height: input.hitArea.height,
    },
    pointer: {
      x: input.pointer.x,
      y: input.pointer.y,
      inside: input.pointer.inside,
    },
  }
}
