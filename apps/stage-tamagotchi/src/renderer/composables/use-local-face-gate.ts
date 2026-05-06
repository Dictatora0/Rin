import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import { computed, ref, shallowRef } from 'vue'

/**
 * Enrollment status for local face gate profile lifecycle.
 */
export type LocalFaceProfileStatus
  = | 'not_enrolled'
    | 'enrolling'
    | 'enrolled'
    | 'matching'
    | 'matched'
    | 'unmatched'
    | 'uncertain'
    | 'multiple_faces'
    | 'no_face'

/**
 * Gate state that controls whether vision feedback is allowed to trigger.
 */
export type LocalFaceGateState = 'disabled' | 'enabled' | 'gated' | 'locked'

/**
 * High-level subject status derived from face gate matching.
 */
export type VisionSubjectStatus = 'none' | 'matched_subject' | 'unknown_subject' | 'multiple_subjects'

export interface LocalFaceSample {
  /** Landmark-signature descriptor stored locally only. */
  descriptor: number[]
  /** Quality score at capture time in [0,100]. */
  quality: number
  /** ISO time when this sample was captured. */
  capturedAt: string
}

export interface LocalFaceProfile {
  /** Local profile id generated on this device. */
  id: string
  /** User-provided local display name. */
  displayName: string
  /** Profile creation timestamp (ISO). */
  createdAt: string
  /** Last profile update timestamp (ISO). */
  updatedAt: string
  /** Local descriptor model id for compatibility checks. */
  model: string
  /** Descriptor schema version for future migrations. */
  descriptorVersion: string
  /** Match threshold used by this profile. */
  threshold: number
  /** Enrolled descriptors captured from multiple local frames. */
  samples: LocalFaceSample[]
}

export interface LocalFaceMatchResult {
  /** Stable match status after debounce. */
  status: LocalFaceProfileStatus
  /** Descriptor distance score (`null` when unavailable). */
  score: number | null
  /** Frame quality score in [0,100]. */
  quality: number
  /** Optional diagnostic reason. */
  reason?: string
}

/**
 * Local face-gate runtime configuration.
 */
interface LocalFaceGateConfig {
  /** Consecutive frames required before switching match status. @default 3 */
  stableFrames: number
  /** Default descriptor distance threshold. @default 0.38 */
  defaultThreshold: number
  /** Minimum quality score required for enrollment/matching. @default 35 */
  qualityThreshold: number
  /** Minimum face size in normalized frame coordinates. @default 0.13 */
  minFaceSizeNormalized: number
  /** Enrollment samples required before profile is saved. @default 6 */
  enrollSampleCount: number
}

export interface FaceQualityMetrics {
  /** Average luma value in range [0,255]. */
  brightness: number
  /** Laplacian-variance proxy for sharpness (higher is clearer). */
  sharpness: number
  /** Blended quality score in [0,100]. */
  qualityScore: number
}

const PROFILE_STORAGE_KEY = 'airi.vision-experiment.local-face-profile.v1'
const ENABLED_STORAGE_KEY = 'airi.vision-experiment.local-face-gate-enabled.v1'
const DEFAULT_CONFIG: LocalFaceGateConfig = {
  stableFrames: 3,
  defaultThreshold: 0.38,
  qualityThreshold: 35,
  minFaceSizeNormalized: 0.13,
  enrollSampleCount: 6,
}

/**
 * Local face gate for identity-consistent vision interaction.
 *
 * Use when:
 * - Vision interaction should respond only to the enrolled local subject
 * - All identity matching must stay fully local in renderer storage
 *
 * Expects:
 * - Face landmarks from MediaPipe FaceLandmarker per frame
 * - A live `<video>` element for local canvas-based quality scoring
 *
 * Returns:
 * - Enrollment/matching state, threshold tuning, and gate decisions
 */
