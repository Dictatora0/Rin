import { describe, expect, it } from 'vitest'

import { buildVisionSelfCheckReport } from './vision-self-check'

function baseInput() {
  return {
    cameraState: 'active',
    cameraPermissionState: 'granted',
    mediaPipeStatus: 'ready',
    opencvStatus: 'ready',
    runtimeStatus: 'ready',
    facePresence: 'present',
    faceProfileStatus: 'unlocked',
    faceGateState: 'enabled',
    gateProfileStatus: 'matched',
    qualityAccepted: true,
    qualityScore: 0.9,
    faceCenter: { x: 0.5, y: 0.5 },
    subjectNeutralCenter: { x: 0.5, y: 0.5 },
    directionDistribution: {
      total: 10,
      center: 6,
      left: 1,
      right: 1,
      up: 1,
      down: 1,
      ambiguous: 0,
    },
    visionCameraRunning: true,
  }
}

describe('vision self check', () => {
  it('returns needs-action when camera is off', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      cameraState: 'off',
      visionCameraRunning: false,
    })
    expect(report.overall).toBe('needs-action')
    expect(report.summary.includes('需要处理')).toBe(true)
    expect(report.items.some(item => item.id === 'camera-off')).toBe(true)
    expect(report.items.find(item => item.id === 'camera-off')?.action).toBe('start-camera')
  })

  it('returns blocked when permission denied', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      cameraPermissionState: 'denied',
    })
    expect(report.overall).toBe('blocked')
    const item = report.items.find(entry => entry.id === 'camera-permission-denied')
    expect(item?.level).toBe('error')
    expect(item?.message).toContain('macOS 未允许摄像头权限')
  })

  it('returns needs-action when runtime not ready', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      runtimeStatus: 'warming',
    })
    expect(report.overall).toBe('needs-action')
    expect(report.items.some(item => item.id === 'runtime-not-ready')).toBe(true)
  })

  it('reports no face warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      facePresence: 'absent',
      gateProfileStatus: 'no_face',
    })
    expect(report.items.some(item => item.id === 'no-face')).toBe(true)
    expect(report.items.find(item => item.id === 'no-face')?.message).toBe('请让面部出现在画面中。')
  })

  it('reports multiple faces warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      gateProfileStatus: 'multiple_faces',
    })
    expect(report.items.some(item => item.id === 'multiple-faces')).toBe(true)
    expect(report.items.find(item => item.id === 'multiple-faces')?.message).toContain('只有你一人')
  })

  it('reports unmatched gate warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      gateProfileStatus: 'unmatched',
      faceGateState: 'gated',
    })
    expect(report.items.some(item => item.id === 'gate-unmatched')).toBe(true)
    expect(report.items.find(item => item.id === 'gate-unmatched')?.action).toBe('open-enrollment')
  })

  it('returns blocked when gate enabled but no profile', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      faceProfileStatus: 'none',
      gateProfileStatus: 'not_enrolled',
      faceGateState: 'enabled',
    })
    expect(report.overall).toBe('blocked')
    expect(report.items.some(item => item.id === 'gate-no-profile')).toBe(true)
  })

  it('reports low quality warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      qualityAccepted: false,
      qualityScore: 0.2,
    })
    expect(report.items.some(item => item.id === 'low-quality')).toBe(true)
    expect(report.items.find(item => item.id === 'low-quality')?.message).toContain('画面质量偏低')
  })

  it('reports no neutral center warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      subjectNeutralCenter: null,
    })
    expect(report.items.some(item => item.id === 'missing-neutral-center')).toBe(true)
    expect(report.items.find(item => item.id === 'missing-neutral-center')?.action).toBe('calibrate-subject')
  })

  it('reports direction distribution bias warning', () => {
    const report = buildVisionSelfCheckReport({
      ...baseInput(),
      directionDistribution: {
        total: 20,
        center: 2,
        left: 15,
        right: 1,
        up: 1,
        down: 1,
        ambiguous: 0,
      },
    })
    expect(report.items.some(item => item.id === 'direction-biased')).toBe(true)
    expect(report.items.find(item => item.id === 'direction-biased')?.action).toBe('calibrate-subject')
  })

  it('returns ready summary when all checks pass', () => {
    const report = buildVisionSelfCheckReport(baseInput())
    expect(report.overall).toBe('ready')
    expect(report.summary).toBe('Rin 当前可以响应你的主体位置反馈。')
    expect(report.items.every(item => item.level === 'ok')).toBe(true)
  })
})
