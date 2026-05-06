<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../composables/use-vision-interaction'

const router = useRouter()
const videoRef = ref<HTMLVideoElement | null>(null)

const {
  isEnabled,
  cameraState,
  errorMessage,
  displayName,
  gateEnabled,
  hasEncryptedProfile,
  localFaceGate,
  openCvFaceQuality,
  encryptedProfile,
  attachVideoElement,
  start,
  stop,
  setDisplayName,
  setFaceGateEnabled,
  enrollLocalFaceProfile,
  unlockFaceProfile,
  lockFaceProfile,
  deleteLocalFaceProfile,
} = useVisionInteraction()

const passphrase = ref('')
const confirmPassphrase = ref('')
const unlockPassphrase = ref('')
const enrolling = ref(false)
const unlocking = ref(false)
const displayNameInput = ref(displayName.value)

const thresholdInput = ref(localFaceGate.threshold.value.toFixed(2))
const qualityThresholdInput = ref(localFaceGate.qualityThreshold.value.toFixed(2))
const stableFramesInput = ref(String(localFaceGate.stableFrames.value))
const enrollSampleCountInput = ref('6')
const acceptedSamples = ref(0)
const rejectedSamples = ref(0)
const enrollmentMessage = ref('')

const profileStatus = computed(() => encryptedProfile.status.value)
const latestQuality = computed(() => openCvFaceQuality.latestQuality.value)
const openCvStatus = computed(() => openCvFaceQuality.status.value)
const openCvErrorMessage = computed(() => openCvFaceQuality.errorMessage.value)
const unlockedProfile = computed(() => encryptedProfile.unlockedProfile.value)
const qualityText = computed(() => {
  const q = latestQuality.value
  if (!q)
    return 'none'
  return `${q.qualityScore.toFixed(2)} (${q.accepted ? 'accepted' : q.reason ?? 'rejected'})`
})

watch(videoRef, element => attachVideoElement(element), { immediate: true })

watch(displayName, (value) => {
  if (value !== displayNameInput.value)
    displayNameInput.value = value
})
watch(displayNameInput, (value) => {
  if (value === displayName.value)
    return
  setDisplayName(value)
})

watch(() => localFaceGate.threshold.value, (value) => {
  thresholdInput.value = value.toFixed(2)
})
watch(() => localFaceGate.qualityThreshold.value, (value) => {
  qualityThresholdInput.value = value.toFixed(2)
})
watch(() => localFaceGate.stableFrames.value, (value) => {
  stableFramesInput.value = String(value)
})

watch(thresholdInput, (value) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setThreshold(parsed)
})
watch(qualityThresholdInput, (value) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setQualityThreshold(parsed)
})
watch(stableFramesInput, (value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setStableFrames(parsed)
})

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

async function runEnrollment() {
  enrolling.value = true
  enrollmentMessage.value = ''
  acceptedSamples.value = 0
  rejectedSamples.value = 0
  try {
    const sampleCount = Number.parseInt(enrollSampleCountInput.value, 10)
    const result = await enrollLocalFaceProfile({
      displayName: displayNameInput.value,
      passphrase: passphrase.value,
      confirmPassphrase: confirmPassphrase.value,
      threshold: localFaceGate.threshold.value,
      qualityThreshold: localFaceGate.qualityThreshold.value,
      stableFrames: localFaceGate.stableFrames.value,
      enrollSampleCount: sampleCount,
    })

    if (!result.ok) {
      enrollmentMessage.value = `Enrollment failed: ${result.reason}`
      toast.error(enrollmentMessage.value)
      return
    }

    acceptedSamples.value = result.captured
    enrollmentMessage.value = `Enrollment completed: ${result.captured}/${result.target} samples accepted.`
    toast.success('Face profile enrolled locally.')
    setFaceGateEnabled(true)
  }
  finally {
    enrolling.value = false
  }
}

async function runUnlock() {
  unlocking.value = true
  try {
    const result = await unlockFaceProfile(unlockPassphrase.value)
    if (!result.ok) {
      toast.error('Unable to unlock local face profile.')
      return
    }
    unlockPassphrase.value = ''
    toast.success('Face profile unlocked.')
  }
  finally {
    unlocking.value = false
  }
}

function runLock() {
  lockFaceProfile()
  toast.message('Face profile locked.')
}

function runDelete() {
  deleteLocalFaceProfile()
  toast.message('Local encrypted profile deleted.')
}

function backToStage() {
  void router.push('/')
}
</script>

