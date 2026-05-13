<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../composables/use-vision-interaction'
import {
  formatVisionEnrollmentCameraStatus,
  formatVisionEnrollmentFaceDetectionStatus,
  formatVisionEnrollmentGateStatus,
  formatVisionEnrollmentModelStatus,
  formatVisionEnrollmentProfileStatus,
  formatVisionEnrollmentQualityStatus,
  formatVisionStatusValue,
} from '../../utils/vision-status-labels'

const router = useRouter()
const videoRef = ref<HTMLVideoElement | null>(null)
const isDev = import.meta.env.DEV

const {
  isEnabled,
  cameraState,
  cameraPermissionState,
  mediaPipeStatus,
  runtimeStatus,
  runtimeWarmupDurationMs,
  runtimeRetryCount,
  runtimeLastError,
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
  warmupVisionRuntime,
  retryVisionRuntime,
  resetVisionRuntime,
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
const runtimeWorking = ref(false)
const rememberOnDevice = ref(false)
const displayNameInput = ref(displayName.value)
const showReEnrollmentFlow = ref(false)
const advancedEnrollmentOpen = ref(false)
const diagnosticsOpen = ref(false)

const thresholdInput = ref(localFaceGate.threshold.value.toFixed(2))
const qualityThresholdInput = ref(localFaceGate.qualityThreshold.value.toFixed(2))
const stableFramesInput = ref(String(localFaceGate.stableFrames.value))
const enrollSampleCountInput = ref('6')
const acceptedSamples = ref(0)
const rejectedSamples = ref(0)
const enrollmentMessage = ref('')
const enrollmentErrorReason = ref('')

const profileStatus = computed(() => encryptedProfile.status.value)
const latestQuality = computed(() => openCvFaceQuality.latestQuality.value)
const openCvStatus = computed(() => openCvFaceQuality.status.value)
const openCvErrorMessage = computed(() => openCvFaceQuality.errorMessage.value)
const unlockedProfile = computed(() => encryptedProfile.unlockedProfile.value)

const normalizedEnrollTarget = computed(() => {
  const parsed = Number.parseInt(enrollSampleCountInput.value, 10)
  if (!Number.isFinite(parsed))
    return 6
  return Math.max(5, Math.min(10, Math.round(parsed)))
})

const cameraStateText = computed(() => {
  return formatVisionEnrollmentCameraStatus(
    cameraState.value,
    cameraPermissionState.value,
    'zh-CN',
  )
})
const modelStatusText = computed(() => {
  return formatVisionEnrollmentModelStatus(runtimeStatus.value, 'zh-CN')
})
const profileStatusText = computed(() => {
  return formatVisionEnrollmentProfileStatus(profileStatus.value, 'zh-CN')
})
const gateStateText = computed(() => {
  return formatVisionEnrollmentGateStatus(localFaceGate.gateState.value, localFaceGate.profileStatus.value, 'zh-CN')
})
const qualityStatusText = computed(() => {
  return formatVisionEnrollmentQualityStatus(latestQuality.value, 'zh-CN')
})
const faceDetectionText = computed(() => {
  return formatVisionEnrollmentFaceDetectionStatus(localFaceGate.profileStatus.value, 'zh-CN')
})

const sampleProgressText = computed(() => `${acceptedSamples.value} / ${normalizedEnrollTarget.value}`)
const sampleProgressRatio = computed(() => {
  const target = normalizedEnrollTarget.value
  if (target <= 0)
    return 0
  return Math.min(1, acceptedSamples.value / target)
})

const cameraPermissionStateText = computed(() => formatVisionStatusValue(cameraPermissionState.value, 'zh-CN'))
const mediaPipeStatusText = computed(() => formatVisionStatusValue(mediaPipeStatus.value, 'zh-CN'))
const runtimeStatusText = computed(() => formatVisionStatusValue(runtimeStatus.value, 'zh-CN'))
const openCvStatusText = computed(() => formatVisionStatusValue(openCvStatus.value, 'zh-CN'))

const runtimeWarmupDurationText = computed(() => formatTiming(runtimeWarmupDurationMs.value))
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
  if (runtimeLastError.value)
    return runtimeLastError.value
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
watch(hasEncryptedProfile, (value) => {
  if (!value)
    showReEnrollmentFlow.value = true
}, { immediate: true })

onMounted(() => {
  void warmupVisionRuntime({
    background: true,
    includeOpenCv: false,
  }).catch(() => {
    // diagnostics panel will display latest runtime error.
  })
})

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

async function handleRetryRuntime() {
  if (runtimeWorking.value)
    return
  runtimeWorking.value = true
  try {
    await retryVisionRuntime()
    toast.success('视觉运行环境重试完成。')
  }
  catch {
    toast.error('视觉运行环境重试失败。')
  }
  finally {
    runtimeWorking.value = false
  }
}

async function handleResetRuntime() {
  if (runtimeWorking.value)
    return
  runtimeWorking.value = true
  try {
    await resetVisionRuntime()
    toast.message('视觉运行环境已重置。')
  }
  finally {
    runtimeWorking.value = false
  }
}

async function runEnrollment() {
  enrolling.value = true
  enrollmentMessage.value = ''
  enrollmentErrorReason.value = ''
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
      enrollmentErrorReason.value = mapEnrollmentFailureReason(result.reason)
      rejectedSamples.value = Math.max(1, rejectedSamples.value)
      enrollmentMessage.value = `录入失败：${enrollmentErrorReason.value}`
      toast.error(enrollmentMessage.value)
      return
    }

    acceptedSamples.value = result.captured
    rejectedSamples.value = 0
    enrollmentMessage.value = `录入完成：已通过 ${result.captured}/${result.target} 个样本。`
    toast.success('人脸档案已在本机加密保存。')
    setFaceGateEnabled(true)
    showReEnrollmentFlow.value = false
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
    : window.confirm('确认删除本地加密人脸档案？删除后需重新录入。')
  if (!confirmed)
    return

  deleteLocalFaceProfile()
  setFaceGateEnabled(false)
  unlockPassphrase.value = ''
  passphrase.value = ''
  confirmPassphrase.value = ''
  acceptedSamples.value = 0
  rejectedSamples.value = 0
  enrollmentErrorReason.value = ''
  enrollmentMessage.value = '档案已清除。'
  showReEnrollmentFlow.value = true
  toast.message('本地加密人脸档案已删除。')
}

