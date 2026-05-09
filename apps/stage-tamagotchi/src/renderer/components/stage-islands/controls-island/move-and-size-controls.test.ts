// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  const moveModeEnabled = { value: false }
  return {
    moveModeEnabled,
    isOutside: { value: false } as { value: boolean },
    openSettings: vi.fn(),
    openChat: vi.fn(),
    closeWindow: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    startDraggingWindow: vi.fn(),
    getBounds: vi.fn(async () => ({ x: 120, y: 100, width: 450, height: 600 })),
    setBounds: vi.fn(async () => {}),
    getPrimaryDisplay: vi.fn(async () => ({ workArea: { x: 0, y: 0, width: 1440, height: 900 } })),
    unknownEvents: [] as string[],
    toggleMoveMode: vi.fn(() => {
      moveModeEnabled.value = !moveModeEnabled.value
    }),
  }
})

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}))

vi.mock('@moeru/eventa', () => ({
  defineInvoke: () => mocks.startDraggingWindow,
}))

vi.mock('@proj-airi/ui', () => ({
  useTheme: () => ({
    isDark: ref(false),
    toggleDark: vi.fn(() => {}),
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (value: string) => value,
  }),
}))

vi.mock('@proj-airi/stage-ui/stores/settings', () => ({
  useSettings: () => ({
    alwaysOnTop: ref(false),
    controlsIslandIconSize: ref<'auto' | 'small' | 'large'>('auto'),
  }),
  useSettingsAudioDevice: () => ({
    enabled: ref(false),
  }),
}))

vi.mock('../../../stores/controls-island', () => ({
  useControlsIslandStore: () => ({
    moveModeEnabled: mocks.moveModeEnabled,
    toggleMoveMode: mocks.toggleMoveMode,
  }),
}))

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaContext: () => ref({}),
  useElectronEventaInvoke: (event: unknown) => {
    const eventName = String((event as { __eventName?: string })?.__eventName ?? '')
    const eventBody = JSON.stringify(event ?? {})
    if (eventName === 'electron.app.isLinux')
      return () => false
    if (eventName === 'electronOpenSettings')
      return mocks.openSettings
    if (eventName === 'electronOpenChat')
      return mocks.openChat
    if (eventName === 'electronAppQuit')
      return mocks.closeWindow
    if (eventName === 'electronWindowSetAlwaysOnTop')
      return mocks.setAlwaysOnTop
    if (eventName === 'electron.window.getBounds' || eventName.includes('getBounds') || eventBody.includes('getBounds'))
      return mocks.getBounds
    if (eventName === 'electron.window.setBounds' || eventName.includes('setBounds') || eventBody.includes('setBounds'))
      return mocks.setBounds
    if (eventName === 'electron.screen.getPrimaryDisplay' || eventName.includes('getPrimaryDisplay') || eventBody.includes('getPrimaryDisplay'))
      return mocks.getPrimaryDisplay
    mocks.unknownEvents.push(`${eventName}::${eventBody}`)
    return vi.fn(() => {})
  },
  useElectronMouseInElement: () => ({
    isOutside: mocks.isOutside,
  }),
}))

vi.mock('../../../../shared/eventa', () => ({
  electron: {
    app: {
      isLinux: { __eventName: 'electron.app.isLinux' },
    },
    window: {
      getBounds: { __eventName: 'electron.window.getBounds' },
      setBounds: { __eventName: 'electron.window.setBounds' },
    },
    screen: {
      getPrimaryDisplay: { __eventName: 'electron.screen.getPrimaryDisplay' },
    },
  },
  electronAppQuit: { __eventName: 'electronAppQuit' },
  electronOpenChat: { __eventName: 'electronOpenChat' },
  electronOpenSettings: { __eventName: 'electronOpenSettings' },
  electronStartDraggingWindow: { __eventName: 'electronStartDraggingWindow' },
  electronWindowSetAlwaysOnTop: { __eventName: 'electronWindowSetAlwaysOnTop' },
}))

vi.mock('@vueuse/core', async () => {
  const vue = await import('vue')
  return {
    refDebounced: <T>(source: { value: T }, ms = 200) => {
      const debounced = vue.ref(source.value) as { value: T }
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      vue.watch(source as never, (value) => {
        if (timeoutId)
          clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          debounced.value = value as T
        }, ms)
      }, { immediate: true })
      vue.onBeforeUnmount(() => {
        if (timeoutId)
          clearTimeout(timeoutId)
      })
      return debounced
    },
    useIntervalFn: (cb: () => void, interval: number) => {
      const timer = setInterval(cb, interval)
      return {
        pause: () => clearInterval(timer),
        resume: () => {},
      }
    },
  }
})

vi.mock('../vision-island/index.vue', () => ({
  default: defineComponent({
    name: 'VisionIslandStub',
    setup() {
      return () => h('div', { 'data-testid': 'vision-island-stub' }, 'vision')
    },
  }),
}))

vi.mock('./control-button-tooltip.vue', () => ({
  default: defineComponent({
    name: 'ControlButtonTooltipStub',
    setup(_, { slots }) {
      return () => h('div', [slots.default?.(), h('span', { class: 'tooltip-text' }, slots.tooltip?.())])
    },
  }),
}))

