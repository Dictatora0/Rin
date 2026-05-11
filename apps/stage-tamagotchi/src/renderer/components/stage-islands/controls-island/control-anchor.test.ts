// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  return {
    isOutside: { value: false } as { value: boolean },
    moveModeEnabled: { value: false } as { value: boolean },
    controlsPanelExpanded: { value: false } as { value: boolean },
    toggleControlsPanel: vi.fn(() => {
      mocks.controlsPanelExpanded.value = !mocks.controlsPanelExpanded.value
    }),
    setControlsPanelExpanded: vi.fn((expanded: boolean) => {
      mocks.controlsPanelExpanded.value = expanded
    }),
    toggleMoveMode: vi.fn(() => {
      mocks.moveModeEnabled.value = !mocks.moveModeEnabled.value
    }),
    startDraggingWindow: vi.fn(),
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
    controlsPanelExpanded: mocks.controlsPanelExpanded,
    toggleMoveMode: mocks.toggleMoveMode,
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
    refDebounced: <T>(source: { value: T }) => source,
    useIntervalFn: (cb: () => void, interval: number) => {
      const timer = setInterval(cb, interval)
      vue.onBeforeUnmount(() => clearInterval(timer))
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
      return () => h('div')
    },
  }),
}))

vi.mock('../study-island/index.vue', () => ({
  default: defineComponent({
    name: 'StudyIslandStub',
    setup() {
      return () => h('div')
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

describe('controls island anchor behavior', () => {
  beforeEach(() => {
    mocks.isOutside = ref(false)
    mocks.moveModeEnabled = ref(false)
    mocks.controlsPanelExpanded = ref(false)
    mocks.toggleControlsPanel.mockClear()
    mocks.setControlsPanelExpanded.mockClear()
    mocks.toggleMoveMode.mockClear()
    mocks.startDraggingWindow.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps a single always-visible toggle anchor and preserves click behavior', async () => {
    const { container, unmount } = mountControlsIsland()

    const anchor = container.querySelector('[data-testid="controls-anchor"]') as HTMLDivElement | null
    expect(anchor).not.toBeNull()

    const anchorButtons = anchor?.querySelectorAll('button') ?? []
    expect(anchorButtons.length).toBe(1)

    const toggleButton = container.querySelector('[data-testid="controls-toggle-button"]') as HTMLButtonElement | null
    expect(toggleButton).not.toBeNull()
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')
    expect(toggleButton?.getAttribute('title')).toBe('tamagotchi.stage.controls-island.expand')
    expect(toggleButton?.className).toContain('controls-toggle-button')
    expect(toggleButton?.className).toContain('[-webkit-app-region:no-drag]')
    expect(toggleButton?.className).toContain('pointer-events-auto')

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleControlsPanel).toHaveBeenCalledTimes(1)
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.collapse')

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleControlsPanel).toHaveBeenCalledTimes(2)
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')

    unmount()
  })
})
