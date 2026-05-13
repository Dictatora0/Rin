<script setup lang="ts">
import type { ModelSettingsRuntimeSnapshot } from '@proj-airi/stage-ui/components/scenarios/settings/model-settings/runtime'
import type { ComponentPublicInstance } from 'vue'

import type { ModelSettingsRuntimeChannelEvent } from '../../shared/model-settings-runtime'

import workletUrl from '@proj-airi/stage-ui/workers/vad/process.worklet?worker&url'

import { defineInvoke } from '@moeru/eventa'
import { tryCatch } from '@moeru/std'
import { electron } from '@proj-airi/electron-eventa'
import {
  useElectronEventaContext,
  useElectronEventaInvoke,
  useElectronMouseAroundWindowBorder,
  useElectronMouseInElement,
  useElectronRelativeMouse,
} from '@proj-airi/electron-vueuse'
import { useModelStore, useThreeSceneIsTransparentAtPoint } from '@proj-airi/stage-ui-three'
import { HoloCoupon } from '@proj-airi/stage-ui/components'
import {
  createEmptyModelSettingsRuntimeSnapshot,
  resolveComponentStateToRuntimePhase,
} from '@proj-airi/stage-ui/components/scenarios/settings/model-settings/runtime'
import { WidgetStage } from '@proj-airi/stage-ui/components/scenes'
import { useAudioRecorder } from '@proj-airi/stage-ui/composables/audio/audio-recorder'
import { useCanvasPixelIsTransparentAtPoint } from '@proj-airi/stage-ui/composables/canvas-alpha'
import { useVAD } from '@proj-airi/stage-ui/stores/ai/models/vad'
import { useLive2d } from '@proj-airi/stage-ui/stores/live2d'
import { useHearingSpeechInputPipeline } from '@proj-airi/stage-ui/stores/modules/hearing'
import { useStudyCompanionStore } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { useOnboardingStore } from '@proj-airi/stage-ui/stores/onboarding'
import { useSettings, useSettingsAudioDevice } from '@proj-airi/stage-ui/stores/settings'
import { refDebounced, useActiveElement, useAsyncState, useBroadcastChannel } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'

import StageFloatingPanel from '../components/stage-floating-panel.vue'
import ControlsIsland from '../components/stage-islands/controls-island/index.vue'
import ResourceStatusIsland from '../components/stage-islands/resource-status-island/index.vue'
import StatusIsland from '../components/stage-islands/status-island/index.vue'
import StudyBubble from '../components/stage-islands/study-bubble/index.vue'
import StudyIsland from '../components/stage-islands/study-island/index.vue'
import VisionIsland from '../components/stage-islands/vision-island/index.vue'
import StageMoveOverlay from '../components/stage-move-overlay.vue'

import { electronOpenOnboarding, electronStartDraggingWindow } from '../../shared/eventa'
import { modelSettingsRuntimeSnapshotChannelName } from '../../shared/model-settings-runtime'
import { useStudyCompanionBubble } from '../composables/use-study-companion-bubble'
import { useStudyStageFeedback } from '../composables/use-study-stage-feedback'
import { useChatSyncStore } from '../stores/chat-sync'
import { useControlsIslandStore } from '../stores/controls-island'
import { useStageWindowLifecycleStore } from '../stores/stage-window-lifecycle'
import { useWindowStore } from '../stores/window'
import {
  computeLive2DHitArea,
  isPointInLive2DHitArea,
} from '../utils/live2d-hit-area'
import { shouldSampleStageTransparency } from '../utils/stage-three-transparency'
import {
  buildWindowClickThroughDebugPayload,
  computeWindowMouseIgnorePolicy,
  WindowMouseIgnoreStateEmitter,
} from '../utils/window-click-through-policy'

const controlsIslandRef = ref<InstanceType<typeof ControlsIsland>>()
const statusIslandRef = ref<InstanceType<typeof StatusIsland>>()
const widgetStageRef = ref<InstanceType<typeof WidgetStage>>()
const studyFloatingPanelElementRef = ref<HTMLElement | null>(null)
const visionFloatingPanelElementRef = ref<HTMLElement | null>(null)
const stageCanvas = toRef(() => widgetStageRef.value?.canvasElement())
const componentStateStage = ref<'pending' | 'loading' | 'mounted'>('pending')
const stageMounted = computed(() => componentStateStage.value === 'mounted')
const isLoading = computed(() => !stageMounted.value)
useStudyStageFeedback()
const { currentBubble } = useStudyCompanionBubble()

