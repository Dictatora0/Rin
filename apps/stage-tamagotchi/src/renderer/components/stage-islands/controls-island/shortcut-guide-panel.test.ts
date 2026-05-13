// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import ShortcutGuidePanel from './shortcut-guide-panel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (value: string) => value,
  }),
}))

function mountPanel() {
  const host = defineComponent({
    setup() {
      return () => h(ShortcutGuidePanel)
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

describe('shortcut guide panel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders macOS-focused title/subtitle sections and keycaps', async () => {
    const { container, unmount } = mountPanel()
    await nextTick()

    const panel = container.querySelector('[data-testid="shortcut-guide-panel"]')
    if (!panel)
      throw new Error('shortcut guide panel missing')

    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.subtitle')

    const sections = container.querySelectorAll('[data-testid="shortcut-guide-section"]')
    expect(sections.length).toBe(5)
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.controls.title')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.rin.title')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.desktop.title')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.study-vision.title')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.panel.help.title')

    const keycaps = Array.from(container.querySelectorAll('[data-testid="shortcut-keycap"]')).map(node => node.textContent ?? '')
    expect(keycaps).toContain('⌘')
    expect(keycaps).toContain('⇧')
    expect(keycaps).toContain('Plus')
    expect(keycaps).toContain('-')
    expect(keycaps).toContain('0')
    expect(keycaps).toContain('M')
    expect(keycaps).toContain('T')
    expect(keycaps).toContain('V')
    expect(keycaps).toContain('K')
    expect(keycaps).toContain('Esc')

    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.rin-scale-up')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.rin-scale-down')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.rin-scale-reset')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.toggle-move-mode')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.toggle-study-panel')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.toggle-vision-panel')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.open-shortcuts-guide')
    expect(panel.textContent).toContain('tamagotchi.stage.controls-island.shortcuts.escape-action')

    expect(panel.textContent).not.toContain('⌘⇧C')

    unmount()
  })
})
