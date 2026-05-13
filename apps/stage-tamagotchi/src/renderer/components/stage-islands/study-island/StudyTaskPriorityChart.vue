<script setup lang="ts">
import type { StudyTask } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { computed } from 'vue'

import { buildTaskPriorityStats } from '../../../utils/study-chart-data'

const props = defineProps<{
  tasks: StudyTask[]
}>()

const priorityStats = computed(() => buildTaskPriorityStats(props.tasks))
const maxRowCount = computed(() => Math.max(1, ...priorityStats.value.rows.map(row => row.total)))
</script>

<template>
  <section
    data-testid="study-task-priority-chart"
    :class="[
      'study-chart-card',
      'rounded-xl border border-neutral-200/80 bg-white px-3 py-3',
      'dark:border-neutral-700/70 dark:bg-neutral-900/70',
    ]"
  >
    <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-100']">
      任务优先级分布
    </h3>

    <div
      v-if="priorityStats.totalTasks === 0"
      data-testid="study-task-priority-empty"
      :class="[
        'mt-3 rounded-lg border border-dashed border-neutral-300/70 px-3 py-4 text-xs text-neutral-500',
        'dark:border-neutral-700/70 dark:text-neutral-400',
      ]"
    >
      还没有任务数据
    </div>

    <div
      v-else
      :class="['mt-3 grid grid-cols-1 gap-2']"
    >
      <article
        v-for="row in priorityStats.rows"
        :key="row.priority"
      >
        <div :class="['mb-1 flex items-center justify-between text-xs']">
          <span :class="['text-neutral-600 dark:text-neutral-300']">{{ row.label }}</span>
          <span :class="['text-neutral-500 dark:text-neutral-400']">{{ row.total }} 项</span>
        </div>
        <div :class="['h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700']">
          <div
            data-testid="study-task-priority-bar"
            :class="[
              'h-full rounded-full',
              row.priority === 'high'
                ? 'bg-rose-400'
                : row.priority === 'medium'
                  ? 'bg-amber-400'
                  : 'bg-sky-400',
            ]"
            :style="{ width: `${Math.max(8, Math.round((row.total / maxRowCount) * 100))}%` }"
          />
        </div>
        <div :class="['mt-1 text-[11px] text-neutral-500 dark:text-neutral-400']">
          已完成 {{ row.completed }} · 未完成 {{ row.pending }}
        </div>
      </article>
    </div>
  </section>
</template>
