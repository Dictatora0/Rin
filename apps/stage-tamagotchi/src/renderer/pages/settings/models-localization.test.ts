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

describe('settings models localization', () => {
  it('uses Chinese titles for models settings menu and page headers', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('  models:\n    description: 切换角色的 Live2D，VRM 模型\n    title: 角色模型\n')
  })

  it('uses Chinese copy for model selection and godot stage messages', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('    panel:\n      support_title: 支持 2D 和 3D 模型\n')
    expect(content).toContain('      select_model: 选择模型\n')
    expect(content).toContain('    godot:\n      title: Godot 舞台（实验性）\n')
    expect(content).toContain('      callout_label: Godot 舞台\n')
    expect(content).toContain('        back_to_builtin: 返回内置舞台\n')
    expect(content).toContain('        switch_to_godot: 切换到 Godot 舞台（实验性）\n')
  })

  it('uses Chinese copy for live2d and vrm labels in models page', () => {
    const content = readZhHansSettingsLocale()

    expect(content).toContain('    vrm:\n      model_position: 模型位置\n')
    expect(content).toContain('      environment:\n        title: 环境\n')
    expect(content).toContain('      tips_label: 提示\n')

    expect(content).toContain('    live2d:\n      parameters:\n        title: 参数\n')
    expect(content).toContain('        label: 待机动作\n')
    expect(content).toContain('      reset_default_parameters: 重置为默认参数\n')
    expect(content).toContain('      clear_model_cache: 清除模型缓存\n')
    expect(content).toContain('      expressions:\n        title: 表情\n')
  })
})
