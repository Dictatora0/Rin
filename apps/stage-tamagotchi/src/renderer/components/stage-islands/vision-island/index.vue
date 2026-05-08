<script setup lang="ts">
import type { VisionInteractionEvent } from '../../../composables/use-vision-interaction'

import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'
import { useVisionPetFeedback } from '../../../composables/use-vision-pet-feedback'

const props = withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false,
})

const collapsed = ref(!props.embedded)
const videoRef = ref<HTMLVideoElement | null>(null)
const unlockPassphrase = ref('')
const unlocking = ref(false)
const rememberOnDevice = ref(false)
const isDev = import.meta.env.DEV

const router = useRouter()

const {
  isEnabled,
  cameraState,
  facePresence,
  faceCenter,
  faceDirection,
  lastGesture,
  lastEvent,
  errorMessage,
  quietRemainingMs,
  isVisionQuiet,
  localCelebrationCount,
  activePrompt,
  matchedDisplayName,
  gateEnabled,
  hasEncryptedProfile,
  isProfileUnlocked,
  profileStatus,
  rememberFaceProfileOnDevice,
  secureStoreAvailable,
  localFaceGate,
  canTriggerInteractiveFeedback,
  maxInferenceStallMs,
  lastInferenceAt,
  modelWarmupStatus,
  modelSource,
  modelProfile,
  startTiming,
  attachVideoElement,
  start,
  stop,
  prewarmVisionModels,
  setFaceGateEnabled,
  setMaxInferenceStallMs,
  setRememberFaceProfileOnDevice,
  unlockFaceProfile,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})
const {
  triggerVisionPetFeedback,
  petFeedbackState,
  lastPetFeedback,
  isQuietVisualMode,
  quietRemainingMs: petQuietRemainingMs,
  celebrationCount: petCelebrationCount,
  cancelQuietVisualMode,
  clearPetFeedback,
} = useVisionPetFeedback()

const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
const prewarming = ref(false)
const quietRemainingSeconds = computed(() => Math.ceil(quietRemainingMs.value / 1000))
const petQuietRemainingSeconds = computed(() => Math.ceil(petQuietRemainingMs.value / 1000))

const faceCenterText = computed(() => {
  if (!faceCenter.value)
    return '未知'
  return `x=${faceCenter.value.x.toFixed(2)}, y=${faceCenter.value.y.toFixed(2)}`
})

const lastInferenceText = computed(() => {
  if (!lastInferenceAt.value)
    return '无'
  return new Date(lastInferenceAt.value).toLocaleTimeString()
})

const profileHint = computed(() => {
  if (!hasEncryptedProfile.value)
    return '无'
  if (isProfileUnlocked.value)
    return '已解锁'
  return '已加密（锁定）'
})

const cameraStateText = computed(() => {
  const map: Record<string, string> = {
    off: '关闭',
    loading: '加载中',
    active: '运行中',
    error: '错误',
  }
  return map[cameraState.value] ?? cameraState.value
})

const facePresenceText = computed(() => {
  const map: Record<string, string> = {
    present: '在位',
    absent: '离开',
    unknown: '未知',
  }
  return map[facePresence.value] ?? facePresence.value
})

const faceDirectionText = computed(() => {
  const map: Record<string, string> = {
    left: '左',
    right: '右',
    up: '上',
    down: '下',
    center: '中',
    unknown: '未知',
  }
  return map[faceDirection.value] ?? faceDirection.value
})

const gestureText = computed(() => {
  const map: Record<string, string> = {
    none: '无',
    open_palm: '张开手掌',
    victory: '胜利手势',
    thumbs_up: '竖拇指',
    unknown: '未知',
  }
  return map[lastGesture.value] ?? lastGesture.value
})

const profileStatusText = computed(() => {
  const map: Record<string, string> = {
    none: '未录入',
    encrypted: '已加密（锁定）',
    unlocked: '已解锁',
  }
  return map[profileStatus.value] ?? profileStatus.value
})

const gateStateText = computed(() => {
  const map: Record<string, string> = {
    disabled: '未启用',
    enabled: '已启用',
    gated: '门控中',
    locked: '锁定',
  }
  return map[localFaceGate.gateState.value] ?? localFaceGate.gateState.value
})

