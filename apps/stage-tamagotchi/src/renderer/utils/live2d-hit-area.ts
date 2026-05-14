import type { Live2DFitPreference, Live2DResolvedFitMode } from '@proj-airi/stage-ui-live2d/utils/live2d-fit-layout'

import { computeLive2DFitLayout } from '@proj-airi/stage-ui-live2d/utils/live2d-fit-layout'

export type Live2DHitZonePreset = 'precise' | 'normal' | 'loose'

export interface Live2DHitAreaRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface ComputeLive2DHitAreaInput {
  viewportWidth: number
  viewportHeight: number
  modelWidth: number
  modelHeight: number
  userScale?: number
  xOffsetPx?: number
  yOffsetPx?: number
  fitPreference?: Live2DFitPreference
  zonePreset?: Live2DHitZonePreset
}

export interface Live2DHitAreaResult {
  area: Live2DHitAreaRect
  resolvedFitMode: Live2DResolvedFitMode
}

export interface ComputeLive2DFadeTriggerAreaInput extends ComputeLive2DHitAreaInput {
  fadeMarginX?: number
  fadeMarginY?: number
}

export interface Live2DFadeTriggerAreaResult {
  area: Live2DHitAreaRect
  resolvedFitMode: Live2DResolvedFitMode
}

interface HitAreaRatioProfile {
  widthRatio: number
  topInsetRatio: number
  bottomInsetRatio: number
}

interface FadeTriggerExpansionProfile {
  widthRatio: number
  extraTopRatio: number
  extraBottomRatio: number
  minMarginX: number
  minMarginY: number
}

const HIT_ZONE_PRESET_PROFILE: Record<Live2DHitZonePreset, HitAreaRatioProfile> = {
  precise: {
    widthRatio: 0.42,
    topInsetRatio: 0.13,
    bottomInsetRatio: 0.1,
  },
  normal: {
    widthRatio: 0.46,
    topInsetRatio: 0.11,
    bottomInsetRatio: 0.1,
  },
  loose: {
    widthRatio: 0.58,
    topInsetRatio: 0.08,
    bottomInsetRatio: 0.06,
  },
}

const FADE_TRIGGER_EXPANSION_PROFILE_BY_MODE: Record<Live2DResolvedFitMode, FadeTriggerExpansionProfile> = {
  'tall': {
    widthRatio: 0.16,
    extraTopRatio: 0.1,
    extraBottomRatio: 0.08,
    minMarginX: 54,
    minMarginY: 58,
  },
  'normal': {
    widthRatio: 0.18,
    extraTopRatio: 0.12,
    extraBottomRatio: 0.08,
    minMarginX: 56,
    minMarginY: 60,
  },
  'small': {
    widthRatio: 0.14,
    extraTopRatio: 0.14,
    extraBottomRatio: 0.08,
    minMarginX: 52,
    minMarginY: 56,
  },
  'full-body': {
    widthRatio: 0.14,
    extraTopRatio: 0.09,
    extraBottomRatio: 0.11,
    minMarginX: 50,
    minMarginY: 54,
  },
  'upper-body': {
    widthRatio: 0.22,
    extraTopRatio: 0.17,
    extraBottomRatio: 0.07,
    minMarginX: 62,
    minMarginY: 64,
  },
}

function toPositiveOrFallback(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0)
    return fallback
  return value
}

function toFiniteOrFallback(value: number | undefined, fallback: number) {
  if (value == null || !Number.isFinite(value))
    return fallback
  return value
}

function toNonNegativeFiniteOrFallback(value: number | undefined, fallback: number) {
  if (value == null || !Number.isFinite(value) || value < 0)
    return fallback
  return value
}