export function useLocalFaceGate(partialConfig?: Partial<LocalFaceGateConfig>) {
  const config: LocalFaceGateConfig = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
  }

  const profile = ref<LocalFaceProfile | null>(loadProfile())
  const gateEnabled = ref(loadGateEnabled())
  const profileStatus = ref<LocalFaceProfileStatus>(profile.value ? 'enrolled' : 'not_enrolled')
  const gateState = ref<LocalFaceGateState>(gateEnabled.value ? 'gated' : 'disabled')
  const subjectStatus = ref<VisionSubjectStatus>('none')
  const matchScore = ref<number | null>(null)
  const lastSampleQuality = ref(0)
  const threshold = ref(profile.value?.threshold ?? config.defaultThreshold)
  const enrollmentSamples = ref<LocalFaceSample[]>([])
  const enrollmentProgress = ref(0)
  const errorMessage = ref('')

  const debugStatusText = ref('')
  const lastWelcomeAtMs = ref(Number.NEGATIVE_INFINITY)

  const offscreenCanvas = shallowRef<HTMLCanvasElement | null>(null)

  let stableStatusCandidate: LocalFaceProfileStatus = profile.value ? 'enrolled' : 'not_enrolled'
  let stableStatusFrames = 0
  let justTransitionedToMatched = false

  const hasProfile = computed(() => !!profile.value)
  const sampleCount = computed(() => profile.value?.samples.length ?? 0)
  const isMatching = computed(() => gateEnabled.value && !!profile.value)

  function loadProfile() {
    if (typeof localStorage === 'undefined')
      return null

    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (!raw)
        return null
      const parsed = JSON.parse(raw) as LocalFaceProfile
      if (!parsed || !Array.isArray(parsed.samples))
        return null

      return {
        ...parsed,
        threshold: normalizeThreshold(parsed.threshold),
        samples: parsed.samples
          .filter(sample => Array.isArray(sample.descriptor) && sample.descriptor.length > 0)
          .map(sample => ({
            descriptor: sample.descriptor.map(value => Number(value)),
            quality: Number.isFinite(sample.quality) ? sample.quality : 0,
            capturedAt: sample.capturedAt ?? new Date().toISOString(),
          })),
      }
    }
    catch {
      return null
    }
  }

  function loadGateEnabled() {
    if (typeof localStorage === 'undefined')
      return false

    try {
      return localStorage.getItem(ENABLED_STORAGE_KEY) === 'true'
    }
    catch {
      return false
    }
  }

  function persistProfile(nextProfile: LocalFaceProfile | null) {
    if (typeof localStorage === 'undefined')
      return

    try {
      if (!nextProfile)
        localStorage.removeItem(PROFILE_STORAGE_KEY)
      else
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
    }
    catch {
      // ignore local persistence failures
    }
  }

  function persistGateEnabled(enabled: boolean) {
    if (typeof localStorage === 'undefined')
      return

    try {
      localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
    }
    catch {
      // ignore local persistence failures
    }
  }

  function normalizeThreshold(nextThreshold: number) {
    if (!Number.isFinite(nextThreshold))
      return config.defaultThreshold
    return Math.min(1.2, Math.max(0.05, nextThreshold))
  }

  function updateThreshold(nextThreshold: number) {
    threshold.value = normalizeThreshold(nextThreshold)
    if (!profile.value)
      return
    profile.value = {
      ...profile.value,
      threshold: threshold.value,
      updatedAt: new Date().toISOString(),
    }
    persistProfile(profile.value)
  }

  function updateGateEnabled(enabled: boolean) {
    gateEnabled.value = enabled
    persistGateEnabled(enabled)
    if (!enabled) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      return
    }
    gateState.value = profile.value ? 'gated' : 'locked'
    subjectStatus.value = profile.value ? 'unknown_subject' : 'none'
  }

  function extractFaceBounds(landmarks: NormalizedLandmark[]) {
    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const landmark of landmarks) {
      minX = Math.min(minX, landmark.x)
      maxX = Math.max(maxX, landmark.x)
      minY = Math.min(minY, landmark.y)
      maxY = Math.max(maxY, landmark.y)
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY))
      return null

    const width = Math.max(0, maxX - minX)
    const height = Math.max(0, maxY - minY)
    if (width <= 0 || height <= 0)
      return null

    return { minX, maxX, minY, maxY, width, height }
  }

  function sampleFacePatch(video: HTMLVideoElement, landmarks: NormalizedLandmark[]) {
    const faceBounds = extractFaceBounds(landmarks)
    if (!faceBounds)
      return null

    const minFaceSize = Math.min(faceBounds.width, faceBounds.height)
    if (minFaceSize < config.minFaceSizeNormalized) {
      return {
        reason: 'low quality',
        quality: 0,
        metrics: { brightness: 0, sharpness: 0, qualityScore: 0 },
      }
    }

    const sourceWidth = Math.max(video.videoWidth, 1)
    const sourceHeight = Math.max(video.videoHeight, 1)
    const marginX = faceBounds.width * 0.20
    const marginY = faceBounds.height * 0.20

    const cropMinX = Math.max(0, faceBounds.minX - marginX)
    const cropMaxX = Math.min(1, faceBounds.maxX + marginX)
    const cropMinY = Math.max(0, faceBounds.minY - marginY)
    const cropMaxY = Math.min(1, faceBounds.maxY + marginY)

    const cropWidthPx = Math.max(1, Math.round((cropMaxX - cropMinX) * sourceWidth))
    const cropHeightPx = Math.max(1, Math.round((cropMaxY - cropMinY) * sourceHeight))
    const cropXpx = Math.max(0, Math.round(cropMinX * sourceWidth))
    const cropYpx = Math.max(0, Math.round(cropMinY * sourceHeight))

    const patchSize = 96
    const patchCanvas = offscreenCanvas.value ?? document.createElement('canvas')
    offscreenCanvas.value = patchCanvas
    patchCanvas.width = patchSize
    patchCanvas.height = patchSize
    const patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true })
    if (!patchCtx)
      return null

    patchCtx.drawImage(video, cropXpx, cropYpx, cropWidthPx, cropHeightPx, 0, 0, patchSize, patchSize)
    const imageData = patchCtx.getImageData(0, 0, patchSize, patchSize)
    const metrics = computeFaceQualityMetrics(imageData.data, patchSize, patchSize)

    return {
      reason: metrics.qualityScore >= config.qualityThreshold ? undefined : 'low quality',
      quality: metrics.qualityScore,
      metrics,
      normalizedBounds: faceBounds,
    }
  }

  function buildLandmarkDescriptor(landmarks: NormalizedLandmark[]) {
    if (!landmarks.length)
      return null

    const bounds = extractFaceBounds(landmarks)
    if (!bounds)
      return null

    const centerX = (bounds.minX + bounds.maxX) * 0.5
    const centerY = (bounds.minY + bounds.maxY) * 0.5
    const baseSize = Math.max(bounds.width, bounds.height)
    if (baseSize <= 1e-6)
      return null

    const anchorIndices = [
      1, // nose tip
      33,
      133, // left eye corners
      362,
      263, // right eye corners
      61,
      291, // mouth corners
      10,
      152, // top and chin
      234,
      454, // face side
    ]

    const descriptor: number[] = []
    for (const index of anchorIndices) {
      const point = landmarks[index]
      if (!point)
        continue
      descriptor.push((point.x - centerX) / baseSize)
      descriptor.push((point.y - centerY) / baseSize)
      descriptor.push((point.z ?? 0) / baseSize)
    }

    // Supplemental geometry features for better orientation robustness.
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    const nose = landmarks[1]
    const chin = landmarks[152]
    if (leftEye && rightEye && nose && chin) {
      descriptor.push(distance2d(leftEye, rightEye) / baseSize)
      descriptor.push(distance2d(nose, chin) / baseSize)
      descriptor.push((nose.x - centerX) / baseSize)
      descriptor.push((nose.y - centerY) / baseSize)
    }

    if (!descriptor.length)
      return null

    // L2 normalize to reduce scale and small pose shifts.
    const squaredSum = descriptor.reduce((sum, value) => sum + (value * value), 0)
    const norm = Math.sqrt(squaredSum)
    if (norm <= 1e-9)
      return null

    return descriptor.map(value => value / norm)
  }

  function distance2d(a: NormalizedLandmark, b: NormalizedLandmark) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  function descriptorDistance(a: number[], b: number[]) {
    const n = Math.min(a.length, b.length)
    if (!n)
      return Number.POSITIVE_INFINITY
    let sum = 0
    for (let i = 0; i < n; i += 1) {
      const d = a[i]! - b[i]!
      sum += d * d
    }
    return Math.sqrt(sum / n)
  }

  function computeDistanceToProfileSamples(currentDescriptor: number[]) {
    if (!profile.value || !profile.value.samples.length)
      return Number.POSITIVE_INFINITY

    let minDistance = Number.POSITIVE_INFINITY
    for (const sample of profile.value.samples) {
      if (!sample.descriptor.length)
        continue
      const distance = descriptorDistance(currentDescriptor, sample.descriptor)
      minDistance = Math.min(minDistance, distance)
    }
    return minDistance
  }

  function resetStableState() {
    stableStatusCandidate = profile.value ? 'enrolled' : 'not_enrolled'
    stableStatusFrames = 0
    justTransitionedToMatched = false
  }

  function updateStableMatchState(nextStatus: LocalFaceProfileStatus) {
    if (nextStatus === stableStatusCandidate) {
      stableStatusFrames += 1
    }
    else {
      stableStatusCandidate = nextStatus
      stableStatusFrames = 1
    }

    if (stableStatusFrames < config.stableFrames)
      return

    const previousStatus = profileStatus.value
    profileStatus.value = nextStatus
    justTransitionedToMatched = previousStatus !== 'matched' && nextStatus === 'matched'
  }

  function clearError() {
    errorMessage.value = ''
  }

  function createProfile(displayName: string, samples: LocalFaceSample[]) {
    const nowIso = new Date().toISOString()
    const nextProfile: LocalFaceProfile = {
      id: globalThis.crypto?.randomUUID?.() ?? `face-${Date.now()}`,
      displayName: displayName.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
      model: 'mediapipe-face-landmarks-signature',
      descriptorVersion: 'v1',
      threshold: threshold.value,
      samples,
    }
    profile.value = nextProfile
    persistProfile(nextProfile)
    profileStatus.value = 'enrolled'
    gateState.value = gateEnabled.value ? 'gated' : 'disabled'
    subjectStatus.value = gateEnabled.value ? 'unknown_subject' : 'none'
  }

  function deleteProfile() {
    profile.value = null
    enrollmentSamples.value = []
    enrollmentProgress.value = 0
    matchScore.value = null
    lastSampleQuality.value = 0
    threshold.value = config.defaultThreshold
    profileStatus.value = 'not_enrolled'
    gateState.value = gateEnabled.value ? 'locked' : 'disabled'
    subjectStatus.value = 'none'
    persistProfile(null)
    resetStableState()
  }

  function resetEnrollmentBuffer() {
    enrollmentSamples.value = []
    enrollmentProgress.value = 0
  }

  function setDisplayName(nextName: string) {
    if (!profile.value)
      return
    profile.value = {
      ...profile.value,
      displayName: nextName.trim().slice(0, 48),
      updatedAt: new Date().toISOString(),
    }
    persistProfile(profile.value)
  }

  function canEmitWelcome(nowMs: number, cooldownMs: number) {
    return nowMs - lastWelcomeAtMs.value >= cooldownMs
  }

  function consumeJustMatchedWelcome(nowMs: number, cooldownMs: number) {
    if (!justTransitionedToMatched)
      return false
    if (!canEmitWelcome(nowMs, cooldownMs))
      return false
    justTransitionedToMatched = false
    lastWelcomeAtMs.value = nowMs
    return true
  }

  async function enrollFromCurrentFrame(options: {
    displayName: string
    video: HTMLVideoElement | null
    faceResult: FaceLandmarkerResult | null
  }) {
    clearError()

    const nextDisplayName = options.displayName.trim()
    if (!nextDisplayName) {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'displayName required'
      return {
        ok: false,
        reason: 'displayName required',
      } as const
    }

    if (!options.video || options.video.readyState < 2) {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'camera inactive'
      return {
        ok: false,
        reason: 'camera inactive',
      } as const
    }

    if (!options.faceResult) {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'no face'
      return {
        ok: false,
        reason: 'no face',
      } as const
    }

    const faces = options.faceResult.faceLandmarks ?? []
    if (!faces.length) {
      profileStatus.value = 'no_face'
      errorMessage.value = 'no face'
      return {
        ok: false,
        reason: 'no face',
      } as const
    }

    if (faces.length > 1) {
      profileStatus.value = 'multiple_faces'
      errorMessage.value = 'multiple faces'
      return {
        ok: false,
        reason: 'multiple faces',
      } as const
    }

    const landmarks = faces[0] ?? []
    if (!landmarks.length) {
      profileStatus.value = 'no_face'
      errorMessage.value = 'no face'
      return {
        ok: false,
        reason: 'no face',
      } as const
    }

    profileStatus.value = 'enrolling'

    const patch = sampleFacePatch(options.video, landmarks)
    if (!patch) {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'descriptor failed'
      return {
        ok: false,
        reason: 'descriptor failed',
      } as const
    }

    lastSampleQuality.value = patch.quality
    debugStatusText.value = `brightness=${patch.metrics.brightness.toFixed(1)} sharpness=${patch.metrics.sharpness.toFixed(1)}`

    if (patch.reason === 'low quality') {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'low quality'
      return {
        ok: false,
        reason: 'low quality',
      } as const
    }

    const descriptor = buildLandmarkDescriptor(landmarks)
    if (!descriptor) {
      profileStatus.value = 'uncertain'
      errorMessage.value = 'descriptor failed'
      return {
        ok: false,
        reason: 'descriptor failed',
      } as const
    }

    const sample: LocalFaceSample = {
      descriptor,
      quality: patch.quality,
      capturedAt: new Date().toISOString(),
    }
    enrollmentSamples.value = [...enrollmentSamples.value, sample]
    enrollmentProgress.value = Math.min(1, enrollmentSamples.value.length / config.enrollSampleCount)

    if (enrollmentSamples.value.length < config.enrollSampleCount) {
      errorMessage.value = ''
      return {
        ok: true,
        completed: false,
        captured: enrollmentSamples.value.length,
        total: config.enrollSampleCount,
      } as const
    }

    createProfile(nextDisplayName, enrollmentSamples.value)
    resetEnrollmentBuffer()
    resetStableState()
    errorMessage.value = ''
    return {
      ok: true,
      completed: true,
    } as const
  }

  function evaluateFrame(options: {
    faceResult: FaceLandmarkerResult | null
    video: HTMLVideoElement | null
    nowMs: number
  }): LocalFaceMatchResult {
    clearError()
    justTransitionedToMatched = false

    if (!gateEnabled.value) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      matchScore.value = null
      profileStatus.value = profile.value ? 'enrolled' : 'not_enrolled'
      return {
        status: profileStatus.value,
        score: null,
        quality: lastSampleQuality.value,
      }
    }

    if (!profile.value) {
      gateState.value = 'locked'
      subjectStatus.value = 'none'
      matchScore.value = null
      profileStatus.value = 'not_enrolled'
      return {
        status: 'not_enrolled',
        score: null,
        quality: lastSampleQuality.value,
      }
    }

    if (!options.faceResult) {
      gateState.value = 'locked'
      subjectStatus.value = 'unknown_subject'
      updateStableMatchState('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        quality: lastSampleQuality.value,
        reason: 'face result unavailable',
      }
    }

    profileStatus.value = 'matching'
    const faces = options.faceResult.faceLandmarks ?? []
    if (!faces.length) {
      gateState.value = 'locked'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      updateStableMatchState('no_face')
      return {
        status: profileStatus.value,
        score: null,
        quality: lastSampleQuality.value,
        reason: 'no face',
      }
    }

    if (faces.length > 1) {
      gateState.value = 'locked'
      subjectStatus.value = 'multiple_subjects'
      matchScore.value = null
      updateStableMatchState('multiple_faces')
      return {
        status: profileStatus.value,
        score: null,
        quality: lastSampleQuality.value,
        reason: 'multiple faces',
      }
    }

    const landmarks = faces[0] ?? []
    const descriptor = buildLandmarkDescriptor(landmarks)
    const patch = options.video ? sampleFacePatch(options.video, landmarks) : null
    if (!descriptor || !patch) {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      updateStableMatchState('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        quality: lastSampleQuality.value,
        reason: 'descriptor failed',
      }
    }

    lastSampleQuality.value = patch.quality
    debugStatusText.value = `brightness=${patch.metrics.brightness.toFixed(1)} sharpness=${patch.metrics.sharpness.toFixed(1)}`

    if (patch.reason === 'low quality') {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      updateStableMatchState('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        quality: patch.quality,
        reason: 'low quality',
      }
    }

    const distance = computeDistanceToProfileSamples(descriptor)
    matchScore.value = Number.isFinite(distance) ? distance : null
    const matched = distance <= threshold.value
    updateStableMatchState(matched ? 'matched' : 'unmatched')
    const resolvedStatus = profileStatus.value as LocalFaceProfileStatus

    if (resolvedStatus === 'matched') {
      gateState.value = 'enabled'
      subjectStatus.value = 'matched_subject'
    }
    else {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
    }

    return {
      status: resolvedStatus,
      score: matchScore.value,
      quality: patch.quality,
      reason: matched ? undefined : 'distance above threshold',
    }
  }

  function resetForCameraStop() {
    resetStableState()
    matchScore.value = null
    lastSampleQuality.value = 0
    if (!gateEnabled.value) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      profileStatus.value = profile.value ? 'enrolled' : 'not_enrolled'
      return
    }
    gateState.value = profile.value ? 'gated' : 'locked'
    subjectStatus.value = profile.value ? 'unknown_subject' : 'none'
    profileStatus.value = profile.value ? 'enrolled' : 'not_enrolled'
  }

  function clearRuntimeError() {
    clearError()
  }

  return {
    gateEnabled,
    gateState,
    profileStatus,
    subjectStatus,
    profile,
    threshold,
    hasProfile,
    sampleCount,
    matchScore,
    lastSampleQuality,
    debugStatusText,
    enrollmentProgress,
    isMatching,
    errorMessage,
    updateGateEnabled,
    updateThreshold,
    setDisplayName,
    deleteProfile,
    enrollFromCurrentFrame,
    evaluateFrame,
    resetForCameraStop,
    clearRuntimeError,
    consumeJustMatchedWelcome,
  }
}

