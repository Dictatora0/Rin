import { describe, expect, it } from 'vitest'

import {
  applyWindowZoomShortcutAction,
  resolveWindowShortcutOptions,
  resolveWindowZoomShortcutAction,
} from './window-shortcuts'

describe('resolveWindowShortcutOptions', () => {
  it('enables zoom shortcuts for AIRI main window', () => {
    expect(resolveWindowShortcutOptions('AIRI').zoom).toBe(true)
  })

  it('keeps zoom shortcuts disabled for non-main windows', () => {
    expect(resolveWindowShortcutOptions('Settings').zoom).toBe(false)
    expect(resolveWindowShortcutOptions('Chat').zoom).toBe(false)
    expect(resolveWindowShortcutOptions('Notice').zoom).toBe(false)
  })
})

describe('resolveWindowZoomShortcutAction', () => {
  it('maps minus and numpad subtract to zoom-out', () => {
    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'Minus',
      key: '-',
      meta: true,
    })).toBe('zoom-out')

    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'NumpadSubtract',
      key: '-',
      control: true,
    })).toBe('zoom-out')
  })

  it('maps equal/plus and numpad add to zoom-in', () => {
    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'Equal',
      key: '=',
      meta: true,
    })).toBe('zoom-in')

    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'NumpadAdd',
      key: '+',
      control: true,
    })).toBe('zoom-in')
  })

  it('maps digit zero to reset', () => {
    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'Digit0',
      key: '0',
      meta: true,
    })).toBe('reset')
  })

  it('ignores non-shortcut inputs', () => {
    expect(resolveWindowZoomShortcutAction({
      type: 'keyDown',
      code: 'Minus',
      key: '-',
    })).toBeNull()

    expect(resolveWindowZoomShortcutAction({
      type: 'keyUp',
      code: 'Minus',
      key: '-',
      meta: true,
    })).toBeNull()
  })
})

describe('applyWindowZoomShortcutAction', () => {
  it('increments and decrements zoom by fixed step', () => {
    expect(applyWindowZoomShortcutAction(0, 'zoom-in')).toBe(0.5)
    expect(applyWindowZoomShortcutAction(0, 'zoom-out')).toBe(-0.5)
  })

  it('resets zoom to zero', () => {
    expect(applyWindowZoomShortcutAction(1.5, 'reset')).toBe(0)
  })

  it('clamps zoom levels to safe bounds', () => {
    expect(applyWindowZoomShortcutAction(9, 'zoom-in')).toBe(9)
    expect(applyWindowZoomShortcutAction(-8, 'zoom-out')).toBe(-8)
  })
})
