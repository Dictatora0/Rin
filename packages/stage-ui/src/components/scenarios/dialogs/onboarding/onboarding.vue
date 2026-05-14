<script setup lang="ts">
import type {
  OnboardingStep,
  OnboardingStepNextHandler,
  OnboardingStepPrevHandler,
} from './types'

import { computed, ref } from 'vue'

import StepDemoGuide from './step-demo-guide.vue'

interface Emits {
  (e: 'configured'): void
  (e: 'skipped'): void
  (e: 'action', action: string): void
}

const props = withDefaults(defineProps<{
  extraSteps?: OnboardingStep[]
}>(), {
  extraSteps: () => [],
})
const emit = defineEmits<Emits>()
const step = ref(0)
const direction = ref<'next' | 'previous'>('next')

const requestPreviousStep: OnboardingStepPrevHandler = () => {
  return navigatePrevious()
}

const requestNextStep: OnboardingStepNextHandler = async () => {
  await navigateNext()
}

async function handleSave() {
  emit('configured')
}

function handleAction(action: string) {
  emit('action', action)
}

const allSteps = computed<OnboardingStep[]>(() => {
  const sections = [
    {
      id: 'meet-rin',
      eyebrow: 'First run guide',
      title: '认识 Rin',
      description: 'Rin 会常驻桌面，陪你学习，也保持低打扰。先花 30 秒熟悉拖动、缩放和面板入口。',
      bullets: [
        '直接拖动 Rin 可以改变位置，开启移动模式后更容易调整摆放。',
        '在控制岛或托盘菜单里可以缩放 Rin，并切换上半身 / 全身 / 自动适配。',
        '靠近时会淡出，离开后恢复，方便在桌面长期放置。',
      ],
      actions: [
        {
          label: 'Open Study',
          kind: 'primary',
          event: 'open-study-panel',
          hint: '会在主舞台打开学习面板。',
        },
        {
          label: 'Open Settings',
          kind: 'secondary',
          event: 'open-settings-general',
          hint: '系统设置里可以找到窗口、显示和常驻选项。',
        },
      ],
    },
    {
      id: 'study-companion',
      eyebrow: 'Study companion',
      title: '学习陪伴',
      description: 'Study 面板负责任务、专注计时和统计导出，是课程展示里最容易稳定演示的一块。',
      bullets: [
        '先创建一个任务，再开始专注计时，Rin 会按当前模式陪伴你。',
        '完成至少一轮专注后，统计图表和报告导出才会有真实数据。',
        '演示模式只会缩短计时，不会自动生成历史成绩。',
      ],
      actions: [
        {
          label: 'Open Study',
          kind: 'primary',
          event: 'open-study-panel',
          hint: '创建第一个任务，开始一次专注。',
        },
        {
          label: 'Open Study Settings',
          kind: 'secondary',
          event: 'open-settings-study',
          hint: '可调整时长、提醒和导出报告。',
        },
      ],
    },
    {
      id: 'vision-interaction',
      eyebrow: 'Vision interaction',
      title: '视觉互动',
      description: 'Vision 面板负责摄像头、本地识别和人脸门控。答辩前建议至少完成一次录入，并确认摄像头权限正常。',
      bullets: [
        '先打开 Vision，再进入 Enrollment 完成人脸录入。',
        '如果 Rin 没响应，优先看“为什么 Rin 没响应”和“视觉自检”。',
        '现场光线不足或多人入镜时，Rin 会主动提示你如何恢复。',
      ],
      actions: [
        {
          label: 'Open Vision',
          kind: 'primary',
          event: 'open-vision-panel',
          hint: '会在主舞台打开视觉面板。',
        },
        {
          label: 'Open Settings',
          kind: 'secondary',
          event: 'open-settings-general',
          hint: '如果摄像头权限异常，先检查系统设置；录入入口在 Vision 面板里的“打开人脸录入页”。',
        },
      ],
      showPrivacyCard: true,
    },
    {
      id: 'controls-and-shortcuts',
      eyebrow: 'Quick access',
      title: '快捷操作',
      description: '最后记住 4 个现场最常用入口：Controls Island、快捷键指南、托盘菜单和设置页。',
      bullets: [
        'Controls Island 可以开关 Study / Vision / Shortcut Guide，并切换移动模式。',
        '托盘菜单适合答辩时快速打开学习面板、视觉面板和设置。',
        '如果要重新看这份引导，可以在后续版本里从设置页再次打开。',
      ],
      actions: [
        {
          label: 'Open Shortcut Guide',
          kind: 'primary',
          event: 'open-shortcut-guide',
          hint: '打开快捷键指南卡片。',
        },
        {
          label: 'Open Settings',
          kind: 'secondary',
          event: 'open-settings-general',
          hint: '查找 Study、Vision、系统与快捷键相关设置。',
        },
      ],
    },
  ]

  return sections.map((section, index) => ({
    id: section.id,
    component: StepDemoGuide,
    props: () => ({
      index,
      total: sections.length,
      section,
      onAction: handleAction,
      isLastStep: index === sections.length - 1,
    }),
  }))
})

const currentStep = computed(() => allSteps.value[step.value] ?? null)
const isLastStep = computed(() => step.value === allSteps.value.length - 1)
const currentStepProps = computed(() => currentStep.value?.props?.() ?? {})

async function navigateNext() {
  if (!currentStep.value)
    return

  if (isLastStep.value) {
    await handleSave()
    return
  }

  direction.value = 'next'
  step.value++
}

async function navigatePrevious() {
  if (!currentStep.value || step.value <= 0)
    return

  direction.value = 'previous'
  step.value--
}
</script>

<template>
  <div class="onboarding-step-container" min-h-0 w-full flex flex-1 flex-col overflow-hidden>
    <Transition :name="direction === 'next' ? 'slide-next' : 'slide-prev'" mode="out-in">
      <component
        :is="currentStep.component"
        v-if="currentStep"
        :key="currentStep.id"
        class="min-h-0 min-w-0 flex flex-1 flex-col overflow-hidden"
        v-bind="currentStepProps"
        :on-next="requestNextStep"
        :on-previous="requestPreviousStep"
      />
    </Transition>
  </div>
</template>

<style scoped>
.onboarding-step-container {
  overflow-x: hidden;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  will-change: transform, opacity;
}

.slide-next-enter-active {
  animation: onboarding-slide-next-in 0.2s ease-in-out both;
}

.slide-next-leave-active {
  animation: onboarding-slide-next-out 0.2s ease-in-out both;
}

.slide-prev-enter-active {
  animation: onboarding-slide-prev-in 0.2s ease-in-out both;
}

.slide-prev-leave-active {
  animation: onboarding-slide-prev-out 0.2s ease-in-out both;
}

@keyframes onboarding-slide-next-in {
  from {
    transform: translateX(2rem);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes onboarding-slide-next-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(-2rem);
    opacity: 0;
  }
}

@keyframes onboarding-slide-prev-in {
  from {
    transform: translateX(-2rem);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes onboarding-slide-prev-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(2rem);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active {
    animation-duration: 1ms;
  }
}
</style>