const isIgnoringMouseEvents = ref(false)
const shouldFadeOnCursorWithin = ref(false)

const onboardingStore = useOnboardingStore()
const studyCompanionStore = useStudyCompanionStore()
const openOnboarding = useElectronEventaInvoke(electronOpenOnboarding)
const eventaContext = useElectronEventaContext()
const isLinux = useElectronEventaInvoke(electron.app.isLinux)
const { state: isLinuxRef } = useAsyncState(() => isLinux(), false)

const { isOutside } = useElectronMouseInElement(controlsIslandRef)
const { isOutside: isOutsideStatusIsland } = useElectronMouseInElement(statusIslandRef)
const { isOutside: isOutsideStudyPanel } = useElectronMouseInElement(studyFloatingPanelElementRef)
const { isOutside: isOutsideVisionPanel } = useElectronMouseInElement(visionFloatingPanelElementRef)
const isOutsideFor250Ms = refDebounced(isOutside, 250)
const isOutsideStatusIslandFor250Ms = refDebounced(isOutsideStatusIsland, 250)
const isOutsideStudyPanelFor16Ms = refDebounced(isOutsideStudyPanel, 16)
const isOutsideVisionPanelFor16Ms = refDebounced(isOutsideVisionPanel, 16)
const { x: relativeMouseX, y: relativeMouseY } = useElectronRelativeMouse()
// NOTICE: In real-world use cases of Fade on Hover feature, the cursor may move around the edge of the
// model rapidly, causing flickering effects when checking pixel transparency strictly.
// Here we use render-target pixel sampling to keep detection aligned with the actual render output.
const isTransparentByPixels = useCanvasPixelIsTransparentAtPoint(
  stageCanvas,
  relativeMouseX,
  relativeMouseY,
  { regionRadius: 25 },
)
const isTransparentByThree = useThreeSceneIsTransparentAtPoint(
  widgetStageRef,
  relativeMouseX,
  relativeMouseY,
  { regionRadius: 25 },
)

const settingsStore = useSettings()
const { stageModelRenderer, stageModelSelectedUrl, live2dFitPreference } = storeToRefs(settingsStore)
const modelStore = useModelStore()
const { sceneMutationLocked, scenePhase } = storeToRefs(modelStore)
const { stagePaused } = storeToRefs(useStageWindowLifecycleStore())
const controlsIslandStore = useControlsIslandStore()
const {
  fadeOnHoverEnabled,
  moveModeEnabled,
  controlsUIMode,
  controlsPanelExpanded,
  studyPanelOpen,
  visionPanelOpen,
  visionCameraRunning,
} = storeToRefs(controlsIslandStore)
const studyPanelInteractionLocked = ref(false)
const studyPanelActivated = ref(false)
const visionPanelActivated = ref(false)
const studyPanelOpenedAt = ref<number>(0)
const visionPanelOpenedAt = ref<number>(0)
const isPointerDown = ref(false)
const isDraggingWindow = ref(false)
const modelSettingsRuntimeOwnerInstanceId = `tamagotchi-main-stage:${Math.random().toString(36).slice(2, 10)}`
const { data: modelSettingsRuntimeChannelEvent, post: postModelSettingsRuntimeChannelEvent } = useBroadcastChannel<ModelSettingsRuntimeChannelEvent, ModelSettingsRuntimeChannelEvent>({ name: modelSettingsRuntimeSnapshotChannelName })
const shouldUseThreeTransparencyHitTest = computed(() => shouldSampleStageTransparency({
  componentState: componentStateStage.value,
  fadeOnHoverEnabled: fadeOnHoverEnabled.value,
  stageModelRenderer: stageModelRenderer.value,
  stagePaused: stagePaused.value,
}))
const isTransparent = computed(() => {
  if (stagePaused.value || componentStateStage.value !== 'mounted' || !fadeOnHoverEnabled.value)
    return true

  if (stageModelRenderer.value === 'vrm')
    return shouldUseThreeTransparencyHitTest.value ? isTransparentByThree.value : true

  if (stageModelRenderer.value === 'live2d')
    return isTransparentByPixels.value

  // NOTICE:
  // Godot / unsupported renderers currently do not provide per-pixel transparency sampling.
  // Returning `false` here keeps fade-on-hover visually functional instead of being permanently disabled.
  return false
})