/**
 * Clamps a numeric value into the inclusive [min, max] range.
 *
 * Use when:
 * - Geometry edges must stay inside the stage viewport
 *
 * Expects:
 * - `min` is less than or equal to `max`
 *
 * Returns:
 * - Clamped finite number
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Resolves the hit-area ratio profile for a given preset.
 *
 * Use when:
 * - The clickable character zone should support strict/normal/loose presets
 *
 * Expects:
 * - Unknown presets may arrive from persisted settings or manual input
 *
 * Returns:
 * - Stable fallback profile (`normal`) when preset is unknown
 */
function resolveHitZoneProfile(preset: Live2DHitZonePreset | string | undefined): HitAreaRatioProfile {
  if (preset === 'precise' || preset === 'loose' || preset === 'normal')
    return HIT_ZONE_PRESET_PROFILE[preset]
  return HIT_ZONE_PRESET_PROFILE.normal
}

/**
 * Computes an approximate on-screen Live2D character hit area.
 *
 * Use when:
 * - Renderer needs to decide whether to disable click-through for model interaction
 * - Full transparent window should not be treated as interactive
 *
 * Expects:
 * - Viewport and model dimensions are finite pixel values
 * - Offsets are pixel offsets relative to centered model placement
 *
 * Returns:
 * - Viewport-clamped character hit area and resolved fit mode
 */
export function computeLive2DHitArea(input: ComputeLive2DHitAreaInput): Live2DHitAreaResult {
  const viewportWidth = toPositiveOrFallback(input.viewportWidth, 1)
  const viewportHeight = toPositiveOrFallback(input.viewportHeight, 1)
  const modelWidth = toPositiveOrFallback(input.modelWidth, 1)
  const modelHeight = toPositiveOrFallback(input.modelHeight, 1)
  const userScale = toPositiveOrFallback(input.userScale ?? 1, 1)
  const xOffsetPx = toFiniteOrFallback(input.xOffsetPx, 0)
  const yOffsetPx = toFiniteOrFallback(input.yOffsetPx, 0)

  const fitLayout = computeLive2DFitLayout({
    viewportWidth,
    viewportHeight,
    modelWidth,
    modelHeight,
    userScale,
    xOffsetPx,
    yOffsetPx,
    fitPreference: input.fitPreference,
  })

  const presetProfile = resolveHitZoneProfile(input.zonePreset)
  const projectedWidth = Math.max(1, modelWidth * fitLayout.scale)
  const projectedHeight = Math.max(1, modelHeight * fitLayout.scale)

  const rawWidth = projectedWidth * presetProfile.widthRatio
  const minHitWidth = Math.min(viewportWidth, 96)
  const maxHitWidth = Math.min(viewportWidth, projectedWidth * 0.86)
  const hitWidth = clamp(rawWidth, minHitWidth, Math.max(minHitWidth, maxHitWidth))

  const topInset = projectedHeight * presetProfile.topInsetRatio
  const bottomInset = projectedHeight * presetProfile.bottomInsetRatio

  const rawLeft = fitLayout.x - (hitWidth / 2)
  const rawRight = fitLayout.x + (hitWidth / 2)
  const rawTop = fitLayout.y - (projectedHeight / 2) + topInset
  const rawBottom = fitLayout.y + (projectedHeight / 2) - bottomInset

  const left = clamp(rawLeft, 0, viewportWidth)
  const right = clamp(rawRight, 0, viewportWidth)
  const top = clamp(rawTop, 0, viewportHeight)
  const bottom = clamp(rawBottom, 0, viewportHeight)

  const area: Live2DHitAreaRect = {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }

  return {
    area,
    resolvedFitMode: fitLayout.resolvedFitMode,
  }
}

/**
 * Checks whether a window-relative mouse coordinate is inside the computed Live2D hit area.
 *
 * Use when:
 * - Click-through policy needs a deterministic "character-hover" signal
 *
 * Expects:
 * - `x` and `y` are finite window-relative coordinates
 *
 * Returns:
 * - `true` only when the point is inside the inclusive rectangular hit area
 */
