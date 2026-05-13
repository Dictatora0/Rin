import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const zhHansSettingsLocalePath = resolve(
  import.meta.dirname,
  '../../../../../../packages/i18n/src/locales/zh-Hans/settings.yaml',
)

function readZhHansSettingsLocale() {
  return readFileSync(zhHansSettingsLocalePath, 'utf8')
}

describe('settings scenes/data localization', () => {
  it('uses Chinese titles for settings menu and page headers', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('  data:\n    title: 数据\n')
    expect(content).toContain('  scene:\n    title: 场景\n')
  })

  it('uses Chinese copy for scenes page labels', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('    beta_label: 场景系统\n')
    expect(content).toContain('      title: 场景库\n')
    expect(content).toContain('      active_badge: 当前场景\n')
    expect(content).toContain('      delete_confirm: 确定要删除这个背景吗？\n')
  })

  it('uses Chinese copy for data page danger and common actions', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('      danger:\n        title: 危险区域\n        description: 不可逆操作。继续之前，请导出您需要的内容。\n')
    expect(content).toContain('        export: 导出聊天记录\n')
    expect(content).toContain('        import: 导入聊天记录\n')
    expect(content).toContain('        delete: 删除所有聊天会话\n')
    expect(content).toContain('        reset: 重置模块设置\n')
    expect(content).toContain('      \'yes\': \'是\'\n')
    expect(content).toContain('    cancel: 取消操作\n')
  })
})
