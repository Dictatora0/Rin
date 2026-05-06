<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useVisionInteraction } from '../../../composables/use-vision-interaction'

const collapsed = ref(true)
const videoRef = ref<HTMLVideoElement | null>(null)
const unlockPassphrase = ref('')
const unlocking = ref(false)

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
  localFaceGate,
  canTriggerInteractiveFeedback,
  maxInferenceStallMs,
  lastInferenceAt,
  attachVideoElement,
  start,
  stop,
  setFaceGateEnabled,
  setMaxInferenceStallMs,
  unlockFaceProfile,
} = useVisionInteraction({
  stableFrames: 3,
  eventCooldownMs: 2_000,
  loopIntervalMs: 120,
})

const maxInferenceStallInput = ref(String(maxInferenceStallMs.value))
const quietRemainingSeconds = computed(() => Math.ceil(quietRemainingMs.value / 1000))

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
    const result = await unlockFaceProfile(unlockPassphrase.value)
    if (result.ok)
      unlockPassphrase.value = ''
  }
  finally {
    unlocking.value = false
  }
}
</script>

<template>
  <div fixed left-3 top-14 z-20>
    <div
      :class="[
        'w-80 rounded-2xl border border-neutral-200/70 bg-white/88 p-3 shadow-xl backdrop-blur-md',
        'dark:border-neutral-700/70 dark:bg-neutral-900/80',
      ]"
    >
      <div :class="['mb-2 flex items-center justify-between gap-2']">
        <div :class="['text-sm font-700 text-neutral-800 dark:text-neutral-100']">
          视觉实验
        </div>
        <Button size="sm" variant="ghost" @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '收起' }}
        </Button>
      </div>

      <div v-if="!collapsed" :class="['flex flex-col gap-2']">
        <div :class="['flex items-center gap-2']">
          <Button size="sm" :variant="isEnabled ? 'secondary' : 'primary'" @click="toggleCamera">
            {{ isEnabled ? '关闭摄像头' : '开启摄像头' }}
          </Button>
          <Button size="sm" variant="ghost" @click="openEnrollmentPage">
            打开人脸录入页
          </Button>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div :class="['mb-1 font-600 text-neutral-700 dark:text-neutral-200']">
            手势映射
          </div>
          <div>张开手掌：让 Rin 暂时安静</div>
          <div>胜利手势：庆祝一个完成时刻</div>
          <div>竖拇指：确认当前提示</div>
        </div>

        <div :class="['rounded-xl bg-neutral-100/80 p-2 text-xs dark:bg-neutral-800/60']">
          <div>摄像头：{{ cameraStateText }}</div>
          <div>人脸在位：{{ facePresenceText }}</div>
          <div>人脸方向：{{ faceDirectionText }}</div>
          <div>人脸中心：{{ faceCenterText }}</div>
          <div>最近手势：{{ gestureText }}</div>
          <div>最近推理：{{ lastInferenceText }}</div>
          <div>安静模式：{{ isVisionQuiet ? `进行中（${quietRemainingSeconds}秒）` : '未开启' }}</div>
          <div>本地庆祝计数：{{ localCelebrationCount }}</div>
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
