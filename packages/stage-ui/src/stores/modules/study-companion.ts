import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
import { useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

/** Pomodoro run mode: single source of truth for Study Island & Live2D feedback. */
export type StudyCompanionMode = 'idle' | 'focus' | 'break' | 'paused'

/**
 * Default focus segment length (25 minutes), in milliseconds.
 *
 * @default 25 * 60 * 1000
 */
export const DEFAULT_FOCUS_DURATION_MS = 25 * 60 * 1000

/**
 * Default short break length (5 minutes), in milliseconds.
 *
 * @default 5 * 60 * 1000
 */
export const DEFAULT_BREAK_DURATION_MS = 5 * 60 * 1000
export const DEMO_FOCUS_DURATION_MS = 60 * 1000
export const DEMO_BREAK_DURATION_MS = 15 * 1000
export const MIN_FOCUS_MINUTES = 5
export const MAX_FOCUS_MINUTES = 120
export const MIN_BREAK_MINUTES = 1
export const MAX_BREAK_MINUTES = 60

const STORAGE_KEY = 'settings/study-companion/v1'

const MAX_EVENT_LOG = 500
const MAX_HISTORY_ENTRIES = 400
const MINUTE_IN_MS = 60 * 1000
const INTERRUPT_EVENT_TYPES = new Set<StudyEventLogEntry['type']>(['focus_reset'])
const DEFAULT_TASK_SORT_MODE: StudyTaskSortMode = 'smart'

export type StudyTaskPriority = 'high' | 'medium' | 'low'
export type StudyTaskSortMode = 'smart' | 'createdAt' | 'priority' | 'dueDate'

/**
 * Lightweight today-task row (member 4 extends actions; shape is stable for UI).
 */
export interface StudyTask {
  id: string
  title: string
  done: boolean
  createdAt: string
  completedAt?: string
  priority: StudyTaskPriority
  dueDate?: string
}

export interface StudyDailyHistoryEntry {
  dayKey: string
  focusMinutes: number
  focusSessions: number
  completedTasks: number
  interruptCount: number
  createdTasks: number
  focusTaskIds?: string[]
}

export interface StudyTaskInput {
  title: string
  priority?: StudyTaskPriority
  dueDate?: string
}

/**
 * Append-only study analytics / export row (member 7 extends types & export UI).
 */
export interface StudyEventLogEntry {
  id: string
  at: number
  type: 'focus_started' | 'focus_completed' | 'session_paused' | 'focus_reset'
    | 'break_started' | 'break_completed' | 'day_rollover' | (string & {})
  detail?: Record<string, unknown>
}

/**
 * Persisted snapshot: timer + daily stats + collaboration fields (tasks, reminders, log).
 */
export interface StudyCompanionPersisted {
  /** Local calendar day key (`YYYY-MM-DD`) for `today*` counters. */
  statsDate: string
  /** Completed focus sessions today (a session completes when the focus timer reaches zero). */
  todayFocusSessions: number
  /** Sum of completed focus minutes today (from configured focus duration). */
  todayFocusMinutes: number
  /** Lifetime count of completed focus sessions (not cleared on day rollover). */
  cycleCount: number
  mode: StudyCompanionMode
  /** Countdown display; while running, derived from `segmentEndsAt` on each tick. */
  remainingMs: number
  /** Wall-clock end timestamp while `focus` or `break` is actively counting; `null` when idle or paused. */
  segmentEndsAt: number | null
  /** When `mode === 'paused'`, which phase to resume. */
  pausedCarry: 'focus' | 'break' | null
  focusDurationMs: number
  breakDurationMs: number
  demoModeEnabled: boolean
  previousFocusDurationMs: number | null
  previousBreakDurationMs: number | null
  selectedFocusTaskId: string | null
  taskSortMode: StudyTaskSortMode
  tasks: StudyTask[]
  /** Shown / fired reminders today (member 5). */
  todayReminderCount: number
  /** Epoch ms until reminders are suppressed; `0` means not muted (member 5). */
  mutedUntil: number
  studyEvents: StudyEventLogEntry[]
  historyEntries: StudyDailyHistoryEntry[]
}

/**
 * Serializable snapshot payload for study statistics export.
 */
export interface StudyCompanionSnapshot {
  schemaVersion: 1
  app: 'Rin'
  feature: 'study-companion'
  project: 'Rin Study Companion'
  exportedAt: string
  demoModeEnabled: boolean
  statsDate: string
  summary: {
    todayFocusSessions: number
    todayFocusMinutes: number
    cycleCount: number
    todayReminderCount: number
    taskTotal: number
    taskCompleted: number
    taskPending: number
    todayInterruptCount: number
    mode: StudyCompanionMode
    isRunning: boolean
    isMuted: boolean
  }
  timer: {
    remainingMs: number
    segmentEndsAt: number | null
    focusDurationMs: number
    breakDurationMs: number
  }
  tasks: StudyTask[]
  events: StudyEventLogEntry[]
  history: {
    last7Days: StudyDailyHistoryEntry[]
    last14Days: StudyDailyHistoryEntry[]
  }
}

export interface StudyMarkdownReportExport {
  filename: string
  markdown: string
  statsDate: string
}

export function getLocalDayKey(d = new Date()): string {
  const localYear = d.getFullYear()
  const localMonth = `${d.getMonth() + 1}`.padStart(2, '0')
  const localDate = `${d.getDate()}`.padStart(2, '0')
  return `${localYear}-${localMonth}-${localDate}`
}

function getLocalDayKeyFromTimestamp(timestamp: number): string {
  if (!Number.isFinite(timestamp))
    return ''
  return getLocalDayKey(new Date(timestamp))
}

function dayKeyToDate(dayKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey))
    return null
  const [yearText, monthText, dayText] = dayKey.split('-')
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day))
    return null
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null
  }
  return date
}

function buildDayKeyOffset(baseDayKey: string, offsetDays: number): string {
  const baseDate = dayKeyToDate(baseDayKey) ?? dayKeyToDate(getLocalDayKey()) ?? new Date()
  const shiftedDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return getLocalDayKey(shiftedDate)
}

function normalizeTaskSortMode(value: unknown): StudyTaskSortMode {
  if (value === 'createdAt' || value === 'priority' || value === 'dueDate')
    return value
  return 'smart'
}

export function normalizeStudyTaskPriority(value: unknown): StudyTaskPriority {
  if (value === 'high' || value === 'low')
    return value
  return 'medium'
}

function normalizeTaskDueDate(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined

  const normalized = value.trim()
  if (!normalized)
    return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized))
    return normalized

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime()))
    return undefined
  return getLocalDayKey(parsed)
}

function normalizeTaskDateTime(value: unknown, fallbackISO?: string): string {
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString()
  }

  return fallbackISO ?? new Date().toISOString()
}

