<script setup lang="ts">
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import {
  getStudyQuickDueDate,
  isValidStudyDueDate,
  normalizeStudyDueDate,
} from '../../../utils/study-due-date'
import {
  formatStudyTaskDueText,
  formatStudyTaskPriorityLabel,
  formatStudyTaskSortModeLabel,
  resolveStudyTaskDueClass,
  resolveStudyTaskPriorityClass,
} from '../../../utils/study-status-labels'

const emit = defineEmits<{
  interactionLockChange: [locked: boolean]
}>()
const studyStore = useStudyCompanionStore()
const { taskSortMode, sortedTasks, taskTotal, taskCompleted, taskPending } = storeToRefs(studyStore)
const {
  addTask,
  toggleTaskDone,
  deleteTask,
  setTaskPriority,
  setTaskDueDate,
  setTaskSortMode,
} = studyStore
const draftTitle = ref('')
const draftPriority = ref<'high' | 'medium' | 'low'>('medium')
const draftDueDate = ref(getStudyQuickDueDate('tomorrow'))
const draftDueDateError = ref('')
const taskDueDateDraftMap = ref<Record<string, string>>({})
const taskDueDateErrorMap = ref<Record<string, string>>({})
const taskInputRef = ref<HTMLInputElement>()
const isTaskInputFocused = ref(false)
const isComposing = ref(false)
const taskCompletionFeedbackVisible = ref(false)
const taskCompletionFeedbackText = ref('已完成，做得不错')
let completionFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const tasks = computed(() => sortedTasks.value)
const showTaskOverloadHint = computed(() => taskPending.value >= 5)
const taskSortModeModel = computed({
  get() {
    return taskSortMode.value
  },
  set(mode: 'smart' | 'createdAt' | 'priority' | 'dueDate') {
    setTaskSortMode(mode)
  },
})
const taskSortModeOptions = [
  'smart',
  'createdAt',
  'priority',
  'dueDate',
] as const

