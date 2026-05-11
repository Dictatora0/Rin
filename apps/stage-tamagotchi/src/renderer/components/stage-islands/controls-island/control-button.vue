<script setup lang="ts">
const props = defineProps<{ buttonStyle?: string }>()
</script>

<template>
  <button
    type="button"
    :class="[
      'border-2 border-solid border-neutral-200/60 dark:border-neutral-800/10',
      'bg-neutral-50/80 dark:bg-neutral-800/70',
      'h-10 w-10 shrink-0 flex items-center justify-center p-2 leading-none',
      '[&>*]:inline-flex [&>*]:items-center [&>*]:justify-center',
      'rounded-xl backdrop-blur-md',
      '[-webkit-app-region:no-drag] pointer-events-auto',
      'transition-all hover:transition-none transition-duration-300 transition-ease-out',
      props.buttonStyle,
    ]"
  >
    <slot />
  </button>
</template>
