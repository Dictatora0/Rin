import type { FaceLandmarker, GestureRecognizer } from '@mediapipe/tasks-vision'

import {
  FaceLandmarker as FaceLandmarkerClass,
  FilesetResolver,
  GestureRecognizer as GestureRecognizerClass,
} from '@mediapipe/tasks-vision'
import { errorMessageFrom } from '@moeru/std'
import { computed, ref } from 'vue'

import { useOpenCvFaceQuality } from './use-opencv-face-quality'

export type VisionRuntimeStatus = 'idle' | 'warming' | 'ready' | 'partial_ready' | 'failed' | 'resetting'
export type VisionMediaPipeStatus = 'idle' | 'loading' | 'ready' | 'failed'
export type VisionModelSource = 'local' | 'remote' | 'unknown'

export interface VisionRuntimeWarmupOptions {
  background?: boolean
  includeOpenCv?: boolean
  force?: boolean
}

interface MediaPipeRuntime {
  faceLandmarker: FaceLandmarker
  gestureRecognizer: GestureRecognizer
}

interface CreateMediaPipeRuntimeOptions {
  fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>
  faceModelAssetPath: string
  gestureModelAssetPath: string
}

const LOCAL_FACE_MODEL_ASSET_URL = './assets/vision/models/face_landmarker.task'
const LOCAL_GESTURE_MODEL_ASSET_URL = './assets/vision/models/gesture_recognizer.task'
const LOCAL_WASM_ROOT_URL = './assets/vision/wasm'
const FACE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const GESTURE_MODEL_ASSET_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
const WASM_ROOT_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const ENABLE_REMOTE_MODEL_FALLBACK = import.meta.env.VITE_VISION_ALLOW_REMOTE_FALLBACK === 'true'
const PRACTICAL_GESTURE_ALLOWLIST = ['Open_Palm', 'Victory', 'Thumb_Up']
const DEFAULT_GESTURE_SCORE_THRESHOLD = 0.35
const DEFAULT_MEDIA_PIPE_TIMEOUT_MS = 18_000
const DEFAULT_OPENCV_TIMEOUT_MS = 12_000
const DEFAULT_BACKGROUND_WARMUP_IDLE_TIMEOUT_MS = 2_500

/**
 * Shared Vision runtime singleton.
 *
 * Use when:
 * - Vision pages/components need warmup/retry/reset semantics.
 * - MediaPipe/OpenCV runtimes should be reused across component mounts.
 *
 * Expects:
 * - Runtime is renderer-process scoped and intentionally long-lived.
 *
 * Returns:
 * - State refs, warmup/retry/reset methods, and runtime accessors.
 */
export function useVisionRuntime() {
  return sharedVisionRuntime
}

