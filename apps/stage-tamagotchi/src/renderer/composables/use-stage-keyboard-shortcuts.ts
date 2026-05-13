import type { Ref } from 'vue'

import type { StageShortcutAction } from '../utils/keyboard-shortcuts'

import { useLive2d } from '@proj-airi/stage-ui-live2d'
import { onMounted, onUnmounted } from 'vue'

import { useControlsIslandStore } from '../stores/controls-island'
import {
  clampLive2DDisplayScale,
  LIVE2D_DISPLAY_SHORTCUT_SCALE,
  resolveStageShortcut,
  shouldIgnoreStageShortcutTarget,
} from '../utils/keyboard-shortcuts'

export interface UseStageKeyboardShortcutsOptions {
  controlsPanelExpanded: Ref<boolean> | { value: boolean }
  setShortcutsCardExpanded?: (expanded: boolean) => void
  setControlsPanelExpanded?: (expanded: boolean) => void
}

/**
 * Handles renderer-level keyboard shortcuts for stage interactions.
 *
 * Use when:
 * - The AIRI stage window is focused and keyboard actions should control Rin UI
 *
 * Expects:
 * - Called once from stage root page lifecycle
 *
 * Returns:
 * - Registers and cleans one `keydown` listener automatically
 */
export function useStageKeyboardShortcuts(options: UseStageKeyboardShortcutsOptions) {
  const controlsIslandStore = useControlsIslandStore()
  const live2dStore = useLive2d()

  function adjustLive2DDisplayScale(delta: number) {
    const currentScale = Number(live2dStore.scale)
    const normalizedScale = Number.isFinite(currentScale) ? currentScale : LIVE2D_DISPLAY_SHORTCUT_SCALE.defaultValue
    const nextScale = clampLive2DDisplayScale(Number((normalizedScale + delta).toFixed(2)))
    live2dStore.scale = nextScale
  }

  function resetLive2DDisplayScale() {
    live2dStore.scale = LIVE2D_DISPLAY_SHORTCUT_SCALE.defaultValue
  }

  async function runShortcutAction(action: StageShortcutAction) {
    switch (action) {
      case 'rin-scale-up':
        adjustLive2DDisplayScale(LIVE2D_DISPLAY_SHORTCUT_SCALE.step)
        return
      case 'rin-scale-down':
        adjustLive2DDisplayScale(-LIVE2D_DISPLAY_SHORTCUT_SCALE.step)
        return
      case 'rin-scale-reset':
        resetLive2DDisplayScale()
        return
      case 'toggle-move-mode':
        controlsIslandStore.toggleMoveMode()
        return
      case 'toggle-study-panel':
        controlsIslandStore.toggleStudyPanel()
        return
      case 'toggle-vision-panel':
        controlsIslandStore.toggleVisionPanel()
        return
      case 'show-shortcuts-guide':
        controlsIslandStore.setControlsPanelExpanded(true)
        options.setShortcutsCardExpanded?.(true)
        return
      case 'escape':
        if (controlsIslandStore.moveModeEnabled) {
          controlsIslandStore.toggleMoveMode()
          return
        }
        if (controlsIslandStore.visionPanelOpen) {
          controlsIslandStore.setVisionPanelOpen(false)
          return
        }
        if (controlsIslandStore.studyPanelOpen) {
          controlsIslandStore.setStudyPanelOpen(false)
          return
        }
        if (options.controlsPanelExpanded.value) {
          if (options.setControlsPanelExpanded)
            options.setControlsPanelExpanded(false)
          else
            controlsIslandStore.setControlsPanelExpanded(false)
          options.setShortcutsCardExpanded?.(false)
        }

      default:
    }
  }

  function handleWindowKeyDown(event: KeyboardEvent) {
    if (shouldIgnoreStageShortcutTarget(event.target))
      return

    const action = resolveStageShortcut({
      key: event.key,
      code: event.code,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    })

    if (!action)
      return

    if (action === 'controls-zoom-in' || action === 'controls-zoom-out') {
      // Keep existing Command +/- behavior untouched (main-process zoom shortcut path).
      return
    }

    event.preventDefault()
    void runShortcutAction(action)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleWindowKeyDown, true)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleWindowKeyDown, true)
  })
}
