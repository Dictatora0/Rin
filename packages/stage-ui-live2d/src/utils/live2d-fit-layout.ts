export type Live2DResolvedFitMode = 'tall' | 'normal' | 'small' | 'full-body' | 'upper-body'
export type Live2DFitPreference = 'auto' | 'full-body' | 'upper-body'

interface Live2DResolvedFitProfile {
  mode: Live2DResolvedFitMode
  scaleMultiplier: number
  topPaddingRatio: number
  bottomPaddingRatio: number
  verticalAnchor: 'full-body-safe' | 'legacy-bottom'
}

export interface Live2DFitLayoutInput {
  viewportWidth: number
  viewportHeight: number
  modelWidth: number
  modelHeight: number
  userScale?: number
  xOffsetPx?: number
  yOffsetPx?: number
  fitPreference?: Live2DFitPreference
}

export interface Live2DFitLayoutResult {
  mode: Live2DResolvedFitMode
  resolvedFitMode: Live2DResolvedFitMode
  scale: number
  x: number
  y: number
}

/**
 * Legacy upper-body framing scale from `integration/final-hci-demo`.
 *
 * Use when:
 * - We need the historic companion framing with stronger face/upper-body focus
 *
 * Expects:
 * - Base scale already uses `min(heightScale, widthScale)` and viewport 95% fit
 *
 * Returns:
 * - A multiplier that recreates the legacy upper-body framing behavior
 */
const LEGACY_UPPER_BODY_SCALE_MULTIPLIER = 2.2
const AUTO_NORMAL_UPPER_BODY_SCALE_MULTIPLIER = 2.0
const AUTO_TALL_MIN_VIEWPORT_HEIGHT = 700
const AUTO_NORMAL_MIN_VIEWPORT_HEIGHT = 520

function toPositiveOrFallback(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0)
    return fallback
  return value
}

function resolveFitProfile(mode: Live2DResolvedFitMode): Live2DResolvedFitProfile {
  if (mode === 'full-body') {
    return {
      mode,
      scaleMultiplier: 1.0,
      topPaddingRatio: 0.06,
      bottomPaddingRatio: 0.01,
      verticalAnchor: 'full-body-safe',
    }
  }

  if (mode === 'upper-body') {
    return {
      mode,
      // NOTICE:
      // `2.2` matches the original legacy `Model.vue` framing from `integration/final-hci-demo`,
      // where scale used `min(heightScale, widthScale) * 2.2` and Y was pinned to viewport bottom.
      // This intentionally keeps a companion-style upper-body dominant crop.
      scaleMultiplier: LEGACY_UPPER_BODY_SCALE_MULTIPLIER,
      topPaddingRatio: 0.015,
      bottomPaddingRatio: 0,
      verticalAnchor: 'legacy-bottom',
    }
  }

  if (mode === 'tall') {
    return {
      mode,
      scaleMultiplier: 1.06,
      topPaddingRatio: 0.065,
      bottomPaddingRatio: 0.012,
      verticalAnchor: 'full-body-safe',
    }
  }

  if (mode === 'small') {
    return {
      mode,
      scaleMultiplier: LEGACY_UPPER_BODY_SCALE_MULTIPLIER,
      topPaddingRatio: 0.015,
      bottomPaddingRatio: 0,
      verticalAnchor: 'legacy-bottom',
    }
  }

  return {
    mode: 'normal',
    scaleMultiplier: AUTO_NORMAL_UPPER_BODY_SCALE_MULTIPLIER,
    topPaddingRatio: 0.02,
    bottomPaddingRatio: 0,
    verticalAnchor: 'legacy-bottom',
  }
}

/**
 * Resolves an adaptive fit mode from viewport height.
 *
 * Use when:
 * - Live2D layout needs a stable "tall / normal / small" strategy
 * - The model should show more body in taller windows
 *
 * Expects:
 * - `viewportHeight` is the current render height in pixels
 *
 * Returns:
 * - `tall`, `normal`, or `small`
 */
export function resolveLive2DAutoFitMode(viewportHeight: number): Live2DResolvedFitMode {
  if (viewportHeight >= AUTO_TALL_MIN_VIEWPORT_HEIGHT)
    return 'tall'
  if (viewportHeight >= AUTO_NORMAL_MIN_VIEWPORT_HEIGHT)
    return 'normal'
  return 'small'
}

/**
 * Computes Live2D scale and position for responsive full-body fitting.
 *
 * Use when:
 * - Stage resizes and model layout must be recomputed
 * - Taller windows should reveal more lower body while small windows keep face/upper-body visible
 *
 * Expects:
 * - `viewportWidth/viewportHeight` and `modelWidth/modelHeight` are in pixels
 * - Offsets are pixel offsets relative to centered placement
 *
 * Returns:
 * - Final scale, x/y position, and resolved fit mode
 */
export function computeLive2DFitLayout(input: Live2DFitLayoutInput): Live2DFitLayoutResult {
  const viewportWidth = toPositiveOrFallback(input.viewportWidth, 1)
  const viewportHeight = toPositiveOrFallback(input.viewportHeight, 1)
  const modelWidth = toPositiveOrFallback(input.modelWidth, 1)
  const modelHeight = toPositiveOrFallback(input.modelHeight, 1)
  const userScale = toPositiveOrFallback(input.userScale ?? 1, 1)
  const xOffsetPx = Number.isFinite(input.xOffsetPx) ? input.xOffsetPx! : 0
  const yOffsetPx = Number.isFinite(input.yOffsetPx) ? input.yOffsetPx! : 0

  const fitPreference = input.fitPreference ?? 'auto'
  const resolvedMode = fitPreference === 'auto'
    ? resolveLive2DAutoFitMode(viewportHeight)
    : fitPreference

  const profile = resolveFitProfile(resolvedMode)
  const topPadding = viewportHeight * profile.topPaddingRatio
  const bottomPadding = viewportHeight * profile.bottomPaddingRatio

  const baseHeightScale = viewportHeight * 0.95 / modelHeight
  const baseWidthScale = viewportWidth * 0.95 / modelWidth
  let scale = Math.min(baseHeightScale, baseWidthScale) * profile.scaleMultiplier * userScale

  if (profile.verticalAnchor === 'full-body-safe') {
    const maxScaleForFullBody = ((viewportHeight - topPadding - bottomPadding) / modelHeight) * userScale
    if (Number.isFinite(maxScaleForFullBody) && maxScaleForFullBody > 0)
      scale = Math.min(scale, maxScaleForFullBody)
  }

  if (!Number.isFinite(scale) || scale <= 0)
    scale = 1e-6

  const halfHeight = modelHeight * scale * 0.5
  const preferredFullBodyY = viewportHeight - bottomPadding - halfHeight
  const baseY = profile.verticalAnchor === 'legacy-bottom'
    ? viewportHeight - bottomPadding
    : preferredFullBodyY

  return {
    mode: resolvedMode,
    resolvedFitMode: resolvedMode,
    scale,
    x: (viewportWidth / 2) + xOffsetPx,
    y: baseY + yOffsetPx,
  }
}
