import type { Live2DResolvedFitMode } from '@proj-airi/stage-ui-live2d/utils/live2d-fit-layout'

export interface WindowClickThroughBlockingStates {
  stagePaused: boolean
  visionCameraRunning: boolean
  studyTimerRunning: boolean
  controlsPanelExpanded: boolean
  studyPanelOpen: boolean
  visionPanelOpen: boolean
  moveModeEnabled: boolean
}

export interface ComputeWindowMouseIgnorePolicyInput {
  isPointerInsideLive2DHitArea: boolean
  isLive2DFadedForReading: boolean
  isInsideProtectedControlElement: boolean
  isPointerInsideControls: boolean
  isPointerInsideControlAnchor: boolean
  controlsPreActivationActive: boolean
  isPointerInsideShortcutGuidePanel: boolean
  isPointerInsideStudyPanel: boolean
  isPointerInsideVisionPanel: boolean
  isPointerInsideMoveHitArea: boolean
  isNearWindowBorder: boolean

  hasFocusedFormField: boolean
  isDraggingWindow: boolean
  isResizingWindow: boolean
  isPointerDown: boolean
  controlsAnchorPressProtectionActive: boolean

  recentlyOpenedStudyPanel: boolean
  recentlyOpenedVisionPanel: boolean

  blockingStates: WindowClickThroughBlockingStates
  fadeOnHoverEnabled: boolean
}