function createVisionRuntimeSingleton() {
  const openCvRuntime = useOpenCvFaceQuality()
  const runtimeStatus = ref<VisionRuntimeStatus>('idle')
  const mediaPipeStatus = ref<VisionMediaPipeStatus>('idle')
  const modelSource = ref<VisionModelSource>('unknown')
  const modelProfile = ref('MediaPipe 官方 float16 v1（本地与远程同规格）')
  const lastWarmupStartedAt = ref<number | null>(null)
  const lastWarmupFinishedAt = ref<number | null>(null)
  const warmupDurationMs = ref<number | null>(null)
  const lastError = ref('')
  const retryCount = ref(0)

  let mediaPipeRuntime: MediaPipeRuntime | null = null
  let mediaPipeWarmupPromise: Promise<MediaPipeRuntime> | null = null
  let openCvWarmupPromise: Promise<void> | null = null
  let warmupVisionRuntimePromise: Promise<void> | null = null
  let runtimeGeneration = 0
  let lastWarmupToken = 0

  const opencvStatus = openCvRuntime.status
  const isReady = computed(() => runtimeStatus.value === 'ready')
  const isPartiallyReady = computed(() => runtimeStatus.value === 'partial_ready')

  function isRuntimeTokenValid(token: number) {
    return token === runtimeGeneration
  }

  function closeMediaPipeRuntime() {
    try {
      mediaPipeRuntime?.faceLandmarker.close()
    }
    catch {}
    try {
      mediaPipeRuntime?.gestureRecognizer.close()
    }
    catch {}
    mediaPipeRuntime = null
  }

  function recomputeRuntimeStatus() {
    if (runtimeStatus.value === 'resetting')
      return

    if (mediaPipeStatus.value === 'failed') {
      runtimeStatus.value = 'failed'
      return
    }

    if (mediaPipeStatus.value === 'loading' || opencvStatus.value === 'loading') {
      runtimeStatus.value = 'warming'
      return
    }

    if (mediaPipeStatus.value === 'ready' && opencvStatus.value === 'ready') {
      runtimeStatus.value = 'ready'
      return
    }

    if (mediaPipeStatus.value === 'ready') {
      runtimeStatus.value = 'partial_ready'
      return
    }

    runtimeStatus.value = 'idle'
  }

  function markLastError(message: string) {
    lastError.value = message
  }

  function clearLastError() {
    lastError.value = ''
  }

  function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeoutMs)

      promise
        .then((value) => {
          clearTimeout(timer)
          resolve(value)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  async function createMediaPipeRuntime(options: CreateMediaPipeRuntimeOptions) {
    await yieldToBrowserFrame()
    const nextFaceLandmarker = await FaceLandmarkerClass.createFromOptions(options.fileset, {
      baseOptions: { modelAssetPath: options.faceModelAssetPath },
      runningMode: 'VIDEO',
      numFaces: 2,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    })

    try {
      await yieldToBrowserFrame()
      const nextGestureRecognizer = await GestureRecognizerClass.createFromOptions(options.fileset, {
        baseOptions: { modelAssetPath: options.gestureModelAssetPath },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        cannedGesturesClassifierOptions: {
          categoryAllowlist: PRACTICAL_GESTURE_ALLOWLIST,
          maxResults: 3,
          scoreThreshold: DEFAULT_GESTURE_SCORE_THRESHOLD,
        },
      })

      return {
        faceLandmarker: nextFaceLandmarker,
        gestureRecognizer: nextGestureRecognizer,
      }
    }
    catch (error) {
      try {
        nextFaceLandmarker.close()
      }
      catch {}
      throw error
    }
  }

  async function warmupMediaPipe(options?: VisionRuntimeWarmupOptions) {
    if (mediaPipeRuntime && mediaPipeStatus.value === 'ready')
      return mediaPipeRuntime
    if (mediaPipeWarmupPromise)
      return mediaPipeWarmupPromise

    const warmupToken = runtimeGeneration
    mediaPipeStatus.value = 'loading'
    runtimeStatus.value = 'warming'
    if (options?.force)
      clearLastError()

    mediaPipeWarmupPromise = (async () => {
      try {
        const localFileset = await withTimeout(
          FilesetResolver.forVisionTasks(LOCAL_WASM_ROOT_URL),
          DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
          'MediaPipe warmup timed out',
        )
        const localRuntime = await withTimeout(
          createMediaPipeRuntime({
            fileset: localFileset,
            faceModelAssetPath: LOCAL_FACE_MODEL_ASSET_URL,
            gestureModelAssetPath: LOCAL_GESTURE_MODEL_ASSET_URL,
          }),
          DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
          'MediaPipe warmup timed out',
        )

        if (!isRuntimeTokenValid(warmupToken)) {
          try {
            localRuntime.faceLandmarker.close()
          }
          catch {}
          try {
            localRuntime.gestureRecognizer.close()
          }
          catch {}
          throw new Error('Vision runtime warmup invalidated')
        }

        mediaPipeRuntime = localRuntime
        mediaPipeStatus.value = 'ready'
        modelSource.value = 'local'
        return localRuntime
      }
      catch (localError) {
        if (!ENABLE_REMOTE_MODEL_FALLBACK)
          throw localError

        const remoteFileset = await withTimeout(
          FilesetResolver.forVisionTasks(WASM_ROOT_URL),
          DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
          'MediaPipe warmup timed out',
        )
        const remoteRuntime = await withTimeout(
          createMediaPipeRuntime({
            fileset: remoteFileset,
            faceModelAssetPath: FACE_MODEL_ASSET_URL,
            gestureModelAssetPath: GESTURE_MODEL_ASSET_URL,
          }),
          DEFAULT_MEDIA_PIPE_TIMEOUT_MS,
          'MediaPipe warmup timed out',
        )

        if (!isRuntimeTokenValid(warmupToken)) {
          try {
            remoteRuntime.faceLandmarker.close()
          }
          catch {}
          try {
            remoteRuntime.gestureRecognizer.close()
          }
          catch {}
          throw new Error('Vision runtime warmup invalidated')
        }

        mediaPipeRuntime = remoteRuntime
        mediaPipeStatus.value = 'ready'
        modelSource.value = 'remote'
        return remoteRuntime
      }
    })()
      .catch((error) => {
        if (isRuntimeTokenValid(warmupToken)) {
          closeMediaPipeRuntime()
          mediaPipeStatus.value = 'failed'
          modelSource.value = 'unknown'
          markLastError(errorMessageFrom(error) ?? 'MediaPipe warmup failed')
          runtimeStatus.value = 'failed'
        }
        throw error
      })
      .finally(() => {
        if (isRuntimeTokenValid(warmupToken))
          mediaPipeWarmupPromise = null
      })

    return mediaPipeWarmupPromise
  }

  function scheduleOpenCvWarmupTask() {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        void warmupOpenCV()
      })
      return
    }

    setTimeout(() => {
      void warmupOpenCV()
    }, 0)
  }

  async function warmupOpenCV() {
    if (opencvStatus.value === 'ready')
      return
    if (openCvWarmupPromise)
      return openCvWarmupPromise

    const warmupToken = runtimeGeneration
    openCvWarmupPromise = (async () => {
      try {
        await withTimeout(
          openCvRuntime.initializeOpenCv().then(() => undefined),
          DEFAULT_OPENCV_TIMEOUT_MS,
          'OpenCV warmup timed out, using fallback',
        )
      }
      catch (error) {
        if (isRuntimeTokenValid(warmupToken)) {
          const message = errorMessageFrom(error) ?? 'OpenCV warmup timed out, using fallback'
          openCvRuntime.markFallback(message)
          markLastError(message)
        }
      }
      finally {
        if (isRuntimeTokenValid(warmupToken))
          openCvWarmupPromise = null
      }
    })()

    return openCvWarmupPromise
  }

  async function warmupVisionRuntime(options?: VisionRuntimeWarmupOptions) {
    if (warmupVisionRuntimePromise)
      return warmupVisionRuntimePromise

    const warmupToken = runtimeGeneration
    const includeOpenCv = options?.includeOpenCv ?? true
    const background = options?.background ?? false
    const shouldForce = options?.force ?? false

    if (shouldForce) {
      closeMediaPipeRuntime()
      mediaPipeWarmupPromise = null
      mediaPipeStatus.value = 'idle'
      openCvRuntime.resetRuntime()
      openCvWarmupPromise = null
      clearLastError()
    }

    runtimeStatus.value = 'warming'
    const startedAt = Date.now()
    lastWarmupToken += 1
    lastWarmupStartedAt.value = startedAt

    warmupVisionRuntimePromise = (async () => {
      try {
        if (background) {
          await waitForBrowserIdle(DEFAULT_BACKGROUND_WARMUP_IDLE_TIMEOUT_MS)
          await yieldToBrowserFrame()
        }

        await warmupMediaPipe(options)
        if (!isRuntimeTokenValid(warmupToken))
          return

        if (includeOpenCv) {
          if (background)
            scheduleOpenCvWarmupTask()
          else
            await warmupOpenCV()
        }

        if (!isRuntimeTokenValid(warmupToken))
          return

        recomputeRuntimeStatus()
      }
      catch (error) {
        if (isRuntimeTokenValid(warmupToken)) {
          markLastError(errorMessageFrom(error) ?? 'Vision runtime warmup failed')
          runtimeStatus.value = 'failed'
        }
        throw error
      }
      finally {
        if (isRuntimeTokenValid(warmupToken)) {
          lastWarmupFinishedAt.value = Date.now()
          warmupDurationMs.value = lastWarmupFinishedAt.value - startedAt
          if (runtimeStatus.value !== 'failed')
            recomputeRuntimeStatus()
          warmupVisionRuntimePromise = null
        }
      }
    })()

    return warmupVisionRuntimePromise
  }

  async function resetVisionRuntime() {
    runtimeStatus.value = 'resetting'
    runtimeGeneration += 1
    lastWarmupToken += 1
    mediaPipeWarmupPromise = null
    openCvWarmupPromise = null
    warmupVisionRuntimePromise = null
    closeMediaPipeRuntime()
    mediaPipeStatus.value = 'idle'
    modelSource.value = 'unknown'
    openCvRuntime.resetRuntime()
    lastWarmupStartedAt.value = null
    lastWarmupFinishedAt.value = null
    warmupDurationMs.value = null
    clearLastError()
    runtimeStatus.value = 'idle'
  }

  async function retryVisionRuntime(options?: Omit<VisionRuntimeWarmupOptions, 'force'>) {
    retryCount.value += 1
    await warmupVisionRuntime({
      ...options,
      force: true,
      background: false,
    })
  }

  function getMediaPipeRuntime() {
    if (mediaPipeStatus.value !== 'ready')
      return null
    return mediaPipeRuntime
  }

  function getOpenCVRuntime() {
    return openCvRuntime
  }

  return {
    runtimeStatus,
    mediaPipeStatus,
    opencvStatus,
    modelSource,
    modelProfile,
    lastWarmupStartedAt,
    lastWarmupFinishedAt,
    warmupDurationMs,
    lastError,
    retryCount,
    isReady,
    isPartiallyReady,
    warmupVisionRuntime,
    warmupMediaPipe,
    warmupOpenCV,
    getMediaPipeRuntime,
    getOpenCVRuntime,
    resetVisionRuntime,
    retryVisionRuntime,
  }
}

const sharedVisionRuntime = createVisionRuntimeSingleton()

function yieldToBrowserFrame() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

function waitForBrowserIdle(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      setTimeout(resolve, 0)
      return
    }

    const schedulerWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    }
    if (typeof schedulerWindow.requestIdleCallback === 'function') {
      schedulerWindow.requestIdleCallback(() => {
        resolve()
      }, { timeout: timeoutMs })
      return
    }

    setTimeout(resolve, 16)
  })
}
