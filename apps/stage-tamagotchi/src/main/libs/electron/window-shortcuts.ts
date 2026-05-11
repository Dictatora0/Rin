/**
 * Resolves Electron Toolkit shortcut options per BrowserWindow title.
 *
 * Use when:
 * - `optimizer.watchWindowShortcuts` is installed for every window.
 * - We need consistent zoom-shortcut behavior for selected windows only.
 *
 * Expects:
 * - `windowTitle` is the current `BrowserWindow#getTitle()` value.
 *
 * Returns:
 * - Shortcut options object accepted by `watchWindowShortcuts`.
 */
export function resolveWindowShortcutOptions(windowTitle: string) {
  return {
    // Keep browser zoom shortcuts enabled only in the stage main window.
    zoom: windowTitle === 'AIRI',
  } as const
}

export type WindowZoomShortcutAction = 'zoom-in' | 'zoom-out' | 'reset'

export interface WindowZoomShortcutInput {
  type?: string
  key?: string
  code?: string
  control?: boolean
  meta?: boolean
}

/**
 * Resolves zoom shortcut action from an Electron `before-input-event` payload.
 *
 * Use when:
 * - Browser-level zoom shortcuts are inconsistent across keyboard layouts.
 * - Main window must honor Command/Ctrl + plus/minus/zero reliably.
 *
 * Expects:
 * - Input shape compatible with Electron's `Input` object.
 *
 * Returns:
 * - `zoom-in`, `zoom-out`, `reset`, or `null` when not a supported zoom shortcut.
 */
export function resolveWindowZoomShortcutAction(input: WindowZoomShortcutInput): WindowZoomShortcutAction | null {
  if (input.type && input.type !== 'keyDown')
    return null

  if (!input.control && !input.meta)
    return null

  const key = input.key ?? ''
  const code = input.code ?? ''

  if (code === 'Digit0' || code === 'Numpad0' || key === '0')
    return 'reset'

  if (
    code === 'Minus'
    || code === 'NumpadSubtract'
    || key === '-'
    || key === '_'
    || key === '−'
    || key === '–'
  ) {
    return 'zoom-out'
  }

  if (
    code === 'Equal'
    || code === 'NumpadAdd'
    || key === '='
    || key === '+'
  ) {
    return 'zoom-in'
  }

  return null
}

/**
 * Applies one zoom shortcut action to a webContents zoom level.
 *
 * Use when:
 * - Handling zoom shortcuts in main process and needing deterministic zoom steps.
 *
 * Expects:
 * - `currentZoomLevel` is the current `webContents.getZoomLevel()` value.
 * - `action` comes from {@link resolveWindowZoomShortcutAction}.
 *
 * Returns:
 * - The next zoom level clamped to Electron's default safe range.
 */
export function applyWindowZoomShortcutAction(
  currentZoomLevel: number,
  action: WindowZoomShortcutAction,
) {
  const ZOOM_LEVEL_STEP = 0.5
  const MIN_ZOOM_LEVEL = -8
  const MAX_ZOOM_LEVEL = 9

  if (action === 'reset')
    return 0

  const nextZoomLevel = action === 'zoom-in'
    ? currentZoomLevel + ZOOM_LEVEL_STEP
    : currentZoomLevel - ZOOM_LEVEL_STEP

  return Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, nextZoomLevel))
}
