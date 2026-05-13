export type StageShortcutAction
  = | 'controls-zoom-in'
    | 'controls-zoom-out'
    | 'rin-scale-up'
    | 'rin-scale-down'
    | 'rin-scale-reset'
    | 'toggle-move-mode'
    | 'toggle-study-panel'
    | 'toggle-vision-panel'
    | 'show-shortcuts-guide'
    | 'escape'

export interface StageShortcutEventLike {
  key: string
  code?: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

/**
 * Live2D display scale limits used by renderer keyboard shortcuts.
 *
 * Use when:
 * - Adjusting Rin display size from keyboard interactions
 *
 * Expects:
 * - Scale changes to remain within a safe visual range
 *
 * Returns:
 * - A stable scale range and step value
 */
export const LIVE2D_DISPLAY_SHORTCUT_SCALE = {
  min: 0.75,
  max: 1.35,
  step: 0.05,
  defaultValue: 1,
} as const

/**
 * Normalizes a raw display scale into a finite fallback-safe value.
 *
 * Before:
 * - NaN / Infinity / invalid numbers
 *
 * After:
 * - `1.0`
 */
export function normalizeLive2DDisplayScale(value: number) {
  if (!Number.isFinite(value))
    return LIVE2D_DISPLAY_SHORTCUT_SCALE.defaultValue

  return value
}

/**
 * Clamps Rin display scale to the supported shortcut range.
 *
 * Before:
 * - `0.2`
 * - `2.0`
 *
 * After:
 * - `0.75`
 * - `1.35`
 */
export function clampLive2DDisplayScale(value: number) {
  const normalized = normalizeLive2DDisplayScale(value)
  return Math.min(
    LIVE2D_DISPLAY_SHORTCUT_SCALE.max,
    Math.max(LIVE2D_DISPLAY_SHORTCUT_SCALE.min, normalized),
  )
}

function isPrimaryModifierPressed(event: StageShortcutEventLike) {
  return Boolean(event.metaKey || event.ctrlKey)
}

function isEqualOrPlusKey(event: StageShortcutEventLike) {
  return event.code === 'Equal'
    || event.code === 'NumpadAdd'
    || event.key === '='
    || event.key === '+'
}

function isMinusKey(event: StageShortcutEventLike) {
  return event.code === 'Minus'
    || event.code === 'NumpadSubtract'
    || event.key === '-'
    || event.key === '_'
}

function isDigitZeroKey(event: StageShortcutEventLike) {
  return event.code === 'Digit0'
    || event.code === 'Numpad0'
    || event.key === '0'
    || event.key === ')'
}

function matchPrimaryShortcutKey(event: StageShortcutEventLike, key: string) {
  return event.key.toLowerCase() === key
}

/**
 * Resolves a renderer keyboard event into one stage shortcut action.
 *
 * Use when:
 * - Handling unified keyboard shortcuts in stage renderer
 *
 * Expects:
 * - Event-like object from `keydown`
 *
 * Returns:
 * - A shortcut action key, or `null` when not matched
 */
export function resolveStageShortcut(event: StageShortcutEventLike): StageShortcutAction | null {
  if (event.key === 'Escape')
    return 'escape'

  if (!isPrimaryModifierPressed(event))
    return null

  if (event.shiftKey) {
    if (isEqualOrPlusKey(event))
      return 'rin-scale-up'

    if (isMinusKey(event))
      return 'rin-scale-down'

    if (isDigitZeroKey(event))
      return 'rin-scale-reset'

    if (matchPrimaryShortcutKey(event, 'm'))
      return 'toggle-move-mode'

    if (matchPrimaryShortcutKey(event, 't'))
      return 'toggle-study-panel'

    if (matchPrimaryShortcutKey(event, 'v'))
      return 'toggle-vision-panel'

    if (matchPrimaryShortcutKey(event, 'k'))
      return 'show-shortcuts-guide'

    return null
  }

  if (isEqualOrPlusKey(event))
    return 'controls-zoom-in'

  if (isMinusKey(event))
    return 'controls-zoom-out'

  return null
}

function hasTextboxRole(element: Element) {
  const role = element.getAttribute('role')
  return role === 'textbox'
}

/**
 * Determines whether stage shortcuts should be ignored for an event target.
 *
 * Use when:
 * - Preventing global shortcuts from hijacking text input interactions
 *
 * Expects:
 * - `event.target` from a DOM keyboard event
 *
 * Returns:
 * - `true` when shortcut should be skipped
 */
export function shouldIgnoreStageShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select')
    return true

  if (target.isContentEditable || hasTextboxRole(target))
    return true

  const editableParent = target.closest('[contenteditable="true"], [role="textbox"]')
  return editableParent != null
}
