// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue'

import TaskList from './TaskList.vue'

type MockTaskPriority = 'high' | 'medium' | 'low'
type MockTaskSortMode = 'smart' | 'createdAt' | 'priority' | 'dueDate'

interface MockStudyTask {
  id: string
  title: string
  done: boolean
  createdAt: string
  completedAt?: string
  priority: MockTaskPriority
  dueDate?: string
}

const mocks = vi.hoisted(() => ({
  storeState: null as any,
}))

function sortTasks(tasks: MockStudyTask[], mode: MockTaskSortMode): MockStudyTask[] {
  const copiedTasks = [...tasks]
  copiedTasks.sort((leftTask, rightTask) => {
    if (leftTask.done !== rightTask.done)
      return leftTask.done ? 1 : -1

    if (mode === 'createdAt')
      return new Date(leftTask.createdAt).getTime() - new Date(rightTask.createdAt).getTime()

    const priorityRank: Record<MockTaskPriority, number> = { high: 0, medium: 1, low: 2 }
    const comparePriority = priorityRank[leftTask.priority] - priorityRank[rightTask.priority]

    if (mode === 'priority') {
      if (comparePriority !== 0)
        return comparePriority
      return new Date(leftTask.createdAt).getTime() - new Date(rightTask.createdAt).getTime()
    }

    const compareDueDate = (() => {
      if (leftTask.dueDate && rightTask.dueDate)
        return leftTask.dueDate.localeCompare(rightTask.dueDate)
      if (leftTask.dueDate)
        return -1
      if (rightTask.dueDate)
        return 1
      return 0
    })()

    if (mode === 'dueDate') {
      if (compareDueDate !== 0)
        return compareDueDate
      return new Date(leftTask.createdAt).getTime() - new Date(rightTask.createdAt).getTime()
    }

    if (comparePriority !== 0)
      return comparePriority
    if (compareDueDate !== 0)
      return compareDueDate
    return new Date(leftTask.createdAt).getTime() - new Date(rightTask.createdAt).getTime()
  })
  return copiedTasks
}

function createStoreState(tasks: MockStudyTask[] = []) {
  const persisted = ref({
    tasks: [...tasks],
  })
  const taskSortMode = ref<MockTaskSortMode>('smart')
  const sortedTasks = computed(() => sortTasks(persisted.value.tasks, taskSortMode.value))
  const taskTotal = computed(() => persisted.value.tasks.length)
  const taskCompleted = computed(() => persisted.value.tasks.filter(task => task.done).length)
  const taskPending = computed(() => taskTotal.value - taskCompleted.value)

  function addTask(payload: string | { title: string, priority?: MockTaskPriority, dueDate?: string }) {
    const normalizedPayload = typeof payload === 'string' ? { title: payload } : payload
    const normalizedTitle = normalizedPayload.title.trim()
    if (!normalizedTitle)
      return

    persisted.value.tasks = [
      ...persisted.value.tasks,
      {
        id: `task-${Date.now()}`,
        title: normalizedTitle,
        done: false,
        createdAt: new Date(Date.now()).toISOString(),
        priority: normalizedPayload.priority ?? 'medium',
        dueDate: normalizedPayload.dueDate,
      },
    ]
  }

  function toggleTaskDone(id: string) {
    persisted.value.tasks = persisted.value.tasks.map((task) => {
      if (task.id !== id)
        return task
      const nextDone = !task.done
      return {
        ...task,
        done: nextDone,
        completedAt: nextDone ? new Date(Date.now()).toISOString() : undefined,
      }
    })
  }

  function deleteTask(id: string) {
    persisted.value.tasks = persisted.value.tasks.filter(task => task.id !== id)
  }

  function setTaskPriority(taskId: string, priority: MockTaskPriority) {
    persisted.value.tasks = persisted.value.tasks.map(task => task.id === taskId ? { ...task, priority } : task)
  }

  function setTaskDueDate(taskId: string, dueDate: string | null) {
    persisted.value.tasks = persisted.value.tasks.map(task => task.id === taskId
      ? {
          ...task,
          dueDate: dueDate || undefined,
        }
      : task)
  }

  function setTaskSortMode(mode: MockTaskSortMode) {
    taskSortMode.value = mode
  }

  return {
    persisted,
    taskSortMode,
    sortedTasks,
    taskTotal,
    taskCompleted,
    taskPending,
    addTask,
    toggleTaskDone,
    deleteTask,
    setTaskPriority,
    setTaskDueDate,
    setTaskSortMode,
  }
}

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>()
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  }
})

