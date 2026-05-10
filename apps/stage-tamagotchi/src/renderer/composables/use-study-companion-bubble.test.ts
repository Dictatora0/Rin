import { createDefaultStudyCompanionPersisted } from '@proj-airi/stage-ui/stores/modules/study-companion'
import { describe, expect, it } from 'vitest'

import { STUDY_BUBBLE_COPY_BY_EVENT } from './study-companion-bubble-copy-resolver'
import {
  createStudyBubbleCopyHistory,
  createStudyBubblePolicyHistory,
  createTaskOverloadBubblePayload,
  resolveStudyBubbleText,
  shouldShowStudyBubble,
} from './use-study-companion-bubble'

function createSnapshot() {
  return createDefaultStudyCompanionPersisted()
}

describe('resolveStudyBubbleText', () => {
  it('returns contextual copy for focus_started in first round, later rounds, and demo mode', () => {
    const history = createStudyBubbleCopyHistory()

    const firstRound = createSnapshot()
    firstRound.todayFocusSessions = 0
    const firstRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, firstRound, history)
    expect(firstRoundCopy?.text).toBe('第一轮开始，先进入状态。')

    const laterRound = createSnapshot()
    laterRound.todayFocusSessions = 2
    const laterRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, laterRound, history)
    expect(laterRoundCopy?.text).toBe('第 3 轮开始，节奏已经不错了。')

    const demoRound = createSnapshot()
    demoRound.todayFocusSessions = 1
    demoRound.demoModeEnabled = true
    const demoRoundCopy = resolveStudyBubbleText({ type: 'focus_started' }, demoRound, history)
    expect(STUDY_BUBBLE_COPY_BY_EVENT.focus_started_demo.includes(demoRoundCopy?.text ?? '')).toBe(true)
  })

  it('returns task_completed copy based on pending task count', () => {
    const history = createStudyBubbleCopyHistory()

    const allDone = createSnapshot()
    allDone.tasks = [{ id: '1', title: 'A', done: true, createdAt: Date.now(), completedAt: Date.now() }]
    const allDoneCopy = resolveStudyBubbleText({ type: 'task_completed' }, allDone, history)
    expect(allDoneCopy?.text).toBe('今日任务清空了，可以轻松一点。')

    const pendingTasks = createSnapshot()
    pendingTasks.tasks = [
      { id: '1', title: 'A', done: true, createdAt: Date.now(), completedAt: Date.now() },
      { id: '2', title: 'B', done: false, createdAt: Date.now() },
      { id: '3', title: 'C', done: false, createdAt: Date.now() },
    ]
    const pendingCopy = resolveStudyBubbleText({ type: 'task_completed' }, pendingTasks, history)
    expect(pendingCopy?.text).toBe('还剩 2 项，先挑最重要的一项。')
  })

  it('avoids repeating the same copy in the latest two messages for one event type', () => {
    const history = createStudyBubbleCopyHistory()
    const snapshot = createSnapshot()

    const first = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)
    const second = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)
    const third = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, history)

    expect(first?.text).not.toBe(second?.text)
    expect(first?.text).not.toBe(third?.text)
    expect(second?.text).not.toBe(third?.text)
  })

  it('prefers unseen copy lines before recycling used lines for the same event', () => {
    const history = createStudyBubbleCopyHistory()
    const snapshot = createSnapshot()
    const expectedUniqueCount = STUDY_BUBBLE_COPY_BY_EVENT.session_resumed.length
    const seen = new Set<string>()

    for (let index = 0; index < expectedUniqueCount; index += 1) {
      const payload = resolveStudyBubbleText({ type: 'session_resumed' }, snapshot, history)
      expect(payload?.text).toBeDefined()
      seen.add(payload!.text)
      expect(seen.size).toBe(index + 1)
    }
  })
})