vi.mock('./controls-island-auth-button.vue', () => ({
  default: defineComponent({
    name: 'ControlsIslandAuthButtonStub',
    setup() {
      return () => h('div')
    },
  }),
}))

vi.mock('./controls-island-fade-on-hover.vue', () => ({
  default: defineComponent({
    name: 'ControlsIslandFadeOnHoverStub',
    setup() {
      return () => h('button', { type: 'button' }, 'fade')
    },
  }),
}))

vi.mock('./controls-island-hearing-config.vue', () => ({
  default: defineComponent({
    name: 'ControlsIslandHearingConfigStub',
    emits: ['update:show'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
}))

vi.mock('./controls-island-profile-picker.vue', () => ({
  default: defineComponent({
    name: 'ControlsIslandProfilePickerStub',
    emits: ['update:open'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.({ toggle: () => {} }))
    },
  }),
}))

vi.mock('./indicator-mic-volume.vue', () => ({
  default: defineComponent({
    name: 'IndicatorMicVolumeStub',
    setup() {
      return () => h('div')
    },
  }),
}))

function mountControlsIsland() {
  const host = defineComponent({
    setup() {
      return () => h(ControlsIsland)
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)
  return {
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function clickExpand(container: HTMLElement) {
  const tooltipNode = Array.from(container.querySelectorAll('.tooltip-text'))
    .find(node => node.textContent?.includes('tamagotchi.stage.controls-island.expand'))
  if (!tooltipNode)
    throw new Error('expand tooltip not found')
  const button = tooltipNode.previousElementSibling as HTMLButtonElement | null
  if (!button)
    throw new Error('expand button not found')
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('controls island move mode and size controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.isOutside = ref(false)
    mocks.moveModeEnabled.value = false
    mocks.openSettings.mockReset()
    mocks.openChat.mockReset()
    mocks.closeWindow.mockReset()
    mocks.setAlwaysOnTop.mockReset()
    mocks.startDraggingWindow.mockReset()
    mocks.getBounds.mockClear()
    mocks.setBounds.mockClear()
    mocks.getPrimaryDisplay.mockClear()
    mocks.toggleMoveMode.mockClear()
    mocks.unknownEvents.length = 0
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('toggles move mode through controls button', async () => {
    const { container, unmount } = mountControlsIsland()
    clickExpand(container)
    await nextTick()

    const toggleButton = container.querySelector('[data-testid="controls-move-mode-toggle"]') as HTMLButtonElement | null
    expect(toggleButton).not.toBeNull()
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.move-mode.toggle')
    expect(mocks.moveModeEnabled.value).toBe(false)

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleMoveMode).toHaveBeenCalledTimes(1)
    expect(mocks.moveModeEnabled.value).toBe(true)

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleMoveMode).toHaveBeenCalledTimes(2)
    expect(mocks.moveModeEnabled.value).toBe(false)

    unmount()
  })

  it('dispatches zoom in, zoom out, and reset size actions', async () => {
    const { container, unmount } = mountControlsIsland()
    clickExpand(container)
    await nextTick()

    const zoomInButton = container.querySelector('[data-testid="controls-zoom-in"]') as HTMLButtonElement | null
    const zoomOutButton = container.querySelector('[data-testid="controls-zoom-out"]') as HTMLButtonElement | null
    const resetButton = container.querySelector('[data-testid="controls-reset-size"]') as HTMLButtonElement | null

    expect(zoomInButton).not.toBeNull()
    expect(zoomOutButton).not.toBeNull()
    expect(resetButton).not.toBeNull()
    expect(zoomInButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.zoom-in')
    expect(zoomOutButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.zoom-out')
    expect(resetButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.reset-size')

    zoomInButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    zoomOutButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    resetButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => {
      expect(mocks.setBounds).toHaveBeenCalledTimes(3)
    })

    expect(mocks.getBounds).toHaveBeenCalledTimes(3)
    expect(mocks.getPrimaryDisplay).toHaveBeenCalledTimes(3)
    expect(mocks.unknownEvents).toEqual([])

    const [zoomInCall, zoomOutCall, resetCall] = mocks.setBounds.mock.calls as Array<Array<Array<{ width: number, height: number }>>>
    if (!zoomInCall || !zoomOutCall || !resetCall)
      throw new Error('expected setBounds to receive three calls')

    const zoomInPayload = zoomInCall[0]?.[0]
    const zoomOutPayload = zoomOutCall[0]?.[0]
    const resetPayload = resetCall[0]?.[0]
    if (!zoomInPayload || !zoomOutPayload || !resetPayload)
      throw new Error('expected setBounds payload shape to match [bounds]')
    expect(zoomInPayload.width).toBeGreaterThan(450)
    expect(zoomInPayload.height).toBeGreaterThan(600)
    expect(zoomOutPayload.width).toBeLessThan(450)
    expect(zoomOutPayload.height).toBeLessThan(600)
    expect(resetPayload.width).toBe(450)
    expect(resetPayload.height).toBe(600)

    unmount()
  })
})
