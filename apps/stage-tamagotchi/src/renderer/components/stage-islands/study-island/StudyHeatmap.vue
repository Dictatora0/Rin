<script setup lang="ts">
import type { StudyDailyHistoryEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

const props = defineProps<{
  entries: StudyDailyHistoryEntry[]
}>()

const maxFocusMinutes = computed(() => {
  const focusMinutesList = props.entries.map(entry => entry.focusMinutes)
  return Math.max(0, ...focusMinutesList)
})

const hasHistoryData = computed(() => {
  return props.entries.some(entry => entry.focusMinutes > 0 || entry.focusSessions > 0)
})

function resolveHeatLevel(focusMinutes: number, maxMinutes: number) {
  if (focusMinutes <= 0 || maxMinutes <= 0)
    return 0
  const ratio = focusMinutes / maxMinutes
  if (ratio >= 0.75)
    return 4
  if (ratio >= 0.5)
    return 3
  if (ratio >= 0.25)
    return 2
  return 1
}

const heatmapCells = computed(() => {
  const maxMinutes = maxFocusMinutes.value
  return props.entries.map((entry) => {
    return {
      dayKey: entry.dayKey,
      dayLabel: entry.dayKey.slice(5),
      focusMinutes: entry.focusMinutes,
      focusSessions: entry.focusSessions,
      heatLevel: resolveHeatLevel(entry.focusMinutes, maxMinutes),
    }
  })
})

function resolveHeatClass(heatLevel: number) {
  if (heatLevel === 4)
    return 'bg-primary-500 dark:bg-primary-400'
  if (heatLevel === 3)
    return 'bg-primary-400/90 dark:bg-primary-500/80'
  if (heatLevel === 2)
    return 'bg-primary-300/85 dark:bg-primary-500/60'
  if (heatLevel === 1)
    return 'bg-primary-200/80 dark:bg-primary-500/35'
  return 'bg-neutral-200 dark:bg-neutral-700/80'
}
</script>

<template>
  <section
    :class="[
      'rounded-lg border border-neutral-200/80 bg-white px-2.5 py-2',
      'dark:border-neutral-700/70 dark:bg-neutral-800/70',
    ]"
  >
    <div :class="['flex items-center justify-between gap-2']">
      <div :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
        学习热力图
      </div>
      <div :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
        最近 {{ entries.length }} 天
      </div>
    </div>

    <div
      v-if="!hasHistoryData"
      data-testid="study-heatmap-empty"
      :class="['mt-2 rounded-md border border-dashed border-neutral-300/70 px-2 py-2 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      暂无历史数据
    </div>

    <div
      v-else
      data-testid="study-history-heatmap"
      :class="['mt-2 grid grid-cols-7 gap-1.5']"
    >
      <div
        v-for="cell in heatmapCells"
        :key="cell.dayKey"
        :title="`${cell.dayKey}：${cell.focusMinutes} 分钟（${cell.focusSessions} 轮）`"
        :class="[
          'h-4 rounded-sm transition-colors',
          resolveHeatClass(cell.heatLevel),
        ]"
      />
    </div>

    <div :class="['mt-2 text-[11px] text-neutral-500 dark:text-neutral-400']">
      颜色越深，专注量越高
    </div>
  </section>
</template>
