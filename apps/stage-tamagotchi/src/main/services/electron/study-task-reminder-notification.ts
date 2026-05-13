import type { createContext } from '@moeru/eventa/adapters/electron/main'
import type { BrowserWindow } from 'electron'

import { defineInvokeHandler } from '@moeru/eventa'
import { Notification } from 'electron'

import { electronStudyTaskReminderNotify } from '../../../shared/eventa'

/**
 * Registers main-process system notification invoke for study task due reminders.
 *
 * Call stack:
 *
 * setupBaseWindowElectronInvokes (../windows/shared/window)
 *   -> {@link createStudyTaskReminderNotificationService}
 *     -> Eventa invoke handler (`electronStudyTaskReminderNotify`)
 *
 * Use when:
 * - Renderer computes due reminders and needs OS-level macOS notification delivery
 *
 * Expects:
 * - Called with a main-window scoped Eventa context
 *
 * Returns:
 * - void; handler returns `true` on successful `show()`, `false` on runtime failure
 */
export function createStudyTaskReminderNotificationService(params: {
  context: ReturnType<typeof createContext>['context']
  window: BrowserWindow
}) {
  defineInvokeHandler(params.context, electronStudyTaskReminderNotify, async (payload) => {
    try {
      const notification = new Notification({
        title: payload.title,
        body: payload.body,
      })
      notification.show()
      return true
    }
    catch (error) {
      console.error('[study-task-reminder-notify] failed to show notification', error)
      return false
    }
  })
}
