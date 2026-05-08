import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

import type { FaceSampleQuality, VisionFaceProfilePayload } from './use-encrypted-face-profile'

import { describe, expect, it } from 'vitest'

import { createLandmarkDescriptor, useLocalFaceGate } from './use-local-face-gate'

function createLandmarks(variant: 'base' | 'different' = 'base') {
  const landmark = (x: number, y: number, z: number): NormalizedLandmark => ({ x, y, z, visibility: 0 })
  const points: NormalizedLandmark[] = Array.from({ length: 500 }, () => landmark(0.5, 0.5, 0))

  const baseMap: Record<number, NormalizedLandmark> = {
    1: landmark(0.50, 0.40, 0.01),
    33: landmark(0.42, 0.36, 0.02),
    133: landmark(0.46, 0.36, 0.02),
    362: landmark(0.54, 0.36, 0.02),
    263: landmark(0.58, 0.36, 0.02),
    61: landmark(0.45, 0.54, 0.01),
    291: landmark(0.55, 0.54, 0.01),
    10: landmark(0.50, 0.26, 0.00),
    152: landmark(0.50, 0.70, 0.00),
    234: landmark(0.38, 0.46, 0.01),
    454: landmark(0.62, 0.46, 0.01),
  }

  const differentMap: Record<number, NormalizedLandmark> = {
    ...baseMap,
    1: landmark(0.44, 0.29, 0.12),
    33: landmark(0.20, 0.22, 0.21),
    133: landmark(0.31, 0.33, 0.14),
    362: landmark(0.70, 0.50, 0.19),
    263: landmark(0.82, 0.38, 0.22),
    61: landmark(0.28, 0.67, 0.13),
    291: landmark(0.73, 0.62, 0.16),
    10: landmark(0.48, 0.08, 0.07),
    152: landmark(0.59, 0.88, 0.10),
    234: landmark(0.11, 0.57, 0.14),
    454: landmark(0.92, 0.49, 0.11),
  }

  const map = variant === 'base' ? baseMap : differentMap
  for (const [index, point] of Object.entries(map))
    points[Number(index)] = point
  return points
}

function descriptorFromLandmarks(landmarks: NormalizedLandmark[]) {
  const descriptor = createLandmarkDescriptor(landmarks, { descriptorVersion: 'landmark-signature-v1' })
  if (!descriptor)
    throw new Error('descriptor should be created for test landmarks')
  return descriptor
}

function createProfile(options?: {
  displayName?: string
  threshold?: number
  samples?: number[][]
  qualityThreshold?: number
  stableFrames?: number
}) {
  const now = '2026-05-08T00:00:00.000Z'
  const descriptors = options?.samples ?? [descriptorFromLandmarks(createLandmarks('base'))]

  const profile: VisionFaceProfilePayload = {
    schemaVersion: 'vision-face-profile-v1',
    id: 'profile-test-1',
    displayName: options?.displayName ?? 'Alice',
    createdAt: now,
    updatedAt: now,
    model: 'mediapipe-face-landmarker',
    descriptorVersion: 'landmark-signature-v1',
    threshold: options?.threshold ?? 0.38,
    qualityThreshold: options?.qualityThreshold ?? 0.45,
    enrollSampleCount: descriptors.length,
    stableFrames: options?.stableFrames ?? 3,
    samples: descriptors.map((descriptor, index) => ({
      descriptor,
      quality: 0.9,
      brightness: 140,
      sharpness: 30,
      contrast: 40,
      faceSize: 0.22,
      capturedAt: `2026-05-08T00:00:0${index}.000Z`,
    })),
  }

  return profile
}

function createFaceResult(faces: NormalizedLandmark[][]): FaceLandmarkerResult {
  return { faceLandmarks: faces } as FaceLandmarkerResult
}

function createQuality(qualityScore: number): FaceSampleQuality {
  return {
    qualityScore,
    brightness: 120,
    sharpness: 30,
    contrast: 35,
    faceSize: 0.2,
  }
}

function descriptorDistance(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length)
    return Number.POSITIVE_INFINITY
  let sum = 0
  for (let i = 0; i < a.length; i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    sum += d * d
  }
  return Math.sqrt(sum / a.length)
}

