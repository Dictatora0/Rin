<script setup lang="ts">
import type { StudyTask } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildTaskPriorityStats } from '../../../utils/study-chart-data'

import './study-chart-theme.css'

const props = defineProps<{
  tasks: StudyTask[]
}>()

const priorityStats = computed(() => buildTaskPriorityStats(props.tasks))
const maxRowCount = computed(() => Math.max(1, ...priorityStats.value.rows.map(row => row.total)))
const highPriorityPending = computed(() => priorityStats.value.rows.find(row => row.priority === 'high')?.pending ?? 0)

function resolvePriorityColor(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high')
    return 'var(--study-chart-accent)'
  if (priority === 'medium')
    return 'var(--study-chart-warning)'
  return 'var(--study-chart-primary)'
}
</script>

<template>
  <section
    data-testid="study-task-priority-chart"
    :class="[
      'study-chart-card',
      'px-3 py-3',
    ]"
  >
    <div class="study-chart-header">
      <div>
        <h3 class="study-chart-title">
          任务优先级分布
        </h3>
        <p class="study-chart-subtitle">
          观察高/中/低优先级任务的完成进度
        </p>
      </div>
    </div>

    <div
      v-if="priorityStats.totalTasks === 0"
      data-testid="study-task-priority-empty"
      class="study-chart-empty"
    >
      还没有任务数据
    </div>

    <div
      v-else
      :class="['study-chart-body grid grid-cols-1 gap-2']"
    >
      <article
        v-for="row in priorityStats.rows"
        :key="row.priority"
      >
        <div :class="['mb-1 flex items-center justify-between text-xs']">
          <span class="study-chart-muted">{{ row.label }}</span>
          <span :class="['text-neutral-500 dark:text-neutral-400']">{{ row.total }} 项</span>
        </div>
        <div :class="['h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700']">
          <div
            data-testid="study-task-priority-bar"
            :class="['h-full rounded-full']"
            :style="{
              width: `${Math.max(8, Math.round((row.total / maxRowCount) * 100))}%`,
              backgroundColor: resolvePriorityColor(row.priority),
            }"
          />
        </div>
        <div :class="['mt-1 text-[11px] text-neutral-500 dark:text-neutral-400']">
          已完成 {{ row.completed }} · 未完成 {{ row.pending }}
        </div>
      </article>

      <div class="study-chart-legend">
        <span class="study-chart-legend-item">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: resolvePriorityColor('high') }" />
          高优先级
        </span>
        <span class="study-chart-legend-item">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: resolvePriorityColor('medium') }" />
          中优先级
        </span>
        <span class="study-chart-legend-item">
          <span class="study-chart-legend-dot" :style="{ backgroundColor: resolvePriorityColor('low') }" />
          低优先级
        </span>
      </div>

      <p
        v-if="highPriorityPending > 0"
        data-testid="study-task-priority-high-pending"
        class="study-chart-caption"
      >
        还有 <span class="study-chart-value">{{ highPriorityPending }}</span> 个高优先级任务
      </p>
    </div>
  </section>
</template>
