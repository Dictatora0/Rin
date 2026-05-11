// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import StudyIsland from './index.vue'

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
  createdAt: number
  completedAt?: number
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
  demoModeEnabled: boolean
  tasks: MockStudyTask[]
}

const mocks = vi.hoisted(() => ({
  startFocus: vi.fn(() => {}),
  startBreak: vi.fn(() => {}),
  pause: vi.fn(() => {}),
  resume: vi.fn(() => {}),
  resetSession: vi.fn(() => {}),
  appendEvent: vi.fn(() => {}),
  toggleDemoMode: vi.fn(() => {}),
  toggleTaskDone: vi.fn(() => {}),
  storeState: null as unknown,
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
    demoModeEnabled: false,
    tasks: [],
    ...overrides,
  }
}

function createStoreState(persistedOverrides: Partial<MockStudyPersisted> = {}) {
  return {
    persisted: ref(createPersisted(persistedOverrides)),
    isMuted: ref(false),
    demoModeEnabled: ref(false),
    startFocus: mocks.startFocus,
    startBreak: mocks.startBreak,
    pause: mocks.pause,
    resume: mocks.resume,
    resetSession: mocks.resetSession,
    appendEvent: mocks.appendEvent,
    toggleDemoMode: mocks.toggleDemoMode,
    toggleTaskDone: mocks.toggleTaskDone,
  }
}

vi.mock('pinia', () => ({
  storeToRefs: (store: Record<string, unknown>) => store,
}))

vi.mock('@proj-airi/stage-ui/stores/modules/study-companion', () => ({
  useStudyCompanionStore: () => mocks.storeState,
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

describe('study island completion actions', () => {
  beforeEach(() => {
    mocks.startFocus.mockReset()
    mocks.startBreak.mockReset()
    mocks.pause.mockReset()
    mocks.resume.mockReset()
    mocks.resetSession.mockReset()
    mocks.appendEvent.mockReset()
    mocks.toggleDemoMode.mockReset()
    mocks.toggleTaskDone.mockReset()
    mocks.storeState = createStoreState()
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
        { id: 'task-1', title: '完成实验记录', done: false, createdAt: 1000 },
      ],
    })

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
        { id: 'task-1', title: '读完一节文档', done: false, createdAt: 1000 },
      ],
    })

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
    })

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
    })

    const { container, unmount } = mountStudyIsland()
    await nextTick()

    const completeTaskButton = findButton(container, '完成当前任务')
    expect(completeTaskButton.disabled).toBe(true)

    unmount()
  })
})