describe('shouldShowStudyBubble', () => {
  it('applies the default 30s throttle window', () => {
    const history = createStudyBubblePolicyHistory()
    const payload = {
      text: '暂停一下也没关系，回来继续就好。',
      kind: 'focus' as const,
      throttleKey: 'session_paused',
      critical: false,
    }

    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 1000 }, history)).toBe(true)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 20_000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 31_500 }, history)).toBe(true)
  })

  it('applies the 5-minute throttle window for task_overload', () => {
    const copyHistory = createStudyBubbleCopyHistory()
    const policyHistory = createStudyBubblePolicyHistory()
    const payload = createTaskOverloadBubblePayload(copyHistory)

    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 1000 }, policyHistory)).toBe(true)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 240_000 }, policyHistory)).toBe(false)
    expect(shouldShowStudyBubble(payload, { mode: 'idle', isMuted: false, now: 301_000 }, policyHistory)).toBe(true)
  })

  it('suppresses non-critical bubbles when muted and allows critical bubbles', () => {
    const history = createStudyBubblePolicyHistory()
    const nonCritical = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }
    const critical = {
      text: '这一轮完成了，先让眼睛休息一下吧。',
      kind: 'focus' as const,
      throttleKey: 'focus_completed',
      critical: true,
    }

    expect(shouldShowStudyBubble(nonCritical, { mode: 'idle', isMuted: true, now: 1000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(critical, { mode: 'idle', isMuted: true, now: 2000 }, history)).toBe(true)
  })

  it('suppresses non-critical bubbles during focus mode except focus_started', () => {
    const history = createStudyBubblePolicyHistory()
    const paused = {
      text: '先停在这里，我帮你记着进度。',
      kind: 'focus' as const,
      throttleKey: 'session_paused',
      critical: false,
    }
    const started = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }

    expect(shouldShowStudyBubble(paused, { mode: 'focus', isMuted: false, now: 1000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(started, { mode: 'focus', isMuted: false, now: 2000 }, history)).toBe(true)
  })

  it('suppresses repeated copy text within the same cooldown window', () => {
    const history = createStudyBubblePolicyHistory()
    const firstPayload = {
      text: '好，先专注这一小段。',
      kind: 'focus' as const,
      throttleKey: 'focus_started',
      critical: false,
    }
    const secondPayload = {
      text: '好，先专注这一小段。',
      kind: 'task' as const,
      throttleKey: 'task_completed',
      critical: true,
    }

    expect(shouldShowStudyBubble(firstPayload, { mode: 'idle', isMuted: false, now: 1000 }, history)).toBe(true)
    expect(shouldShowStudyBubble(secondPayload, { mode: 'idle', isMuted: false, now: 10_000 }, history)).toBe(false)
    expect(shouldShowStudyBubble(secondPayload, { mode: 'idle', isMuted: false, now: 32_000 }, history)).toBe(true)
  })

  it('replays key study scenes with copy variety, throttle, and mute suppression', () => {
    const snapshot = createSnapshot()
    snapshot.tasks = [
      { id: '1', title: 'A', done: true, createdAt: Date.now(), completedAt: Date.now() },
      { id: '2', title: 'B', done: false, createdAt: Date.now() },
    ]

    const copyHistory = createStudyBubbleCopyHistory()
    const policyHistory = createStudyBubblePolicyHistory()
    const shownTexts: string[] = []
    let now = 1000

    const focusStartedPayload = resolveStudyBubbleText({ type: 'focus_started' }, snapshot, copyHistory)
    expect(focusStartedPayload).not.toBeNull()
    snapshot.mode = 'focus'
    expect(shouldShowStudyBubble(focusStartedPayload!, { mode: snapshot.mode, isMuted: false, now }, policyHistory)).toBe(true)
    shownTexts.push(focusStartedPayload!.text)

    now += 31_000
    snapshot.mode = 'idle'
    snapshot.todayFocusSessions = 1
    snapshot.todayFocusMinutes = 25
    const focusCompletedPayload = resolveStudyBubbleText({ type: 'focus_completed' }, snapshot, copyHistory)
    expect(focusCompletedPayload).not.toBeNull()
    expect(shouldShowStudyBubble(focusCompletedPayload!, { mode: snapshot.mode, isMuted: false, now }, policyHistory)).toBe(true)
    shownTexts.push(focusCompletedPayload!.text)

    now += 31_000
    snapshot.mode = 'break'
    const breakStartedPayload = resolveStudyBubbleText({ type: 'break_started' }, snapshot, copyHistory)
    expect(breakStartedPayload).not.toBeNull()
    expect(shouldShowStudyBubble(breakStartedPayload!, { mode: snapshot.mode, isMuted: false, now }, policyHistory)).toBe(true)
    shownTexts.push(breakStartedPayload!.text)

    now += 31_000
    snapshot.mode = 'idle'
    const taskCompletedPayload = resolveStudyBubbleText({ type: 'task_completed' }, snapshot, copyHistory)
    expect(taskCompletedPayload).not.toBeNull()
    expect(shouldShowStudyBubble(taskCompletedPayload!, { mode: snapshot.mode, isMuted: false, now }, policyHistory)).toBe(true)
    shownTexts.push(taskCompletedPayload!.text)

    for (let index = 1; index < shownTexts.length; index += 1)
      expect(shownTexts[index]).not.toBe(shownTexts[index - 1])

    now += 1_000
    snapshot.mode = 'idle'
    snapshot.mutedUntil = now + 60_000
    const pausedPayload = resolveStudyBubbleText({ type: 'session_paused' }, snapshot, copyHistory)
    expect(pausedPayload).not.toBeNull()
    expect(shouldShowStudyBubble(pausedPayload!, { mode: snapshot.mode, isMuted: true, now }, policyHistory)).toBe(false)

    now += 31_000
    const mutedPayload = resolveStudyBubbleText({ type: 'muted' }, snapshot, copyHistory)
    expect(mutedPayload).not.toBeNull()
    expect(shouldShowStudyBubble(mutedPayload!, { mode: snapshot.mode, isMuted: true, now }, policyHistory)).toBe(true)

    now += 2_000
    const mutedPayloadAgain = resolveStudyBubbleText({ type: 'muted' }, snapshot, copyHistory)
    expect(mutedPayloadAgain).not.toBeNull()
    expect(shouldShowStudyBubble(mutedPayloadAgain!, { mode: snapshot.mode, isMuted: true, now }, policyHistory)).toBe(false)
  })
})