const { isNearAnyBorder: isAroundWindowBorder } = useElectronMouseAroundWindowBorder({ threshold: 10 })
const isAroundWindowBorderFor250Ms = refDebounced(isAroundWindowBorder, 250)

const setIgnoreMouseEvents = useElectronEventaInvoke(electron.window.setIgnoreMouseEvents)
const startDraggingWindow = defineInvoke(eventaContext.value, electronStartDraggingWindow)

function handleMoveOverlayDragStart() {
  isDraggingWindow.value = true
  if (!isLinuxRef.value) {
    startDraggingWindow()
  }
}

const live2dStore = useLive2d()
const { scale, positionInPercentageString } = storeToRefs(live2dStore)
const { live2dLookAtX, live2dLookAtY } = storeToRefs(useWindowStore())

const live2DMouseIgnoreEmitter = new WindowMouseIgnoreStateEmitter()
const activeElement = useActiveElement()
const hasFocusedFormField = computed(() => {
  const element = activeElement.value
  if (!element || !(element instanceof HTMLElement))
    return false

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select')
    return true

  return element.isContentEditable
})
const live2dCharacterHit = computed(() => {
  if (stageModelRenderer.value !== 'live2d' || componentStateStage.value !== 'mounted' || stagePaused.value)
    return false

  const stageElement = stageCanvas.value
  if (!stageElement)
    return false

  const stageRect = stageElement.getBoundingClientRect()
  const viewportWidth = Math.max(1, stageRect.width)
  const viewportHeight = Math.max(1, stageRect.height)
  const modelWidth = Math.max(1, Number(stageElement.width || stageRect.width || 1))
  const modelHeight = Math.max(1, Number(stageElement.height || stageRect.height || 1))

  // NOTICE:
  // In a transparent Electron window, the full window rectangle participates in OS hit testing.
  // We approximate the character silhouette area from current Live2D fit layout and only disable
  // click-through while the pointer is near the character body or interactive UI zones.
  const fitResult = computeLive2DHitArea({
    viewportWidth,
    viewportHeight,
    modelWidth,
    modelHeight,
    userScale: Number(scale.value || 1),
    xOffsetPx: (Number.parseFloat(String(positionInPercentageString.value.x || '0')) / 100) * viewportWidth,
    yOffsetPx: (Number.parseFloat(String(positionInPercentageString.value.y || '0')) / 100) * viewportHeight,
    fitPreference: live2dFitPreference.value ?? 'auto',
    zonePreset: 'normal',
  })

  return isPointInLive2DHitArea({
    x: Number(relativeMouseX.value),
    y: Number(relativeMouseY.value),
  }, fitResult.area)
})

const { pause, resume } = watch(isTransparent, (transparent) => {
  shouldFadeOnCursorWithin.value = fadeOnHoverEnabled.value && !transparent
}, { immediate: true })

