export type StudyTaskReminderUnit = 'minute' | 'hour' | 'day'

export type StudyTaskReminderSource = 'rin-recommended' | 'user-custom'

/**
 * Reminder rule bound to one study task due date.
 */
export interface StudyTaskReminderRule {
  id: string
  amount: number
  unit: StudyTaskReminderUnit
  enabled: boolean
  source: StudyTaskReminderSource
  label?: string
}

/**
 * Delivery marker to ensure one reminder is notified once.
 */
export interface StudyTaskReminderDelivery {
  reminderId: string
  deliveredAt: string
}

/**
 * Task shape required by reminder calculators.
 */
export interface StudyTaskReminderTaskLike {
  id: string
  title: string
  done: boolean
  dueDate?: string
  reminders?: StudyTaskReminderRule[]
  reminderDeliveries?: StudyTaskReminderDelivery[]
}

/**
 * Due reminder item returned by the scheduler matcher.
 */
export interface StudyTaskDueReminder {
  taskId: string
  taskTitle: string
  dueDate: string
  dueAt: number
  reminderId: string
  reminderLabel: string
  amount: number
  unit: StudyTaskReminderUnit
  source: StudyTaskReminderSource
  triggerAt: number
}

/**
 * Strict amount limits per reminder unit.
 */
export const STUDY_TASK_REMINDER_AMOUNT_LIMITS: Record<StudyTaskReminderUnit, { min: number, max: number }> = {
  minute: { min: 1, max: 1440 },
  hour: { min: 1, max: 168 },
  day: { min: 1, max: 30 },
}

const MINUTE_IN_MS = 60 * 1000
const HOUR_IN_MS = 60 * MINUTE_IN_MS
const DAY_IN_MS = 24 * HOUR_IN_MS

interface ReminderPlanRule {
  amount: number
  unit: StudyTaskReminderUnit
}

/**
 * Formats one reminder amount/unit to Chinese copy.
 *
 * Use when:
 * - Rendering reminder labels in task editor and notification text
 *
 * Expects:
 * - `amount` is a positive integer
 * - `unit` is minute/hour/day
 *
 * Returns:
 * - A localized text such as `3 天` / `1 小时` / `10 分钟`
 */
export function formatReminderAmountUnit(amount: number, unit: StudyTaskReminderUnit): string {
  if (unit === 'day')
    return `${amount} 天`
  if (unit === 'hour')
    return `${amount} 小时`
  return `${amount} 分钟`
}

/**
 * Normalizes reminder rule list.
 *
 * Before:
 * - Mixed invalid ids/amounts/units/source values
 *
 * After:
 * - Valid sorted rules with stable ids and labels
 */
export function normalizeTaskReminderRules(rules: unknown): StudyTaskReminderRule[] {
  if (!Array.isArray(rules))
    return []

  const normalizedRuleCandidates = rules.map((rawRule, index): StudyTaskReminderRule | null => {
    if (!rawRule || typeof rawRule !== 'object')
      return null

    const row = rawRule as Partial<StudyTaskReminderRule>
    const unit = row.unit === 'minute' || row.unit === 'hour' || row.unit === 'day'
      ? row.unit
      : 'minute'
    const amountLimit = STUDY_TASK_REMINDER_AMOUNT_LIMITS[unit]
    const rawAmount = Number(row.amount)
    if (!Number.isFinite(rawAmount))
      return null

    const roundedAmount = Math.round(rawAmount)
    const clampedAmount = Math.min(amountLimit.max, Math.max(amountLimit.min, roundedAmount))

    const source: StudyTaskReminderSource = row.source === 'rin-recommended' ? 'rin-recommended' : 'user-custom'
    const label = typeof row.label === 'string' && row.label.trim().length > 0
      ? row.label.trim()
      : source === 'rin-recommended'
        ? `Rin 推荐：提前 ${formatReminderAmountUnit(clampedAmount, unit)}`
        : `自定义：提前 ${formatReminderAmountUnit(clampedAmount, unit)}`

    return {
      id: typeof row.id === 'string' && row.id.trim().length > 0 ? row.id : `reminder-${index + 1}`,
      amount: clampedAmount,
      unit,
      enabled: row.enabled !== false,
      source,
      label,
    }
  })

  const normalizedRules = normalizedRuleCandidates.filter((rule): rule is StudyTaskReminderRule => rule != null)
  normalizedRules.sort((leftRule, rightRule) => reminderRuleToMs(rightRule) - reminderRuleToMs(leftRule))
  return normalizedRules
}

