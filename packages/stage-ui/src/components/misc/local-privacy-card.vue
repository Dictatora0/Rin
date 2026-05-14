<script setup lang="ts">
const props = withDefaults(defineProps<{
  mode?: 'compact' | 'detailed'
  title?: string
}>(), {
  mode: 'compact',
  title: 'Local-first vision and privacy',
})

const rootClasses = [
  'rounded-xl border px-3 py-2.5 text-xs',
  'border-sky-200/80 bg-sky-50/80 text-sky-950',
  'dark:border-sky-500/35 dark:bg-sky-950/30 dark:text-sky-100',
]

const hintClasses = [
  'mt-2 text-[11px] leading-5',
  'text-sky-800/80 dark:text-sky-100/75',
]
</script>

<template>
  <section :class="rootClasses">
    <div :class="['font-semibold tracking-[0.01em]']">
      {{ props.title }}
    </div>
    <div :class="['mt-1.5 space-y-1 leading-5']">
      <div>摄像头仅用于 Rin 的本地视觉互动与人脸门控。</div>
      <div>视觉处理优先使用本地运行时，便于演示和日常陪伴。</div>
      <div>录入档案只用于识别是否是你本人在和 Rin 互动。</div>
      <div>你可以随时关闭视觉功能、重新录入或删除本地档案。</div>
    </div>
    <div v-if="props.mode === 'detailed'" :class="hintClasses">
      未经额外说明，Rin 不会把摄像头画面或录入档案上传到远端服务。若本机未启用安全存储，自动解锁能力会受限。
    </div>
  </section>
</template>
