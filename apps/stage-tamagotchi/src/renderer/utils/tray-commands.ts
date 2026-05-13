import type { TamagotchiTrayCommandPayload } from '../../shared/eventa'

export interface ApplyTrayCommandContext {
  openStudyPanel: () => void
  openVisionPanel: () => void
  openShortcutGuide: () => void
  toggleMoveMode: () => void
  setFitPreference: (fitPreference: 'auto' | 'full-body' | 'upper-body') => void
  setAlwaysOnTop: (alwaysOnTop: boolean) => void
  getRinScale: () => number
  setRinScale: (scale: number) => void
}

function clampRinScale(scale: number) {
  return Math.min(1.35, Math.max(0.75, scale))
}

/**
 * Applies one tray command to renderer-side stage actions.
 *
 * Use when:
 * - Renderer receives tray quick action events from Electron main
 * - Command handling should be testable outside Vue component lifecycle
 *
 * Expects:
 * - Context callbacks are stable and side-effect safe
 * - Scale getter returns current Rin display scale
 *
 * Returns:
 * - `true` when command is recognized and handled
 */
export function applyTrayCommand(payload: TamagotchiTrayCommandPayload, context: ApplyTrayCommandContext): boolean {
  switch (payload.command) {
    case 'open-study-panel':
      context.openStudyPanel()
      return true
    case 'open-vision-panel':
      context.openVisionPanel()
      return true
    case 'open-shortcut-guide':
      context.openShortcutGuide()
      return true
    case 'toggle-move-mode':
      context.toggleMoveMode()
      return true
    case 'set-fit-preference':
      if (payload.fitPreference) {
        context.setFitPreference(payload.fitPreference)
        return true
      }
      return false
    case 'set-always-on-top':
      if (typeof payload.alwaysOnTop === 'boolean') {
        context.setAlwaysOnTop(payload.alwaysOnTop)
        return true
      }
      return false
    case 'increase-rin-scale': {
      const next = clampRinScale(Number((context.getRinScale() + 0.05).toFixed(2)))
      context.setRinScale(next)
      return true
    }
    case 'decrease-rin-scale': {
      const next = clampRinScale(Number((context.getRinScale() - 0.05).toFixed(2)))
      context.setRinScale(next)
      return true
    }
    case 'reset-rin-scale':
      context.setRinScale(1)
      return true
    default:
      return false
  }
}
