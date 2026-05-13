// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyTrendChart from './StudyTrendChart.vue'

function mountTrendChart(entries: Array<{
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyTrendChart, { entries })
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

describe('studyTrendChart', () => {
  it('shows empty state when trend data is missing', async () => {
    const { container, unmount } = mountTrendChart([
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    ])

    await nextTick()

    expect(container.textContent).toContain('最近 14 天学习趋势')
    expect(container.textContent).toContain('还没有足够的历史数据')
    expect(container.querySelector('[data-testid="study-trend-svg"]')).toBeNull()

    unmount()
  })

  it('renders svg line/area chart when trend data exists', async () => {
    const { container, unmount } = mountTrendChart([
      { dayKey: '2026-05-01', focusMinutes: 10, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-02', focusMinutes: 30, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-03', focusMinutes: 20, focusSessions: 1, completedTasks: 1, interruptCount: 1, createdTasks: 1 },
      { dayKey: '2026-05-04', focusMinutes: 40, focusSessions: 2, completedTasks: 2, interruptCount: 0, createdTasks: 2 },
      { dayKey: '2026-05-05', focusMinutes: 25, focusSessions: 1, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-06', focusMinutes: 45, focusSessions: 2, completedTasks: 2, interruptCount: 1, createdTasks: 2 },
      { dayKey: '2026-05-07', focusMinutes: 35, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
    ])

    await nextTick()

    const svg = container.querySelector('[data-testid="study-trend-svg"]')
    if (!svg)
      throw new Error('trend svg missing')

    expect(svg.querySelectorAll('polyline').length).toBe(1)
    expect(svg.querySelectorAll('polygon').length).toBe(1)
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0)

    unmount()
  })
})
