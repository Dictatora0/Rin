import type {
  StudyDailyHistoryEntry,
  StudyTask,
  StudyTaskPriority,
} from '@proj-airi/stage-ui/stores/modules/study-companion'

/**
 * Trend row used by line/area charts.
 */
export interface StudyTrendPoint {
  dayKey: string
  label: string
  focusMinutes: number
  focusSessions: number
}

/**
 * Aggregated task completion structure.
 */
export interface StudyTaskCompletionStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  highPriorityPendingTasks: number
  completionRate: number
}

/**
 * Priority-distribution row.
 */
export interface StudyTaskPriorityRow {
  priority: StudyTaskPriority
  label: string
  total: number
  completed: number
  pending: number
}

/**
 * Priority-distribution aggregate.
 */
export interface StudyTaskPriorityStats {
  totalTasks: number
  rows: StudyTaskPriorityRow[]
}

/**
 * Focus quality overview.
 */
export interface StudyFocusQualityStats {
  totalFocusMinutes: number
  totalFocusSessions: number
  totalInterruptCount: number
  averageSessionMinutes: number
  last7AverageMinutes: number
  last7AverageSessions: number
}

interface FocusQualityTodayStats {
  todayFocusMinutes: number
  todayFocusSessions: number
  todayInterruptCount: number
}

function parseDayKey(dayKey: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey)
  if (!matched)
    return null

  const year = Number.parseInt(matched[1], 10)
  const month = Number.parseInt(matched[2], 10)
  const day = Number.parseInt(matched[3], 10)
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

function toLocalDayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDayKey(baseDayKey: string, offsetDays: number) {
  const baseDate = parseDayKey(baseDayKey) ?? new Date()
  const shiftedDate = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return toLocalDayKey(shiftedDate)
}

/**
 * Formats `YYYY-MM-DD` into compact chart labels.
 *
 * Use when:
 * - Rendering dense chart x-axis labels.
 *
 * Expects:
 * - A day key in `YYYY-MM-DD`.
 *
 * Returns:
 * - `MM-DD` label when valid; otherwise the original value.
 */
export function formatChartDateLabel(dayKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey))
    return dayKey
  return dayKey.slice(5)
}

/**
 * Builds a continuous trend series from daily history rows.
 *
 * Use when:
 * - Rendering 7/14/30 day trend charts.
 *
 * Expects:
 * - History rows may be sparse; missing dates are filled with `0`.
 *
 * Returns:
 * - A continuous day-key sequence ending at `endDayKey` (or latest entry / today).
 */
export function buildStudyTrendSeries(
  historyEntries: StudyDailyHistoryEntry[],
  days: number,
  endDayKey?: string,
): StudyTrendPoint[] {
  const normalizedDays = Math.max(1, Math.min(365, Math.round(days)))
  const historyMap = new Map(historyEntries.map(entry => [entry.dayKey, entry]))
  const latestFromHistory = historyEntries.at(-1)?.dayKey
  const resolvedEndDayKey = endDayKey ?? latestFromHistory ?? toLocalDayKey()

  const points: StudyTrendPoint[] = []
  for (let offset = normalizedDays - 1; offset >= 0; offset -= 1) {
    const dayKey = shiftDayKey(resolvedEndDayKey, -offset)
    const history = historyMap.get(dayKey)
    points.push({
      dayKey,
      label: formatChartDateLabel(dayKey),
      focusMinutes: history?.focusMinutes ?? 0,
      focusSessions: history?.focusSessions ?? 0,
    })
  }
  return points
}

/**
 * Builds task completion structure used by donut/segment charts.
 *
 * Use when:
 * - Rendering completion breakdown and overdue reminders.
 *
 * Expects:
 * - Task rows with optional due date and priority.
 *
 * Returns:
 * - Completed/pending/overdue counts and completion rate (0-100).
 */
export function buildTaskCompletionStats(tasks: StudyTask[], now = new Date()): StudyTaskCompletionStats {
  const todayDayKey = toLocalDayKey(now)
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.done).length
  const pendingTasks = totalTasks - completedTasks
  const overdueTasks = tasks.filter(task => !task.done && typeof task.dueDate === 'string' && task.dueDate < todayDayKey).length
  const highPriorityPendingTasks = tasks.filter(task => !task.done && (task.priority ?? 'medium') === 'high').length
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

function getPriorityLabel(priority: StudyTaskPriority) {
  if (priority === 'high')
    return '高优先级'
  if (priority === 'low')
    return '低优先级'
  return '中优先级'
}

/**
 * Builds high/medium/low priority distribution.
 *
 * Use when:
 * - Rendering priority breakdown bars.
 *
 * Expects:
 * - Legacy tasks may miss priority and are treated as `medium`.
 *
 * Returns:
 * - Priority rows including total/completed/pending.
 */
export function buildTaskPriorityStats(tasks: StudyTask[]): StudyTaskPriorityStats {
  const priorities: StudyTaskPriority[] = ['high', 'medium', 'low']
  const rows = priorities.map((priority) => {
    const matched = tasks.filter(task => (task.priority ?? 'medium') === priority)
    const completed = matched.filter(task => task.done).length
    return {
      priority,
      label: getPriorityLabel(priority),
      total: matched.length,
      completed,
      pending: matched.length - completed,
    }
  })

  return {
    totalTasks: tasks.length,
    rows,
  }
}

function roundSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

/**
 * Builds focus quality overview for summary cards.
 *
 * Use when:
 * - Rendering cumulative quality metrics in settings/report.
 *
 * Expects:
 * - `historyEntries` should already represent a recent day range.
 * - `todayStats` supplements current-day counters.
 *
 * Returns:
 * - Total minutes/sessions/interrupts and average-session metrics.
 */
export function buildFocusQualityStats(
  historyEntries: StudyDailyHistoryEntry[],
  todayStats: FocusQualityTodayStats,
): StudyFocusQualityStats {
  const totalFocusMinutes = historyEntries.reduce((sum, entry) => sum + entry.focusMinutes, 0) + Math.max(0, todayStats.todayFocusMinutes)
  const totalFocusSessions = historyEntries.reduce((sum, entry) => sum + entry.focusSessions, 0) + Math.max(0, todayStats.todayFocusSessions)
  const totalInterruptCount = historyEntries.reduce((sum, entry) => sum + entry.interruptCount, 0) + Math.max(0, todayStats.todayInterruptCount)

  const averageSessionMinutes = totalFocusSessions > 0
    ? roundSingleDecimal(totalFocusMinutes / totalFocusSessions)
    : 0

  const last7Entries = historyEntries.slice(-7)
  const last7FocusMinutes = last7Entries.reduce((sum, entry) => sum + entry.focusMinutes, 0)
  const last7FocusSessions = last7Entries.reduce((sum, entry) => sum + entry.focusSessions, 0)

  return {
    totalFocusMinutes,
    totalFocusSessions,
    totalInterruptCount,
    averageSessionMinutes,
    last7AverageMinutes: roundSingleDecimal(last7FocusMinutes / 7),
    last7AverageSessions: roundSingleDecimal(last7FocusSessions / 7),
  }
}
