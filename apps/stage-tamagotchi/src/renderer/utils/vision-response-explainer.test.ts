import { describe, expect, it } from 'vitest'

import {
  buildVisionResponseExplanation,
  getTopVisionBlockers,
} from './vision-response-explainer'

function baseInput() {
  return {
    cameraState: 'active',
    cameraPermissionState: 'granted',
    runtimeStatus: 'ready',
    facePresence: 'present',
    gateEnabled: true,
    faceGateState: 'enabled',
    gateProfileStatus: 'matched',
    faceProfileStatus: 'unlocked',
    qualityAccepted: true,
    qualityScore: 0.9,
    hasNeutralCenter: true,
    isQuietMode: false,
    subjectResponseCooldownSeconds: 0,
    canTriggerSubjectPositionResponse: true,
    lastStableSubjectPosition: 'center',
  }
}

describe('vision response explainer', () => {
  it('explains camera off', () => {
    const explanation = buildVisionResponseExplanation({
      ...baseInput(),
      cameraState: 'off',
    })
    expect(explanation.responding).toBe(false)
    expect(explanation.reasons[0]?.text).toContain('开启摄像头')
  })

  it('explains no_face', () => {
    const explanation = buildVisionResponseExplanation({
      ...baseInput(),
      facePresence: 'absent',
      gateProfileStatus: 'no_face',
    })
    expect(explanation.responding).toBe(false)
    expect(explanation.reasons.some(reason => reason.text.includes('面部出现在画面中'))).toBe(true)
  })

  it('explains gate blocked', () => {
    const explanation = buildVisionResponseExplanation({
      ...baseInput(),
      faceGateState: 'gated',
      gateProfileStatus: 'unmatched',
    })
    expect(explanation.responding).toBe(false)
    expect(explanation.reasons.some(reason => reason.text.includes('不是已录入用户'))).toBe(true)
  })

  it('explains cooldown and quiet mode', () => {
    const explanation = buildVisionResponseExplanation({
      ...baseInput(),
      subjectResponseCooldownSeconds: 3,
      isQuietMode: true,
    })
    const text = explanation.reasons.map(reason => reason.text).join(' ')
    expect(text.includes('冷却中')).toBe(true)
    expect(text.includes('安静模式')).toBe(true)
  })

  it('returns normal summary in healthy state', () => {
    const explanation = buildVisionResponseExplanation(baseInput())
    expect(explanation.responding).toBe(true)
    expect(explanation.summary).toBe('Rin 当前可以响应你的主体位置反馈。')
    expect(explanation.reasons[0]?.text).toBe('当前状态正常。')
  })

  it('returns only top 1~3 reasons', () => {
    const blockers = getTopVisionBlockers({
      ...baseInput(),
      cameraState: 'off',
      runtimeStatus: 'failed',
      facePresence: 'absent',
      gateProfileStatus: 'multiple_faces',
      hasNeutralCenter: false,
      isQuietMode: true,
      subjectResponseCooldownSeconds: 6,
    })
    expect(blockers.length).toBeGreaterThanOrEqual(1)
    expect(blockers.length).toBeLessThanOrEqual(3)
  })

  it('does not expose raw keys in explanation text', () => {
    const explanation = buildVisionResponseExplanation({
      ...baseInput(),
      gateProfileStatus: 'multiple_faces',
      faceGateState: 'gated',
    })
    const text = `${explanation.summary} ${explanation.reasons.map(reason => reason.text).join(' ')}`
    expect(text.includes('multiple_faces')).toBe(false)
    expect(text.includes('gated')).toBe(false)
    expect(text.includes('runtimeStatus')).toBe(false)
  })
})
