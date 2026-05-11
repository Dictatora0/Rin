<script setup lang="ts">
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'

const { side = 'left', triggerClass = '' } = defineProps<{
  side?: 'top' | 'right' | 'bottom' | 'left'
  triggerClass?: string
}>()
</script>

<template>
  <TooltipProvider
    :delay-duration="0"
    :skip-delay-duration="0"
  >
    <TooltipRoot>
      <TooltipTrigger as-child>
        <span
          data-testid="controls-button-wrapper"
          data-controls-button-wrapper
          :class="[
            'relative z-0 inline-flex items-center justify-center focus-within:z-20 hover:z-20',
            triggerClass,
          ]"
        >
          <slot />
        </span>
      </TooltipTrigger>
      <Transition name="fade">
        <TooltipContent
          data-testid="controls-tooltip"
          data-controls-tooltip
          :class="[
            'border-1 border-solid border-neutral-200/60 dark:border-neutral-800/10',
            'bg-neutral-50/80 dark:bg-neutral-800/70',
            'w-fit flex items-center self-end justify-center px-1.5 py-1',
            'rounded-lg backdrop-blur-md',
            'text-xs whitespace-nowrap',
            'z-[240] pointer-events-none',
          ]"
          :side="side"
          :side-offset="6"
        >
          <slot name="tooltip" />
        </TooltipContent>
      </Transition>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
