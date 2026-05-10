<script setup lang="ts">
import { electron } from '@proj-airi/electron-eventa'
import { useElectronEventaInvoke, useElectronWindowResize } from '@proj-airi/electron-vueuse'
import { useAsyncState } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const isWindows = useElectronEventaInvoke(electron.app.isWindows)
const { handleResizeStart } = useElectronWindowResize()
const route = useRoute()
const isStageLayout = computed(() => route.meta.layout === 'stage')
const { state: isWindowsRef } = useAsyncState(() => isWindows(), false)

const resizeDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
</script>

<template>
  <div
    v-if="isWindowsRef"
    data-testid="resize-handles-root"
    :class="[
      'resize-handles',
      isStageLayout ? 'resize-handles-stage' : '',
    ]"
  >
    <div
      v-for="direction in resizeDirections"
      :key="direction"
      :data-testid="`resize-handle-${direction}`"
      :class="[
        'handle',
        direction,
      ]"
      @mousedown="handleResizeStart($event, direction)"
    />
  </div>
</template>

<style scoped>
.resize-handles {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

.handle {
  position: absolute;
  pointer-events: auto;
}

.handle.n { top: 0; left: 5px; right: 5px; height: 5px; cursor: n-resize; }
.handle.s { bottom: 0; left: 5px; right: 5px; height: 5px; cursor: s-resize; }
.handle.e { top: 5px; bottom: 5px; right: 0; width: 5px; cursor: e-resize; }
.handle.w { top: 5px; bottom: 5px; left: 0; width: 5px; cursor: w-resize; }

.handle.nw { top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize; }
.handle.ne { top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize; }
.handle.sw { bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize; }
.handle.se { bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize; }

.resize-handles-stage .handle.n,
.resize-handles-stage .handle.s {
  height: 8px;
}

.resize-handles-stage .handle.e,
.resize-handles-stage .handle.w {
  width: 8px;
}

.resize-handles-stage .handle.nw,
.resize-handles-stage .handle.ne,
.resize-handles-stage .handle.sw,
.resize-handles-stage .handle.se {
  width: 14px;
  height: 14px;
}
</style>
