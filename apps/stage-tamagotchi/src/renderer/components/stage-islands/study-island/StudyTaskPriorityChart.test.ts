// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

import StudyTaskPriorityChart from './StudyTaskPriorityChart.vue'

function mountChart(tasks: Array<{
  id: string
  title: string
  done: boolean
  createdAt: string
  priority: 'high' | 'medium' | 'low'
}>) {
  const host = defineComponent({
    setup() {
      return () => h(StudyTaskPriorityChart, { tasks })
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

describe('studyTaskPriorityChart', () => {
  it('shows empty state when task list is empty', async () => {
    const { container, unmount } = mountChart([])
    await nextTick()

    expect(container.textContent).toContain('任务优先级分布')
    expect(container.textContent).toContain('观察高/中/低优先级任务的完成进度')
    expect(container.textContent).toContain('还没有任务数据')
    expect(container.querySelectorAll('[data-testid="study-task-priority-bar"]').length).toBe(0)
    expect(container.querySelector('.study-chart-card')).not.toBeNull()

    unmount()
  })

  it('renders high/medium/low rows and counts', async () => {
    const { container, unmount } = mountChart([
      { id: 'task-1', title: 'task-1', done: false, createdAt: '2026-05-01T08:00:00.000Z', priority: 'high' },
      { id: 'task-2', title: 'task-2', done: true, createdAt: '2026-05-01T09:00:00.000Z', priority: 'medium' },
      { id: 'task-3', title: 'task-3', done: false, createdAt: '2026-05-01T10:00:00.000Z', priority: 'low' },
    ])
    await nextTick()

    expect(container.textContent).toContain('高优先级')
    expect(container.textContent).toContain('中优先级')
    expect(container.textContent).toContain('低优先级')
    expect(container.querySelectorAll('[data-testid="study-task-priority-bar"]').length).toBe(3)
    expect(container.querySelectorAll('.study-chart-legend-dot').length).toBe(3)
    expect(container.textContent).toContain('还有 1 个高优先级任务')
    expect(container.querySelector('[data-testid="study-task-priority-high-pending"]')).not.toBeNull()

    unmount()
  })
})
