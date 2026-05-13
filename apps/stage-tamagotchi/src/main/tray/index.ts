import type { LocaleDetector } from '@intlify/core'
import type { BrowserWindow } from 'electron'

import type { TamagotchiTrayCommandPayload, TamagotchiTrayFitPreference } from '../../shared/eventa'
import type { I18n } from '../libs/i18n'
import type { ServerChannel } from '../services/airi/channel-server'
import type { setupBeatSync } from '../windows/beat-sync'
import type { setupCaptionWindowManager } from '../windows/caption'
import type { SettingsWindowManager } from '../windows/settings'
import type { WidgetsWindowManager } from '../windows/widgets'

import { env } from 'node:process'

import { is } from '@electron-toolkit/utils'
import { createContext } from '@moeru/eventa/adapters/electron/main'
import { isRendererUnavailable } from '@proj-airi/electron-vueuse/main'
import { effect } from 'alien-signals'
import { app, ipcMain, Menu, nativeImage, Tray } from 'electron'
import { debounce, once } from 'es-toolkit'
import { isMacOS } from 'std-env'

import icon from '../../../resources/icon.png?asset'
import macOSTrayIcon from '../../../resources/tray-icon-macos.png?asset'

import {
  tamagotchiTrayCommandEvent,

  tamagotchiTrayRendererStateEvent,
} from '../../shared/eventa'
import { onAppBeforeQuit } from '../libs/bootkit/lifecycle'
import { toggleWindowShow } from '../windows/shared/window'
import { buildTamagotchiTrayMenuTemplate } from './tray-menu'

const RECOMMENDED_WIDTH = 450
const RECOMMENDED_HEIGHT = 600

function applyWindowSize(window: BrowserWindow, width: number, height: number, x?: number, y?: number): void {
  if (isRendererUnavailable(window)) {
    return
  }

  window.setResizable(true)

  const bounds = {
    width: Math.round(width),
    height: Math.round(height),
  } as Electron.Rectangle

  if (x !== undefined && y !== undefined) {
    bounds.x = Math.round(x)
    bounds.y = Math.round(y)
  }

  window.setBounds(bounds)
  if (x === undefined || y === undefined) {
    window.center()
  }

  window.show()
}

export function setupTray(params: {
  mainWindow: BrowserWindow
  settingsWindow: SettingsWindowManager
  captionWindow: ReturnType<typeof setupCaptionWindowManager>
  widgetsWindow: WidgetsWindowManager
  beatSyncBgWindow: Awaited<ReturnType<typeof setupBeatSync>>
  aboutWindow: () => Promise<BrowserWindow>
  serverChannel: ServerChannel
  i18n: I18n
}): void {
  once(() => {
    const { context: mainWindowContext } = createContext(ipcMain, params.mainWindow)
    const rendererState: { moveModeEnabled: boolean, live2dFitPreference: TamagotchiTrayFitPreference } = {
      moveModeEnabled: false,
      live2dFitPreference: 'auto',
    }

    const trayImage = nativeImage.createFromPath(isMacOS ? macOSTrayIcon : icon).resize({ width: 16 })
    trayImage.setTemplateImage(isMacOS)

    const appTray = new Tray(trayImage)
    onAppBeforeQuit(() => appTray.destroy())

    const rebuildContextMenu = debounce((): void => {
      if (isRendererUnavailable(params.mainWindow)) {
        return
      }

      const windowVisible = params.mainWindow.isVisible()
      const state = {
        windowVisible,
        alwaysOnTop: params.mainWindow.isAlwaysOnTop(),
        moveModeEnabled: rendererState.moveModeEnabled,
        live2dFitPreference: rendererState.live2dFitPreference,
      } as const

      function emitTrayCommand(payload: TamagotchiTrayCommandPayload) {
        mainWindowContext.emit(tamagotchiTrayCommandEvent, payload)
      }

      const quickActionsTemplate = buildTamagotchiTrayMenuTemplate(state, {
        showOrHideRin() {
          if (windowVisible)
            params.mainWindow.hide()
          else
            toggleWindowShow(params.mainWindow)
        },
        setAlwaysOnTop(next) {
          params.mainWindow.setAlwaysOnTop(next, next ? 'screen-saver' : undefined, next ? 1 : undefined)
          emitTrayCommand({ command: 'set-always-on-top', alwaysOnTop: next })
          rebuildContextMenu()
        },
        toggleMoveMode() {
          emitTrayCommand({ command: 'toggle-move-mode' })
        },
        resetWindowSize() {
          applyWindowSize(params.mainWindow, RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT)
        },
        openStudyPanel() {
          emitTrayCommand({ command: 'open-study-panel' })
        },
        openVisionPanel() {
          emitTrayCommand({ command: 'open-vision-panel' })
        },
        openShortcutGuide() {
          emitTrayCommand({ command: 'open-shortcut-guide' })
        },
        openSettings() {
          void params.settingsWindow.openWindow('/settings')
        },
        openAbout() {
          void params.aboutWindow().then(window => toggleWindowShow(window))
        },
        increaseRinScale() {
          emitTrayCommand({ command: 'increase-rin-scale' })
        },
        decreaseRinScale() {
          emitTrayCommand({ command: 'decrease-rin-scale' })
        },
        resetRinScale() {
          emitTrayCommand({ command: 'reset-rin-scale' })
        },
        setLive2dFitPreference(fitPreference) {
          emitTrayCommand({ command: 'set-fit-preference', fitPreference })
        },
        reloadApp() {
          params.mainWindow.webContents.reload()
        },
        quitApp() {
          app.quit()
        },
      })

      const contextMenu = Menu.buildFromTemplate([
        ...quickActionsTemplate,
        ...is.dev || env.MAIN_APP_DEBUG || env.APP_DEBUG
          ? [
              { type: 'header', label: params.i18n.t('tamagotchi.electron.tray.menu.labels.label.devtools') },
              { label: params.i18n.t('tamagotchi.electron.tray.menu.labels.label.troubleshoot_beatsync'), click: () => params.beatSyncBgWindow.webContents.openDevTools({ mode: 'detach' }) },
              { type: 'separator' },
            ] as const
          : [],
        { label: params.i18n.t('tamagotchi.electron.tray.menu.labels.label.quit'), click: () => app.quit() },
      ])

      appTray.setContextMenu(contextMenu)
    }, 50)

    params.mainWindow.on('resize', rebuildContextMenu)
    params.mainWindow.on('move', rebuildContextMenu)
    params.mainWindow.on('show', rebuildContextMenu)
    params.mainWindow.on('hide', rebuildContextMenu)
    params.mainWindow.on('always-on-top-changed', rebuildContextMenu)
    mainWindowContext.on(tamagotchiTrayRendererStateEvent, (event) => {
      if (!event?.body)
        return
      rendererState.moveModeEnabled = event.body.moveModeEnabled
      rendererState.live2dFitPreference = event.body.live2dFitPreference
      rebuildContextMenu()
    })

    rebuildContextMenu()

    effect(() => {
      const locale = params.i18n.locale as (() => string | LocaleDetector<any[]> | undefined)
      locale()
      rebuildContextMenu()
    })

    appTray.setToolTip('Rin')
    appTray.addListener('click', () => toggleWindowShow(params.mainWindow))

    // On macOS, there's a special double-click event
    if (isMacOS) {
      appTray.addListener('double-click', () => toggleWindowShow(params.mainWindow))
    }
  })()
}