function normalizeOptionalTaskDateTime(value: unknown): string | undefined {
  if (value == null)
    return undefined

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString()
    return undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString()
  }

  return undefined
}

function taskDateTimeToTimestamp(value: string | undefined): number {
  if (!value)
    return Number.POSITIVE_INFINITY
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()))
    return Number.POSITIVE_INFINITY
  return parsed.getTime()
}

function countEventByType(events: StudyEventLogEntry[], statsDate: string, type: StudyEventLogEntry['type']) {
  return events.filter((event) => {
    if (event.type !== type)
      return false
    return getLocalDayKeyFromTimestamp(event.at) === statsDate
  }).length
}

function collectFocusTaskIds(events: StudyEventLogEntry[], dayKey: string) {
  const focusTaskIds = new Set<string>()

  for (const event of events) {
    if (event.type !== 'focus_started')
      continue
    if (getLocalDayKeyFromTimestamp(event.at) !== dayKey)
      continue
    const taskId = event.detail?.taskId
    if (typeof taskId !== 'string' || taskId.trim().length === 0)
      continue
    focusTaskIds.add(taskId)
  }

  return [...focusTaskIds]
}

function createEmptyHistoryEntry(dayKey: string): StudyDailyHistoryEntry {
  return {
    dayKey,
    focusMinutes: 0,
    focusSessions: 0,
    completedTasks: 0,
    interruptCount: 0,
    createdTasks: 0,
    focusTaskIds: [],
  }
}

function normalizeHistoryEntry(raw: unknown): StudyDailyHistoryEntry | null {
  if (!raw || typeof raw !== 'object')
    return null

  const row = raw as Record<string, unknown>
  if (typeof row.dayKey !== 'string')
    return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.dayKey))
    return null

  const focusTaskIds = Array.isArray(row.focusTaskIds)
    ? row.focusTaskIds.filter(taskId => typeof taskId === 'string' && taskId.trim().length > 0)
    : []

  return {
    dayKey: row.dayKey,
    focusMinutes: typeof row.focusMinutes === 'number' && Number.isFinite(row.focusMinutes) ? row.focusMinutes : 0,
    focusSessions: typeof row.focusSessions === 'number' && Number.isFinite(row.focusSessions) ? row.focusSessions : 0,
    completedTasks: typeof row.completedTasks === 'number' && Number.isFinite(row.completedTasks) ? row.completedTasks : 0,
    interruptCount: typeof row.interruptCount === 'number' && Number.isFinite(row.interruptCount) ? row.interruptCount : 0,
    createdTasks: typeof row.createdTasks === 'number' && Number.isFinite(row.createdTasks) ? row.createdTasks : 0,
    focusTaskIds,
  }
}

function normalizeHistoryEntries(raw: unknown): StudyDailyHistoryEntry[] {
  if (!Array.isArray(raw))
    return []

  const normalizedEntries = raw
    .map(normalizeHistoryEntry)
    .filter((entry): entry is StudyDailyHistoryEntry => entry != null)
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))

  if (normalizedEntries.length <= MAX_HISTORY_ENTRIES)
    return normalizedEntries
  return normalizedEntries.slice(normalizedEntries.length - MAX_HISTORY_ENTRIES)
}

function compareTaskPriority(left: StudyTaskPriority, right: StudyTaskPriority) {
  const priorityRankMap: Record<StudyTaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }
  return priorityRankMap[left] - priorityRankMap[right]
}

function compareTaskDueDate(leftDueDate: string | undefined, rightDueDate: string | undefined) {
  if (leftDueDate && rightDueDate)
    return leftDueDate.localeCompare(rightDueDate)
  if (leftDueDate)
    return -1
  if (rightDueDate)
    return 1
  return 0
}

function compareTaskCreatedAt(leftCreatedAt: string, rightCreatedAt: string) {
  return taskDateTimeToTimestamp(leftCreatedAt) - taskDateTimeToTimestamp(rightCreatedAt)
}

export function sortStudyTasks(tasks: StudyTask[], mode: StudyTaskSortMode = DEFAULT_TASK_SORT_MODE): StudyTask[] {
  const copiedTasks = [...tasks]

  copiedTasks.sort((leftTask, rightTask) => {
    if (leftTask.done !== rightTask.done)
      return leftTask.done ? 1 : -1

    if (mode === 'priority') {
      const priorityCompared = compareTaskPriority(leftTask.priority, rightTask.priority)
      if (priorityCompared !== 0)
        return priorityCompared
      return compareTaskCreatedAt(leftTask.createdAt, rightTask.createdAt)
    }

    if (mode === 'dueDate') {
      const dueDateCompared = compareTaskDueDate(leftTask.dueDate, rightTask.dueDate)
      if (dueDateCompared !== 0)
        return dueDateCompared
      return compareTaskCreatedAt(leftTask.createdAt, rightTask.createdAt)
    }

    if (mode === 'createdAt')
      return compareTaskCreatedAt(leftTask.createdAt, rightTask.createdAt)

    const priorityCompared = compareTaskPriority(leftTask.priority, rightTask.priority)
    if (priorityCompared !== 0)
      return priorityCompared

    const dueDateCompared = compareTaskDueDate(leftTask.dueDate, rightTask.dueDate)
    if (dueDateCompared !== 0)
      return dueDateCompared

    return compareTaskCreatedAt(leftTask.createdAt, rightTask.createdAt)
  })

  return copiedTasks
}

export function isStudyTaskDueToday(task: StudyTask, now = new Date()): boolean {
  if (!task.dueDate || task.done)
    return false
  return task.dueDate === getLocalDayKey(now)
}

export function isStudyTaskOverdue(task: StudyTask, now = new Date()): boolean {
  if (!task.dueDate || task.done)
    return false
  return task.dueDate < getLocalDayKey(now)
}

function clampMinutes(value: number, minimum: number, maximum: number): number | null {
  if (!Number.isFinite(value))
    return null

  const roundedMinutes = Math.round(value)
  if (!Number.isFinite(roundedMinutes))
    return null

  return Math.min(maximum, Math.max(minimum, roundedMinutes))
}

function countInterruptEvents(events: StudyEventLogEntry[], statsDate: string): number {
  return events.filter((event) => {
    if (!INTERRUPT_EVENT_TYPES.has(event.type))
      return false
    return getLocalDayKeyFromTimestamp(event.at) === statsDate
  }).length
}

function escapeMarkdownCell(value: string): string {
  return value
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
}

