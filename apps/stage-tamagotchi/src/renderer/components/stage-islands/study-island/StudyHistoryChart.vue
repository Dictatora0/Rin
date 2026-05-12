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
  return props.entries.some(entry => entry.focusMinutes > 0 || entry.focusSessions > 0 || entry.completedTasks > 0)
})

const chartRows = computed(() => {
  const maxMinutes = maxFocusMinutes.value
  return props.entries.map((entry) => {
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
    }
  })
})
</script>

<template>
  <section
    :class="[
      'rounded-lg border border-neutral-200/80 bg-white px-2.5 py-2',
      'dark:border-neutral-700/70 dark:bg-neutral-800/70',
    ]"
  >
    <div :class="['text-xs font-semibold text-neutral-700 dark:text-neutral-200']">
      最近 7 天专注
    </div>

    <div
      v-if="!hasHistoryData"
      data-testid="study-history-empty"
      :class="['mt-2 rounded-md border border-dashed border-neutral-300/70 px-2 py-2 text-xs text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400']"
    >
      还没有足够的历史数据
    </div>

    <div
      v-else
      data-testid="study-history-bar-chart"
      :class="['mt-2 grid grid-cols-7 items-end gap-1.5']"
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
          :title="`${entry.dayKey}：${entry.focusMinutes} 分钟（${entry.focusSessions} 轮）`"
          :class="[
            'w-full rounded-sm bg-primary-300/85 transition-all dark:bg-primary-500/70',
            'min-h-1',
          ]"
          :style="{ height: entry.heightPercent }"
        />
        <div :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">
          {{ entry.dayLabel }}
        </div>
      </div>
    </div>
  </section>
</template>
