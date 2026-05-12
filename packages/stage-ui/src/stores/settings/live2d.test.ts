import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useSettingsLive2d } from './live2d'

vi.mock('@proj-airi/stage-shared/composables', () => {
  function createManualResetRef<T>(initialValue: T) {
    const state = ref(initialValue)
    return Object.assign(state, {
      reset: () => {
        state.value = initialValue
      },
    })
  }

  return {
    useLocalStorageManualReset: <T>(_key: string, initialValue: T) => createManualResetRef(initialValue),
    useVersionedLocalStorageManualReset: <T>(_key: string, initialValue: T) => createManualResetRef(initialValue),
  }
})

describe('useSettingsLive2d', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('uses auto as default fit preference', () => {
    const store = useSettingsLive2d()

    expect(store.live2dFitPreference).toBe('auto')
  })

  it('updates to full-body preference', () => {
    const store = useSettingsLive2d()

    store.setLive2dFitPreference('full-body')

    expect(store.live2dFitPreference).toBe('full-body')
  })

  it('updates to upper-body preference', () => {
    const store = useSettingsLive2d()

    store.setLive2dFitPreference('upper-body')

    expect(store.live2dFitPreference).toBe('upper-body')
  })

  it('falls back to auto for invalid fit preference', () => {
    const store = useSettingsLive2d()

    store.setLive2dFitPreference('full-body')
    store.setLive2dFitPreference('invalid-value' as never)

    expect(store.live2dFitPreference).toBe('auto')
  })
})