const studyPanelInputActive = computed(() => studyPanelInteractionLocked.value)
const isStudyPanelHovering = computed(() => studyPanelOpen.value && !isOutsideStudyPanelFor16Ms.value)
const isVisionPanelHovering = computed(() => visionPanelOpen.value && !isOutsideVisionPanelFor16Ms.value)
const isControlsPanelHovering = computed(() => !isOutsideFor250Ms.value || !isOutsideStatusIslandFor250Ms.value)
const isInsideControlAnchor = computed(() => {
  const controlsRoot = document.querySelector('[data-testid="controls-island-root"]')
  if (!controlsRoot)
    return false

  const anchor = controlsRoot.querySelector('[data-testid="controls-anchor"]') as HTMLElement | null
  if (!anchor)
    return false

  const pointerX = Number(relativeMouseX.value)
  const pointerY = Number(relativeMouseY.value)
  if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY))
    return false

  const anchorRect = anchor.getBoundingClientRect()
  return pointerX >= anchorRect.left
    && pointerX <= anchorRect.right
    && pointerY >= anchorRect.top
    && pointerY <= anchorRect.bottom
})
const isInsideMoveHitArea = computed(() => {
  if (!moveModeEnabled.value || isLoading.value)
    return false

  const hitArea = document.querySelector('[data-testid="stage-move-hit-area"]') as HTMLElement | null
  if (!hitArea)
    return false

  const pointerX = Number(relativeMouseX.value)
  const pointerY = Number(relativeMouseY.value)
  if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY))
    return false

  const rect = hitArea.getBoundingClientRect()
  return pointerX >= rect.left
    && pointerX <= rect.right
    && pointerY >= rect.top
    && pointerY <= rect.bottom
})
const hasRecentStudyPanelOpenProtection = computed(() => {
  if (!studyPanelOpen.value || !studyPanelOpenedAt.value)
    return false

  return (Date.now() - studyPanelOpenedAt.value) <= 400
})
const hasRecentVisionPanelOpenProtection = computed(() => {
  if (!visionPanelOpen.value || !visionPanelOpenedAt.value)
    return false

  return (Date.now() - visionPanelOpenedAt.value) <= 400
})
const studyTimerRunning = computed(() => studyCompanionStore.isRunning)

watch(studyPanelOpen, (open) => {
  if (open) {
    studyPanelActivated.value = true
    studyPanelOpenedAt.value = Date.now()
  }
  if (!open)
    studyPanelInteractionLocked.value = false
}, { immediate: true })

watch(visionPanelOpen, (open) => {
  if (open) {
    visionPanelActivated.value = true
    visionPanelOpenedAt.value = Date.now()
  }
}, { immediate: true })

function handleStudyPanelInteractionLock(locked: boolean) {
  studyPanelInteractionLocked.value = locked
}

function closeStudyFloatingPanel() {
  controlsIslandStore.setStudyPanelOpen(false)
  studyPanelInteractionLocked.value = false
}

function closeVisionFloatingPanel() {
  controlsIslandStore.setVisionPanelOpen(false)
}

function handleVisionCameraRunningChange(running: boolean) {
  controlsIslandStore.setVisionCameraRunning(running)
}

function resolveElementFromRefTarget(target: Element | ComponentPublicInstance | null): HTMLElement | null {
  if (!target)
    return null
  if (target instanceof HTMLElement)
    return target

  const componentRoot = (target as ComponentPublicInstance).$el
  return componentRoot instanceof HTMLElement ? componentRoot : null
}

function bindStudyFloatingPanelRef(target: Element | ComponentPublicInstance | null) {
  studyFloatingPanelElementRef.value = resolveElementFromRefTarget(target)
}

function bindVisionFloatingPanelRef(target: Element | ComponentPublicInstance | null) {
  visionFloatingPanelElementRef.value = resolveElementFromRefTarget(target)
}

const modelSettingsRuntimeSnapshot = computed<ModelSettingsRuntimeSnapshot>(() => {
  const hasModel = !!stageModelSelectedUrl.value

  if (stageModelRenderer.value === 'live2d') {
    const phase = resolveComponentStateToRuntimePhase(componentStateStage.value, { hasModel })

    return createEmptyModelSettingsRuntimeSnapshot({
      ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
      renderer: 'live2d',
      phase,
      controlsLocked: hasModel ? phase !== 'mounted' : false,
      previewAvailable: hasModel,
      canCapturePreview: false,
      updatedAt: Date.now(),
    })
  }

  if (stageModelRenderer.value === 'vrm') {
    return createEmptyModelSettingsRuntimeSnapshot({
      ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
      renderer: 'vrm',
      phase: hasModel ? scenePhase.value : 'no-model',
      controlsLocked: hasModel
        ? (!stageMounted.value || sceneMutationLocked.value)
        : false,
      previewAvailable: hasModel,
      canCapturePreview: false,
      updatedAt: Date.now(),
    })
  }

  if (stageModelRenderer.value === 'godot') {
    return createEmptyModelSettingsRuntimeSnapshot({
      ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
      renderer: 'godot',
      phase: hasModel ? 'mounted' : 'no-model',
      controlsLocked: false,
      previewAvailable: false,
      canCapturePreview: false,
      updatedAt: Date.now(),
    })
  }

  return createEmptyModelSettingsRuntimeSnapshot({
    ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
    updatedAt: Date.now(),
  })
})

