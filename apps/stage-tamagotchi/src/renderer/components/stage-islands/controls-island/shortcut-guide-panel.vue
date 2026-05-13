<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface ShortcutGuideItem {
  keycaps: string[]
  description: string
}

interface ShortcutGuideSection {
  title: string
  description: string
  items: ShortcutGuideItem[]
}

const { t } = useI18n()

const shortcutGuideSections = computed<ShortcutGuideSection[]>(() => [
  {
    title: t('tamagotchi.stage.controls-island.shortcuts.panel.controls.title'),
    description: t('tamagotchi.stage.controls-island.shortcuts.panel.controls.description'),
    items: [
      { keycaps: ['⌘', '+'], description: t('tamagotchi.stage.controls-island.shortcuts.zoom-in') },
      { keycaps: ['⌘', '-'], description: t('tamagotchi.stage.controls-island.shortcuts.zoom-out') },
      { keycaps: ['⌘', '0'], description: t('tamagotchi.stage.controls-island.shortcuts.reset-size') },
    ],
  },
  {
    title: t('tamagotchi.stage.controls-island.shortcuts.panel.rin.title'),
    description: t('tamagotchi.stage.controls-island.shortcuts.panel.rin.description'),
    items: [
      { keycaps: ['⌘', '⇧', 'Plus'], description: t('tamagotchi.stage.controls-island.shortcuts.rin-scale-up') },
      { keycaps: ['⌘', '⇧', '-'], description: t('tamagotchi.stage.controls-island.shortcuts.rin-scale-down') },
      { keycaps: ['⌘', '⇧', '0'], description: t('tamagotchi.stage.controls-island.shortcuts.rin-scale-reset') },
    ],
  },
  {
    title: t('tamagotchi.stage.controls-island.shortcuts.panel.desktop.title'),
    description: t('tamagotchi.stage.controls-island.shortcuts.panel.desktop.description'),
    items: [
      { keycaps: ['⌘', '⇧', 'M'], description: t('tamagotchi.stage.controls-island.shortcuts.toggle-move-mode') },
      { keycaps: ['Esc'], description: t('tamagotchi.stage.controls-island.shortcuts.escape-action') },
    ],
  },
  {
    title: t('tamagotchi.stage.controls-island.shortcuts.panel.study-vision.title'),
    description: t('tamagotchi.stage.controls-island.shortcuts.panel.study-vision.description'),
    items: [
      { keycaps: ['⌘', '⇧', 'T'], description: t('tamagotchi.stage.controls-island.shortcuts.toggle-study-panel') },
      { keycaps: ['⌘', '⇧', 'V'], description: t('tamagotchi.stage.controls-island.shortcuts.toggle-vision-panel') },
    ],
  },
  {
    title: t('tamagotchi.stage.controls-island.shortcuts.panel.help.title'),
    description: t('tamagotchi.stage.controls-island.shortcuts.panel.help.description'),
    items: [
      { keycaps: ['⌘', '⇧', 'K'], description: t('tamagotchi.stage.controls-island.shortcuts.open-shortcuts-guide') },
    ],
  },
])
</script>

<template>
  <div
    data-testid="shortcut-guide-panel"
    :class="[
      'shortcut-guide-panel',
      'flex flex-col gap-4 text-neutral-800 dark:text-neutral-100',
    ]"
  >
    <p
      :class="[
        'text-sm leading-5 text-neutral-600 dark:text-neutral-300',
      ]"
    >
      {{ t('tamagotchi.stage.controls-island.shortcuts.panel.subtitle') }}
    </p>

    <section
      v-for="section in shortcutGuideSections"
      :key="section.title"
      data-testid="shortcut-guide-section"
      :class="[
        'rounded-xl border border-neutral-200/80 p-3',
        'bg-neutral-50/90 dark:border-neutral-700/80 dark:bg-neutral-900/60',
      ]"
    >
      <header :class="['mb-2']">
        <h3 :class="['text-base font-semibold leading-6']">
          {{ section.title }}
        </h3>
        <p :class="['mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400']">
          {{ section.description }}
        </p>
      </header>

      <ul :class="['flex flex-col gap-2']">
        <li
          v-for="item in section.items"
          :key="`${section.title}-${item.description}`"
          :class="[
            'rounded-lg border border-neutral-200/70 p-2',
            'bg-white/90 dark:border-neutral-700/70 dark:bg-neutral-950/55',
            'flex items-center justify-between gap-3',
          ]"
        >
          <div :class="['flex items-center gap-1.5']">
            <template v-for="(keycap, index) in item.keycaps" :key="`${item.description}-${keycap}-${index}`">
              <span
                v-if="index > 0"
                :class="['text-xs text-neutral-400 dark:text-neutral-500']"
              >+</span>
              <kbd
                data-testid="shortcut-keycap"
                :class="[
                  'min-w-[2.15rem] rounded-md border border-neutral-300 px-2 py-1 text-center',
                  'bg-neutral-100 text-[13px] leading-5 font-semibold font-mono text-neutral-800',
                  'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100',
                ]"
              >
                {{ keycap }}
              </kbd>
            </template>
          </div>
          <span :class="['text-sm leading-5 text-neutral-700 dark:text-neutral-200']">
            {{ item.description }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