/**
 * Computes local face quality score from RGBA pixels.
 *
 * Before:
 * - Raw face patch pixels without quality signals
 *
 * After:
 * - Brightness + sharpness + blended quality in range [0, 100]
 */
export function computeFaceQualityMetrics(rgba: Uint8ClampedArray, width: number, height: number): FaceQualityMetrics {
  const pixelCount = Math.max(1, width * height)
  const gray = new Float32Array(pixelCount)

  let brightnessAccumulator = 0
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
    const r = rgba[i] ?? 0
    const g = rgba[i + 1] ?? 0
    const b = rgba[i + 2] ?? 0
    const luma = (0.299 * r) + (0.587 * g) + (0.114 * b)
    gray[j] = luma
    brightnessAccumulator += luma
  }

  const brightness = brightnessAccumulator / pixelCount

  // Laplacian variance approximation as blur/sharpness proxy.
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
  const laplaceVariance = laplaceCount > 0
    ? (laplaceSquaredSum / laplaceCount) - (laplaceMean * laplaceMean)
    : 0
  const sharpness = Math.max(0, laplaceVariance)

  const brightnessScore = 100 - Math.min(100, Math.abs(brightness - 132) * 1.2)
  const sharpnessScore = Math.min(100, sharpness / 18)
  const qualityScore = Math.max(0, Math.min(100, (brightnessScore * 0.45) + (sharpnessScore * 0.55)))

  return {
    brightness,
    sharpness,
    qualityScore,
  }
}

export type {
  LocalFaceGateConfig,
}