watch([
  isControlsPanelHovering,
  isInsideControlAnchor,
  isStudyPanelHovering,
  isVisionPanelHovering,
  isInsideMoveHitArea,
  isAroundWindowBorderFor250Ms,
  isTransparent,
  studyPanelOpen,
  visionPanelOpen,
  visionCameraRunning,
  fadeOnHoverEnabled,
  moveModeEnabled,
  controlsPanelExpanded,
  stagePaused,
  hasFocusedFormField,
  live2dCharacterHit,
  isPointerDown,
  isDraggingWindow,
  hasRecentStudyPanelOpenProtection,
  hasRecentVisionPanelOpenProtection,
], () => {
  const nearBorder = isAroundWindowBorderFor250Ms.value

  const policy = computeWindowMouseIgnorePolicy({
    isPointerInsideLive2DHitArea: live2dCharacterHit.value,
    isPointerInsideControls: isControlsPanelHovering.value,
    isPointerInsideControlAnchor: isInsideControlAnchor.value,
    isPointerInsideStudyPanel: isStudyPanelHovering.value,
    isPointerInsideVisionPanel: isVisionPanelHovering.value,
    isPointerInsideMoveHitArea: isInsideMoveHitArea.value,
    isNearWindowBorder: nearBorder,
    hasFocusedFormField: hasFocusedFormField.value,
    isDraggingWindow: isDraggingWindow.value,
    isResizingWindow: nearBorder,
    isPointerDown: isPointerDown.value,
    recentlyOpenedStudyPanel: hasRecentStudyPanelOpenProtection.value,
    recentlyOpenedVisionPanel: hasRecentVisionPanelOpenProtection.value,
    blockingStates: {
      stagePaused: stagePaused.value,
      visionCameraRunning: visionCameraRunning.value,
      studyTimerRunning: studyTimerRunning.value,
      controlsPanelExpanded: controlsPanelExpanded.value,
      studyPanelOpen: studyPanelOpen.value,
      visionPanelOpen: visionPanelOpen.value,
      moveModeEnabled: moveModeEnabled.value,
    },
    fadeOnHoverEnabled: fadeOnHoverEnabled.value,
  })

  const policyDebugPayload = buildWindowClickThroughDebugPayload({ policy })
  if (import.meta.env.DEV)
    console.debug('[window-click-through-policy]', policyDebugPayload)

  isIgnoringMouseEvents.value = policy.shouldIgnoreMouseEvents
  shouldFadeOnCursorWithin.value = policy.shouldFadeStage
    && !isControlsPanelHovering.value
    && !isTransparent.value

  if (live2DMouseIgnoreEmitter.shouldEmit(policy.shouldIgnoreMouseEvents)) {
    setIgnoreMouseEvents([policy.shouldIgnoreMouseEvents, { forward: true }])
  }

  if (shouldFadeOnCursorWithin.value)
    resume()
  else
    pause()
})

// Emit runtime snapshot on change and on request from settings panel
watch(modelSettingsRuntimeSnapshot, (snapshot) => {
  postModelSettingsRuntimeChannelEvent({ type: 'snapshot', snapshot })
}, { immediate: true })

watch(modelSettingsRuntimeChannelEvent, (event) => {
  if (event?.type !== 'request-current')
    return

  postModelSettingsRuntimeChannelEvent({ type: 'snapshot', snapshot: modelSettingsRuntimeSnapshot.value })
})

