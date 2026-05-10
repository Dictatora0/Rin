import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { FaceSampleQuality, VisionFaceProfilePayload } from './use-encrypted-face-profile'

import { computed, ref } from 'vue'

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

export type LocalFaceGateState = 'disabled' | 'enabled' | 'gated' | 'locked'

export type VisionSubjectStatus = 'none' | 'matched_subject' | 'unknown_subject' | 'multiple_subjects'

export interface LocalFaceSampleDescriptor {
  descriptor: number[]
  quality: number
  capturedAt: string
}

export interface LocalFaceGateConfig {
  /** Consecutive frames required before switching match status. @default 3 */
  stableFrames?: number
  /** Minimum descriptor quality score in [0,1]. @default 0.45 */
  qualityThreshold?: number
}

export interface LocalFaceMatchResult {
  status: LocalFaceProfileStatus
  score: number | null
  reason?: string
}

const DEFAULT_CONFIG: Required<LocalFaceGateConfig> = {
  stableFrames: 3,
  qualityThreshold: 0.45,
}

export interface CreateDescriptorOptions {
  descriptorVersion?: string
}

export interface GateEvaluationInput {
  faceResult: FaceLandmarkerResult | null
  profile: VisionFaceProfilePayload | null
  qualityMetrics: FaceSampleQuality | null
}

