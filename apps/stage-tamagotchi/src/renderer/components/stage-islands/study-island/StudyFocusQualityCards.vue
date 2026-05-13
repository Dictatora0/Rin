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

const hasQualityData = computed(() => {
  return qualityStats.value.totalFocusMinutes > 0
    || qualityStats.value.totalFocusSessions > 0
    || props.todayInterruptCount > 0
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

    <div
      v-if="!hasQualityData"
      data-testid="study-focus-quality-empty"
      class="study-chart-empty"
    >
      还没有足够的专注数据
    </div>

    <div
      v-else
      :class="['study-chart-body grid grid-cols-1 gap-2 sm:grid-cols-2']"
    >
      <article
        v-for="row in summaryRows"
        :key="row.label"
        :class="[
          'study-focus-quality-item study-chart-metric-card',
        ]"
      >
        <div class="study-chart-metric-label">
          <span>{{ row.icon }}</span>
          {{ row.label }}
        </div>
        <div class="study-chart-metric-value">
          {{ row.value }}
        </div>
        <p class="study-chart-metric-hint">
          {{ row.hint }}
        </p>
      </article>
    </div>
  </section>
</template>
