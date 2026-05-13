import { defineInvoke } from '@moeru/eventa'
import { useElectronEventaContext } from '@proj-airi/electron-vueuse'
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { getDueTaskReminders } from '@proj-airi/stage-ui/stores/modules/study-task-reminders'
import { getCurrentInstance, onBeforeUnmount } from 'vue'

import { electronStudyTaskReminderNotify } from '../../shared/eventa'

function formatDueReminderBody(taskTitle: string, amount: number, unit: 'minute' | 'hour' | 'day') {
  const unitText = unit === 'day' ? '天' : unit === 'hour' ? '小时' : '分钟'
  return `「${taskTitle}」将在 ${amount} ${unitText}后截止`
}

export interface UseStudyTaskRemindersOptions {
  intervalMs?: number
  nowProvider?: () => number
}

/**
 * Polling scheduler for due-date reminder notifications.
 *
 * Use when:
 * - Stage renderer is mounted and app is running
 *
 * Expects:
 * - Called once in a stable root page
 *
 * Returns:
 * - Start/stop controls and test hook `runOnce`
 */
export function useStudyTaskReminders(options?: UseStudyTaskRemindersOptions) {
  const studyStore = useStudyCompanionStore()
  const eventaContext = useElectronEventaContext()
  const notifyStudyTaskDueReminder = defineInvoke(eventaContext.value, electronStudyTaskReminderNotify)
  const intervalMs = Math.max(10_000, options?.intervalMs ?? 60_000)
  const nowProvider = options?.nowProvider ?? (() => Date.now())

  let intervalTimer: ReturnType<typeof setInterval> | undefined
  let running = false

  async function runOnce() {
    if (!studyStore.taskDueReminderEnabled)
      return

    const nowMs = nowProvider()
    const dueReminders = getDueTaskReminders(studyStore.persisted.tasks, nowMs, {
      enabled: studyStore.taskDueReminderEnabled,
    })
    for (const dueReminder of dueReminders) {
      const notificationPayload = {
        title: 'Rin 学习提醒',
        body: formatDueReminderBody(dueReminder.taskTitle, dueReminder.amount, dueReminder.unit),
        taskId: dueReminder.taskId,
        reminderId: dueReminder.reminderId,
      }
      const notifySucceeded = await notifyStudyTaskDueReminder(notificationPayload).catch(() => false)
      if (!notifySucceeded)
        continue
      studyStore.markTaskReminderDelivered(dueReminder.taskId, dueReminder.reminderId, new Date(nowMs).toISOString())
    }
  }

  function start() {
    if (running)
      return
    running = true
    intervalTimer = setInterval(() => {
      void runOnce()
    }, intervalMs)
    void runOnce()
  }

  function stop() {
    running = false
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = undefined
    }
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      stop()
    })
  }

  return {
    start,
    stop,
    runOnce,
    isRunning: () => running,
  }
}
