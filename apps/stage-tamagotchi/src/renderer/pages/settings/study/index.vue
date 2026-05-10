<script setup lang="ts">
import type { StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

import { useDownload } from '@proj-airi/stage-ui/composables/download'
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { Button, Callout, DoubleCheckButton } from '@proj-airi/ui'
import { useNow } from '@vueuse/core'
import { computed, ref } from 'vue'

const studyCompanion = useStudyCompanionStore()
const now = useNow({ interval: 1000 })
const expandedEventIds = ref<Set<string>>(new Set())

const EVENT_DETAIL_PREVIEW_LIMIT = 120

const mutedUntilText = computed(() => {
  const mutedUntil = studyCompanion.persisted.mutedUntil
  if (mutedUntil <= now.value.getTime())
    return '未静音'

  return new Date(mutedUntil).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const modeText = computed(() => formatMode(studyCompanion.persisted.mode))
const isMutedText = computed(() => (studyCompanion.isMuted ? '是' : '否'))
const isDemoModeText = computed(() => (studyCompanion.demoModeEnabled ? '是' : '否'))

const todayStatsRows = computed(() => [
  { label: '统计日期', value: studyCompanion.persisted.statsDate },
  { label: '今日专注轮数', value: String(studyCompanion.persisted.todayFocusSessions) },
  { label: '今日累计专注分钟', value: String(studyCompanion.persisted.todayFocusMinutes) },
  { label: '今日完成任务数', value: String(studyCompanion.taskCompleted) },
  { label: '今日提醒次数', value: String(studyCompanion.persisted.todayReminderCount) },
  { label: '当前模式', value: modeText.value },
  { label: '是否静音', value: isMutedText.value },
  { label: '是否演示模式', value: isDemoModeText.value },
  { label: '静音到', value: mutedUntilText.value },
  { label: '剩余时间', value: formatRemaining(studyCompanion.persisted.remainingMs) },
])

const taskSummaryRows = computed(() => {
  return [
    { label: '任务总数', value: String(studyCompanion.taskTotal) },
    { label: '已完成', value: String(studyCompanion.taskCompleted) },
    { label: '未完成', value: String(studyCompanion.taskPending) },
  ]
})

const recentEvents = computed(() => {
  return [...studyCompanion.persisted.studyEvents]
    .slice(-50)
    .reverse()
    .map((event, index) => ({
      id: event.id || `${event.type}-${event.at}-${index}`,
      at: formatEventTime(event.at),
      type: event.type,
      typeLabel: formatEventType(event.type),
      detail: formatEventDetail(event.detail),
    }))
})

function formatMode(mode: string) {
  if (mode === 'focus')
    return '专注中'
  if (mode === 'break')
    return '休息中'
  if (mode === 'paused')
    return '已暂停'
  return '空闲'
}

function formatRemaining(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatEventTime(timestamp: number) {
  if (!Number.isFinite(timestamp))
    return '时间无效'

  return new Date(timestamp).toLocaleString()
}

function formatEventDetail(detail: StudyEventLogEntry['detail']) {
  if (!detail || Object.keys(detail).length === 0)
    return '无'

  try {
    const serializedDetail = JSON.stringify(detail)
    if (serializedDetail.length <= 120)
      return serializedDetail
    return `${serializedDetail.slice(0, 117)}...`
  }
  catch {
    return '[详情不可序列化]'
  }
}

function formatEventType(type: StudyEventLogEntry['type']) {
  if (type === 'focus_started')
    return '开始专注'
  if (type === 'focus_completed')
    return '专注完成'
  if (type === 'session_paused')
    return '会话暂停'
  if (type === 'session_resumed')
    return '会话继续'
  if (type === 'focus_reset')
    return '重置会话'
  if (type === 'break_started')
    return '开始休息'
  if (type === 'break_completed')
    return '休息完成'
  if (type === 'task_added')
    return '新增任务'
  if (type === 'task_completed')
    return '完成任务'
  if (type === 'task_reopened')
    return '任务重开'
  if (type === 'task_deleted')
    return '删除任务'
  if (type === 'demo_mode_enabled')
    return '开启演示模式'
  if (type === 'demo_mode_disabled')
    return '关闭演示模式'
  if (type === 'day_rollover')
    return '跨日重置'
  if (type === 'study_log_exported')
    return '导出日志'
  if (type === 'study_events_cleared')
    return '清空日志'
  if (type === 'study_stats_cleared')
    return '清空今日统计'
  if (type === 'reminder_shown')
    return '触发提醒'
  return type
}

function getEventDetailPreview(detail: string) {
  if (detail.length <= EVENT_DETAIL_PREVIEW_LIMIT)
    return detail
  return `${detail.slice(0, EVENT_DETAIL_PREVIEW_LIMIT - 3)}...`
}

function toggleEventDetail(id: string) {
  if (expandedEventIds.value.has(id)) {
    expandedEventIds.value.delete(id)
  }
  else {
    expandedEventIds.value.add(id)
  }
}

function isEventDetailExpanded(id: string) {
  return expandedEventIds.value.has(id)
}

function handleExportJson() {
  const snapshot = studyCompanion.exportStudySnapshot()
  const snapshotJson = JSON.stringify(snapshot, null, 2)
  const snapshotBlob = new Blob([snapshotJson], { type: 'application/json' })
  const { download } = useDownload(
    snapshotBlob,
    `rin-study-log-${snapshot.statsDate}.json`,
  )

  download()
}

function handleClearActivityLog() {
  studyCompanion.clearStudyEvents()
}

function handleClearTodayStats() {
  studyCompanion.clearTodayStudyStats()
}
</script>

<template>
  <div :class="['flex flex-col gap-4 pb-8']">
    <Callout
      :class="['w-full']"
      label="学习陪伴统计"
      theme="primary"
    >
      查看今日专注统计、最近活动日志，并导出 JSON 快照用于分享或备份。
    </Callout>

    <section
      :class="[
        'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
        'dark:border-neutral-700/60 dark:bg-neutral-900/70',
      ]"
    >
      <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
        今日统计
      </h3>
      <div :class="['grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4']">
        <div
          v-for="row in todayStatsRows"
          :key="row.label"
          :class="[
            'rounded-lg border border-neutral-200/70 bg-neutral-50/90 px-3 py-2',
            'dark:border-neutral-700/70 dark:bg-neutral-800/70',
          ]"
        >
          <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
            {{ row.label }}
          </div>
          <div :class="['mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100']">
            {{ row.value }}
          </div>
        </div>
      </div>
    </section>

    <section
      :class="[
        'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
        'dark:border-neutral-700/60 dark:bg-neutral-900/70',
      ]"
    >
      <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
        今日任务摘要
      </h3>
      <div :class="['grid grid-cols-1 gap-3 sm:grid-cols-3']">
        <div
          v-for="row in taskSummaryRows"
          :key="row.label"
          :class="[
            'rounded-lg border border-neutral-200/70 bg-neutral-50/90 px-3 py-2',
            'dark:border-neutral-700/70 dark:bg-neutral-800/70',
          ]"
        >
          <div :class="['text-xs text-neutral-500 dark:text-neutral-400']">
            {{ row.label }}
          </div>
          <div :class="['mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100']">
            {{ row.value }}
          </div>
        </div>
      </div>
    </section>

    <section
      :class="[
        'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
        'dark:border-neutral-700/60 dark:bg-neutral-900/70',
      ]"
    >
      <div :class="['mb-3 flex items-center justify-between gap-3']">
        <h3 :class="['text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
          活动日志（最近 50 条）
        </h3>
        <span :class="['text-xs text-neutral-500 dark:text-neutral-400']">
          共 {{ recentEvents.length }} 条
        </span>
      </div>

      <div
        v-if="recentEvents.length === 0"
        :class="[
          'rounded-lg border border-dashed border-neutral-300/70 px-3 py-4 text-sm',
          'text-neutral-500 dark:border-neutral-700/70 dark:text-neutral-400',
        ]"
      >
        暂无学习记录。
      </div>

      <div
        v-else
        :class="[
          'max-h-96 overflow-y-auto rounded-lg border border-neutral-200/70',
          'dark:border-neutral-700/70',
        ]"
      >
        <div
          v-for="event in recentEvents"
          :key="event.id"
          :class="[
            'grid grid-cols-1 gap-2 border-b border-neutral-200/70 px-3 py-3 text-xs sm:grid-cols-12',
            'last:border-b-0 dark:border-neutral-700/70',
          ]"
        >
          <div :class="['sm:col-span-3 text-neutral-500 dark:text-neutral-400']">
            {{ event.at }}
          </div>
          <div :class="['sm:col-span-3 font-medium text-neutral-700 dark:text-neutral-200']">
            {{ event.typeLabel }}
          </div>
          <div :class="['sm:col-span-6 text-neutral-600 dark:text-neutral-300']">
            <p :class="['break-all']">
              {{ isEventDetailExpanded(event.id) ? event.detail : getEventDetailPreview(event.detail) }}
            </p>
            <button
              v-if="event.detail.length > EVENT_DETAIL_PREVIEW_LIMIT"
              type="button"
              :class="['mt-1 text-[11px] text-primary-600 hover:underline dark:text-primary-300']"
              @click="toggleEventDetail(event.id)"
            >
              {{ isEventDetailExpanded(event.id) ? '收起' : '展开' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section
      :class="[
        'rounded-xl border border-neutral-200/60 bg-white/80 p-4',
        'dark:border-neutral-700/60 dark:bg-neutral-900/70',
      ]"
    >
      <h3 :class="['mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200']">
        操作
      </h3>
      <div :class="['flex flex-col gap-3 sm:flex-row sm:flex-wrap']">
        <Button
          icon="i-solar:download-minimalistic-bold-duotone"
          variant="secondary"
          @click="handleExportJson"
        >
          导出 JSON
        </Button>

        <DoubleCheckButton variant="caution" cancel-variant="secondary" @confirm="handleClearActivityLog">
          清空活动日志
          <template #confirm>
            确认清空日志
          </template>
        </DoubleCheckButton>

        <DoubleCheckButton variant="danger" cancel-variant="secondary" @confirm="handleClearTodayStats">
          清空今日统计与日志
          <template #confirm>
            确认清空今日
          </template>
        </DoubleCheckButton>
      </div>
    </section>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  title: 学习统计
  subtitleKey: settings.title
  description: 学习陪伴统计面板、活动日志与 JSON 导出
  icon: i-solar:chart-2-bold-duotone
  settingsEntry: true
  order: 8
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
