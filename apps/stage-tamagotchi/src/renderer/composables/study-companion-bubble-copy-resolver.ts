import type { StudyCompanionPersisted, StudyEventLogEntry } from '@proj-airi/stage-ui/stores/modules/study-companion'

export type BubbleKind = 'focus' | 'break' | 'task' | 'reminder' | 'quiet'

export interface StudyBubblePayload {
  text: string
  kind: BubbleKind
  throttleKey: string
  critical: boolean
  throttleMs?: number
}

export interface StudyBubbleCopyHistory {
  recentCopyMemory: Map<string, string[]>
  usedCopyMemory: Map<string, Set<string>>
}

const TASK_OVERLOAD_THROTTLE_MS = 5 * 60 * 1000

export const STUDY_BUBBLE_COPY_BY_EVENT: Record<string, string[]> = {
  focus_started: [
    '好，先专注一小会。',
    '我会安静陪着你。',
    '开始啦，把注意力放回这一件事上。',
    '先把手头的事做完吧。',
    '慢慢进入状态吧。',
    '慢慢来，不着急，我就在这里。',
    '把注意力轻轻收回来就好。',
  ],
  focus_started_demo: [
    '演示模式已开，我们先体验一小轮。',
    '演示节奏开始啦，先专注这一分钟。',
    '热身一下吧。',
    '我们先温柔地走一小轮。',
    '不着急，先熟悉一下节奏。',
  ],
  session_paused: [
    '暂停一下也没关系，回来继续就好。',
    '先停在这里，我帮你记着进度。',
    '先缓一缓，等你回来继续。',
    '临时停一下，我们稍后接上。',
    '暂停也是过程的一部分，不用急。',
  ],
  session_resumed: [
    '欢迎回来，我们接着做。',
    '好，按原节奏继续。',
    '不急，我们慢慢回到刚才的节奏。',
    '回来了就好，继续吧。',
  ],
  focus_reset: [
    '这一轮先重来，没关系。',
    '重新开始也算一种调整。',
    '先重置一下，再稳稳开始。',
    '这一段我们再来一次。',
  ],
  focus_completed: [
    '这一轮完成了，先让眼睛休息一下吧。',
    '完成一轮，做得不错。可以短暂离开屏幕。',
    '专注结束，喝口水再回来。',
    '这一段收尾了，稍微放松一下。',
    '这一轮拿下了，先活动一下。',
  ],
  break_started: [
    '休息时间到了，别盯着屏幕。',
    '短暂休息一下，我等你回来。',
    '活动一下肩颈，再继续。',
    '先离开屏幕片刻，待会继续。',
    '休息这一段，让注意力回一回。',
  ],
  break_completed: [
    '休息结束，可以准备下一轮了。',
    '回来啦，要不要继续一小段？',
    '状态恢复一点了吗？可以开始下一轮。',
    '这一段休息完成了，我们接着来。',
    '准备好了就继续，我在这等你。',
  ],
  task_completed: [
    '完成一项，继续保持。',
    '这项任务已经拿下了。',
    '很好，清单又少了一项。',
    '做得好，这项已经完成。',
    '这一项结束了，节奏不错。',
  ],
  task_overload: [
    '任务有点多，先选 1 项开始。',
    '先别被清单吓到，挑最小的一步就好。',
    '列表先不全看，先做最关键的一项。',
    '先挑一项最小动作，马上开始。',
  ],
  muted: [
    '好，我先安静一会儿。',
    '收到，接下来少打扰你。',
    '明白了，我会更克制提醒。',
    '已切到静音陪伴模式。',
  ],
}

function pickCopyWithHistory(eventKey: string, candidates: string[], history: StudyBubbleCopyHistory): string {
  const recent = history.recentCopyMemory.get(eventKey) ?? []
  const used = history.usedCopyMemory.get(eventKey) ?? new Set<string>()
  const unseen = candidates.filter(text => !used.has(text))
  const preferredPool = unseen.length > 0 ? unseen : candidates
  const available = preferredPool.filter(text => !recent.includes(text))
  const pool = available.length > 0 ? available : preferredPool
  const index = Math.floor(Math.random() * pool.length)
  const selected = pool[index] ?? pool[0] ?? ''

  used.add(selected)
  history.usedCopyMemory.set(eventKey, used)

  const nextRecent = [...recent, selected].slice(-2)
  history.recentCopyMemory.set(eventKey, nextRecent)

  return selected
}

function getTaskPending(snapshot: StudyCompanionPersisted): number {
  return snapshot.tasks.filter(task => !task.done).length
}

export function createStudyBubbleCopyHistory(): StudyBubbleCopyHistory {
  return {
    recentCopyMemory: new Map<string, string[]>(),
    usedCopyMemory: new Map<string, Set<string>>(),
  }
}

