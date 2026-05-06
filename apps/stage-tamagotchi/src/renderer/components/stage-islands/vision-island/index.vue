<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'

const collapsed = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)
const unlockPassphrase = ref('')
const unlocking = ref(false)

const router = useRouter()

const {
  isEnabled,
  cameraState,
  facePresence,
  faceCenter,
  faceDirection,
  lastGesture,
  lastEvent,
  errorMessage,
  quietRemainingMs,
  isVisionQuiet,
  localCelebrationCount,
  activePrompt,
  matchedDisplayName,
  gateEnabled,
  hasEncryptedProfile,
  isProfileUnlocked,
  profileStatus,
  localFaceGate,
  canTriggerInteractiveFeedback,
  maxInferenceStallMs,
  lastInferenceAt,
  attachVideoElement,
  start,
  stop,
  setFaceGateEnabled,
  setMaxInferenceStallMs,
  unlockFaceProfile,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})

const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
const quietRemainingSeconds = computed(() => Math.ceil(quietRemainingMs.value / 1000))

const faceCenterText = computed(() => {
  if (!faceCenter.value)
    return 'unknown'
  return `x=${faceCenter.value.x.toFixed(2)}, y=${faceCenter.value.y.toFixed(2)}`
})

const lastInferenceText = computed(() => {
  if (!lastInferenceAt.value)
    return 'none'
  return new Date(lastInferenceAt.value).toLocaleTimeString()
})

const profileHint = computed(() => {
  if (!hasEncryptedProfile.value)
    return 'none'
  if (isProfileUnlocked.value)
    return 'unlocked'
  return 'encrypted'
})

watch(videoRef, element => attachVideoElement(element), { immediate: true })

watch(maxInferenceStallMs, (value) => {
  const text = String(value)
  if (text !== maxInferenceStallInput.value)
    maxInferenceStallInput.value = text
})

watch(maxInferenceStallInput, (value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed))
    return
  setMaxInferenceStallMs(parsed)
})

watch(lastEvent, (event) => {
  if (!event)
    return
  if (event.toastMessage)
    toast.message(event.toastMessage)
})

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

function toggleGate() {
  setFaceGateEnabled(!gateEnabled.value)
}

function openEnrollmentPage() {
  void router.push('/vision-enrollment')
}

async function unlockProfile() {
  if (!unlockPassphrase.value.trim())
    return
  unlocking.value = true
  try {
    const result = await unlockFaceProfile(unlockPassphrase.value)
    if (result.ok)
      unlockPassphrase.value = ''
  }
  finally {
    unlocking.value = false
  }
}
</script>

<template>
  <div fixed left-3 top-14 z-20>
    <div
      :class="[
        'w-80 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
        'dark:border-neutral-700/70 dark:bg-neutral-900/80',
      ]"
    >
      <div :class="['mb-2 flex items-center justify-between gap-2']">
        <div :class="['text-sm font-700 text-neutral-800 dark:text-neutral-100']">
          Vision Experiment
        </div>
        <Button size="sm" variant="ghost" @click="collapsed = !collapsed">
          {{ collapsed ? 'Expand' : 'Collapse' }}
        </Button>
      </div>

      <div v-if="!collapsed" :class="['flex flex-col gap-2']">
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? 'Stop Camera' : 'Start Camera' }}
          </Button>
          <Button size="sm" variant="ghost" @click="openEnrollmentPage">
            Open Face Enrollment
          </Button>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            Gesture mapping
          </div>
          <div>Open Palm: quiet Rin temporarily</div>
          <div>Victory: celebrate a completed moment</div>
          <div>Thumbs Up: acknowledge current prompt</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div>camera: {{ cameraState }}</div>
          <div>facePresence: {{ facePresence }}</div>
          <div>faceDirection: {{ faceDirection }}</div>
          <div>faceCenter: {{ faceCenterText }}</div>
          <div>lastGesture: {{ lastGesture }}</div>
          <div>lastInference: {{ lastInferenceText }}</div>
          <div>quiet: {{ isVisionQuiet ? `active (${quietRemainingSeconds}s)` : 'inactive' }}</div>
          <div>localCelebrationCount: {{ localCelebrationCount }}</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            Local Face Gate
          </div>
          <div>profile: {{ profileHint }}</div>
          <div>gateEnabled: {{ gateEnabled ? 'yes' : 'no' }}</div>
          <div>gateState: {{ localFaceGate.gateState }}</div>
          <div>matchStatus: {{ profileStatus }}</div>
          <div>distance: {{ localFaceGate.matchScore ?? 'unknown' }}</div>
          <div>interactionGate: {{ canTriggerInteractiveFeedback ? 'open' : 'gated/locked' }}</div>
          <div v-if="matchedDisplayName">
            matchedUser: {{ matchedDisplayName }}
          </div>
          <div v-if="gateEnabled && hasEncryptedProfile && !isProfileUnlocked" :class="['mt-1 text-amber-600 dark:text-amber-300']">
            Face profile locked. Unlock to enable gated interactions.
          </div>
          <div :class="['mt-2 flex items-center gap-2']">
            <Button size="sm" :variant="gateEnabled ? 'secondary' : 'primary'" @click="toggleGate">
              {{ gateEnabled ? 'Disable Face Gate' : 'Enable Face Gate' }}
            </Button>
          </div>
          <div v-if="hasEncryptedProfile && !isProfileUnlocked" :class="['mt-2 flex flex-col gap-1']">
            <input
              v-model="unlockPassphrase"
              type="password"
              placeholder="Passphrase to unlock"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
            >
            <Button size="sm" variant="primary" :disabled="unlocking" @click="unlockProfile">
              {{ unlocking ? 'Unlocking...' : 'Unlock Profile' }}
            </Button>
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            Last event
          </div>
          <div v-if="lastEvent">
            {{ lastEvent.message }} ({{ new Date(lastEvent.at).toLocaleTimeString() }})
          </div>
          <div v-else>
            none
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            Current prompt
          </div>
          <div v-if="activePrompt">
            {{ activePrompt }}
          </div>
          <div v-else>
            none
          </div>
        </div>

        <label :class="['flex flex-col gap-1 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <span :class="['font-600 text-neutral-700 dark:text-neutral-200']">Inference stall fallback (ms)</span>
          <input
            v-model="maxInferenceStallInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
            placeholder="1200"
          >
        </label>

        <div v-if="errorMessage" :class="['rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/35 dark:text-rose-300']">
          {{ errorMessage }}
        </div>

        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Camera is off by default.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Recognition runs locally.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Face gate is optional and uses encrypted local profile.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          No camera data is uploaded.
        </div>

        <video
          ref="videoRef"
          muted
          playsinline
          :class="['h-0 w-0 op-0 pointer-events-none']"
        />
      </div>
    </div>
  </div>
</template>
