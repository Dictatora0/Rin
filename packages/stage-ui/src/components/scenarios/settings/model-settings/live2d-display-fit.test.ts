import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

describe('live2d model settings display-fit section', () => {
  it('renders display fit section with three preference options and store binding', () => {
    const source = readFileSync(new URL('./live2d.vue', import.meta.url), 'utf8')

    expect(source).toContain('settings.live2d.display-fit.title')
    expect(source).toContain('settings.live2d.display-fit.description')
    expect(source).toContain('settings.live2d.display-fit.options.auto')
    expect(source).toContain('settings.live2d.display-fit.options.full-body')
    expect(source).toContain('settings.live2d.display-fit.options.upper-body')
    expect(source).toContain('v-model="live2dFitPreference"')
    expect(source).toContain('value: \'auto\'')
    expect(source).toContain('value: \'full-body\'')
    expect(source).toContain('value: \'upper-body\'')
  })
})
