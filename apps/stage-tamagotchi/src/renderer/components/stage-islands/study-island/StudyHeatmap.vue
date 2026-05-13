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
    return 'study-heat-level-4'
  if (heatLevel === 3)
    return 'study-heat-level-3'
  if (heatLevel === 2)
    return 'study-heat-level-2'
  if (heatLevel === 1)
    return 'study-heat-level-1'
  return 'study-heat-level-0'
}
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
          学习热力图
        </h3>
        <p class="study-chart-subtitle">
          颜色越深，专注投入越高
        </p>
      </div>
      <span class="study-chart-subtitle">
        最近 {{ entries.length }} 天
      </span>
    </div>

    <div
      v-if="!hasHistoryData"
      data-testid="study-heatmap-empty"
      class="study-chart-empty"
    >
      暂无历史数据
    </div>

    <div
      v-else
      data-testid="study-history-heatmap"
      :class="['study-chart-body grid grid-cols-7 gap-1.5']"
    >
      <div
        v-for="cell in heatmapCells"
        :key="cell.dayKey"
        :title="`${cell.dayKey}：${cell.focusMinutes} 分钟（${cell.focusSessions} 轮）`"
        :aria-label="`${cell.dayKey} 专注 ${cell.focusMinutes} 分钟，${cell.focusSessions} 轮`"
        :class="[
          'h-4 rounded-md transition-colors study-heat-cell',
          resolveHeatClass(cell.heatLevel),
        ]"
      />
    </div>

    <div
      v-if="hasHistoryData"
      class="study-chart-legend"
    >
      <span>少</span>
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot study-heat-level-1" />
      </span>
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot study-heat-level-2" />
      </span>
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot study-heat-level-3" />
      </span>
      <span class="study-chart-legend-item">
        <span class="study-chart-legend-dot study-heat-level-4" />
      </span>
      <span>多</span>
    </div>
  </section>
</template>

<style scoped>
.study-heat-level-0 {
  background-color: color-mix(in srgb, var(--study-chart-muted) 22%, transparent);
}

.study-heat-level-1 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 26%, white);
}

.study-heat-level-2 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 42%, white);
}

.study-heat-level-3 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 66%, transparent);
}

.study-heat-level-4 {
  background-color: var(--study-chart-primary);
}

.dark .study-heat-level-0 {
  background-color: color-mix(in srgb, var(--study-chart-muted) 38%, transparent);
}

.dark .study-heat-level-1 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 28%, transparent);
}

.dark .study-heat-level-2 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 45%, transparent);
}

.dark .study-heat-level-3 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 68%, transparent);
}

.dark .study-heat-level-4 {
  background-color: color-mix(in srgb, var(--study-chart-primary) 86%, transparent);
}
</style>
