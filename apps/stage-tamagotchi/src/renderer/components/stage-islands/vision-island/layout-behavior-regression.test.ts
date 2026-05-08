import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const sourcePath = new URL('./index.vue', import.meta.url)
const source = readFileSync(sourcePath, 'utf-8')

describe('vision-island source regression locks', () => {
  it('keeps privacy guidance and gesture mapping content visible in panel', () => {
    expect(source).toContain('Open Palm: quiet Rin visually')
    expect(source).toContain('Victory: trigger Rin celebration')
    expect(source).toContain('Thumbs Up: acknowledge current prompt')
    expect(source).toContain('摄像头默认关闭。')
    expect(source).toContain('识别仅在本地运行。')
    expect(source).toContain('不会上传任何摄像头数据。')
  })

  it('keeps camera toggle and enrollment actions wired in script', () => {
    expect(source).toContain('function toggleCamera()')
    expect(source).toContain('if (isEnabled.value)')
    expect(source).toContain('void stop()')
    expect(source).toContain('void start()')
    expect(source).toContain('function openEnrollmentPage()')
    expect(source).toContain('router.push(\'/vision-enrollment\')')
    expect(source).toContain('function handlePrewarmVision()')
    expect(source).toContain('await prewarmVisionModels()')
  })

  it('keeps pet feedback, gate status, and quiet countdown sections in template', () => {
    expect(source).toContain('Pet feedback')
    expect(source).toContain('Current pet state:')
    expect(source).toContain('Quiet remaining seconds:')
    expect(source).toContain('Celebration count:')
    expect(source).toContain('Gesture detected but pet feedback gated.')
    expect(source).toContain('本地人脸门控')
    expect(source).toContain('门控状态：')
    expect(source).toContain('交互结果：')
    expect(source).toContain('Vision Diagnostics')
    expect(source).toContain('cameraPermission:')
    expect(source).toContain('MediaPipe:')
    expect(source).toContain('OpenCV:')
    expect(source).toContain('lastError:')
  })
})
