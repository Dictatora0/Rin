<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

const emit = defineEmits<{
  interactionLockChange: [locked: boolean]
}>()
const studyStore = useStudyCompanionStore()
const { persisted, taskTotal, taskCompleted, taskPending } = storeToRefs(studyStore)
const { addTask, toggleTaskDone, deleteTask } = studyStore
const draftTitle = ref('')
const taskInputRef = ref<HTMLInputElement>()
const isTaskInputFocused = ref(false)
const isComposing = ref(false)
const taskCompletionFeedbackVisible = ref(false)
const taskCompletionFeedbackText = ref('已完成，做得不错')
let completionFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const tasks = computed(() => persisted.value.tasks)
const showTaskOverloadHint = computed(() => taskPending.value >= 5)

function submitTask() {
  const normalizedTitle = draftTitle.value.trim()
  if (!normalizedTitle)
    return

  addTask(normalizedTitle)
  draftTitle.value = ''
}

function clearTaskCompletionFeedbackTimer() {
  if (!completionFeedbackTimer)
    return
  clearTimeout(completionFeedbackTimer)
  completionFeedbackTimer = null
}

function showTaskCompletionFeedback() {
  clearTaskCompletionFeedbackTimer()
  taskCompletionFeedbackVisible.value = true
  completionFeedbackTimer = setTimeout(() => {
    taskCompletionFeedbackVisible.value = false
    completionFeedbackTimer = null
  }, 1700)
}

function handleTaskInputFocus() {
  isTaskInputFocused.value = true
  emit('interactionLockChange', true)
  nextTick(() => {
    taskInputRef.value?.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    })
  })
}

function handleTaskInputBlur() {
  isTaskInputFocused.value = false
  emit('interactionLockChange', isComposing.value)
}

function handleCompositionStart() {
  isComposing.value = true
  emit('interactionLockChange', true)
}

function handleCompositionEnd() {
  isComposing.value = false
  emit('interactionLockChange', isTaskInputFocused.value)
}

function handleTaskInputKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter')
    return

  if (isComposing.value || event.isComposing)
    return

  event.preventDefault()
  submitTask()
}

function handleToggleTaskDone(taskId: string) {
  const targetTask = tasks.value.find(task => task.id === taskId)
  if (!targetTask)
    return

  const shouldShowCompletionFeedback = !targetTask.done
  toggleTaskDone(taskId)
  if (shouldShowCompletionFeedback)
    showTaskCompletionFeedback()
}

onBeforeUnmount(() => {
  clearTaskCompletionFeedbackTimer()
})
</script>

<template>
  <section
    :class="[
      'mt-1 border-t border-neutral-200/70 pt-2 pb-4',
      'dark:border-neutral-700/70',
    ]"
  >
    <div :class="['flex items-center justify-between gap-2 text-xs']">
      <span :class="['font-medium text-neutral-700 dark:text-neutral-200']">今日任务</span>
      <span :class="['text-neutral-500 dark:text-neutral-400']">
        任务：已完成 {{ taskCompleted }} / 共 {{ taskTotal }}
      </span>
    </div>

    <p
      v-if="showTaskOverloadHint"
      :class="[
        'mt-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1 text-xs',
        'text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200',
      ]"
    >
      任务较多，建议先选 1 项开始。
    </p>

    <div :class="['mt-2 flex items-center gap-1.5']">
      <input
        ref="taskInputRef"
        v-model="draftTitle"
        type="text"
        maxlength="120"
        placeholder="添加今日任务"
        :class="[
          'min-w-0 flex-1 rounded-lg border border-neutral-200/80 px-2.5 py-1.5 text-xs',
          'scroll-mt-4 scroll-mb-28',
          'bg-white/90 text-neutral-800 placeholder:text-neutral-400',
          'outline-none transition-colors focus:border-primary-500',
          'dark:border-neutral-700/70 dark:bg-neutral-800/80 dark:text-neutral-100 dark:placeholder:text-neutral-500',
        ]"
        @focus="handleTaskInputFocus"
        @blur="handleTaskInputBlur"
        @keydown="handleTaskInputKeydown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      >
      <button
        type="button"
        :class="[
          'shrink-0 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white',
          'transition-colors hover:bg-primary-500',
        ]"
        @click="submitTask"
      >
        添加
      </button>
    </div>

    <div
      v-if="taskCompletionFeedbackVisible"
      data-testid="task-completion-feedback"
      :class="[
        'mt-2 flex items-center gap-1.5 rounded-md border border-emerald-200/85 bg-emerald-50/85 px-2 py-1 text-xs',
        'text-emerald-700 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200',
      ]"
    >
      <span :class="['i-solar:check-circle-bold text-sm animate-pulse']" />
      <span>{{ taskCompletionFeedbackText }}</span>
    </div>

    <ul
      v-if="tasks.length > 0"
      :class="['mt-2 space-y-1 pb-4']"
    >
      <li
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs',
          'bg-neutral-100/80 dark:bg-neutral-800/70',
        ]"
      >
        <button
          type="button"
          :class="[
            'min-w-0 flex-1 truncate text-left',
            task.done ? 'text-neutral-400 line-through dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-100',
          ]"
          :title="task.title"
          @click="handleToggleTaskDone(task.id)"
        >
          {{ task.title }}
        </button>

        <button
          type="button"
          :class="[
            'shrink-0 rounded px-1.5 py-1 text-[11px] transition-colors',
            task.done
              ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
          ]"
          @click="handleToggleTaskDone(task.id)"
        >
          {{ task.done ? '取消完成' : '完成' }}
        </button>

        <button
          type="button"
          :class="[
            'shrink-0 rounded px-1.5 py-1 text-[11px] transition-colors',
            'bg-red-100 text-red-700 hover:bg-red-200',
            'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
          ]"
          @click="deleteTask(task.id)"
        >
          删除
        </button>
      </li>
    </ul>

    <div
      v-else
      data-testid="task-list-empty-state"
      :class="[
        'mt-2 rounded-lg border border-dashed border-neutral-300/70 px-2.5 py-2',
        'text-xs text-neutral-600 dark:border-neutral-700/70 dark:text-neutral-300',
      ]"
    >
      <p :class="['font-medium text-neutral-700 dark:text-neutral-100']">
        还没有今日任务
      </p>
      <p :class="['mt-1 text-neutral-500 dark:text-neutral-400']">
        添加一个任务，让 Rin 陪你完成它
      </p>
    </div>
  </section>
</template>
