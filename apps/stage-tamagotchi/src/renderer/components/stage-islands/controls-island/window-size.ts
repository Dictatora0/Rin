export interface StageWindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface StageWorkAreaBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface StageWindowSizeLimits {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

export type StageWindowSizeAction = 'zoom-in' | 'zoom-out' | 'reset-size'

const STAGE_WINDOW_ZOOM_FACTOR = 1.1
const STAGE_WINDOW_WORK_AREA_MARGIN = 24

/**
 * Recommended default stage window size.
 *
 * Use when:
 * - Resetting Rin to a predictable size across platforms
 *
 * Expects:
 * - Width and height are interpreted as BrowserWindow pixel bounds
 *
 * Returns:
 * - A stable desktop-pet friendly default footprint
 */
export const STAGE_WINDOW_DEFAULT_SIZE = {
  width: 450,
  height: 600,
} as const

/**
 * Safe lower bound for stage window controls visibility.
 *
 * Use when:
 * - Resizing from controls-island zoom actions
 * - Preventing Rin from shrinking until controls become hard to use
 *
 * Expects:
 * - Consumers clamp against these values before calling setBounds
 *
 * Returns:
 * - Minimum width and height that keep interactions reachable
 */
export const STAGE_WINDOW_MIN_SIZE = {
  width: 360,
  height: 460,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Resolves zoom-safe min/max size limits from display work area.
 *
 * Use when:
 * - Any controls-island zoom action needs to clamp size safely
 *
 * Expects:
 * - `workArea` comes from `electron.screen.getPrimaryDisplay().workArea`
 *
 * Returns:
 * - Min/max limits that keep size valid and bounded to the screen work area
 */
export function resolveStageWindowSizeLimits(workArea: StageWorkAreaBounds): StageWindowSizeLimits {
  const maxWidthCandidate = Math.max(1, workArea.width - STAGE_WINDOW_WORK_AREA_MARGIN)
  const maxHeightCandidate = Math.max(1, workArea.height - STAGE_WINDOW_WORK_AREA_MARGIN)
  const minWidth = Math.min(STAGE_WINDOW_MIN_SIZE.width, maxWidthCandidate)
  const minHeight = Math.min(STAGE_WINDOW_MIN_SIZE.height, maxHeightCandidate)

  return {
    minWidth,
    minHeight,
    maxWidth: Math.max(minWidth, maxWidthCandidate),
    maxHeight: Math.max(minHeight, maxHeightCandidate),
  }
}

/**
 * Calculates next BrowserWindow bounds for stage zoom controls.
 *
 * Use when:
 * - Controls-island triggers zoom in, zoom out, or reset size
 *
 * Expects:
 * - `currentBounds` and `workArea` are measured in the same coordinate space
 * - Caller applies the returned value with `electron.window.setBounds`
 *
 * Returns:
 * - Clamped bounds that preserve center position and remain inside work area
 */
export function calculateStageWindowBoundsForAction(params: {
  action: StageWindowSizeAction
  currentBounds: StageWindowBounds
  workArea: StageWorkAreaBounds
}): StageWindowBounds {
  const limits = resolveStageWindowSizeLimits(params.workArea)
  const centerX = params.currentBounds.x + params.currentBounds.width / 2
  const centerY = params.currentBounds.y + params.currentBounds.height / 2

  const scale = params.action === 'zoom-in'
    ? STAGE_WINDOW_ZOOM_FACTOR
    : params.action === 'zoom-out'
      ? 1 / STAGE_WINDOW_ZOOM_FACTOR
      : 1

  const targetWidth = params.action === 'reset-size'
    ? STAGE_WINDOW_DEFAULT_SIZE.width
    : Math.round(params.currentBounds.width * scale)

  const targetHeight = params.action === 'reset-size'
    ? STAGE_WINDOW_DEFAULT_SIZE.height
    : Math.round(params.currentBounds.height * scale)

  const width = clamp(targetWidth, limits.minWidth, limits.maxWidth)
  const height = clamp(targetHeight, limits.minHeight, limits.maxHeight)
  const maxX = params.workArea.x + Math.max(0, params.workArea.width - width)
  const maxY = params.workArea.y + Math.max(0, params.workArea.height - height)
  const x = clamp(Math.round(centerX - width / 2), params.workArea.x, maxX)
  const y = clamp(Math.round(centerY - height / 2), params.workArea.y, maxY)

  return { x, y, width, height }
}
