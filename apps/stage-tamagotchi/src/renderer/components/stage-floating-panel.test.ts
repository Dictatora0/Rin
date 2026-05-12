// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StageFloatingPanel from './stage-floating-panel.vue'

function mountFloatingPanel(panelKind: 'study' | 'vision', title: string) {
  const close = vi.fn()
  const host = defineComponent({
    setup() {
      return () => h(StageFloatingPanel, {
        panelKind,
        title,
        onClose: close,
      }, {
        default: () => h('div', { 'data-testid': 'panel-slot-content' }, `slot-${panelKind}`),
      })
    },
  })

  const app = createApp(host)
  const container = document.createElement('div')
  document.body.appendChild(container)
  app.mount(container)
  return {
    container,
    close,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('stage floating panel shell', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders fixed pointer-enabled no-drag shell with title and close button', async () => {
    const { container, close, unmount } = mountFloatingPanel('study', '学习陪伴')
    await nextTick()

    const panel = container.querySelector('[data-testid="stage-floating-panel"]') as HTMLElement | null
    if (!panel)
      throw new Error('floating panel missing')
    expect(panel.getAttribute('data-panel-kind')).toBe('study')
    expect(panel.className).toContain('fixed')
    expect(panel.className).toContain('pointer-events-auto')
    expect(panel.className).toContain('[-webkit-app-region:no-drag]')
    expect(panel.className).toContain('z-[185]')
    expect(panel.className).toContain('w-[clamp(23.75rem,34vw,27.5rem)]')
    expect(panel.getAttribute('style') ?? '').toContain('max-width: calc(100vw - 32px);')

    expect(panel.textContent).toContain('学习陪伴')

    const closeButton = panel.querySelector('[data-testid="stage-floating-panel-close-button"]') as HTMLButtonElement | null
    if (!closeButton)
      throw new Error('close button missing')
    expect(closeButton.getAttribute('aria-label')).toBe('关闭学习陪伴')
    expect(closeButton.getAttribute('title')).toBe('关闭学习陪伴')
    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(close).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('keeps a scrollable content region and wider vision layout', async () => {
    const { container, unmount } = mountFloatingPanel('vision', '视觉感知')
    await nextTick()

    const panel = container.querySelector('[data-testid="stage-floating-panel"]') as HTMLElement | null
    if (!panel)
      throw new Error('floating panel missing')
    expect(panel.getAttribute('data-panel-kind')).toBe('vision')
    expect(panel.className).toContain('w-[clamp(27.5rem,44vw,35rem)]')

    const content = panel.querySelector('[data-testid="stage-floating-panel-content"]') as HTMLElement | null
    if (!content)
      throw new Error('floating panel content area missing')
    expect(content.className).toContain('overflow-y-auto')
    expect(content.className).toContain('overscroll-contain')
    expect(content.querySelector('[data-testid="panel-slot-content"]')).not.toBeNull()

    const card = content.parentElement as HTMLElement | null
    if (!card)
      throw new Error('floating panel card missing')
    expect(card.getAttribute('style') ?? '').toContain('max-height: min(80vh, 720px);')

    unmount()
  })

  it('keeps floating panel z-index above stage move overlay layer', () => {
    const floatingPanelSource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-floating-panel.vue'), 'utf8')
    const moveOverlaySource = readFileSync(resolve(process.cwd(), 'src/renderer/components/stage-move-overlay.vue'), 'utf8')

    expect(floatingPanelSource).toContain('z-[185]')
    expect(moveOverlaySource).toContain('z-30')
  })
})
