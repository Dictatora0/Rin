import type { SystemMessage } from '@xsai/shared-chat'

import { EMOTION_EmotionMotionName_value, EMOTION_VALUES } from '../emotions'

function message(prefix: string, suffix: string) {
  return {
    role: 'system',
    content: [
      prefix,
      EMOTION_VALUES
        .map(emotion => `- ${emotion} (Emotion for feeling ${EMOTION_EmotionMotionName_value[emotion]})`)
        .join('\n'),
      suffix,
    ].join('\n\n'),
  } satisfies SystemMessage
}

// 新增 Rin 的系统提示函数（无原有情绪列表，聚焦状态语义）
function rinMessage(prefix: string, suffix: string) {
  const cleanPrefix = prefix.replace(/''/g, '\'')
  const cleanSuffix = suffix.replace(/''/g, '\'')

  return {
    role: 'system',
    content: [
      cleanPrefix,
      // 定义 Rin 的6种状态语义说明
      `- normal: Default state, gentle encouragement with short sentences`,
      `- focused: No active speech, short replies only when user initiates`,
      `- remind: Gentle rest/water reminders, soft and short`,
      `- happy: Cheerful short sentences for user's progress`,
      `- tired: Comforting words for user's fatigue`,
      `- confused: Patient short guidance for user's doubts`,
      cleanSuffix,
    ].join('\n\n'),
  } satisfies SystemMessage
}

export default message
export { rinMessage }