export interface WindowMouseIgnorePolicyResult {
  shouldIgnoreMouseEvents: boolean
  shouldFadeStage: boolean
  reason:
    | 'protected-control'
    | 'dragging'
    | 'resizing'
    | 'pointer-down'
    | 'controls-anchor-press-protection'
    | 'focused-form'
    | 'controls-hover'
    | 'anchor-hover'
    | 'controls-preactivation'
    | 'shortcut-guide-hover'
    | 'study-panel-hover'
    | 'vision-panel-hover'
    | 'move-hit-area'
    | 'window-border'
    | 'live2d-hit'
    | 'live2d-faded-pass-through'
    | 'study-panel-recent-open'
    | 'vision-panel-recent-open'
    | 'default-pass-through'
  blockingStates: WindowClickThroughBlockingStates
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

export interface BuildWindowClickThroughDebugPayloadInput {
  trigger: WindowClickThroughRefreshTrigger
  isLive2DFadedForReading: boolean
  shouldFadeOnCursorWithin: boolean
  isPointerInsideLive2DHitArea: boolean
  isPointerInsideProtectedControlElement: boolean
  isPointerInsideControls: boolean
  isPointerInsideControlAnchor: boolean
  controlsPreActivationActive: boolean
  protectedElementTag?: string | null
  protectedElementDataset?: string | null
  policy: WindowMouseIgnorePolicyResult
}

export interface BuildWindowClickThroughDebugPayloadResult {
  trigger: WindowClickThroughRefreshTrigger
  isLive2DFadedForReading: boolean
  shouldFadeOnCursorWithin: boolean
  isPointerInsideLive2DHitArea: boolean
  isPointerInsideProtectedControlElement: boolean
  isPointerInsideControls: boolean
  isPointerInsideControlAnchor: boolean
  controlsPreActivationActive: boolean
  protectedElementTag?: string | null
  protectedElementDataset?: string | null
  ignoreMouseEvents: boolean
  reason: WindowMouseIgnorePolicyResult['reason']
  blockingStates: WindowClickThroughBlockingStates
}

export type WindowClickThroughRefreshTrigger
  = | 'pointer-move'
    | 'fade-state-changed'
    | 'panel-state-changed'
    | 'policy-input-changed'

export interface ResolveWindowMouseIgnoreRefreshInput {
  trigger: WindowClickThroughRefreshTrigger
  isLive2DFadedForReading: boolean
  shouldFadeOnCursorWithin: boolean
  isPointerInsideLive2DHitArea: boolean
  isPointerInsideProtectedControlElement: boolean
  isPointerInsideControls: boolean
  isPointerInsideControlAnchor: boolean
  policy: WindowMouseIgnorePolicyResult
  emitter: WindowMouseIgnoreStateEmitter
}

export interface ResolveWindowMouseIgnoreRefreshResult {
  shouldEmitIgnoreMouseEvents: boolean
  nextIgnoreMouseEvents: boolean
  debugPayload: BuildWindowClickThroughDebugPayloadResult
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
  if (input.isInsideProtectedControlElement) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'protected-control',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideControlAnchor) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'anchor-hover',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideControls) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'controls-hover',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.controlsPreActivationActive) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'controls-preactivation',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideStudyPanel) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'study-panel-hover',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideVisionPanel) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'vision-panel-hover',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideShortcutGuidePanel) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'shortcut-guide-hover',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.hasFocusedFormField) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'focused-form',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isNearWindowBorder) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'window-border',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isDraggingWindow) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'dragging',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isResizingWindow) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'resizing',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideMoveHitArea) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'move-hit-area',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerDown) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'pointer-down',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.controlsAnchorPressProtectionActive) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'controls-anchor-press-protection',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.isPointerInsideLive2DHitArea) {
    if (input.isLive2DFadedForReading) {
      return {
        shouldIgnoreMouseEvents: true,
        shouldFadeStage: true,
        reason: 'live2d-faded-pass-through',
        blockingStates: { ...input.blockingStates },
      }
    }

    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: input.fadeOnHoverEnabled,
      reason: 'live2d-hit',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.recentlyOpenedStudyPanel) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'study-panel-recent-open',
      blockingStates: { ...input.blockingStates },
    }
  }

  if (input.recentlyOpenedVisionPanel) {
    return {
      shouldIgnoreMouseEvents: false,
      shouldFadeStage: false,
      reason: 'vision-panel-recent-open',
      blockingStates: { ...input.blockingStates },
    }
  }

  return {
    shouldIgnoreMouseEvents: true,
    shouldFadeStage: input.fadeOnHoverEnabled,
    reason: 'default-pass-through',
    blockingStates: { ...input.blockingStates },
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

/**
 * Builds a plain debug payload for click-through diagnostics.
 *
 * Use when:
 * - Real-device behavior needs concrete reason/state traces
 *
 * Expects:
 * - `policy` is the latest resolved click-through decision
 *
 * Returns:
 * - Serializable payload with reason and non-decisive blocking states
 */
export function buildWindowClickThroughDebugPayload(input: BuildWindowClickThroughDebugPayloadInput): BuildWindowClickThroughDebugPayloadResult {
  return {
    trigger: input.trigger,
    isLive2DFadedForReading: input.isLive2DFadedForReading,
    shouldFadeOnCursorWithin: input.shouldFadeOnCursorWithin,
    isPointerInsideLive2DHitArea: input.isPointerInsideLive2DHitArea,
    isPointerInsideProtectedControlElement: input.isPointerInsideProtectedControlElement,
    isPointerInsideControls: input.isPointerInsideControls,
    isPointerInsideControlAnchor: input.isPointerInsideControlAnchor,
    controlsPreActivationActive: input.controlsPreActivationActive,
    protectedElementTag: input.protectedElementTag ?? null,
    protectedElementDataset: input.protectedElementDataset ?? null,
    ignoreMouseEvents: input.policy.shouldIgnoreMouseEvents,
    reason: input.policy.reason,
    blockingStates: { ...input.policy.blockingStates },
  }
}

/**
 * Resolves whether renderer should emit a new `setIgnoreMouseEvents` call for current policy frame.
 *
 * Use when:
 * - Renderer refreshes click-through state from pointer/fade/panel triggers
 * - Caller needs both debug payload and deduplicated IPC emission decision
 *
 * Expects:
 * - `emitter` is shared across refresh cycles in the page lifetime
 *
 * Returns:
 * - Stable debug payload plus deduped emit decision for ignore-mouse state
 */
export function resolveWindowMouseIgnoreRefresh(input: ResolveWindowMouseIgnoreRefreshInput): ResolveWindowMouseIgnoreRefreshResult {
  const debugPayload = buildWindowClickThroughDebugPayload({
    trigger: input.trigger,
    isLive2DFadedForReading: input.isLive2DFadedForReading,
    shouldFadeOnCursorWithin: input.shouldFadeOnCursorWithin,
    isPointerInsideLive2DHitArea: input.isPointerInsideLive2DHitArea,
    isPointerInsideProtectedControlElement: input.isPointerInsideProtectedControlElement,
    isPointerInsideControls: input.isPointerInsideControls,
    isPointerInsideControlAnchor: input.isPointerInsideControlAnchor,
    policy: input.policy,
  })

  const nextIgnoreMouseEvents = input.policy.shouldIgnoreMouseEvents
  const shouldEmitIgnoreMouseEvents = input.emitter.shouldEmit(nextIgnoreMouseEvents)

  return {
    shouldEmitIgnoreMouseEvents,
    nextIgnoreMouseEvents,
    debugPayload,
  }
}
