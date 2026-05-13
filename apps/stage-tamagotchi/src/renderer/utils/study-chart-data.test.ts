import type { StudyDailyHistoryEntry, StudyTask } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { describe, expect, it } from 'vitest'

import {
  buildFocusQualityStats,
  buildStudyTrendSeries,
  buildTaskCompletionStats,
  buildTaskPriorityStats,
  formatChartDateLabel,
} from './study-chart-data'

function createHistoryEntry(
  dayKey: string,
  focusMinutes: number,
  focusSessions: number,
  completedTasks = 0,
  interruptCount = 0,
): StudyDailyHistoryEntry {
  return {
    dayKey,
    focusMinutes,
    focusSessions,
    completedTasks,
    interruptCount,
    createdTasks: completedTasks,
    focusTaskIds: [],
  }
}

describe('study-chart-data', () => {
  it('fills missing days with zero values for 14-day trend', () => {
    const entries = [
      createHistoryEntry('2026-05-01', 30, 1),
      createHistoryEntry('2026-05-03', 20, 1),
      createHistoryEntry('2026-05-08', 45, 2),
    ]

    const trend = buildStudyTrendSeries(entries, 14, '2026-05-10')
    expect(trend).toHaveLength(14)
    expect(trend[0]?.dayKey).toBe('2026-04-27')
    expect(trend[13]?.dayKey).toBe('2026-05-10')
    expect(trend.find(point => point.dayKey === '2026-05-02')?.focusMinutes).toBe(0)
    expect(trend.find(point => point.dayKey === '2026-05-03')?.focusMinutes).toBe(20)
  })

  it('returns zero trend values when history is empty', () => {
    const trend = buildStudyTrendSeries([], 7, '2026-05-10')
    expect(trend.map(point => point.focusMinutes)).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(trend.map(point => point.focusSessions)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('builds task completion stats with overdue and high-priority pending counts', () => {
    const tasks: StudyTask[] = [
      { id: 'done-high', title: 'done-high', done: true, createdAt: '2026-05-10T01:00:00.000Z', priority: 'high' },
      { id: 'pending-overdue', title: 'pending-overdue', done: false, createdAt: '2026-05-10T02:00:00.000Z', priority: 'high', dueDate: '2026-05-08' },
      { id: 'pending-normal', title: 'pending-normal', done: false, createdAt: '2026-05-10T03:00:00.000Z', priority: 'medium', dueDate: '2026-05-12' },
      { id: 'pending-low', title: 'pending-low', done: false, createdAt: '2026-05-10T04:00:00.000Z', priority: 'low' },
    ]

    const stats = buildTaskCompletionStats(tasks, new Date('2026-05-10T12:00:00.000Z'))
    expect(stats.totalTasks).toBe(4)
    expect(stats.completedTasks).toBe(1)
    expect(stats.pendingTasks).toBe(3)
    expect(stats.overdueTasks).toBe(1)
    expect(stats.highPriorityPendingTasks).toBe(1)
    expect(stats.completionRate).toBe(25)
  })

  it('treats missing priority as medium when building priority stats', () => {
    const tasks = [
      { id: 'high', title: 'high', done: false, createdAt: '2026-05-10T01:00:00.000Z', priority: 'high' },
      { id: 'legacy', title: 'legacy', done: false, createdAt: '2026-05-10T02:00:00.000Z' },
      { id: 'low-done', title: 'low-done', done: true, createdAt: '2026-05-10T03:00:00.000Z', priority: 'low' },
    ] as StudyTask[]

    const stats = buildTaskPriorityStats(tasks)
    expect(stats.totalTasks).toBe(3)
    expect(stats.rows.find(row => row.priority === 'high')?.total).toBe(1)
    expect(stats.rows.find(row => row.priority === 'medium')?.total).toBe(1)
    expect(stats.rows.find(row => row.priority === 'low')?.completed).toBe(1)
  })

  it('builds focus quality metrics including average session minutes', () => {
    const historyEntries = [
      createHistoryEntry('2026-05-01', 30, 1, 1, 1),
      createHistoryEntry('2026-05-02', 60, 2, 2, 0),
      createHistoryEntry('2026-05-03', 15, 1, 0, 2),
      createHistoryEntry('2026-05-04', 0, 0, 0, 0),
      createHistoryEntry('2026-05-05', 45, 1, 1, 1),
      createHistoryEntry('2026-05-06', 20, 1, 1, 0),
      createHistoryEntry('2026-05-07', 40, 2, 1, 1),
    ]

    const quality = buildFocusQualityStats(historyEntries, {
      todayFocusMinutes: 50,
      todayFocusSessions: 2,
      todayInterruptCount: 1,
    })

    expect(quality.totalFocusMinutes).toBe(260)
    expect(quality.totalFocusSessions).toBe(10)
    expect(quality.totalInterruptCount).toBe(6)
    expect(quality.averageSessionMinutes).toBe(26)
    expect(quality.last7AverageMinutes).toBe(30)
    expect(quality.last7AverageSessions).toBe(1.1)
  })

  it('formats chart date label as MM-DD', () => {
    expect(formatChartDateLabel('2026-05-12')).toBe('05-12')
    expect(formatChartDateLabel('invalid')).toBe('invalid')
  })
})
