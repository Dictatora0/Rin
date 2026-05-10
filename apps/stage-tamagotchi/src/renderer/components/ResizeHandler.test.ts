// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, ref } from 'vue'

import ResizeHandler from './ResizeHandler.vue'

const mocks = vi.hoisted(() => {
  return {
    isWindows: true,
    routeMeta: { layout: 'stage' as string | undefined },
    handleResizeStart: vi.fn(),
  }
})

vi.mock('@proj-airi/electron-vueuse', () => ({
  useElectronEventaInvoke: () => () => mocks.isWindows,
  useElectronWindowResize: () => ({
    handleResizeStart: mocks.handleResizeStart,
  }),
}))

vi.mock('@proj-airi/electron-eventa', () => ({
  electron: {
    app: {
      isWindows: {},
    },
  },
}))

vi.mock('@vueuse/core', () => ({
  useAsyncState: (loader: () => boolean, fallback: boolean) => ({
    state: ref(loader() ?? fallback),
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: mocks.routeMeta,
  }),
}))

function mountResizeHandler() {
  const host = defineComponent({
    setup() {
      return () => h(ResizeHandler)
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

describe('resize handler', () => {
  beforeEach(() => {
    mocks.isWindows = true
    mocks.routeMeta.layout = 'stage'
    mocks.handleResizeStart.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders 8 directional handles with stable test ids', () => {
    const { container, unmount } = mountResizeHandler()
    const expectedDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

    for (const direction of expectedDirections) {
      const handle = container.querySelector(`[data-testid="resize-handle-${direction}"]`)
      expect(handle).not.toBeNull()
    }

    unmount()
  })

  it('enables stage-enhanced heat zone only on stage layout', () => {
    const { container, unmount } = mountResizeHandler()
    const root = container.querySelector('[data-testid="resize-handles-root"]') as HTMLDivElement | null
    expect(root).not.toBeNull()
    expect(root?.className).toContain('resize-handles-stage')
    unmount()
  })

  it('does not render on non-windows platform', () => {
    mocks.isWindows = false
    const { container, unmount } = mountResizeHandler()
    expect(container.querySelector('[data-testid="resize-handles-root"]')).toBeNull()
    unmount()
  })
})