vi.mock('@proj-airi/stage-ui/stores/modules/study-companion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@proj-airi/stage-ui/stores/modules/study-companion')>()
  return {
    ...actual,
    useStudyCompanionStore: () => mocks.storeState,
  }
})

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
    vi.setSystemTime(new Date('2026-05-06T12:00:00.000Z'))
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
    expect(text).toContain('添加任务')

    unmount()
  })

  it('shows clear labels for priority and due date fields in task create form', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const priorityLabel = container.querySelector('label[for="task-priority-input"]') as HTMLLabelElement | null
    const dueDateLabel = container.querySelector('label[for="task-due-date-input"]') as HTMLLabelElement | null
    if (!priorityLabel || !dueDateLabel)
      throw new Error('create form labels not found')

    expect(priorityLabel.textContent ?? '').toContain('优先级')
    expect(dueDateLabel.textContent ?? '').toContain('截止日期')
    expect(container.textContent ?? '').toContain('用于排序和逾期提示')
    expect(container.textContent ?? '').toContain('可选')

    const dueDateInput = container.querySelector('[data-testid="task-create-form"] input[aria-label="截止日期"]') as HTMLInputElement | null
    if (!dueDateInput)
      throw new Error('due date input with aria-label not found')
    expect(dueDateInput.getAttribute('id')).toBe('task-due-date-input')

    unmount()
  })

  it('renders full priority options and non-truncating width classes', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const prioritySelect = container.querySelector('[data-testid="task-create-form"] [data-testid="task-priority-select"]') as HTMLSelectElement | null
    if (!prioritySelect)
      throw new Error('priority select not found')

    const optionLabels = Array.from(prioritySelect.options).map(option => option.textContent?.trim())
    expect(optionLabels).toEqual(['高优先级', '中优先级', '低优先级'])
    expect(prioritySelect.className).toContain('w-full')
    expect(prioritySelect.className).toContain('min-w-[136px]')

    unmount()
  })

  it('hides empty state after adding one task with selected high priority and due date', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('[id="task-title-input"]') as HTMLInputElement | null
    const prioritySelect = container.querySelector('[data-testid="task-create-form"] [data-testid="task-priority-select"]') as HTMLSelectElement | null
    const dueDateInput = container.querySelector('[data-testid="task-create-form"] [data-testid="task-due-date-input"]') as HTMLInputElement | null
    if (!titleInput || !prioritySelect || !dueDateInput)
      throw new Error('task create controls not found')

    titleInput.value = '写完实验总结'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    prioritySelect.value = 'high'
    prioritySelect.dispatchEvent(new Event('change', { bubbles: true }))
    dueDateInput.value = '2026-05-07'
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.storeState.persisted.value.tasks).toHaveLength(1)
    expect(mocks.storeState.persisted.value.tasks[0]?.title).toBe('写完实验总结')
    expect(mocks.storeState.persisted.value.tasks[0]?.priority).toBe('high')
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBe('2026-05-07')

    const text = container.textContent ?? ''
    expect(text).toContain('写完实验总结')
    expect(text.includes('还没有今日任务')).toBe(false)

    unmount()
  })

  it('allows adding a task when due date is empty', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('[id="task-title-input"]') as HTMLInputElement | null
    const dueDateInput = container.querySelector('[data-testid="task-create-form"] [data-testid="task-due-date-input"]') as HTMLInputElement | null
    if (!titleInput || !dueDateInput)
      throw new Error('task create inputs not found')

    titleInput.value = '复习算法章节'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    dueDateInput.value = ''
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.storeState.persisted.value.tasks).toHaveLength(1)
    expect(mocks.storeState.persisted.value.tasks[0]?.title).toBe('复习算法章节')
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBeUndefined()

    unmount()
  })

  it('shows lightweight completion feedback only for pending -> done transition', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '完成 demo 排练',
        done: false,
        createdAt: '2026-05-06T11:00:00.000Z',
        priority: 'medium',
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

  it('shows priority and due-date controls and updates existing task metadata', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '整理课程提纲',
        done: false,
        createdAt: '2026-05-06T09:00:00.000Z',
        priority: 'medium',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const itemPrioritySelect = container.querySelector('#task-item-priority-task-1') as HTMLSelectElement | null
    const prioritySelect = container.querySelector('[data-testid="task-item-priority-select"]') as HTMLSelectElement | null
    const dueDateByAria = container.querySelector('input[aria-label="任务截止日期"]') as HTMLInputElement | null
    const dueDateInput = container.querySelector('[data-testid="task-item-due-date-input"]') as HTMLInputElement | null

    if (!prioritySelect || !dueDateInput || !itemPrioritySelect || !dueDateByAria)
      throw new Error('task item metadata controls not found')

    const optionLabels = Array.from(itemPrioritySelect.options).map(option => option.textContent?.trim())
    expect(optionLabels).toEqual(['高优先级', '中优先级', '低优先级'])
    expect(itemPrioritySelect.className).toContain('w-full')
    expect(itemPrioritySelect.className).toContain('min-w-[128px]')
    expect(dueDateByAria.getAttribute('title')).toBe('任务截止日期')

    prioritySelect.value = 'high'
    prioritySelect.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.priority).toBe('high')

    dueDateInput.value = '2026-05-07'
    dueDateInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBe('2026-05-07')

    unmount()
  })

  it('renders overdue and high-priority hints while keeping inline edit controls available', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '提交课设文档',
        done: false,
        createdAt: '2026-05-05T12:00:00.000Z',
        priority: 'high',
        dueDate: '2026-05-05',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('已逾期')
    expect(text).toContain('高')

    const inlinePrioritySelect = container.querySelector('[data-testid="task-item-priority-select"]') as HTMLSelectElement | null
    const inlineDueDateInput = container.querySelector('[data-testid="task-item-due-date-input"]') as HTMLInputElement | null
    if (!inlinePrioritySelect || !inlineDueDateInput)
      throw new Error('inline controls missing under overdue state')
    expect(inlinePrioritySelect.getAttribute('aria-label')).toBe('任务优先级')
    expect(inlineDueDateInput.getAttribute('aria-label')).toBe('任务截止日期')

    unmount()
  })

  it('uses responsive non-clipping layout classes for create and inline edit forms', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '检查答辩材料',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'medium',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const sectionRoot = container.querySelector('section') as HTMLElement | null
    const createForm = container.querySelector('[data-testid="task-create-form"]') as HTMLElement | null
    const metaGrid = container.querySelector('[data-testid="task-create-meta-grid"]') as HTMLElement | null
    const addButton = findButton(container, '添加任务')
    const inlineEditGrid = container.querySelector('[data-testid="task-item-edit-grid"]') as HTMLElement | null

    if (!sectionRoot || !createForm || !metaGrid || !inlineEditGrid)
      throw new Error('layout containers missing')

    expect(sectionRoot.className.includes('overflow-hidden')).toBe(false)
    expect(sectionRoot.className).toContain('overflow-visible')
    expect(createForm.className.includes('overflow-hidden')).toBe(false)
    expect(createForm.className).toContain('overflow-visible')
    expect(metaGrid.className).toContain('grid-cols-1')
    expect(metaGrid.className).toContain('sm:grid-cols-2')
    expect(addButton.className).toContain('w-full')
    expect(addButton.className).toContain('sm:w-auto')
    expect(inlineEditGrid.className).toContain('grid-cols-1')
    expect(inlineEditGrid.className).toContain('sm:grid-cols-2')

    unmount()
  })

  it('binds sort selector and updates task order when mode changes', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-low',
        title: '低优先级任务',
        done: false,
        createdAt: '2026-05-06T09:30:00.000Z',
        priority: 'low',
      },
      {
        id: 'task-high',
        title: '高优先级任务',
        done: false,
        createdAt: '2026-05-06T10:00:00.000Z',
        priority: 'high',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const sortSelect = container.querySelector('[data-testid="task-sort-mode-select"]') as HTMLSelectElement | null
    if (!sortSelect)
      throw new Error('sort mode selector not found')

    sortSelect.value = 'priority'
    sortSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.storeState.taskSortMode.value).toBe('priority')

    const taskButtons = Array.from(container.querySelectorAll('li > div button:first-child')).map(node => node.textContent?.trim())
    expect(taskButtons[0]).toBe('高优先级任务')

    unmount()
  })
})
