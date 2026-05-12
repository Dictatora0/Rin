import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useControlsIslandStore = defineStore('controls-island', () => {
  // Persist fade-on-hover preference per user
  const fadeOnHoverEnabled = useLocalStorage<boolean>('controls-island/fade-on-hover-enabled', false)
  const moveModeEnabled = useLocalStorage<boolean>('controls-island/move-mode-enabled', false)
  const controlsUIMode = useLocalStorage<'novice' | 'expert'>('controls-island/ui-mode', 'novice')
  const controlsPanelExpanded = ref(false)
  const studyPanelOpen = ref(false)
  const visionPanelOpen = ref(false)
  const visionCameraRunning = ref(false)
  const dontShowItAgainNoticeFadeOnHover = useLocalStorage<boolean>('preferences/dont-show-it-again/notice/fade-on-hover', false)

  function enableFadeOnHover() {
    fadeOnHoverEnabled.value = true
  }

  function disableFadeOnHover() {
    fadeOnHoverEnabled.value = false
  }

  function toggleMoveMode() {
    moveModeEnabled.value = !moveModeEnabled.value
  }

  function setControlsUIMode(mode: 'novice' | 'expert') {
    controlsUIMode.value = mode
  }

  function toggleControlsUIMode() {
    controlsUIMode.value = controlsUIMode.value === 'novice' ? 'expert' : 'novice'
  }

  function toggleControlsPanel() {
    controlsPanelExpanded.value = !controlsPanelExpanded.value
  }

  function setControlsPanelExpanded(expanded: boolean) {
    controlsPanelExpanded.value = expanded
  }

  function toggleStudyPanel() {
    studyPanelOpen.value = !studyPanelOpen.value
  }

  function toggleVisionPanel() {
    visionPanelOpen.value = !visionPanelOpen.value
  }

  function setStudyPanelOpen(open: boolean) {
    studyPanelOpen.value = open
  }

  function setVisionPanelOpen(open: boolean) {
    visionPanelOpen.value = open
  }

  function setVisionCameraRunning(running: boolean) {
    visionCameraRunning.value = running
  }

  return {
    fadeOnHoverEnabled,
    moveModeEnabled,
    controlsUIMode,
    controlsPanelExpanded,
    studyPanelOpen,
    visionPanelOpen,
    visionCameraRunning,
    dontShowItAgainNoticeFadeOnHover,
    enableFadeOnHover,
    disableFadeOnHover,
    toggleMoveMode,
    setControlsUIMode,
    toggleControlsUIMode,
    toggleControlsPanel,
    setControlsPanelExpanded,
    toggleStudyPanel,
    toggleVisionPanel,
    setStudyPanelOpen,
    setVisionPanelOpen,
    setVisionCameraRunning,
  }
})
