const CLICK_THROUGH_PROTECTED_SELECTORS = [
  '[data-click-through-protected="true"]',
  '[data-control-button="true"]',
  '[data-control-layer="controls-island"]',
  '[data-control-layer="controls-anchor"]',
  '[data-floating-panel="true"]',
  '[data-shortcut-guide-panel="true"]',
].join(', ')

/**
 * Checks whether the given element or one of its ancestors should block click-through.
 *
 * Use when:
 * - Pointer hit-testing needs to distinguish control UI from transparent pass-through regions
 *
 * Expects:
 * - `element` can be null and is usually from `document.elementFromPoint`
 *
 * Returns:
 * - `true` when the element is inside protected controls/floating panel regions
 */
export function isClickThroughProtectedElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement))
    return false

  return !!element.closest(CLICK_THROUGH_PROTECTED_SELECTORS)
}

/**
 * Returns the closest protected element at the point if it exists.
 *
 * Use when:
 * - Need concrete protected node details for diagnostics and policy wiring
 *
 * Expects:
 * - `x` / `y` are viewport-relative coordinates
 * - `doc` defaults to global `document`
 *
 * Returns:
 * - Matched protected ancestor element or `null`
 */
export function getClickThroughProtectedElementFromPoint(
  x: number,
  y: number,
  doc: Document = document,
): Element | null {
  if (!Number.isFinite(x) || !Number.isFinite(y))
    return null

  const hovered = doc.elementFromPoint(x, y)
  if (!(hovered instanceof HTMLElement))
    return null

  return hovered.closest(CLICK_THROUGH_PROTECTED_SELECTORS)
}

/**
 * Checks whether a viewport point is inside a click-through protected element.
 *
 * Use when:
 * - Policy input requires a simple boolean from current pointer position
 *
 * Expects:
 * - `doc` supports `elementFromPoint`
 *
 * Returns:
 * - `true` if point resolves to protected controls/floating panel ancestors
 */
export function isPointInsideClickThroughProtectedElement(
  x: number,
  y: number,
  doc: Document = document,
): boolean {
  return !!getClickThroughProtectedElementFromPoint(x, y, doc)
}
