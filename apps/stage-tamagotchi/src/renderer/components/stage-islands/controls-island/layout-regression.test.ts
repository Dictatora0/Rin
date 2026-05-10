// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, onBeforeUnmount, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  return {
    isOutside: { value: false } as { value: boolean },
    moveModeEnabled: { value: false } as { value: boolean },
    controlsPanelExpanded: { value: false } as { value: boolean },
    visionPanelUnmounted: vi.fn(),
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

function findToggleButton(container: HTMLElement) {
  const button = container.querySelector('[data-testid="controls-toggle-button"]') as HTMLButtonElement | null
  if (!button)
    throw new Error('controls toggle button missing')
  return button
}

describe('controls island layout regression locks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.isOutside = ref(false)
    mocks.moveModeEnabled = ref(false)
    mocks.controlsPanelExpanded = ref(false)
    mocks.visionPanelUnmounted.mockReset()
    mocks.openSettings.mockReset()
    mocks.openChat.mockReset()
    mocks.closeWindow.mockReset()
    mocks.setAlwaysOnTop.mockReset()
    mocks.startDraggingWindow.mockReset()
    mocks.toggleMoveMode.mockReset()
    mocks.toggleControlsPanel.mockReset()
    mocks.setControlsPanelExpanded.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps controls island in floating controls layer outside faded stage container', () => {
    const pageSource = readFileSync(resolve(process.cwd(), 'src/renderer/pages/index.vue'), 'utf8')
    const controlsSource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-islands/controls-island/index.vue'), 'utf8')
    expect(pageSource).toContain('data-control-layer="floating-controls-layer"')
    expect(pageSource).toContain('pointer-events-none fixed inset-0 z-[170]')
    expect(pageSource).toContain('[-webkit-app-region:no-drag]')
    expect(pageSource).toMatch(/data-control-layer="floating-controls-layer"[\s\S]*?<ControlsIsland[\s\S]*?ref="controlsIslandRef"/)
    expect(pageSource).not.toContain('<ControlAnchor')
    expect(pageSource).not.toContain('controls-emergency-anchor')
    expect(pageSource).not.toContain('controlAnchorRef')
    expect(controlsSource).toContain('data-testid="controls-panel-viewport"')
    expect(controlsSource).toContain('data-controls-panel-scroll')
    expect(controlsSource).toContain('max-h-full overflow-y-auto overscroll-contain')

    const fadedStart = pageSource.indexOf('shouldFadeOnCursorWithin ? \'op-0\' : \'op-100\'')
    const loadingSection = pageSource.indexOf('<!-- Loading overlay sits on top, does not hide the stage -->')
    expect(fadedStart).toBeGreaterThan(-1)
    expect(loadingSection).toBeGreaterThan(fadedStart)
    const fadedContainerSegment = pageSource.slice(fadedStart, loadingSection)
    expect(fadedContainerSegment).not.toContain('<ControlsIsland')
  })

  it('keeps top grid structure and button count stable after opening vision panel', async () => {
    const { container, unmount } = mountControlsIsland()

    const expandButton = findToggleButton(container)
    expect(expandButton.className).toContain('controls-toggle-button')
    expect(expandButton.className).toContain('pointer-events-auto')
    expect(expandButton.className).toContain('[-webkit-app-region:no-drag]')
    expect(expandButton.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')
    expect(expandButton.getAttribute('data-testid')).toBe('controls-toggle-button')
    expandButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(expandButton.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.collapse')
    expect(mocks.toggleControlsPanel).toHaveBeenCalledTimes(1)
    expect(mocks.controlsPanelExpanded.value).toBe(true)

    const topGrid = container.querySelector('[data-testid="controls-top-grid"]') as HTMLDivElement | null
    if (!topGrid)
      throw new Error('top grid container missing after expand')

    const root = container.querySelector('[data-testid="controls-island-root"]') as HTMLDivElement | null
    if (!root)
      throw new Error('controls island root missing after expand')
    expect(root.getAttribute('data-control-layer')).toBe('controls-island')
    expect(root.className).toContain('pointer-events-auto')
    expect(root.className).toContain('[-webkit-app-region:no-drag]')

    const topGridButtonsBefore = topGrid.querySelectorAll('button').length
    expect(topGrid.className).toContain('w-max')
    expect(topGrid.className).toContain('self-start')
    expect(topGrid.hasAttribute('grid-cols-3')).toBe(true)
    expect(topGridButtonsBefore).toBe(9)

    const windowGrid = container.querySelector('[data-testid="controls-window-grid"]') as HTMLDivElement | null
    if (!windowGrid)
      throw new Error('window grid container missing after expand')
    expect(windowGrid.hasAttribute('grid-cols-4')).toBe(true)
    const windowGridButtons = Array.from(windowGrid.querySelectorAll('button'))
    expect(windowGridButtons.length).toBe(4)
    for (const button of windowGridButtons) {
      const ariaLabel = button.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }

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

    const expandButton = findToggleButton(container)
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
