import { describe, expect, it, vi } from 'vitest'

import { buildTamagotchiTrayMenuTemplate } from './tray-menu'

function createHandlers() {
  return {
    showOrHideRin: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    toggleMoveMode: vi.fn(),
    resetWindowSize: vi.fn(),
    openStudyPanel: vi.fn(),
    openVisionPanel: vi.fn(),
    openShortcutGuide: vi.fn(),
    openSettings: vi.fn(),
    openAbout: vi.fn(),
    increaseRinScale: vi.fn(),
    decreaseRinScale: vi.fn(),
    resetRinScale: vi.fn(),
    setLive2dFitPreference: vi.fn(),
    reloadApp: vi.fn(),
    quitApp: vi.fn(),
  }
}

function getTopLevelLabels(template: ReturnType<typeof buildTamagotchiTrayMenuTemplate>) {
  return template.map(item => item.label).filter(Boolean)
}

describe('buildTamagotchiTrayMenuTemplate', () => {
  it('contains chinese groups and core actions', () => {
    const handlers = createHandlers()
    const template = buildTamagotchiTrayMenuTemplate({
      windowVisible: true,
      alwaysOnTop: false,
      moveModeEnabled: false,
      live2dFitPreference: 'auto',
    }, handlers)

    const labels = getTopLevelLabels(template)
    expect(labels).toContain('Rin')
    expect(labels).toContain('面板')
    expect(labels).toContain('形象')
    expect(labels).toContain('应用')
    expect(labels).toContain('打开学习面板')
    expect(labels).toContain('打开视觉面板')
    expect(labels).toContain('快捷键指南')
    expect(labels).toContain('放大 Rin 形象')
    expect(labels).toContain('缩小 Rin 形象')
    expect(labels).toContain('重置 Rin 形象大小')
    expect(labels).toContain('展示方式')
    expect(labels).toContain('关于 Rin')
    expect(labels).toContain('退出 Rin')
  })

  it('updates visibility label based on current window visibility', () => {
    const handlers = createHandlers()

    const visibleTemplate = buildTamagotchiTrayMenuTemplate({
      windowVisible: true,
      alwaysOnTop: false,
      moveModeEnabled: false,
      live2dFitPreference: 'auto',
    }, handlers)
    expect(getTopLevelLabels(visibleTemplate)).toContain('隐藏 Rin')

    const hiddenTemplate = buildTamagotchiTrayMenuTemplate({
      windowVisible: false,
      alwaysOnTop: false,
      moveModeEnabled: false,
      live2dFitPreference: 'auto',
    }, handlers)
    expect(getTopLevelLabels(hiddenTemplate)).toContain('显示 Rin')
  })

  it('binds checked and radio states correctly', () => {
    const handlers = createHandlers()
    const template = buildTamagotchiTrayMenuTemplate({
      windowVisible: true,
      alwaysOnTop: true,
      moveModeEnabled: false,
      live2dFitPreference: 'full-body',
    }, handlers)

    const alwaysOnTopItem = template.find(item => item.label === '保持置顶')
    expect(alwaysOnTopItem?.type).toBe('checkbox')
    expect(alwaysOnTopItem?.checked).toBe(true)

    const fitMenu = template.find(item => item.label === '展示方式')
    if (!fitMenu || !Array.isArray(fitMenu.submenu))
      throw new Error('展示方式子菜单缺失')

    const autoItem = fitMenu.submenu.find(item => item.label === '自动适配')
    const fullBodyItem = fitMenu.submenu.find(item => item.label === '完整身体')
    const upperBodyItem = fitMenu.submenu.find(item => item.label === '上半身优先')

    expect(autoItem?.type).toBe('radio')
    expect(fullBodyItem?.type).toBe('radio')
    expect(upperBodyItem?.type).toBe('radio')
    expect(autoItem?.checked).toBe(false)
    expect(fullBodyItem?.checked).toBe(true)
    expect(upperBodyItem?.checked).toBe(false)
  })

  it('wires handlers for panel actions and fit action', () => {
    const handlers = createHandlers()
    const template = buildTamagotchiTrayMenuTemplate({
      windowVisible: true,
      alwaysOnTop: false,
      moveModeEnabled: false,
      live2dFitPreference: 'auto',
    }, handlers)

    const studyItem = template.find(item => item.label === '打开学习面板')
    const visionItem = template.find(item => item.label === '打开视觉面板')
    const guideItem = template.find(item => item.label === '快捷键指南')
    const fitMenu = template.find(item => item.label === '展示方式')
    if (!fitMenu || !Array.isArray(fitMenu.submenu))
      throw new Error('展示方式子菜单缺失')
    const fullBodyItem = fitMenu.submenu.find(item => item.label === '完整身体')

    if (!studyItem?.click || !visionItem?.click || !guideItem?.click || !fullBodyItem?.click)
      throw new Error('点击处理器缺失')

    studyItem.click(undefined as never, undefined as never, undefined as never)
    visionItem.click(undefined as never, undefined as never, undefined as never)
    guideItem.click(undefined as never, undefined as never, undefined as never)
    fullBodyItem.click(undefined as never, undefined as never, undefined as never)

    expect(handlers.openStudyPanel).toHaveBeenCalledTimes(1)
    expect(handlers.openVisionPanel).toHaveBeenCalledTimes(1)
    expect(handlers.openShortcutGuide).toHaveBeenCalledTimes(1)
    expect(handlers.setLive2dFitPreference).toHaveBeenCalledWith('full-body')
  })

  it('does not contain legacy english labels', () => {
    const handlers = createHandlers()
    const template = buildTamagotchiTrayMenuTemplate({
      windowVisible: true,
      alwaysOnTop: false,
      moveModeEnabled: false,
      live2dFitPreference: 'upper-body',
    }, handlers)
    const labels = getTopLevelLabels(template).join(' | ')
    expect(labels).not.toContain('Show')
    expect(labels).not.toContain('Hide')
    expect(labels).not.toContain('Quit')
    expect(labels).not.toContain('Settings')
  })
})
