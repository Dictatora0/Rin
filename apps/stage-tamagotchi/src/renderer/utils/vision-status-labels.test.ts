import { describe, expect, it } from 'vitest'

import {
  formatExpressionSignal,
  formatFaceDirection,
  formatFacePresence,
  formatFeedbackIntensity,
  formatGateStatus,
  formatMatchStatus,
  formatVisionFieldLabel,
  formatVisionStatusLabel,
  formatVisionStatusValue,
  normalizeVisionStatusLocale,
} from './vision-status-labels'

describe('vision-status-labels', () => {
  it('maps core status values to natural zh-CN labels', () => {
    expect(formatVisionFieldLabel('cameraState', 'zh-CN')).toBe('摄像头')
    expect(formatVisionStatusValue('active', 'zh-CN')).toBe('运行中')
    expect(formatFacePresence('absent', 'zh-CN')).toBe('未检测到主体')
    expect(formatFaceDirection('unknown', 'zh-CN')).toBe('未知')
    expect(formatGateStatus('locked', 'zh-CN')).toBe('已锁定')
    expect(formatMatchStatus('no_face', 'zh-CN')).toBe('未检测到人脸')
    expect(formatVisionStatusValue('gated', 'zh-CN')).toBe('已拦截')
  })

  it('maps feedback intensity and expression signals to natural zh-CN labels', () => {
    expect(formatFeedbackIntensity('expressive', 'zh-CN')).toBe('活跃')
    expect(formatExpressionSignal('looking_away_signal', 'zh-CN')).toBe('偏离中心信号')
    expect(formatExpressionSignal('smile_like_signal', 'zh-CN')).toBe('类微笑信号')
  })

  it('keeps unknown values stable and never crashes on fallback', () => {
    expect(formatVisionStatusValue('unmapped_value', 'zh-CN')).toBe('unmapped_value')
    expect(formatVisionStatusLabel('mysteryField', 'mysteryValue', 'zh-CN')).toBe('mysteryField：mysteryValue')
    expect(formatVisionStatusLabel('cameraState', '', 'zh-CN')).toBe('未知')
  })

  it('supports en locale and locale normalization', () => {
    expect(normalizeVisionStatusLocale('en')).toBe('en')
    expect(normalizeVisionStatusLocale('zh-CN')).toBe('zh-CN')
    expect(normalizeVisionStatusLocale('ja-JP')).toBe('zh-CN')
    expect(formatVisionStatusLabel('cameraState', 'active', 'en')).toBe('Camera：Active')
    expect(formatExpressionSignal('looking_away_signal', 'en')).toBe('Off-center signal')
  })
})
