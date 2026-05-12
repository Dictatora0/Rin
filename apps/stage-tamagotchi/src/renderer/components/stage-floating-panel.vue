<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  panelKind: 'study' | 'vision'
}>(), {})

const emit = defineEmits<{
  close: []
}>()

const panelWidthClass = computed(() => {
  if (props.panelKind === 'study')
    return 'w-[clamp(23.75rem,34vw,27.5rem)]'
  return 'w-[clamp(27.5rem,44vw,35rem)]'
})

const panelStyle = computed(() => ({
  maxWidth: 'calc(100vw - 32px)',
}))

const contentStyle = computed(() => ({
  maxHeight: 'min(80vh, 720px)',
}))

const panelCardClasses = computed(() => {
  if (props.panelKind === 'study') {
    return [
      'min-h-0 flex flex-col',
      'rounded-2xl border border-neutral-200 p-3',
      'bg-neutral-100 shadow-2xl',
      'dark:border-neutral-700 dark:bg-neutral-950',
    ]
  }

  return [
    'min-h-0 flex flex-col',
    'rounded-2xl border border-neutral-200/70 p-3',
    'bg-white/92 shadow-2xl backdrop-blur-md',
    'dark:border-neutral-700/70 dark:bg-neutral-900/88',
  ]
})
</script>

<template>
  <section
    data-testid="stage-floating-panel"
    :data-panel-kind="panelKind"
    :class="[
      'stage-floating-panel',
      'fixed right-4 top-16 z-[185] sm:right-20',
      'pointer-events-auto [-webkit-app-region:no-drag]',
      panelWidthClass,
    ]"
    :style="panelStyle"
  >
    <div
      :class="panelCardClasses"
      :style="contentStyle"
    >
      <header :class="['mb-2 flex items-center justify-between gap-2']">
        <h2 :class="['text-sm font-semibold text-neutral-800 dark:text-neutral-100']">
          {{ title }}
        </h2>
        <button
          data-testid="stage-floating-panel-close-button"
          type="button"
          :class="[
            'rounded-md px-2 py-1 text-xs',
            'bg-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-300',
            'dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
          ]"
          :title="`关闭${title}`"
          :aria-label="`关闭${title}`"
          @click="emit('close')"
        >
          关闭
        </button>
      </header>
      <div
        data-testid="stage-floating-panel-content"
        :class="[
          'min-h-0 flex-1 overflow-y-auto overscroll-contain',
          'pr-1',
        ]"
      >
        <slot />
      </div>
    </div>
  </section>
</template>
