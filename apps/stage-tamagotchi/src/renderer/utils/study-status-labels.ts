import type {
  StudyTask,
  StudyTaskPriority,
  StudyTaskSortMode,
} from '@proj-airi/stage-ui/stores/modules/study-companion'

import {
  isStudyTaskDueToday,
  isStudyTaskOverdue,
} from '@proj-airi/stage-ui/stores/modules/study-companion'

/**
 * Converts task priority into natural Chinese labels.
 */
export function formatStudyTaskPriorityLabel(priority: StudyTaskPriority) {
  if (priority === 'high')
    return '高'
  if (priority === 'low')
    return '低'
  return '中'
}

/**
 * Converts task priority into compact style classes.
 */
export function resolveStudyTaskPriorityClass(priority: StudyTaskPriority) {
  if (priority === 'high')
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300'
  if (priority === 'low')
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300'
}

/**
 * Formats task due-date summary for list display.
 */
export function formatStudyTaskDueText(task: StudyTask, now = new Date()) {
  if (!task.dueDate)
    return ''
  if (isStudyTaskOverdue(task, now))
    return '已逾期'
  if (isStudyTaskDueToday(task, now))
    return '今天截止'
  return `截止 ${task.dueDate.slice(5)}`
}

/**
 * Resolves due-date text style class.
 */
export function resolveStudyTaskDueClass(task: StudyTask, now = new Date()) {
  if (!task.dueDate)
    return 'text-neutral-400 dark:text-neutral-500'
  if (isStudyTaskOverdue(task, now))
    return 'text-rose-600 dark:text-rose-300'
  if (isStudyTaskDueToday(task, now))
    return 'text-amber-600 dark:text-amber-300'
  return 'text-neutral-500 dark:text-neutral-400'
}

/**
 * Converts sort mode into natural Chinese labels.
 */
export function formatStudyTaskSortModeLabel(mode: StudyTaskSortMode) {
  if (mode === 'createdAt')
    return '创建时间'
  if (mode === 'priority')
    return '优先级'
  if (mode === 'dueDate')
    return '截止时间'
  return '智能排序'
}
