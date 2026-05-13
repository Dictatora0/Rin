// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import {
  clampLive2DDisplayScale,
  LIVE2D_DISPLAY_SHORTCUT_SCALE,
  resolveStageShortcut,
  shouldIgnoreStageShortcutTarget,
} from './keyboard-shortcuts'

describe('resolveStageShortcut', () => {
  it('resolves command plus to controls zoom in', () => {
    const shortcut = resolveStageShortcut({
      key: '+',
      code: 'Equal',
      metaKey: true,
    })

    expect(shortcut).toBe('controls-zoom-in')
  })

  it('resolves command minus to controls zoom out', () => {
    const shortcut = resolveStageShortcut({
      key: '-',
      code: 'Minus',
      metaKey: true,
    })

    expect(shortcut).toBe('controls-zoom-out')
  })

  it('resolves command shift plus to rin scale up', () => {
    const shortcut = resolveStageShortcut({
      key: '+',
      code: 'Equal',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('rin-scale-up')
  })

  it('resolves command shift minus to rin scale down', () => {
    const shortcut = resolveStageShortcut({
      key: '-',
      code: 'Minus',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('rin-scale-down')
  })

  it('resolves command shift 0 to rin scale reset', () => {
    const shortcut = resolveStageShortcut({
      key: '0',
      code: 'Digit0',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('rin-scale-reset')
  })

  it('resolves command shift m to move mode toggle', () => {
    const shortcut = resolveStageShortcut({
      key: 'm',
      code: 'KeyM',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('toggle-move-mode')
  })

  it('resolves command shift t to study panel toggle', () => {
    const shortcut = resolveStageShortcut({
      key: 't',
      code: 'KeyT',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('toggle-study-panel')
  })

  it('resolves command shift v to vision panel toggle', () => {
    const shortcut = resolveStageShortcut({
      key: 'v',
      code: 'KeyV',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('toggle-vision-panel')
  })

  it('resolves command shift k to shortcuts guide toggle', () => {
    const shortcut = resolveStageShortcut({
      key: 'k',
      code: 'KeyK',
      metaKey: true,
      shiftKey: true,
    })

    expect(shortcut).toBe('show-shortcuts-guide')
  })

  it('resolves escape to escape action', () => {
    const shortcut = resolveStageShortcut({
      key: 'Escape',
      code: 'Escape',
    })

    expect(shortcut).toBe('escape')
  })

  it('returns null for non-matching shortcut', () => {
    const shortcut = resolveStageShortcut({
      key: 'p',
      code: 'KeyP',
      metaKey: true,
    })

    expect(shortcut).toBeNull()
  })
})

describe('shouldIgnoreStageShortcutTarget', () => {
  it('ignores input target', () => {
    const input = document.createElement('input')

    expect(shouldIgnoreStageShortcutTarget(input)).toBe(true)
  })

  it('ignores textarea target', () => {
    const textarea = document.createElement('textarea')

    expect(shouldIgnoreStageShortcutTarget(textarea)).toBe(true)
  })

  it('ignores select target', () => {
    const select = document.createElement('select')

    expect(shouldIgnoreStageShortcutTarget(select)).toBe(true)
  })

  it('ignores contenteditable target', () => {
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')

    expect(shouldIgnoreStageShortcutTarget(editable)).toBe(true)
  })

  it('ignores role textbox target', () => {
    const textbox = document.createElement('div')
    textbox.setAttribute('role', 'textbox')

    expect(shouldIgnoreStageShortcutTarget(textbox)).toBe(true)
  })

  it('does not ignore regular div target', () => {
    const div = document.createElement('div')

    expect(shouldIgnoreStageShortcutTarget(div)).toBe(false)
  })
})

describe('clampLive2DDisplayScale', () => {
  it('clamps lower than min to min', () => {
    expect(clampLive2DDisplayScale(0.1)).toBe(LIVE2D_DISPLAY_SHORTCUT_SCALE.min)
  })

  it('clamps higher than max to max', () => {
    expect(clampLive2DDisplayScale(2)).toBe(LIVE2D_DISPLAY_SHORTCUT_SCALE.max)
  })

  it('falls back invalid values to default', () => {
    expect(clampLive2DDisplayScale(Number.NaN)).toBe(LIVE2D_DISPLAY_SHORTCUT_SCALE.defaultValue)
  })
})
