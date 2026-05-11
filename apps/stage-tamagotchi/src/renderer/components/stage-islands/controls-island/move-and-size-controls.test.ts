// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import ControlsIsland from './index.vue'

const mocks = vi.hoisted(() => {
  return {
    moveModeEnabled: { value: false } as { value: boolean },
    controlsPanelExpanded: { value: false } as { value: boolean },
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
      return () => h('button', {
        'type': 'button',
        ...attrs,
        'data-testid': 'controls-fade-on-hover-toggle',
        'aria-label': 'tamagotchi.stage.controls-island.fade-on-hover.enable',
        'title': 'tamagotchi.stage.controls-island.fade-on-hover.enable',
        'class': '[-webkit-app-region:no-drag] pointer-events-auto',
      }, 'fade')
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
  const button = container.querySelector('[data-testid="controls-toggle-button"]') as HTMLButtonElement | null
  if (!button)
    throw new Error('controls toggle button not found')
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('controls island move mode and size controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.isOutside = ref(false)
    mocks.moveModeEnabled = ref(false)
    mocks.controlsPanelExpanded = ref(false)
    mocks.openSettings.mockReset()
    mocks.openChat.mockReset()
    mocks.closeWindow.mockReset()
    mocks.setAlwaysOnTop.mockReset()
    mocks.startDraggingWindow.mockReset()
    mocks.getBounds.mockClear()
    mocks.setBounds.mockClear()
    mocks.getPrimaryDisplay.mockClear()
    mocks.toggleMoveMode.mockClear()
    mocks.toggleControlsPanel.mockClear()
    mocks.setControlsPanelExpanded.mockClear()
    mocks.unknownEvents.length = 0
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('toggles move mode through controls button', async () => {
    const { container, unmount } = mountControlsIsland()
    const togglePanelButton = container.querySelector('[data-testid="controls-toggle-button"]') as HTMLButtonElement | null
    expect(togglePanelButton).not.toBeNull()
    expect(togglePanelButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')
    expect(togglePanelButton?.getAttribute('data-testid')).toBe('controls-toggle-button')

    clickExpand(container)
    await nextTick()
    expect(togglePanelButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.collapse')
    expect(mocks.controlsPanelExpanded.value).toBe(true)
    expect(mocks.toggleControlsPanel).toHaveBeenCalledTimes(1)

    const controlsRoot = container.querySelector('[data-testid="controls-island-root"]') as HTMLDivElement | null
    expect(controlsRoot).not.toBeNull()
    expect(controlsRoot?.className).toContain('controls-island-root')
    expect(controlsRoot?.className).toContain('z-120')
    expect(controlsRoot?.className).toContain('pointer-events-auto')
    expect(controlsRoot?.className).toContain('[-webkit-app-region:no-drag]')
    expect(controlsRoot?.getAttribute('data-control-layer')).toBe('controls-island')
    const controlsPanelScrollContainer = container.querySelector('[data-controls-panel-scroll]') as HTMLDivElement | null
    const controlsPanelViewport = container.querySelector('[data-testid="controls-panel-viewport"]') as HTMLDivElement | null
    expect(controlsPanelViewport).not.toBeNull()
    expect(controlsPanelViewport?.className).toContain('min-h-0')
    expect(controlsPanelViewport?.className).toContain('flex-1')
    expect(controlsPanelViewport?.className).toContain('items-end')
    expect(controlsPanelScrollContainer).not.toBeNull()
    expect(controlsPanelScrollContainer?.className).toContain('max-h-full')
    expect(controlsPanelScrollContainer?.className).toContain('overflow-y-auto')
    expect(controlsPanelScrollContainer?.className).toContain('overscroll-contain')
    expect(container.querySelector('[data-testid="controls-auth-section"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-group-core"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-group-tools"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-group-window"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-core-grid"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-tools-grid"]')).not.toBeNull()
    expect((container.querySelector('[data-testid="controls-core-grid"]') as HTMLDivElement | null)?.className).toContain('controls-button-grid')
    expect((container.querySelector('[data-testid="controls-tools-grid"]') as HTMLDivElement | null)?.className).toContain('controls-button-grid')
    expect((container.querySelector('[data-testid="controls-window-grid"]') as HTMLDivElement | null)?.className).toContain('controls-button-grid')

    const toggleButton = container.querySelector('[data-testid="controls-move-mode-toggle"]') as HTMLButtonElement | null
    expect(toggleButton).not.toBeNull()
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.move-mode.enable')
    expect(toggleButton?.getAttribute('title')).toBe('tamagotchi.stage.controls-island.move-mode.enable')
    expect(toggleButton?.getAttribute('aria-pressed')).toBe('false')
    expect(toggleButton?.className).toContain('text-neutral-800')
    expect(mocks.moveModeEnabled.value).toBe(false)
    expect(container.querySelector('[data-testid="controls-move-mode-icon"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="controls-move-mode-status"]')).toBeNull()

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleMoveMode).toHaveBeenCalledTimes(1)
    expect(mocks.moveModeEnabled.value).toBe(true)
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.move-mode.disable')
    expect(toggleButton?.getAttribute('title')).toBe('tamagotchi.stage.controls-island.move-mode.disable')
    expect(toggleButton?.getAttribute('aria-pressed')).toBe('true')
    expect(toggleButton?.className).toContain('ring-2')
    const status = container.querySelector('[data-testid="controls-move-mode-status"]')
    expect(status).not.toBeNull()
    expect(status?.textContent).toContain('tamagotchi.stage.controls-island.move-mode.status-on')
    expect(status?.textContent).toContain('tamagotchi.stage.controls-island.move-mode.status-hint')
    expect(container.querySelector('[data-testid="controls-toggle-button"]')).not.toBeNull()

    togglePanelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(togglePanelButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.expand')
    expect(mocks.controlsPanelExpanded.value).toBe(false)

    togglePanelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(togglePanelButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.collapse')
    expect(mocks.controlsPanelExpanded.value).toBe(true)

    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.toggleMoveMode).toHaveBeenCalledTimes(2)
    expect(mocks.moveModeEnabled.value).toBe(false)
    expect(toggleButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.move-mode.enable')
    expect(toggleButton?.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('[data-testid="controls-move-mode-status"]')).toBeNull()

    unmount()
  })

  it('dispatches zoom in, zoom out, and reset size actions', async () => {
    const { container, unmount } = mountControlsIsland()
    clickExpand(container)
    await nextTick()

    const zoomInButton = container.querySelector('[data-testid="controls-zoom-in"]') as HTMLButtonElement | null
    const zoomOutButton = container.querySelector('[data-testid="controls-zoom-out"]') as HTMLButtonElement | null
    const resetButton = container.querySelector('[data-testid="controls-reset-size"]') as HTMLButtonElement | null
    const dragWindowButton = container.querySelector('[data-testid="controls-drag-window"]') as HTMLButtonElement | null
    const closeButton = container.querySelector('[data-testid="controls-close-button"]') as HTMLButtonElement | null
    const windowGrid = container.querySelector('[data-testid="controls-window-grid"]') as HTMLDivElement | null

    expect(windowGrid).not.toBeNull()
    expect(windowGrid?.className).toContain('grid-cols-3')
    expect(windowGrid?.className).toContain('controls-button-grid')
    expect(container.querySelector('[data-testid="controls-window-secondary-grid"]')).toBeNull()
    expect(zoomInButton).not.toBeNull()
    expect(zoomOutButton).not.toBeNull()
    expect(resetButton).not.toBeNull()
    expect(dragWindowButton).not.toBeNull()
    expect(closeButton).not.toBeNull()
    expect(zoomInButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.zoom-in')
    expect(zoomOutButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.zoom-out')
    expect(resetButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.reset-size')
    expect(dragWindowButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.drag-to-move-window')
    expect(closeButton?.getAttribute('aria-label')).toBe('tamagotchi.stage.controls-island.close')

    const clickableButtons = Array.from(windowGrid?.querySelectorAll('button') ?? [])
    expect(clickableButtons.length).toBe(6)
    for (const button of clickableButtons) {
      const ariaLabel = button.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }

    const moveIcon = container.querySelector('[data-testid="controls-move-mode-icon"]') as HTMLDivElement | null
    const dragWindowIcon = container.querySelector('[data-testid="controls-drag-window-icon"]') as HTMLDivElement | null
    const resetIcon = container.querySelector('[data-testid="controls-reset-size-icon"]') as HTMLDivElement | null
    if (!moveIcon || !dragWindowIcon || !resetIcon)
      throw new Error('expected move, drag, and reset icons to exist')
    expect(moveIcon.hasAttribute('i-ph:arrows-out-cardinal')).toBe(true)
    expect(dragWindowIcon.hasAttribute('i-ph:hand-grabbing')).toBe(true)
    expect(resetIcon.hasAttribute('i-ph:arrows-clockwise')).toBe(true)
    expect(dragWindowIcon.hasAttribute('i-ph:arrows-out-cardinal')).toBe(false)
    expect(resetIcon.hasAttribute('i-ph:arrows-out-cardinal')).toBe(false)

    const majorButtons = [
      '[data-testid="controls-open-settings"]',
      '[data-testid="controls-profile-picker"]',
      '[data-testid="controls-open-chat"]',
      '[data-testid="controls-refresh-window"]',
      '[data-testid="controls-theme-toggle"]',
      '[data-testid="controls-always-on-top-toggle"]',
      '[data-testid="controls-hearing-toggle"]',
      '[data-testid="controls-study-toggle"]',
      '[data-testid="controls-vision-toggle"]',
      '[data-testid="controls-move-mode-toggle"]',
      '[data-testid="controls-zoom-in"]',
      '[data-testid="controls-zoom-out"]',
      '[data-testid="controls-reset-size"]',
      '[data-testid="controls-drag-window"]',
      '[data-testid="controls-close-button"]',
    ]

    for (const selector of majorButtons) {
      const button = container.querySelector(selector) as HTMLButtonElement | null
      if (!button)
        throw new Error(`${selector} missing`)
      const ariaLabel = button.getAttribute('aria-label')
      const title = button.getAttribute('title')
      expect(Boolean(ariaLabel) || Boolean(title)).toBe(true)
      expect(button.className).toContain('controls-button')
      expect(button.className).toContain('[-webkit-app-region:no-drag]')
      expect(button.className).toContain('pointer-events-auto')
    }

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

  it('keeps tooltip layering rules above grid buttons', () => {
    const tooltipSource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-islands/controls-island/control-button-tooltip.vue'), 'utf8')
    const controlButtonSource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-islands/controls-island/control-button.vue'), 'utf8')
    const authButtonSource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-islands/controls-island/controls-island-auth-button.vue'), 'utf8')
    expect(tooltipSource).toContain('data-controls-button-wrapper')
    expect(tooltipSource).toContain('focus-within:z-20')
    expect(tooltipSource).toContain('hover:z-20')
    expect(tooltipSource).toContain('data-controls-tooltip')
    expect(tooltipSource).toContain('z-[240] pointer-events-none')
    expect(tooltipSource).toContain('whitespace-nowrap')
    expect(tooltipSource).toContain('triggerClass')
    expect(controlButtonSource).toContain('h-10 w-10')
    expect(controlButtonSource).not.toContain('w-fit flex items-center self-end justify-center')
    expect(authButtonSource).toContain('<ControlButtonTooltip side="left" trigger-class="w-full">')
    expect(authButtonSource).toContain('t(\'tamagotchi.stage.controls-island.account\')')
    expect(authButtonSource).toContain('t(\'tamagotchi.stage.controls-island.login\')')
  })
})
