import { describe, expect, it, vi } from 'vitest'

import { applyTrayCommand } from './tray-commands'

function createContext(scale = 1) {
  let currentScale = scale
  return {
    openStudyPanel: vi.fn(),
    openVisionPanel: vi.fn(),
    openShortcutGuide: vi.fn(),
    toggleMoveMode: vi.fn(),
    setFitPreference: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    getRinScale: vi.fn(() => currentScale),
    setRinScale: vi.fn((next: number) => {
      currentScale = next
    }),
  }
}

describe('applyTrayCommand', () => {
  it('handles open study panel command', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'open-study-panel' }, context)

    expect(handled).toBe(true)
    expect(context.openStudyPanel).toHaveBeenCalledTimes(1)
  })

  it('handles open vision panel command', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'open-vision-panel' }, context)

    expect(handled).toBe(true)
    expect(context.openVisionPanel).toHaveBeenCalledTimes(1)
  })

  it('handles open shortcut guide command', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'open-shortcut-guide' }, context)

    expect(handled).toBe(true)
    expect(context.openShortcutGuide).toHaveBeenCalledTimes(1)
  })

  it('handles move mode toggle command', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'toggle-move-mode' }, context)

    expect(handled).toBe(true)
    expect(context.toggleMoveMode).toHaveBeenCalledTimes(1)
  })

  it('handles fit preference command with payload', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'set-fit-preference', fitPreference: 'full-body' }, context)

    expect(handled).toBe(true)
    expect(context.setFitPreference).toHaveBeenCalledWith('full-body')
  })

  it('rejects fit preference command without payload', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'set-fit-preference' }, context)

    expect(handled).toBe(false)
    expect(context.setFitPreference).not.toHaveBeenCalled()
  })

  it('handles always-on-top command with boolean payload', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'set-always-on-top', alwaysOnTop: true }, context)

    expect(handled).toBe(true)
    expect(context.setAlwaysOnTop).toHaveBeenCalledWith(true)
  })

  it('rejects always-on-top command without boolean payload', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'set-always-on-top' }, context)

    expect(handled).toBe(false)
    expect(context.setAlwaysOnTop).not.toHaveBeenCalled()
  })

  it('increases rin scale with clamp', () => {
    const context = createContext(1.33)

    const handled = applyTrayCommand({ command: 'increase-rin-scale' }, context)

    expect(handled).toBe(true)
    expect(context.setRinScale).toHaveBeenCalledWith(1.35)
  })

  it('decreases rin scale with clamp', () => {
    const context = createContext(0.76)

    const handled = applyTrayCommand({ command: 'decrease-rin-scale' }, context)

    expect(handled).toBe(true)
    expect(context.setRinScale).toHaveBeenCalledWith(0.75)
  })

  it('resets rin scale to 1.0', () => {
    const context = createContext(1.22)

    const handled = applyTrayCommand({ command: 'reset-rin-scale' }, context)

    expect(handled).toBe(true)
    expect(context.setRinScale).toHaveBeenCalledWith(1)
  })

  it('returns false for unknown command', () => {
    const context = createContext()

    const handled = applyTrayCommand({ command: 'not-supported' as never }, context)

    expect(handled).toBe(false)
  })
})
