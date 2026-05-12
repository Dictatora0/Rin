import { describe, expect, it } from 'vitest'

import {
  getLocalDateInputValue,
  getStudyQuickDueDate,
  isValidStudyDueDate,
  normalizeStudyDueDate,
} from './study-due-date'

describe('study due date helpers', () => {
  it('formats local date as YYYY-MM-DD', () => {
    const result = getLocalDateInputValue(new Date(2026, 4, 12, 8, 30))
    expect(result).toBe('2026-05-12')
  })

  it('validates due date format and calendar correctness', () => {
    expect(isValidStudyDueDate('')).toBe(true)
    expect(isValidStudyDueDate('2026-05-12')).toBe(true)
    expect(isValidStudyDueDate('2026-02-29')).toBe(false)
    expect(isValidStudyDueDate('05/12/2026')).toBe(false)
  })

  it('normalizes due date input', () => {
    expect(normalizeStudyDueDate('2026-05-12')).toBe('2026-05-12')
    expect(normalizeStudyDueDate(' 2026-05-12 ')).toBe('2026-05-12')
    expect(normalizeStudyDueDate('')).toBe('')
    expect(normalizeStudyDueDate('05/12/2026')).toBeNull()
  })

  it('returns local quick due dates', () => {
    const baseDate = new Date(2026, 4, 12, 10, 0)
    expect(getStudyQuickDueDate('today', baseDate)).toBe('2026-05-12')
    expect(getStudyQuickDueDate('tomorrow', baseDate)).toBe('2026-05-13')
    expect(getStudyQuickDueDate('weekEnd', baseDate)).toBe('2026-05-17')
    expect(getStudyQuickDueDate('nextWeek', baseDate)).toBe('2026-05-19')
  })
})
