// @vitest-environment jsdom

import { errorMessageFrom } from '@moeru/std'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVisionRuntime } from './use-vision-runtime'

const runtimeTestHarness = vi.hoisted(() => {
  const openCvStatusRef = { value: 'idle' as 'idle' | 'loading' | 'ready' | 'failed' | 'fallback' }
  const openCvErrorMessageRef = { value: '' }
  const openCvInitializeMock = vi.fn(async () => {
    openCvStatusRef.value = 'ready'
    openCvErrorMessageRef.value = ''
    return null
  })
  const openCvMarkFallbackMock = vi.fn((message: string) => {
    openCvStatusRef.value = 'fallback'
    openCvErrorMessageRef.value = message
  })
  const openCvResetRuntimeMock = vi.fn(() => {
    openCvStatusRef.value = 'idle'
    openCvErrorMessageRef.value = ''
  })
  const faceLandmarkerCloseSpies: ReturnType<typeof vi.fn>[] = []
  const gestureRecognizerCloseSpies: ReturnType<typeof vi.fn>[] = []
  return {
    openCvStatusRef,
    openCvErrorMessageRef,
    openCvInitializeMock,
    openCvMarkFallbackMock,
    openCvResetRuntimeMock,
    faceLandmarkerCloseSpies,
    gestureRecognizerCloseSpies,
  }
})

vi.mock('./use-opencv-face-quality', () => ({
  useOpenCvFaceQuality: () => ({
    status: runtimeTestHarness.openCvStatusRef,
    errorMessage: runtimeTestHarness.openCvErrorMessageRef,
    initializeOpenCv: runtimeTestHarness.openCvInitializeMock,
    markFallback: runtimeTestHarness.openCvMarkFallbackMock,
    resetRuntime: runtimeTestHarness.openCvResetRuntimeMock,
    evaluateFaceQuality: vi.fn(async () => ({
      accepted: true,
      qualityScore: 0.95,
      brightness: 125,
      sharpness: 30,
      contrast: 35,
      faceSize: 0.22,
    })),
  }),
}))

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: vi.fn(async () => ({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    })),
  },
  FaceLandmarker: {
    createFromOptions: vi.fn(async () => {
      const close = vi.fn(() => {})
      runtimeTestHarness.faceLandmarkerCloseSpies.push(close)
      return {
        detectForVideo: vi.fn(() => ({ faceLandmarks: [] })),
        close,
      }
    }),
  },
  GestureRecognizer: {
    createFromOptions: vi.fn(async () => {
      const close = vi.fn(() => {})
      runtimeTestHarness.gestureRecognizerCloseSpies.push(close)
      return {
        recognizeForVideo: vi.fn(() => ({ gestures: [] })),
        close,
      }
    }),
  },
}))

const openCvStatusRef = runtimeTestHarness.openCvStatusRef
const openCvErrorMessageRef = runtimeTestHarness.openCvErrorMessageRef
const openCvInitializeMock = runtimeTestHarness.openCvInitializeMock
const openCvMarkFallbackMock = runtimeTestHarness.openCvMarkFallbackMock
const openCvResetRuntimeMock = runtimeTestHarness.openCvResetRuntimeMock
const faceLandmarkerCloseSpies = runtimeTestHarness.faceLandmarkerCloseSpies
const gestureRecognizerCloseSpies = runtimeTestHarness.gestureRecognizerCloseSpies

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve
  })
  return { promise, resolve }
}

async function getMediaPipeMocks() {
  const module = await import('@mediapipe/tasks-vision')
  return {
    resolveFileset: vi.mocked(module.FilesetResolver.forVisionTasks),
    createFaceLandmarker: vi.mocked(module.FaceLandmarker.createFromOptions),
    createGestureRecognizer: vi.mocked(module.GestureRecognizer.createFromOptions),
  }
}