/**
 * Converts one reminder rule to milliseconds.
 *
 * Use when:
 * - Computing trigger timestamps and sorting reminder urgency
 *
 * Expects:
 * - Rule has normalized `amount` and `unit`
 *
 * Returns:
 * - Milliseconds represented by this rule
 */
export function reminderRuleToMs(rule: Pick<StudyTaskReminderRule, 'amount' | 'unit'>): number {
  if (rule.unit === 'day')
    return rule.amount * DAY_IN_MS
  if (rule.unit === 'hour')
    return rule.amount * HOUR_IN_MS
  return rule.amount * MINUTE_IN_MS
}

function parseDueDateAsLocalDeadline(dueDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    return null
  const [yearText, monthText, dayText] = dueDate.split('-')
  const year = Number.parseInt(yearText, 10)
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day))
    return null

  const localDeadline = new Date(year, month - 1, day, 23, 59, 59, 999)
  if (
    Number.isNaN(localDeadline.getTime())
    || localDeadline.getFullYear() !== year
    || localDeadline.getMonth() !== month - 1
    || localDeadline.getDate() !== day
  ) {
    return null
  }
  return localDeadline.getTime()
}

/**
 * Maps due interval to recommendation plan.
 *
 * Use when:
 * - Choosing adaptive recommendation density from current time to due date
 *
 * Expects:
 * - `totalMs` is positive remaining time to due date
 *
 * Returns:
 * - 1~3 recommendation offsets ordered from far to near
 */
export function getReminderRecommendationPlan(totalMs: number): Array<ReminderPlanRule> {
  if (totalMs < HOUR_IN_MS) {
    return [{ amount: 10, unit: 'minute' }]
  }
  if (totalMs <= 6 * HOUR_IN_MS) {
    return [
      { amount: 1, unit: 'hour' },
      { amount: 15, unit: 'minute' },
    ]
  }
  if (totalMs <= 24 * HOUR_IN_MS) {
    return [
      { amount: 6, unit: 'hour' },
      { amount: 1, unit: 'hour' },
    ]
  }
  if (totalMs <= 3 * DAY_IN_MS) {
    return [
      { amount: 1, unit: 'day' },
      { amount: 3, unit: 'hour' },
    ]
  }
  if (totalMs <= 7 * DAY_IN_MS) {
    return [
      { amount: 3, unit: 'day' },
      { amount: 1, unit: 'day' },
      { amount: 3, unit: 'hour' },
    ]
  }
  if (totalMs <= 14 * DAY_IN_MS) {
    return [
      { amount: 7, unit: 'day' },
      { amount: 3, unit: 'day' },
      { amount: 1, unit: 'day' },
    ]
  }
  return [
    { amount: 14, unit: 'day' },
    { amount: 7, unit: 'day' },
    { amount: 1, unit: 'day' },
  ]
}

/**
 * Builds adaptive Rin recommended reminder rules.
 *
 * Use when:
 * - Due date was newly set/changed, or user opens reminder editor and needs initial recommendations
 *
 * Expects:
 * - `now` can be Date or timestamp
 * - `dueDate` follows `YYYY-MM-DD`
 *
 * Returns:
 * - Recommended rules (source=`rin-recommended`) sorted from far to near
 */
