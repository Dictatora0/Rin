// @vitest-environment jsdom

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useControlsIslandStore } from './controls-island'

describe('useControlsIslandStore move mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.removeItem('controls-island/move-mode-enabled')
  })

  it('defaults move mode to disabled and toggles state', () => {
    const store = useControlsIslandStore()

    expect(store.moveModeEnabled).toBe(false)

    store.toggleMoveMode()
    expect(store.moveModeEnabled).toBe(true)

    store.toggleMoveMode()
    expect(store.moveModeEnabled).toBe(false)
  })
})
