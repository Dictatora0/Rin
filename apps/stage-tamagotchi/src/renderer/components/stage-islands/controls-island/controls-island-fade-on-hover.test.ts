// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import ControlsIslandFadeOnHover from './controls-island-fade-on-hover.vue'

const mocks = vi.hoisted(() => {
  return {
    fadeOnHoverEnabled: { value: false } as { value: boolean },
    dontShowItAgainNoticeFadeOnHover: { value: false } as { value: boolean },
    enableFadeOnHover: vi.fn(() => {
      mocks.fadeOnHoverEnabled.value = true
    }),
    disableFadeOnHover: vi.fn(() => {
      mocks.fadeOnHoverEnabled.value = false
    }),
    requestNotice: vi.fn(async () => true),
  }
})

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (value: string) => value,
  }),
}))

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: () => mocks.requestNotice,
}))

vi.mock('../../../../shared/eventa', () => ({
  noticeWindowEventa: {
    openWindow: { __eventName: 'noticeWindowOpen' },
  },
}))

vi.mock('../../../stores/controls-island', () => ({
  useControlsIslandStore: () => ({
    fadeOnHoverEnabled: mocks.fadeOnHoverEnabled,
    dontShowItAgainNoticeFadeOnHover: mocks.dontShowItAgainNoticeFadeOnHover,
    enableFadeOnHover: mocks.enableFadeOnHover,
    disableFadeOnHover: mocks.disableFadeOnHover,
  }),
}))

vi.mock('./control-button-tooltip.vue', () => ({
  default: defineComponent({
    name: 'ControlButtonTooltipStub',
    setup(_, { slots }) {
      return () => h('div', [
        slots.default?.(),
        h('span', { class: 'tooltip-text' }, slots.tooltip?.()),
      ])
    },
  }),
}))

function mountFadeControl() {
  const host = defineComponent({
    setup() {
      return () => h(ControlsIslandFadeOnHover)
    },
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp(host)
  app.mount(container)

  return {
    container,
    unmount: () => {
      app.unmount()
      container.remove()
    },
  }
}

async function clickToggle(container: HTMLElement) {
  const toggle = container.querySelector('[data-testid="controls-fade-on-hover-toggle"]') as HTMLButtonElement | null
  if (!toggle)
    throw new Error('fade-on-hover toggle not found')
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await nextTick()
  await Promise.resolve()
}

describe('controls-island-fade-on-hover', () => {
  beforeEach(() => {
    mocks.fadeOnHoverEnabled.value = false
    mocks.dontShowItAgainNoticeFadeOnHover.value = false
    mocks.enableFadeOnHover.mockClear()
    mocks.disableFadeOnHover.mockClear()
    mocks.requestNotice.mockReset()
    mocks.requestNotice.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('enables fade immediately when notice can be skipped', async () => {
    mocks.dontShowItAgainNoticeFadeOnHover.value = true
    const { container, unmount } = mountFadeControl()

    await clickToggle(container)

    expect(mocks.enableFadeOnHover).toHaveBeenCalledTimes(1)
    expect(mocks.requestNotice).toHaveBeenCalledTimes(0)
    unmount()
  })

  it('enables fade after user acknowledges the notice window', async () => {
    const { container, unmount } = mountFadeControl()

    await clickToggle(container)

    expect(mocks.requestNotice).toHaveBeenCalledTimes(1)
    expect(mocks.requestNotice).toHaveBeenCalledWith({
      id: 'fade-on-hover',
      route: '/notice/fade-on-hover',
      type: 'fade-on-hover',
    })
    expect(mocks.enableFadeOnHover).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('falls back to enabling fade when notice window opening fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.requestNotice.mockRejectedValueOnce(new Error('notice window failed'))
    const { container, unmount } = mountFadeControl()

    await clickToggle(container)

    expect(mocks.requestNotice).toHaveBeenCalledTimes(1)
    expect(mocks.enableFadeOnHover).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('disables fade when toggle is already enabled', async () => {
    mocks.fadeOnHoverEnabled.value = true
    const { container, unmount } = mountFadeControl()

    await clickToggle(container)

    expect(mocks.disableFadeOnHover).toHaveBeenCalledTimes(1)
    expect(mocks.requestNotice).toHaveBeenCalledTimes(0)
    unmount()
  })
})