export function isPointInLive2DHitArea(point: { x: number, y: number }, area: Live2DHitAreaRect) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    return false

  return point.x >= area.left
    && point.x <= area.right
    && point.y >= area.top
    && point.y <= area.bottom
}

/**
 * Computes a near-cursor fade trigger area around Live2D interaction hit area.
 *
 * Use when:
 * - Fade-on-hover should respond earlier than strict interaction hit-testing
 * - Pointer entering nearby character space should quickly fade the stage
 *
 * Expects:
 * - Viewport and model dimensions are finite pixel values
 * - Margins are non-negative finite numbers
 *
 * Returns:
 * - Viewport-clamped fade trigger area larger than or equal to interaction hit area
 */
export function computeLive2DFadeTriggerArea(input: ComputeLive2DFadeTriggerAreaInput): Live2DFadeTriggerAreaResult {
  const viewportWidth = toPositiveOrFallback(input.viewportWidth, 1)
  const viewportHeight = toPositiveOrFallback(input.viewportHeight, 1)
  const interaction = computeLive2DHitArea(input)
  const modelWidth = toPositiveOrFallback(input.modelWidth, 1)
  const modelHeight = toPositiveOrFallback(input.modelHeight, 1)
  const userScale = toPositiveOrFallback(input.userScale ?? 1, 1)
  const xOffsetPx = toFiniteOrFallback(input.xOffsetPx, 0)
  const yOffsetPx = toFiniteOrFallback(input.yOffsetPx, 0)
  const fitLayout = computeLive2DFitLayout({
    viewportWidth,
    viewportHeight,
    modelWidth,
    modelHeight,
    userScale,
    xOffsetPx,
    yOffsetPx,
    fitPreference: input.fitPreference,
  })
  const projectedWidth = Math.max(1, modelWidth * fitLayout.scale)
  const projectedHeight = Math.max(1, modelHeight * fitLayout.scale)
  const expansionProfile = FADE_TRIGGER_EXPANSION_PROFILE_BY_MODE[interaction.resolvedFitMode]
  const marginX = Math.max(
    toNonNegativeFiniteOrFallback(input.fadeMarginX, expansionProfile.minMarginX),
    projectedWidth * expansionProfile.widthRatio,
  )
  const topMarginY = Math.max(
    toNonNegativeFiniteOrFallback(input.fadeMarginY, expansionProfile.minMarginY),
    projectedHeight * expansionProfile.extraTopRatio,
  )
  const bottomMarginY = Math.max(
    toNonNegativeFiniteOrFallback(input.fadeMarginY, expansionProfile.minMarginY),
    projectedHeight * expansionProfile.extraBottomRatio,
  )

  const expandedLeft = clamp(interaction.area.left - marginX, 0, viewportWidth)
  const expandedRight = clamp(interaction.area.right + marginX, 0, viewportWidth)
  const expandedTop = clamp(interaction.area.top - topMarginY, 0, viewportHeight)
  const expandedBottom = clamp(interaction.area.bottom + bottomMarginY, 0, viewportHeight)

  return {
    resolvedFitMode: interaction.resolvedFitMode,
    area: {
      left: expandedLeft,
      right: expandedRight,
      top: expandedTop,
      bottom: expandedBottom,
      width: Math.max(0, expandedRight - expandedLeft),
      height: Math.max(0, expandedBottom - expandedTop),
    },
  }
}

/**
 * Checks whether a window-relative mouse coordinate is inside the Live2D fade trigger area.
 *
 * Use when:
 * - Stage should fade quickly when pointer approaches the character
 *
 * Expects:
 * - `x` and `y` are finite window-relative coordinates
 *
 * Returns:
 * - `true` only when the point is inside the inclusive rectangular fade trigger area
 */
export function isPointInLive2DFadeTriggerArea(point: { x: number, y: number }, area: Live2DHitAreaRect) {
  return isPointInLive2DHitArea(point, area)
}
