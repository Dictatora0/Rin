import { describe, expect, it } from 'vitest'

import {
  buildLive2DHitAreaDebugPayload,
  buildWindowClickThroughDebugPayload,
  computeWindowMouseIgnorePolicy,
  resolveWindowMouseIgnoreRefresh,
  WindowMouseIgnoreStateEmitter,
} from './window-click-through-policy'

describe('window click-through policy', () => {
  function createInput(overrides: Partial<Parameters<typeof computeWindowMouseIgnorePolicy>[0]> = {}) {
    return {
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: false,
      isLive2DFadedForReading: false,
      isInsideProtectedControlElement: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      isPointerInsideShortcutGuidePanel: false,
      isPointerInsideStudyPanel: false,
      isPointerInsideVisionPanel: false,
      isPointerInsideMoveHitArea: false,
      isNearWindowBorder: false,
      hasFocusedFormField: false,
      isDraggingWindow: false,
      isResizingWindow: false,
      isPointerDown: false,
      controlsAnchorPressProtectionActive: false,
      recentlyOpenedStudyPanel: false,
      recentlyOpenedVisionPanel: false,
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
      fadeOnHoverEnabled: true,
      ...overrides,
    }
  }

  /** @example default idle state should pass-through clicks outside model/UI */
  it('uses default pass-through when pointer is outside all interactive regions', () => {
    const result = computeWindowMouseIgnorePolicy(createInput())

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.shouldFadeStage).toBe(true)
    expect(result.reason).toBe('default-pass-through')
  })

  /** @example camera running alone must not block desktop clicks */
  it('keeps pass-through when visionCameraRunning=true but pointer is outside vision panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: true,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
    expect(result.blockingStates.visionCameraRunning).toBe(true)
  })

  /** @example open vision panel should not claim whole transparent window */
  it('keeps pass-through when visionPanelOpen=true but pointer is outside panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: true,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
  })

  /** @example pointer inside vision panel should keep window interactive */
  it('keeps mouse events when pointer is inside vision panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideVisionPanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('vision-panel-hover')
  })

  /** @example open study panel should not claim whole transparent window */
  it('keeps pass-through when studyPanelOpen=true but pointer is outside panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: true,
        controlsPanelExpanded: false,
        studyPanelOpen: true,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
    expect(result.blockingStates.studyTimerRunning).toBe(true)
  })

  /** @example pointer inside study panel should keep window interactive */
  it('keeps mouse events when pointer is inside study panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideStudyPanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('study-panel-hover')
  })

  /** @example pointer inside shortcut guide panel should keep window interactive */
  it('keeps mouse events when pointer is inside shortcut guide panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideShortcutGuidePanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('shortcut-guide-hover')
  })

  /** @example expanded controls should not claim whole transparent window */
  it('keeps pass-through when controlsPanelExpanded=true but pointer is outside controls and anchor', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: false,
        controlsPanelExpanded: true,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
  })

  /** @example controls hover should keep interaction */
  it('keeps mouse events when pointer is inside controls panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideControls: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('controls-hover')
  })

  /** @example anchor hover should keep interaction */
  it('keeps mouse events when pointer is inside controls anchor', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideControlAnchor: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('anchor-hover')
  })

  /** @example protected control must always receive mouse even in faded character region */
  it('keeps mouse events when pointer is inside protected control element', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isInsideProtectedControlElement: true,
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('protected-control')
  })

  /** @example controls preactivation keeps first click stable after entering controls zone */
  it('keeps mouse events when controls preactivation is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      controlsPreActivationActive: true,
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('controls-preactivation')
  })

  /** @example near-anchor fallback should keep interaction to avoid first-click loss around anchor edge */
  it('keeps mouse events when pointer is treated as controls anchor proximity', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideControlAnchor: true,
      isPointerInsideControls: false,
      isPointerInsideLive2DHitArea: false,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('anchor-hover')
  })

  /** @example move mode alone should not claim whole transparent window */
  it('keeps pass-through when moveModeEnabled=true but pointer is outside move hit area', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: true,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
  })

  /** @example move hit area should enable interaction while move mode is active */
  it('keeps mouse events when pointer is inside move hit area', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideMoveHitArea: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('move-hit-area')
  })

  /** @example character-hover should keep window interactive even without open panels */
  it('keeps mouse events when pointer is inside live2d hit area', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('live2d-hit')
  })

  /** @example faded live2d area should pass-through for zero-disturbance reading */
  it('passes through when pointer is inside live2d hit area and faded mode is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.shouldFadeStage).toBe(true)
    expect(result.reason).toBe('live2d-faded-pass-through')
  })

  /** @example fade trigger area should be enough to enter pass-through once stage has faded */
  it('passes through when pointer is inside fade trigger area and faded mode is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.shouldFadeStage).toBe(true)
    expect(result.reason).toBe('live2d-faded-pass-through')
  })

  /** @example anchor should override faded pass-through for reliable recovery entry */
  it('keeps mouse events when pointer is inside anchor even if live2d faded is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      isPointerInsideControlAnchor: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('anchor-hover')
  })

  /** @example controls panel should override faded pass-through */
  it('keeps mouse events when pointer is inside controls panel even if live2d faded is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      isPointerInsideControls: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('controls-hover')
  })

  /** @example study panel should override faded pass-through */
  it('keeps mouse events when pointer is inside study panel even if live2d faded is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      isPointerInsideStudyPanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('study-panel-hover')
  })

  /** @example focused form should override faded pass-through */
  it('keeps mouse events with focused form field even if live2d faded is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      hasFocusedFormField: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('focused-form')
  })

  /** @example move mode flag alone should not override faded pass-through without move-hit-area */
  it('keeps pass-through when move mode enabled but pointer is outside move hit area', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: true,
      },
      isPointerInsideMoveHitArea: false,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('live2d-faded-pass-through')
  })

  /** @example move hit area should still receive mouse in move mode */
  it('keeps mouse events when pointer is inside move hit area even if live2d faded is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      isPointerInsideMoveHitArea: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('move-hit-area')
  })

  /** @example vision camera running should not override faded pass-through */
  it('keeps faded pass-through when vision camera is running', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: true,
        studyTimerRunning: false,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('live2d-faded-pass-through')
    expect(result.blockingStates.visionCameraRunning).toBe(true)
  })

  /** @example study timer running should not override faded pass-through */
  it('keeps faded pass-through when study timer is running', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: true,
      isLive2DFadedForReading: true,
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: false,
        studyTimerRunning: true,
        controlsPanelExpanded: false,
        studyPanelOpen: false,
        visionPanelOpen: false,
        moveModeEnabled: false,
      },
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('live2d-faded-pass-through')
    expect(result.blockingStates.studyTimerRunning).toBe(true)
  })

  /** @example focused text input must override click-through to keep typing stable */
  it('keeps mouse events when any form field is focused', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      hasFocusedFormField: true,
      fadeOnHoverEnabled: false,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('focused-form')
  })

  /** @example window border resize affordance should temporarily disable click-through */
  it('keeps mouse events when pointer is near window border', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isNearWindowBorder: true,
      isResizingWindow: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('window-border')
  })

  /** @example pointer down should keep interaction until release */
  it('keeps mouse events while pointer is down', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerDown: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('pointer-down')
  })

  /** @example controls anchor press protection should keep interaction for first-click reliability */
  it('keeps mouse events while controls anchor press protection is active', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      controlsAnchorPressProtectionActive: true,
      isPointerDown: false,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('controls-anchor-press-protection')
  })

  /** @example transient panel-open protection avoids accidental immediate pass-through */
  it('uses recent-open protection for study panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      recentlyOpenedStudyPanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('study-panel-recent-open')
  })

  /** @example transient panel-open protection avoids accidental immediate pass-through */
  it('uses recent-open protection for vision panel', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      recentlyOpenedVisionPanel: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('vision-panel-recent-open')
  })

  /** @example state emitter should suppress duplicate ipc updates on same state */
  it('deduplicates ignore state emissions', () => {
    const emitter = new WindowMouseIgnoreStateEmitter()

    expect(emitter.shouldEmit(true)).toBe(true)
    expect(emitter.shouldEmit(true)).toBe(false)
    expect(emitter.shouldEmit(false)).toBe(true)
    expect(emitter.shouldEmit(false)).toBe(false)

    emitter.reset()

    expect(emitter.shouldEmit(false)).toBe(true)
  })

  /** @example fade transition should emit only on ignore-state changes */
  it('emits state transition only when faded pass-through toggles ignore state', () => {
    const emitter = new WindowMouseIgnoreStateEmitter()
    const normalHit = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: false,
    }))
    const fadedHit = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))

    expect(normalHit.shouldIgnoreMouseEvents).toBe(false)
    expect(fadedHit.shouldIgnoreMouseEvents).toBe(true)
    expect(emitter.shouldEmit(normalHit.shouldIgnoreMouseEvents)).toBe(true)
    expect(emitter.shouldEmit(normalHit.shouldIgnoreMouseEvents)).toBe(false)
    expect(emitter.shouldEmit(fadedHit.shouldIgnoreMouseEvents)).toBe(true)
    expect(emitter.shouldEmit(fadedHit.shouldIgnoreMouseEvents)).toBe(false)
  })

  /** @example debug payload should remain plain and stable for logging */
  it('builds serializable hit-area debug payload', () => {
    const payload = buildLive2DHitAreaDebugPayload({
      fitMode: 'normal',
      fitPreference: 'auto',
      hitArea: {
        left: 10,
        top: 20,
        right: 100,
        bottom: 260,
        width: 90,
        height: 240,
      },
      pointer: {
        x: 30,
        y: 80,
        inside: true,
      },
    })

    expect(payload.fitMode).toBe('normal')
    expect(payload.fitPreference).toBe('auto')
    expect(payload.hitArea.left).toBe(10)
    expect(payload.pointer.inside).toBe(true)
  })

  /** @example click-through debug payload should expose reason plus non-decisive blocking states */
  it('builds serializable window click-through debug payload', () => {
    const policy = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideControls: true,
      blockingStates: {
        stagePaused: false,
        visionCameraRunning: true,
        studyTimerRunning: true,
        controlsPanelExpanded: true,
        studyPanelOpen: true,
        visionPanelOpen: true,
        moveModeEnabled: true,
      },
    }))
    const payload = buildWindowClickThroughDebugPayload({
      trigger: 'policy-input-changed',
      isLive2DFadedForReading: false,
      shouldFadeOnCursorWithin: false,
      isPointerInsideLive2DHitArea: false,
      isPointerInsideLive2DFadeTriggerArea: false,
      isPointerInsideProtectedControlElement: false,
      isPointerInsideControls: true,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy,
    })

    expect(payload.trigger).toBe('policy-input-changed')
    expect(payload.isLive2DFadedForReading).toBe(false)
    expect(payload.isPointerInsideLive2DFadeTriggerArea).toBe(false)
    expect(payload.ignoreMouseEvents).toBe(false)
    expect(payload.reason).toBe('controls-hover')
    expect(payload.blockingStates.visionCameraRunning).toBe(true)
    expect(payload.blockingStates.studyTimerRunning).toBe(true)
  })

  /** @example debug payload should expose faded pass-through reason for diagnostics */
  it('builds debug payload with live2d-faded-pass-through reason', () => {
    const policy = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))
    const payload = buildWindowClickThroughDebugPayload({
      trigger: 'fade-state-changed',
      isLive2DFadedForReading: true,
      shouldFadeOnCursorWithin: true,
      isPointerInsideLive2DHitArea: true,
      isPointerInsideLive2DFadeTriggerArea: true,
      isPointerInsideProtectedControlElement: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy,
    })

    expect(payload.trigger).toBe('fade-state-changed')
    expect(payload.isLive2DFadedForReading).toBe(true)
    expect(payload.isPointerInsideLive2DFadeTriggerArea).toBe(true)
    expect(payload.ignoreMouseEvents).toBe(true)
    expect(payload.reason).toBe('live2d-faded-pass-through')
  })

  /** @example fade-state refresh should emit pass-through even when pointer does not move */
  it('emits ignore=true on fade-state-changed while pointer stays inside live2d hit area', () => {
    const emitter = new WindowMouseIgnoreStateEmitter()
    const live2dHitPolicy = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: false,
    }))
    const fadedPolicy = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
    }))

    const firstRefresh = resolveWindowMouseIgnoreRefresh({
      trigger: 'pointer-move',
      isLive2DFadedForReading: false,
      shouldFadeOnCursorWithin: false,
      isPointerInsideLive2DHitArea: true,
      isPointerInsideLive2DFadeTriggerArea: true,
      isPointerInsideProtectedControlElement: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy: live2dHitPolicy,
      emitter,
    })
    const fadeRefresh = resolveWindowMouseIgnoreRefresh({
      trigger: 'fade-state-changed',
      isLive2DFadedForReading: true,
      shouldFadeOnCursorWithin: true,
      isPointerInsideLive2DHitArea: true,
      isPointerInsideLive2DFadeTriggerArea: true,
      isPointerInsideProtectedControlElement: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy: fadedPolicy,
      emitter,
    })

    expect(firstRefresh.shouldEmitIgnoreMouseEvents).toBe(true)
    expect(firstRefresh.nextIgnoreMouseEvents).toBe(false)
    expect(firstRefresh.debugPayload.reason).toBe('live2d-hit')
    expect(firstRefresh.debugPayload.trigger).toBe('pointer-move')
    expect(fadeRefresh.shouldEmitIgnoreMouseEvents).toBe(true)
    expect(fadeRefresh.nextIgnoreMouseEvents).toBe(true)
    expect(fadeRefresh.debugPayload.reason).toBe('live2d-faded-pass-through')
    expect(fadeRefresh.debugPayload.trigger).toBe('fade-state-changed')
    expect(fadeRefresh.debugPayload.isPointerInsideLive2DFadeTriggerArea).toBe(true)

    const duplicateFadeRefresh = resolveWindowMouseIgnoreRefresh({
      trigger: 'fade-state-changed',
      isLive2DFadedForReading: true,
      shouldFadeOnCursorWithin: true,
      isPointerInsideLive2DHitArea: true,
      isPointerInsideLive2DFadeTriggerArea: true,
      isPointerInsideProtectedControlElement: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy: fadedPolicy,
      emitter,
    })
    expect(duplicateFadeRefresh.shouldEmitIgnoreMouseEvents).toBe(false)
  })

  /** @example protected controls should override faded pass-through in refresh layer */
  it('keeps receive-mouse when protected controls are hovered even in faded state', () => {
    const emitter = new WindowMouseIgnoreStateEmitter()
    const policy = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: true,
      isLive2DFadedForReading: true,
      isPointerInsideControls: true,
    }))

    const refresh = resolveWindowMouseIgnoreRefresh({
      trigger: 'panel-state-changed',
      isLive2DFadedForReading: true,
      shouldFadeOnCursorWithin: true,
      isPointerInsideLive2DHitArea: true,
      isPointerInsideLive2DFadeTriggerArea: true,
      isPointerInsideProtectedControlElement: true,
      isPointerInsideControls: true,
      isPointerInsideControlAnchor: false,
      controlsPreActivationActive: false,
      policy,
      emitter,
    })

    expect(refresh.debugPayload.reason).toBe('controls-hover')
    expect(refresh.nextIgnoreMouseEvents).toBe(false)
    expect(refresh.shouldEmitIgnoreMouseEvents).toBe(true)
  })

  it('keeps default pass-through when only fade-trigger-area is active but live2d hit is false', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerInsideLive2DHitArea: false,
      isLive2DFadedForReading: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.reason).toBe('default-pass-through')
  })
})
