// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue'

import StudyIsland from './index.vue'

type MockTaskPriority = 'high' | 'medium' | 'low'

interface MockStudyEvent {
  id: string
  at: number
  type: string
  detail?: Record<string, unknown>
}

interface MockStudyTask {
  id: string
  title: string
  done: boolean
  createdAt: string
  completedAt?: string
  priority: MockTaskPriority
  dueDate?: string
}

interface MockStudyPersisted {
  mode: 'idle' | 'focus' | 'break' | 'paused'
  remainingMs: number
  todayFocusSessions: number
  todayFocusMinutes: number
  todayReminderCount: number
  studyEvents: MockStudyEvent[]
  mutedUntil: number
  focusDurationMs: number
  breakDurationMs: number
  selectedFocusTaskId: string | null
  demoModeEnabled: boolean
  tasks: MockStudyTask[]
}

interface MockHistoryEntry {
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
  focusTaskIds?: string[]
}

const mocks = vi.hoisted(() => ({
  startFocus: vi.fn(() => {}),
  startBreak: vi.fn(() => {}),
  pause: vi.fn(() => {}),
  resume: vi.fn(() => {}),
  resetSession: vi.fn(() => {}),
  appendEvent: vi.fn(() => {}),
  toggleDemoMode: vi.fn(() => {}),
  setSelectedFocusTaskId: vi.fn((_: string | null) => {}),
  completeSelectedFocusTask: vi.fn(() => false),
  storeState: null as any,
}))

function createPersisted(overrides: Partial<MockStudyPersisted> = {}): MockStudyPersisted {
  return {
    mode: 'idle',
    remainingMs: 25 * 60 * 1000,
    todayFocusSessions: 0,
    todayFocusMinutes: 0,
    todayReminderCount: 0,
    studyEvents: [],
    mutedUntil: 0,
    focusDurationMs: 25 * 60 * 1000,
    breakDurationMs: 5 * 60 * 1000,
    selectedFocusTaskId: null,
    demoModeEnabled: false,
    tasks: [],
    ...overrides,
  }
}

function sortPendingTasks(tasks: MockStudyTask[]) {
  const rank: Record<MockTaskPriority, number> = { high: 0, medium: 1, low: 2 }
  return tasks
    .filter(task => !task.done)
    .slice()
    .sort((leftTask, rightTask) => {
      const priorityCompared = rank[leftTask.priority] - rank[rightTask.priority]
      if (priorityCompared !== 0)
        return priorityCompared

      if (leftTask.dueDate && rightTask.dueDate) {
        const dueDateCompared = leftTask.dueDate.localeCompare(rightTask.dueDate)
        if (dueDateCompared !== 0)
          return dueDateCompared
      }
      else if (leftTask.dueDate) {
        return -1
      }
      else if (rightTask.dueDate) {
        return 1
      }

      return new Date(leftTask.createdAt).getTime() - new Date(rightTask.createdAt).getTime()
    })
}

function createStoreState(
  persistedOverrides: Partial<MockStudyPersisted> = {},
  historyEntries: MockHistoryEntry[] = [],
) {
  const persisted = ref(createPersisted(persistedOverrides))
  const sortedPendingTasks = computed(() => sortPendingTasks(persisted.value.tasks))
  const selectedFocusTask = computed(() => {
    const selectedTaskId = persisted.value.selectedFocusTaskId
    if (!selectedTaskId)
      return null
    return persisted.value.tasks.find(task => task.id === selectedTaskId && !task.done) ?? null
  })
  const todayInterruptCount = ref(0)

  mocks.setSelectedFocusTaskId.mockImplementation((taskId: string | null) => {
    if (!taskId) {
      persisted.value.selectedFocusTaskId = null
      return
    }
    const selectableTask = persisted.value.tasks.find(task => task.id === taskId && !task.done)
    if (!selectableTask)
      return
    persisted.value.selectedFocusTaskId = selectableTask.id
  })

  mocks.completeSelectedFocusTask.mockImplementation(() => {
    const selectedTaskId = persisted.value.selectedFocusTaskId
    if (!selectedTaskId)
      return false
    const selectedTask = persisted.value.tasks.find(task => task.id === selectedTaskId && !task.done)
    if (!selectedTask)
      return false

    persisted.value.tasks = persisted.value.tasks.map(task => task.id === selectedTask.id
      ? {
          ...task,
          done: true,
          completedAt: new Date().toISOString(),
        }
      : task)
    persisted.value.selectedFocusTaskId = null
    return true
  })

  return {
    persisted,
    isMuted: ref(false),
    demoModeEnabled: ref(false),
    selectedFocusTask,
    sortedPendingTasks,
    todayInterruptCount,
    startFocus: mocks.startFocus,
    startBreak: mocks.startBreak,
    pause: mocks.pause,
    resume: mocks.resume,
    resetSession: mocks.resetSession,
    appendEvent: mocks.appendEvent,
    toggleDemoMode: mocks.toggleDemoMode,
    setSelectedFocusTaskId: mocks.setSelectedFocusTaskId,
    completeSelectedFocusTask: mocks.completeSelectedFocusTask,
    getLast7DaysStats: () => historyEntries,
  }
}

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}))

