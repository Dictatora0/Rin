import { describe, expect, it } from 'vitest'

import {
  buildLive2DHitAreaDebugPayload,
  computeWindowMouseIgnorePolicy,
  WindowMouseIgnoreStateEmitter,
} from './window-click-through-policy'

describe('window click-through policy', () => {
  /** @example default idle state should pass-through clicks outside model/UI */
  it('enables click-through in fallback state', () => {
    const result = computeWindowMouseIgnorePolicy({
      stagePaused: false,
      moveModeEnabled: false,
      controlsPanelExpanded: false,
      hearingDialogOpen: false,
      studyPanelPinned: false,
      visionPanelPinned: false,
      hasFocusedFormField: false,
      isPointerInsideControls: false,
      isNearWindowBorder: false,
      isPointerInsideLive2DHitArea: false,
      fadeOnHoverEnabled: true,
    })

    expect(result.shouldIgnoreMouseEvents).toBe(true)
    expect(result.shouldFadeStage).toBe(true)
    expect(result.reason).toBe('fallback-click-through')
  })

  /** @example character-hover should keep window interactive even without open panels */
  it('keeps mouse events when pointer is inside live2d hit area', () => {
    const result = computeWindowMouseIgnorePolicy({
      stagePaused: false,
      moveModeEnabled: false,
      controlsPanelExpanded: false,
      hearingDialogOpen: false,
      studyPanelPinned: false,
      visionPanelPinned: false,
      hasFocusedFormField: false,
      isPointerInsideControls: false,
      isNearWindowBorder: false,
      isPointerInsideLive2DHitArea: true,
      fadeOnHoverEnabled: true,
    })

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('character-hit-area')
  })

  /** @example focused text input must override click-through to keep typing stable */
  it('keeps mouse events when any form field is focused', () => {
    const result = computeWindowMouseIgnorePolicy({
      stagePaused: false,
      moveModeEnabled: false,
      controlsPanelExpanded: false,
      hearingDialogOpen: false,
      studyPanelPinned: false,
      visionPanelPinned: false,
      hasFocusedFormField: true,
      isPointerInsideControls: false,
      isNearWindowBorder: false,
      isPointerInsideLive2DHitArea: false,
      fadeOnHoverEnabled: false,
    })

    expect(result.shouldIgnoreMouseEvents).toBe(false)
    expect(result.reason).toBe('input-focused')
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
})
