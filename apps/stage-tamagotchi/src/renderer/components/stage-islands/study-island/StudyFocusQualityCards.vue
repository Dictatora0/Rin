<script setup lang="ts">
import type { StudyDailyHistoryEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildFocusQualityStats } from '../../../utils/study-chart-data'

import './study-chart-theme.css'

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
      icon: '◎',
      hint: '专注轮次越稳定，学习节奏越清晰',
    },
    {
      label: '累计分钟',
      value: `${qualityStats.value.totalFocusMinutes}`,
      icon: '◉',
      hint: '反映阶段性投入时间',
    },
    {
      label: '今日中断',
      value: `${props.todayInterruptCount}`,
      icon: '△',
      hint: '中断次数越少，连续性越好',
    },
    {
      label: '平均每轮',
      value: `${qualityStats.value.averageSessionMinutes} 分钟`,
      icon: '◇',
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
      'px-3 py-3',
    ]"
  >
    <div class="study-chart-header">
      <div>
        <h3 class="study-chart-title">
          专注质量概览
        </h3>
        <p class="study-chart-subtitle">
          从轮次、时长和中断理解专注连续性
        </p>
      </div>
    </div>

    <div :class="['study-chart-body grid grid-cols-1 gap-2 sm:grid-cols-2']">
      <article
        v-for="row in summaryRows"
        :key="row.label"
        :class="[
          'study-focus-quality-item min-h-[96px] rounded-lg border border-neutral-200/70 bg-neutral-50/80 px-3 py-2',
          'dark:border-neutral-700/70 dark:bg-neutral-800/70',
        ]"
      >
        <div :class="['inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400']">
          <span>{{ row.icon }}</span>
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
