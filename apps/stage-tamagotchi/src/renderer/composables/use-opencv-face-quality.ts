import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { FaceSampleQuality } from './use-encrypted-face-profile'

import { computed, ref, shallowRef } from 'vue'

import { extractFaceBounds } from './use-local-face-gate'

type OpenCvModule = typeof import('@techstark/opencv-js')
type OpenCvInstance = OpenCvModule & {
  onRuntimeInitialized?: () => void
}

export type OpenCvStatus = 'loading' | 'ready' | 'failed' | 'fallback'

export interface OpenCvFaceQualityResult extends FaceSampleQuality {
  accepted: boolean
  reason?: 'low_quality' | 'face_too_small' | 'opencv_not_ready' | 'invalid_frame'
  patchDataUrl?: string
}

export interface OpenCvFaceQualityConfig {
  outputSize?: number
  qualityThreshold?: number
  minFaceSizeNormalized?: number
  brightnessRange?: { min: number, max: number }
  contrastMin?: number
  sharpnessMin?: number
}

const DEFAULT_CONFIG: Required<OpenCvFaceQualityConfig> = {
  outputSize: 112,
  qualityThreshold: 0.45,
  minFaceSizeNormalized: 0.13,
  brightnessRange: { min: 55, max: 210 },
  contrastMin: 24,
  sharpnessMin: 22,
}

export function useOpenCvFaceQuality(partialConfig?: OpenCvFaceQualityConfig) {
  const config = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
  }
  const status = ref<OpenCvStatus>('loading')
  const errorMessage = ref('')
  const latestQuality = ref<OpenCvFaceQualityResult | null>(null)
  const cvInstance = shallowRef<OpenCvInstance | null>(null)
  const scratchCanvas = shallowRef<HTMLCanvasElement | null>(null)

  const isReady = computed(() => status.value === 'ready')
  const usesFallback = computed(() => status.value === 'fallback')

  async function initializeOpenCv() {
    if (cvInstance.value)
      return cvInstance.value

    status.value = 'loading'
    errorMessage.value = ''

    try {
      const module = (await import('@techstark/opencv-js')) as OpenCvInstance | Promise<OpenCvInstance>
      const cv = await normalizeOpenCvModule(module)
      cvInstance.value = cv
      status.value = 'ready'
      return cv
    }
    catch (error) {
      status.value = 'fallback'
      errorMessage.value = `OpenCV initialization failed. ${String(error)}`
      return null
    }
  }

  async function evaluateFaceQuality(video: HTMLVideoElement, landmarks: NormalizedLandmark[]) {
    const bounds = extractFaceBounds(landmarks)
    if (!bounds) {
      const fallback = createRejectedResult('invalid_frame')
      latestQuality.value = fallback
      return fallback
    }

    const minSize = Math.min(bounds.width, bounds.height)
    if (minSize < config.minFaceSizeNormalized) {
      const rejected = createRejectedResult('face_too_small')
      latestQuality.value = rejected
      return rejected
    }

    const cv = cvInstance.value ?? await initializeOpenCv()
    if (!cv || status.value !== 'ready') {
      const fallback = evaluateQualityWithCanvasFallback(video, bounds, config)
      latestQuality.value = fallback
      return fallback
    }

    const result = evaluateWithOpenCv({
      cv,
      video,
      bounds,
      outputSize: config.outputSize,
      qualityThreshold: config.qualityThreshold,
      brightnessRange: config.brightnessRange,
      contrastMin: config.contrastMin,
      sharpnessMin: config.sharpnessMin,
      scratchCanvas,
    })
    latestQuality.value = result
    return result
  }

  return {
    status,
    errorMessage,
    latestQuality,
    isReady,
    usesFallback,
    initializeOpenCv,
    evaluateFaceQuality,
  }
}

async function normalizeOpenCvModule(module: OpenCvInstance | Promise<OpenCvInstance>) {
  const maybeResolved = await module
  if (typeof maybeResolved.getBuildInformation === 'function')
    return maybeResolved

  if (maybeResolved instanceof Promise)
    return await maybeResolved

  await new Promise<void>((resolve, reject) => {
    let timeoutId: number | null = null
    const clear = () => {
      if (timeoutId !== null)
        clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      clear()
      reject(new Error('OpenCV runtime initialization timeout'))
    }, 8_000)

    maybeResolved.onRuntimeInitialized = () => {
      clear()
      resolve()
    }
  })

  return maybeResolved
}

