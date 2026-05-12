import { describe, expect, it } from 'vitest'

import {
  formatStudyTaskDueText,
  formatStudyTaskPriorityLabel,
  formatStudyTaskSortModeLabel,
  resolveStudyTaskDueClass,
  resolveStudyTaskPriorityClass,
} from './study-status-labels'

describe('study-status-labels', () => {
  it('formats task priority labels and classes in Chinese', () => {
    expect(formatStudyTaskPriorityLabel('high')).toBe('高')
    expect(formatStudyTaskPriorityLabel('medium')).toBe('中')
    expect(formatStudyTaskPriorityLabel('low')).toBe('低')

    expect(resolveStudyTaskPriorityClass('high')).toContain('rose')
    expect(resolveStudyTaskPriorityClass('medium')).toContain('amber')
    expect(resolveStudyTaskPriorityClass('low')).toContain('sky')
  })

  it('formats due text for overdue and due-today tasks', () => {
    const now = new Date('2026-05-06T10:00:00.000Z')

    expect(formatStudyTaskDueText({
      id: 'task-overdue',
      title: 'old',
      done: false,
      createdAt: '2026-05-05T10:00:00.000Z',
      priority: 'medium',
      dueDate: '2026-05-05',
    }, now)).toBe('已逾期')

    expect(formatStudyTaskDueText({
      id: 'task-today',
      title: 'today',
      done: false,
      createdAt: '2026-05-06T09:00:00.000Z',
      priority: 'medium',
      dueDate: '2026-05-06',
    }, now)).toBe('今天截止')

    expect(formatStudyTaskDueText({
      id: 'task-future',
      title: 'future',
      done: false,
      createdAt: '2026-05-06T08:00:00.000Z',
      priority: 'medium',
      dueDate: '2026-05-08',
    }, now)).toBe('截止 05-08')
  })

  it('returns expected due-date style class and sort mode labels', () => {
    const now = new Date('2026-05-06T10:00:00.000Z')

    expect(resolveStudyTaskDueClass({
      id: 'task-overdue',
      title: 'overdue',
      done: false,
      createdAt: '2026-05-05T10:00:00.000Z',
      priority: 'medium',
      dueDate: '2026-05-05',
    }, now)).toContain('rose')

    expect(resolveStudyTaskDueClass({
      id: 'task-today',
      title: 'today',
      done: false,
      createdAt: '2026-05-06T08:00:00.000Z',
      priority: 'medium',
      dueDate: '2026-05-06',
    }, now)).toContain('amber')

    expect(formatStudyTaskSortModeLabel('smart')).toBe('智能排序')
    expect(formatStudyTaskSortModeLabel('createdAt')).toBe('创建时间')
    expect(formatStudyTaskSortModeLabel('priority')).toBe('优先级')
    expect(formatStudyTaskSortModeLabel('dueDate')).toBe('截止时间')
  })
})
