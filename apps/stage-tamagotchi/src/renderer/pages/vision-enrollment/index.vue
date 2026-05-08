<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../composables/use-vision-interaction'

const router = useRouter()
const videoRef = ref<HTMLVideoElement | null>(null)
const isDev = import.meta.env.DEV

const {
  isEnabled,
  cameraState,
  cameraPermissionState,
  mediaPipeStatus,
  errorMessage,
  displayName,
  gateEnabled,
  hasEncryptedProfile,
  rememberFaceProfileOnDevice,
  secureStoreAvailable,
  localFaceGate,
  openCvFaceQuality,
  encryptedProfile,
  cameraDiagnostics,
  attachVideoElement,
  start,
  stop,
  setDisplayName,
  setFaceGateEnabled,
  enrollLocalFaceProfile,
  unlockFaceProfile,
  lockFaceProfile,
  deleteLocalFaceProfile,
  setRememberFaceProfileOnDevice,
} = useVisionInteraction()

const passphrase = ref('')
const confirmPassphrase = ref('')
const unlockPassphrase = ref('')
const enrolling = ref(false)
const unlocking = ref(false)
const rememberOnDevice = ref(false)
const displayNameInput = ref(displayName.value)

const thresholdInput = ref(localFaceGate.threshold.value.toFixed(2))
const qualityThresholdInput = ref(localFaceGate.qualityThreshold.value.toFixed(2))
const stableFramesInput = ref(String(localFaceGate.stableFrames.value))
const enrollSampleCountInput = ref('6')
const acceptedSamples = ref(0)
const rejectedSamples = ref(0)
const enrollmentMessage = ref('')

const profileStatus = computed(() => encryptedProfile.status.value)
const latestQuality = computed(() => openCvFaceQuality.latestQuality.value)
const openCvStatus = computed(() => openCvFaceQuality.status.value)
const openCvErrorMessage = computed(() => openCvFaceQuality.errorMessage.value)
const unlockedProfile = computed(() => encryptedProfile.unlockedProfile.value)
const cameraStateText = computed(() => {
  const map: Record<string, string> = {
    off: '已关闭',
    loading: '加载中',
    active: '运行中',
    error: '错误',
  }
  return map[cameraState.value] ?? cameraState.value
})
const openCvStatusText = computed(() => {
  const map: Record<string, string> = {
    loading: '加载中',
    ready: '就绪',
    failed: '失败',
    fallback: '降级模式',
  }
  return map[openCvStatus.value] ?? openCvStatus.value
})
const profileStatusText = computed(() => {
  const map: Record<string, string> = {
    none: '未录入',
    encrypted: '已加密（锁定）',
    unlocked: '已解锁',
  }
  return map[profileStatus.value] ?? profileStatus.value
})
const cameraPermissionStateText = computed(() => {
  const map: Record<string, string> = {
    unknown: '未知',
    prompt: '待请求',
    granted: '已授权',
    denied: '已拒绝',
    unsupported: '不支持',
  }
  return map[cameraPermissionState.value] ?? cameraPermissionState.value
})
const mediaPipeStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    loading: 'loading',
    ready: 'ready',
    failed: 'failed',
  }
  return map[mediaPipeStatus.value] ?? mediaPipeStatus.value
})
const gateStateText = computed(() => {
  const map: Record<string, string> = {
    disabled: '未启用',
    enabled: '已启用',
    gated: '门控中',
    locked: '已锁定',
  }
  return map[localFaceGate.gateState.value] ?? localFaceGate.gateState.value
})
const gateProfileStatusText = computed(() => {
  const map: Record<string, string> = {
    not_enrolled: 'not_enrolled',
    enrolling: 'enrolling',
    enrolled: 'enrolled',
    matching: 'matching',
    matched: 'matched',
    unmatched: 'unmatched',
    uncertain: 'uncertain',
    multiple_faces: 'multiple_faces',
    no_face: 'no_face',
  }
  return map[localFaceGate.profileStatus.value] ?? localFaceGate.profileStatus.value
})
const qualityText = computed(() => {
  const q = latestQuality.value
  if (!q)
    return '暂无'
  return `${q.qualityScore.toFixed(2)}（${q.accepted ? '通过' : mapQualityReason(q.reason)}）`
})
const lastTrackEndedAtText = computed(() => {
  if (!cameraDiagnostics.value.lastTrackEndedAt)
    return '无'
  return new Date(cameraDiagnostics.value.lastTrackEndedAt).toLocaleTimeString()
})
const lastInferenceErrorAtText = computed(() => {
  if (!cameraDiagnostics.value.lastInferenceErrorAt)
    return '无'
  return new Date(cameraDiagnostics.value.lastInferenceErrorAt).toLocaleTimeString()
})
const visionLastError = computed(() => {
  if (errorMessage.value)
    return errorMessage.value
  if (cameraDiagnostics.value.lastInferenceErrorMessage)
    return cameraDiagnostics.value.lastInferenceErrorMessage
  return '无'
})