vi.mock('@proj-airi/stage-ui/stores/modules/study-companion', () => ({
  useStudyCompanionStore: () => mocks.storeState,
}))

vi.mock('../../../utils/study-break-suggestions', () => ({
  createStudyBreakSuggestionPicker: () => () => '喝一口水',
}))

vi.mock('./TaskList.vue', () => ({
  default: defineComponent({
    name: 'TaskListStub',
    emits: ['interactionLockChange'],
    setup() {
      return () => h('div', { 'data-testid': 'task-list-stub' }, 'task-list')
    },
  }),
}))

function mountStudyIsland() {
  const host = defineComponent({
    setup() {
      return () => h(StudyIsland)
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

function createRecentHistoryEntriesWithData(): MockHistoryEntry[] {
  return [
    { dayKey: '2026-04-30', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    { dayKey: '2026-05-01', focusMinutes: 20, focusSessions: 1, completedTasks: 1, interruptCount: 0, createdTasks: 1 },
    { dayKey: '2026-05-02', focusMinutes: 35, focusSessions: 2, completedTasks: 0, interruptCount: 1, createdTasks: 2 },
    { dayKey: '2026-05-03', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    { dayKey: '2026-05-04', focusMinutes: 45, focusSessions: 2, completedTasks: 2, interruptCount: 0, createdTasks: 2 },
    { dayKey: '2026-05-05', focusMinutes: 30, focusSessions: 1, completedTasks: 1, interruptCount: 1, createdTasks: 1 },
    { dayKey: '2026-05-06', focusMinutes: 50, focusSessions: 2, completedTasks: 2, interruptCount: 1, createdTasks: 2 },
  ]
}

describe('study island completion actions', () => {
  beforeEach(() => {
    mocks.startFocus.mockReset()
    mocks.startBreak.mockReset()
    mocks.pause.mockReset()
    mocks.resume.mockReset()
    mocks.resetSession.mockReset()
    mocks.appendEvent.mockReset()
    mocks.toggleDemoMode.mockReset()
    mocks.setSelectedFocusTaskId.mockReset()
    mocks.completeSelectedFocusTask.mockReset()
    mocks.storeState = createStoreState({}, createRecentHistoryEntriesWithData())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows completion choice card after focus session completes', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
      studyEvents: [
        { id: 'evt-focus-started', at: 1000, type: 'focus_started' },
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
      tasks: [
        { id: 'task-1', title: '完成实验记录', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
      ],
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('本轮专注已完成')
    expect(text).toContain('可以休息一下，也可以继续下一轮')
    expect(text).toContain('休息 5 分钟')
    expect(text).toContain('开始下一轮')
    expect(text).toContain('完成当前任务')

    unmount()
  })

  it('starts next round in one click and hides completion card', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
      studyEvents: [
        { id: 'evt-focus-started', at: 1000, type: 'focus_started' },
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
      tasks: [
        { id: 'task-1', title: '读完一节文档', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
      ],
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    findButton(container, '开始下一轮').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.startFocus).toHaveBeenCalledTimes(1)
    expect(container.textContent?.includes('本轮专注已完成')).toBe(false)

    unmount()
  })

  it('routes break action from completion card and hides card', async () => {
    mocks.storeState = createStoreState({
      mode: 'idle',
      studyEvents: [
        { id: 'evt-focus-started', at: 1000, type: 'focus_started' },
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    findButton(container, '休息 5 分钟').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.startBreak).toHaveBeenCalledTimes(1)
    expect(container.textContent?.includes('本轮专注已完成')).toBe(false)

    unmount()
  })

  it('disables complete-current-task action when there is no pending task', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
      studyEvents: [
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
      tasks: [],
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const completeTaskButton = findButton(container, '完成当前任务')
    expect(completeTaskButton.disabled).toBe(true)

    unmount()
  })

  it('binds selected focus task selector to store setter and keeps smart sorting', async () => {
    mocks.storeState = createStoreState({
      tasks: [
        { id: 'task-1', title: '整理课程提纲', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
        { id: 'task-2', title: '完成演示页', done: false, createdAt: '2026-05-06T09:05:00.000Z', priority: 'high' },
      ],
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const selector = container.querySelector('[data-testid="study-selected-task-select"]') as HTMLSelectElement | null
    if (!selector)
      throw new Error('selected task selector not found')

    const options = Array.from(selector.querySelectorAll('option')).map(option => option.textContent?.trim())
    expect(options[1]).toBe('完成演示页')
    expect(options[2]).toBe('整理课程提纲')

    selector.value = 'task-2'
    selector.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(mocks.setSelectedFocusTaskId).toHaveBeenCalledWith('task-2')
    expect(mocks.storeState.persisted.value.selectedFocusTaskId).toBe('task-2')
    expect(container.textContent).toContain('已选择：完成演示页')

    unmount()
  })

  it('disables completion card action when no selected focus task is present', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
      studyEvents: [
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
      tasks: [
        { id: 'task-1', title: '复盘实验结果', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
      ],
      selectedFocusTaskId: null,
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const completeTaskButton = findButton(container, '完成当前任务')
    expect(completeTaskButton.disabled).toBe(true)

    unmount()
  })

  it('marks selected focus task as completed from completion card and shows feedback', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
      studyEvents: [
        { id: 'evt-focus-completed', at: 2000, type: 'focus_completed' },
      ],
      tasks: [
        { id: 'task-1', title: '完成 demo 彩排', done: false, createdAt: '2026-05-06T09:00:00.000Z', priority: 'medium' },
      ],
      selectedFocusTaskId: 'task-1',
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const completeTaskButton = findButton(container, '完成当前任务')
    expect(completeTaskButton.disabled).toBe(false)
    completeTaskButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(mocks.completeSelectedFocusTask).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('已完成，做得不错')
    expect(mocks.appendEvent).toHaveBeenCalledWith('focus_completion_choice', { action: 'complete_task' })

    unmount()
  })

  it('shows one break suggestion while in break mode and hides it after leaving break', async () => {
    mocks.storeState = createStoreState({
      mode: 'break',
    }, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    expect(container.textContent).toContain('休息建议：喝一口水')

    mocks.storeState.persisted.value.mode = 'focus'
    await nextTick()

    expect((container.textContent ?? '').includes('休息建议：喝一口水')).toBe(false)

    unmount()
  })

  it('shows today interrupt count in stats panel', async () => {
    mocks.storeState = createStoreState({}, createRecentHistoryEntriesWithData())
    mocks.storeState.todayInterruptCount.value = 2

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    expect(container.textContent).toContain('今日中断：2 次')

    unmount()
  })

  it('renders recent 7-day focus chart in main panel', async () => {
    mocks.storeState = createStoreState({}, createRecentHistoryEntriesWithData())

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const chart = container.querySelector('[data-testid="study-history-bar-chart"]')
    expect(chart).not.toBeNull()

    unmount()
  })

  it('shows chart empty state when recent history has no data', async () => {
    const emptyHistory = [
      { dayKey: '2026-04-30', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-01', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-02', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-03', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-04', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-05', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
      { dayKey: '2026-05-06', focusMinutes: 0, focusSessions: 0, completedTasks: 0, interruptCount: 0, createdTasks: 0 },
    ]
    mocks.storeState = createStoreState({}, emptyHistory)

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    expect(container.textContent).toContain('还没有足够的历史数据')

    unmount()
  })
})