export function resolveStudyBubbleText(
  event: StudyEventLogEntry | { type: string },
  snapshot: StudyCompanionPersisted,
  history: StudyBubbleCopyHistory,
): StudyBubblePayload | null {
  if (event.type === 'focus_started') {
    const nextRound = snapshot.todayFocusSessions + 1
    if (snapshot.todayFocusSessions === 0) {
      return {
        text: '第一轮开始，先进入状态。',
        kind: 'focus',
        throttleKey: 'focus_started',
        critical: false,
      }
    }

    if (snapshot.todayFocusSessions >= 2) {
      return {
        text: `第 ${nextRound} 轮开始，节奏已经不错了。`,
        kind: 'focus',
        throttleKey: 'focus_started',
        critical: false,
      }
    }

    const copyKey = snapshot.demoModeEnabled ? 'focus_started_demo' : 'focus_started'
    return {
      text: pickCopyWithHistory(copyKey, STUDY_BUBBLE_COPY_BY_EVENT[copyKey]!, history),
      kind: 'focus',
      throttleKey: 'focus_started',
      critical: false,
    }
  }

  if (event.type === 'session_paused') {
    return {
      text: pickCopyWithHistory('session_paused', STUDY_BUBBLE_COPY_BY_EVENT.session_paused, history),
      kind: 'focus',
      throttleKey: 'session_paused',
      critical: false,
    }
  }

  if (event.type === 'session_resumed') {
    return {
      text: pickCopyWithHistory('session_resumed', STUDY_BUBBLE_COPY_BY_EVENT.session_resumed, history),
      kind: 'focus',
      throttleKey: 'session_resumed',
      critical: false,
    }
  }

  if (event.type === 'focus_reset') {
    return {
      text: pickCopyWithHistory('focus_reset', STUDY_BUBBLE_COPY_BY_EVENT.focus_reset, history),
      kind: 'focus',
      throttleKey: 'focus_reset',
      critical: false,
    }
  }

  if (event.type === 'focus_completed') {
    if (snapshot.todayFocusSessions >= 2) {
      return {
        text: `今天已经完成 ${snapshot.todayFocusSessions} 轮了，节奏很好。`,
        kind: 'focus',
        throttleKey: 'focus_completed',
        critical: true,
      }
    }
    if (snapshot.todayFocusMinutes >= 50) {
      return {
        text: `今天已累计 ${snapshot.todayFocusMinutes} 分钟，状态很稳。`,
        kind: 'focus',
        throttleKey: 'focus_completed',
        critical: true,
      }
    }

    return {
      text: pickCopyWithHistory('focus_completed', STUDY_BUBBLE_COPY_BY_EVENT.focus_completed, history),
      kind: 'focus',
      throttleKey: 'focus_completed',
      critical: true,
    }
  }

  if (event.type === 'break_started') {
    return {
      text: pickCopyWithHistory('break_started', STUDY_BUBBLE_COPY_BY_EVENT.break_started, history),
      kind: 'break',
      throttleKey: 'break_started',
      critical: false,
    }
  }

  if (event.type === 'break_completed') {
    if (snapshot.demoModeEnabled) {
      return {
        text: '演示休息结束了，我们继续下一轮。',
        kind: 'break',
        throttleKey: 'break_completed',
        critical: true,
      }
    }

    return {
      text: pickCopyWithHistory('break_completed', STUDY_BUBBLE_COPY_BY_EVENT.break_completed, history),
      kind: 'break',
      throttleKey: 'break_completed',
      critical: true,
    }
  }

  if (event.type === 'task_completed') {
    const pending = getTaskPending(snapshot)
    if (pending === 0) {
      return {
        text: '今日任务清空了，可以轻松一点。',
        kind: 'task',
        throttleKey: 'task_completed',
        critical: true,
      }
    }

    if (pending > 0) {
      return {
        text: `还剩 ${pending} 项，先挑最重要的一项。`,
        kind: 'task',
        throttleKey: 'task_completed',
        critical: true,
      }
    }

    return {
      text: pickCopyWithHistory('task_completed', STUDY_BUBBLE_COPY_BY_EVENT.task_completed, history),
      kind: 'task',
      throttleKey: 'task_completed',
      critical: true,
    }
  }

  if (event.type === 'muted') {
    return {
      text: pickCopyWithHistory('muted', STUDY_BUBBLE_COPY_BY_EVENT.muted, history),
      kind: 'quiet',
      throttleKey: 'muted',
      critical: true,
    }
  }

  return null
}

export function createTaskOverloadBubblePayload(history: StudyBubbleCopyHistory): StudyBubblePayload {
  return {
    text: pickCopyWithHistory('task_overload', STUDY_BUBBLE_COPY_BY_EVENT.task_overload, history),
    kind: 'task',
    throttleKey: 'task_overload',
    critical: false,
    throttleMs: TASK_OVERLOAD_THROTTLE_MS,
  }
}