function formatEventTypeForMarkdown(eventType: StudyEventLogEntry['type']): string {
  if (eventType === 'focus_started')
    return '开始专注'
  if (eventType === 'focus_completed')
    return '专注完成'
  if (eventType === 'session_paused')
    return '会话暂停'
  if (eventType === 'session_resumed')
    return '会话继续'
  if (eventType === 'focus_reset')
    return '重置会话'
  if (eventType === 'break_started')
    return '开始休息'
  if (eventType === 'break_completed')
    return '休息完成'
  if (eventType === 'task_added')
    return '新增任务'
  if (eventType === 'task_completed')
    return '完成任务'
  if (eventType === 'task_reopened')
    return '任务重开'
  if (eventType === 'task_deleted')
    return '删除任务'
  if (eventType === 'task_updated')
    return '更新任务信息'
  if (eventType === 'day_rollover')
    return '跨日重置'
  if (eventType === 'study_log_exported')
    return '导出 JSON 日志'
  if (eventType === 'study_markdown_report_exported')
    return '导出 Markdown 报告'
  if (eventType === 'reminder_shown')
    return '触发提醒'
  return eventType
}

function formatEventTimeForMarkdown(timestamp: number): string {
  if (!Number.isFinite(timestamp))
    return '时间无效'
  return new Date(timestamp).toLocaleString()
}

function formatDurationMinutes(durationMs: number): string {
  return `${Math.round(durationMs / MINUTE_IN_MS)}`
}

function formatTaskPriorityForMarkdown(priority: StudyTaskPriority): string {
  if (priority === 'high')
    return '高'
  if (priority === 'low')
    return '低'
  return '中'
}

function getTaskCompletionStatsForMarkdown(snapshot: StudyCompanionSnapshot) {
  const totalTasks = snapshot.tasks.length
  const completedTasks = snapshot.tasks.filter(task => task.done).length
  const pendingTasks = totalTasks - completedTasks
  const overdueTasks = snapshot.tasks.filter((task) => {
    if (task.done || !task.dueDate)
      return false
    return task.dueDate < snapshot.statsDate
  }).length
  const highPriorityPendingTasks = snapshot.tasks.filter(task => !task.done && task.priority === 'high').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    highPriorityPendingTasks,
    completionRate,
  }
}

function getTaskPriorityStatsForMarkdown(snapshot: StudyCompanionSnapshot) {
  const rows = [
    { key: 'high' as const, label: '高优先级' },
    { key: 'medium' as const, label: '中优先级' },
    { key: 'low' as const, label: '低优先级' },
  ].map(({ key, label }) => {
    const matchedTasks = snapshot.tasks.filter(task => task.priority === key)
    const completed = matchedTasks.filter(task => task.done).length
    return {
      label,
      total: matchedTasks.length,
      completed,
      pending: matchedTasks.length - completed,
    }
  })

  return rows
}

function getFocusQualityStatsForMarkdown(snapshot: StudyCompanionSnapshot) {
  const totalFocusMinutes = snapshot.history.last14Days.reduce((sum, entry) => sum + entry.focusMinutes, 0)
  const totalFocusSessions = snapshot.history.last14Days.reduce((sum, entry) => sum + entry.focusSessions, 0)
  const totalInterruptCount = snapshot.history.last14Days.reduce((sum, entry) => sum + entry.interruptCount, 0)
  const averageSessionMinutes = totalFocusSessions > 0
    ? Math.round((totalFocusMinutes / totalFocusSessions) * 10) / 10
    : 0

  return {
    totalFocusMinutes,
    totalFocusSessions,
    totalInterruptCount,
    averageSessionMinutes,
  }
}

function buildMarkdownReportFilename(statsDate: string): string {
  return `rin-study-report-${statsDate}.md`
}

function buildStudyMarkdownReportContent(snapshot: StudyCompanionSnapshot): string {
  const summaryRows = [
    `| 今日专注分钟 | ${snapshot.summary.todayFocusMinutes} |`,
    `| 今日专注轮数 | ${snapshot.summary.todayFocusSessions} |`,
    `| 今日完成任务数 | ${snapshot.summary.taskCompleted} |`,
    `| 今日中断次数 | ${snapshot.summary.todayInterruptCount} |`,
    `| 当前专注时长（分钟） | ${formatDurationMinutes(snapshot.timer.focusDurationMs)} |`,
    `| 当前休息时长（分钟） | ${formatDurationMinutes(snapshot.timer.breakDurationMs)} |`,
  ]

  const taskRows = snapshot.tasks.length > 0
    ? snapshot.tasks.map(task => `| ${escapeMarkdownCell(task.title)} | ${task.done ? '已完成' : '未完成'} | ${formatTaskPriorityForMarkdown(task.priority)} | ${task.dueDate ?? '-'} | ${task.completedAt ? formatEventTimeForMarkdown(new Date(task.completedAt).getTime()) : '-'} |`)
    : ['| （无任务） | - | - | - | - |']

  const weeklyHistoryRows = snapshot.history.last7Days.length > 0
    ? snapshot.history.last7Days.map(entry => `| ${entry.dayKey} | ${entry.focusMinutes} | ${entry.focusSessions} | ${entry.completedTasks} | ${entry.interruptCount} | ${(entry.focusTaskIds ?? []).join(', ') || '-'} |`)
    : ['| - | 0 | 0 | 0 | 0 | - |']

  const fortnightTrendRows = snapshot.history.last14Days.length > 0
    ? snapshot.history.last14Days.map(entry => `| ${entry.dayKey} | ${entry.focusMinutes} | ${entry.focusSessions} |`)
    : ['| - | 0 | 0 |']

  const completionStats = getTaskCompletionStatsForMarkdown(snapshot)
  const taskCompletionRows = [
    `| 总任务数 | ${completionStats.totalTasks} |`,
    `| 已完成 | ${completionStats.completedTasks} |`,
    `| 未完成 | ${completionStats.pendingTasks} |`,
    `| 已逾期 | ${completionStats.overdueTasks} |`,
    `| 高优先级未完成 | ${completionStats.highPriorityPendingTasks} |`,
    `| 完成率 | ${completionStats.completionRate}% |`,
  ]

  const focusQualityStats = getFocusQualityStatsForMarkdown(snapshot)
  const focusQualityRows = [
    `| 累计专注分钟（14 天） | ${focusQualityStats.totalFocusMinutes} |`,
    `| 累计专注轮次（14 天） | ${focusQualityStats.totalFocusSessions} |`,
    `| 累计中断次数（14 天） | ${focusQualityStats.totalInterruptCount} |`,
    `| 平均每轮时长 | ${focusQualityStats.averageSessionMinutes} 分钟 |`,
  ]

  const priorityRows = getTaskPriorityStatsForMarkdown(snapshot)
  const priorityDistributionRows = priorityRows.length > 0
    ? priorityRows.map(priority => `| ${priority.label} | ${priority.total} | ${priority.completed} | ${priority.pending} |`)
    : ['| - | 0 | 0 | 0 |']

  const recentEvents = [...snapshot.events].slice(-10).reverse()
  const eventRows = recentEvents.length > 0
    ? recentEvents.map(event => `| ${formatEventTimeForMarkdown(event.at)} | ${formatEventTypeForMarkdown(event.type)} | ${escapeMarkdownCell(JSON.stringify(event.detail ?? {}))} |`)
    : ['| - | - | - |']

  return [
    '# Rin 学习陪伴报告',
    '',
    `- 日期：${snapshot.statsDate}`,
    `- 导出时间：${formatEventTimeForMarkdown(new Date(snapshot.exportedAt).getTime())}`,
    '',
    '## 今日核心指标',
    '',
    '| 指标 | 数值 |',
    '|---|---|',
    ...summaryRows,
    '',
    '## 今日任务',
    '',
    '| 任务 | 状态 | 优先级 | 截止日期 | 完成时间 |',
    '|---|---|---|---|---|',
    ...taskRows,
    '',
    '## 最近 7 天学习趋势',
    '',
    '| 日期 | 专注分钟 | 专注轮数 | 完成任务 | 中断次数 | 关联任务 |',
    '|---|---|---|---|---|---|',
    ...weeklyHistoryRows,
    '',
    '## 最近 14 天趋势摘要',
    '',
    '| 日期 | 专注分钟 | 专注轮次 |',
    '|---|---:|---:|',
    ...fortnightTrendRows,
    '',
    '## 任务完成结构',
    '',
    '| 任务状态 | 数量 |',
    '|---|---:|',
    ...taskCompletionRows,
    '',
    '## 专注质量概览',
    '',
    '| 指标 | 数值 |',
    '|---|---:|',
    ...focusQualityRows,
    '',
    '## 优先级任务分布',
    '',
    '| 优先级 | 数量 | 已完成 | 未完成 |',
    '|---|---:|---:|---:|',
    ...priorityDistributionRows,
    '',
    '## 最近学习事件（最多 10 条）',
    '',
    '| 时间 | 事件 | 详情 |',
    '|---|---|---|',
    ...eventRows,
    '',
  ].join('\n')
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function cloneJsonRecord(record: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!record)
    return undefined

  try {
    return JSON.parse(JSON.stringify(record)) as Record<string, unknown>
  }
  catch {
    return {
      notice: 'detail_not_serializable',
    }
  }
}