watch(videoRef, element => attachVideoElement(element), { immediate: true })

watch(displayName, (value) => {
  if (value !== displayNameInput.value)
    displayNameInput.value = value
})
watch(displayNameInput, (value) => {
  if (value === displayName.value)
    return
  setDisplayName(value)
})

watch(() => localFaceGate.threshold.value, (value) => {
  thresholdInput.value = value.toFixed(2)
})
watch(() => localFaceGate.qualityThreshold.value, (value) => {
  qualityThresholdInput.value = value.toFixed(2)
})
watch(() => localFaceGate.stableFrames.value, (value) => {
  stableFramesInput.value = String(value)
})

watch(thresholdInput, (value) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setThreshold(parsed)
})
watch(qualityThresholdInput, (value) => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setQualityThreshold(parsed)
})
watch(stableFramesInput, (value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed))
    return
  localFaceGate.setStableFrames(parsed)
})
watch(rememberFaceProfileOnDevice, (value) => {
  rememberOnDevice.value = value
}, { immediate: true })

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

async function runEnrollment() {
  enrolling.value = true
  enrollmentMessage.value = ''
  acceptedSamples.value = 0
  rejectedSamples.value = 0
  try {
    const sampleCount = Number.parseInt(enrollSampleCountInput.value, 10)
    const result = await enrollLocalFaceProfile({
      displayName: displayNameInput.value,
      passphrase: passphrase.value,
      confirmPassphrase: confirmPassphrase.value,
      threshold: localFaceGate.threshold.value,
      qualityThreshold: localFaceGate.qualityThreshold.value,
      stableFrames: localFaceGate.stableFrames.value,
      enrollSampleCount: sampleCount,
    })

    if (!result.ok) {
      enrollmentMessage.value = `录入失败：${mapEnrollmentFailureReason(result.reason)}`
      toast.error(enrollmentMessage.value)
      return
    }

    acceptedSamples.value = result.captured
    enrollmentMessage.value = `录入完成：已通过 ${result.captured}/${result.target} 个样本。`
    toast.success('人脸档案已在本地加密保存。')
    setFaceGateEnabled(true)
  }
  finally {
    enrolling.value = false
  }
}

async function runUnlock() {
  unlocking.value = true
  try {
    const result = await unlockFaceProfile(unlockPassphrase.value, {
      rememberOnDevice: rememberOnDevice.value,
    })
    if (!result.ok) {
      toast.error('无法解锁本地人脸档案。')
      return
    }
    unlockPassphrase.value = ''
    toast.success('人脸档案已解锁。')
  }
  finally {
    unlocking.value = false
  }
}

async function toggleRememberOnDevice(event: Event) {
  const nextValue = (event.target as HTMLInputElement).checked
  const accepted = await setRememberFaceProfileOnDevice(nextValue)
  rememberOnDevice.value = accepted && nextValue
}

function runLock() {
  lockFaceProfile()
  toast.message('人脸档案已锁定。')
}

function runDelete() {
  if (!hasEncryptedProfile.value)
    return
  const confirmed = typeof window === 'undefined'
    ? true
    : window.confirm('确认删除本地加密人脸档案？此操作不可撤销。')
  if (!confirmed)
    return

  deleteLocalFaceProfile()
  setFaceGateEnabled(false)
  unlockPassphrase.value = ''
  passphrase.value = ''
  confirmPassphrase.value = ''
  acceptedSamples.value = 0
  rejectedSamples.value = 0
  enrollmentMessage.value = '档案已清除。'
  toast.message('本地加密人脸档案已删除。')
}

function backToStage() {
  void router.push('/')
}

function mapQualityReason(reason: string | undefined) {
  const map: Record<string, string> = {
    low_quality: '质量不达标',
    face_too_small: '人脸过小',
    opencv_not_ready: 'OpenCV 未就绪',
    invalid_frame: '无效画面',
  }
  if (!reason)
    return '已拒绝'
  return map[reason] ?? reason
}