<template>
  <div :class="['mx-auto max-w-4xl p-4 text-neutral-800 dark:text-neutral-100']">
    <div :class="['mb-4 flex items-center justify-between gap-2']">
      <div>
        <div :class="['text-2xl font-700']">
          Face Enrollment
        </div>
        <div :class="['text-sm text-neutral-500 dark:text-neutral-400']">
          Local encrypted face profile for Rin vision interaction gate.
        </div>
      </div>
      <Button size="sm" variant="ghost" @click="backToStage">
        Back to Stage
      </Button>
    </div>

    <div :class="['grid gap-3 md:grid-cols-2']">
      <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
        <div :class="['mb-2 text-sm font-700']">
          Camera Control
        </div>
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? 'Stop Camera' : 'Start Camera' }}
          </Button>
        </div>
        <div :class="['mt-2 text-xs']">
          <div>cameraState: {{ cameraState }}</div>
          <div v-if="errorMessage" :class="['text-rose-600 dark:text-rose-300']">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
        <div :class="['mb-2 text-sm font-700']">
          OpenCV Status
        </div>
        <div :class="['text-xs']">
          <div>opencv: {{ openCvStatus }}</div>
          <div>quality: {{ qualityText }}</div>
          <div>brightness: {{ latestQuality?.brightness?.toFixed(1) ?? 'n/a' }}</div>
          <div>sharpness: {{ latestQuality?.sharpness?.toFixed(1) ?? 'n/a' }}</div>
          <div>contrast: {{ latestQuality?.contrast?.toFixed(1) ?? 'n/a' }}</div>
          <div>faceSize: {{ latestQuality?.faceSize?.toFixed(2) ?? 'n/a' }}</div>
          <div v-if="openCvErrorMessage" :class="['text-amber-600 dark:text-amber-300']">
            {{ openCvErrorMessage }}
          </div>
        </div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        User Profile
      </div>
      <div :class="['grid gap-2 md:grid-cols-2']">
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>displayName</span>
          <input
            v-model="displayNameInput"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>passphrase / PIN</span>
          <input
            v-model="passphrase"
            type="password"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>confirm passphrase</span>
          <input
            v-model="confirmPassphrase"
            type="password"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>threshold</span>
          <input
            v-model="thresholdInput"
            inputmode="decimal"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>qualityThreshold</span>
          <input
            v-model="qualityThresholdInput"
            inputmode="decimal"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>enrollSampleCount</span>
          <input
            v-model="enrollSampleCountInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>stableFrames</span>
          <input
            v-model="stableFramesInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        Enrollment
      </div>
      <div :class="['flex flex-wrap items-center gap-2']">
        <Button size="sm" variant="primary" :disabled="enrolling || !isEnabled" @click="runEnrollment">
          {{ enrolling ? 'Enrolling...' : (hasEncryptedProfile ? 'Re-enroll Face' : 'Enroll Face') }}
        </Button>
      </div>
      <div :class="['mt-2 text-xs']">
        <div>accepted samples: {{ acceptedSamples }}</div>
        <div>rejected samples: {{ rejectedSamples }}</div>
        <div v-if="enrollmentMessage">
          {{ enrollmentMessage }}
        </div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        Encrypted Profile
      </div>
      <div :class="['text-xs']">
        <div>profile status: {{ profileStatus }}</div>
        <div>gate state: {{ localFaceGate.gateState }}</div>
        <div>samples count: {{ localFaceGate.profileSampleCount }}</div>
        <div v-if="unlockedProfile">
          displayName: {{ unlockedProfile.displayName }}
        </div>
        <div v-if="unlockedProfile">
          createdAt: {{ unlockedProfile.createdAt }}
        </div>
        <div v-if="unlockedProfile">
          updatedAt: {{ unlockedProfile.updatedAt }}
        </div>
      </div>
      <div :class="['mt-2 flex flex-wrap items-center gap-2']">
        <label :class="['flex items-center gap-1 text-xs']">
          <span>Enable Face Gate</span>
          <input
            :checked="gateEnabled"
            type="checkbox"
            @change="setFaceGateEnabled(($event.target as HTMLInputElement).checked)"
          >
        </label>
        <input
          v-if="profileStatus !== 'unlocked'"
          v-model="unlockPassphrase"
          type="password"
          placeholder="Unlock passphrase"
          :class="[
            'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
            'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
          ]"
        >
        <Button
          v-if="profileStatus !== 'unlocked'"
          size="sm"
          variant="secondary"
          :disabled="unlocking || !hasEncryptedProfile"
          @click="runUnlock"
        >
          {{ unlocking ? 'Unlocking...' : 'Unlock Profile' }}
        </Button>
        <Button v-if="profileStatus === 'unlocked'" size="sm" variant="secondary" @click="runLock">
          Lock Profile
        </Button>
        <Button size="sm" variant="ghost" :disabled="!hasEncryptedProfile" @click="runDelete">
          Delete Profile
        </Button>
      </div>
      <div v-if="encryptedProfile.errorMessage" :class="['mt-2 text-xs text-rose-600 dark:text-rose-300']">
        {{ encryptedProfile.errorMessage }}
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 text-xs shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div>Face profile is encrypted locally.</div>
      <div>No camera data is uploaded.</div>
      <div>Passphrase is not stored.</div>
      <div>Delete profile anytime.</div>
      <div>This gate is used only for Rin vision interaction.</div>
    </div>

    <video
      ref="videoRef"
      muted
      playsinline
      :class="['h-0 w-0 op-0 pointer-events-none']"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
