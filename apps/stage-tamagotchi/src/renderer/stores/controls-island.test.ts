// @vitest-environment jsdom

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useControlsIslandStore } from './controls-island'

describe('useControlsIslandStore move mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.removeItem('controls-island/move-mode-enabled')
    localStorage.removeItem('controls-island/ui-mode')
  })

  it('defaults move mode to disabled and toggles state', () => {
    const store = useControlsIslandStore()

    expect(store.moveModeEnabled).toBe(false)

    store.toggleMoveMode()
    expect(store.moveModeEnabled).toBe(true)

    store.toggleMoveMode()
    expect(store.moveModeEnabled).toBe(false)
  })

  it('defaults controls UI mode to novice and persists mode toggle', async () => {
    const store = useControlsIslandStore()

    expect(store.controlsUIMode).toBe('novice')

    store.toggleControlsUIMode()
    await nextTick()
    expect(store.controlsUIMode).toBe('expert')
    expect(localStorage.getItem('controls-island/ui-mode')).toBe('expert')

    store.setControlsUIMode('novice')
    await nextTick()
    expect(store.controlsUIMode).toBe('novice')
    expect(localStorage.getItem('controls-island/ui-mode')).toBe('novice')
  })
})