function startReEnrollment() {
  showReEnrollmentFlow.value = true
  acceptedSamples.value = 0
  rejectedSamples.value = 0
  enrollmentErrorReason.value = ''
  enrollmentMessage.value = ''
}

function handleAdvancedEnrollmentToggle(event: Event) {
  const element = event.currentTarget as HTMLDetailsElement | null
  advancedEnrollmentOpen.value = !!element?.open
}

function handleDiagnosticsToggle(event: Event) {
  const element = event.currentTarget as HTMLDetailsElement | null
  diagnosticsOpen.value = !!element?.open
}

function backToStage() {
  void router.push('/')
}

function mapEnrollmentFailureReason(reason: string | undefined) {
  const map: Record<string, string> = {
    'camera inactive': '摄像头未开启',
    'displayName required': '请输入显示昵称',
    'passphrase required': '请输入口令',
    'passphrase mismatch': '两次口令不一致',
    'no face': '未检测到人脸',
    'multiple faces': '检测到多人，请确保画面中只有你一人',
    'low quality': '样本质量不足，请调整光线或姿态后重试',
    'descriptor failed': '特征提取失败，请重试',
    'enrollment cancelled': '录入已取消',
    'save failed': '本地加密保存失败',
  }
  if (!reason)
    return '未知错误'
  return map[reason] ?? reason
}

function formatTiming(ms: number | null) {
  if (ms === null || !Number.isFinite(ms))
    return '无'
  return `${ms.toFixed(1)} ms`
}

const pageRootClasses = [
  'mx-auto max-w-5xl p-4 text-neutral-800 dark:text-neutral-100',
]
const pageShellClasses = [
  'rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-xl',
  'dark:border-neutral-800 dark:bg-neutral-950',
]
const sectionCardClasses = [
  'rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm',
  'dark:border-neutral-700 dark:bg-neutral-900',
]
const sectionTitleClasses = [
  'mb-2 text-sm font-700',
]
const fieldInputClasses = [
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
  'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
]
</script>

