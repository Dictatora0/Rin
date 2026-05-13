<script setup lang="ts">
import type { StudyDailyHistoryEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildStudyTrendSeries } from '../../../utils/study-chart-data'

const props = withDefaults(defineProps<{
  entries: StudyDailyHistoryEntry[]
  days?: number
}>(), {
  days: 14,
})

const chartWidth = 560
const chartHeight = 188
const topPadding = 18
const bottomPadding = 24
const leftPadding = 12
const rightPadding = 12

const trendPoints = computed(() => buildStudyTrendSeries(props.entries, props.days))

const hasHistoryData = computed(() => {
  return trendPoints.value.some(point => point.focusMinutes > 0 || point.focusSessions > 0)
})

const maxFocusMinutes = computed(() => {
  const values = trendPoints.value.map(point => point.focusMinutes)
  return Math.max(1, ...values)
})

const chartGeometry = computed(() => {
  const drawHeight = chartHeight - topPadding - bottomPadding
  const drawWidth = chartWidth - leftPadding - rightPadding
  const pointGap = trendPoints.value.length <= 1 ? 0 : drawWidth / (trendPoints.value.length - 1)
  const baseLineY = chartHeight - bottomPadding

  const points = trendPoints.value.map((point, index) => {
    const ratio = point.focusMinutes / maxFocusMinutes.value
    return {
      ...point,
      x: leftPadding + pointGap * index,
      y: topPadding + drawHeight * (1 - ratio),
    }
  })

  const linePath = points.map(point => `${point.x},${point.y}`).join(' ')
  const areaPath = [
    `${leftPadding},${baseLineY}`,
    ...points.map(point => `${point.x},${point.y}`),
    `${leftPadding + drawWidth},${baseLineY}`,
  ].join(' ')

  return {
    drawHeight,
    drawWidth,
    baseLineY,
    points,
    linePath,
    areaPath,
  }
})

const highestPoint = computed(() => {
  const points = chartGeometry.value.points
  if (points.length === 0)
    return null
  return points.reduce((selected, point) => {
    if (!selected)
      return point
    if (point.focusMinutes > selected.focusMinutes)
      return point
    return selected
  }, points[0] ?? null)
})

const todayPoint = computed(() => chartGeometry.value.points.at(-1) ?? null)

const gridRows = computed(() => {
  const rows = 4
  return Array.from({ length: rows }, (_, index) => {
    const ratio = index / (rows - 1)
    return topPadding + chartGeometry.value.drawHeight * ratio
  })
})
</script>

<template>
  <section
    data-testid="study-trend-chart"
    :class="[
      'study-chart-card',
      'rounded-xl border border-neutral-200/80 bg-white px-3 py-3',
      'dark:border-neutral-700/70 dark:bg-neutral-900/70',
    ]"
  >
    <div :class="['flex items-center justify-between gap-2']">
      <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-100']">
        最近 14 天学习趋势
      </h3>
      <span :class="['text-xs text-neutral-500 dark:text-neutral-400']">
        单位：分钟
      </span>
    </div>

    <div
      v-if="!hasHistoryData"
      data-testid="study-trend-empty"
      :class="[
        'mt-3 rounded-lg border border-dashed border-neutral-300/70 px-3 py-4 text-xs text-neutral-500',
        'dark:border-neutral-700/70 dark:text-neutral-400',
      ]"
    >
      还没有足够的历史数据
    </div>

    <div
      v-else
      :class="['mt-3']"
    >
      <svg
        data-testid="study-trend-svg"
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        :class="['h-48 w-full']"
        role="img"
        aria-label="最近 14 天学习趋势图"
      >
        <defs>
          <linearGradient id="study-trend-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgb(59 130 246 / 0.4)" />
            <stop offset="100%" stop-color="rgb(59 130 246 / 0.05)" />
          </linearGradient>
        </defs>

        <line
          v-for="(y, index) in gridRows"
          :key="`grid-${index}`"
          x1="0"
          :y1="y"
          :x2="chartWidth"
          :y2="y"
          stroke="rgb(148 163 184 / 0.28)"
          stroke-width="1"
        />

        <polygon
          :points="chartGeometry.areaPath"
          fill="url(#study-trend-area-gradient)"
        />

        <polyline
          :points="chartGeometry.linePath"
          fill="none"
          stroke="rgb(59 130 246)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <circle
          v-for="point in chartGeometry.points"
          :key="point.dayKey"
          :cx="point.x"
          :cy="point.y"
          r="3"
          fill="rgb(37 99 235)"
        >
          <title>{{ `${point.label}：${point.focusMinutes} 分钟（${point.focusSessions} 轮）` }}</title>
        </circle>

        <g v-if="highestPoint">
          <circle
            :cx="highestPoint.x"
            :cy="highestPoint.y"
            r="5"
            fill="rgb(16 185 129)"
          />
          <title>{{ `最高点 ${highestPoint.label}：${highestPoint.focusMinutes} 分钟` }}</title>
        </g>

        <g v-if="todayPoint">
          <circle
            :cx="todayPoint.x"
            :cy="todayPoint.y"
            r="5"
            fill="rgb(14 165 233)"
          />
          <title>{{ `今日 ${todayPoint.label}：${todayPoint.focusMinutes} 分钟` }}</title>
        </g>
      </svg>

      <div :class="['mt-2 grid grid-cols-7 gap-1 text-[11px] text-neutral-500 dark:text-neutral-400']">
        <span
          v-for="point in trendPoints.slice(-7)"
          :key="`label-${point.dayKey}`"
          :class="['text-center']"
        >
          {{ point.label }}
        </span>
      </div>
    </div>
  </section>
</template>