const settingsAudioDeviceStore = useSettingsAudioDevice()
const { stream, enabled } = storeToRefs(settingsAudioDeviceStore)
const { askPermission } = settingsAudioDeviceStore
const { startRecord, stopRecord, onStopRecord } = useAudioRecorder(stream)
const hearingPipeline = useHearingSpeechInputPipeline()
const { transcribeForRecording, transcribeForMediaStream, stopStreamingTranscription } = hearingPipeline
const { supportsStreamInput } = storeToRefs(hearingPipeline)
const chatSyncStore = useChatSyncStore()
const shouldUseStreamInput = computed(() => supportsStreamInput.value && !!stream.value)

const { init: initVAD, dispose: disposeVAD, start: startVAD, loaded: vadLoaded } = useVAD(workletUrl, {
  threshold: ref(0.6),
  onSpeechStart: () => {
    void handleSpeechStart()
  },
  onSpeechEnd: () => {
    void handleSpeechEnd()
  },
})

let stopOnStopRecord: (() => void) | undefined
const audioInteractionStarting = ref(false)

// Caption overlay broadcast channel
type CaptionChannelEvent
  = | { type: 'caption-speaker', text: string }
    | { type: 'caption-assistant', text: string }
const { post: postCaption } = useBroadcastChannel<CaptionChannelEvent, CaptionChannelEvent>({ name: 'airi-caption-overlay' })
function handleVisibilityChange() {
  if (!document.hidden) {
    studyCompanionStore.syncFromWallClock()
  }
}

function handleStreamingSentenceEnd(delta: string) {
  console.info('[Main Page] Received transcription delta:', delta)
  const finalText = delta
  if (!finalText || !finalText.trim()) {
    return
  }

  postCaption({ type: 'caption-speaker', text: finalText })

  void (async () => {
    try {
      console.info('[Main Page] Sending transcription to chat:', finalText)
      await chatSyncStore.requestIngest({ text: finalText })
    }
    catch (err) {
      console.error('[Main Page] Failed to send chat from voice:', err)
    }
  })()
}

function handleStreamingSpeechEnd(text: string) {
  console.info('[Main Page] Speech ended, final text:', text)
  postCaption({ type: 'caption-speaker', text })
}

async function handleSpeechStart() {
  if (shouldUseStreamInput.value) {
    console.info('Speech detected - transcription session should already be active')
    return
  }

  startRecord()
}

async function handleSpeechEnd() {
  if (shouldUseStreamInput.value) {
    // Keep streaming session alive; idle timer in pipeline will handle teardown.
    return
  }

  stopRecord()
}

async function startAudioInteraction() {
  if (audioInteractionStarting.value)
    return

  // NOTICE: `stopOnStopRecord` only tracks whether the non-stream recording hook was registered.
  //
  // It does NOT guarantee that the current realtime transcription session is still attached to the
  // latest `MediaStream`. We previously used it as a generic "already started" guard, which broke
  // the hearing-config retoggle path: the mic stream was recreated, VAD restarted on the new stream,
  // but `transcribeForMediaStream()` never reattached so speech was detected without any transcript.
  //
  // Keep the startup guard scoped to "startup in progress" only, and let stream changes restart the
  // transcription binding when a new stream arrives.
  audioInteractionStarting.value = true
  try {
    console.info('[Main Page] Starting audio interaction...')

    initVAD().then(() => {
      if (stream.value) {
        console.info('[Main Page] VAD initialized successfully, starting with stream input')
        return startVAD(stream.value)
      }
    }).catch((err) => {
      console.warn('[Main Page] VAD initialization failed (non-critical for Web Speech API):', err)
    })

    if (shouldUseStreamInput.value) {
      console.info('[Main Page] Starting streaming transcription...', {
        supportsStreamInput: supportsStreamInput.value,
        hasStream: !!stream.value,
      })

      if (!stream.value) {
        console.warn('[Main Page] Stream not available despite shouldUseStreamInput being true')
        return
      }

      // Use sentence deltas for live captions and speech end for final text.
      await transcribeForMediaStream(stream.value, {
        onSentenceEnd: handleStreamingSentenceEnd,
        onSpeechEnd: handleStreamingSpeechEnd,
      })

      console.info('[Main Page] Streaming transcription started successfully')
    }
    else {
      console.warn('[Main Page] Not starting streaming transcription:', {
        shouldUseStreamInput: shouldUseStreamInput.value,
        hasStream: !!stream.value,
        supportsStreamInput: supportsStreamInput.value,
      })
    }

    // NOTICE: This hook is only for record-then-transcribe providers.
    //
    // Streaming providers use the active `MediaStream` directly, so this callback must not be treated
    // as proof that a realtime session is alive. Future refactors should keep recorder-hook bookkeeping
    // separate from stream transcription state, otherwise mic/device re-toggles can leave VAD active
    // but transcription detached.
    //
    // Hook once for non-streaming providers.
    if (!stopOnStopRecord) {
      stopOnStopRecord = onStopRecord(async (recording) => {
        if (shouldUseStreamInput.value)
          return

        const text = await transcribeForRecording(recording)
        if (!text || !text.trim())
          return

        // Update caption overlay speaker text via BroadcastChannel
        postCaption({ type: 'caption-speaker', text })

        try {
          await chatSyncStore.requestIngest({ text })
        }
        catch (err) {
          console.error('Failed to send chat from voice:', err)
        }
      })
    }
  }
  catch (e) {
    console.error('Audio interaction init failed:', e)
  }
  finally {
    audioInteractionStarting.value = false
  }
}

