<script setup lang="ts">
import type { StudyTask } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildTaskCompletionStats } from '../../../utils/study-chart-data'

const props = defineProps<{
  tasks: StudyTask[]
}>()

const completionStats = computed(() => buildTaskCompletionStats(props.tasks))
const hasTaskData = computed(() => completionStats.value.totalTasks > 0)

const donutStyle = computed(() => {
  if (completionStats.value.totalTasks === 0)
    return { background: 'conic-gradient(rgb(148 163 184 / 0.35) 0 100%)' }

  const completedRatio = completionStats.value.completedTasks / completionStats.value.totalTasks
  const pendingRatio = completionStats.value.pendingTasks / completionStats.value.totalTasks

  const completedPercent = Math.round(completedRatio * 100)
  const pendingPercent = Math.round((completedRatio + pendingRatio) * 100)
  return {
    background: `conic-gradient(
      rgb(34 197 94) 0 ${completedPercent}%,
      rgb(59 130 246 / 0.85) ${completedPercent}% ${pendingPercent}%,
      rgb(248 113 113 / 0.85) ${pendingPercent}% 100%
    )`,
  }
})
</script>

<template>
  <section
    data-testid="study-task-completion-chart"
    :class="[
      'study-chart-card',
      'rounded-xl border border-neutral-200/80 bg-white px-3 py-3',
      'dark:border-neutral-700/70 dark:bg-neutral-900/70',
    ]"
  >
    <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-100']">
      任务完成结构
    </h3>

    <div
      v-if="!hasTaskData"
      data-testid="study-task-completion-empty"
      :class="[
        'mt-3 rounded-lg border border-dashed border-neutral-300/70 px-3 py-4 text-xs text-neutral-500',
        'dark:border-neutral-700/70 dark:text-neutral-400',
      ]"
    >
      还没有任务数据
    </div>

    <div
      v-else
      :class="['mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]']"
    >
      <div :class="['flex items-center justify-center']">
        <div
          data-testid="study-task-completion-donut"
          :class="['relative h-28 w-28 rounded-full']"
          :style="donutStyle"
        >
          <div
            :class="[
              'absolute inset-3 rounded-full bg-white dark:bg-neutral-900',
              'flex flex-col items-center justify-center',
            ]"
          >
            <span :class="['text-xl font-semibold text-neutral-800 dark:text-neutral-100']">
              {{ completionStats.completionRate }}%
            </span>
            <span :class="['text-[11px] text-neutral-500 dark:text-neutral-400']">
              完成率
            </span>
          </div>
        </div>
      </div>

      <div :class="['grid grid-cols-1 gap-2']">
        <div :class="['flex items-center justify-between text-xs']">
          <span :class="['text-neutral-600 dark:text-neutral-300']">已完成</span>
          <span :class="['font-medium text-emerald-600 dark:text-emerald-300']">{{ completionStats.completedTasks }}</span>
        </div>
        <div :class="['flex items-center justify-between text-xs']">
          <span :class="['text-neutral-600 dark:text-neutral-300']">未完成</span>
          <span :class="['font-medium text-sky-600 dark:text-sky-300']">{{ completionStats.pendingTasks }}</span>
        </div>
        <div :class="['flex items-center justify-between text-xs']">
          <span :class="['text-neutral-600 dark:text-neutral-300']">已逾期</span>
          <span :class="['font-medium text-rose-600 dark:text-rose-300']">{{ completionStats.overdueTasks }}</span>
        </div>
        <div
          v-if="completionStats.highPriorityPendingTasks > 0"
          :class="[
            'rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px]',
            'text-amber-700 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-200',
          ]"
        >
          高优先级未完成：{{ completionStats.highPriorityPendingTasks }} 项
        </div>
      </div>
    </div>
  </section>
</template>
