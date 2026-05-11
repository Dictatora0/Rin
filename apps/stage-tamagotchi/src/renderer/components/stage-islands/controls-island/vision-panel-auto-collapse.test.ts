// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onBeforeUnmount, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  return {
    isOutside: { value: false } as { value: boolean },
    moveModeEnabled: { value: false } as { value: boolean },
    controlsUIMode: { value: 'novice' } as { value: 'novice' | 'expert' },
    controlsPanelExpanded: { value: false } as { value: boolean },
    visionUnmountStop: vi.fn(),
    openSettings: vi.fn(),
    openChat: vi.fn(),
    closeWindow: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    startDraggingWindow: vi.fn(),
    toggleMoveMode: vi.fn(() => {
      mocks.moveModeEnabled.value = !mocks.moveModeEnabled.value
    }),
    toggleControlsPanel: vi.fn(() => {
      mocks.controlsPanelExpanded.value = !mocks.controlsPanelExpanded.value
    }),
    toggleControlsUIMode: vi.fn(() => {
      mocks.controlsUIMode.value = mocks.controlsUIMode.value === 'novice' ? 'expert' : 'novice'
    }),
    setControlsPanelExpanded: vi.fn((expanded: boolean) => {
      mocks.controlsPanelExpanded.value = expanded
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
    controlsUIMode: mocks.controlsUIMode,
    controlsPanelExpanded: mocks.controlsPanelExpanded,
    toggleMoveMode: mocks.toggleMoveMode,
    toggleControlsUIMode: mocks.toggleControlsUIMode,
    toggleControlsPanel: mocks.toggleControlsPanel,
    setControlsPanelExpanded: mocks.setControlsPanelExpanded,
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
        mocks.visionUnmountStop()
      })
      return () => h('div', { 'data-testid': 'vision-island-stub' }, 'vision')
    },
  }),
}))

vi.mock('../study-island/index.vue', () => ({
  default: defineComponent({
    name: 'StudyIslandStub',
    setup() {
      return () => h('div', { 'data-testid': 'study-island-stub' }, 'study')
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
    setup(_, { attrs }) {
      return () => h('button', { type: 'button', ...attrs }, 'fade')
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
    app,
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

function findToggleButton(container: HTMLElement) {
  const button = container.querySelector('[data-testid="controls-toggle-button"]') as HTMLButtonElement | null
  if (!button)
    throw new Error('controls toggle button missing')
  return button
}

describe('controls island vision panel interaction flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.isOutside = ref(false)
    mocks.moveModeEnabled = ref(false)
    mocks.controlsUIMode = ref<'novice' | 'expert'>('novice')
    mocks.controlsPanelExpanded = ref(false)
    mocks.visionUnmountStop.mockReset()
    mocks.openSettings.mockReset()
    mocks.openChat.mockReset()
    mocks.closeWindow.mockReset()
    mocks.setAlwaysOnTop.mockReset()
    mocks.startDraggingWindow.mockReset()
    mocks.toggleMoveMode.mockReset()
    mocks.toggleControlsUIMode.mockReset()
    mocks.toggleControlsPanel.mockReset()
    mocks.setControlsPanelExpanded.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps controls panel expanded after mouse leaves and timer advances', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findToggleButton(container)
    expect(expandButton.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(expandButton.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.collapse')
    expect(mocks.controlsPanelExpanded.value).toBe(true)

    const cameraButton = findButtonByTooltipText(container, 'tamagotchi.stage.controls-island.vision-panel.expand')
    cameraButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-window-grid"]')).not.toBeNull()

    mocks.isOutside.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(2_100)
    await nextTick()
    expect(mocks.controlsPanelExpanded.value).toBe(true)
    await vi.advanceTimersByTimeAsync(5_000)
    await nextTick()
    expect(mocks.controlsPanelExpanded.value).toBe(true)
    await vi.advanceTimersByTimeAsync(10_000)
    await nextTick()

    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()
    expect(mocks.controlsPanelExpanded.value).toBe(true)
    expect(mocks.setControlsPanelExpanded).toHaveBeenCalledTimes(0)
    expect(mocks.visionUnmountStop).toHaveBeenCalledTimes(0)
    expect(mocks.closeWindow).toHaveBeenCalledTimes(0)

    unmount()
  })

  it('does not auto collapse when move mode is active and pointer is outside', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findToggleButton(container)
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.controlsPanelExpanded.value).toBe(true)

    const moveModeButton = container.querySelector('[data-testid="controls-move-mode-toggle"]') as HTMLButtonElement | null
    if (!moveModeButton)
      throw new Error('move mode button missing')
    moveModeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.moveModeEnabled.value).toBe(true)

    mocks.isOutside.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(10_000)
    await nextTick()

    expect(mocks.controlsPanelExpanded.value).toBe(true)
    expect(mocks.setControlsPanelExpanded).toHaveBeenCalledTimes(0)
    expect(mocks.visionUnmountStop).toHaveBeenCalledTimes(0)

    unmount()
  })

  it('keeps vision runtime mounted when collapsing controls drawer manually', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findToggleButton(container)
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const cameraButton = findButtonByTooltipText(container, 'tamagotchi.stage.controls-island.vision-panel.expand')
    cameraButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()

    const collapseButton = findToggleButton(container)
    collapseButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(container.querySelector('[data-testid="vision-island-stub"]')).not.toBeNull()
    expect(mocks.visionUnmountStop).toHaveBeenCalledTimes(0)

    unmount()
  })
})
