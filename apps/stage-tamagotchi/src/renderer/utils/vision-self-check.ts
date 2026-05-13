export type VisionSelfCheckLevel = 'ok' | 'warning' | 'error'
export type VisionSelfCheckOverall = 'ready' | 'needs-action' | 'blocked'
export type VisionSelfCheckAction
  = | 'start-camera'
    | 'open-enrollment'
    | 'calibrate-subject'
    | 'retry-runtime'
    | 'none'

export interface VisionDirectionDistributionLike {
  total: number
  center: number
  left: number
  right: number
  up: number
  down: number
  ambiguous: number
}

export interface VisionSelfCheckInput {
  cameraState?: string
  cameraPermissionState?: string
  mediaPipeStatus?: string
  opencvStatus?: string
  runtimeStatus?: string
  facePresence?: string
  faceProfileStatus?: string
  faceGateState?: string
  gateProfileStatus?: string
  matchedUser?: string | null
  qualityAccepted?: boolean | null
  qualityScore?: number | null
  faceCenter?: { x: number, y: number } | null
  subjectNeutralCenter?: { x: number, y: number } | null
  subjectNeutralCenterUpdatedAt?: string | null
  directionDistribution?: VisionDirectionDistributionLike | null
  lastError?: string | null
  visionCameraRunning?: boolean
  enableExpressionSignals?: boolean
  quietMode?: boolean
  feedbackMuted?: boolean
}

export interface VisionSelfCheckItem {
  id: string
  label: string
  level: VisionSelfCheckLevel
  message: string
  actionLabel?: string
  action?: VisionSelfCheckAction
}

export interface VisionSelfCheckReport {
  overall: VisionSelfCheckOverall
  summary: string
  items: VisionSelfCheckItem[]
  primaryAction?: VisionSelfCheckAction
}

function createItem(item: VisionSelfCheckItem): VisionSelfCheckItem {
  return item
}

function isRuntimeReady(input: VisionSelfCheckInput) {
  return input.runtimeStatus === 'ready' || input.runtimeStatus === 'partial_ready'
}

function hasDirectionBias(distribution: VisionDirectionDistributionLike | null | undefined) {
  if (!distribution || distribution.total <= 0)
    return false
  const axisPeaks = [distribution.left, distribution.right, distribution.up, distribution.down]
  const maxDirectionalCount = Math.max(...axisPeaks)
  const directionalRatio = maxDirectionalCount / Math.max(1, distribution.total)
  const centerRatio = distribution.center / Math.max(1, distribution.total)
  return directionalRatio >= 0.7 && centerRatio < 0.2
}

/**
 * Returns an aggregated readiness status for vision interaction self-check.
 */
export function getVisionSelfCheckStatus(input: VisionSelfCheckInput): VisionSelfCheckOverall {
  return buildVisionSelfCheckReport(input).overall
}

/**
 * Builds a pure self-check report from runtime status snapshots.
 */
