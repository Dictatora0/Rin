// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import TaskList from './TaskList.vue'

interface MockStudyTask {
  id: string
  title: string
  done: boolean
  createdAt: number
  completedAt?: number
}

const mocks = vi.hoisted(() => ({
  storeState: null as unknown,
}))

function createStoreState(tasks: MockStudyTask[] = []) {
  const persisted = ref({
    tasks: [...tasks],
  })
  const taskTotal = ref(0)
  const taskCompleted = ref(0)
  const taskPending = ref(0)

  function syncTaskCounters() {
    taskTotal.value = persisted.value.tasks.length
    taskCompleted.value = persisted.value.tasks.filter(task => task.done).length
    taskPending.value = taskTotal.value - taskCompleted.value
  }

  function addTask(title: string) {
    const normalized = title.trim()
    if (!normalized)
      return

    persisted.value.tasks = [
      ...persisted.value.tasks,
      {
        id: `task-${Date.now()}`,
        title: normalized,
        done: false,
        createdAt: Date.now(),
      },
    ]
    syncTaskCounters()
  }

  function toggleTaskDone(id: string) {
    persisted.value.tasks = persisted.value.tasks.map((task) => {
      if (task.id !== id)
        return task
      const nextDone = !task.done
      return {
        ...task,
        done: nextDone,
        completedAt: nextDone ? Date.now() : undefined,
      }
    })
    syncTaskCounters()
  }

  function deleteTask(id: string) {
    persisted.value.tasks = persisted.value.tasks.filter(task => task.id !== id)
    syncTaskCounters()
  }

  syncTaskCounters()

  return {
    persisted,
    taskTotal,
    taskCompleted,
    taskPending,
    addTask,
    toggleTaskDone,
    deleteTask,
  }
}

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}))

vi.mock('@proj-airi/stage-ui/stores/modules/study-companion', () => ({
  useStudyCompanionStore: () => mocks.storeState,
}))

function mountTaskList() {
  const host = defineComponent({
    setup() {
      return () => h(TaskList)
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

function findButton(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button'))
    .find(item => item.textContent?.includes(text)) as HTMLButtonElement | undefined

  if (!button)
    throw new Error(`button ${text} not found`)

  return button
}

describe('taskList usability pass', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.storeState = createStoreState([])
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows guided empty state when no tasks are present', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('还没有今日任务')
    expect(text).toContain('添加一个任务，让 Rin 陪你完成它')
    expect(text).toContain('添加')

    unmount()
  })

  it('hides empty state after adding one task', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const input = container.querySelector('input[placeholder="添加今日任务"]') as HTMLInputElement | null
    if (!input)
      throw new Error('task input not found')

    input.value = '写完实验总结'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('写完实验总结')
    expect(text.includes('还没有今日任务')).toBe(false)

    unmount()
  })

  it('shows lightweight completion feedback only for pending -> done transition', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '完成 demo 排练',
        done: false,
        createdAt: 1,
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    findButton(container, '完成').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(container.textContent ?? '').toContain('已完成，做得不错')

    await vi.advanceTimersByTimeAsync(1800)
    await nextTick()

    expect((container.textContent ?? '').includes('已完成，做得不错')).toBe(false)

    findButton(container, '取消完成').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect((container.textContent ?? '').includes('已完成，做得不错')).toBe(false)

    unmount()
  })

  it('does not replay completion feedback for already-completed tasks on initial render', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '已完成任务',
        done: true,
        createdAt: 1,
        completedAt: 2,
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    expect((container.textContent ?? '').includes('已完成，做得不错')).toBe(false)

    unmount()
  })
})