export function buildRecommendedReminderRules(now: Date | number, dueDate: string): StudyTaskReminderRule[] {
  const nowMs = now instanceof Date ? now.getTime() : Number(now)
  if (!Number.isFinite(nowMs))
    return []

  const dueAt = parseDueDateAsLocalDeadline(dueDate)
  if (!dueAt || dueAt <= nowMs)
    return []

  const totalMs = dueAt - nowMs
  const basePlan = getReminderRecommendationPlan(totalMs)
  const activePlan = basePlan.filter((planRule) => {
    const triggerAt = dueAt - reminderRuleToMs(planRule)
    return triggerAt > nowMs
  })

  const fallbackPlan = (() => {
    if (activePlan.length > 0)
      return activePlan
    const remainingMinutes = Math.floor((dueAt - nowMs) / MINUTE_IN_MS)
    if (remainingMinutes <= 0)
      return []
    const fallbackAmount = Math.max(1, Math.min(10, remainingMinutes))
    return [{ amount: fallbackAmount, unit: 'minute' as const }]
  })()

  return fallbackPlan.map((planRule, index) => {
    const normalizedAmount = Math.round(planRule.amount)
    const unit = planRule.unit
    return {
      id: `rin-recommended-${dueDate}-${unit}-${normalizedAmount}-${index + 1}`,
      amount: normalizedAmount,
      unit,
      enabled: true,
      source: 'rin-recommended',
      label: `Rin 推荐：提前 ${formatReminderAmountUnit(normalizedAmount, unit)}`,
    } satisfies StudyTaskReminderRule
  })
}

/**
 * Computes reminder trigger timestamp for one task/rule pair.
 *
 * Use when:
 * - Scheduler needs deterministic triggerAt per rule
 *
 * Expects:
 * - Task has valid dueDate
 *
 * Returns:
 * - Trigger epoch ms, or null when due date is invalid
 */
export function getReminderTriggerAt(
  task: Pick<StudyTaskReminderTaskLike, 'dueDate'>,
  rule: Pick<StudyTaskReminderRule, 'amount' | 'unit'>,
): number | null {
  if (!task.dueDate)
    return null
  const dueAt = parseDueDateAsLocalDeadline(task.dueDate)
  if (!dueAt)
    return null
  return dueAt - reminderRuleToMs(rule)
}

/**
 * Finds reminders that should be delivered now.
 *
 * Use when:
 * - A polling scheduler checks pending due-date reminders
 *
 * Expects:
 * - `tasks` comes from store snapshot
 * - `now` is current local Date or epoch ms
 *
 * Returns:
 * - Due reminders to notify (deduplicated by delivery markers)
 */
export function getDueTaskReminders(
  tasks: StudyTaskReminderTaskLike[],
  now: Date | number,
  options?: { enabled?: boolean },
): StudyTaskDueReminder[] {
  if (options?.enabled === false)
    return []

  const nowMs = now instanceof Date ? now.getTime() : Number(now)
  if (!Number.isFinite(nowMs))
    return []

  const dueReminderEntries: StudyTaskDueReminder[] = []

  for (const task of tasks) {
    if (task.done || !task.dueDate)
      continue

    const dueAt = parseDueDateAsLocalDeadline(task.dueDate)
    if (!dueAt || dueAt <= nowMs)
      continue

    const reminderRules = normalizeTaskReminderRules(task.reminders ?? [])
    if (reminderRules.length === 0)
      continue
    const deliveredReminderIdSet = new Set((task.reminderDeliveries ?? []).map(delivery => delivery.reminderId))

    for (const rule of reminderRules) {
      if (!rule.enabled)
        continue
      if (deliveredReminderIdSet.has(rule.id))
        continue

      const triggerAt = dueAt - reminderRuleToMs(rule)
      if (triggerAt > nowMs)
        continue

      dueReminderEntries.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        dueAt,
        reminderId: rule.id,
        reminderLabel: rule.label ?? `${rule.source === 'rin-recommended' ? 'Rin 推荐' : '自定义'}：提前 ${formatReminderAmountUnit(rule.amount, rule.unit)}`,
        amount: rule.amount,
        unit: rule.unit,
        source: rule.source,
        triggerAt,
      })
    }
  }

  dueReminderEntries.sort((leftEntry, rightEntry) => leftEntry.triggerAt - rightEntry.triggerAt)
  return dueReminderEntries
}
