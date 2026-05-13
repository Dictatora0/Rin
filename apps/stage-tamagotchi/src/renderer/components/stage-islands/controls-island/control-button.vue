<script setup lang="ts">
const props = defineProps<{
  buttonStyle?: string
  label?: string
  showLabel?: boolean
  clickThroughProtected?: boolean
  controlButton?: boolean
}>()
</script>

<template>
  <button
    type="button"
    :data-click-through-protected="props.clickThroughProtected !== false ? 'true' : undefined"
    :data-control-button="props.controlButton !== false ? 'true' : undefined"
    :class="[
      'border-2 border-solid border-neutral-200/60 dark:border-neutral-800/10',
      'bg-neutral-50/80 dark:bg-neutral-800/70',
      'h-10 w-10 shrink-0 flex items-center justify-center p-2 leading-none',
      '[&>*]:inline-flex [&>*]:items-center [&>*]:justify-center',
      props.showLabel ? 'h-12 w-12 flex-col gap-0.5 px-1 py-1.5' : '',
      'rounded-xl backdrop-blur-md',
      '[-webkit-app-region:no-drag] pointer-events-auto',
      'transition-all hover:transition-none transition-duration-300 transition-ease-out',
      props.buttonStyle,
    ]"
  >
    <slot />
    <span
      v-if="props.showLabel && props.label"
      :class="[
        'max-w-full truncate text-center',
        'text-[9px] leading-none text-neutral-600 dark:text-neutral-300',
      ]"
    >
      {{ props.label }}
    </span>
  </button>
</template>
