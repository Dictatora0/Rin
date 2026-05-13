export type VisionResponseExplainerAction
  = | 'start-camera'
    | 'open-enrollment'
    | 'calibrate-subject'
    | 'retry-runtime'
    | 'none'

export interface VisionResponseExplainerInput {
  cameraState?: string
  cameraPermissionState?: string
  runtimeStatus?: string
  facePresence?: string
  gateEnabled?: boolean
  faceGateState?: string
  gateProfileStatus?: string
  faceProfileStatus?: string
  qualityAccepted?: boolean | null
  qualityScore?: number | null
  hasNeutralCenter?: boolean
  isQuietMode?: boolean
  subjectResponseCooldownSeconds?: number
  canTriggerSubjectPositionResponse?: boolean
  lastStableSubjectPosition?: string
}

export interface VisionResponseReason {
  id: string
  text: string
  actionLabel?: string
  action?: VisionResponseExplainerAction
}

export interface VisionResponseExplanation {
  responding: boolean
  title: string
  summary: string
  reasons: VisionResponseReason[]
}

function normalizeGateEnabled(input: VisionResponseExplainerInput) {
  if (typeof input.gateEnabled === 'boolean')
    return input.gateEnabled
  return input.faceGateState === 'enabled' || input.faceGateState === 'locked' || input.faceGateState === 'gated'
}

/**
 * Returns prioritized blockers that explain why response is currently limited.
 */
export function getTopVisionBlockers(input: VisionResponseExplainerInput): VisionResponseReason[] {
  const reasons: VisionResponseReason[] = []
  const gateEnabled = normalizeGateEnabled(input)

  if (input.cameraPermissionState === 'denied') {
    reasons.push({
      id: 'permission-denied',
      text: 'macOS 摄像头权限未开启，请先在系统设置中允许。',
      action: 'none',
    })
  }

  if (input.cameraState !== 'active') {
    reasons.push({
      id: 'camera-off',
      text: '请先开启摄像头。',
      actionLabel: '开启摄像头',
      action: 'start-camera',
    })
  }

  if (input.runtimeStatus === 'failed') {
    reasons.push({
      id: 'runtime-failed',
      text: '视觉运行环境初始化失败，请重试视觉运行环境。',
      actionLabel: '重试视觉运行环境',
      action: 'retry-runtime',
    })
  }
  else if (input.cameraState === 'active' && input.runtimeStatus !== 'ready' && input.runtimeStatus !== 'partial_ready') {
    reasons.push({
      id: 'runtime-not-ready',
      text: '视觉模型还在准备中，稍等片刻再试。',
      actionLabel: '重试视觉运行环境',
      action: 'retry-runtime',
    })
  }

  if (input.facePresence === 'absent' || input.gateProfileStatus === 'no_face') {
    reasons.push({
      id: 'no-face',
      text: '请让面部出现在画面中。',
      action: 'none',
    })
  }

  if (input.gateProfileStatus === 'multiple_faces') {
    reasons.push({
      id: 'multiple-faces',
      text: '检测到多人入镜，请确保画面中只有你一人。',
      action: 'none',
    })
  }

  if (gateEnabled && (input.faceProfileStatus === 'none' || input.gateProfileStatus === 'not_enrolled')) {
    reasons.push({
      id: 'no-profile',
      text: '当前开启了人脸门控，但还没有可用档案，请先完成人脸录入。',
      actionLabel: '打开人脸录入',
      action: 'open-enrollment',
    })
  }

  if (gateEnabled && (input.faceGateState === 'gated' || input.faceGateState === 'locked' || input.gateProfileStatus === 'unmatched')) {
    reasons.push({
      id: 'gate-unmatched',
      text: '当前不是已录入用户，Rin 不会响应主体反馈。',
      actionLabel: '打开人脸录入',
      action: 'open-enrollment',
    })
  }

  const isLowQuality = input.qualityAccepted === false
    || (typeof input.qualityScore === 'number' && input.qualityScore < 0.45)
  if (isLowQuality) {
    reasons.push({
      id: 'low-quality',
      text: '画面质量偏低，请调整光线或靠近摄像头。',
      action: 'none',
    })
  }

  if (input.hasNeutralCenter === false) {
    reasons.push({
      id: 'neutral-center-missing',
      text: '建议先校准当前坐姿，方向反馈会更准确。',
      actionLabel: '校准当前坐姿',
      action: 'calibrate-subject',
    })
  }

  if ((input.subjectResponseCooldownSeconds ?? 0) > 0) {
    reasons.push({
      id: 'cooldown',
      text: `当前反馈处于冷却中，约 ${(input.subjectResponseCooldownSeconds ?? 0)} 秒后可再次触发。`,
      action: 'none',
    })
  }

  if (input.isQuietMode) {
    reasons.push({
      id: 'quiet-mode',
      text: '当前在安静模式，Rin 会减少主动反馈。',
      action: 'none',
    })
  }

  if (reasons.length === 0 && input.canTriggerSubjectPositionResponse !== false && input.lastStableSubjectPosition === 'center') {
    reasons.push({
      id: 'no-new-change',
      text: '你已经在画面中心，Rin 暂时没有新的反馈需要提示。',
      action: 'none',
    })
  }

  return reasons.slice(0, 3)
}

/**
 * Builds user-facing explanation card content for current response state.
 */
export function buildVisionResponseExplanation(input: VisionResponseExplainerInput): VisionResponseExplanation {
  const reasons = getTopVisionBlockers(input)
  const hasBlockingReasons = reasons.length > 0 && reasons.some(reason => reason.id !== 'no-new-change')
  if (!hasBlockingReasons) {
    return {
      responding: true,
      title: '为什么 Rin 没响应？',
      summary: 'Rin 当前可以响应你的主体位置反馈。',
      reasons: [
        {
          id: 'healthy',
          text: '当前状态正常。',
          action: 'none',
        },
      ],
    }
  }

  return {
    responding: false,
    title: '为什么 Rin 没响应？',
    summary: 'Rin 暂时没有响应，请先处理下面的问题。',
    reasons,
  }
}
