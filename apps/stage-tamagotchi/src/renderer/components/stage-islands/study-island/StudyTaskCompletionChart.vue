<script setup lang="ts">
import type { StudyTask } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildTaskCompletionStats } from '../../../utils/study-chart-data'

import './study-chart-theme.css'

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
      var(--study-chart-success) 0 ${completedPercent}%,
      var(--study-chart-primary) ${completedPercent}% ${pendingPercent}%,
      var(--study-chart-danger) ${pendingPercent}% 100%
    )`,
  }
})
</script>

<template>
  <section
    data-testid="study-task-completion-chart"
    :class="[
      'study-chart-card',
      'px-3 py-3',
    ]"
  >
    <div class="study-chart-header">
      <div>
        <h3 class="study-chart-title">
          任务完成结构
        </h3>
        <p class="study-chart-subtitle">
          用完成率和逾期分布观察任务推进情况
        </p>
      </div>
    </div>

    <div
      v-if="!hasTaskData"
      data-testid="study-task-completion-empty"
      class="study-chart-empty"
    >
      还没有任务数据
    </div>

    <div
      v-else
      :class="['study-chart-body grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]']"
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
          <span class="study-chart-muted">已完成</span>
          <span :class="['font-medium text-emerald-600 dark:text-emerald-300']">{{ completionStats.completedTasks }}</span>
        </div>
        <div :class="['flex items-center justify-between text-xs']">
          <span class="study-chart-muted">未完成</span>
          <span :class="['font-medium text-sky-600 dark:text-sky-300']">{{ completionStats.pendingTasks }}</span>
        </div>
        <div :class="['flex items-center justify-between text-xs']">
          <span class="study-chart-muted">已逾期</span>
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

      <div class="study-chart-legend sm:col-span-2">
        <span :class="['inline-flex items-center gap-1']">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: 'var(--study-chart-success)' }" />
          已完成
        </span>
        <span :class="['inline-flex items-center gap-1']">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: 'var(--study-chart-primary)' }" />
          未完成
        </span>
        <span :class="['inline-flex items-center gap-1']">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: 'var(--study-chart-danger)' }" />
          已逾期
        </span>
      </div>
    </div>
  </section>
</template>