const modelWarmupStatusText = computed(() => {
  const map: Record<string, string> = {
    idle: '未预热',
    warming: '预热中',
    ready: '已就绪',
    fallback_remote: '回退远程',
  }
  return map[modelWarmupStatus.value] ?? modelWarmupStatus.value
})

const modelSourceText = computed(() => {
  const map: Record<string, string> = {
    local: '本地',
    remote: '远程',
    unknown: '未知',
  }
  return map[modelSource.value] ?? modelSource.value
})

const permissionTimingText = computed(() => formatTiming(startTiming.value.permissionMs))
const videoPlayTimingText = computed(() => formatTiming(startTiming.value.videoPlayMs))
const recognizerInitTimingText = computed(() => formatTiming(startTiming.value.recognizerInitMs))
const totalTimingText = computed(() => formatTiming(startTiming.value.totalMs))
const readyForPreviewTimingText = computed(() => formatTiming(startTiming.value.readyForPreviewMs))
const petFeedbackStateText = computed(() => {
  const map: Record<string, string> = {
    idle: 'idle',
    quiet: 'quiet',
    celebrating: 'celebrating',
    acknowledged: 'acknowledged',
    gated: 'gated',
  }
  return map[petFeedbackState.value] ?? petFeedbackState.value
})
const lastPetFeedbackSummary = computed(() => {
  if (!lastPetFeedback.value)
    return '无'
  return `${lastPetFeedback.value.summary} (${new Date(lastPetFeedback.value.at).toLocaleTimeString()})`
})
const shouldShowPetFeedbackGatedHint = computed(() => {
  if (petFeedbackState.value === 'gated')
    return true
  return lastEvent.value?.type === 'detected_but_gated'
})
const rootClasses = computed(() => {
  if (props.embedded) {
    return [
      'relative w-full',
      'max-h-[68vh] overflow-y-auto',
    ]
  }

  return ['fixed left-3 top-14 z-20']
})

watch(videoRef, element => attachVideoElement(element), { immediate: true })

watch(maxInferenceStallMs, (value) => {
  const text = String(value)
  if (text !== maxInferenceStallInput.value)
    maxInferenceStallInput.value = text
})

watch(maxInferenceStallInput, (value) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed))
    return
  setMaxInferenceStallMs(parsed)
})

watch(lastEvent, (event) => {
  if (!event)
    return
  if (event.toastMessage)
    toast.message(event.toastMessage)
  applyPetFeedbackForEvent(event)
})

watch(isEnabled, (enabled) => {
  if (!enabled)
    clearPetFeedback()
})

function toggleCamera() {
  if (isEnabled.value) {
    void stop()
    return
  }
  void start()
}

function toggleGate() {
  setFaceGateEnabled(!gateEnabled.value)
}

function openEnrollmentPage() {
  void router.push('/vision-enrollment')
}

async function unlockProfile() {
  if (!unlockPassphrase.value.trim())
    return
  unlocking.value = true
  try {
    const result = await unlockFaceProfile(unlockPassphrase.value, {
      rememberOnDevice: rememberOnDevice.value,
    })
    if (result.ok)
      unlockPassphrase.value = ''
  }
  finally {
    unlocking.value = false
  }
}

watch(rememberFaceProfileOnDevice, (value) => {
  rememberOnDevice.value = value
}, { immediate: true })

async function toggleRememberOnDevice(event: Event) {
  const nextValue = (event.target as HTMLInputElement).checked
  const accepted = await setRememberFaceProfileOnDevice(nextValue)
  rememberOnDevice.value = accepted && nextValue
}

async function handlePrewarmVision() {
  if (prewarming.value)
    return
  prewarming.value = true
  try {
    await prewarmVisionModels()
    toast.success('视觉模型预热完成。')
  }
  catch {
    toast.error('视觉模型预热失败，请检查本地资源或网络回退。')
  }
  finally {
    prewarming.value = false
  }
}

function formatTiming(ms: number | null) {
  if (ms === null || !Number.isFinite(ms))
    return '无'
  return `${ms.toFixed(1)} ms`
}