export function useLocalFaceGate(partialConfig?: LocalFaceGateConfig) {
  const config = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
  }

  const gateEnabled = ref(false)
  const profileStatus = ref<LocalFaceProfileStatus>('not_enrolled')
  const gateState = ref<LocalFaceGateState>('disabled')
  const subjectStatus = ref<VisionSubjectStatus>('none')
  const matchScore = ref<number | null>(null)
  const threshold = ref(0.38)
  const qualityThreshold = ref(config.qualityThreshold)
  const stableFrames = ref(config.stableFrames)
  const debugStatusText = ref('')

  const hasUnlockedProfile = ref(false)
  const unlockedDisplayName = ref('')
  const profileSampleCount = ref(0)
  const profileUpdatedAt = ref('')
  const lastWelcomeAtMs = ref(Number.NEGATIVE_INFINITY)
  const stableStatusCandidate = ref<LocalFaceProfileStatus>('not_enrolled')
  const stableStatusFrames = ref(0)
  const justTransitionedToMatched = ref(false)

  const hasProfile = computed(() => profileSampleCount.value > 0)
  const canRunMatching = computed(() => gateEnabled.value && hasUnlockedProfile.value && hasProfile.value)

  function syncProfileFromPayload(payload: VisionFaceProfilePayload | null) {
    if (!payload) {
      hasUnlockedProfile.value = false
      unlockedDisplayName.value = ''
      profileSampleCount.value = 0
      profileUpdatedAt.value = ''
      profileStatus.value = 'not_enrolled'
      if (!gateEnabled.value)
        gateState.value = 'disabled'
      else
        gateState.value = 'locked'
      subjectStatus.value = 'none'
      return
    }

    hasUnlockedProfile.value = true
    unlockedDisplayName.value = payload.displayName
    profileSampleCount.value = payload.samples.length
    profileUpdatedAt.value = payload.updatedAt
    threshold.value = clampThreshold(payload.threshold)
    qualityThreshold.value = clampQualityThreshold(payload.qualityThreshold)
    stableFrames.value = clampStableFrames(payload.stableFrames)
    profileStatus.value = gateEnabled.value ? 'enrolled' : 'enrolled'
    gateState.value = gateEnabled.value ? 'gated' : 'disabled'
    subjectStatus.value = gateEnabled.value ? 'unknown_subject' : 'none'
    stableStatusCandidate.value = profileStatus.value
    stableStatusFrames.value = 0
    justTransitionedToMatched.value = false
  }

  function setGateEnabled(enabled: boolean) {
    gateEnabled.value = enabled
    if (!enabled) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      if (hasProfile.value)
        profileStatus.value = 'enrolled'
      else
        profileStatus.value = 'not_enrolled'
      return
    }

    if (!hasUnlockedProfile.value || !hasProfile.value) {
      gateState.value = 'locked'
      subjectStatus.value = 'none'
      profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
      return
    }

    gateState.value = 'gated'
    subjectStatus.value = 'unknown_subject'
    profileStatus.value = 'enrolled'
  }

  function setThreshold(nextThreshold: number) {
    threshold.value = clampThreshold(nextThreshold)
  }

  function setQualityThreshold(nextThreshold: number) {
    qualityThreshold.value = clampQualityThreshold(nextThreshold)
  }

  function setStableFrames(nextFrames: number) {
    stableFrames.value = clampStableFrames(nextFrames)
  }

  function resetForCameraStop() {
    matchScore.value = null
    stableStatusFrames.value = 0
    stableStatusCandidate.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
    justTransitionedToMatched.value = false
    if (!gateEnabled.value) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
      return
    }
    gateState.value = hasUnlockedProfile.value && hasProfile.value ? 'gated' : 'locked'
    subjectStatus.value = hasUnlockedProfile.value ? 'unknown_subject' : 'none'
    profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
  }

  function setLockedByProfile() {
    hasUnlockedProfile.value = false
    unlockedDisplayName.value = ''
    if (gateEnabled.value) {
      gateState.value = hasProfile.value ? 'locked' : 'locked'
      subjectStatus.value = 'none'
      profileStatus.value = hasProfile.value ? 'enrolled' : 'not_enrolled'
    }
  }

  function updateStableStatus(nextStatus: LocalFaceProfileStatus) {
    if (stableStatusCandidate.value === nextStatus) {
      stableStatusFrames.value += 1
    }
    else {
      stableStatusCandidate.value = nextStatus
      stableStatusFrames.value = 1
    }

    if (stableStatusFrames.value < stableFrames.value)
      return

    const previous = profileStatus.value
    profileStatus.value = nextStatus
    justTransitionedToMatched.value = previous !== 'matched' && nextStatus === 'matched'
  }

  function consumeJustMatchedWelcome(nowMs: number, cooldownMs: number) {
    if (!justTransitionedToMatched.value)
      return false
    if (nowMs - lastWelcomeAtMs.value < cooldownMs)
      return false
    justTransitionedToMatched.value = false
    lastWelcomeAtMs.value = nowMs
    return true
  }

  function evaluateFrame(input: GateEvaluationInput): LocalFaceMatchResult {
    justTransitionedToMatched.value = false

    if (!gateEnabled.value) {
      gateState.value = 'disabled'
      subjectStatus.value = 'none'
      matchScore.value = null
      return {
        status: hasProfile.value ? 'enrolled' : 'not_enrolled',
        score: null,
      }
    }

    if (!hasUnlockedProfile.value || !input.profile || !input.profile.samples.length) {
      gateState.value = 'locked'
      subjectStatus.value = 'none'
      matchScore.value = null
      profileStatus.value = input.profile ? 'enrolled' : 'not_enrolled'
      return {
        status: profileStatus.value,
        score: null,
        reason: input.profile ? 'profile locked' : 'not enrolled',
      }
    }

    if (!input.faceResult) {
      gateState.value = 'locked'
      subjectStatus.value = 'unknown_subject'
      updateStableStatus('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'face result unavailable',
      }
    }

    const faces = input.faceResult.faceLandmarks ?? []
    if (!faces.length) {
      gateState.value = 'locked'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      updateStableStatus('no_face')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'no face',
      }
    }

    if (faces.length > 1) {
      gateState.value = 'locked'
      subjectStatus.value = 'multiple_subjects'
      matchScore.value = null
      updateStableStatus('multiple_faces')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'multiple faces',
      }
    }

    const landmarks = faces[0] ?? []
    if (!landmarks.length) {
      gateState.value = 'locked'
      subjectStatus.value = 'unknown_subject'
      updateStableStatus('no_face')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'no face',
      }
    }

    if (input.qualityMetrics && input.qualityMetrics.qualityScore < qualityThreshold.value) {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      debugStatusText.value = `quality=${input.qualityMetrics.qualityScore.toFixed(2)} threshold=${qualityThreshold.value.toFixed(2)}`
      updateStableStatus('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'low quality',
      }
    }

    const descriptor = createLandmarkDescriptor(landmarks, { descriptorVersion: input.profile.descriptorVersion })
    if (!descriptor) {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
      matchScore.value = null
      updateStableStatus('uncertain')
      return {
        status: profileStatus.value,
        score: null,
        reason: 'descriptor failed',
      }
    }

    const distance = minDistanceToSamples(descriptor, input.profile.samples)
    matchScore.value = Number.isFinite(distance) ? distance : null
    const matched = distance <= threshold.value
    updateStableStatus(matched ? 'matched' : 'unmatched')

    if (profileStatus.value === 'matched') {
      gateState.value = 'enabled'
      subjectStatus.value = 'matched_subject'
    }
    else {
      gateState.value = 'gated'
      subjectStatus.value = 'unknown_subject'
    }

    return {
      status: profileStatus.value,
      score: matchScore.value,
      reason: matched ? undefined : 'distance above threshold',
    }
  }

  return {
    gateEnabled,
    gateState,
    profileStatus,
    subjectStatus,
    hasProfile,
    hasUnlockedProfile,
    unlockedDisplayName,
    profileSampleCount,
    profileUpdatedAt,
    matchScore,
    threshold,
    qualityThreshold,
    stableFrames,
    debugStatusText,
    canRunMatching,
    setGateEnabled,
    setThreshold,
    setQualityThreshold,
    setStableFrames,
    setLockedByProfile,
    syncProfileFromPayload,
    evaluateFrame,
    resetForCameraStop,
    consumeJustMatchedWelcome,
  }
}

