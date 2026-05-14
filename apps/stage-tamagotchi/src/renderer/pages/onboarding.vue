<script setup lang="ts">
import { useElectronEventaContext, useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { OnboardingScreen } from '@proj-airi/stage-ui/components'
import { useAuthStore } from '@proj-airi/stage-ui/stores/auth'
import { useOnboardingStore } from '@proj-airi/stage-ui/stores/onboarding'
import { useTheme } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

import {
  electronOnboardingClose,
  electronOpenSettings,
  tamagotchiTrayCommandEvent,
} from '../../shared/eventa'

const authStore = useAuthStore()
const { needsLogin, isAuthenticated } = storeToRefs(authStore)
const onboardingStore = useOnboardingStore()
const { isDark } = useTheme()
const eventaContext = useElectronEventaContext()
const closeWindow = useElectronEventaInvoke(electronOnboardingClose)
const openSettings = useElectronEventaInvoke(electronOpenSettings)

watch(needsLogin, async (val) => {
  if (val && !isAuthenticated.value) {
    needsLogin.value = false
    await closeWindow()
  }
})

const bgClass = computed(() => isDark.value ? 'bg-[#0f0f0f]' : 'bg-white')

async function handleSkipped() {
  onboardingStore.markSetupSkipped()
  await closeWindow()
}

async function handleConfigured() {
  onboardingStore.markSetupCompleted()
  await closeWindow()
}

async function handleGuideAction(action: string) {
  if (action === 'open-settings-general') {
    await openSettings({ route: '/settings/system/general' })
    return
  }

  if (action === 'open-settings-study') {
    await openSettings({ route: '/settings/study' })
    return
  }

  if (
    action === 'open-study-panel'
    || action === 'open-vision-panel'
    || action === 'open-shortcut-guide'
  ) {
    eventaContext.value.emit(tamagotchiTrayCommandEvent, { command: action })
  }
}
</script>

<template>
  <!-- Same flex/min-h-0 chain as OnboardingDialog so model step grid scrolls inside the viewport (not the whole page). -->
  <div
    class="onboarding-root h-full min-h-0 w-full flex flex-col overflow-hidden overscroll-none"
    :class="bgClass"
  >
    <div class="min-h-8 w-full flex-shrink-0 select-none drag-region" :class="bgClass" />
    <div class="onboarding-scroll min-h-0 w-full flex flex-1 flex-col overflow-hidden px-10">
      <div class="onboarding-content min-h-0 flex flex-1 flex-col overflow-hidden">
        <OnboardingScreen @action="handleGuideAction" @skipped="handleSkipped" @configured="handleConfigured" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-root {
  scrollbar-width: none;
}

.onboarding-root::-webkit-scrollbar {
  display: none;
}

.onboarding-content {
  padding: 8px 0 20px 0;
}

.onboarding-scroll {
  padding-top: 8px;
  padding-bottom: 20px;
}
</style>

<route lang="yaml">
meta:
  layout: plain
</route>
