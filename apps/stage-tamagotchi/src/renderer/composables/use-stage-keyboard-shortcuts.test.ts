// @vitest-environment jsdom

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import { useControlsIslandStore } from '../stores/controls-island'
import { useStageKeyboardShortcuts } from './use-stage-keyboard-shortcuts'

const live2dScaleState = vi.hoisted(() => ({
  value: 1,
}))

vi.mock('@proj-airi/stage-ui-live2d', () => ({
  useLive2d: () => ({
    get scale() {
      return live2dScaleState.value
    },
    set scale(nextValue: number) {
      live2dScaleState.value = nextValue
    },
  }),
}))

const mocks = vi.hoisted(() => ({
  getBounds: vi.fn(async () => ({ x: 100, y: 100, width: 450, height: 600 })),
  setBounds: vi.fn(async () => {}),
  getPrimaryDisplay: vi.fn(async () => ({ workArea: { x: 0, y: 0, width: 1440, height: 900 } })),
}))

function mountShortcutHost() {
  const controlsPanelExpanded = ref(false)

  const host = defineComponent({
    setup() {
      useStageKeyboardShortcuts({
        controlsPanelExpanded,
        setControlsPanelExpanded(expanded) {
          controlsPanelExpanded.value = expanded
        },
      })

      return () => h('div')
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)

  return {
    controlsPanelExpanded,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function dispatchKeyDown(eventInit: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...eventInit })
  const preventedBeforeDispatch = event.defaultPrevented
  window.dispatchEvent(event)
  return {
    defaultPrevented: event.defaultPrevented,
    preventedBeforeDispatch,
  }
}

describe('useStageKeyboardShortcuts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    live2dScaleState.value = 1
    mocks.getBounds.mockClear()
    mocks.setBounds.mockClear()
    mocks.getPrimaryDisplay.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps command plus behavior untouched in renderer handler', async () => {
    const mounted = mountShortcutHost()

    const result = dispatchKeyDown({ key: '+', code: 'Equal', metaKey: true })
    expect(result.defaultPrevented).toBe(false)
    expect(mocks.setBounds).toHaveBeenCalledTimes(0)

    mounted.unmount()
  })

  it('applies command shift plus to live2d display scale up with clamp', async () => {
    const mounted = mountShortcutHost()
    const controlsStore = useControlsIslandStore()
    void controlsStore
    live2dScaleState.value = 1
    dispatchKeyDown({ key: '+', code: 'Equal', metaKey: true, shiftKey: true })
    await nextTick()
    expect(Number(live2dScaleState.value)).toBe(1.05)

    live2dScaleState.value = 1.35
    dispatchKeyDown({ key: '+', code: 'Equal', metaKey: true, shiftKey: true })
    await nextTick()
    expect(Number(live2dScaleState.value)).toBe(1.35)

    mounted.unmount()
  })

  it('applies command shift minus to live2d display scale down with clamp', async () => {
    const mounted = mountShortcutHost()
    live2dScaleState.value = 1
    dispatchKeyDown({ key: '-', code: 'Minus', metaKey: true, shiftKey: true })
    await nextTick()
    expect(Number(live2dScaleState.value)).toBe(0.95)

    live2dScaleState.value = 0.75
    dispatchKeyDown({ key: '-', code: 'Minus', metaKey: true, shiftKey: true })
    await nextTick()
    expect(Number(live2dScaleState.value)).toBe(0.75)

    mounted.unmount()
  })

  it('resets live2d display scale with command shift 0', async () => {
    const mounted = mountShortcutHost()
    live2dScaleState.value = 1.2
    dispatchKeyDown({ key: '0', code: 'Digit0', metaKey: true, shiftKey: true })
    await nextTick()
    expect(Number(live2dScaleState.value)).toBe(1)

    mounted.unmount()
  })

  it('toggles move mode with command shift m', () => {
    const mounted = mountShortcutHost()
    const controlsStore = useControlsIslandStore()
    expect(controlsStore.moveModeEnabled).toBe(false)

    dispatchKeyDown({ key: 'm', code: 'KeyM', metaKey: true, shiftKey: true })
    expect(controlsStore.moveModeEnabled).toBe(true)

    mounted.unmount()
  })

  it('toggles study and vision panel with command shift keys', () => {
    const mounted = mountShortcutHost()
    const controlsStore = useControlsIslandStore()

    expect(controlsStore.studyPanelOpen).toBe(false)
    dispatchKeyDown({ key: 't', code: 'KeyT', metaKey: true, shiftKey: true })
    expect(controlsStore.studyPanelOpen).toBe(true)

    expect(controlsStore.visionPanelOpen).toBe(false)
    dispatchKeyDown({ key: 'v', code: 'KeyV', metaKey: true, shiftKey: true })
    expect(controlsStore.visionPanelOpen).toBe(true)

    mounted.unmount()
  })

  it('handles escape priority: move mode then shortcuts guide then vision then study then controls panel', () => {
    const mounted = mountShortcutHost()
    const controlsStore = useControlsIslandStore()

    controlsStore.moveModeEnabled = true
    controlsStore.shortcutGuidePanelOpen = true
    controlsStore.visionPanelOpen = true
    controlsStore.studyPanelOpen = true
    mounted.controlsPanelExpanded.value = true

    dispatchKeyDown({ key: 'Escape', code: 'Escape' })
    expect(controlsStore.moveModeEnabled).toBe(false)
    expect(controlsStore.shortcutGuidePanelOpen).toBe(true)

    dispatchKeyDown({ key: 'Escape', code: 'Escape' })
    expect(controlsStore.shortcutGuidePanelOpen).toBe(false)
    expect(controlsStore.visionPanelOpen).toBe(true)

    dispatchKeyDown({ key: 'Escape', code: 'Escape' })
    expect(controlsStore.visionPanelOpen).toBe(false)
    expect(controlsStore.studyPanelOpen).toBe(true)

    dispatchKeyDown({ key: 'Escape', code: 'Escape' })
    expect(controlsStore.studyPanelOpen).toBe(false)
    expect(mounted.controlsPanelExpanded.value).toBe(true)

    controlsStore.setControlsPanelExpanded(true)
    mounted.controlsPanelExpanded.value = true

    dispatchKeyDown({ key: 'Escape', code: 'Escape' })
    expect(mounted.controlsPanelExpanded.value).toBe(false)

    mounted.unmount()
  })

  it('toggles shortcuts guide panel with command shift k', () => {
    const mounted = mountShortcutHost()
    const controlsStore = useControlsIslandStore()
    expect(controlsStore.shortcutGuidePanelOpen).toBe(false)

    dispatchKeyDown({ key: 'k', code: 'KeyK', metaKey: true, shiftKey: true })
    expect(controlsStore.shortcutGuidePanelOpen).toBe(true)

    dispatchKeyDown({ key: 'k', code: 'KeyK', metaKey: true, shiftKey: true })
    expect(controlsStore.shortcutGuidePanelOpen).toBe(false)

    mounted.unmount()
  })

  it('does not trigger shortcuts while input is focused', async () => {
    const mounted = mountShortcutHost()
    live2dScaleState.value = 1
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: '+',
      code: 'Equal',
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(Number(live2dScaleState.value)).toBe(1)
    document.body.removeChild(input)

    mounted.unmount()
  })

  it('does not prevent default when shortcut does not match', () => {
    const mounted = mountShortcutHost()

    const result = dispatchKeyDown({ key: 'x', code: 'KeyX', metaKey: true })
    expect(result.defaultPrevented).toBe(false)
    expect(mocks.setBounds).toHaveBeenCalledTimes(0)

    mounted.unmount()
  })
})
