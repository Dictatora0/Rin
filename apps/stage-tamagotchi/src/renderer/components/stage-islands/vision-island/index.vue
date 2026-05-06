<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'

const collapsed = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)

const {
  isEnabled,
  cameraState,
  facePresence,
  lastGesture,
  lastEvent,
  errorMessage,
  attachVideoElement,
  start,
  stop,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})

watch(videoRef, (element) => {
  attachVideoElement(element)
}, { immediate: true })

watch(lastEvent, (event) => {
  if (!event)
    return

  toast.message(event.message)
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
        'w-72 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
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
          <div>camera: {{ cameraState }}</div>
          <div>facePresence: {{ facePresence }}</div>
          <div>lastGesture: {{ lastGesture }}</div>
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

        <div v-if="errorMessage" :class="['rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/35 dark:text-rose-300']">
          {{ errorMessage }}
        </div>

        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          Local only. No photo or video is saved.
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
