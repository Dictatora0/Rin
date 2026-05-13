<script setup lang="ts">
import type { StudyDailyHistoryEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildFocusQualityStats } from '../../../utils/study-chart-data'

const props = defineProps<{
  entries: StudyDailyHistoryEntry[]
  todayFocusMinutes: number
  todayFocusSessions: number
  todayInterruptCount: number
}>()

const qualityStats = computed(() => {
  return buildFocusQualityStats(props.entries, {
    todayFocusMinutes: props.todayFocusMinutes,
    todayFocusSessions: props.todayFocusSessions,
    todayInterruptCount: props.todayInterruptCount,
  })
})

const summaryRows = computed(() => {
  return [
    {
      label: '完成轮次',
      value: `${qualityStats.value.totalFocusSessions}`,
      hint: '专注轮次越稳定，学习节奏越清晰',
    },
    {
      label: '累计分钟',
      value: `${qualityStats.value.totalFocusMinutes}`,
      hint: '反映阶段性投入时间',
    },
    {
      label: '今日中断',
      value: `${props.todayInterruptCount}`,
      hint: '中断次数越少，连续性越好',
    },
    {
      label: '平均每轮',
      value: `${qualityStats.value.averageSessionMinutes} 分钟`,
      hint: '按累计分钟和轮次计算',
    },
  ]
})
</script>

<template>
  <section
    data-testid="study-focus-quality-cards"
    :class="[
      'study-chart-card',
      'rounded-xl border border-neutral-200/80 bg-white px-3 py-3',
      'dark:border-neutral-700/70 dark:bg-neutral-900/70',
    ]"
  >
    <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-100']">
      专注质量概览
    </h3>

    <div :class="['mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2']">
      <article
        v-for="row in summaryRows"
        :key="row.label"
        :class="[
          'rounded-lg border border-neutral-200/70 bg-neutral-50/80 px-3 py-2',
          'dark:border-neutral-700/70 dark:bg-neutral-800/70',
        ]"
      >
        <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          {{ row.label }}
        </div>
        <div :class="['mt-1 text-base font-semibold text-neutral-800 dark:text-neutral-100']">
          {{ row.value }}
        </div>
        <p :class="['mt-1 text-[11px] text-neutral-500 dark:text-neutral-400']">
          {{ row.hint }}
        </p>
      </article>
    </div>
  </section>
</template>