describe('useVisionRuntime singleton warmup manager', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    openCvStatusRef.value = 'idle'
    openCvErrorMessageRef.value = ''
    openCvInitializeMock.mockReset()
    openCvInitializeMock.mockImplementation(async () => {
      openCvStatusRef.value = 'ready'
      openCvErrorMessageRef.value = ''
      return null
    })
    openCvMarkFallbackMock.mockClear()
    openCvResetRuntimeMock.mockClear()
    faceLandmarkerCloseSpies.length = 0
    gestureRecognizerCloseSpies.length = 0

    const { resolveFileset, createFaceLandmarker, createGestureRecognizer } = await getMediaPipeMocks()
    resolveFileset.mockReset()
    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    createFaceLandmarker.mockReset()
    createFaceLandmarker.mockImplementation(async () => {
      const close = vi.fn(() => {})
      faceLandmarkerCloseSpies.push(close)
      return {
        detectForVideo: vi.fn(() => ({ faceLandmarks: [] })),
        close,
      } as any
    })
    createGestureRecognizer.mockReset()
    createGestureRecognizer.mockImplementation(async () => {
      const close = vi.fn(() => {})
      gestureRecognizerCloseSpies.push(close)
      return {
        recognizeForVideo: vi.fn(() => ({ gestures: [] })),
        close,
      } as any
    })

    await useVisionRuntime().resetVisionRuntime()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('reuses a single runtime singleton across callers', () => {
    const first = useVisionRuntime()
    const second = useVisionRuntime()

    expect(first).toBe(second)
    expect(first.runtimeStatus.value).toBe('idle')
    expect(first.mediaPipeStatus.value).toBe('idle')
    expect(first.opencvStatus.value).toBe('idle')
  })

  it('deduplicates concurrent warmup calls and reuses the same promise', async () => {
    const runtime = useVisionRuntime()
    const { resolveFileset, createFaceLandmarker, createGestureRecognizer } = await getMediaPipeMocks()

    const firstWarmup = runtime.warmupVisionRuntime({ includeOpenCv: true })
    const secondWarmup = runtime.warmupVisionRuntime({ includeOpenCv: true })

    expect(runtime.runtimeStatus.value).toBe('warming')
    await Promise.all([firstWarmup, secondWarmup])

    expect(resolveFileset).toHaveBeenCalledTimes(1)
    expect(createFaceLandmarker).toHaveBeenCalledTimes(1)
    expect(createGestureRecognizer).toHaveBeenCalledTimes(1)
    expect(openCvInitializeMock).toHaveBeenCalledTimes(1)
    expect(runtime.mediaPipeStatus.value).toBe('ready')
    expect(runtime.opencvStatus.value).toBe('ready')
    expect(runtime.runtimeStatus.value).toBe('ready')
  })

  it('defers background warmup until an idle slot before starting MediaPipe initialization', async () => {
    const runtime = useVisionRuntime()
    const { resolveFileset } = await getMediaPipeMocks()
    const originalRequestIdleCallback = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    }).requestIdleCallback

    let idleCallback: IdleRequestCallback | null = null
    const requestIdleCallbackMock = vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback
      return 1
    })

    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: requestIdleCallbackMock,
    })

    try {
      const warmupPromise = runtime.warmupVisionRuntime({ background: true, includeOpenCv: false })
      let warmupSettled = false
      void warmupPromise.finally(() => {
        warmupSettled = true
      })
      await Promise.resolve()

      expect(requestIdleCallbackMock).toHaveBeenCalledTimes(1)
      expect(resolveFileset).toHaveBeenCalledTimes(0)
      expect(warmupSettled).toBe(false)

      const runIdleCallback = idleCallback as ((deadline: IdleDeadline) => void) | null
      if (!runIdleCallback)
        throw new Error('Expected background warmup to register an idle callback before initialization starts')

      runIdleCallback({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline)

      await warmupPromise
      expect(resolveFileset).toHaveBeenCalledTimes(1)
      expect(runtime.mediaPipeStatus.value).toBe('ready')
      expect(runtime.runtimeStatus.value).toBe('partial_ready')
    }
    finally {
      if (originalRequestIdleCallback) {
        Object.defineProperty(window, 'requestIdleCallback', {
          configurable: true,
          value: originalRequestIdleCallback,
        })
      }
      else {
        Reflect.deleteProperty(window, 'requestIdleCallback')
      }
    }
  })

  it('keeps runtime warm after stop-like lifecycle and only reinitializes after reset', async () => {
    const runtime = useVisionRuntime()
    const { createFaceLandmarker, createGestureRecognizer } = await getMediaPipeMocks()

    await runtime.warmupVisionRuntime({ includeOpenCv: false })
    expect(runtime.mediaPipeStatus.value).toBe('ready')
    expect(runtime.runtimeStatus.value).toBe('partial_ready')

    const warmRuntime = runtime.getMediaPipeRuntime()
    expect(warmRuntime).not.toBeNull()

    await runtime.warmupVisionRuntime({ includeOpenCv: false })
    expect(createFaceLandmarker).toHaveBeenCalledTimes(1)
    expect(createGestureRecognizer).toHaveBeenCalledTimes(1)

    await runtime.resetVisionRuntime()
    expect(runtime.runtimeStatus.value).toBe('idle')
    expect(runtime.mediaPipeStatus.value).toBe('idle')
    expect(runtime.getMediaPipeRuntime()).toBeNull()
    expect(faceLandmarkerCloseSpies[0]).toHaveBeenCalledTimes(1)
    expect(gestureRecognizerCloseSpies[0]).toHaveBeenCalledTimes(1)

    await runtime.warmupVisionRuntime({ includeOpenCv: false })
    expect(createFaceLandmarker).toHaveBeenCalledTimes(2)
    expect(createGestureRecognizer).toHaveBeenCalledTimes(2)
    expect(runtime.mediaPipeStatus.value).toBe('ready')
  })

  it('falls back to canvas quality path when OpenCV warmup fails', async () => {
    const runtime = useVisionRuntime()
    openCvInitializeMock.mockImplementationOnce(async () => {
      throw new Error('OpenCV boot failed in test')
    })

    await runtime.warmupVisionRuntime({ includeOpenCv: true })

    expect(openCvInitializeMock).toHaveBeenCalledTimes(1)
    expect(openCvMarkFallbackMock).toHaveBeenCalledTimes(1)
    expect(runtime.mediaPipeStatus.value).toBe('ready')
    expect(runtime.opencvStatus.value).toBe('fallback')
    expect(runtime.runtimeStatus.value).toBe('partial_ready')
  })

  it('marks MediaPipe failed on warmup timeout and allows retry recovery', async () => {
    vi.useFakeTimers()
    const runtime = useVisionRuntime()
    const { resolveFileset } = await getMediaPipeMocks()

    resolveFileset.mockImplementation(() => new Promise(() => {}))
    const firstWarmup = runtime.warmupVisionRuntime({ includeOpenCv: false })
    const capturedTimeoutMessagePromise = firstWarmup
      .then(() => '')
      .catch(error => errorMessageFrom(error) ?? '')
    await vi.advanceTimersByTimeAsync(18_200)
    const timeoutMessage = await capturedTimeoutMessagePromise
    expect(timeoutMessage).toContain('MediaPipe warmup timed out')
    expect(runtime.mediaPipeStatus.value).toBe('failed')
    expect(runtime.runtimeStatus.value).toBe('failed')

    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    const retryPromise = runtime.retryVisionRuntime({ includeOpenCv: false })
    await vi.runAllTimersAsync()
    await retryPromise
    expect(runtime.retryCount.value).toBe(1)
    expect(runtime.mediaPipeStatus.value).toBe('ready')
    expect(runtime.runtimeStatus.value).toBe('partial_ready')
  })

  it('marks OpenCV fallback on warmup timeout without blocking MediaPipe readiness', async () => {
    vi.useFakeTimers()
    const runtime = useVisionRuntime()

    openCvInitializeMock.mockImplementationOnce(() => new Promise(() => {}))
    const warmup = runtime.warmupVisionRuntime({ includeOpenCv: true })
    await vi.advanceTimersByTimeAsync(12_200)
    await warmup

    expect(runtime.mediaPipeStatus.value).toBe('ready')
    expect(runtime.opencvStatus.value).toBe('fallback')
    expect(runtime.runtimeStatus.value).toBe('partial_ready')
    expect(openCvMarkFallbackMock).toHaveBeenCalledWith('OpenCV warmup timed out, using fallback')
  })

  it('invalidates an in-flight warmup promise on reset and allows a fresh warmup', async () => {
    const runtime = useVisionRuntime()
    const { resolveFileset, createFaceLandmarker, createGestureRecognizer } = await getMediaPipeMocks()
    const deferredFileset = createDeferred<{
      wasmLoaderPath: string
      wasmBinaryPath: string
    }>()
    resolveFileset.mockImplementationOnce(async () => deferredFileset.promise as any)
    const pendingWarmup = runtime.warmupVisionRuntime({ includeOpenCv: false })
    expect(runtime.runtimeStatus.value).toBe('warming')

    await runtime.resetVisionRuntime()
    deferredFileset.resolve({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    })
    await expect(pendingWarmup).rejects.toThrow('Vision runtime warmup invalidated')
    expect(runtime.runtimeStatus.value).toBe('idle')
    expect(runtime.mediaPipeStatus.value).toBe('idle')

    resolveFileset.mockResolvedValue({
      wasmLoaderPath: '/mock/vision_wasm_module_internal.js',
      wasmBinaryPath: '/mock/vision_wasm_internal.wasm',
    } as any)
    await runtime.warmupVisionRuntime({ includeOpenCv: false })
    expect(createFaceLandmarker).toHaveBeenCalledTimes(2)
    expect(createGestureRecognizer).toHaveBeenCalledTimes(2)
    expect(runtime.mediaPipeStatus.value).toBe('ready')
  })
})
