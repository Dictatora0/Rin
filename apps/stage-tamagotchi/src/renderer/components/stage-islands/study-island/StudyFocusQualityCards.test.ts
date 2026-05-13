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
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyFocusQualityCards, {
        entries,
        todayFocusMinutes: 30,
        todayFocusSessions: 1,
        todayInterruptCount: 2,
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
    expect(container.textContent).toContain('2')
    expect(container.querySelectorAll('.study-focus-quality-item').length).toBe(4)
    expect(container.querySelector('.study-chart-card')).not.toBeNull()

    unmount()
  })
})
