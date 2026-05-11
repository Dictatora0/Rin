<script setup lang="ts">
import type { StageWindowSizeAction } from './window-size'

import { defineInvoke } from '@moeru/eventa'
import { useElectronEventaContext, useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
import { useTheme } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import StudyIsland from '../study-island/index.vue'
import VisionIsland from '../vision-island/index.vue'
import ControlButtonTooltip from './control-button-tooltip.vue'
import ControlButton from './control-button.vue'
import ControlsIslandAuthButton from './controls-island-auth-button.vue'
import ControlsIslandFadeOnHover from './controls-island-fade-on-hover.vue'
import ControlsIslandHearingConfig from './controls-island-hearing-config.vue'
import ControlsIslandProfilePicker from './controls-island-profile-picker.vue'
import IndicatorMicVolume from './indicator-mic-volume.vue'

import {
  electron,
  electronAppQuit,
  electronOpenChat,
  electronOpenSettings,
  electronStartDraggingWindow,
  electronWindowSetAlwaysOnTop,
} from '../../../../shared/eventa'
import { useControlsIslandStore } from '../../../stores/controls-island'
import { calculateStageWindowBoundsForAction } from './window-size'

const { isDark, toggleDark } = useTheme()
const { t } = useI18n()

const settingsAudioDeviceStore = useSettingsAudioDevice()
const settingsStore = useSettings()
const controlsIslandStore = useControlsIslandStore()
const context = useElectronEventaContext()
const { enabled } = storeToRefs(settingsAudioDeviceStore)
const { alwaysOnTop, controlsIslandIconSize } = storeToRefs(settingsStore)
const { moveModeEnabled, controlsPanelExpanded, controlsUIMode } = storeToRefs(controlsIslandStore)
const openSettings = useElectronEventaInvoke(electronOpenSettings)
const openChat = useElectronEventaInvoke(electronOpenChat)
const isLinux = useElectronEventaInvoke(electron.app.isLinux)
const closeWindow = useElectronEventaInvoke(electronAppQuit)
const setAlwaysOnTop = useElectronEventaInvoke(electronWindowSetAlwaysOnTop)
const getWindowBounds = useElectronEventaInvoke(electron.window.getBounds)
const setWindowBounds = useElectronEventaInvoke(electron.window.setBounds)
const getPrimaryDisplay = useElectronEventaInvoke(electron.screen.getPrimaryDisplay)

const visionPanelVisible = ref(false)
const studyPanelExpanded = ref(false)
const studyPanelInteractionLocked = ref(false)
const shortcutsCardExpanded = ref(false)
const controlsPanelScrollElement = ref<HTMLElement | null>(null)
const visionPanelElement = ref<HTMLElement | null>(null)

// Tracks open overlays/dialogs that should prevent auto-collapse (e.g. 'hearing', 'profile-picker')
const blockingOverlays = reactive(new Set<string>())

const panelToggleLabel = computed(() => controlsPanelExpanded.value
  ? t('tamagotchi.stage.controls-island.collapse')
  : t('tamagotchi.stage.controls-island.expand'))
const controlsUIModeLabel = computed(() => controlsUIMode.value === 'novice'
  ? t('tamagotchi.stage.controls-island.ui-mode.novice')
  : t('tamagotchi.stage.controls-island.ui-mode.expert'))
const controlsUIModeToggleLabel = computed(() => controlsUIMode.value === 'novice'
  ? t('tamagotchi.stage.controls-island.ui-mode.switch-to-expert')
  : t('tamagotchi.stage.controls-island.ui-mode.switch-to-novice'))
const shortcutsToggleLabel = computed(() => shortcutsCardExpanded.value
  ? t('tamagotchi.stage.controls-island.shortcuts.toggle-close')
  : t('tamagotchi.stage.controls-island.shortcuts.toggle-open'))
const isNoviceMode = computed(() => controlsUIMode.value === 'novice')
const moveModeControlLabel = computed(() => moveModeEnabled.value
  ? t('tamagotchi.stage.controls-island.move-mode.disable')
  : t('tamagotchi.stage.controls-island.move-mode.enable'))
const studyPanelToggleLabel = computed(() => studyPanelExpanded.value
  ? t('tamagotchi.stage.controls-island.study-panel.collapse')
  : t('tamagotchi.stage.controls-island.study-panel.expand'))
const visionPanelToggleLabel = computed(() => visionPanelVisible.value
  ? t('tamagotchi.stage.controls-island.vision-panel.collapse')
  : t('tamagotchi.stage.controls-island.vision-panel.expand'))

function setOverlay(key: string, active: boolean) {
  if (active)
    blockingOverlays.add(key)
  else
    blockingOverlays.delete(key)
}

// Expose for parent (e.g. to disable click-through when a dialog is open)
defineExpose({
  get hearingDialogOpen() { return blockingOverlays.has('hearing') },
  set hearingDialogOpen(v: boolean) { setOverlay('hearing', v) },
  get studyPanelPinned() { return studyPanelExpanded.value || studyPanelInteractionLocked.value },
  get studyPanelInputActive() { return studyPanelInteractionLocked.value },
})

watch(controlsPanelExpanded, (isExpanded) => {
  if (isExpanded && visionPanelVisible.value) {
    void scrollVisionPanelIntoView()
    return
  }

  if (!isExpanded) {
    const keepVisionPanelOverlay = visionPanelVisible.value
    blockingOverlays.clear()
    if (keepVisionPanelOverlay)
      blockingOverlays.add('vision-panel')
    studyPanelExpanded.value = false
    studyPanelInteractionLocked.value = false
    shortcutsCardExpanded.value = false
  }
})

watch(visionPanelVisible, (visible) => {
  setOverlay('vision-panel', visible)
  if (visible)
    void scrollVisionPanelIntoView()
})

// Apply alwaysOnTop on mount and when it changes
watch(alwaysOnTop, (val) => {
  setAlwaysOnTop(val)
}, { immediate: true })

function toggleAlwaysOnTop() {
  alwaysOnTop.value = !alwaysOnTop.value
}

// Grouped classes for icon / border / padding and combined style class
const adjustStyleClasses = computed(() => {
  let isLarge: boolean

  // Determine size based on setting
  switch (controlsIslandIconSize.value) {
    case 'large':
      isLarge = true
      break
    case 'small':
      isLarge = false
      break
    case 'auto':
    default:
      // Fixed to large for better visibility in the new layout,
      // can be changed to windowHeight based check if absolutely needed.
      isLarge = true
      break
  }

  const icon = isLarge ? 'size-5' : 'size-3'
  const border = isLarge ? 'border-2' : 'border-0'
  const padding = isLarge ? 'p-2' : 'p-0.5'
  return { icon, border, padding, button: `${border} ${padding}` }
})

/**
 * This is a know issue (or expected behavior maybe) to Electron.
 * We don't use this approach on Linux because it's not working.
 *
 * See `apps/stage-tamagotchi/src/main/windows/main/index.ts` for handler definition
 */
const startDraggingWindow = !isLinux() ? defineInvoke(context.value, electronStartDraggingWindow) : undefined

function refreshWindow() {
  window.location.reload()
}

function handleStudyPanelInteractionLock(locked: boolean) {
  studyPanelInteractionLocked.value = locked
}

function toggleStudyPanel() {
  studyPanelExpanded.value = !studyPanelExpanded.value
}

function closeStudyPanel() {
  studyPanelExpanded.value = false
  studyPanelInteractionLocked.value = false
}

function toggleVisionPanel() {
  visionPanelVisible.value = !visionPanelVisible.value
}

async function scrollVisionPanelIntoView() {
  await nextTick()
  const panelSection = visionPanelElement.value
  const scrollContainer = controlsPanelScrollElement.value
  if (!panelSection || !scrollContainer)
    return

  if (typeof panelSection.scrollIntoView === 'function') {
    panelSection.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
    return
  }

  scrollContainer.scrollTop = scrollContainer.scrollHeight
}

function toggleMoveMode() {
  controlsIslandStore.toggleMoveMode()
}

function toggleControlsUIMode() {
  controlsIslandStore.toggleControlsUIMode()
}

function toggleShortcutsCard() {
  shortcutsCardExpanded.value = !shortcutsCardExpanded.value
}

async function resizeWindowByAction(action: StageWindowSizeAction) {
  try {
    const [currentBounds, primaryDisplay] = await Promise.all([
      getWindowBounds(),
      getPrimaryDisplay(),
    ])

    if (!currentBounds || !primaryDisplay?.workArea) {
      return
    }

    const nextBounds = calculateStageWindowBoundsForAction({
      action,
      currentBounds,
      workArea: primaryDisplay.workArea,
    })

    await setWindowBounds([nextBounds])
  }
  catch (error) {
    console.warn('[ControlsIsland] Failed to apply window resize action:', error)
  }
}
</script>

<template>
  <div
    data-testid="controls-island-root"
    data-control-layer="controls-island"
    class="controls-island-root [-webkit-app-region:no-drag] pointer-events-auto z-120"
    fixed inset-y-2 right-2
  >
    <div class="h-full min-h-0 flex flex-col items-end justify-end gap-1.5">
      <!-- iOS Style Drawer Panel -->
      <Transition
        enter-active-class="transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
        leave-active-class="transition-all duration-400 cubic-bezier(0.32, 0.72, 0, 1)"
        enter-from-class="opacity-0 translate-y-8 scale-90 blur-sm"
        leave-to-class="opacity-0 translate-y-8 scale-90 blur-sm"
      >
        <div
          v-show="controlsPanelExpanded"
          data-testid="controls-panel-viewport"
          class="mb-2 max-w-[76vw] min-h-0 w-[18.5rem] flex flex-1 items-end self-end"
        >
          <div
            ref="controlsPanelScrollElement"
            data-testid="controls-panel"
            data-controls-panel-scroll
            :class="[
              'w-full border border-neutral-200/70 rounded-2xl p-3',
              'bg-neutral-100/82 shadow-2xl shadow-black/20 backdrop-blur-xl',
              'dark:border-neutral-800/70 dark:bg-neutral-900/82',
              'min-h-0 max-h-full overflow-y-auto overscroll-contain',
              'flex flex-col gap-3',
            ]"
          >
            <section
              data-testid="controls-auth-section"
              :class="[
                'w-full border-b border-neutral-200/70 pb-2',
                'dark:border-neutral-700/70',
              ]"
            >
              <ControlsIslandAuthButton
                button-style="w-full justify-start [-webkit-app-region:no-drag] pointer-events-auto"
                :icon-class="adjustStyleClasses.icon"
              />
            </section>

            <section data-testid="controls-group-core" :class="['w-full flex flex-col gap-2']">
              <header
                data-testid="controls-group-title-core"
                :class="[
                  'text-[10px] font-semibold tracking-[0.08em] uppercase',
                  'text-neutral-500 dark:text-neutral-400',
                ]"
              >
                {{ t('tamagotchi.stage.controls-island.groups.core') }}
              </header>
              <div data-testid="controls-core-grid" class="controls-button-grid grid grid-cols-3 gap-2">
                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-open-settings"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.settings')"
                    :aria-label="t('tamagotchi.stage.controls-island.open-settings')"
                    :title="t('tamagotchi.stage.controls-island.open-settings')"
                    @click="openSettings({ route: '/settings' })"
                  >
                    <div i-solar:settings-minimalistic-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.open-settings') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlsIslandProfilePicker placement="up" :open="blockingOverlays.has('profile-picker')" @update:open="setOverlay('profile-picker', $event)">
                    <template #default="{ toggle }">
                      <ControlButton
                        data-testid="controls-profile-picker"
                        class="controls-button"
                        :button-style="adjustStyleClasses.button"
                        :show-label="isNoviceMode"
                        :label="t('tamagotchi.stage.controls-island.labels.profile')"
                        :aria-label="t('tamagotchi.stage.controls-island.switch-profile')"
                        :title="t('tamagotchi.stage.controls-island.switch-profile')"
                        @click="toggle"
                      >
                        <div i-solar:emoji-funny-square-broken :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                      </ControlButton>
                    </template>
                  </ControlsIslandProfilePicker>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.switch-profile') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-open-chat"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.chat')"
                    :aria-label="t('tamagotchi.stage.controls-island.open-chat')"
                    :title="t('tamagotchi.stage.controls-island.open-chat')"
                    @click="openChat"
                  >
                    <div i-solar:chat-line-line-duotone :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.open-chat') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-refresh-window"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.refresh')"
                    :aria-label="t('tamagotchi.stage.controls-island.refresh')"
                    :title="t('tamagotchi.stage.controls-island.refresh')"
                    @click="refreshWindow"
                  >
                    <div i-solar:refresh-linear :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.refresh') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-theme-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.appearance')"
                    :aria-label="isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode')"
                    :title="isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode')"
                    @click="toggleDark()"
                  >
                    <Transition name="fade" mode="out-in">
                      <div v-if="isDark" i-solar:moon-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                      <div v-else i-solar:sun-2-outline :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                    </Transition>
                  </ControlButton>
                  <template #tooltip>
                    {{ isDark ? t('tamagotchi.stage.controls-island.switch-to-light-mode') : t('tamagotchi.stage.controls-island.switch-to-dark-mode') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-always-on-top-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.pin')"
                    :aria-label="alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top')"
                    :title="alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top')"
                    @click="toggleAlwaysOnTop()"
                  >
                    <div v-if="alwaysOnTop" i-solar:pin-bold :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                    <div v-else i-solar:pin-linear :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300 opacity-50" />
                  </ControlButton>
                  <template #tooltip>
                    {{ alwaysOnTop ? t('tamagotchi.stage.controls-island.unpin-from-top') : t('tamagotchi.stage.controls-island.pin-on-top') }}
                  </template>
                </ControlButtonTooltip>
              </div>
            </section>

            <section
              data-testid="controls-group-tools"
              :class="[
                'w-full flex flex-col gap-2 border-t border-neutral-200/70 pt-2',
                'dark:border-neutral-700/70',
              ]"
            >
              <header
                data-testid="controls-group-title-tools"
                :class="[
                  'text-[10px] font-semibold tracking-[0.08em] uppercase',
                  'text-neutral-500 dark:text-neutral-400',
                ]"
              >
                {{ t('tamagotchi.stage.controls-island.groups.tools') }}
              </header>
              <div data-testid="controls-tools-grid" class="controls-button-grid grid grid-cols-3 gap-2">
                <ControlsIslandFadeOnHover
                  data-testid="controls-fade-toggle"
                  :icon-class="adjustStyleClasses.icon"
                  :button-style="adjustStyleClasses.button"
                  :show-label="isNoviceMode"
                  :label="t('tamagotchi.stage.controls-island.labels.fade')"
                />

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlsIslandHearingConfig :show="blockingOverlays.has('hearing')" @update:show="setOverlay('hearing', $event)">
                    <div class="relative">
                      <ControlButton
                        data-testid="controls-hearing-toggle"
                        class="controls-button"
                        :button-style="adjustStyleClasses.button"
                        :show-label="isNoviceMode"
                        :label="t('tamagotchi.stage.controls-island.labels.hearing')"
                        :aria-label="t('tamagotchi.stage.controls-island.open-hearing-controls')"
                        :title="t('tamagotchi.stage.controls-island.open-hearing-controls')"
                      >
                        <Transition name="fade" mode="out-in">
                          <IndicatorMicVolume v-if="enabled" :class="adjustStyleClasses.icon" />
                          <div v-else i-ph:microphone-slash :class="adjustStyleClasses.icon" text="neutral-800 dark:neutral-300" />
                        </Transition>
                      </ControlButton>
                    </div>
                  </ControlsIslandHearingConfig>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.open-hearing-controls') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-study-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.study')"
                    :aria-label="studyPanelToggleLabel"
                    :title="studyPanelToggleLabel"
                    @click="toggleStudyPanel"
                  >
                    <div
                      :class="[adjustStyleClasses.icon, studyPanelExpanded ? 'text-primary-600 dark:text-primary-300' : 'text-neutral-800 dark:text-neutral-300']"
                      i-solar:book-bold-duotone
                    />
                  </ControlButton>
                  <template #tooltip>
                    {{ studyPanelToggleLabel }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-vision-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.vision')"
                    :aria-label="visionPanelToggleLabel"
                    :title="visionPanelToggleLabel"
                    :class="[
                      visionPanelVisible ? 'bg-sky-100/80 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300' : '',
                    ]"
                    @click="toggleVisionPanel"
                  >
                    <div i-solar:camera-outline :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ visionPanelToggleLabel }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-ui-mode-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.mode')"
                    :aria-label="controlsUIModeToggleLabel"
                    :title="controlsUIModeToggleLabel"
                    @click="toggleControlsUIMode"
                  >
                    <div
                      :class="[adjustStyleClasses.icon, controlsUIMode === 'novice' ? 'text-amber-500 dark:text-amber-300' : 'text-indigo-500 dark:text-indigo-300']"
                      i-ph:user-switch
                    />
                  </ControlButton>
                  <template #tooltip>
                    {{ controlsUIModeLabel }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-shortcuts-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.keys')"
                    :aria-label="shortcutsToggleLabel"
                    :title="shortcutsToggleLabel"
                    :class="[
                      shortcutsCardExpanded ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200' : '',
                    ]"
                    @click="toggleShortcutsCard"
                  >
                    <div i-ph:keyboard :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ shortcutsToggleLabel }}
                  </template>
                </ControlButtonTooltip>
              </div>

              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="shortcutsCardExpanded"
                  data-testid="controls-shortcuts-card"
                  :class="[
                    'w-full rounded-lg border border-neutral-200/80 px-2.5 py-2 text-[11px]',
                    'bg-neutral-50/80 text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-200',
                  ]"
                >
                  <div class="font-semibold">
                    {{ t('tamagotchi.stage.controls-island.shortcuts.title') }}
                  </div>
                  <div class="mt-1 flex items-center justify-between gap-2">
                    <span>{{ t('tamagotchi.stage.controls-island.shortcuts.zoom-in') }}</span>
                    <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + +</code>
                  </div>
                  <div class="mt-1 flex items-center justify-between gap-2">
                    <span>{{ t('tamagotchi.stage.controls-island.shortcuts.zoom-out') }}</span>
                    <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + -</code>
                  </div>
                  <div class="mt-1 flex items-center justify-between gap-2">
                    <span>{{ t('tamagotchi.stage.controls-island.shortcuts.reset-size') }}</span>
                    <code class="rounded bg-neutral-200/75 px-1.5 py-0.5 text-[10px] dark:bg-neutral-700/70">Cmd/Ctrl + 0</code>
                  </div>
                  <div class="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                    {{ t('tamagotchi.stage.controls-island.shortcuts.hint') }}
                  </div>
                </div>
              </Transition>
            </section>

            <section
              data-testid="controls-group-window"
              :class="[
                'w-full flex flex-col gap-2 border-t border-neutral-200/70 pt-2',
                'dark:border-neutral-700/70',
              ]"
            >
              <header
                data-testid="controls-group-title-window"
                :class="[
                  'text-[10px] font-semibold tracking-[0.08em] uppercase',
                  'text-neutral-500 dark:text-neutral-400',
                ]"
              >
                {{ t('tamagotchi.stage.controls-island.groups.window') }}
              </header>

              <div data-testid="controls-window-grid" class="controls-button-grid grid grid-cols-3 gap-2">
                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-move-mode-toggle"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.move')"
                    :aria-label="moveModeControlLabel"
                    :title="moveModeControlLabel"
                    :aria-pressed="moveModeEnabled"
                    :class="[
                      moveModeEnabled
                        ? 'bg-sky-100/85 text-sky-700 ring-2 ring-sky-400/70 dark:bg-sky-900/45 dark:text-sky-200 dark:ring-sky-400/60'
                        : 'text-neutral-800 dark:text-neutral-300',
                    ]"
                    @click="toggleMoveMode"
                  >
                    <Transition name="fade" mode="out-in">
                      <div
                        v-if="moveModeEnabled"
                        data-testid="controls-move-mode-icon"
                        i-ph:arrows-out-cardinal
                        :class="adjustStyleClasses.icon"
                      />
                      <div
                        v-else
                        data-testid="controls-move-mode-icon"
                        i-ph:arrows-out-cardinal
                        :class="adjustStyleClasses.icon"
                      />
                    </Transition>
                  </ControlButton>
                  <template #tooltip>
                    {{ moveModeControlLabel }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-zoom-in"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.zoom-in')"
                    :aria-label="t('tamagotchi.stage.controls-island.zoom-in')"
                    :title="t('tamagotchi.stage.controls-island.zoom-in')"
                    @click="resizeWindowByAction('zoom-in')"
                  >
                    <div i-ph:magnifying-glass-plus :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.zoom-in') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-zoom-out"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.zoom-out')"
                    :aria-label="t('tamagotchi.stage.controls-island.zoom-out')"
                    :title="t('tamagotchi.stage.controls-island.zoom-out')"
                    @click="resizeWindowByAction('zoom-out')"
                  >
                    <div i-ph:magnifying-glass-minus :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.zoom-out') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-reset-size"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.reset')"
                    :aria-label="t('tamagotchi.stage.controls-island.reset-size')"
                    :title="t('tamagotchi.stage.controls-island.reset-size')"
                    @click="resizeWindowByAction('reset-size')"
                  >
                    <div data-testid="controls-reset-size-icon" i-ph:arrows-clockwise :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.reset-size') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-drag-window"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.drag')"
                    :aria-label="t('tamagotchi.stage.controls-island.drag-to-move-window')"
                    :title="t('tamagotchi.stage.controls-island.drag-to-move-window')"
                    cursor-move
                    :class="[{ 'drag-region': isLinux }, 'text-neutral-800 dark:text-neutral-300']"
                    @mousedown="startDraggingWindow?.()"
                  >
                    <div data-testid="controls-drag-window-icon" i-ph:hand-grabbing :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.drag-to-move-window') }}
                  </template>
                </ControlButtonTooltip>

                <ControlButtonTooltip disable-hoverable-content trigger-class="controls-button-cell">
                  <ControlButton
                    data-testid="controls-close-button"
                    class="controls-button"
                    :button-style="adjustStyleClasses.button"
                    :show-label="isNoviceMode"
                    :label="t('tamagotchi.stage.controls-island.labels.close')"
                    :aria-label="t('tamagotchi.stage.controls-island.close')"
                    :title="t('tamagotchi.stage.controls-island.close')"
                    :class="['text-neutral-800 dark:text-neutral-200 hover:bg-red-500/85 hover:text-white']"
                    @click="closeWindow()"
                  >
                    <div i-solar:close-circle-outline :class="adjustStyleClasses.icon" />
                  </ControlButton>
                  <template #tooltip>
                    {{ t('tamagotchi.stage.controls-island.close') }}
                  </template>
                </ControlButtonTooltip>
              </div>

              <div
                v-if="moveModeEnabled"
                data-testid="controls-move-mode-status"
                :class="[
                  'w-full rounded-lg px-2 py-1.5',
                  'text-2.75 text-left leading-4 text-sky-700',
                  'bg-sky-100/70 dark:bg-sky-900/35 dark:text-sky-200',
                ]"
              >
                <span class="font-semibold">{{ t('tamagotchi.stage.controls-island.move-mode.status-on') }}</span>
                <span class="ml-1">{{ t('tamagotchi.stage.controls-island.move-mode.status-hint') }}</span>
              </div>
            </section>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <section
                v-show="studyPanelExpanded"
                data-testid="controls-study-panel"
                :class="[
                  'min-h-0 flex flex-1 flex-col border-t border-neutral-200/70 pt-2',
                  'dark:border-neutral-700/70',
                ]"
              >
                <div :class="['min-h-0 flex-1 overflow-hidden']">
                  <StudyIsland
                    :class="['h-full w-full']"
                    @interaction-lock-change="handleStudyPanelInteractionLock"
                    @close="closeStudyPanel"
                  />
                </div>
              </section>
            </Transition>

            <section
              v-if="visionPanelVisible"
              ref="visionPanelElement"
              data-testid="controls-vision-panel"
              class="min-h-0 flex flex-col"
            >
              <VisionIsland embedded :ui-mode="controlsUIMode" />
            </section>
          </div>
        </div>
      </Transition>

      <div data-testid="controls-anchor" class="flex flex-col items-end">
        <ControlButtonTooltip side="left">
          <ControlButton
            data-testid="controls-toggle-button"
            class="controls-toggle-button [-webkit-app-region:no-drag] pointer-events-auto"
            :button-style="adjustStyleClasses.button"
            :aria-label="panelToggleLabel"
            :title="panelToggleLabel"
            @click="controlsIslandStore.toggleControlsPanel()"
          >
            <div
              :class="[adjustStyleClasses.icon, controlsPanelExpanded ? 'rotate-180' : 'rotate-0']"
              i-solar:alt-arrow-up-line-duotone scale-110 transition-all duration-300
              text="neutral-800 dark:neutral-300"
            />
          </ControlButton>
          <template #tooltip>
            {{ panelToggleLabel }}
          </template>
        </ControlButtonTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls-island-root {
  z-index: 120;
  -webkit-app-region: no-drag;
}

.controls-island-root .drag-region {
  -webkit-app-region: drag;
}

.controls-button-grid {
  width: 100%;
}

.controls-button-cell {
  width: 100%;
  display: flex;
  justify-content: center;
}

.controls-toggle-button {
  -webkit-app-region: no-drag;
  pointer-events: auto;
}
</style>
