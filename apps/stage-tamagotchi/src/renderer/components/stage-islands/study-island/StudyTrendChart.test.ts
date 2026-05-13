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
    expect(container.textContent).toContain('用连续趋势理解专注投入变化')
    expect(container.textContent).toContain('还没有足够的历史数据')
    expect(container.querySelector('[data-testid="study-trend-svg"]')).toBeNull()
    expect(container.querySelector('.study-chart-card')).not.toBeNull()
    expect(container.querySelector('.study-chart-title')?.textContent).toContain('最近 14 天学习趋势')
    expect(container.querySelector('.study-chart-subtitle')?.textContent).toContain('用连续趋势理解专注投入变化')

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

    expect(svg.querySelector('[data-testid="study-trend-line"]')).not.toBeNull()
    expect(svg.querySelector('[data-testid="study-trend-area"]')).not.toBeNull()
    expect(svg.querySelector('#study-trend-area-gradient')).not.toBeNull()
    expect(svg.querySelector('[data-testid="study-trend-gradient-start"]')).not.toBeNull()
    expect(svg.querySelector('[data-testid="study-trend-gradient-end"]')).not.toBeNull()
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0)
    expect(svg.getAttribute('aria-label')).toBe('最近 14 天学习趋势图')
    expect(container.textContent).toContain('专注分钟')
    expect(container.textContent).toContain('近 14 天累计')
    expect(container.textContent).toContain('最高单日')
    expect(container.querySelector('.study-chart-legend')).not.toBeNull()
    expect(container.querySelector('.study-chart-caption')).not.toBeNull()
    expect(container.querySelector('.study-chart-card')).not.toBeNull()

    unmount()
  })
})
