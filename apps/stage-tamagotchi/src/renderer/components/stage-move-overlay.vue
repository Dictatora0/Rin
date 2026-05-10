<script setup lang="ts">
const props = withDefaults(defineProps<{
  enabled: boolean
  isLinux: boolean
  debug?: boolean
}>(), {
  debug: false,
})

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
      data-control-layer="move-overlay"
      :class="[
        'stage-move-overlay',
        'absolute left-0 top-0 z-30 h-full w-full pointer-events-none',
      ]"
    >
      <div
        data-testid="stage-move-hit-area"
        :class="[
          'stage-move-hit-area',
          'absolute pointer-events-auto cursor-move select-none',
          props.debug ? 'stage-move-hit-area-debug' : '',
          props.isLinux ? 'drag-region' : '',
        ]"
        @mousedown="handleDragMouseDown"
      />
    </div>
  </Transition>
</template>

<style scoped>
.stage-move-overlay {
  --stage-move-hit-area-width: min(70vw, 420px);
  --stage-move-hit-area-height: min(72vh, 560px);
  --stage-move-hit-area-offset-y: -42%;
  --stage-move-hit-area-right-safe: 112px;
}

.stage-move-hit-area {
  top: 50%;
  left: calc(50% - 24px);
  transform: translate(-50%, var(--stage-move-hit-area-offset-y));
  width: var(--stage-move-hit-area-width);
  height: var(--stage-move-hit-area-height);
  max-width: calc(100% - var(--stage-move-hit-area-right-safe));
  max-height: calc(100% - 72px);
  min-height: 220px;
}

.stage-move-hit-area-debug {
  border-radius: 12px;
  outline: 1px dashed rgb(56 189 248 / 45%);
  background: rgb(56 189 248 / 6%);
}
</style>
