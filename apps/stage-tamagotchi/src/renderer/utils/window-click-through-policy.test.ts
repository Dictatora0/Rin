import { describe, expect, it } from 'vitest'

import {
  buildLive2DHitAreaDebugPayload,
  buildWindowClickThroughDebugPayload,
  computeWindowMouseIgnorePolicy,
  WindowMouseIgnoreStateEmitter,
} from './window-click-through-policy'

describe('window click-through policy', () => {
  function createInput(overrides: Partial<Parameters<typeof computeWindowMouseIgnorePolicy>[0]> = {}) {
    return {
      isPointerInsideLive2DHitArea: false,
      isPointerInsideControls: false,
      isPointerInsideControlAnchor: false,
      isPointerInsideStudyPanel: false,
      isPointerInsideVisionPanel: false,
      isPointerInsideMoveHitArea: false,
      isNearWindowBorder: false,
      hasFocusedFormField: false,
      isDraggingWindow: false,
      isResizingWindow: false,
      isPointerDown: false,
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
    expect(result.reason).toBe('resizing')
  })

  /** @example pointer down should keep interaction until release */
  it('keeps mouse events while pointer is down', () => {
    const result = computeWindowMouseIgnorePolicy(createInput({
      isPointerDown: true,
    }))

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('pointer-down')
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
    const payload = buildWindowClickThroughDebugPayload({ policy })

    expect(payload.ignoreMouseEvents).toBe(false)
    expect(payload.reason).toBe('controls-hover')
    expect(payload.blockingStates.visionCameraRunning).toBe(true)
    expect(payload.blockingStates.studyTimerRunning).toBe(true)
  })
})
