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
  maxInferenceStallMs,
  lastInferenceAt,
  attachVideoElement,
  start,
  stop,
  setDisplayName,
  setMaxInferenceStallMs,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})

const displayNameInput = ref(displayName.value)
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
            Stored locally only. This is not face identity authentication.
          </span>
        </label>

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
          Display name is optional and stored locally.
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          This experiment does not perform face identity authentication.
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
