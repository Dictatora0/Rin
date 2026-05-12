// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyHeatmap from './StudyHeatmap.vue'

function mountHeatmap(entries: Array<{
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyHeatmap, { entries })
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

describe('studyHeatmap', () => {
  it('shows empty state when no history data is available', async () => {
    const { container, unmount } = mountHeatmap([
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    ])

    await nextTick()

    expect(container.textContent).toContain('暂无历史数据')
    expect(container.querySelector('[data-testid="study-history-heatmap"]')).toBeNull()

    unmount()
  })

  it('renders date cells with titles when data exists', async () => {
    const { container, unmount } = mountHeatmap([
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 10, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-03', focusMinutes: 20, focusSessions: 1, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-04', focusMinutes: 30, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 2 },
      { dayKey: '2026-05-05', focusMinutes: 40, focusSessions: 2, completedTasks: 2, interruptCount: 1, createdTasks: 2 },
      { dayKey: '2026-05-06', focusMinutes: 15, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-07', focusMinutes: 8, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
    ])

    await nextTick()

    const heatmap = container.querySelector('[data-testid="study-history-heatmap"]')
    if (!heatmap)
      throw new Error('heatmap not found')

    expect(heatmap.querySelectorAll('div[title]').length).toBe(7)
    expect(container.textContent).toContain('学习热力图')

    unmount()
  })
})