function normalizeStudyTask(raw: unknown): StudyTask | null {
  if (!raw || typeof raw !== 'object')
    return null

  const task = raw as Record<string, unknown>
  if (typeof task.id !== 'string' || typeof task.title !== 'string')
    return null
  const normalizedTitle = task.title.trim()
  if (!normalizedTitle)
    return null

  const createdAt = normalizeTaskDateTime(task.createdAt)
  const completedAt = normalizeOptionalTaskDateTime(task.completedAt)

  return {
    id: task.id,
    title: normalizedTitle,
    done: Boolean(task.done),
    createdAt,
    ...(completedAt ? { completedAt } : {}),
    priority: normalizeStudyTaskPriority(task.priority),
    dueDate: normalizeTaskDueDate(task.dueDate),
  }
}

function cloneStudyTasks(tasks: StudyTask[]): StudyTask[] {
  return tasks.map((task) => {
    const normalizedCompletedAt = normalizeOptionalTaskDateTime(task.completedAt)

    return {
      id: `${task.id}`,
      title: `${task.title}`,
      done: Boolean(task.done),
      createdAt: normalizeTaskDateTime(task.createdAt),
      priority: normalizeStudyTaskPriority(task.priority),
      dueDate: normalizeTaskDueDate(task.dueDate),
      ...(normalizedCompletedAt == null ? {} : { completedAt: normalizedCompletedAt }),
    }
  })
}

function cloneStudyEvents(events: StudyEventLogEntry[]): StudyEventLogEntry[] {
  return events.map(event => ({
    id: `${event.id}`,
    at: Number.isFinite(event.at) ? event.at : 0,
    type: event.type,
    detail: cloneJsonRecord(event.detail),
  }))
}

/**
 * Default persisted shape for first run or partial migrations.
 */
export function createDefaultStudyCompanionPersisted(): StudyCompanionPersisted {
  return {
    statsDate: getLocalDayKey(),
    todayFocusSessions: 0,
    todayFocusMinutes: 0,
    cycleCount: 0,
    mode: 'idle',
    remainingMs: DEFAULT_FOCUS_DURATION_MS,
    segmentEndsAt: null,
    pausedCarry: null,
    focusDurationMs: DEFAULT_FOCUS_DURATION_MS,
    breakDurationMs: DEFAULT_BREAK_DURATION_MS,
    demoModeEnabled: false,
    previousFocusDurationMs: null,
    previousBreakDurationMs: null,
    selectedFocusTaskId: null,
    taskSortMode: DEFAULT_TASK_SORT_MODE,
    tasks: [],
    todayReminderCount: 0,
    mutedUntil: 0,
    studyEvents: [],
    historyEntries: [],
  }
}

function coercePersisted(raw: unknown): StudyCompanionPersisted {
  const base = createDefaultStudyCompanionPersisted()
  if (!raw || typeof raw !== 'object')
    return base

  const o = raw as Record<string, unknown>
  return {
    ...base,
    statsDate: typeof o.statsDate === 'string' ? o.statsDate : base.statsDate,
    todayFocusSessions: typeof o.todayFocusSessions === 'number' ? o.todayFocusSessions : base.todayFocusSessions,
    todayFocusMinutes: typeof o.todayFocusMinutes === 'number' ? o.todayFocusMinutes : base.todayFocusMinutes,
    cycleCount: typeof o.cycleCount === 'number' ? o.cycleCount : base.cycleCount,
    mode: o.mode === 'idle' || o.mode === 'focus' || o.mode === 'break' || o.mode === 'paused'
      ? o.mode
      : base.mode,
    remainingMs: typeof o.remainingMs === 'number' && o.remainingMs >= 0 ? o.remainingMs : base.remainingMs,
    segmentEndsAt: typeof o.segmentEndsAt === 'number' || o.segmentEndsAt === null
      ? o.segmentEndsAt as number | null
      : base.segmentEndsAt,
    pausedCarry: o.pausedCarry === 'focus' || o.pausedCarry === 'break' || o.pausedCarry === null
      ? o.pausedCarry
      : base.pausedCarry,
    focusDurationMs: typeof o.focusDurationMs === 'number' && o.focusDurationMs > 0 ? o.focusDurationMs : base.focusDurationMs,
    breakDurationMs: typeof o.breakDurationMs === 'number' && o.breakDurationMs > 0 ? o.breakDurationMs : base.breakDurationMs,
    demoModeEnabled: typeof o.demoModeEnabled === 'boolean' ? o.demoModeEnabled : base.demoModeEnabled,
    previousFocusDurationMs: typeof o.previousFocusDurationMs === 'number' && o.previousFocusDurationMs > 0
      ? o.previousFocusDurationMs
      : base.previousFocusDurationMs,
    previousBreakDurationMs: typeof o.previousBreakDurationMs === 'number' && o.previousBreakDurationMs > 0
      ? o.previousBreakDurationMs
      : base.previousBreakDurationMs,
    selectedFocusTaskId: typeof o.selectedFocusTaskId === 'string' || o.selectedFocusTaskId === null
      ? o.selectedFocusTaskId
      : base.selectedFocusTaskId,
    taskSortMode: normalizeTaskSortMode(o.taskSortMode),
    tasks: Array.isArray(o.tasks)
      ? o.tasks
          .map(normalizeStudyTask)
          .filter((task): task is StudyTask => task != null)
      : base.tasks,
    todayReminderCount: typeof o.todayReminderCount === 'number' ? o.todayReminderCount : base.todayReminderCount,
    mutedUntil: typeof o.mutedUntil === 'number' ? o.mutedUntil : base.mutedUntil,
    studyEvents: Array.isArray(o.studyEvents) ? o.studyEvents as StudyEventLogEntry[] : base.studyEvents,
    historyEntries: normalizeHistoryEntries(o.historyEntries),
  }
}

