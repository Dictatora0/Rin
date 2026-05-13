<script setup lang="ts">
import type { ModelSettingsRuntimeSnapshot } from './runtime'

import { Callout } from '@proj-airi/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  runtimeSnapshot: ModelSettingsRuntimeSnapshot
}>()
const { t } = useI18n()

const statusText = computed(() => {
  if (props.runtimeSnapshot.phase === 'no-model')
    return t('settings.pages.models.godot.status.no_model')

  return t('settings.pages.models.godot.status.default')
})
</script>

<template>
  <Callout :label="t('settings.pages.models.godot.title')">
    <p>{{ statusText }}</p>
  </Callout>
</template>