function evaluateWithOpenCv(options: {
  cv: OpenCvInstance
  video: HTMLVideoElement
  bounds: NonNullable<ReturnType<typeof extractFaceBounds>>
  outputSize: number
  qualityThreshold: number
  brightnessRange: { min: number, max: number }
  contrastMin: number
  sharpnessMin: number
  scratchCanvas: { value: HTMLCanvasElement | null }
}): OpenCvFaceQualityResult {
  const { cv, video, bounds } = options
  const sourceWidth = Math.max(1, video.videoWidth)
  const sourceHeight = Math.max(1, video.videoHeight)

  const marginX = bounds.width * 0.20
  const marginY = bounds.height * 0.20
  const cropMinX = clamp01(bounds.minX - marginX)
  const cropMaxX = clamp01(bounds.maxX + marginX)
  const cropMinY = clamp01(bounds.minY - marginY)
  const cropMaxY = clamp01(bounds.maxY + marginY)
  const cropX = Math.max(0, Math.round(cropMinX * sourceWidth))
  const cropY = Math.max(0, Math.round(cropMinY * sourceHeight))
  const cropWidth = Math.max(1, Math.round((cropMaxX - cropMinX) * sourceWidth))
  const cropHeight = Math.max(1, Math.round((cropMaxY - cropMinY) * sourceHeight))

  const canvas = options.scratchCanvas.value ?? document.createElement('canvas')
  options.scratchCanvas.value = canvas
  canvas.width = sourceWidth
  canvas.height = sourceHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx)
    return createRejectedResult('invalid_frame')
  ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight)
  const frameData = ctx.getImageData(0, 0, sourceWidth, sourceHeight)

  let src: any
  let rgba: any
  let faceRoi: any
  let resized: any
  let gray: any
  let equalized: any
  let laplacian: any

  try {
    src = cv.matFromImageData(frameData)
    rgba = new cv.Mat()
    cv.cvtColor(src, rgba, cv.COLOR_RGBA2RGB)

    const rect = new cv.Rect(cropX, cropY, Math.min(cropWidth, rgba.cols - cropX), Math.min(cropHeight, rgba.rows - cropY))
    faceRoi = rgba.roi(rect)

    resized = new cv.Mat()
    cv.resize(faceRoi, resized, new cv.Size(options.outputSize, options.outputSize), 0, 0, cv.INTER_AREA)

    gray = new cv.Mat()
    cv.cvtColor(resized, gray, cv.COLOR_RGB2GRAY)

    equalized = new cv.Mat()
    cv.equalizeHist(gray, equalized)

    laplacian = new cv.Mat()
    cv.Laplacian(equalized, laplacian, cv.CV_64F)

    const brightness = cv.mean(gray)[0] as number
    const contrast = (cv.meanStdDev(equalized, new cv.Mat(), new cv.Mat()), computeContrastFromGray(equalized))
    const sharpness = computeVariance(laplacian)
    const faceSize = Math.min(bounds.width, bounds.height)

    const brightnessScore = normalizedBrightnessScore(brightness, options.brightnessRange.min, options.brightnessRange.max)
    const contrastScore = Math.min(1, contrast / Math.max(options.contrastMin, 1))
    const sharpnessScore = Math.min(1, sharpness / Math.max(options.sharpnessMin, 1))
    const sizeScore = Math.min(1, faceSize / 0.35)
    const qualityScore = clamp01((brightnessScore * 0.28) + (contrastScore * 0.24) + (sharpnessScore * 0.34) + (sizeScore * 0.14))

    const accepted = qualityScore >= options.qualityThreshold
    return {
      accepted,
      reason: accepted ? undefined : 'low_quality',
      qualityScore,
      brightness,
      sharpness,
      contrast,
      faceSize,
      patchDataUrl: toDataUrlFromMat(cv, resized),
    }
  }
  catch {
    return createRejectedResult('invalid_frame')
  }
  finally {
    safeDelete(laplacian)
    safeDelete(equalized)
    safeDelete(gray)
    safeDelete(resized)
    safeDelete(faceRoi)
    safeDelete(rgba)
    safeDelete(src)
  }
}

function safeDelete(mat: { delete?: () => void } | null | undefined) {
  try {
    mat?.delete?.()
  }
  catch {
    // noop
  }
}

function computeVariance(mat: any) {
  const total = mat.rows * mat.cols
  if (!total)
    return 0
  let sum = 0
  let sumSq = 0
  for (let y = 0; y < mat.rows; y += 1) {
    for (let x = 0; x < mat.cols; x += 1) {
      const value = mat.doubleAt(y, x) as number
      sum += value
      sumSq += value * value
    }
  }
  const mean = sum / total
  return Math.max(0, (sumSq / total) - (mean * mean))
}

function computeContrastFromGray(gray: any) {
  const total = gray.rows * gray.cols
  if (!total)
    return 0
  let sum = 0
  for (let y = 0; y < gray.rows; y += 1) {
    for (let x = 0; x < gray.cols; x += 1)
      sum += gray.ucharAt(y, x) as number
  }
  const mean = sum / total
  let varianceSum = 0
  for (let y = 0; y < gray.rows; y += 1) {
    for (let x = 0; x < gray.cols; x += 1) {
      const value = gray.ucharAt(y, x) as number
      const delta = value - mean
      varianceSum += delta * delta
    }
  }
  return Math.sqrt(Math.max(0, varianceSum / total))
}

