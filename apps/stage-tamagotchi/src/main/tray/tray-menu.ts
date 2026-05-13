import type { MenuItemConstructorOptions } from 'electron'

import type { TamagotchiTrayFitPreference } from '../../shared/eventa'

export interface TamagotchiTrayMenuState {
  windowVisible: boolean
  alwaysOnTop: boolean
  moveModeEnabled: boolean
  live2dFitPreference: TamagotchiTrayFitPreference
}

export interface TamagotchiTrayMenuHandlers {
  showOrHideRin: () => void
  setAlwaysOnTop: (next: boolean) => void
  toggleMoveMode: () => void
  resetWindowSize: () => void
  openStudyPanel: () => void
  openVisionPanel: () => void
  openShortcutGuide: () => void
  openSettings: () => void
  openAbout: () => void
  increaseRinScale: () => void
  decreaseRinScale: () => void
  resetRinScale: () => void
  setLive2dFitPreference: (fitPreference: TamagotchiTrayFitPreference) => void
  reloadApp: () => void
  quitApp: () => void
}

function createFitPreferenceMenuItems(
  state: TamagotchiTrayMenuState,
  handlers: TamagotchiTrayMenuHandlers,
): MenuItemConstructorOptions[] {
  return [
    {
      label: '自动适配',
      type: 'radio',
      checked: state.live2dFitPreference === 'auto',
      click: () => handlers.setLive2dFitPreference('auto'),
    },
    {
      label: '完整身体',
      type: 'radio',
      checked: state.live2dFitPreference === 'full-body',
      click: () => handlers.setLive2dFitPreference('full-body'),
    },
    {
      label: '上半身优先',
      type: 'radio',
      checked: state.live2dFitPreference === 'upper-body',
      click: () => handlers.setLive2dFitPreference('upper-body'),
    },
  ]
}

/**
 * Builds tray context menu template for tamagotchi window quick actions.
 *
 * Use when:
 * - Main process needs deterministic menu structure for macOS tray
 * - Tests should verify labels, checked states, and click handler wiring
 *
 * Expects:
 * - `state` reflects latest main/renderer synchronized tray state
 * - `handlers` contain side-effect callbacks owned by tray/index.ts
 *
 * Returns:
 * - Electron Menu template ready for `Menu.buildFromTemplate`
 */
export function buildTamagotchiTrayMenuTemplate(
  state: TamagotchiTrayMenuState,
  handlers: TamagotchiTrayMenuHandlers,
): MenuItemConstructorOptions[] {
  return [
    { label: 'Rin', type: 'header' },
    {
      label: state.windowVisible ? '隐藏 Rin' : '显示 Rin',
      click: handlers.showOrHideRin,
    },
    {
      label: '保持置顶',
      type: 'checkbox',
      checked: state.alwaysOnTop,
      click: menuItem => handlers.setAlwaysOnTop(Boolean(menuItem.checked)),
    },
    {
      label: '移动模式',
      type: 'checkbox',
      checked: state.moveModeEnabled,
      click: handlers.toggleMoveMode,
    },
    {
      label: '重置窗口大小',
      click: handlers.resetWindowSize,
    },
    { label: '面板', type: 'header' },
    {
      label: '打开学习面板',
      click: handlers.openStudyPanel,
    },
    {
      label: '打开视觉面板',
      click: handlers.openVisionPanel,
    },
    {
      label: '快捷键指南',
      click: handlers.openShortcutGuide,
    },
    {
      label: '设置',
      click: handlers.openSettings,
    },
    { label: '形象', type: 'header' },
    {
      label: '放大 Rin 形象',
      click: handlers.increaseRinScale,
    },
    {
      label: '缩小 Rin 形象',
      click: handlers.decreaseRinScale,
    },
    {
      label: '重置 Rin 形象大小',
      click: handlers.resetRinScale,
    },
    {
      label: '展示方式',
      submenu: createFitPreferenceMenuItems(state, handlers),
    },
    { label: '应用', type: 'header' },
    {
      label: '重新加载',
      click: handlers.reloadApp,
    },
    {
      label: '退出 Rin',
      click: handlers.quitApp,
    },
    {
      label: '关于 Rin',
      click: handlers.openAbout,
    },
  ]
}
