// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

import StageMoveOverlay from './stage-move-overlay.vue'

function mountOverlay(props: { enabled: boolean, isLinux: boolean, hint: string }, onStartDrag = vi.fn()) {
  const host = defineComponent({
    setup() {
      return () => h(StageMoveOverlay, {
        ...props,
        onStartDrag,
      })
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)

  return {
    container,
    onStartDrag,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('stage move overlay', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render draggable layer when move mode is disabled', () => {
    const { container, unmount } = mountOverlay({
      enabled: false,
      isLinux: false,
      hint: 'Move mode',
    })

    expect(container.querySelector('[data-testid="stage-move-overlay"]')).toBeNull()
    unmount()
  })

  it('renders overlay structure and emits drag start on non-linux', () => {
    const { container, onStartDrag, unmount } = mountOverlay({
      enabled: true,
      isLinux: false,
      hint: 'Move mode: drag the stage to reposition Rin',
    })

    const overlay = container.querySelector('[data-testid="stage-move-overlay"]') as HTMLDivElement | null
    const panel = container.querySelector('[data-testid="stage-move-overlay-panel"]') as HTMLDivElement | null

    expect(overlay).not.toBeNull()
    expect(panel).not.toBeNull()
    expect(overlay?.className).toContain('pointer-events-none')
    expect(panel?.className).toContain('pointer-events-auto')
    expect(panel?.className).not.toContain('drag-region')

    panel?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onStartDrag).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('adds drag-region class on linux path', () => {
    const { container, onStartDrag, unmount } = mountOverlay({
      enabled: true,
      isLinux: true,
      hint: 'Move mode: drag the stage to reposition Rin',
    })

    const panel = container.querySelector('[data-testid="stage-move-overlay-panel"]') as HTMLDivElement | null
    expect(panel).not.toBeNull()
    expect(panel?.className).toContain('drag-region')

    panel?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onStartDrag).toHaveBeenCalledTimes(0)

    unmount()
  })
})
