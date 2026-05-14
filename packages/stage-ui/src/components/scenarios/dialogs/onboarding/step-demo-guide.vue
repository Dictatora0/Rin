<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { computed } from 'vue'

import LocalPrivacyCard from '../../../misc/local-privacy-card.vue'

interface StepAction {
  label: string
  kind: 'primary' | 'secondary'
  event?: string
  hint?: string
}

interface StepGuideSection {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  actions: StepAction[]
  showPrivacyCard?: boolean
}

interface Props {
  index: number
  total: number
  section: StepGuideSection
  onNext: OnboardingStepNextHandler
  onPrevious?: OnboardingStepPrevHandler
  onAction?: (eventName: string) => void
  isLastStep?: boolean
}

const props = defineProps<Props>()

const canGoBack = computed(() => typeof props.onPrevious === 'function' && props.index > 0)

function handleAction(eventName?: string) {
  if (!eventName)
    return
  props.onAction?.(eventName)
}

function handleNext() {
  props.onNext()
}
</script>

<template>
  <div :class="['min-h-0 flex flex-1 flex-col']">
    <div :class="['flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400']">
      <div>{{ props.section.eyebrow }}</div>
      <div>Step {{ props.index + 1 }} / {{ props.total }}</div>
    </div>

    <div :class="['mt-4 flex flex-1 flex-col justify-between gap-5']">
      <div :class="['space-y-4']">
        <div>
          <h2 :class="['text-2xl font-bold text-neutral-900 dark:text-neutral-50']">
            {{ props.section.title }}
          </h2>
          <p :class="['mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300']">
            {{ props.section.description }}
          </p>
        </div>

        <div :class="['space-y-2']">
          <div
            v-for="bullet in props.section.bullets"
            :key="bullet"
            :class="[
              'rounded-xl border px-3 py-2 text-sm leading-6',
              'border-neutral-200 bg-neutral-50 text-neutral-700',
              'dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-200',
            ]"
          >
            {{ bullet }}
          </div>
        </div>

        <LocalPrivacyCard
          v-if="props.section.showPrivacyCard"
          mode="detailed"
          title="Rin Vision Privacy"
        />

        <div :class="['grid gap-2 sm:grid-cols-2']">
          <button
            v-for="action in props.section.actions"
            :key="action.label"
            type="button"
            :class="[
              'rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
              action.kind === 'primary'
                ? 'bg-primary-600 text-white hover:bg-primary-500'
                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800',
            ]"
            @click="handleAction(action.event)"
          >
            <div>{{ action.label }}</div>
            <div
              v-if="action.hint"
              :class="[
                'mt-1 text-xs leading-5',
                action.kind === 'primary' ? 'text-primary-100/90' : 'text-neutral-500 dark:text-neutral-400',
              ]"
            >
              {{ action.hint }}
            </div>
          </button>
        </div>
      </div>

      <div :class="['flex flex-wrap items-center justify-between gap-3 pt-2']">
        <div>
          <Button
            v-if="canGoBack"
            size="sm"
            variant="secondary"
            @click="props.onPrevious?.()"
          >
            上一步
          </Button>
        </div>
        <div :class="['flex items-center gap-2']">
          <Button size="sm" variant="secondary" @click="handleNext">
            {{ props.isLastStep ? '完成' : '稍后再看' }}
          </Button>
          <Button size="sm" @click="handleNext">
            {{ props.isLastStep ? '完成引导' : '继续' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
