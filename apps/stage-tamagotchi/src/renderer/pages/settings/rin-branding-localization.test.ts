import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const enSettingsPath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/en/settings.yaml')
const zhSettingsPath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/zh-Hans/settings.yaml')
const enStagePath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/en/stage.yaml')
const zhStagePath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/zh-Hans/stage.yaml')
const enServerAuthPath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/en/server/auth.yaml')
const zhServerAuthPath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/zh-Hans/server/auth.yaml')
const enBasePath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/en/base.yaml')
const zhBasePath = resolve(import.meta.dirname, '../../../../../../packages/i18n/src/locales/zh-Hans/base.yaml')

function read(filePath: string) {
  return readFileSync(filePath, 'utf8')
}

describe('rin branding localization', () => {
  it('uses Rin in settings onboarding/account/data/card visible copy', () => {
    const en = read(enSettingsPath)
    const zh = read(zhSettingsPath)

    expect(en).toContain('Welcome to Rin!')
    expect(en).toContain('Sign in to use the official Rin provider for the best experience.')
    expect(en).toContain('Use Rin character card presets')
    expect(en).toContain('title: Rin Card')
    expect(en).toContain('Manage stored Rin data, exports, and resets')
    expect(en).not.toContain('Welcome to AIRI!')
    expect(en).not.toContain('title: AIRI Card')

    expect(zh).toContain('欢迎来到 Rin！')
    expect(zh).toContain('登录并使用 Rin 官方提供的服务以获得最佳体验。')
    expect(zh).toContain('使用 Rin 角色卡预设')
    expect(zh).toContain('title: Rin 角色卡')
    expect(zh).toContain('管理存储 Rin 数据、导出和重置')
    expect(zh).not.toContain('欢迎来到 AIRI！')
    expect(zh).not.toContain('title: AIRI 角色卡')
  })

  it('uses Rin for stage character display name in both locales', () => {
    const en = read(enStagePath)
    const zh = read(zhStagePath)

    expect(en).toContain('airi: Rin')
    expect(zh).toContain('airi: Rin')
    expect(en).not.toContain('airi: AIRI')
    expect(zh).not.toContain('airi: AIRI')
  })

  it('uses Rin in auth callback copy and default persona prompt', () => {
    const enAuth = read(enServerAuthPath)
    const zhAuth = read(zhServerAuthPath)
    const enBase = read(enBasePath)
    const zhBase = read(zhBasePath)

    expect(enAuth).toContain('openingAiri: Opening Rin')
    expect(enAuth).toContain('openAiriToContinue: Open Rin to continue')
    expect(zhAuth).toContain('openingAiri: 正在打开Rin')
    expect(zhAuth).toContain('openAiriToContinue: 打开Rin以继续')

    expect(enBase).toContain('Your name is Rin,')
    expect(zhBase).toContain('你的名字是 Rin，')
  })
})
