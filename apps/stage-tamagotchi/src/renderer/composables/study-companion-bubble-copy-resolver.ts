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
    '好，先专注一小会儿。',
    '我会安静陪着你。',
    '开始啦，把注意力轻轻放回这一件事上。',
    '先把手头的事做完吧，一件一件来。',
    '慢慢进入状态就好，不用急。',
    '慢慢来，不着急，我就在这里。',
    '把注意力轻轻收回来，我们开始了。',
    '放轻松，这一段时间只属于你。',
  ],
  focus_started_demo: [
    '演示模式已开，我们先体验一小轮。',
    '演示节奏开始啦，先专注这一分钟就好。',
    '先热热身，熟悉一下节奏。',
    '我们先温柔地走一小轮，不赶时间。',
    '不着急，慢慢熟悉就好。',
    '先感受一下，不用有压力。',
    '这只是体验，放轻松就好。',
  ],
  session_paused: [
    '暂停一下也没关系，回来继续就好。',
    '先停在这里，我帮你记着进度呢。',
    '先缓一缓，等你准备好了再继续。',
    '临时停一下，我们稍后接上。',
    '暂停也是过程的一部分，不用着急。',
    '没关系，休息一下再继续也不迟。',
    '我在这儿等你，什么时候回来都可以。',
  ],
  session_resumed: [
    '欢迎回来，我们接着做。',
    '好，按原来的节奏继续就好。',
    '不急，我们慢慢回到刚才的节奏。',
    '回来了就好，继续吧。',
    '状态找回来了吗？我们慢慢开始。',
    '没关系，从哪里接上都可以。',
    '我一直在，我们继续。',
  ],
  focus_reset: [
    '这一轮先重来，没关系的。',
    '重新开始也是一种调整呢。',
    '先重置一下，再稳稳地开始。',
    '这一段我们再来一次，不着急。',
    '没关系，重新来过也挺好的。',
    '清空一下，我们再试一次。',
    '不必在意，我们重新开始就好。',
  ],
  focus_completed: [
    '这一轮完成了，先让眼睛休息一下吧。',
    '完成一轮，做得不错。可以短暂离开屏幕了。',
    '专注结束，喝口水再回来吧。',
    '这一段收尾了，稍微放松一下。',
    '这一轮拿下了，先活动活动吧。',
    '辛苦啦，给自己一个小小的停顿。',
    '做得很好，现在属于你自己的时间到了。',
  ],
  break_started: [
    '休息时间到了，别盯着屏幕啦。',
    '短暂休息一下，我在这儿等你回来。',
    '活动一下肩颈，再继续也不迟。',
    '先离开屏幕片刻，待会儿继续。',
    '休息这一段，让注意力慢慢回一回。',
    '放下手头的事，给自己喘口气。',
    '这是属于你的休息时间，不用想别的。',
  ],
  break_completed: [
    '休息结束，可以准备下一轮了。',
    '回来啦，要不要继续一小段？',
    '状态恢复一点了吗？可以开始下一轮了。',
    '这一段休息完成了，我们接着来。',
    '准备好了就继续，我在这儿等你。',
    '感觉好些了吗？我们随时可以开始。',
    '休息够了的话，我们慢慢进入状态吧。',
  ],
  task_completed: [
    '完成一项，继续保持这个节奏。',
    '这项任务已经拿下了，真不错。',
    '很好，清单又少了一项呢。',
    '做得好，这项已经完成啦。',
    '这一项结束了，节奏保持得不错。',
    '又迈出了一小步，继续加油。',
    '完成的感觉很好吧？我们慢慢来。',
  ],
  task_overload: [
    '任务有点多，先选一项开始就好。',
    '先别被清单吓到，挑最小的一步开始。',
    '先做最关键的一项吧。',
    '先挑一项最小动作，马上动起来。',
    '不用想全部，先做眼前这一件。',
    ' overwhelmed 的时候，从最小的一步开始。',
    '清单很长，但一次只做一件就够了。',
  ],
  muted: [
    '好，我先安静一会儿。',
    '收到，接下来少打扰你。',
    '明白了，我会更克制地提醒。',
    '已切换到静音陪伴模式。',
    '我会安静地陪着你，有需要随时叫我。',
    '好，我在旁边，不打扰你。',
    '知道了，需要的时候我就在。',
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
        text: `第 ${nextRound} 轮开始，节奏很不错。`,
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
        text: `今天已累计 ${snapshot.todayFocusMinutes} 分钟，状态很好。`,
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
