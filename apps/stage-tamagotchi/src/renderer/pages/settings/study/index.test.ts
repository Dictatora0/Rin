// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue'

import StudySettingsPage from './index.vue'

const mocks = vi.hoisted(() => ({
  setFocusMinutes: vi.fn((_: number) => {}),
  setBreakMinutes: vi.fn((_: number) => {}),
  exportStudySnapshot: vi.fn(() => ({
    statsDate: '2026-05-12',
  })),
  exportStudyMarkdownReport: vi.fn(() => ({
    filename: 'rin-study-report-2026-05-12.md',
    markdown: '# Rin 学习陪伴报告',
    statsDate: '2026-05-12',
  })),
  clearStudyEvents: vi.fn(() => {}),
  clearTodayStudyStats: vi.fn(() => {}),
  download: vi.fn(() => {}),
  useDownload: vi.fn((_: Blob, __: string) => ({ download: mocks.download })),
  store: null as any,
}))

vi.mock('@proj-airi/ui', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    Button: defineComponent({
      name: 'Button',
      emits: ['click'],
      inheritAttrs: false,
      setup(_, { attrs, emit, slots }) {
        return () => h('button', {
          type: 'button',
          ...(attrs as Record<string, unknown>),
          onClick: (event: MouseEvent) => emit('click', event),
        }, slots.default?.())
      },
    }),
    Callout: defineComponent({
      name: 'Callout',
      setup(_, { slots }) {
        return () => h('section', slots.default?.())
      },
    }),
    DoubleCheckButton: defineComponent({
      name: 'DoubleCheckButton',
      emits: ['confirm'],
      inheritAttrs: false,
      setup(_, { attrs, emit, slots }) {
        return () => h('button', {
          type: 'button',
          ...(attrs as Record<string, unknown>),
          onClick: () => emit('confirm'),
        }, slots.default?.())
      },
    }),
  }
})

vi.mock('@vueuse/core', () => ({
  useNow: () => ref(new Date('2026-05-12T12:00:00.000Z')),
}))

vi.mock('@proj-airi/stage-ui/composables/download', () => ({
  useDownload: (blob: Blob, filename: string) => mocks.useDownload(blob, filename),
}))

vi.mock('@proj-airi/stage-ui/stores/modules/study-companion', () => ({
  MIN_FOCUS_MINUTES: 5,
  MAX_FOCUS_MINUTES: 120,
  MIN_BREAK_MINUTES: 1,
  MAX_BREAK_MINUTES: 60,
  useStudyCompanionStore: () => mocks.store,
}))

function createHistoryEntries(days: number, focusedDays: number[] = []) {
  const entries = []
  for (let index = 0; index < days; index += 1) {
    const day = String(index + 1).padStart(2, '0')
    const hasFocus = focusedDays.includes(index)
    entries.push({
      dayKey: `2026-05-${day}`,
      focusMinutes: hasFocus ? 30 + index : 0,
      focusSessions: hasFocus ? 1 : 0,
      completedTasks: hasFocus ? 1 : 0,
      interruptCount: hasFocus ? 1 : 0,
      createdTasks: hasFocus ? 1 : 0,
      focusTaskIds: hasFocus ? [`task-${index}`] : [],
    })
  }
  return entries
}

function createStore() {
  const last7 = createHistoryEntries(7, [2, 4, 6])
  const last14 = createHistoryEntries(14, [1, 3, 6, 9, 12])
  const last30 = createHistoryEntries(30, [2, 7, 12, 17, 22, 27])

  const store = reactive({
    persisted: {
      statsDate: '2026-05-12',
      mode: 'idle',
      remainingMs: 25 * 60 * 1000,
      mutedUntil: 0,
      demoModeEnabled: false,
      todayFocusSessions: 2,
      todayFocusMinutes: 50,
      todayReminderCount: 1,
      studyEvents: [],
    },
    isMuted: false,
    demoModeEnabled: false,
    taskTotal: 3,
    taskCompleted: 1,
    taskPending: 2,
    focusMinutes: 25,
    breakMinutes: 5,
    todayInterruptCount: 2,
    setFocusMinutes: mocks.setFocusMinutes,
    setBreakMinutes: mocks.setBreakMinutes,
    exportStudySnapshot: mocks.exportStudySnapshot,
    exportStudyMarkdownReport: mocks.exportStudyMarkdownReport,
    clearStudyEvents: mocks.clearStudyEvents,
    clearTodayStudyStats: mocks.clearTodayStudyStats,
    getLast7DaysStats: () => last7,
    getLast14DaysStats: () => last14,
    getLast30DaysStats: () => last30,
  })
  return store
}

function mountPage() {
  const host = defineComponent({
    setup() {
      return () => h(StudySettingsPage)
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

function findButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll('button'))
    .find(item => item.textContent?.includes(label))
  if (!button)
    throw new Error(`button "${label}" not found`)
  return button as HTMLButtonElement
}

describe('study settings page', () => {
  beforeEach(() => {
    mocks.setFocusMinutes.mockReset()
    mocks.setBreakMinutes.mockReset()
    mocks.exportStudySnapshot.mockReset()
    mocks.exportStudyMarkdownReport.mockReset()
    mocks.clearStudyEvents.mockReset()
    mocks.clearTodayStudyStats.mockReset()
    mocks.download.mockReset()
    mocks.useDownload.mockReset()
    mocks.useDownload.mockImplementation(() => ({ download: mocks.download }))
    mocks.store = createStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps JSON export and adds markdown export button', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    findButton(container, '导出 JSON').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.exportStudySnapshot).toHaveBeenCalledTimes(1)

    findButton(container, '导出 Markdown 报告').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(mocks.exportStudyMarkdownReport).toHaveBeenCalledTimes(1)
    expect(mocks.useDownload).toHaveBeenCalledTimes(2)
    expect(mocks.useDownload).toHaveBeenNthCalledWith(2, expect.any(Blob), 'rin-study-report-2026-05-12.md')
    expect(mocks.download).toHaveBeenCalledTimes(2)

    unmount()
  })

  it('calls duration setters from focus/break minute inputs', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    const focusInput = container.querySelector('input[min="5"][max="120"]') as HTMLInputElement | null
    if (!focusInput)
      throw new Error('focus minutes input missing')
    focusInput.value = '30'
    focusInput.dispatchEvent(new Event('input', { bubbles: true }))
    focusInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(mocks.setFocusMinutes).toHaveBeenCalledWith(30)

    const breakInput = container.querySelector('input[min="1"][max="60"]') as HTMLInputElement | null
    if (!breakInput)
      throw new Error('break minutes input missing')
    breakInput.value = '10'
    breakInput.dispatchEvent(new Event('input', { bubbles: true }))
    breakInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(mocks.setBreakMinutes).toHaveBeenCalledWith(10)

    unmount()
  })

  it('renders multi-day history summaries and charts', async () => {
    const { container, unmount } = mountPage()
    await nextTick()

    const text = container.textContent ?? ''
    expect(text).toContain('历史统计')
    expect(text).toContain('最近 7 天')
    expect(text).toContain('最近 14 天')
    expect(text).toContain('最近 30 天')

    expect(container.querySelector('[data-testid="study-history-bar-chart"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="study-history-heatmap"]')).not.toBeNull()

    unmount()
  })
})
