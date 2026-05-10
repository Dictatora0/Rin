// @vitest-environment jsdom

import type { VisionFaceProfilePayload } from './use-encrypted-face-profile'

import { beforeEach, describe, expect, it } from 'vitest'

import { useEncryptedFaceProfile } from './use-encrypted-face-profile'

function createProfilePayload(): VisionFaceProfilePayload {
  const now = '2026-05-08T00:00:00.000Z'
  return {
    schemaVersion: 'vision-face-profile-v1',
    id: 'profile-enc-1',
    displayName: 'Alice Secret Name',
    createdAt: now,
    updatedAt: now,
    model: 'mediapipe-face-landmarker',
    descriptorVersion: 'landmark-signature-v1',
    threshold: 0.42,
    qualityThreshold: 0.5,
    enrollSampleCount: 2,
    stableFrames: 3,
    samples: [
      {
        descriptor: [0.123456789, -0.987654321, 0.456789123],
        quality: 0.93,
        brightness: 128,
        sharpness: 31,
        contrast: 36,
        faceSize: 0.25,
        capturedAt: now,
      },
      {
        descriptor: [0.111111111, -0.222222222, 0.333333333],
        quality: 0.91,
        brightness: 126,
        sharpness: 30,
        contrast: 35,
        faceSize: 0.24,
        capturedAt: now,
      },
    ],
  }
}

const STORAGE_KEY = 'airi.vision-experiment.encrypted-face-profile.v1'

describe('useEncryptedFaceProfile', () => {
  beforeEach(() => {
    localStorage.clear()
    const profile = useEncryptedFaceProfile()
    profile.deleteProfile()
  })

  it('persists encrypted blob without plaintext displayName, descriptor, or passphrase', async () => {
    const profile = useEncryptedFaceProfile({ pbkdf2Iterations: 100_000 })
    const payload = createProfilePayload()
    const passphrase = 'My#Passphrase-For-Encryption'

    const saved = await profile.saveEncryptedProfile(payload, passphrase)

    expect(saved).toEqual({ ok: true })
    expect(profile.status.value).toBe('unlocked')
    expect(profile.hasEncryptedProfile.value).toBe(true)
    expect(profile.encryptedBlob.value?.schemaVersion).toBe('vision-face-profile-encrypted-v1')
    expect(profile.encryptedBlob.value?.kdf.iterations).toBe(100_000)
    expect(profile.encryptedBlob.value?.encryption.algorithm).toBe('AES-GCM')

    const storedRaw = localStorage.getItem(STORAGE_KEY)
    expect(storedRaw).not.toBeNull()
    expect(storedRaw).not.toContain('Alice Secret Name')
    expect(storedRaw).not.toContain('0.123456789')
    expect(storedRaw).not.toContain('My#Passphrase-For-Encryption')
  })

  it('unlocks with correct passphrase and rejects incorrect passphrase', async () => {
    const profile = useEncryptedFaceProfile({ pbkdf2Iterations: 100_000 })
    const payload = createProfilePayload()
    const passphrase = 'Correct-Passphrase'

    await profile.saveEncryptedProfile(payload, passphrase)
    profile.lockProfile()
    expect(profile.isUnlocked.value).toBe(false)
    expect(profile.lastSuccessfulPassphrase.value).toBe('')

    const wrong = await profile.unlockProfile('Wrong-Passphrase')
    expect(wrong.ok).toBe(false)
    expect(profile.isUnlocked.value).toBe(false)
    expect(profile.errorMessage.value).toBe('Unable to unlock local face profile.')

    const unlocked = await profile.unlockProfile(passphrase)
    expect(unlocked.ok).toBe(true)
    if (unlocked.ok) {
      expect(unlocked.profile.displayName).toBe('Alice Secret Name')
      expect(unlocked.profile.threshold).toBe(0.42)
      expect(unlocked.profile.samples).toHaveLength(2)
      expect(unlocked.profile.samples[0]?.descriptor).toEqual([0.123456789, -0.987654321, 0.456789123])
    }
    expect(profile.lastSuccessfulPassphrase.value).toBe(passphrase)
  })

  it('deletes encrypted blob and clears unlocked memory state', async () => {
    const profile = useEncryptedFaceProfile({ pbkdf2Iterations: 100_000 })
    const payload = createProfilePayload()

    await profile.saveEncryptedProfile(payload, 'Passphrase-Delete-Test')
    expect(profile.status.value).toBe('unlocked')
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    profile.deleteProfile()

    expect(profile.status.value).toBe('none')
    expect(profile.encryptedBlob.value).toBeNull()
    expect(profile.unlockedProfile.value).toBeNull()
    expect(profile.lastSuccessfulPassphrase.value).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('uses randomized salt/iv/ciphertext for repeated saves of same profile and passphrase', async () => {
    const profile = useEncryptedFaceProfile({ pbkdf2Iterations: 100_000 })
    const payload = createProfilePayload()
    const passphrase = 'Deterministic-Input-Randomized-Output'

    const first = await profile.saveEncryptedProfile(payload, passphrase)
    expect(first.ok).toBe(true)
    const firstBlob = profile.encryptedBlob.value
    if (!firstBlob)
      throw new Error('encrypted blob must exist after first save')

    const second = await profile.saveEncryptedProfile(payload, passphrase)
    expect(second.ok).toBe(true)
    const secondBlob = profile.encryptedBlob.value
    if (!secondBlob)
      throw new Error('encrypted blob must exist after second save')

    expect(secondBlob.salt).not.toBe(firstBlob.salt)
    expect(secondBlob.iv).not.toBe(firstBlob.iv)
    expect(secondBlob.encryptedData).not.toBe(firstBlob.encryptedData)
    expect(secondBlob.kdf.iterations).toBe(firstBlob.kdf.iterations)
    expect(secondBlob.encryption.tagLength).toBe(128)
  })
})
