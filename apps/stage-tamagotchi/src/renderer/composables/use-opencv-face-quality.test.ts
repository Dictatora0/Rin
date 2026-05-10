// @vitest-environment jsdom

import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { useOpenCvFaceQuality } from './use-opencv-face-quality'

function createVideoElement(size: number) {
  return {
    videoWidth: size,
    videoHeight: size,
  } as unknown as HTMLVideoElement
}

function createLandmarks(centerX = 0.5, centerY = 0.5): NormalizedLandmark[] {
  const landmark = (x: number, y: number): NormalizedLandmark => ({ x, y, z: 0.01, visibility: 0 })
  return [
    landmark(centerX - 0.12, centerY - 0.12),
    landmark(centerX + 0.12, centerY - 0.12),
    landmark(centerX - 0.12, centerY + 0.12),
    landmark(centerX + 0.12, centerY + 0.12),
  ]
}

function createSolidRgba(size: number, value: number) {
  const rgba = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = value
    rgba[i + 1] = value
    rgba[i + 2] = value
    rgba[i + 3] = 255
  }
  return rgba
}

function createCheckerboardRgba(size: number) {
  const rgba = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = ((y * size) + x) * 4
      const value = (x + y) % 2 === 0 ? 0 : 255
      rgba[idx] = value
      rgba[idx + 1] = value
      rgba[idx + 2] = value
      rgba[idx + 3] = 255
    }
  }
  return rgba
}

function withCanvasImageData<T>(
  rgba: Uint8ClampedArray,
  run: () => Promise<T> | T,
) {
  const originalCreateElement = document.createElement.bind(document)

  const drawImage = vi.fn()
  const getImageData = vi.fn(() => ({ data: rgba }))
  const context = {
    drawImage,
    getImageData,
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  }

  const createElementSpy = vi.spyOn(document, 'createElement')
    .mockImplementation(((tagName: string) => {
      if (tagName === 'canvas')
        return canvas as unknown as HTMLElement
      return originalCreateElement(tagName)
    }) as typeof document.createElement)

  const finish = () => {
    createElementSpy.mockRestore()
  }

  try {
    return run()
  }
  finally {
    finish()
  }
}

describe('useOpenCvFaceQuality canvas fallback metrics', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts from idle instead of perpetual loading before initialization', () => {
    const quality = useOpenCvFaceQuality()
    expect(quality.status.value).toBe('idle')
  })

  it('reports expected brightness ranges for black, white, and gray frames', async () => {
    const outputSize = 8
    const quality = useOpenCvFaceQuality({ outputSize, minFaceSizeNormalized: 0.1 })
    const video = createVideoElement(outputSize)
    const landmarks = createLandmarks()

    const black = await withCanvasImageData(createSolidRgba(outputSize, 0), () => {
      return quality.evaluateFaceQuality(video, landmarks)
    })
    expect(black.accepted).toBe(false)
    expect(black.reason).toBe('low_quality')
    expect(black.brightness).toBeCloseTo(0, 6)
    expect(black.qualityScore).toBeGreaterThanOrEqual(0)
    expect(black.qualityScore).toBeLessThanOrEqual(1)

    const white = await withCanvasImageData(createSolidRgba(outputSize, 255), () => {
      return quality.evaluateFaceQuality(video, landmarks)
    })
    expect(white.accepted).toBe(false)
    expect(white.reason).toBe('low_quality')
    expect(white.brightness).toBeGreaterThan(250)
    expect(white.qualityScore).toBeGreaterThanOrEqual(0)
    expect(white.qualityScore).toBeLessThanOrEqual(1)

    const gray = await withCanvasImageData(createSolidRgba(outputSize, 128), () => {
      return quality.evaluateFaceQuality(video, landmarks)
    })
    expect(gray.brightness).toBeGreaterThan(120)
    expect(gray.brightness).toBeLessThan(136)
    expect(gray.accepted).toBe(false)
  })

  it('distinguishes smooth image from high-edge checkerboard for contrast and sharpness', async () => {
    const outputSize = 8
    const quality = useOpenCvFaceQuality({ outputSize, minFaceSizeNormalized: 0.1 })
    const video = createVideoElement(outputSize)
    const landmarks = createLandmarks()

    const smooth = await withCanvasImageData(createSolidRgba(outputSize, 128), () => {
      return quality.evaluateFaceQuality(video, landmarks)
    })
    const checkerboard = await withCanvasImageData(createCheckerboardRgba(outputSize), () => {
      return quality.evaluateFaceQuality(video, landmarks)
    })

    expect(checkerboard.contrast).toBeGreaterThan(smooth.contrast)
    expect(checkerboard.sharpness).toBeGreaterThan(smooth.sharpness)
    expect(checkerboard.qualityScore).toBeGreaterThan(smooth.qualityScore)
    expect(checkerboard.accepted).toBe(true)
    expect(checkerboard.reason).toBeUndefined()
  })

  it('rejects invalid frame data and too-small faces safely', async () => {
    const outputSize = 8
    const quality = useOpenCvFaceQuality({ outputSize, minFaceSizeNormalized: 0.15 })
    const video = createVideoElement(outputSize)

    const invalidFrame = await quality.evaluateFaceQuality(video, [
      { x: Number.NaN, y: 0.4, z: 0, visibility: 0 },
      { x: 0.6, y: Number.POSITIVE_INFINITY, z: 0, visibility: 0 },
    ])
    expect(invalidFrame.accepted).toBe(false)
    expect(invalidFrame.reason).toBe('invalid_frame')
    expect(invalidFrame.qualityScore).toBe(0)

    const tooSmall = await quality.evaluateFaceQuality(video, [
      { x: 0.49, y: 0.49, z: 0, visibility: 0 },
      { x: 0.51, y: 0.49, z: 0, visibility: 0 },
      { x: 0.49, y: 0.51, z: 0, visibility: 0 },
      { x: 0.51, y: 0.51, z: 0, visibility: 0 },
    ])
    expect(tooSmall.accepted).toBe(false)
    expect(tooSmall.reason).toBe('face_too_small')
    expect(tooSmall.qualityScore).toBe(0)
  })
})
