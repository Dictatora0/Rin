// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyHistoryChart from './StudyHistoryChart.vue'

function mountChart(entries: Array<{
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyHistoryChart, { entries })
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

describe('studyHistoryChart', () => {
  it('shows empty state when history has no focus data', async () => {
    const { container, unmount } = mountChart([
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-03', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-04', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-05', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-06', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-07', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    ])

    await nextTick()

    expect(container.textContent).toContain('还没有足够的历史数据')
    expect(container.querySelector('[data-testid="study-history-bar-chart"]')).toBeNull()

    unmount()
  })

  it('renders bar chart with history entries and day labels', async () => {
    const { container, unmount } = mountChart([
      { dayKey: '2026-05-01', focusMinutes: 10, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-02', focusMinutes: 20, focusSessions: 1, completedTasks: 0, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-03', focusMinutes: 35, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-04', focusMinutes: 15, focusSessions: 1, completedTasks: 0, interruptCount: 1, createdTasks: 1 },
      { dayKey: '2026-05-05', focusMinutes: 30, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 2 },
      { dayKey: '2026-05-06', focusMinutes: 25, focusSessions: 1, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
      { dayKey: '2026-05-07', focusMinutes: 40, focusSessions: 2, completedTasks: 2, interruptCount: 0, createdTasks: 2 },
    ])

    await nextTick()

    const chart = container.querySelector('[data-testid="study-history-bar-chart"]')
    if (!chart)
      throw new Error('chart not found')

    expect(chart.querySelectorAll('div[title]').length).toBe(7)
    expect(container.textContent).toContain('最近 7 天专注')

    unmount()
  })
})