function stopAudioInteraction() {
  tryCatch(() => {
    stopOnStopRecord?.()
    stopOnStopRecord = undefined
    audioInteractionStarting.value = false
    void stopStreamingTranscription(true)
    disposeVAD()
  })
}

watch(enabled, async (val) => {
  console.info('[Main Page] Audio enabled changed:', val, 'stream available:', !!stream.value)
  if (val) {
    await askPermission()
    await startAudioInteraction()
  }
  else {
    stopAudioInteraction()
  }
}, { immediate: true })

function handlePointerDown() {
  isPointerDown.value = true
}

function handlePointerUp() {
  isPointerDown.value = false
  isDraggingWindow.value = false
}

onMounted(() => {
  window.addEventListener('pointerdown', handlePointerDown, true)
  window.addEventListener('pointerup', handlePointerUp, true)
  window.addEventListener('pointercancel', handlePointerUp, true)

  if (live2DMouseIgnoreEmitter.shouldEmit(true))
    setIgnoreMouseEvents([true, { forward: true }])

  chatSyncStore.initialize('authority')
  if (onboardingStore.needsOnboarding) {
    openOnboarding()
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  live2DMouseIgnoreEmitter.reset()
  window.removeEventListener('pointerdown', handlePointerDown, true)
  window.removeEventListener('pointerup', handlePointerUp, true)
  window.removeEventListener('pointercancel', handlePointerUp, true)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  tryCatch(() => {
    postModelSettingsRuntimeChannelEvent({
      type: 'owner-gone',
      ownerInstanceId: modelSettingsRuntimeOwnerInstanceId,
    })
  })
  stopAudioInteraction()
  chatSyncStore.dispose()
})

watch(stream, async (currentStream) => {
  if (!enabled.value || !currentStream || audioInteractionStarting.value)
    return

  // NOTICE: The controls-island mic toggle and device changes can replace the underlying MediaStream
  // without reloading the page. When that happens, VAD may successfully restart against the new stream,
  // but any existing transcription transport is still bound to the old one. Always allow the page to
  // re-run `startAudioInteraction()` for a newly available stream unless startup is already underway.
  console.info('[Main Page] Stream became available, ensuring audio interaction is started')
  await startAudioInteraction()
})

watch([stream, () => vadLoaded.value], async ([s, loaded]) => {
  if (enabled.value && loaded && s) {
    try {
      await startVAD(s)
    }
    catch (e) {
      console.error('Failed to start VAD with stream:', e)
    }
  }
})

// Assistant caption is broadcast from Stage.vue via the same channel
</script>

<template>
  <div
    max-h="[100vh]"
    max-w="[100vw]"
    flex="~ col"
    relative h-full overflow-hidden rounded-xl
    transition="opacity duration-500 ease-in-out"
  >
    <!-- Stage is always in DOM so TresCanvas can measure dimensions -->
    <div
      :class="[
        'relative h-full w-full items-end gap-2',
        'transition-opacity duration-250 ease-in-out',
      ]"
    >
      <div
        :class="[
          shouldFadeOnCursorWithin ? 'op-0' : 'op-100',
          'absolute',
          'top-0 left-0 w-full h-full',
          'overflow-hidden',
          'rounded-2xl',
          'transition-opacity duration-250 ease-in-out',
        ]"
      >
        <StatusIsland ref="statusIslandRef" class="relative z-60" />
        <ResourceStatusIsland class="relative z-60" />
        <WidgetStage
          ref="widgetStageRef"
          v-model:state="componentStateStage"
          h-full w-full
          flex-1
          :paused="stagePaused"
          :focus-at="{ x: live2dLookAtX, y: live2dLookAtY }"
          :scale="scale"
          :x-offset="positionInPercentageString.x"
          :y-offset="positionInPercentageString.y"
        />
        <HoloCoupon />
        <StudyBubble
          :message="currentBubble"
          :lift-for-input="studyPanelInputActive"
        />
      </div>
    </div>
    <!-- Loading overlay sits on top, does not hide the stage -->
    <div v-show="isLoading" class="absolute left-0 top-0 z-99 h-full w-full flex cursor-grab items-center justify-center overflow-hidden">
      <div
        :class="[
          'absolute h-24 w-full overflow-hidden rounded-xl',
          'flex items-center justify-center',
          'bg-white/80 dark:bg-neutral-950/80',
          'backdrop-blur-md',
        ]"
      >
        <div
          :class="[
            'drag-region',
            'absolute left-0 top-0',
            'h-full w-full flex items-center justify-center',
            'text-1.5rem text-primary-600 dark:text-primary-400 font-normal',
            'select-none',
            'animate-flash animate-duration-5s animate-count-infinite',
          ]"
        >
          Loading...
        </div>
      </div>
    </div>
  </div>
  <div
    data-control-layer="floating-controls-layer"
    :class="[
      'pointer-events-none fixed inset-0 z-[170]',
      '[-webkit-app-region:no-drag]',
    ]"
  >
    <ControlsIsland
      ref="controlsIslandRef"
      class="pointer-events-auto"
    />
  </div>
  <div
    data-control-layer="floating-content-panels-layer"
    :class="[
      'pointer-events-none fixed inset-0 z-[185]',
      '[-webkit-app-region:no-drag]',
    ]"
  >
    <StageFloatingPanel
      v-if="studyPanelActivated"
      v-show="studyPanelOpen"
      :ref="bindStudyFloatingPanelRef"
      panel-kind="study"
      title="学习陪伴"
      @close="closeStudyFloatingPanel"
    >
      <StudyIsland
        @interaction-lock-change="handleStudyPanelInteractionLock"
        @close="closeStudyFloatingPanel"
      />
    </StageFloatingPanel>

    <StageFloatingPanel
      v-if="visionPanelActivated"
      v-show="visionPanelOpen"
      :ref="bindVisionFloatingPanelRef"
      panel-kind="vision"
      title="视觉感知"
      @close="closeVisionFloatingPanel"
    >
      <VisionIsland
        embedded
        :ui-mode="controlsUIMode"
        @camera-running-change="handleVisionCameraRunningChange"
      />
    </StageFloatingPanel>
  </div>
  <StageMoveOverlay
    :enabled="moveModeEnabled && !isLoading"
    :is-linux="isLinuxRef"
    @start-drag="handleMoveOverlayDragStart"
  />
  <Transition
    enter-active-class="transition-opacity duration-250 ease-in-out"
    enter-from-class="opacity-50"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-250 ease-in-out"
    leave-from-class="opacity-100"
    leave-to-class="opacity-50"
  >
    <div v-if="isAroundWindowBorderFor250Ms && !isLoading" class="pointer-events-none absolute left-0 top-0 z-999 h-full w-full">
      <div
        :class="[
          'b-primary/50',
          'h-full w-full animate-flash animate-duration-3s animate-count-infinite b-4 rounded-2xl',
        ]"
      />
    </div>
  </Transition>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>