describe('useLocalFaceGate', () => {
  it('keeps deterministic initial state', () => {
    const gate = useLocalFaceGate()

    expect(gate.gateEnabled.value).toBe(false)
    expect(gate.gateState.value).toBe('disabled')
    expect(gate.profileStatus.value).toBe('not_enrolled')
    expect(gate.subjectStatus.value).toBe('none')
    expect(gate.hasProfile.value).toBe(false)
    expect(gate.canRunMatching.value).toBe(false)
    expect(gate.matchScore.value).toBeNull()
  })

  it('locks gate when enabled without unlocked profile and restores not_enrolled after profile deletion', () => {
    const gate = useLocalFaceGate()
    gate.setGateEnabled(true)

    expect(gate.gateState.value).toBe('locked')
    expect(gate.profileStatus.value).toBe('not_enrolled')
    expect(gate.subjectStatus.value).toBe('none')

    const profile = createProfile()
    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)
    expect(gate.hasProfile.value).toBe(true)
    expect(gate.gateState.value).toBe('gated')
    expect(gate.profileStatus.value).toBe('enrolled')
    expect(gate.unlockedDisplayName.value).toBe('Alice')

    gate.syncProfileFromPayload(null)
    expect(gate.hasProfile.value).toBe(false)
    expect(gate.profileStatus.value).toBe('not_enrolled')
    expect(gate.gateState.value).toBe('locked')
    expect(gate.unlockedDisplayName.value).toBe('')
    expect(gate.profileSampleCount.value).toBe(0)
  })

  it('keeps gate disabled behavior when gate switch is off', () => {
    const gate = useLocalFaceGate({ stableFrames: 3 })
    const profile = createProfile()
    const faceResult = createFaceResult([createLandmarks('base')])

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(false)
    const result = gate.evaluateFrame({
      faceResult,
      profile,
      qualityMetrics: createQuality(0.9),
    })

    expect(result.status).toBe('enrolled')
    expect(result.score).toBeNull()
    expect(gate.gateState.value).toBe('disabled')
    expect(gate.subjectStatus.value).toBe('none')
    expect(gate.canRunMatching.value).toBe(false)
  })

  it('requires stable frames to transition matched and unmatched', () => {
    const gate = useLocalFaceGate({ stableFrames: 3 })
    const profile = createProfile()
    const matchedFace = createFaceResult([createLandmarks('base')])
    const unmatchedFace = createFaceResult([createLandmarks('different')])
    const baseDescriptor = descriptorFromLandmarks(createLandmarks('base'))
    const differentDescriptor = descriptorFromLandmarks(createLandmarks('different'))
    const differentDistance = descriptorDistance(baseDescriptor, differentDescriptor)

    expect(differentDistance).toBeGreaterThan(0.08)

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)

    const first = gate.evaluateFrame({ faceResult: matchedFace, profile, qualityMetrics: createQuality(0.92) })
    const second = gate.evaluateFrame({ faceResult: matchedFace, profile, qualityMetrics: createQuality(0.92) })
    const third = gate.evaluateFrame({ faceResult: matchedFace, profile, qualityMetrics: createQuality(0.92) })

    expect(first.status).toBe('enrolled')
    expect(second.status).toBe('enrolled')
    expect(third.status).toBe('matched')
    expect(gate.gateState.value).toBe('enabled')
    expect(gate.subjectStatus.value).toBe('matched_subject')
    expect(gate.matchScore.value).not.toBeNull()
    expect(gate.matchScore.value).toBeLessThanOrEqual(profile.threshold)

    gate.setThreshold(differentDistance - 1e-4)

    const unmatchFirst = gate.evaluateFrame({ faceResult: unmatchedFace, profile, qualityMetrics: createQuality(0.92) })
    const unmatchSecond = gate.evaluateFrame({ faceResult: unmatchedFace, profile, qualityMetrics: createQuality(0.92) })
    const unmatchThird = gate.evaluateFrame({ faceResult: unmatchedFace, profile, qualityMetrics: createQuality(0.92) })

    expect(unmatchFirst.status).toBe('matched')
    expect(unmatchSecond.status).toBe('matched')
    expect(unmatchThird.status).toBe('unmatched')
    expect(gate.gateState.value).toBe('gated')
    expect(gate.subjectStatus.value).toBe('unknown_subject')
  })

  it('locks gate immediately but only flips no_face/multiple_faces status after stableFrames, then gates low quality', () => {
    const gate = useLocalFaceGate({ stableFrames: 3 })
    const profile = createProfile()

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)

    const noFaceResult1 = gate.evaluateFrame({
      faceResult: createFaceResult([]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(noFaceResult1.reason).toBe('no face')
    expect(gate.gateState.value).toBe('locked')
    expect(noFaceResult1.status).toBe('enrolled')

    const noFaceResult2 = gate.evaluateFrame({
      faceResult: createFaceResult([]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(noFaceResult2.status).toBe('enrolled')

    const noFaceResult3 = gate.evaluateFrame({
      faceResult: createFaceResult([]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(noFaceResult3.status).toBe('no_face')
    expect(gate.subjectStatus.value).toBe('unknown_subject')

    const multipleFacesResult1 = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base'), createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(multipleFacesResult1.reason).toBe('multiple faces')
    expect(gate.gateState.value).toBe('locked')
    expect(multipleFacesResult1.status).toBe('no_face')

    const multipleFacesResult2 = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base'), createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(multipleFacesResult2.status).toBe('no_face')

    const multipleFacesResult3 = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base'), createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(multipleFacesResult3.status).toBe('multiple_faces')
    expect(gate.subjectStatus.value).toBe('multiple_subjects')

    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.1),
    })
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.1),
    })
    const lowQualityResult = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.1),
    })
    expect(lowQualityResult.status).toBe('uncertain')
    expect(lowQualityResult.reason).toBe('low quality')
    expect(gate.gateState.value).toBe('gated')
    expect(gate.profileStatus.value).toBe('uncertain')
    expect(gate.debugStatusText.value).toContain('quality=0.10')
  })

  it('matches exactly at threshold and rejects above-threshold distance', () => {
    const sourceDescriptor = descriptorFromLandmarks(createLandmarks('base'))
    const targetDescriptor = descriptorFromLandmarks(createLandmarks('different'))
    const distance = descriptorDistance(sourceDescriptor, targetDescriptor)
    expect(distance).toBeGreaterThan(0.08)

    const gate = useLocalFaceGate({ stableFrames: 2 })
    const profile = createProfile({
      threshold: distance,
      samples: [sourceDescriptor],
      stableFrames: 2,
    })

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)

    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    const atBoundary = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(atBoundary.status).toBe('matched')
    expect(gate.gateState.value).toBe('enabled')
    expect(gate.matchScore.value).toBeCloseTo(distance, 10)

    gate.setThreshold(distance - 1e-6)
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    const aboveThreshold = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('different')]),
      profile,
      qualityMetrics: createQuality(0.9),
    })
    expect(aboveThreshold.status).toBe('unmatched')
    expect(aboveThreshold.reason).toBe('distance above threshold')
    expect(gate.gateState.value).toBe('gated')
  })

  it('fails safely for descriptor dimension mismatch and non-finite descriptor values', () => {
    const baseDescriptor = descriptorFromLandmarks(createLandmarks('base'))
    const malformedProfile = createProfile({
      threshold: 1.2,
      samples: [baseDescriptor.slice(0, Math.max(1, baseDescriptor.length - 3))],
      stableFrames: 1,
    })

    const gate = useLocalFaceGate({ stableFrames: 2 })
    gate.syncProfileFromPayload(malformedProfile)
    gate.setGateEnabled(true)

    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: malformedProfile,
      qualityMetrics: createQuality(0.9),
    })
    const mismatched = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: malformedProfile,
      qualityMetrics: createQuality(0.9),
    })
    expect(mismatched.status).toBe('unmatched')
    expect(mismatched.reason).toBe('distance above threshold')
    expect(gate.matchScore.value).toBeNull()

    const nanProfile = createProfile({
      threshold: 1.2,
      samples: [[Number.NaN, Number.POSITIVE_INFINITY, ...baseDescriptor.slice(2)]],
      stableFrames: 1,
    })
    gate.syncProfileFromPayload(nanProfile)
    gate.setGateEnabled(true)
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: nanProfile,
      qualityMetrics: createQuality(0.9),
    })
    const nonFinite = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: nanProfile,
      qualityMetrics: createQuality(0.9),
    })
    expect(nonFinite.status).toBe('unmatched')
    expect(nonFinite.reason).toBe('distance above threshold')
    expect(gate.matchScore.value).toBeNull()
  })

  it('cannot match when profile samples are empty and remains locked', () => {
    const gate = useLocalFaceGate({ stableFrames: 2 })
    const profileWithoutSamples = createProfile({ samples: [] })
    gate.syncProfileFromPayload(profileWithoutSamples)
    gate.setGateEnabled(true)

    const result = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: profileWithoutSamples,
      qualityMetrics: createQuality(0.95),
    })

    expect(result.status).toBe('enrolled')
    expect(result.reason).toBe('profile locked')
    expect(gate.gateState.value).toBe('locked')
    expect(gate.matchScore.value).toBeNull()
  })

  it('cannot keep matching after profile deletion', () => {
    const gate = useLocalFaceGate({ stableFrames: 2 })
    const profile = createProfile({ stableFrames: 2 })

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.95),
    })
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.95),
    })
    expect(gate.profileStatus.value).toBe('matched')
    expect(gate.gateState.value).toBe('enabled')

    gate.syncProfileFromPayload(null)
    const afterDeletion = gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile: null,
      qualityMetrics: createQuality(0.95),
    })

    expect(afterDeletion.status).toBe('not_enrolled')
    expect(afterDeletion.reason).toBe('not enrolled')
    expect(gate.profileStatus.value).toBe('not_enrolled')
    expect(gate.gateState.value).toBe('locked')
    expect(gate.matchScore.value).toBeNull()
  })

  it('exposes deterministic welcome transition gating with cooldown', () => {
    const gate = useLocalFaceGate({ stableFrames: 2 })
    const profile = createProfile({ stableFrames: 2 })

    gate.syncProfileFromPayload(profile)
    gate.setGateEnabled(true)
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.95),
    })
    gate.evaluateFrame({
      faceResult: createFaceResult([createLandmarks('base')]),
      profile,
      qualityMetrics: createQuality(0.95),
    })

    const firstWelcome = gate.consumeJustMatchedWelcome(1_000, 8_000)
    const secondWelcome = gate.consumeJustMatchedWelcome(2_000, 8_000)
    const afterCooldown = gate.consumeJustMatchedWelcome(10_500, 8_000)

    expect(firstWelcome).toBe(true)
    expect(secondWelcome).toBe(false)
    expect(afterCooldown).toBe(false)
  })
})