/**
 * Pinia store: Pomodoro state machine + persisted daily stats.
 *
 * Use when:
 * - Building Study Island controls (start / pause / resume / reset / break).
 * - Driving reminders, Live2D, or exports — read from this store only.
 *
 * Expects:
 * - A browser `localStorage` (Electron renderer satisfies this).
 *
 * Returns:
 * - Reactive persisted snapshot, actions, and a wall-clock aligned ticker.
 */
export const useStudyCompanionStore = defineStore('study-companion', () => {
  const persisted = useLocalStorageManualReset<StudyCompanionPersisted>(
    STORAGE_KEY,
    createDefaultStudyCompanionPersisted(),
    { deep: true },
  )

  persisted.value = coercePersisted(persisted.value)

  function getTaskById(taskId: string | null): StudyTask | null {
    if (!taskId)
      return null
    return persisted.value.tasks.find(task => task.id === taskId) ?? null
  }

  function getSelectedFocusTask(): StudyTask | null {
    const selectedTask = getTaskById(persisted.value.selectedFocusTaskId)
    if (!selectedTask || selectedTask.done)
      return null
    return selectedTask
  }

  function clearSelectedFocusTaskId() {
    persisted.value.selectedFocusTaskId = null
  }

  function sanitizeSelectedFocusTaskId() {
    if (persisted.value.selectedFocusTaskId == null)
      return
    if (!getSelectedFocusTask())
      clearSelectedFocusTaskId()
  }

  sanitizeSelectedFocusTaskId()

  function upsertHistoryEntry(entry: StudyDailyHistoryEntry) {
    const p = persisted.value
    const nextHistoryEntries = p.historyEntries.filter(historyEntry => historyEntry.dayKey !== entry.dayKey)
    nextHistoryEntries.push(entry)
    nextHistoryEntries.sort((left, right) => left.dayKey.localeCompare(right.dayKey))

    if (nextHistoryEntries.length > MAX_HISTORY_ENTRIES)
      nextHistoryEntries.splice(0, nextHistoryEntries.length - MAX_HISTORY_ENTRIES)

    p.historyEntries = nextHistoryEntries
  }

  function createHistoryEntryFromState(
    dayKey: string,
    focusMinutes: number,
    focusSessions: number,
  ): StudyDailyHistoryEntry {
    const p = persisted.value
    return {
      dayKey,
      focusMinutes,
      focusSessions,
      completedTasks: countEventByType(p.studyEvents, dayKey, 'task_completed'),
      interruptCount: countInterruptEvents(p.studyEvents, dayKey),
      createdTasks: countEventByType(p.studyEvents, dayKey, 'task_added'),
      focusTaskIds: collectFocusTaskIds(p.studyEvents, dayKey),
    }
  }

  function syncTodayHistoryEntry() {
    const p = persisted.value
    const todayEntry = createHistoryEntryFromState(
      p.statsDate,
      p.todayFocusMinutes,
      p.todayFocusSessions,
    )
    upsertHistoryEntry(todayEntry)
  }

  function rollupTodayToHistory() {
    syncTodayHistoryEntry()
  }

  function getTodayHistoryEntry(): StudyDailyHistoryEntry {
    const p = persisted.value
    const existingEntry = p.historyEntries.find(entry => entry.dayKey === p.statsDate)
    if (existingEntry)
      return existingEntry
    return createHistoryEntryFromState(p.statsDate, p.todayFocusMinutes, p.todayFocusSessions)
  }

  function getHistoryRange(days: number): StudyDailyHistoryEntry[] {
    rolloverIfNeeded()
    const normalizedDays = Math.min(365, Math.max(1, Math.round(days)))
    const p = persisted.value
    const historyMap = new Map(p.historyEntries.map(entry => [entry.dayKey, entry]))
    historyMap.set(p.statsDate, createHistoryEntryFromState(p.statsDate, p.todayFocusMinutes, p.todayFocusSessions))

    const historyRange: StudyDailyHistoryEntry[] = []
    for (let offset = normalizedDays - 1; offset >= 0; offset -= 1) {
      const dayKey = buildDayKeyOffset(p.statsDate, -offset)
      historyRange.push(historyMap.get(dayKey) ?? createEmptyHistoryEntry(dayKey))
    }
    return historyRange
  }

  function getLast7DaysStats() {
    return getHistoryRange(7)
  }

  function getLast14DaysStats() {
    return getHistoryRange(14)
  }

  function getLast30DaysStats() {
    return getHistoryRange(30)
  }

  function appendEvent(type: StudyEventLogEntry['type'], detail?: Record<string, unknown>) {
    const entry: StudyEventLogEntry = {
      id: randomId(),
      at: Date.now(),
      type,
      detail,
    }
    const next = [...persisted.value.studyEvents, entry]
    if (next.length > MAX_EVENT_LOG)
      next.splice(0, next.length - MAX_EVENT_LOG)
    persisted.value.studyEvents = next
    syncTodayHistoryEntry()
  }

  /**
   * Rolls daily counters when `statsDate` is not today (local day key). Idempotent.
   */
  function rolloverIfNeeded() {
    const today = getLocalDayKey()
    const p = persisted.value
    if (p.statsDate === today)
      return

    const previousStatsDate = p.statsDate
    const previousDayEntry = createHistoryEntryFromState(
      previousStatsDate,
      p.todayFocusMinutes,
      p.todayFocusSessions,
    )
    upsertHistoryEntry(previousDayEntry)

    p.statsDate = today
    p.todayFocusSessions = 0
    p.todayFocusMinutes = 0
    p.todayReminderCount = 0
    p.mutedUntil = 0
    p.tasks = []
    p.selectedFocusTaskId = null
    p.mode = 'idle'
    p.segmentEndsAt = null
    p.pausedCarry = null
    p.remainingMs = p.focusDurationMs
    appendEvent('day_rollover', { previousStatsDate })
  }

  function reconcileRunningTimerFromWallClock() {
    const p = persisted.value
    if ((p.mode !== 'focus' && p.mode !== 'break') || p.segmentEndsAt == null)
      return

    const nextRemaining = Math.max(0, p.segmentEndsAt - Date.now())
    p.remainingMs = nextRemaining
    if (nextRemaining <= 0)
      completeCurrentPhase()
  }

  function completeCurrentPhase() {
    const p = persisted.value
    if (p.mode === 'focus') {
      p.todayFocusSessions += 1
      p.todayFocusMinutes += Math.round(p.focusDurationMs / 60_000)
      p.cycleCount += 1
      p.mode = 'break'
      p.remainingMs = p.breakDurationMs
      p.segmentEndsAt = Date.now() + p.breakDurationMs
      p.pausedCarry = 'break'
      appendEvent('focus_completed', {})
      return
    }

    if (p.mode === 'break') {
      p.mode = 'idle'
      p.remainingMs = p.focusDurationMs
      p.segmentEndsAt = null
      p.pausedCarry = null
      appendEvent('break_completed', {})
    }
  }

  function tick() {
    rolloverIfNeeded()
    reconcileRunningTimerFromWallClock()
  }

  useIntervalFn(tick, 250, { immediate: false }).resume()

  watch(
    () => persisted.value.mode,
    (mode: StudyCompanionMode) => {
      if (mode === 'idle' || mode === 'paused')
        reconcileRunningTimerFromWallClock()
    },
  )

  const isRunning = computed(() => {
    const p = persisted.value
    return (p.mode === 'focus' || p.mode === 'break') && p.segmentEndsAt != null
  })

  const isMuted = computed(() => persisted.value.mutedUntil > Date.now())
  const demoModeEnabled = computed(() => persisted.value.demoModeEnabled)
  const taskTotal = computed(() => persisted.value.tasks.length)
  const taskCompleted = computed(() => persisted.value.tasks.filter(task => task.done).length)
  const taskPending = computed(() => taskTotal.value - taskCompleted.value)
  const taskSortMode = computed(() => persisted.value.taskSortMode)
  const sortedTasks = computed(() => sortStudyTasks(persisted.value.tasks, taskSortMode.value))
  const sortedPendingTasks = computed(() => sortedTasks.value.filter(task => !task.done))
  const historyEntries = computed(() => persisted.value.historyEntries)
  const focusMinutes = computed(() => Math.round(persisted.value.focusDurationMs / MINUTE_IN_MS))
  const breakMinutes = computed(() => Math.round(persisted.value.breakDurationMs / MINUTE_IN_MS))
  const selectedFocusTask = computed(() => getSelectedFocusTask())
  const todayInterruptCount = computed(() => {
    return countInterruptEvents(persisted.value.studyEvents, persisted.value.statsDate)
  })

  /**
   * Starts a focus segment from `idle`, or resumes when already paused in focus.
   */
  function startFocus() {
    rolloverIfNeeded()
    const p = persisted.value
    if (p.mode === 'paused' && p.pausedCarry === 'focus') {
      resume()
      return
    }
    if (p.mode === 'focus' && p.segmentEndsAt != null)
      return

    const from = p.mode
    const selectedTask = getSelectedFocusTask()
    p.mode = 'focus'
    p.remainingMs = p.focusDurationMs
    p.segmentEndsAt = Date.now() + p.focusDurationMs
    p.pausedCarry = 'focus'
    appendEvent('focus_started', {
      from,
      ...(selectedTask
        ? {
            taskId: selectedTask.id,
            taskTitle: selectedTask.title,
          }
        : {}),
    })
  }

  /**
   * Starts a short break from `idle` (manual rest). Does not mutate completed focus stats.
   */
  function startBreak() {
    rolloverIfNeeded()
    const p = persisted.value
    if (p.mode === 'focus' && p.segmentEndsAt != null)
      return
    if (p.mode === 'paused' && p.pausedCarry === 'focus')
      return
    if (p.mode === 'paused' && p.pausedCarry === 'break') {
      resume()
      return
    }
    if (p.mode === 'break' && p.segmentEndsAt != null)
      return

    p.mode = 'break'
    p.remainingMs = p.breakDurationMs
    p.segmentEndsAt = Date.now() + p.breakDurationMs
    p.pausedCarry = 'break'
    appendEvent('break_started', { manual: true })
  }

  /**
   * Pauses an active focus or break segment.
   */
  function pause() {
    const p = persisted.value
    if (p.mode !== 'focus' && p.mode !== 'break')
      return
    if (p.segmentEndsAt == null)
      return

    p.remainingMs = Math.max(0, p.segmentEndsAt - Date.now())
    p.segmentEndsAt = null
    p.pausedCarry = p.mode === 'focus' ? 'focus' : 'break'
    p.mode = 'paused'
    appendEvent('session_paused', { carry: p.pausedCarry })
  }

  /**
   * Resumes from `paused` into the carried phase.
   */
  function resume() {
    const p = persisted.value
    if (p.mode !== 'paused' || !p.pausedCarry)
      return

    const carry = p.pausedCarry
    p.mode = p.pausedCarry
    p.segmentEndsAt = Date.now() + p.remainingMs
    appendEvent('session_resumed', { carry })
  }

  /**
   * Returns to `idle` and clears the active segment (no stats change).
   */
  function resetSession() {
    const p = persisted.value
    const shouldReset = p.mode !== 'idle'
      || p.segmentEndsAt != null
      || p.pausedCarry != null
      || p.remainingMs !== p.focusDurationMs
    if (!shouldReset)
      return

    p.mode = 'idle'
    p.segmentEndsAt = null
    p.pausedCarry = null
    p.remainingMs = p.focusDurationMs
    appendEvent('focus_reset', {})
  }

  /**
   * Hydrates countdown after tab sleep: call when `document` becomes visible if needed.
   */
  function syncFromWallClock() {
    tick()
  }

  function alignRunningSegmentDuration(targetDurationMs: number) {
    const p = persisted.value
    const clampedRemaining = Math.min(Math.max(0, p.remainingMs), targetDurationMs)
    p.remainingMs = clampedRemaining

    if (p.segmentEndsAt != null)
      p.segmentEndsAt = Date.now() + clampedRemaining
  }

  function setFocusMinutes(minutes: number) {
    const nextMinutes = clampMinutes(minutes, MIN_FOCUS_MINUTES, MAX_FOCUS_MINUTES)
    if (nextMinutes == null)
      return

    const nextDurationMs = nextMinutes * MINUTE_IN_MS
    const p = persisted.value
    if (p.demoModeEnabled) {
      persisted.value = {
        ...p,
        previousFocusDurationMs: nextDurationMs,
      }
      return
    }

    if (p.focusDurationMs === nextDurationMs)
      return

    persisted.value = {
      ...p,
      focusDurationMs: nextDurationMs,
      remainingMs: p.mode === 'idle' ? nextDurationMs : p.remainingMs,
    }
  }

  function setBreakMinutes(minutes: number) {
    const nextMinutes = clampMinutes(minutes, MIN_BREAK_MINUTES, MAX_BREAK_MINUTES)
    if (nextMinutes == null)
      return

    const nextDurationMs = nextMinutes * MINUTE_IN_MS
    const p = persisted.value
    if (p.demoModeEnabled) {
      persisted.value = {
        ...p,
        previousBreakDurationMs: nextDurationMs,
      }
      return
    }

    if (p.breakDurationMs === nextDurationMs)
      return

    persisted.value = {
      ...p,
      breakDurationMs: nextDurationMs,
    }
  }

  function setTaskSortMode(mode: StudyTaskSortMode) {
    const normalizedMode = normalizeTaskSortMode(mode)
    if (persisted.value.taskSortMode === normalizedMode)
      return
    persisted.value = {
      ...persisted.value,
      taskSortMode: normalizedMode,
    }
  }

  function setSelectedFocusTaskId(taskId: string | null) {
    rolloverIfNeeded()
    if (taskId == null) {
      clearSelectedFocusTaskId()
      return
    }

    const nextTask = persisted.value.tasks.find(task => task.id === taskId && !task.done)
    if (!nextTask)
      return

    persisted.value.selectedFocusTaskId = nextTask.id
  }

  function completeSelectedFocusTask(): boolean {
    const selectedTask = getSelectedFocusTask()
    if (!selectedTask)
      return false

    toggleTaskDone(selectedTask.id)
    return true
  }

  function getTodayInterruptCount(): number {
    return todayInterruptCount.value
  }

  /**
   * Enables quick demo durations for course presentation mode.
   */
  function enableDemoMode() {
    const p = persisted.value
    if (p.demoModeEnabled)
      return

    p.previousFocusDurationMs = p.focusDurationMs
    p.previousBreakDurationMs = p.breakDurationMs
    p.demoModeEnabled = true
    p.focusDurationMs = DEMO_FOCUS_DURATION_MS
    p.breakDurationMs = DEMO_BREAK_DURATION_MS

    if (p.mode === 'idle') {
      p.remainingMs = p.focusDurationMs
    }
    else if (p.mode === 'focus' || (p.mode === 'paused' && p.pausedCarry === 'focus')) {
      alignRunningSegmentDuration(p.focusDurationMs)
    }
    else if (p.mode === 'break' || (p.mode === 'paused' && p.pausedCarry === 'break')) {
      alignRunningSegmentDuration(p.breakDurationMs)
    }

    appendEvent('demo_mode_enabled', {
      focusDurationMs: p.focusDurationMs,
      breakDurationMs: p.breakDurationMs,
    })
  }

  /**
   * Restores normal durations after demo mode.
   */
  function disableDemoMode() {
    const p = persisted.value
    if (!p.demoModeEnabled)
      return

    const restoredFocusDuration = p.previousFocusDurationMs ?? DEFAULT_FOCUS_DURATION_MS
    const restoredBreakDuration = p.previousBreakDurationMs ?? DEFAULT_BREAK_DURATION_MS

    p.focusDurationMs = restoredFocusDuration
    p.breakDurationMs = restoredBreakDuration
    p.demoModeEnabled = false
    p.previousFocusDurationMs = null
    p.previousBreakDurationMs = null

    if (p.mode === 'idle') {
      p.remainingMs = p.focusDurationMs
    }
    else if (p.mode === 'focus' || (p.mode === 'paused' && p.pausedCarry === 'focus')) {
      alignRunningSegmentDuration(p.focusDurationMs)
    }
    else if (p.mode === 'break' || (p.mode === 'paused' && p.pausedCarry === 'break')) {
      alignRunningSegmentDuration(p.breakDurationMs)
    }

    appendEvent('demo_mode_disabled', {
      focusDurationMs: p.focusDurationMs,
      breakDurationMs: p.breakDurationMs,
    })
  }

  function toggleDemoMode() {
    if (persisted.value.demoModeEnabled) {
      disableDemoMode()
      return
    }

    enableDemoMode()
  }

  /**
   * Adds a lightweight today-task row and records it in study events.
   */
  function addTask(taskInput: string | StudyTaskInput) {
    rolloverIfNeeded()
    const normalizedPayload = typeof taskInput === 'string'
      ? { title: taskInput }
      : taskInput
    const normalizedTitle = normalizedPayload.title.trim()
    if (!normalizedTitle)
      return

    const taskPriority = normalizeStudyTaskPriority(normalizedPayload.priority)
    const taskDueDate = normalizeTaskDueDate(normalizedPayload.dueDate)
    const nextTask: StudyTask = {
      id: randomId(),
      title: normalizedTitle,
      done: false,
      createdAt: new Date().toISOString(),
      priority: taskPriority,
      dueDate: taskDueDate,
    }

    persisted.value = {
      ...persisted.value,
      tasks: [...persisted.value.tasks, nextTask],
    }
    appendEvent('task_added', {
      id: nextTask.id,
      title: nextTask.title,
      priority: nextTask.priority,
      dueDate: nextTask.dueDate,
    })
  }

  function setTaskPriority(taskId: string, priority: StudyTaskPriority) {
    rolloverIfNeeded()
    const normalizedPriority = normalizeStudyTaskPriority(priority)
    const targetTask = persisted.value.tasks.find(task => task.id === taskId)
    if (!targetTask || targetTask.priority === normalizedPriority)
      return

    persisted.value = {
      ...persisted.value,
      tasks: persisted.value.tasks.map(task => task.id === taskId ? { ...task, priority: normalizedPriority } : task),
    }

    appendEvent('task_updated', {
      id: taskId,
      priority: normalizedPriority,
    })
  }

  function setTaskDueDate(taskId: string, dueDate: string | null) {
    rolloverIfNeeded()
    const normalizedDueDate = normalizeTaskDueDate(dueDate ?? undefined)
    const targetTask = persisted.value.tasks.find(task => task.id === taskId)
    if (!targetTask)
      return
    if ((targetTask.dueDate ?? undefined) === normalizedDueDate)
      return

    persisted.value = {
      ...persisted.value,
      tasks: persisted.value.tasks.map(task => task.id === taskId
        ? {
            ...task,
            ...(normalizedDueDate ? { dueDate: normalizedDueDate } : { dueDate: undefined }),
          }
        : task),
    }

    appendEvent('task_updated', {
      id: taskId,
      dueDate: normalizedDueDate,
    })
  }

  /**
   * Toggles task completion and records either complete or reopen events.
   */
  function toggleTaskDone(id: string) {
    rolloverIfNeeded()
    const task = persisted.value.tasks.find(item => item.id === id)
    if (!task)
      return

    const toggledDone = !task.done
    const toggledTask: StudyTask = {
      ...task,
      done: toggledDone,
      completedAt: toggledDone ? new Date().toISOString() : undefined,
    }
    persisted.value = {
      ...persisted.value,
      tasks: persisted.value.tasks.map(existingTask => existingTask.id === id ? toggledTask : existingTask),
    }
    if (toggledDone && persisted.value.selectedFocusTaskId === toggledTask.id)
      clearSelectedFocusTaskId()

    if (task.done) {
      appendEvent('task_reopened', {
        id: toggledTask.id,
        title: toggledTask.title,
      })
      return
    }

    appendEvent('task_completed', {
      id: toggledTask.id,
      title: toggledTask.title,
    })
  }

  /**
   * Removes one task by id and records a delete event.
   */
  function deleteTask(id: string) {
    rolloverIfNeeded()
    const targetTask = persisted.value.tasks.find(task => task.id === id)
    if (!targetTask)
      return

    persisted.value = {
      ...persisted.value,
      tasks: persisted.value.tasks.filter(task => task.id !== id),
    }
    if (persisted.value.selectedFocusTaskId === id)
      clearSelectedFocusTaskId()
    appendEvent('task_deleted', {
      id: targetTask.id,
      title: targetTask.title,
    })
  }

  /**
   * Clears all completed tasks and keeps pending tasks untouched.
   */
  function clearCompletedTasks() {
    rolloverIfNeeded()
    persisted.value = {
      ...persisted.value,
      tasks: persisted.value.tasks.filter(task => !task.done),
    }
    sanitizeSelectedFocusTaskId()
  }

  /**
   * Creates a JSON-ready snapshot for Study Island stats/log export.
   */
  function createStudySnapshot(): StudyCompanionSnapshot {
    const p = persisted.value

    const taskSnapshot = sortStudyTasks(cloneStudyTasks(p.tasks), p.taskSortMode)
    const eventSnapshot = cloneStudyEvents(p.studyEvents)
    const taskCompleted = taskSnapshot.filter(task => task.done).length
    const todayInterruptCountValue = countInterruptEvents(eventSnapshot, p.statsDate)
    const historyLast7Days = getLast7DaysStats().map(entry => ({
      ...entry,
      focusTaskIds: [...(entry.focusTaskIds ?? [])],
    }))
    const historyLast14Days = getLast14DaysStats().map(entry => ({
      ...entry,
      focusTaskIds: [...(entry.focusTaskIds ?? [])],
    }))

    return {
      schemaVersion: 1,
      app: 'Rin',
      feature: 'study-companion',
      project: 'Rin Study Companion',
      exportedAt: new Date().toISOString(),
      demoModeEnabled: p.demoModeEnabled,
      statsDate: p.statsDate,
      summary: {
        todayFocusSessions: p.todayFocusSessions,
        todayFocusMinutes: p.todayFocusMinutes,
        cycleCount: p.cycleCount,
        todayReminderCount: p.todayReminderCount,
        taskTotal: taskSnapshot.length,
        taskCompleted,
        taskPending: taskSnapshot.length - taskCompleted,
        todayInterruptCount: todayInterruptCountValue,
        mode: p.mode,
        isRunning: isRunning.value,
        isMuted: isMuted.value,
      },
      timer: {
        remainingMs: p.remainingMs,
        segmentEndsAt: p.segmentEndsAt,
        focusDurationMs: p.focusDurationMs,
        breakDurationMs: p.breakDurationMs,
      },
      tasks: taskSnapshot,
      events: eventSnapshot,
      history: {
        last7Days: historyLast7Days,
        last14Days: historyLast14Days,
      },
    }
  }

  /**
   * Creates a JSON-ready snapshot for Study Island stats/log export.
   */
  function exportStudySnapshot(): StudyCompanionSnapshot {
    const p = persisted.value
    appendEvent('study_log_exported', { statsDate: p.statsDate })
    return createStudySnapshot()
  }

  /**
   * Builds the markdown report body based on current study snapshot.
   */
  function buildStudyMarkdownReport(): string {
    return buildStudyMarkdownReportContent(createStudySnapshot())
  }

  /**
   * Creates a markdown report with a stable filename for sharing and demo usage.
   */
  function exportStudyMarkdownReport(): StudyMarkdownReportExport {
    const snapshot = createStudySnapshot()
    appendEvent('study_markdown_report_exported', { statsDate: snapshot.statsDate })
    return {
      filename: buildMarkdownReportFilename(snapshot.statsDate),
      markdown: buildStudyMarkdownReportContent(snapshot),
      statsDate: snapshot.statsDate,
    }
  }

  /**
   * Clears the activity log and keeps a single marker event.
   */
  function clearStudyEvents() {
    persisted.value.studyEvents = []
    appendEvent('study_events_cleared', { statsDate: persisted.value.statsDate })
  }

  /**
   * Clears today's counters and today's event log only.
   */
  function clearTodayStudyStats() {
    const p = persisted.value
    p.todayFocusSessions = 0
    p.todayFocusMinutes = 0
    p.todayReminderCount = 0
    p.studyEvents = []
    appendEvent('study_stats_cleared', { statsDate: p.statsDate })
  }

  syncTodayHistoryEntry()

  return {
    persisted,
    isRunning,
    isMuted,
    demoModeEnabled,
    taskSortMode,
    sortedTasks,
    sortedPendingTasks,
    historyEntries,
    focusMinutes,
    breakMinutes,
    selectedFocusTask,
    todayInterruptCount,
    taskTotal,
    taskCompleted,
    taskPending,
    startFocus,
    startBreak,
    pause,
    resume,
    resetSession,
    syncFromWallClock,
    rolloverIfNeeded,
    rollupTodayToHistory,
    getTodayHistoryEntry,
    getHistoryRange,
    getLast7DaysStats,
    getLast14DaysStats,
    getLast30DaysStats,
    setFocusMinutes,
    setBreakMinutes,
    setTaskSortMode,
    setSelectedFocusTaskId,
    setTaskPriority,
    setTaskDueDate,
    getSelectedFocusTask,
    completeSelectedFocusTask,
    getTodayInterruptCount,
    appendEvent,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode,
    addTask,
    toggleTaskDone,
    deleteTask,
    clearCompletedTasks,
    exportStudySnapshot,
    buildStudyMarkdownReport,
    exportStudyMarkdownReport,
    clearStudyEvents,
    clearTodayStudyStats,
  }
})
