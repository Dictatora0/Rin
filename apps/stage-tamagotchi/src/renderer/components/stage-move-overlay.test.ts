// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

import StageMoveOverlay from './stage-move-overlay.vue'

function mountOverlay(props: { enabled: boolean, isLinux: boolean, debug?: boolean }, onStartDrag = vi.fn()) {
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
    })

    expect(container.querySelector('[data-testid="stage-move-overlay"]')).toBeNull()
    expect(container.querySelector('[data-testid="stage-move-hit-area"]')).toBeNull()
    unmount()
  })

  it('renders invisible hit area and emits drag start on non-linux', () => {
    const { container, onStartDrag, unmount } = mountOverlay({
      enabled: true,
      isLinux: false,
    })

    const overlay = container.querySelector('[data-testid="stage-move-overlay"]') as HTMLDivElement | null
    const hitArea = container.querySelector('[data-testid="stage-move-hit-area"]') as HTMLDivElement | null

    expect(overlay).not.toBeNull()
    expect(overlay?.getAttribute('data-control-layer')).toBe('move-overlay')
    expect(hitArea).not.toBeNull()
    expect(overlay?.className).toContain('pointer-events-none')
    expect(overlay?.className).toContain('z-30')
    expect(hitArea?.className).toContain('pointer-events-auto')
    expect(hitArea?.className).toContain('stage-move-hit-area')
    expect(hitArea?.className).not.toContain('drag-region')
    expect(container.textContent).not.toContain('Move mode: drag the stage to reposition Rin')
    expect(container.textContent).not.toContain('移动模式：拖动舞台可重新放置 Rin')

    hitArea?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onStartDrag).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('adds drag-region class on linux path', () => {
    const { container, onStartDrag, unmount } = mountOverlay({
      enabled: true,
      isLinux: true,
    })

    const hitArea = container.querySelector('[data-testid="stage-move-hit-area"]') as HTMLDivElement | null
    expect(hitArea).not.toBeNull()
    expect(hitArea?.className).toContain('drag-region')

    hitArea?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onStartDrag).toHaveBeenCalledTimes(0)

    unmount()
  })

  it('keeps outline hidden unless debug mode is enabled', () => {
    const { container, unmount } = mountOverlay({
      enabled: true,
      isLinux: false,
      debug: false,
    })

    const hitArea = container.querySelector('[data-testid="stage-move-hit-area"]') as HTMLDivElement | null
    expect(hitArea?.className).not.toContain('stage-move-hit-area-debug')
    unmount()
  })
})
