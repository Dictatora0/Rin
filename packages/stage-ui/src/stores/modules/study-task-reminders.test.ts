import { describe, expect, it } from 'vitest'

import {
  buildRecommendedReminderRules,
  getDueTaskReminders,
  getReminderRecommendationPlan,
  reminderRuleToMs,
} from './study-task-reminders'

function createBaseTask() {
  return {
    id: 'task-1',
    title: '完成课程报告',
    done: false,
    dueDate: '2026-05-08',
    reminders: [
      {
        id: 'reminder-1d',
        amount: 1,
        unit: 'day' as const,
        enabled: true,
        source: 'user-custom' as const,
        label: '自定义：提前 1 天',
      },
      {
        id: 'reminder-1h',
        amount: 1,
        unit: 'hour' as const,
        enabled: true,
        source: 'user-custom' as const,
        label: '自定义：提前 1 小时',
      },
    ],
    reminderDeliveries: [],
  }
}

describe('study-task-reminders recommendation rules', () => {
  it('returns expected interval plans by remaining time ranges', () => {
    expect(getReminderRecommendationPlan(40 * 60 * 1000)).toEqual([{ amount: 10, unit: 'minute' }])
    expect(getReminderRecommendationPlan(2 * 60 * 60 * 1000)).toEqual([
      { amount: 1, unit: 'hour' },
      { amount: 15, unit: 'minute' },
    ])
    expect(getReminderRecommendationPlan(8 * 60 * 60 * 1000)).toEqual([
      { amount: 6, unit: 'hour' },
      { amount: 1, unit: 'hour' },
    ])
    expect(getReminderRecommendationPlan(2 * 24 * 60 * 60 * 1000)).toEqual([
      { amount: 1, unit: 'day' },
      { amount: 3, unit: 'hour' },
    ])
    expect(getReminderRecommendationPlan(5 * 24 * 60 * 60 * 1000)).toEqual([
      { amount: 3, unit: 'day' },
      { amount: 1, unit: 'day' },
      { amount: 3, unit: 'hour' },
    ])
    expect(getReminderRecommendationPlan(10 * 24 * 60 * 60 * 1000)).toEqual([
      { amount: 7, unit: 'day' },
      { amount: 3, unit: 'day' },
      { amount: 1, unit: 'day' },
    ])
    expect(getReminderRecommendationPlan(20 * 24 * 60 * 60 * 1000)).toEqual([
      { amount: 14, unit: 'day' },
      { amount: 7, unit: 'day' },
      { amount: 1, unit: 'day' },
    ])
  })

  it('builds adaptive recommendations with rin labels/source and descending offsets', () => {
    const now = new Date(2026, 4, 6, 12, 0, 0)
    const recommendations = buildRecommendedReminderRules(now, '2026-05-10')

    expect(recommendations.map(rule => `${rule.amount}-${rule.unit}`)).toEqual([
      '3-day',
      '1-day',
      '3-hour',
    ])
    expect(recommendations.every(rule => rule.source === 'rin-recommended')).toBe(true)
    expect(recommendations.every(rule => rule.label?.includes('Rin 推荐') === true)).toBe(true)

    const offsets = recommendations.map(rule => reminderRuleToMs(rule))
    expect(offsets[0]).toBeGreaterThan(offsets[1]!)
    expect(offsets[1]).toBeGreaterThan(offsets[2]!)
  })

  it('filters expired recommendations and returns empty for overdue dueDate', () => {
    const overdue = buildRecommendedReminderRules(new Date(2026, 4, 7, 12, 0, 0), '2026-05-06')
    expect(overdue).toEqual([])

    const shortRemaining = buildRecommendedReminderRules(new Date(2026, 4, 6, 23, 55, 0), '2026-05-06')
    expect(shortRemaining).toHaveLength(1)
    expect(shortRemaining[0]?.unit).toBe('minute')
    expect(shortRemaining[0]?.amount).toBe(4)
  })
})

describe('study-task-reminders due reminder detection', () => {
  it('returns due reminders only when trigger time reached and before due date', () => {
    const task = createBaseTask()
    const dueNow = getDueTaskReminders([task], new Date(2026, 4, 8, 0, 0, 1))
    expect(dueNow.map(reminder => reminder.reminderId)).toEqual(['reminder-1d'])

    const tooEarly = getDueTaskReminders([task], new Date(2026, 4, 7, 22, 0, 0))
    expect(tooEarly).toEqual([])

    const tooLate = getDueTaskReminders([task], new Date(2026, 4, 9, 0, 0, 0))
    expect(tooLate).toEqual([])
  })

  it('skips done task, task without dueDate, disabled rules, and delivered reminders', () => {
    const baseTask = createBaseTask()
    const doneTask = { ...baseTask, id: 'done-task', done: true }
    const noDueDateTask = { ...baseTask, id: 'no-due-task', dueDate: undefined }
    const disabledRuleTask = {
      ...baseTask,
      id: 'disabled-task',
      reminders: [{ ...baseTask.reminders[0], id: 'disabled', enabled: false }],
    }
    const deliveredTask = {
      ...baseTask,
      id: 'delivered-task',
      reminderDeliveries: [{ reminderId: 'reminder-1d', deliveredAt: new Date(2026, 4, 7, 23, 59, 59).toISOString() }],
    }

    const dueReminders = getDueTaskReminders(
      [doneTask, noDueDateTask, disabledRuleTask, deliveredTask],
      new Date(2026, 4, 8, 0, 0, 1),
    )
    expect(dueReminders).toEqual([])
  })

  it('supports multiple custom reminders and global disable switch', () => {
    const task = createBaseTask()
    const dueReminders = getDueTaskReminders([task], new Date(2026, 4, 8, 23, 0, 0))
    expect(dueReminders.map(reminder => reminder.reminderId)).toEqual(['reminder-1d', 'reminder-1h'])

    const disabled = getDueTaskReminders([task], new Date(2026, 4, 8, 23, 0, 0), { enabled: false })
    expect(disabled).toEqual([])
  })
})
