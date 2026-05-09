import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useControlsIslandStore = defineStore('controls-island', () => {
  // Persist fade-on-hover preference per user
  const fadeOnHoverEnabled = useLocalStorage<boolean>('controls-island/fade-on-hover-enabled', false)
  const moveModeEnabled = useLocalStorage<boolean>('controls-island/move-mode-enabled', false)
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

  return {
    fadeOnHoverEnabled,
    moveModeEnabled,
    dontShowItAgainNoticeFadeOnHover,
    enableFadeOnHover,
    disableFadeOnHover,
    toggleMoveMode,
  }
})