function createPetFeedbackOptions(event: VisionInteractionEvent) {
  return {
    allowVisualFeedback: canTriggerInteractiveFeedback.value,
    gateEnabled: gateEnabled.value,
    gateState: localFaceGate.gateState.value,
    sourceEventId: event.id,
    summary: event.message,
  }
}

function directionFromEventType(eventType: VisionInteractionEvent['type']) {
  if (eventType === 'user_moved_left')
    return 'left'
  if (eventType === 'user_moved_right')
    return 'right'
  if (eventType === 'user_moved_up')
    return 'up'
  if (eventType === 'user_moved_down')
    return 'down'
  return 'center'
}

function applyPetFeedbackForEvent(event: VisionInteractionEvent) {
  if (event.type === 'quiet_mode_requested') {
    triggerVisionPetFeedback('open_palm', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'completion_celebration') {
    triggerVisionPetFeedback('victory', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'acknowledged') {
    triggerVisionPetFeedback('thumbs_up', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'subject_matched' || event.type === 'welcome_back') {
    triggerVisionPetFeedback('face_return', createPetFeedbackOptions(event))
    return
  }

  if (event.type === 'user_moved_left' || event.type === 'user_moved_right' || event.type === 'user_moved_up' || event.type === 'user_moved_down') {
    triggerVisionPetFeedback('face_direction_change', {
      ...createPetFeedbackOptions(event),
      faceDirection: directionFromEventType(event.type),
    })
    return
  }

  if (event.type === 'detected_but_gated') {
    triggerVisionPetFeedback('gated', {
      ...createPetFeedbackOptions(event),
      allowVisualFeedback: false,
      summary: 'Gesture detected but pet feedback gated.',
    })
  }
}
</script>

<template>
  <div :class="rootClasses">
    <div
      :class="[
        props.embedded ? 'w-full' : 'w-80',
        'rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
        'dark:border-neutral-700/70 dark:bg-neutral-900/80',
      ]"
    >
      <div :class="['mb-2 flex items-center justify-between gap-2']">
        <div :class="['text-sm font-700 text-neutral-800 dark:text-neutral-100']">
          视觉交互
        </div>
        <Button v-if="!props.embedded" size="sm" variant="ghost" @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '收起' }}
        </Button>
      </div>

      <div v-if="props.embedded || !collapsed" :class="['flex flex-col gap-2']">
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
          </Button>
          <Button size="sm" variant="ghost" :disabled="prewarming" @click="handlePrewarmVision">
            {{ prewarming ? '预热中...' : '预热视觉模型' }}
          </Button>
          <Button size="sm" variant="ghost" @click="openEnrollmentPage">
            打开人脸录入页
          </Button>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            手势映射
          </div>
          <div>Open Palm: quiet Rin visually</div>
          <div>Victory: trigger Rin celebration</div>
          <div>Thumbs Up: acknowledge current prompt</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            模型状态
          </div>
          <div>预热状态：{{ modelWarmupStatusText }}</div>
          <div>当前来源：{{ modelSourceText }}</div>
          <div>模型规格：{{ modelProfile }}</div>
          <div :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
            默认仅使用构建期挂载的本地模型与 wasm。不会因为本地模式降级为弱模型。
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            启动耗时
          </div>
          <div>权限请求：{{ permissionTimingText }}</div>
          <div>video.play：{{ videoPlayTimingText }}</div>
          <div>识别器初始化：{{ recognizerInitTimingText }}</div>
          <div>可见画面就绪：{{ readyForPreviewTimingText }}</div>
          <div>总耗时：{{ totalTimingText }}</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div>摄像头：{{ cameraStateText }}</div>
          <div>人脸在位：{{ facePresenceText }}</div>
          <div>人脸方向：{{ faceDirectionText }}</div>
          <div>人脸中心：{{ faceCenterText }}</div>
          <div>最近手势：{{ gestureText }}</div>
          <div>最近推理：{{ lastInferenceText }}</div>
          <div>交互安静模式：{{ isVisionQuiet ? `进行中（${quietRemainingSeconds}秒）` : '未开启' }}</div>
          <div>本地庆祝计数：{{ localCelebrationCount }}</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            Pet feedback
          </div>
          <div>Current pet state: {{ petFeedbackStateText }}</div>
          <div>Last pet feedback: {{ lastPetFeedbackSummary }}</div>
          <div>Quiet remaining seconds: {{ isQuietVisualMode ? petQuietRemainingSeconds : 0 }}</div>
          <div>Celebration count: {{ petCelebrationCount }}</div>
          <div
            v-if="shouldShowPetFeedbackGatedHint"
            :class="['mt-1 text-amber-600 dark:text-amber-300']"
          >
            Gesture detected but pet feedback gated.
          </div>
          <div v-if="isQuietVisualMode" :class="['mt-2 flex items-center gap-2']">
            <Button size="sm" variant="ghost" @click="cancelQuietVisualMode">
              关闭 quiet visual mode
            </Button>
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            本地人脸门控
          </div>
          <div>档案：{{ profileHint }}</div>
          <div>门控开关：{{ gateEnabled ? '开启' : '关闭' }}</div>
          <div>门控状态：{{ gateStateText }}</div>
          <div>匹配状态：{{ profileStatusText }}</div>
          <div>距离：{{ localFaceGate.matchScore ?? '未知' }}</div>
          <div>交互结果：{{ canTriggerInteractiveFeedback ? '放行' : '拦截' }}</div>
          <div v-if="matchedDisplayName">
            当前匹配用户：{{ matchedDisplayName }}
          </div>
          <div v-if="gateEnabled && hasEncryptedProfile && !isProfileUnlocked" :class="['mt-1 text-amber-600 dark:text-amber-300']">
            人脸档案已锁定，解锁后才能启用门控交互。
          </div>
          <div :class="['mt-2 flex items-center gap-2']">
            <Button size="sm" :variant="gateEnabled ? 'secondary' : 'primary'" @click="toggleGate">
              {{ gateEnabled ? '关闭人脸门控' : '开启人脸门控' }}
            </Button>
          </div>
          <div v-if="hasEncryptedProfile && !isProfileUnlocked" :class="['mt-2 flex flex-col gap-1']">
            <input
              v-model="unlockPassphrase"
              type="password"
              placeholder="输入口令以解锁"
              :class="[
                'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
                'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
            >
            <Button size="sm" variant="primary" :disabled="unlocking" @click="unlockProfile">
              {{ unlocking ? '解锁中...' : '解锁档案' }}
            </Button>
            <label :class="['mt-1 flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300']">
              <input
                :checked="rememberOnDevice"
                type="checkbox"
                :disabled="!secureStoreAvailable"
                @change="toggleRememberOnDevice"
              >
              <span>在本机记住并自动解锁</span>
            </label>
            <div
              v-if="!secureStoreAvailable && isDev"
              :class="['text-xs text-amber-600 dark:text-amber-300']"
            >
              当前环境未启用安全存储，无法开启无感自动解锁。
            </div>
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            最近事件
          </div>
          <div v-if="lastEvent">
            {{ lastEvent.message }} ({{ new Date(lastEvent.at).toLocaleTimeString() }})
          </div>
          <div v-else>
            无
          </div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['font-600 text-neutral-700 dark:text-neutral-200']">
            当前提示
          </div>
          <div v-if="activePrompt">
            {{ activePrompt }}
          </div>
          <div v-else>
            无
          </div>
        </div>

        <label :class="['flex flex-col gap-1 rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <span :class="['font-600 text-neutral-700 dark:text-neutral-200']">推理停滞补偿（毫秒）</span>
          <input
            v-model="maxInferenceStallInput"
            inputmode="numeric"
            :class="[
              'rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-800 outline-none',
              'focus:border-sky-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
            placeholder="1200"
          >
        </label>

        <div v-if="errorMessage" :class="['rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/35 dark:text-rose-300']">
          {{ errorMessage }}
        </div>

        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          摄像头默认关闭。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          识别仅在本地运行。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          人脸门控为可选项，使用本地加密档案。
        </div>
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          不会上传任何摄像头数据。
        </div>

        <video
          ref="videoRef"
          muted
          playsinline
          :class="['h-0 w-0 op-0 pointer-events-none']"
        />
      </div>
    </div>
  </div>
</template>
