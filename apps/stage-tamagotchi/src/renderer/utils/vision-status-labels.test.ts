import { describe, expect, it } from 'vitest'

import {
  formatExpressionSignal,
  formatFaceDirection,
  formatFacePresence,
  formatFeedbackIntensity,
  formatGateStatus,
  formatMatchStatus,
  formatVisionEnrollmentCameraStatus,
  formatVisionEnrollmentFaceDetectionStatus,
  formatVisionEnrollmentGateStatus,
  formatVisionEnrollmentModelStatus,
  formatVisionEnrollmentProfileStatus,
  formatVisionEnrollmentQualityStatus,
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

  it('formats enrollment overview statuses into natural zh-CN labels', () => {
    expect(formatVisionEnrollmentCameraStatus('off', 'prompt', 'zh-CN')).toBe('已关闭')
    expect(formatVisionEnrollmentCameraStatus('active', 'granted', 'zh-CN')).toBe('已开启')
    expect(formatVisionEnrollmentCameraStatus('active', 'denied', 'zh-CN')).toBe('权限被拒绝')
    expect(formatVisionEnrollmentModelStatus('partial_ready', 'zh-CN')).toBe('部分就绪')
    expect(formatVisionEnrollmentModelStatus('ready', 'zh-CN')).toBe('已就绪')
    expect(formatVisionEnrollmentModelStatus('failed', 'zh-CN')).toBe('初始化失败')
    expect(formatVisionEnrollmentProfileStatus('none', 'zh-CN')).toBe('未录入')
    expect(formatVisionEnrollmentProfileStatus('encrypted', 'zh-CN')).toBe('已锁定')
    expect(formatVisionEnrollmentProfileStatus('unlocked', 'zh-CN')).toBe('已解锁')
    expect(formatVisionEnrollmentGateStatus('gated', 'matching', 'zh-CN')).toBe('等待匹配')
    expect(formatVisionEnrollmentGateStatus('gated', 'matched', 'zh-CN')).toBe('已匹配')
    expect(formatVisionEnrollmentGateStatus('disabled', 'not_enrolled', 'zh-CN')).toBe('未启用')
    expect(formatVisionEnrollmentFaceDetectionStatus('multiple_faces', 'zh-CN')).toBe('检测到多人')
    expect(formatVisionEnrollmentFaceDetectionStatus('no_face', 'zh-CN')).toBe('未检测到人脸')
    expect(formatVisionEnrollmentFaceDetectionStatus('matched', 'zh-CN')).toBe('已检测到单人')
  })

  it('formats enrollment quality hints without exposing raw metrics by default', () => {
    expect(formatVisionEnrollmentQualityStatus(null, 'zh-CN')).toBe('等待检测')
    expect(formatVisionEnrollmentQualityStatus({
      qualityScore: 0.5,
      brightness: 70,
      sharpness: 20,
      contrast: 20,
      faceSize: 0.2,
    }, 'zh-CN')).toBe('偏暗')
    expect(formatVisionEnrollmentQualityStatus({
      qualityScore: 0.5,
      brightness: 120,
      sharpness: 10,
      contrast: 20,
      faceSize: 0.2,
    }, 'zh-CN')).toBe('模糊')
    expect(formatVisionEnrollmentQualityStatus({
      qualityScore: 0.5,
      brightness: 120,
      sharpness: 20,
      contrast: 20,
      faceSize: 0.1,
    }, 'zh-CN')).toBe('请靠近摄像头')
    expect(formatVisionEnrollmentQualityStatus({
      qualityScore: 0.85,
      brightness: 130,
      sharpness: 22,
      contrast: 20,
      faceSize: 0.24,
    }, 'zh-CN')).toBe('良好')
  })
})
