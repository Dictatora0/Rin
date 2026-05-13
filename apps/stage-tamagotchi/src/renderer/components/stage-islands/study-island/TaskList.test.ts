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
  reminders?: Array<{
    id: string
    amount: number
    unit: 'minute' | 'hour' | 'day'
    enabled: boolean
    source: 'rin-recommended' | 'user-custom'
    label?: string
  }>
  reminderDeliveries?: Array<{
    reminderId: string
    deliveredAt: string
  }>
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
        reminders: [],
        reminderDeliveries: [],
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
          ...(dueDate ? {} : { reminders: [] }),
        }
      : task)
  }

  function ensureTaskReminderRules(taskId: string, options?: { forceRecommend?: boolean }) {
    persisted.value.tasks = persisted.value.tasks.map((task) => {
      if (task.id !== taskId)
        return task
      if (!task.dueDate)
        return task
      if ((task.reminders?.length ?? 0) > 0)
        return task
      if (!options?.forceRecommend)
        return task
      return {
        ...task,
        reminders: [
          {
            id: `rin-${taskId}-1d`,
            amount: 1,
            unit: 'day',
            enabled: true,
            source: 'rin-recommended',
            label: 'Rin 推荐：提前 1 天',
          },
          {
            id: `rin-${taskId}-3h`,
            amount: 3,
            unit: 'hour',
            enabled: true,
            source: 'rin-recommended',
            label: 'Rin 推荐：提前 3 小时',
          },
        ],
      }
    })
  }

  function addTaskReminder(taskId: string, payload: { amount: number, unit: 'minute' | 'hour' | 'day', source?: 'rin-recommended' | 'user-custom' }) {
    const task = persisted.value.tasks.find(item => item.id === taskId)
    if (!task)
      return { ok: false as const, reason: 'invalid-task' as const }
    if (!task.dueDate)
      return { ok: false as const, reason: 'invalid-due-date' as const }
    const existingRules = task.reminders ?? []
    if (existingRules.length >= 5)
      return { ok: false as const, reason: 'limit' as const }
    const nextRule = {
      id: `custom-${taskId}-${existingRules.length + 1}`,
      amount: Math.round(payload.amount),
      unit: payload.unit,
      enabled: true,
      source: payload.source === 'rin-recommended' ? 'rin-recommended' as const : 'user-custom' as const,
      label: `自定义：提前 ${Math.round(payload.amount)} ${payload.unit === 'day' ? '天' : payload.unit === 'hour' ? '小时' : '分钟'}`,
    }
    persisted.value.tasks = persisted.value.tasks.map(item => item.id === taskId
      ? {
          ...item,
          reminders: [...(item.reminders ?? []), nextRule],
        }
      : item)
    return { ok: true as const }
  }

  function updateTaskReminder(taskId: string, reminderId: string, patch: Partial<{ amount: number, unit: 'minute' | 'hour' | 'day', enabled: boolean }>) {
    let found = false
    persisted.value.tasks = persisted.value.tasks.map((task) => {
      if (task.id !== taskId)
        return task
      const currentReminders = task.reminders ?? []
      const nextReminders = currentReminders.map((rule) => {
        if (rule.id !== reminderId)
          return rule
        found = true
        const nextUnit = patch.unit ?? rule.unit
        const nextAmount = patch.amount == null ? rule.amount : Math.round(patch.amount)
        return {
          ...rule,
          amount: nextAmount,
          unit: nextUnit,
          enabled: patch.enabled ?? rule.enabled,
          source: 'user-custom' as const,
          label: `自定义：提前 ${nextAmount} ${nextUnit === 'day' ? '天' : nextUnit === 'hour' ? '小时' : '分钟'}`,
        }
      })
      return { ...task, reminders: nextReminders }
    })
    if (!found)
      return { ok: false as const, reason: 'invalid-reminder' as const }
    return { ok: true as const }
  }

  function removeTaskReminder(taskId: string, reminderId: string) {
    let removed = false
    persisted.value.tasks = persisted.value.tasks.map((task) => {
      if (task.id !== taskId)
        return task
      const nextReminders = (task.reminders ?? []).filter((rule) => {
        const keep = rule.id !== reminderId
        if (!keep)
          removed = true
        return keep
      })
      return { ...task, reminders: nextReminders }
    })
    return removed
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
    ensureTaskReminderRules,
    addTaskReminder,
    updateTaskReminder,
    removeTaskReminder,
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

function findButton(container: HTMLElement, text: string, scope?: Element) {
  const queryRoot = scope ?? container
  const button = Array.from(queryRoot.querySelectorAll('button'))
    .find(item => item.textContent?.includes(text)) as HTMLButtonElement | undefined
  if (!button)
    throw new Error(`button ${text} not found`)
  return button
}

function getTaskTitleButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll('li > div:first-child > button'))
}

