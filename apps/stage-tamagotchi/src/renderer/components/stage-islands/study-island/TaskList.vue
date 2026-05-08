<script setup lang="ts">
import {
  TASK_OVERLOAD_PENDING_THRESHOLD,
  useStudyCompanionStore,
} from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const studyStore = useStudyCompanionStore()
const { persisted, pendingTaskCount, showTaskSplitSuggestion } = storeToRefs(studyStore)
const { addTask, setTaskDone, removeTask, dismissTaskSplitHint } = studyStore

const draft = ref('')

const tasks = computed(() => persisted.value.tasks)

const completedToday = computed(() => persisted.value.todayTasksCompleted)

function submitDraft() {
  addTask(draft.value)
  draft.value = ''
}

function onSubmit(e: Event) {
  e.preventDefault()
  submitDraft()
}
</script>

<template>
  <div
    :class="[
      'w-full max-w-sm border-t border-neutral-200 pt-3 dark:border-neutral-700',
      'flex flex-col gap-2',
    ]"
  >
    <div class="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
      <span class="font-medium text-neutral-600 dark:text-neutral-300">Today's tasks</span>
      <span class="tabular-nums">Done today: {{ completedToday }}</span>
    </div>

    <div
      v-if="showTaskSplitSuggestion"
      :class="[
        'flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs',
        'dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100/90',
      ]"
    >
      <div class="flex items-start gap-2 text-amber-900 dark:text-amber-100">
        <div i-solar:danger-triangle-bold class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p class="leading-snug">
          You have {{ pendingTaskCount }} pending items (limit {{ TASK_OVERLOAD_PENDING_THRESHOLD }} for a light list).
          Try splitting big items into smaller steps.
        </p>
      </div>
      <button
        type="button"
        :class="[
          'self-end rounded-md bg-amber-600 px-2 py-1 text-[11px] font-medium text-white',
          'hover:bg-amber-700 active:scale-[0.98]',
        ]"
        @click="dismissTaskSplitHint"
      >
        Dismiss
      </button>
    </div>

    <form class="flex gap-2" @submit="onSubmit">
      <input
        v-model="draft"
        type="text"
        maxlength="200"
        placeholder="Add a task…"
        :class="[
          'min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white/80 px-2.5 py-1.5 text-sm',
          'text-neutral-800 outline-none ring-rose-400/30 placeholder:text-neutral-400',
          'focus:border-rose-400 focus:ring-2',
          'dark:border-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-100 dark:placeholder:text-neutral-500',
        ]"
      >
      <button
        type="submit"
        :class="[
          'shrink-0 rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white',
          'hover:bg-neutral-700 active:scale-[0.98]',
          'dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white',
        ]"
      >
        Add
      </button>
    </form>

    <ul v-if="tasks.length" class="max-h-40 space-y-1.5 overflow-y-auto pr-0.5">
      <li
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
          'bg-neutral-100/80 dark:bg-neutral-800/60',
        ]"
      >
        <input
          type="checkbox"
          class="size-4 shrink-0 accent-rose-500"
          :checked="task.done"
          @change="setTaskDone(task.id, ($event.target as HTMLInputElement).checked)"
        >
        <span
          :class="[
            'min-w-0 flex-1 truncate',
            task.done ? 'text-neutral-400 line-through dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-100',
          ]"
        >
          {{ task.title }}
        </span>
        <button
          type="button"
          :class="[
            'shrink-0 rounded p-1 text-neutral-400 transition-colors',
            'hover:bg-neutral-200 hover:text-red-600 dark:hover:bg-neutral-700 dark:hover:text-red-400',
          ]"
          :aria-label="`Remove ${task.title}`"
          @click="removeTask(task.id)"
        >
          <div i-solar:trash-bin-minimalistic-bold class="size-4" />
        </button>
      </li>
    </ul>

    <p
      v-else
      class="text-xs text-neutral-400 dark:text-neutral-500"
    >
      No tasks yet — add quick items for this session.
    </p>
  </div>
</template>