function mapEnrollmentFailureReason(reason: string | undefined) {
  const map: Record<string, string> = {
    'camera inactive': '摄像头未开启',
    'displayName required': '请输入显示昵称',
    'passphrase required': '请输入口令',
    'passphrase mismatch': '两次口令不一致',
    'no face': '未检测到人脸',
    'multiple faces': '检测到多张人脸',
    'low quality': '样本质量不足',
    'descriptor failed': '人脸特征提取失败',
    'enrollment cancelled': '录入已取消',
    'save failed': '加密保存失败',
  }
  if (!reason)
    return '未知错误'
  return map[reason] ?? reason
}
</script>

<template>
  <div :class="['mx-auto max-w-4xl p-4 text-neutral-800 dark:text-neutral-100']">
    <div :class="['mb-4 flex items-center justify-between gap-2']">
      <div>
        <div :class="['text-2xl font-700']">
          人脸录入
        </div>
        <div :class="['text-sm text-neutral-500 dark:text-neutral-400']">
          为 Rin 视觉交互门控配置本地加密人脸档案。
        </div>
      </div>
      <Button size="sm" variant="ghost" @click="backToStage">
        返回主界面
      </Button>
    </div>

    <div :class="['grid gap-3 md:grid-cols-2']">
      <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
        <div :class="['mb-2 text-sm font-700']">
          摄像头控制
        </div>
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
          </Button>
        </div>
        <div :class="['mt-2 text-xs']">
          <div>摄像头状态：{{ cameraStateText }}</div>
          <div v-if="errorMessage" :class="['text-rose-600 dark:text-rose-300']">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <div :class="['rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
        <div :class="['mb-2 text-sm font-700']">
          OpenCV 状态
        </div>
        <div :class="['text-xs']">
          <div>OpenCV：{{ openCvStatusText }}</div>
          <div>质量分：{{ qualityText }}</div>
          <div>亮度：{{ latestQuality?.brightness?.toFixed(1) ?? '无' }}</div>
          <div>清晰度：{{ latestQuality?.sharpness?.toFixed(1) ?? '无' }}</div>
          <div>对比度：{{ latestQuality?.contrast?.toFixed(1) ?? '无' }}</div>
          <div>人脸尺寸：{{ latestQuality?.faceSize?.toFixed(2) ?? '无' }}</div>
          <div v-if="openCvErrorMessage" :class="['text-amber-600 dark:text-amber-300']">
            {{ openCvErrorMessage }}
          </div>
        </div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        基础信息
      </div>
      <div :class="['grid gap-2 md:grid-cols-2']">
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>显示昵称</span>
          <input
            v-model="displayNameInput"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>加密口令 / PIN</span>
          <input
            v-model="passphrase"
            type="password"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>确认口令</span>
          <input
            v-model="confirmPassphrase"
            type="password"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>匹配阈值</span>
          <input
            v-model="thresholdInput"
            inputmode="decimal"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>质量阈值</span>
          <input
            v-model="qualityThresholdInput"
            inputmode="decimal"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>目标采样数</span>
          <input
            v-model="enrollSampleCountInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
        <label :class="['flex flex-col gap-1 text-xs']">
          <span>稳定判定帧数</span>
          <input
            v-model="stableFramesInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
        </label>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        采样录入
      </div>
      <div :class="['flex flex-wrap items-center gap-2']">
        <Button size="sm" variant="primary" :disabled="enrolling || !isEnabled" @click="runEnrollment">
          {{ enrolling ? '录入中...' : (hasEncryptedProfile ? '重新录入' : '开始录入') }}
        </Button>
      </div>
      <div :class="['mt-2 text-xs']">
        <div>通过样本数：{{ acceptedSamples }}</div>
        <div>拒绝样本数：{{ rejectedSamples }}</div>
        <div v-if="enrollmentMessage">
          {{ enrollmentMessage }}
        </div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        加密档案
      </div>
      <div :class="['text-xs']">
        <div>档案状态：{{ profileStatusText }}</div>
        <div>门控状态：{{ gateStateText }}</div>
        <div>样本数量：{{ localFaceGate.profileSampleCount }}</div>
        <div v-if="unlockedProfile">
          显示昵称：{{ unlockedProfile.displayName }}
        </div>
        <div v-if="unlockedProfile">
          创建时间：{{ unlockedProfile.createdAt }}
        </div>
        <div v-if="unlockedProfile">
          更新时间：{{ unlockedProfile.updatedAt }}
        </div>
      </div>
      <div :class="['mt-2 flex flex-wrap items-center gap-2']">
        <label :class="['flex items-center gap-1 text-xs']">
          <span>启用人脸门控</span>
          <input
            :checked="gateEnabled"
            type="checkbox"
            @change="setFaceGateEnabled(($event.target as HTMLInputElement).checked)"
          >
        </label>
        <input
          v-if="profileStatus !== 'unlocked'"
          v-model="unlockPassphrase"
          type="password"
          placeholder="输入解锁口令"
          :class="[
            'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
            'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
          ]"
        >
        <Button
          v-if="profileStatus !== 'unlocked'"
          size="sm"
          variant="secondary"
          :disabled="unlocking || !hasEncryptedProfile"
          @click="runUnlock"
        >
          {{ unlocking ? '解锁中...' : '解锁档案' }}
        </Button>
        <Button v-if="profileStatus === 'unlocked'" size="sm" variant="secondary" @click="runLock">
          锁定档案
        </Button>
        <Button size="sm" variant="ghost" :disabled="!hasEncryptedProfile" @click="runDelete">
          删除档案
        </Button>
      </div>
      <div v-if="hasEncryptedProfile" :class="['mt-2 flex flex-col gap-1 text-xs']">
        <label :class="['flex items-center gap-1 text-neutral-600 dark:text-neutral-300']">
          <input
            :checked="rememberOnDevice"
            type="checkbox"
            :disabled="!secureStoreAvailable"
            @change="toggleRememberOnDevice"
          >
          <span>在本机记住并自动解锁</span>
        </label>
        <div v-if="!secureStoreAvailable && isDev" :class="['text-amber-600 dark:text-amber-300']">
          当前环境未启用安全存储，无法开启无感自动解锁。
        </div>
      </div>
      <div v-if="encryptedProfile.errorMessage" :class="['mt-2 text-xs text-rose-600 dark:text-rose-300']">
        {{ encryptedProfile.errorMessage }}
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        Vision Diagnostics
      </div>
      <div :class="['grid gap-1 text-xs md:grid-cols-2']">
        <div>cameraState：{{ cameraState }}</div>
        <div>cameraPermission：{{ cameraPermissionStateText }}</div>
        <div>MediaPipe：{{ mediaPipeStatusText }}</div>
        <div>OpenCV：{{ openCvStatusText }}</div>
        <div>faceProfile：{{ profileStatus }}</div>
        <div>faceGate：{{ localFaceGate.gateState }} / {{ gateProfileStatusText }}</div>
        <div :class="['md:col-span-2']">
          lastError：{{ visionLastError }}
        </div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      <div :class="['mb-2 text-sm font-700']">
        摄像头诊断日志
      </div>
      <div :class="['text-xs']">
        <div>轨道结束次数：{{ cameraDiagnostics.trackEndedCount }}</div>
        <div>意外轨道结束次数：{{ cameraDiagnostics.unexpectedTrackEndedCount }}</div>
        <div>最近轨道结束时间：{{ lastTrackEndedAtText }}</div>
        <div>最近轨道 ID：{{ cameraDiagnostics.lastTrackEndedTrackId ?? '无' }}</div>
        <div>最近轨道标签：{{ cameraDiagnostics.lastTrackEndedTrackLabel ?? '无' }}</div>
        <div>最近轨道结束是否主动：{{ cameraDiagnostics.lastTrackEndedIntentional === null ? '无' : (cameraDiagnostics.lastTrackEndedIntentional ? '是' : '否') }}</div>
        <div>识别异常总数：{{ cameraDiagnostics.inferenceErrorCount }}</div>
        <div>连续识别异常：{{ cameraDiagnostics.consecutiveInferenceErrorCount }}</div>
        <div>最近识别异常时间：{{ lastInferenceErrorAtText }}</div>
        <div>最近识别异常信息：{{ cameraDiagnostics.lastInferenceErrorMessage || '无' }}</div>
      </div>
    </div>

    <div :class="['mt-3 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 text-xs shadow-md dark:border-neutral-700/70 dark:bg-neutral-900/80']">
      人脸档案仅在本地加密保存，不会上传任何摄像头数据；口令不会被持久化保存，本地档案可随时删除，本功能仅用于提升 Rin 视觉交互体验。
    </div>

    <video
      ref="videoRef"
      muted
      playsinline
      :class="['h-0 w-0 op-0 pointer-events-none']"
    />
  </div>
</template>
