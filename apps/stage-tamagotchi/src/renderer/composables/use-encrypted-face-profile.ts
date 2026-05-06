import { errorMessageFrom } from '@moeru/std'
import { computed, ref } from 'vue'

export interface FaceSampleQuality {
  qualityScore: number
  brightness: number
  sharpness: number
  contrast: number
  faceSize: number
}

export interface VisionFaceProfileSample {
  descriptor: number[]
  quality: number
  brightness: number
  sharpness: number
  contrast: number
  faceSize: number
  capturedAt: string
}

export interface VisionFaceProfilePayload {
  schemaVersion: 'vision-face-profile-v1'
  id: string
  displayName: string
  createdAt: string
  updatedAt: string
  model: string
  descriptorVersion: string
  threshold: number
  qualityThreshold: number
  enrollSampleCount: number
  stableFrames: number
  samples: VisionFaceProfileSample[]
}

export interface EncryptedFaceProfileBlobV1 {
  schemaVersion: 'vision-face-profile-encrypted-v1'
  encryptedData: string
  salt: string
  iv: string
  kdf: {
    algorithm: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
  }
  encryption: {
    algorithm: 'AES-GCM'
    tagLength: number
  }
  createdAt: string
  updatedAt: string
}

export interface EncryptedFaceProfileOptions {
  pbkdf2Iterations?: number
}

const STORAGE_KEY = 'airi.vision-experiment.encrypted-face-profile.v1'
const DEFAULT_ITERATIONS = 150_000

/**
 * Manages encrypted local face profile persistence and unlock lifecycle.
 *
 * Use when:
 * - Face descriptors should only persist encrypted at rest
 * - The runtime needs lock/unlock and delete controls
 *
 * Expects:
 * - Browser/Electron renderer provides Web Crypto API
 * - Caller collects passphrase input from user each unlock session
 *
 * Returns:
 * - Encrypted blob metadata, unlock state, and save/load/delete actions
 */
export function useEncryptedFaceProfile(options?: EncryptedFaceProfileOptions) {
  const iterations = Math.max(100_000, Math.round(options?.pbkdf2Iterations ?? DEFAULT_ITERATIONS))
  const encryptedBlob = ref<EncryptedFaceProfileBlobV1 | null>(loadBlob())
  const unlockedProfile = ref<VisionFaceProfilePayload | null>(null)
  const errorMessage = ref('')
  const isUnlocking = ref(false)
  const isSaving = ref(false)

  const hasEncryptedProfile = computed(() => !!encryptedBlob.value)
  const isUnlocked = computed(() => !!unlockedProfile.value)
  const status = computed<'none' | 'encrypted' | 'unlocked'>(() => {
    if (!encryptedBlob.value)
      return 'none'
    return unlockedProfile.value ? 'unlocked' : 'encrypted'
  })

  function loadBlob() {
    if (typeof localStorage === 'undefined')
      return null

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw)
        return null
      const parsed = JSON.parse(raw) as EncryptedFaceProfileBlobV1
      if (!parsed?.encryptedData || !parsed?.salt || !parsed?.iv || !parsed?.kdf?.iterations)
        return null
      return parsed
    }
    catch {
      return null
    }
  }

  function persistBlob(blob: EncryptedFaceProfileBlobV1 | null) {
    if (typeof localStorage === 'undefined')
      return

    try {
      if (!blob)
        localStorage.removeItem(STORAGE_KEY)
      else
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
    }
    catch {
      // ignore persistence failure
    }
  }

  function clearError() {
    errorMessage.value = ''
  }

  async function saveEncryptedProfile(profile: VisionFaceProfilePayload, passphrase: string) {
    clearError()
    isSaving.value = true
    try {
      if (!passphrase.trim())
        throw new Error('Passphrase required')

      const nowIso = new Date().toISOString()
      const normalizedProfile: VisionFaceProfilePayload = {
        ...profile,
        schemaVersion: 'vision-face-profile-v1',
        updatedAt: nowIso,
      }

      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await deriveAesKeyFromPassphrase(passphrase, salt, iterations)
      const encodedProfile = new TextEncoder().encode(JSON.stringify(normalizedProfile))
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        encodedProfile,
      )

      const nextBlob: EncryptedFaceProfileBlobV1 = {
        schemaVersion: 'vision-face-profile-encrypted-v1',
        encryptedData: bytesToBase64(new Uint8Array(encrypted)),
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        kdf: {
          algorithm: 'PBKDF2',
          hash: 'SHA-256',
          iterations,
        },
        encryption: {
          algorithm: 'AES-GCM',
          tagLength: 128,
        },
        createdAt: encryptedBlob.value?.createdAt ?? nowIso,
        updatedAt: nowIso,
      }

      encryptedBlob.value = nextBlob
      unlockedProfile.value = normalizedProfile
      persistBlob(nextBlob)
      return { ok: true as const }
    }
    catch (error) {
      errorMessage.value = errorMessageFrom(error) ?? 'Failed to save encrypted profile.'
      return { ok: false as const, reason: errorMessage.value }
    }
    finally {
      isSaving.value = false
    }
  }

  async function unlockProfile(passphrase: string) {
    clearError()
    isUnlocking.value = true
    try {
      if (!encryptedBlob.value)
        throw new Error('No encrypted profile')
      if (!passphrase.trim())
        throw new Error('Passphrase required')

      const salt = base64ToBytes(encryptedBlob.value.salt)
      const iv = base64ToBytes(encryptedBlob.value.iv)
      const cipherBytes = base64ToBytes(encryptedBlob.value.encryptedData)
      const key = await deriveAesKeyFromPassphrase(passphrase, salt, encryptedBlob.value.kdf.iterations)
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: encryptedBlob.value.encryption.tagLength },
        key,
        cipherBytes,
      )
      const json = new TextDecoder().decode(new Uint8Array(decrypted))
      const parsed = JSON.parse(json) as VisionFaceProfilePayload
      if (!parsed || !Array.isArray(parsed.samples))
        throw new Error('Invalid profile payload')

      unlockedProfile.value = parsed
      return { ok: true as const, profile: parsed }
    }
    catch {
      errorMessage.value = 'Unable to unlock local face profile.'
      unlockedProfile.value = null
      return { ok: false as const, reason: errorMessage.value }
    }
    finally {
      isUnlocking.value = false
    }
  }

  function lockProfile() {
    unlockedProfile.value = null
  }

  function deleteProfile() {
    encryptedBlob.value = null
    unlockedProfile.value = null
    clearError()
    persistBlob(null)
  }

  return {
    encryptedBlob,
    unlockedProfile,
    hasEncryptedProfile,
    isUnlocked,
    status,
    errorMessage,
    isUnlocking,
    isSaving,
    saveEncryptedProfile,
    unlockProfile,
    lockProfile,
    deleteProfile,
    clearError,
  }
}

async function deriveAesKeyFromPassphrase(passphrase: string, salt: Uint8Array, iterations: number) {
  const encoded = new TextEncoder().encode(passphrase)
  const normalizedSalt = new Uint8Array(salt)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoded,
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: normalizedSalt.buffer,
      iterations,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes)
    binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1)
    bytes[i] = binary.charCodeAt(i)
  return bytes
}
