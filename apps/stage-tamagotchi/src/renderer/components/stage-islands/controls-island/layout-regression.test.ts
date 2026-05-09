// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onBeforeUnmount, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  const moveModeEnabled = { value: false }
  return {
    isOutside: { value: false } as { value: boolean },
    moveModeEnabled,
    visionPanelUnmounted: vi.fn(),
    openSettings: vi.fn(),
    openChat: vi.fn(),
    closeWindow: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    startDraggingWindow: vi.fn(),
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
      onBeforeUnmount(() => {
        mocks.visionPanelUnmounted()
      })
      return () => h('div', { 'data-testid': 'vision-island-stub' }, 'vision')
    },
  }),
}))

vi.mock('./control-button-tooltip.vue', () => ({
  default: defineComponent({
    name: 'ControlButtonTooltipStub',
    setup(_, { slots }) {
      return () => {
        return h('div', [
          slots.default?.(),
          h('span', { class: 'tooltip-text' }, slots.tooltip?.()),
        ])
      }
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
      return () => {
        return h('div', slots.default?.({ toggle: () => {} }))
      }
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

function findButtonByTooltipText(container: HTMLElement, text: string) {
  const tooltipNode = Array.from(container.querySelectorAll('.tooltip-text'))
    .find(node => node.textContent?.includes(text))
  if (!tooltipNode)
    throw new Error(`tooltip "${text}" not found`)
  const button = tooltipNode.previousElementSibling as HTMLButtonElement | null
  if (!button || button.tagName !== 'BUTTON')
    throw new Error(`button for tooltip "${text}" not found`)
  return button
}

describe('controls island layout regression locks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.isOutside = ref(false)
    mocks.visionPanelUnmounted.mockReset()
    mocks.openSettings.mockReset()
    mocks.openChat.mockReset()
    mocks.closeWindow.mockReset()
    mocks.setAlwaysOnTop.mockReset()
    mocks.startDraggingWindow.mockReset()
    mocks.toggleMoveMode.mockReset()
    mocks.moveModeEnabled.value = false
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps top grid structure and button count stable after opening vision panel', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findButtonByTooltipText(container, 'tamagotchi.stage.controls-island.expand')
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const topGrid = container.querySelector('[data-testid="controls-top-grid"]') as HTMLDivElement | null
    if (!topGrid)
      throw new Error('top grid container missing after expand')

    const topGridButtonsBefore = topGrid.querySelectorAll('button').length
    expect(topGrid.className).toContain('w-max')
    expect(topGrid.className).toContain('self-start')
    expect(topGrid.hasAttribute('grid-cols-3')).toBe(true)
    expect(topGridButtonsBefore).toBe(9)

    const visionButton = container.querySelector('[data-testid="controls-vision-toggle"]') as HTMLButtonElement | null
    if (!visionButton)
      throw new Error('vision toggle button missing')

    visionButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-top-grid"]')).not.toBeNull()

    const topGridAfter = container.querySelector('[data-testid="controls-top-grid"]') as HTMLDivElement | null
    if (!topGridAfter)
      throw new Error('top grid container missing after opening vision panel')
    const topGridButtonsAfter = topGridAfter.querySelectorAll('button').length
    expect(topGridButtonsAfter).toBe(topGridButtonsBefore)
    expect(topGridAfter.className).toContain('w-max')
    expect(topGridAfter.className).toContain('self-start')
    expect(topGridAfter.hasAttribute('grid-cols-3')).toBe(true)

    unmount()
  })

  it('keeps close button reachable after vision panel opens', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findButtonByTooltipText(container, 'tamagotchi.stage.controls-island.expand')
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const visionButton = container.querySelector('[data-testid="controls-vision-toggle"]') as HTMLButtonElement | null
    if (!visionButton)
      throw new Error('vision toggle button missing')
    visionButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const closeButton = container.querySelector('[data-testid="controls-close-button"]') as HTMLButtonElement | null
    if (!closeButton)
      throw new Error('close button missing')
    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.closeWindow).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()

    const cameraButton = findButtonByTooltipText(container, '收起视觉交互')
    expect(cameraButton).toBe(visionButton)
    unmount()
  })
})
