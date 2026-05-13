// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyFocusQualityCards from './StudyFocusQualityCards.vue'

function mountCards(entries: Array<{
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
}>, today = {
  todayFocusMinutes: 30,
  todayFocusSessions: 1,
  todayInterruptCount: 2,
}) {
  const host = defineComponent({
    setup() {
      return () => h(StudyFocusQualityCards, {
        entries,
        ...today,
      })
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

describe('studyFocusQualityCards', () => {
  it('shows empty state when there is no quality data', async () => {
    const { container, unmount } = mountCards([
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    ], {
      todayFocusMinutes: 0,
      todayFocusSessions: 0,
      todayInterruptCount: 0,
    })

    await nextTick()

    expect(container.textContent).toContain('专注质量概览')
    expect(container.textContent).toContain('还没有足够的专注数据')
    expect(container.querySelector('[data-testid="study-focus-quality-empty"]')).not.toBeNull()
    expect(container.querySelectorAll('.study-chart-metric-card').length).toBe(0)

    unmount()
  })

  it('renders focus quality summary cards and labels', async () => {
    const { container, unmount } = mountCards([
      { dayKey: '2026-05-01', focusMinutes: 20, focusSessions: 1, completedTasks: 0, interruptCount: 1, createdTasks: 1 },
      { dayKey: '2026-05-02', focusMinutes: 40, focusSessions: 2, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
    ])

    await nextTick()

    expect(container.textContent).toContain('专注质量概览')
    expect(container.textContent).toContain('从轮次、时长和中断理解专注连续性')
    expect(container.textContent).toContain('完成轮次')
    expect(container.textContent).toContain('累计分钟')
    expect(container.textContent).toContain('今日中断')
    expect(container.textContent).toContain('平均每轮')
    expect(container.textContent).toContain('阶段性投入时间')
    expect(container.textContent).toContain('专注轮次越稳定，学习节奏越清晰')
    expect(container.querySelector('[data-testid="study-focus-quality-empty"]')).toBeNull()
    expect(container.querySelectorAll('.study-focus-quality-item').length).toBe(4)
    expect(container.querySelectorAll('.study-chart-metric-card').length).toBe(4)
    expect(container.querySelectorAll('.study-chart-metric-value').length).toBe(4)
    expect(container.querySelector('.study-chart-card')).not.toBeNull()

    unmount()
  })
})
