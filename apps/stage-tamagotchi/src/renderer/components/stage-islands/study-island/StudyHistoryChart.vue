<script setup lang="ts">
import type { StudyDailyHistoryEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import './study-chart-theme.css'

const props = defineProps<{
  entries: StudyDailyHistoryEntry[]
}>()

const maxFocusMinutes = computed(() => {
  const focusMinutesList = props.entries.map(entry => entry.focusMinutes)
  return Math.max(0, ...focusMinutesList)
})

const hasHistoryData = computed(() => {
  return props.entries.some(entry => entry.focusMinutes > 0 || entry.focusSessions > 0 || entry.completedTasks > 0)
})

const chartRows = computed(() => {
  const maxMinutes = maxFocusMinutes.value
  return props.entries.map((entry, index) => {
    const ratio = maxMinutes > 0 ? entry.focusMinutes / maxMinutes : 0
    const heightPercent = entry.focusMinutes > 0
      ? `${Math.max(8, Math.round(ratio * 100))}%`
      : '4%'

    return {
      dayKey: entry.dayKey,
      dayLabel: entry.dayKey.slice(5),
      focusMinutes: entry.focusMinutes,
      focusSessions: entry.focusSessions,
      heightPercent,
      isToday: index === props.entries.length - 1,
    }
  })
})
</script>

<template>
  <section
    :class="[
      'study-chart-card',
      'px-2.5 py-2',
    ]"
  >
    <div class="study-chart-header">
      <div>
        <h3 class="study-chart-title">
          最近 7 天专注
        </h3>
        <p class="study-chart-subtitle">
          展示每日专注分钟和今日对比
        </p>
      </div>
    </div>

    <div
      v-if="!hasHistoryData"
      data-testid="study-history-empty"
      class="study-chart-empty"
    >
      还没有足够的历史数据
    </div>

    <div
      v-else
      data-testid="study-history-bar-chart"
      :class="['study-chart-body grid grid-cols-7 items-end gap-1.5']"
    >
      <div
        v-for="entry in chartRows"
        :key="entry.dayKey"
        :class="['flex flex-col items-center gap-1']"
      >
        <div :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">
          {{ entry.focusMinutes }}
        </div>
        <div
          data-testid="study-history-bar"
          :title="`${entry.dayKey}：${entry.focusMinutes} 分钟（${entry.focusSessions} 轮）`"
          :class="[
            'w-full rounded-sm transition-all',
            entry.isToday ? 'opacity-100 ring-1 ring-white/70 dark:ring-white/50' : 'opacity-90',
            'min-h-1',
          ]"
          :style="{
            height: entry.heightPercent,
            backgroundColor: entry.isToday ? 'var(--study-chart-accent)' : 'var(--study-chart-primary)',
          }"
        />
        <div :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">
          {{ entry.dayLabel }}
        </div>
      </div>
    </div>

    <div
      v-if="hasHistoryData"
      class="study-chart-legend"
    >
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot" :style="{ backgroundColor: 'var(--study-chart-primary)' }" />
        专注分钟
      </span>
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot" :style="{ backgroundColor: 'var(--study-chart-accent)' }" />
        今日
      </span>
    </div>
  </section>
</template>