function clampThreshold(value: number) {
  if (!Number.isFinite(value))
    return 0.38
  return Math.min(1.2, Math.max(0.05, value))
}

function clampQualityThreshold(value: number) {
  if (!Number.isFinite(value))
    return 0.45
  return Math.min(1, Math.max(0.05, value))
}

function clampStableFrames(value: number) {
  if (!Number.isFinite(value))
    return 3
  return Math.min(12, Math.max(2, Math.round(value)))
}

function minDistanceToSamples(descriptor: number[], samples: VisionFaceProfilePayload['samples']) {
  let minDistance = Number.POSITIVE_INFINITY
  for (const sample of samples) {
    const distance = descriptorDistance(descriptor, sample.descriptor)
    minDistance = Math.min(minDistance, distance)
  }
  return minDistance
}

function descriptorDistance(a: number[], b: number[]) {
  if (!a.length || !b.length)
    return Number.POSITIVE_INFINITY
  if (a.length !== b.length)
    return Number.POSITIVE_INFINITY

  const n = a.length
  let sum = 0
  for (let i = 0; i < n; i += 1) {
    const left = a[i] ?? 0
    const right = b[i] ?? 0
    if (!Number.isFinite(left) || !Number.isFinite(right))
      return Number.POSITIVE_INFINITY
    const d = left - right
    sum += d * d
  }
  if (!Number.isFinite(sum))
    return Number.POSITIVE_INFINITY

  return Math.sqrt(sum / n)
}

export function createLandmarkDescriptor(landmarks: NormalizedLandmark[], options?: CreateDescriptorOptions) {
  const bounds = extractFaceBounds(landmarks)
  if (!bounds)
    return null
  const centerX = (bounds.minX + bounds.maxX) * 0.5
  const centerY = (bounds.minY + bounds.maxY) * 0.5
  const baseSize = Math.max(bounds.width, bounds.height)
  if (baseSize <= 1e-6)
    return null

  const descriptorVersion = options?.descriptorVersion ?? 'landmark-signature-v1'
  const anchorIndices = descriptorVersion === 'landmark-signature-v1'
    ? [1, 33, 133, 362, 263, 61, 291, 10, 152, 234, 454]
    : [1, 33, 133, 362, 263, 61, 291, 10, 152, 234, 454]

  const descriptor: number[] = []
  for (const index of anchorIndices) {
    const point = landmarks[index]
    if (!point)
      continue
    descriptor.push((point.x - centerX) / baseSize)
    descriptor.push((point.y - centerY) / baseSize)
    descriptor.push((point.z ?? 0) / baseSize)
  }

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

  const squared = descriptor.reduce((sum, item) => sum + (item * item), 0)
  const norm = Math.sqrt(squared)
  if (norm <= 1e-9)
    return null
  return descriptor.map(item => item / norm)
}

function distance2d(a: NormalizedLandmark, b: NormalizedLandmark) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt((dx * dx) + (dy * dy))
}

export function extractFaceBounds(landmarks: NormalizedLandmark[]) {
  if (!landmarks.length)
    return null
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

  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY))
    return null

  const width = Math.max(0, maxX - minX)
  const height = Math.max(0, maxY - minY)
  if (width <= 0 || height <= 0)
    return null

  return {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5,
  }
}
