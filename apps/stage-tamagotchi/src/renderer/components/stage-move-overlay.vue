<script setup lang="ts">
const props = defineProps<{
  enabled: boolean
  isLinux: boolean
  hint: string
}>()

const emit = defineEmits<{
  (event: 'startDrag'): void
}>()

function handleDragMouseDown() {
  if (!props.isLinux) {
    emit('startDrag')
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-250"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-250"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="enabled"
      data-testid="stage-move-overlay"
      :class="[
        'absolute left-0 top-0 z-40 h-full w-full',
        'pointer-events-none flex items-center justify-center',
      ]"
    >
      <div
        data-testid="stage-move-overlay-panel"
        :class="[
          'h-[60%] w-[76%] max-h-96 max-w-96 rounded-xl',
          'pointer-events-auto cursor-grab select-none',
          'border border-primary-300/70 bg-white/60 backdrop-blur-md',
          'dark:border-primary-500/50 dark:bg-neutral-950/55',
          props.isLinux ? 'drag-region' : '',
        ]"
        @mousedown="handleDragMouseDown"
      >
        <div
          :class="[
            'h-full w-full flex items-center justify-center rounded-xl',
            'animate-flash animate-duration-5s animate-count-infinite',
            'text-center text-3.5 text-primary-700 dark:text-primary-300',
            props.isLinux ? 'drag-region' : '',
          ]"
        >
          {{ hint }}
        </div>
      </div>
    </div>
  </Transition>
</template>
