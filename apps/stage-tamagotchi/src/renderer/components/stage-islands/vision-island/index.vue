<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'

const collapsed = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)

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
  displayName,
  localFaceGate,
  canTriggerInteractiveFeedback,
  maxInferenceStallMs,
  lastInferenceAt,
  attachVideoElement,
  start,
  stop,
  setDisplayName,
  setMaxInferenceStallMs,
  enrollLocalFaceProfile,
  deleteLocalFaceProfile,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})

const displayNameInput = ref(displayName.value)
const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
const faceGateThresholdInput = ref(localFaceGate.threshold.value.toFixed(2))
const isEnrollingFaceProfile = ref(false)

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

const gateDistanceText = computed(() => {
  if (localFaceGate.matchScore.value === null)
    return 'unknown'
  return localFaceGate.matchScore.value.toFixed(3)
})

const gateThresholdText = computed(() => localFaceGate.threshold.value.toFixed(2))

const sampleQualityText = computed(() => localFaceGate.lastSampleQuality.value.toFixed(1))

const enrollmentProgressPercent = computed(() => `${Math.round(localFaceGate.enrollmentProgress.value * 100)}%`)

watch(videoRef, (element) => {
  attachVideoElement(element)
}, { immediate: true })

watch(displayName, (value) => {
  if (value !== displayNameInput.value)
    displayNameInput.value = value
})

watch(displayNameInput, (value) => {
  if (value === displayName.value)
    return

  setDisplayName(value)
})

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

watch(() => localFaceGate.threshold.value, (value) => {
  const text = value.toFixed(2)
  if (text !== faceGateThresholdInput.value)
    faceGateThresholdInput.value = text
})

watch(faceGateThresholdInput, (value) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.updateThreshold(parsed)
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

async function enrollFaceProfile() {
  isEnrollingFaceProfile.value = true
  try {
    await enrollLocalFaceProfile()
  }
  finally {
    isEnrollingFaceProfile.value = false
  }
}

function toggleFaceGate() {
  localFaceGate.updateGateEnabled(!localFaceGate.gateEnabled.value)
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

        <Button
          size="sm"
          variant="ghost"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? 'Expand' : 'Collapse' }}
        </Button>
      </div>

      <div v-if="!collapsed" :class="['flex flex-col gap-2']">
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? 'Stop Camera' : 'Start Camera' }}
          </Button>
          <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
            Camera default: off
          </div>
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
          <div>subjectStatus: {{ localFaceGate.subjectStatus }}</div>
          <div>feedbackGate: {{ canTriggerInteractiveFeedback ? 'open' : 'gated' }}</div>
          <div>lastGesture: {{ lastGesture }}</div>
          <div>lastInference: {{ lastInferenceText }}</div>
          <div>quiet: {{ isVisionQuiet ? `active (${quietRemainingSeconds}s)` : 'inactive' }}</div>
          <div>localCelebrationCount: {{ localCelebrationCount }}</div>
          <div v-if="facePresence === 'absent'">
            Rin waiting
          </div>
          <div v-else-if="isVisionQuiet">
            Rin is quiet
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
          <span :class="['font-600 text-neutral-700 dark:text-neutral-200']">Display name (optional)</span>
          <input
            v-model="displayNameInput"
            maxlength="48"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
            placeholder="Your local nickname"
          >
          <span :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
            Stored locally only. Used for local face gate greeting and not for system authentication.
          </span>
        </label>

        <div :class="['flex flex-col gap-2 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            Local Face Gate
          </div>

          <div :class="['flex items-center gap-2']">
            <Button size="sm" :variant="localFaceGate.gateEnabled ? 'secondary' : 'primary'" @click="toggleFaceGate">
              {{ localFaceGate.gateEnabled ? 'Disable Face Gate' : 'Enable Face Gate' }}
            </Button>
            <div :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
              Optional local gate for Rin vision interactions
            </div>
          </div>

          <div>profileStatus: {{ localFaceGate.profileStatus }}</div>
          <div>gateState: {{ localFaceGate.gateState }}</div>
          <div>distance: {{ gateDistanceText }}</div>
          <div>threshold: {{ gateThresholdText }}</div>
          <div>samples: {{ localFaceGate.sampleCount }}</div>
          <div>qualityScore: {{ sampleQualityText }}</div>
          <div>enrollProgress: {{ enrollmentProgressPercent }}</div>

          <label :class="['flex flex-col gap-1']">
            <span :class="['text-[11px] text-neutral-600 dark:text-neutral-300']">Gate threshold</span>
            <input
              v-model="faceGateThresholdInput"
              inputmode="decimal"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
              placeholder="0.38"
            >
          </label>

          <div :class="['flex items-center gap-2']">
            <Button
              size="sm"
              variant="primary"
              :disabled="!isEnabled || isEnrollingFaceProfile"
              @click="enrollFaceProfile"
            >
              {{ isEnrollingFaceProfile ? 'Enrolling...' : (localFaceGate.hasProfile ? 'Re-enroll' : 'Enroll') }}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              :disabled="!localFaceGate.hasProfile"
              @click="deleteLocalFaceProfile"
            >
              Delete Profile
            </Button>
          </div>

          <div v-if="localFaceGate.profile.value?.displayName">
            enrolledName: {{ localFaceGate.profile.value.displayName }}
          </div>

          <div v-if="localFaceGate.errorMessage" :class="['text-rose-600 dark:text-rose-300']">
            {{ localFaceGate.errorMessage }}
          </div>

          <div v-if="localFaceGate.debugStatusText" :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
            {{ localFaceGate.debugStatusText }}
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
          <span :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
            Smaller value refreshes inference sooner when video frame-time stalls.
          </span>
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
          No photo or video is saved.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Face gate is optional.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Face data is stored locally on this device as feature vectors.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          No camera data is uploaded.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          You can delete the local face profile anytime.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          This gate is used only for Rin vision interactions.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Display name is optional and stored locally.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          This experiment is not a system login or security authentication.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Debug sample image saving is off by default.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          You can stop camera at any time.
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
