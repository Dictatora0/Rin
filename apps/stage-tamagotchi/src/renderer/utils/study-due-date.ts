export type StudyQuickDueDateType = 'today' | 'tomorrow' | 'weekEnd' | 'nextWeek'

function parseStudyDueDateParts(value: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
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

  return { year, month, day }
}

/**
 * Returns local date input value in `YYYY-MM-DD`.
 */
export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Validates study due date string.
 */
export function isValidStudyDueDate(value: string) {
  const normalizedValue = value.trim()
  if (!normalizedValue)
    return true

  return parseStudyDueDateParts(normalizedValue) != null
}

/**
 * Normalizes due date value.
 *
 * Returns:
 * - `''` when value is empty
 * - normalized `YYYY-MM-DD` when valid
 * - `null` when invalid
 */
export function normalizeStudyDueDate(value: string): string | null {
  const normalizedValue = value.trim()
  if (!normalizedValue)
    return ''

  const parsed = parseStudyDueDateParts(normalizedValue)
  if (!parsed)
    return null

  const month = `${parsed.month}`.padStart(2, '0')
  const day = `${parsed.day}`.padStart(2, '0')
  return `${parsed.year}-${month}-${day}`
}

/**
 * Gets quick due date value using local date.
 */
export function getStudyQuickDueDate(type: StudyQuickDueDateType, baseDate = new Date()) {
  const localBaseDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())

  if (type === 'today')
    return getLocalDateInputValue(localBaseDate)

  if (type === 'tomorrow') {
    const tomorrowDate = new Date(localBaseDate)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    return getLocalDateInputValue(tomorrowDate)
  }

  if (type === 'weekEnd') {
    const sundayDate = new Date(localBaseDate)
    const daysUntilSunday = (7 - sundayDate.getDay()) % 7
    sundayDate.setDate(sundayDate.getDate() + daysUntilSunday)
    return getLocalDateInputValue(sundayDate)
  }

  const nextWeekDate = new Date(localBaseDate)
  nextWeekDate.setDate(nextWeekDate.getDate() + 7)
  return getLocalDateInputValue(nextWeekDate)
}
