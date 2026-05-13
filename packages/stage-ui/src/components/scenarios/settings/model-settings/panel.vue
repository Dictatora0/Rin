<script setup lang="ts">
import type { DisplayModel } from '../../../../stores/display-models'
import type { ModelSettingsRuntimeSnapshot } from './runtime'

import { useLive2d } from '@proj-airi/stage-ui-live2d'
import { Button, Callout } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Godot from './godot.vue'
import Live2D from './live2d.vue'
import VRM from './vrm.vue'

import { DisplayModelFormat } from '../../../../stores/display-models'
import { useSettings } from '../../../../stores/settings'
import { ModelSelectorDialog } from '../../dialogs/model-selector'

const props = withDefaults(defineProps<{
  palette: string[]
  settingsClass?: string | string[]
  allowExtractColors?: boolean
  runtimeSnapshot: ModelSettingsRuntimeSnapshot
}>(), {
  allowExtractColors: true,
})

defineEmits<{
  (e: 'extractColorsFromModel'): void
}>()

const modelSelectorOpen = ref(false)
const { t } = useI18n()
const settingsStore = useSettings()
const { stageModelSelected, stageModelSelectedDisplayModel } = storeToRefs(settingsStore)

const currentSelectedDisplayModel = computed<DisplayModel | undefined>(() => stageModelSelectedDisplayModel.value)
const effectiveRenderer = computed(() => props.runtimeSnapshot.renderer)
const settingsClassList = computed(() => {
  if (!props.settingsClass)
    return []

  return typeof props.settingsClass === 'string' ? [props.settingsClass] : props.settingsClass
})

async function handleModelPick(selectedModel: DisplayModel | undefined) {
  stageModelSelected.value = selectedModel?.id ?? ''
  await settingsStore.updateStageModel()

  if (selectedModel?.format === DisplayModelFormat.Live2dZip)
    useLive2d().shouldUpdateView()
}
</script>

<template>
  <div
    :class="[
      'flex flex-col gap-2',
      'z-10 overflow-y-scroll p-2',
      ...settingsClassList,
    ]"
  >
    <Callout :label="t('settings.pages.models.panel.support_title')">
      <p>
        {{ t('settings.pages.models.panel.support_description_1') }}
      </p>
      <p>
        {{ t('settings.pages.models.panel.support_description_2') }}
      </p>
    </Callout>
    <div :class="['flex flex-wrap items-center gap-2']">
      <ModelSelectorDialog v-model:show="modelSelectorOpen" :selected-model="currentSelectedDisplayModel" @pick="handleModelPick">
        <Button variant="secondary">
          {{ t('settings.pages.models.panel.select_model') }}
        </Button>
      </ModelSelectorDialog>
      <slot name="actions" />
    </div>
    <Live2D
      v-if="effectiveRenderer === 'live2d'"
      :allow-extract-colors="allowExtractColors"
      :palette="palette"
      :runtime-snapshot="runtimeSnapshot"
      @extract-colors-from-model="$emit('extractColorsFromModel')"
    />
    <VRM
      v-if="effectiveRenderer === 'vrm'"
      :allow-extract-colors="allowExtractColors"
      :palette="palette"
      :runtime-snapshot="runtimeSnapshot"
      @extract-colors-from-model="$emit('extractColorsFromModel')"
    />
    <Godot
      v-if="effectiveRenderer === 'godot'"
      :runtime-snapshot="runtimeSnapshot"
    />
  </div>
</template>
