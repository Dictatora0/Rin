// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyTaskCompletionChart from './StudyTaskCompletionChart.vue'

function mountChart(tasks: Array<{
  id: string
  title: string
  done: boolean
  createdAt: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyTaskCompletionChart, { tasks })
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

describe('studyTaskCompletionChart', () => {
  it('shows empty state when there are no tasks', async () => {
    const { container, unmount } = mountChart([])
    await nextTick()

    expect(container.textContent).toContain('任务完成结构')
    expect(container.textContent).toContain('用完成率和逾期分布观察任务推进情况')
    expect(container.textContent).toContain('还没有任务数据')
    expect(container.querySelector('[data-testid="study-task-completion-donut"]')).toBeNull()
    expect(container.querySelector('.study-chart-card')).not.toBeNull()
    expect(container.querySelector('.study-chart-title')?.textContent).toContain('任务完成结构')
    expect(container.querySelector('.study-chart-subtitle')?.textContent).toContain('用完成率和逾期分布观察任务推进情况')
    unmount()
  })

  it('renders completion rate and breakdown rows', async () => {
    const { container, unmount } = mountChart([
      { id: 'task-1', title: 'task-1', done: true, createdAt: '2026-05-01T08:00:00.000Z', priority: 'high' },
      { id: 'task-2', title: 'task-2', done: false, createdAt: '2026-05-01T09:00:00.000Z', priority: 'medium' },
      { id: 'task-3', title: 'task-3', done: false, createdAt: '2026-05-01T10:00:00.000Z', priority: 'high', dueDate: '2026-04-29' },
    ])
    await nextTick()

    expect(container.querySelector('[data-testid="study-task-completion-donut"]')).not.toBeNull()
    expect(container.textContent).toContain('33%')
    expect(container.textContent).toContain('已完成')
    expect(container.textContent).toContain('未完成')
    expect(container.textContent).toContain('已逾期')
    expect(container.textContent).toContain('高优先级未完成：1 项')
    expect(container.textContent).toContain('完成率')
    expect(container.querySelectorAll('.study-chart-legend-dot').length).toBe(3)
    expect(container.querySelector('.study-chart-legend')).not.toBeNull()
    expect(container.querySelector('.study-chart-pill')?.textContent).toContain('高优先级未完成')
    expect(container.querySelector('.study-chart-card')).not.toBeNull()

    unmount()
  })
})