function submitTask() {
  const normalizedTitle = draftTitle.value.trim()
  if (!normalizedTitle)
    return

  const normalizedDueDate = normalizeStudyDueDate(draftDueDate.value)
  if (normalizedDueDate == null) {
    draftDueDateError.value = '请输入 YYYY-MM-DD 格式的日期'
    return
  }

  draftDueDateError.value = ''
  addTask({
    title: normalizedTitle,
    priority: draftPriority.value,
    dueDate: normalizedDueDate || undefined,
  })
  draftTitle.value = ''
  draftPriority.value = 'medium'
  draftDueDate.value = getStudyQuickDueDate('tomorrow')
  draftDueDateError.value = ''
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

function handleTaskPriorityChange(taskId: string, priority: string) {
  const normalizedPriority = priority === 'high' || priority === 'low' ? priority : 'medium'
  setTaskPriority(taskId, normalizedPriority)
}

function handleTaskDueDateChange(taskId: string, dueDate: string) {
  const normalizedDueDate = normalizeStudyDueDate(dueDate)
  if (normalizedDueDate == null) {
    taskDueDateDraftMap.value[taskId] = dueDate
    taskDueDateErrorMap.value[taskId] = '请输入 YYYY-MM-DD 格式的日期'
    return
  }

  taskDueDateErrorMap.value[taskId] = ''
  taskDueDateDraftMap.value[taskId] = normalizedDueDate
  setTaskDueDate(taskId, normalizedDueDate || null)
}

function handleDraftDueDateInput(value: string) {
  draftDueDate.value = value
  draftDueDateError.value = isValidStudyDueDate(value) ? '' : '请输入 YYYY-MM-DD 格式的日期'
}

function applyDraftQuickDueDate(type: 'today' | 'tomorrow' | 'weekEnd' | 'nextWeek') {
  draftDueDate.value = getStudyQuickDueDate(type)
  draftDueDateError.value = ''
}

function clearDraftDueDate() {
  draftDueDate.value = getStudyQuickDueDate('tomorrow')
  draftDueDateError.value = ''
}

function getTaskDueDateInputValue(taskId: string, dueDate?: string) {
  const draftValue = taskDueDateDraftMap.value[taskId]
  if (draftValue != null)
    return draftValue
  return dueDate ?? ''
}

function getTaskDueDateError(taskId: string) {
  return taskDueDateErrorMap.value[taskId] ?? ''
}

function handleTaskDueDateInput(taskId: string, value: string) {
  taskDueDateDraftMap.value[taskId] = value
  taskDueDateErrorMap.value[taskId] = isValidStudyDueDate(value) ? '' : '请输入 YYYY-MM-DD 格式的日期'
}

function applyTaskQuickDueDate(taskId: string, type: 'today' | 'tomorrow' | 'weekEnd' | 'nextWeek') {
  const nextDueDate = getStudyQuickDueDate(type)
  taskDueDateDraftMap.value[taskId] = nextDueDate
  taskDueDateErrorMap.value[taskId] = ''
  setTaskDueDate(taskId, nextDueDate)
}

function clearTaskDueDate(taskId: string) {
  taskDueDateDraftMap.value[taskId] = ''
  taskDueDateErrorMap.value[taskId] = ''
  setTaskDueDate(taskId, null)
}

onBeforeUnmount(() => {
  clearTaskCompletionFeedbackTimer()
})
</script>

<template>
  <section
    :class="[
      'mt-2 border-t border-neutral-200/80 pt-3 pb-6',
      'dark:border-neutral-700/70',
    ]"
  >
    <div :class="['flex items-start justify-between gap-2 text-[12px]']">
      <div :class="['flex flex-col gap-1']">
        <span :class="['font-semibold text-neutral-700 dark:text-neutral-200']">今日任务</span>
        <span :class="['text-neutral-500 dark:text-neutral-400']">
          任务：已完成 {{ taskCompleted }} / 共 {{ taskTotal }}
        </span>
      </div>
      <label :class="['flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400']">
        <span>排序</span>
        <select
          v-model="taskSortModeModel"
          data-testid="task-sort-mode-select"
          :class="[
            'rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700',
            'outline-none transition-colors focus:border-primary-500',
            'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
          ]"
        >
          <option
            v-for="option in taskSortModeOptions"
            :key="option"
            :value="option"
          >
            {{ formatStudyTaskSortModeLabel(option) }}
          </option>
        </select>
      </label>
    </div>

    <p
      v-if="showTaskOverloadHint"
      :class="[
        'mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px]',
        'text-amber-700 dark:border-amber-800/70 dark:bg-amber-900/30 dark:text-amber-200',
      ]"
    >
      任务较多，建议先选 1 项开始。
    </p>

    <div
      data-testid="task-create-form"
      :class="[
        'mt-2.5 rounded-xl border border-neutral-200/80 bg-white/90 p-2.5 pb-6',
        'dark:border-neutral-700/70 dark:bg-neutral-900/70',
      ]"
    >
      <label
        for="task-title-input"
        :class="['text-[11px] font-medium text-neutral-600 dark:text-neutral-300']"
      >
        任务名称
      </label>
      <input
        id="task-title-input"
        ref="taskInputRef"
        v-model="draftTitle"
        type="text"
        maxlength="120"
        placeholder="例如：整理课程提纲"
        :class="[
          'mt-1 min-w-0 w-full rounded-xl border border-neutral-200/80 px-3 py-2 text-[12px]',
          'scroll-mt-4 scroll-mb-28',
          'bg-white text-neutral-800 placeholder:text-neutral-400',
          'outline-none transition-colors focus:border-primary-500',
          'dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
        ]"
        @focus="handleTaskInputFocus"
        @blur="handleTaskInputBlur"
        @keydown="handleTaskInputKeydown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      >

      <div
        data-testid="task-create-meta-grid"
        :class="['mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2']"
      >
        <label
          for="task-priority-input"
          :class="['flex flex-col gap-1 text-[11px] text-neutral-600 dark:text-neutral-300']"
        >
          <span>优先级</span>
          <select
            id="task-priority-input"
            v-model="draftPriority"
            data-testid="task-priority-select"
            aria-label="优先级"
            title="优先级"
            :class="[
              'rounded-xl border border-neutral-200/80 bg-white px-2 py-2 text-[12px] text-neutral-700',
              'w-full min-w-[136px]',
              'outline-none transition-colors focus:border-primary-500',
              'dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-neutral-100',
            ]"
          >
            <option value="high">
              高优先级
            </option>
            <option value="medium">
              中优先级
            </option>
            <option value="low">
              低优先级
            </option>
          </select>
        </label>

        <label
          for="task-due-date-input"
          :class="['flex flex-col gap-1 text-[11px] text-neutral-600 dark:text-neutral-300']"
        >
          <div :class="['flex items-center justify-between']">
            <span>截止日期</span>
            <span :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">可选</span>
          </div>
          <input
            id="task-due-date-input"
            v-model="draftDueDate"
            data-testid="task-due-date-input"
            type="text"
            aria-label="截止日期"
            title="截止日期"
            placeholder="例如：2026-05-12"
            :class="[
              'rounded-xl border border-neutral-200/80 bg-white px-2 py-2 text-[12px] text-neutral-700',
              'w-full min-w-[148px]',
              'outline-none transition-colors focus:border-primary-500',
              'dark:border-neutral-700/70 dark:bg-neutral-900 dark:text-neutral-100',
              draftDueDateError ? 'border-rose-400 dark:border-rose-500' : '',
            ]"
            @input="event => handleDraftDueDateInput((event.target as HTMLInputElement).value)"
            @blur="event => handleDraftDueDateInput((event.target as HTMLInputElement).value)"
          >
          <span :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">
            格式：YYYY-MM-DD，用于排序和逾期提示
          </span>
          <span
            v-if="draftDueDateError"
            data-testid="task-due-date-error"
            :class="['text-[10px] text-rose-600 dark:text-rose-300']"
          >
            {{ draftDueDateError }}
          </span>
        </label>
      </div>

      <div
        data-testid="task-due-date-quick-actions"
        :class="['mt-2 flex flex-wrap gap-1.5']"
      >
        <button
          type="button"
          :class="['rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
          @click="applyDraftQuickDueDate('today')"
        >
          今天
        </button>
        <button
          type="button"
          :class="['rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
          @click="applyDraftQuickDueDate('tomorrow')"
        >
          明天
        </button>
        <button
          type="button"
          :class="['rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
          @click="applyDraftQuickDueDate('weekEnd')"
        >
          本周日
        </button>
        <button
          type="button"
          :class="['rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
          @click="applyDraftQuickDueDate('nextWeek')"
        >
          一周后
        </button>
        <button
          type="button"
          :class="['rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
          @click="clearDraftDueDate"
        >
          清除
        </button>
      </div>

      <div :class="['mt-2.5 flex justify-end']">
        <button
          type="button"
          :class="[
            'w-full rounded-xl bg-primary-600 px-3 py-2 text-[12px] font-medium text-white',
            'sm:w-auto sm:min-w-[108px]',
            'transition-colors hover:bg-primary-500',
          ]"
          @click="submitTask"
        >
          添加任务
        </button>
      </div>
    </div>

    <div
      v-if="taskCompletionFeedbackVisible"
      data-testid="task-completion-feedback"
      :class="[
        'mt-2.5 flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1.5 text-xs',
        'text-primary-700 dark:border-primary-700/60 dark:bg-primary-900/20 dark:text-primary-200',
      ]"
    >
      <span :class="['i-solar:check-circle-bold text-sm animate-pulse']" />
      <span>{{ taskCompletionFeedbackText }}</span>
    </div>

    <ul
      v-if="tasks.length > 0"
      :class="['mt-2.5 space-y-1.5 pb-3']"
    >
      <li
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'rounded-xl px-2.5 py-2 text-[12px]',
          'bg-neutral-100 dark:bg-neutral-800',
        ]"
      >
        <div :class="['flex items-start justify-between gap-2']">
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
          <span
            :class="[
              'rounded px-1.5 py-0.5 text-[10px] font-semibold',
              resolveStudyTaskPriorityClass(task.priority),
            ]"
          >
            {{ formatStudyTaskPriorityLabel(task.priority) }}
          </span>
        </div>

        <div :class="['mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between']">
          <span
            :class="[
              'text-[11px]',
              resolveStudyTaskDueClass(task),
            ]"
          >
            {{ formatStudyTaskDueText(task) || '未设置截止日期' }}
          </span>
          <div :class="['flex flex-wrap items-center gap-1.5']">
            <button
              type="button"
              :class="[
                'shrink-0 rounded-md px-1.5 py-1 text-[11px] transition-colors',
                task.done
                  ? 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50',
              ]"
              @click="handleToggleTaskDone(task.id)"
            >
              {{ task.done ? '取消完成' : '完成' }}
            </button>

            <button
              type="button"
              :class="[
                'shrink-0 rounded-md px-1.5 py-1 text-[11px] transition-colors',
                'bg-red-100 text-red-700 hover:bg-red-200',
                'dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
              ]"
              @click="deleteTask(task.id)"
            >
              删除
            </button>
          </div>
        </div>

        <div
          data-testid="task-item-edit-grid"
          :class="['mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2']"
        >
          <label
            :for="`task-item-priority-${task.id}`"
            :class="['flex flex-col gap-1 text-[11px] text-neutral-600 dark:text-neutral-300']"
          >
            <span>优先级</span>
            <select
              :id="`task-item-priority-${task.id}`"
              :value="task.priority"
              data-testid="task-item-priority-select"
              aria-label="任务优先级"
              title="任务优先级"
              :class="[
                'rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700',
                'w-full min-w-[128px]',
                'outline-none transition-colors focus:border-primary-500',
                'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
              ]"
              @change="event => handleTaskPriorityChange(task.id, (event.target as HTMLSelectElement).value)"
            >
              <option value="high">
                高优先级
              </option>
              <option value="medium">
                中优先级
              </option>
              <option value="low">
                低优先级
              </option>
            </select>
          </label>

          <label
            :for="`task-item-due-date-${task.id}`"
            :class="['flex flex-col gap-1 text-[11px] text-neutral-600 dark:text-neutral-300']"
          >
            <div :class="['flex items-center justify-between']">
              <span>截止日期</span>
              <span :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">可选</span>
            </div>
            <input
              :id="`task-item-due-date-${task.id}`"
              :value="getTaskDueDateInputValue(task.id, task.dueDate)"
              data-testid="task-item-due-date-input"
              type="text"
              aria-label="任务截止日期"
              title="任务截止日期"
              placeholder="例如：2026-05-12"
              :class="[
                'rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700',
                'w-full min-w-[148px]',
                'outline-none transition-colors focus:border-primary-500',
                'dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100',
                getTaskDueDateError(task.id) ? 'border-rose-400 dark:border-rose-500' : '',
              ]"
              @input="event => handleTaskDueDateInput(task.id, (event.target as HTMLInputElement).value)"
              @blur="event => handleTaskDueDateChange(task.id, (event.target as HTMLInputElement).value)"
            >
            <span :class="['text-[10px] text-neutral-500 dark:text-neutral-400']">
              格式：YYYY-MM-DD
            </span>
            <span
              v-if="getTaskDueDateError(task.id)"
              data-testid="task-item-due-date-error"
              :class="['text-[10px] text-rose-600 dark:text-rose-300']"
            >
              {{ getTaskDueDateError(task.id) }}
            </span>
            <div :class="['mt-1 flex flex-wrap gap-1']">
              <button
                type="button"
                :class="['rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
                @click="applyTaskQuickDueDate(task.id, 'today')"
              >
                今天
              </button>
              <button
                type="button"
                :class="['rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
                @click="applyTaskQuickDueDate(task.id, 'tomorrow')"
              >
                明天
              </button>
              <button
                type="button"
                :class="['rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
                @click="applyTaskQuickDueDate(task.id, 'weekEnd')"
              >
                本周日
              </button>
              <button
                type="button"
                :class="['rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
                @click="applyTaskQuickDueDate(task.id, 'nextWeek')"
              >
                一周后
              </button>
              <button
                type="button"
                :class="['rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200']"
                @click="clearTaskDueDate(task.id)"
              >
                清除
              </button>
            </div>
          </label>
        </div>
      </li>
    </ul>

    <div
      v-else
      data-testid="task-list-empty-state"
      :class="[
        'mt-2.5 rounded-xl border border-dashed border-neutral-300/70 px-3 py-2.5',
        'text-xs text-neutral-600 dark:border-neutral-700/70 dark:text-neutral-300',
      ]"
    >
      <p :class="['text-sm font-medium text-neutral-700 dark:text-neutral-100']">
        还没有今日任务
      </p>
      <p :class="['mt-1.5 text-neutral-500 dark:text-neutral-400']">
        添加一个任务，让 Rin 陪你完成它
      </p>
    </div>
  </section>
</template>
