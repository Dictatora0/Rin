<script setup lang="ts">
import type { StudyBubbleMessage } from '../../../composables/use-study-companion-bubble'

import { computed } from 'vue'

const props = defineProps<{
  message: StudyBubbleMessage | null
}>()

const bubbleToneClass = computed(() => {
  if (!props.message)
    return ''

  if (props.message.kind === 'focus') {
    return 'border-rose-200/70 bg-rose-50/85 text-rose-800 dark:border-rose-400/30 dark:bg-rose-950/45 dark:text-rose-100'
  }
  if (props.message.kind === 'break') {
    return 'border-emerald-200/70 bg-emerald-50/85 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/45 dark:text-emerald-100'
  }
  if (props.message.kind === 'task') {
    return 'border-sky-200/70 bg-sky-50/85 text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/45 dark:text-sky-100'
  }
  if (props.message.kind === 'quiet') {
    return 'border-amber-200/70 bg-amber-50/85 text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/45 dark:text-amber-100'
  }

  return 'border-neutral-200/70 bg-white/85 text-neutral-800 dark:border-neutral-500/40 dark:bg-neutral-900/75 dark:text-neutral-100'
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-220 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-98"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-180 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-1 scale-98"
  >
    <div
      v-if="message"
      :class="[
        'pointer-events-none absolute left-4 bottom-24 z-40',
        'max-w-[min(72vw,20rem)]',
      ]"
    >
      <div
        :class="[
          'relative rounded-xl border px-3 py-2 text-xs leading-5 shadow-lg backdrop-blur-md',
          bubbleToneClass,
        ]"
      >
        <p>{{ message.text }}</p>
        <span
          :class="[
            'absolute -bottom-1.5 left-6 size-3 rotate-45 border-b border-r',
            'bg-inherit border-inherit',
          ]"
        />
      </div>
    </div>
  </Transition>
</template>