<template>
  <div :class="pageRootClasses">
    <section :class="pageShellClasses">
      <div :class="['mb-4 flex items-center justify-between gap-2']">
        <div>
          <div :class="['text-2xl font-700']">
            人脸录入与门控
          </div>
          <div :class="['text-sm text-neutral-500 dark:text-neutral-400']">
            用于让 Rin 在视觉交互中识别你本人，避免他人误触发互动。
          </div>
        </div>
        <Button size="sm" variant="ghost" @click="backToStage">
          返回主界面
        </Button>
      </div>

      <section :class="[sectionCardClasses, 'mb-3']">
        <div :class="['text-xs leading-6 text-neutral-600 dark:text-neutral-300']">
          <div>人脸特征仅加密保存在本机，不会上传。</div>
          <div>口令只用于解锁本地档案，不会被持久化保存。</div>
          <div>你可以随时锁定或删除本地档案。</div>
        </div>
      </section>

      <section :class="[sectionCardClasses, 'mb-3']">
        <div :class="sectionTitleClasses">
          当前状态
        </div>
        <div :class="['grid gap-2 text-xs md:grid-cols-2']">
          <div>摄像头：{{ cameraStateText }}</div>
          <div>模型：{{ modelStatusText }}</div>
          <div>人脸档案：{{ profileStatusText }}</div>
          <div>人脸门控：{{ gateStateText }}</div>
        </div>
        <div v-if="errorMessage" :class="['mt-2 text-xs text-rose-600 dark:text-rose-300']">
          {{ errorMessage }}
        </div>
      </section>

      <section :class="[sectionCardClasses, 'mb-3']">
        <div :class="sectionTitleClasses">
          四步录入向导
        </div>

        <div :class="['grid gap-3']">
          <section :class="['rounded-xl border border-neutral-200 p-3 dark:border-neutral-700']">
            <div :class="['mb-1 text-sm font-600']">
              步骤 1 / 4：开启摄像头
            </div>
            <div :class="['mb-2 text-xs text-neutral-500 dark:text-neutral-400']">
              请确保光线充足，画面中只有你一人。
            </div>
            <div :class="['mb-2 flex items-center gap-2']">
              <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
                {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
              </Button>
            </div>
            <div :class="['grid gap-1 text-xs md:grid-cols-3']">
              <div>摄像头：{{ cameraStateText }}</div>
              <div>模型：{{ modelStatusText }}</div>
              <div>画面质量：{{ qualityStatusText }}</div>
            </div>
          </section>

          <section :class="['rounded-xl border border-neutral-200 p-3 dark:border-neutral-700']">
            <div :class="['mb-1 text-sm font-600']">
              步骤 2 / 4：设置本地档案
            </div>
            <div :class="['mb-2 text-xs text-neutral-500 dark:text-neutral-400']">
              口令只用于解锁本机加密档案，Rin 不会保存你的口令。
            </div>
            <div :class="['grid gap-2 md:grid-cols-2']">
              <label :class="['flex flex-col gap-1 text-xs']">
                <span>显示昵称</span>
                <input
                  v-model="displayNameInput"
                  :class="fieldInputClasses"
                >
              </label>
              <label :class="['flex flex-col gap-1 text-xs']">
                <span>加密口令 / PIN</span>
                <input
                  v-model="passphrase"
                  type="password"
                  :class="fieldInputClasses"
                >
              </label>
              <label :class="['flex flex-col gap-1 text-xs']">
                <span>确认口令</span>
                <input
                  v-model="confirmPassphrase"
                  type="password"
                  :class="fieldInputClasses"
                >
              </label>
            </div>
          </section>

          <section :class="['rounded-xl border border-neutral-200 p-3 dark:border-neutral-700']">
            <div :class="['mb-1 text-sm font-600']">
              步骤 3 / 4：采集人脸样本
            </div>
            <div :class="['mb-2 grid gap-1 text-xs md:grid-cols-2']">
              <div>采样进度：{{ sampleProgressText }}</div>
              <div>已通过：{{ acceptedSamples }}</div>
              <div>需重试：{{ rejectedSamples }}</div>
              <div>画面质量：{{ qualityStatusText }}</div>
              <div :class="['md:col-span-2']">
                人脸状态：{{ faceDetectionText }}
              </div>
            </div>
            <div :class="['mb-2 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700']">
              <div
                data-testid="enrollment-progress-bar"
                :style="{ width: `${Math.round(sampleProgressRatio * 100)}%` }"
                :class="['h-full rounded-full bg-sky-500 transition-all duration-300']"
              />
            </div>
            <div :class="['mb-2 flex flex-wrap items-center gap-2']">
              <Button size="sm" variant="primary" :disabled="enrolling || !isEnabled" @click="runEnrollment">
                {{ enrolling ? '采样中...' : (hasEncryptedProfile && !showReEnrollmentFlow ? '继续采样' : '开始采样') }}
              </Button>
              <Button size="sm" variant="secondary" :disabled="enrolling" @click="startReEnrollment">
                重新采样
              </Button>
            </div>
            <div v-if="enrollmentMessage" :class="['text-xs', enrollmentErrorReason ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300']">
              {{ enrollmentMessage }}
            </div>
            <div v-else-if="rejectedSamples > 0" :class="['text-xs text-amber-600 dark:text-amber-300']">
              样本质量不足，请调整光线或姿态后重试。
            </div>
          </section>

          <section :class="['rounded-xl border border-neutral-200 p-3 dark:border-neutral-700']">
            <div :class="['mb-1 text-sm font-600']">
              步骤 4 / 4：完成并启用
            </div>
            <div :class="['mb-2 grid gap-1 text-xs md:grid-cols-2']">
              <div>档案状态：{{ profileStatusText }}</div>
              <div>门控状态：{{ gateStateText }}</div>
              <div>样本数量：{{ localFaceGate.profileSampleCount }}</div>
              <div>昵称：{{ unlockedProfile?.displayName || displayNameInput || '未设置' }}</div>
            </div>
            <div :class="['flex flex-wrap items-center gap-2']">
              <Button size="sm" variant="secondary" @click="setFaceGateEnabled(!gateEnabled)">
                {{ gateEnabled ? '关闭人脸门控' : '启用人脸门控' }}
              </Button>
              <Button size="sm" variant="ghost" @click="backToStage">
                返回主界面
              </Button>
            </div>
          </section>
        </div>
      </section>

      <section v-if="hasEncryptedProfile" :class="[sectionCardClasses, 'mb-3']">
        <div :class="sectionTitleClasses">
          人脸门控已配置
        </div>
        <div :class="['grid gap-1 text-xs md:grid-cols-2']">
          <div>昵称：{{ unlockedProfile?.displayName || displayNameInput || '未设置' }}</div>
          <div>样本数量：{{ localFaceGate.profileSampleCount }}</div>
          <div>档案状态：{{ profileStatusText }}</div>
          <div>门控状态：{{ gateStateText }}</div>
          <div>创建时间：{{ unlockedProfile?.createdAt || '已加密保存（锁定中）' }}</div>
          <div>更新时间：{{ unlockedProfile?.updatedAt || '已加密保存（锁定中）' }}</div>
        </div>
        <div :class="['mt-2 flex flex-wrap items-center gap-2']">
          <Button size="sm" variant="secondary" @click="setFaceGateEnabled(!gateEnabled)">
            {{ gateEnabled ? '关闭人脸门控' : '启用人脸门控' }}
          </Button>
          <template v-if="profileStatus !== 'unlocked'">
            <input
              v-model="unlockPassphrase"
              type="password"
              placeholder="输入解锁口令"
              :class="fieldInputClasses"
            >
            <Button
              size="sm"
              variant="secondary"
              :disabled="unlocking || !hasEncryptedProfile"
              @click="runUnlock"
            >
              {{ unlocking ? '解锁中...' : '解锁档案' }}
            </Button>
          </template>
          <Button v-else size="sm" variant="secondary" @click="runLock">
            锁定档案
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
      </section>

      <details data-testid="advanced-enrollment-details" :class="[sectionCardClasses, 'mb-3']" @toggle="handleAdvancedEnrollmentToggle">
        <summary :class="['cursor-pointer select-none text-sm font-700']">
          高级录入参数
        </summary>
        <div v-if="advancedEnrollmentOpen" :class="['mt-2 text-xs text-neutral-500 dark:text-neutral-400']">
          一般无需调整。识别不稳定时再修改这些参数。
        </div>
        <div v-if="advancedEnrollmentOpen" :class="['mt-2 grid gap-2 md:grid-cols-2']">
          <label :class="['flex flex-col gap-1 text-xs']">
            <span>匹配阈值</span>
            <input
              v-model="thresholdInput"
              inputmode="decimal"
              :class="fieldInputClasses"
            >
          </label>
          <label :class="['flex flex-col gap-1 text-xs']">
            <span>质量阈值</span>
            <input
              v-model="qualityThresholdInput"
              inputmode="decimal"
              :class="fieldInputClasses"
            >
          </label>
          <label :class="['flex flex-col gap-1 text-xs']">
            <span>目标采样数</span>
            <input
              v-model="enrollSampleCountInput"
              inputmode="numeric"
              :class="fieldInputClasses"
            >
          </label>
          <label :class="['flex flex-col gap-1 text-xs']">
            <span>稳定判定帧数</span>
            <input
              v-model="stableFramesInput"
              inputmode="numeric"
              :class="fieldInputClasses"
            >
          </label>
        </div>
      </details>

      <details data-testid="diagnostics-details" :class="[sectionCardClasses, 'mb-3']" @toggle="handleDiagnosticsToggle">
        <summary :class="['cursor-pointer select-none text-sm font-700']">
          诊断详情
        </summary>
        <div v-if="diagnosticsOpen" :class="['mt-2 grid gap-2 text-xs md:grid-cols-2']">
          <div>视觉运行状态（runtimeStatus）：{{ runtimeStatusText }}</div>
          <div>预热耗时（runtimeWarmup）：{{ runtimeWarmupDurationText }}</div>
          <div>重试次数（retryCount）：{{ runtimeRetryCount }}</div>
          <div>最近错误（lastError）：{{ runtimeLastError || '无' }}</div>
          <div>摄像头状态（cameraState）：{{ formatVisionStatusValue(cameraState, 'zh-CN') }}</div>
          <div>摄像头权限（cameraPermission）：{{ cameraPermissionStateText }}</div>
          <div>MediaPipe：{{ mediaPipeStatusText }}</div>
          <div>OpenCV：{{ openCvStatusText }}</div>
          <div>faceProfile：{{ profileStatus }}</div>
          <div>faceGate：{{ localFaceGate.gateState }} / {{ localFaceGate.profileStatus }}</div>
          <div>质量分：{{ latestQuality?.qualityScore?.toFixed(2) ?? '无' }}</div>
          <div>亮度：{{ latestQuality?.brightness?.toFixed(1) ?? '无' }}</div>
          <div>清晰度：{{ latestQuality?.sharpness?.toFixed(1) ?? '无' }}</div>
          <div>对比度：{{ latestQuality?.contrast?.toFixed(1) ?? '无' }}</div>
          <div>人脸尺寸：{{ latestQuality?.faceSize?.toFixed(2) ?? '无' }}</div>
          <div :class="['md:col-span-2']">
            最近错误汇总：{{ visionLastError }}
          </div>
          <div :class="['md:col-span-2 text-xs font-600']">
            摄像头诊断日志
          </div>
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
          <div v-if="openCvErrorMessage" :class="['md:col-span-2 text-amber-600 dark:text-amber-300']">
            OpenCV 异常：{{ openCvErrorMessage }}
          </div>
        </div>
        <div v-if="diagnosticsOpen" :class="['mt-3 flex flex-wrap items-center gap-2']">
          <Button size="sm" variant="ghost" :disabled="runtimeWorking" @click="handleRetryRuntime">
            {{ runtimeWorking ? '处理中...' : '重试视觉运行环境' }}
          </Button>
          <Button size="sm" variant="ghost" :disabled="runtimeWorking" @click="handleResetRuntime">
            重置视觉运行环境
          </Button>
        </div>
      </details>

      <section :class="[sectionCardClasses, 'mb-3 border-rose-200/70 dark:border-rose-700/60']">
        <div :class="sectionTitleClasses">
          危险操作
        </div>
        <div :class="['mb-2 text-xs text-neutral-600 dark:text-neutral-300']">
          删除后 Rin 将无法通过人脸门控识别你，需要重新录入。
        </div>
        <div :class="['flex flex-wrap items-center gap-2']">
          <Button size="sm" variant="secondary" :disabled="!hasEncryptedProfile" @click="runLock">
            锁定档案
          </Button>
          <Button size="sm" variant="secondary" @click="startReEnrollment">
            重新录入
          </Button>
          <Button size="sm" variant="ghost" :disabled="!hasEncryptedProfile" @click="runDelete">
            删除档案
          </Button>
        </div>
      </section>

      <section :class="[sectionCardClasses, 'text-xs text-neutral-600 dark:text-neutral-300']">
        人脸档案仅在本机加密保存，用于本地视觉门控识别；你可以随时锁定或删除本地档案。
      </section>
    </section>

    <video
      ref="videoRef"
      muted
      playsinline
      :class="['h-0 w-0 op-0 pointer-events-none']"
    />
  </div>
</template>