export function buildVisionSelfCheckReport(input: VisionSelfCheckInput): VisionSelfCheckReport {
  const items: VisionSelfCheckItem[] = []

  if (input.cameraPermissionState === 'denied') {
    items.push(createItem({
      id: 'camera-permission-denied',
      label: '摄像头权限',
      level: 'error',
      message: 'macOS 未允许摄像头权限，请在系统设置中允许。',
      action: 'none',
    }))
  }

  const cameraRunning = input.visionCameraRunning ?? input.cameraState === 'active'
  if (!cameraRunning) {
    items.push(createItem({
      id: 'camera-off',
      label: '摄像头',
      level: 'warning',
      message: '请先开启摄像头。',
      actionLabel: '开启摄像头',
      action: 'start-camera',
    }))
  }

  if (input.runtimeStatus === 'failed' || input.mediaPipeStatus === 'failed') {
    items.push(createItem({
      id: 'runtime-failed',
      label: '视觉模型',
      level: 'error',
      message: '视觉模型初始化失败，请重试视觉运行环境。',
      actionLabel: '重试视觉运行环境',
      action: 'retry-runtime',
    }))
  }
  else if (cameraRunning && !isRuntimeReady(input)) {
    items.push(createItem({
      id: 'runtime-not-ready',
      label: '视觉模型',
      level: 'warning',
      message: '视觉模型还在准备中，稍等后重试。',
      actionLabel: '重试视觉运行环境',
      action: 'retry-runtime',
    }))
  }

  const gateEnabled = input.faceGateState === 'enabled' || input.faceGateState === 'locked' || input.faceGateState === 'gated'
  const hasProfile = input.faceProfileStatus === 'encrypted' || input.faceProfileStatus === 'unlocked'
  const profileUnenrolled = input.gateProfileStatus === 'not_enrolled' || input.faceProfileStatus === 'none'
  if (gateEnabled && (!hasProfile || profileUnenrolled)) {
    items.push(createItem({
      id: 'gate-no-profile',
      label: '人脸门控',
      level: 'error',
      message: '当前已开启人脸门控，但尚未录入可用档案，请先完成人脸录入。',
      actionLabel: '打开人脸录入',
      action: 'open-enrollment',
    }))
  }

  if (input.facePresence === 'absent' || input.gateProfileStatus === 'no_face') {
    items.push(createItem({
      id: 'no-face',
      label: '人脸检测',
      level: 'warning',
      message: '请让面部出现在画面中。',
      action: 'none',
    }))
  }

  if (input.gateProfileStatus === 'multiple_faces') {
    items.push(createItem({
      id: 'multiple-faces',
      label: '人脸检测',
      level: 'warning',
      message: '请确保画面中只有你一人。',
      action: 'none',
    }))
  }

  if (gateEnabled && (input.gateProfileStatus === 'unmatched' || input.faceGateState === 'gated' || input.faceGateState === 'locked')) {
    items.push(createItem({
      id: 'gate-unmatched',
      label: '人脸门控',
      level: 'warning',
      message: '当前用户未通过人脸门控。',
      actionLabel: '打开人脸录入',
      action: 'open-enrollment',
    }))
  }

  const isLowQuality = input.qualityAccepted === false
    || (typeof input.qualityScore === 'number' && input.qualityScore < 0.45)
  if (isLowQuality) {
    items.push(createItem({
      id: 'low-quality',
      label: '画面质量',
      level: 'warning',
      message: '画面质量偏低，请调整光线或靠近摄像头。',
      action: 'none',
    }))
  }

  if (!input.subjectNeutralCenter) {
    items.push(createItem({
      id: 'missing-neutral-center',
      label: '主体位置校准',
      level: 'warning',
      message: '建议先校准当前坐姿，方向反馈会更准确。',
      actionLabel: '校准当前坐姿',
      action: 'calibrate-subject',
    }))
  }

  if (hasDirectionBias(input.directionDistribution)) {
    items.push(createItem({
      id: 'direction-biased',
      label: '方向稳定性',
      level: 'warning',
      message: 'Rin 发现你最近一直偏向画面某一侧，建议重新校准当前坐姿。',
      actionLabel: '重新校准',
      action: 'calibrate-subject',
    }))
  }

  const hasError = items.some(item => item.level === 'error')
  const hasWarning = items.some(item => item.level === 'warning')
  if (!hasError && !hasWarning) {
    const okItems: VisionSelfCheckItem[] = [
      createItem({
        id: 'camera-ok',
        label: '摄像头',
        level: 'ok',
        message: '摄像头状态正常。',
        action: 'none',
      }),
      createItem({
        id: 'runtime-ok',
        label: '视觉模型',
        level: 'ok',
        message: '视觉模型已就绪。',
        action: 'none',
      }),
      createItem({
        id: 'face-ok',
        label: '人脸检测',
        level: 'ok',
        message: '已检测到主体。',
        action: 'none',
      }),
      createItem({
        id: 'gate-ok',
        label: '人脸门控',
        level: 'ok',
        message: gateEnabled ? '门控状态正常。' : '门控未启用，不影响基础反馈。',
        action: 'none',
      }),
      createItem({
        id: 'calibration-ok',
        label: '主体位置校准',
        level: 'ok',
        message: input.subjectNeutralCenter ? '已完成主体位置校准。' : '当前使用默认中心。',
        action: 'none',
      }),
    ]
    return {
      overall: 'ready',
      summary: 'Rin 当前可以响应你的主体位置反馈。',
      items: okItems,
      primaryAction: 'none',
    }
  }

  const issueCount = items.filter(item => item.level !== 'ok').length
  const overall: VisionSelfCheckOverall = hasError ? 'blocked' : 'needs-action'
  const primaryAction = items.find(item => item.action && item.action !== 'none')?.action

  return {
    overall,
    summary: `Rin 暂时不会响应，需要处理 ${issueCount} 个问题。`,
    items,
    primaryAction,
  }
}