function getCreateForm(container: HTMLElement) {
  const form = container.querySelector('[data-testid="task-create-form"]') as HTMLElement | null
  if (!form)
    throw new Error('task create form not found')
  return form
}

describe('task list due date text input', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 6, 12, 0, 0))
    mocks.storeState = createStoreState([])
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not render native date inputs and uses text type for due date fields', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '准备答辩',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'medium',
      },
    ])
    const { container, unmount } = mountTaskList()
    await nextTick()

    expect(container.querySelectorAll('input[type="date"]').length).toBe(0)

    const createDueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    const itemDueDateInput = container.querySelector('#task-item-due-date-task-1') as HTMLInputElement | null
    if (!createDueDateInput || !itemDueDateInput)
      throw new Error('due date text inputs missing')

    expect(createDueDateInput.type).toBe('text')
    expect(itemDueDateInput.type).toBe('text')

    unmount()
  })

  it('shows due date label, placeholder and format hint', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const dueDateLabel = container.querySelector('label[for="task-due-date-input"]') as HTMLLabelElement | null
    if (!dueDateLabel)
      throw new Error('due date label missing')
    expect(dueDateLabel.textContent ?? '').toContain('截止日期')

    const dueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!dueDateInput)
      throw new Error('create due date input missing')
    expect(dueDateInput.value).toBe('2026-05-07')
    expect(dueDateInput.placeholder).toBe('例如：2026-05-12')
    expect(dueDateInput.getAttribute('aria-label')).toBe('截止日期')
    expect(container.textContent ?? '').toContain('格式：YYYY-MM-DD，用于排序和逾期提示')

    unmount()
  })

  it('applies quick due date actions in create form', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const createForm = getCreateForm(container)
    const dueDateInput = createForm.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!dueDateInput)
      throw new Error('create due date input missing')

    findButton(container, '今天', createForm).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(dueDateInput.value).toBe('2026-05-06')

    findButton(container, '明天', createForm).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(dueDateInput.value).toBe('2026-05-07')

    findButton(container, '本周日', createForm).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(dueDateInput.value).toBe('2026-05-10')

    findButton(container, '一周后', createForm).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(dueDateInput.value).toBe('2026-05-13')

    findButton(container, '清除', createForm).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(dueDateInput.value).toBe('2026-05-07')

    unmount()
  })

  it('adds task with valid YYYY-MM-DD due date', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('#task-title-input') as HTMLInputElement | null
    const prioritySelect = container.querySelector('#task-priority-input') as HTMLSelectElement | null
    const dueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!titleInput || !prioritySelect || !dueDateInput)
      throw new Error('task create controls missing')

    titleInput.value = '写完实验总结'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    prioritySelect.value = 'high'
    prioritySelect.dispatchEvent(new Event('change', { bubbles: true }))
    dueDateInput.value = '2026-05-12'
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.storeState.persisted.value.tasks).toHaveLength(1)
    expect(mocks.storeState.persisted.value.tasks[0]?.priority).toBe('high')
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBe('2026-05-12')

    unmount()
  })

  it('shows validation error and blocks invalid create due date', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('#task-title-input') as HTMLInputElement | null
    const dueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!titleInput || !dueDateInput)
      throw new Error('create controls missing')

    titleInput.value = '测试非法日期'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    dueDateInput.value = '05/12/2026'
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(container.textContent ?? '').toContain('请输入 YYYY-MM-DD 格式的日期')

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks).toHaveLength(0)

    unmount()
  })

  it('allows empty due date on create', async () => {
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('#task-title-input') as HTMLInputElement | null
    const dueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!titleInput || !dueDateInput)
      throw new Error('create controls missing')

    titleInput.value = '无截止日期任务'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    dueDateInput.value = ' '
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks).toHaveLength(1)
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBeUndefined()

    unmount()
  })

  it('saves valid due date during inline editing', async () => {
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

    const itemDueDateInput = container.querySelector('#task-item-due-date-task-1') as HTMLInputElement | null
    if (!itemDueDateInput)
      throw new Error('inline due date input missing')

    itemDueDateInput.value = '2026-05-07'
    itemDueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    itemDueDateInput.dispatchEvent(new Event('blur', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBe('2026-05-07')

    unmount()
  })

  it('shows inline validation error and does not save invalid due date', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '整理课程提纲',
        done: false,
        createdAt: '2026-05-06T09:00:00.000Z',
        priority: 'medium',
        dueDate: '2026-05-07',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const itemDueDateInput = container.querySelector('#task-item-due-date-task-1') as HTMLInputElement | null
    if (!itemDueDateInput)
      throw new Error('inline due date input missing')

    itemDueDateInput.value = '07/08/2026'
    itemDueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(container.textContent ?? '').toContain('请输入 YYYY-MM-DD 格式的日期')

    itemDueDateInput.dispatchEvent(new Event('blur', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBe('2026-05-07')

    unmount()
  })

  it('clears inline due date through quick action', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-1',
        title: '整理课程提纲',
        done: false,
        createdAt: '2026-05-06T09:00:00.000Z',
        priority: 'medium',
        dueDate: '2026-05-07',
      },
    ])

    const { container, unmount } = mountTaskList()
    await nextTick()

    const itemLabel = container.querySelector('label[for="task-item-due-date-task-1"]') as HTMLLabelElement | null
    if (!itemLabel)
      throw new Error('inline due date label missing')

    findButton(container, '清除', itemLabel).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.dueDate).toBeUndefined()

    unmount()
  })

  it('keeps full priority labels and stable responsive classes', async () => {
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

    const prioritySelect = container.querySelector('#task-priority-input') as HTMLSelectElement | null
    const optionLabels = Array.from(prioritySelect?.options ?? []).map(option => option.textContent?.trim())
    expect(optionLabels).toEqual(['高优先级', '中优先级', '低优先级'])
    expect(prioritySelect?.className).toContain('w-full')
    expect(prioritySelect?.className).toContain('min-w-[136px]')

    const createMetaGrid = container.querySelector('[data-testid="task-create-meta-grid"]') as HTMLElement | null
    const addButton = findButton(container, '添加任务')
    const editGrid = container.querySelector('[data-testid="task-item-edit-grid"]') as HTMLElement | null
    expect(createMetaGrid?.className).toContain('grid-cols-1')
    expect(createMetaGrid?.className).toContain('sm:grid-cols-2')
    expect(addButton.className).toContain('w-full')
    expect(addButton.className).toContain('sm:w-auto')
    expect(editGrid?.className).toContain('grid-cols-1')
    expect(editGrid?.className).toContain('sm:grid-cols-2')

    unmount()
  })

  it('keeps overdue hints and sorting behavior unchanged', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-a',
        title: '高优先级晚截止',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'high',
        dueDate: '2026-05-09',
      },
      {
        id: 'task-b',
        title: '高优先级早截止',
        done: false,
        createdAt: '2026-05-06T08:01:00.000Z',
        priority: 'high',
        dueDate: '2026-05-07',
      },
      {
        id: 'task-overdue',
        title: '已逾期任务',
        done: false,
        createdAt: '2026-05-05T08:00:00.000Z',
        priority: 'medium',
        dueDate: '2026-05-05',
      },
    ])
    const { container, unmount } = mountTaskList()
    await nextTick()

    expect(container.textContent ?? '').toContain('已逾期')

    const sortSelect = container.querySelector('[data-testid="task-sort-mode-select"]') as HTMLSelectElement | null
    if (!sortSelect)
      throw new Error('sort mode selector missing')
    sortSelect.value = 'dueDate'
    sortSelect.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    const taskTitles = getTaskTitleButtons(container).map(node => node.textContent?.trim())
    expect(taskTitles[0]).toBe('已逾期任务')
    expect(taskTitles[1]).toBe('高优先级早截止')

    unmount()
  })

  it('uses dueDate field unchanged in persisted tasks for report compatibility', async () => {
    mocks.storeState = createStoreState([])
    const { container, unmount } = mountTaskList()
    await nextTick()

    const titleInput = container.querySelector('#task-title-input') as HTMLInputElement | null
    const dueDateInput = container.querySelector('#task-due-date-input') as HTMLInputElement | null
    if (!titleInput || !dueDateInput)
      throw new Error('create controls missing')

    titleInput.value = '报告导出兼容检查'
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    dueDateInput.value = '2026-05-12'
    dueDateInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    findButton(container, '添加任务').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.storeState.persisted.value.tasks[0]).toMatchObject({
      title: '报告导出兼容检查',
      dueDate: '2026-05-12',
    })

    unmount()
  })

  it('shows due reminder panel and rin recommended label when dueDate exists', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-reminder',
        title: '准备答辩提纲',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'high',
        dueDate: '2026-05-08',
      },
    ])
    const { container, unmount } = mountTaskList()
    await nextTick()

    findButton(container, '编辑提醒').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('截止提醒')
    expect(text).toContain('Rin 推荐')
    expect(text).toContain('已提醒次数')
    expect(text).toContain('Rin 推荐：提前 1 天')

    const rows = container.querySelectorAll('[data-testid="task-reminder-row"]')
    expect(rows.length).toBeGreaterThan(0)
    unmount()
  })

  it('supports adding/removing/disabling custom reminders and enforces max 5 reminders', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-reminder',
        title: '准备答辩提纲',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'high',
        dueDate: '2026-05-08',
      },
    ])
    const { container, unmount } = mountTaskList()
    await nextTick()

    findButton(container, '编辑提醒').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const addButton = container.querySelector('[data-testid="task-reminder-add-button"]') as HTMLButtonElement | null
    if (!addButton)
      throw new Error('reminder add button missing')
    const addAmountInput = container.querySelector('[data-testid="task-reminder-add-amount"]') as HTMLInputElement | null
    if (!addAmountInput)
      throw new Error('reminder add amount input missing')
    addAmountInput.value = '2'
    addAmountInput.dispatchEvent(new Event('input', { bubbles: true }))
    addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.reminders?.some((rule: any) => rule.source === 'user-custom')).toBe(true)

    for (const amountText of ['3', '4', '5', '6']) {
      addAmountInput.value = amountText
      addAmountInput.dispatchEvent(new Event('input', { bubbles: true }))
      addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
    }
    expect(container.textContent ?? '').toContain('最多添加 5 条提醒')

    const toggle = container.querySelector('[data-testid="task-reminder-enabled-toggle"]') as HTMLInputElement | null
    if (!toggle)
      throw new Error('reminder enabled toggle missing')
    toggle.checked = false
    toggle.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(mocks.storeState.persisted.value.tasks[0]?.reminders?.[0]?.enabled).toBe(false)

    const removeButton = container.querySelector('[data-testid="task-reminder-remove"]') as HTMLButtonElement | null
    if (!removeButton)
      throw new Error('reminder remove button missing')
    removeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect((mocks.storeState.persisted.value.tasks[0]?.reminders?.length ?? 0)).toBeLessThan(5)

    unmount()
  })

  it('shows reminder hints for no dueDate and done task states', async () => {
    mocks.storeState = createStoreState([
      {
        id: 'task-no-due',
        title: '无截止任务',
        done: false,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'medium',
      },
      {
        id: 'task-done',
        title: '已完成任务',
        done: true,
        createdAt: '2026-05-06T08:00:00.000Z',
        priority: 'medium',
        dueDate: '2026-05-08',
      },
    ])
    const { container, unmount } = mountTaskList()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('设置截止日期后可添加提醒')
    expect(text).toContain('任务已完成，不再提醒')
    unmount()
  })
})