function toDataUrlFromMat(cv: OpenCvInstance, mat: any) {
  const rgba = new cv.Mat()
  try {
    cv.cvtColor(mat, rgba, cv.COLOR_RGB2RGBA)
    const imageData = new ImageData(new Uint8ClampedArray(rgba.data), rgba.cols, rgba.rows)
    const canvas = document.createElement('canvas')
    canvas.width = rgba.cols
    canvas.height = rgba.rows
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return undefined
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }
  catch {
    return undefined
  }
  finally {
    safeDelete(rgba)
  }
}

function evaluateQualityWithCanvasFallback(
  video: HTMLVideoElement,
  bounds: NonNullable<ReturnType<typeof extractFaceBounds>>,
  config: Required<OpenCvFaceQualityConfig>,
): OpenCvFaceQualityResult {
  const sourceWidth = Math.max(1, video.videoWidth)
  const sourceHeight = Math.max(1, video.videoHeight)
  const marginX = bounds.width * 0.20
  const marginY = bounds.height * 0.20
  const cropMinX = clamp01(bounds.minX - marginX)
  const cropMaxX = clamp01(bounds.maxX + marginX)
  const cropMinY = clamp01(bounds.minY - marginY)
  const cropMaxY = clamp01(bounds.maxY + marginY)
  const cropX = Math.max(0, Math.round(cropMinX * sourceWidth))
  const cropY = Math.max(0, Math.round(cropMinY * sourceHeight))
  const cropWidth = Math.max(1, Math.round((cropMaxX - cropMinX) * sourceWidth))
  const cropHeight = Math.max(1, Math.round((cropMaxY - cropMinY) * sourceHeight))

  const canvas = document.createElement('canvas')
  canvas.width = config.outputSize
  canvas.height = config.outputSize
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx)
    return createRejectedResult('invalid_frame')
  ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, config.outputSize, config.outputSize)
  const imageData = ctx.getImageData(0, 0, config.outputSize, config.outputSize)
  const metrics = computeCanvasMetrics(imageData.data)
  const faceSize = Math.min(bounds.width, bounds.height)
  const brightnessScore = normalizedBrightnessScore(metrics.brightness, config.brightnessRange.min, config.brightnessRange.max)
  const contrastScore = Math.min(1, metrics.contrast / Math.max(config.contrastMin, 1))
  const sharpnessScore = Math.min(1, metrics.sharpness / Math.max(config.sharpnessMin, 1))
  const sizeScore = Math.min(1, faceSize / 0.35)
  const qualityScore = clamp01((brightnessScore * 0.28) + (contrastScore * 0.24) + (sharpnessScore * 0.34) + (sizeScore * 0.14))
  const accepted = qualityScore >= config.qualityThreshold

  return {
    accepted,
    reason: accepted ? undefined : 'low_quality',
    qualityScore,
    brightness: metrics.brightness,
    sharpness: metrics.sharpness,
    contrast: metrics.contrast,
    faceSize,
    patchDataUrl: canvas.toDataURL('image/jpeg', 0.85),
  }
}

function computeCanvasMetrics(rgba: Uint8ClampedArray) {
  const pixelCount = Math.max(1, rgba.length / 4)
  const gray = new Float32Array(pixelCount)
  let sum = 0
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
    const value = (0.299 * (rgba[i] ?? 0)) + (0.587 * (rgba[i + 1] ?? 0)) + (0.114 * (rgba[i + 2] ?? 0))
    gray[j] = value
    sum += value
  }
  const brightness = sum / pixelCount
  let varianceAccumulator = 0
  for (let i = 0; i < gray.length; i += 1) {
    const delta = (gray[i] ?? 0) - brightness
    varianceAccumulator += delta * delta
  }
  const contrast = Math.sqrt(varianceAccumulator / pixelCount)

  const width = Math.round(Math.sqrt(pixelCount))
  const height = width
  let laplaceSum = 0
  let laplaceSquaredSum = 0
  let laplaceCount = 0
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width) + x
      const center = gray[idx] ?? 0
      const left = gray[idx - 1] ?? 0
      const right = gray[idx + 1] ?? 0
      const up = gray[idx - width] ?? 0
      const down = gray[idx + width] ?? 0
      const laplace = (4 * center) - left - right - up - down
      laplaceSum += laplace
      laplaceSquaredSum += laplace * laplace
      laplaceCount += 1
    }
  }
  const laplaceMean = laplaceCount > 0 ? laplaceSum / laplaceCount : 0
  const sharpness = laplaceCount > 0
    ? Math.max(0, (laplaceSquaredSum / laplaceCount) - (laplaceMean * laplaceMean))
    : 0

  return {
    brightness,
    contrast,
    sharpness,
  }
}

function createRejectedResult(reason: OpenCvFaceQualityResult['reason']) {
  return {
    accepted: false,
    reason,
    qualityScore: 0,
    brightness: 0,
    sharpness: 0,
    contrast: 0,
    faceSize: 0,
  }
}

function normalizedBrightnessScore(brightness: number, min: number, max: number) {
  if (brightness < min)
    return clamp01(brightness / Math.max(min, 1))
  if (brightness > max)
    return clamp01((255 - brightness) / Math.max(255 - max, 1))
  return 1
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}
