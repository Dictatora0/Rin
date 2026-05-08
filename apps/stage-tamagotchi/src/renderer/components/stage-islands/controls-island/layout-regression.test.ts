import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const controlsIslandSourcePath = new URL('./index.vue', import.meta.url)
const controlsIslandSource = readFileSync(controlsIslandSourcePath, 'utf-8')

/**
 * ROOT CAUSE:
 *
 * The controls drawer width grows when embedded vision panel is shown.
 * If the 3-column grid stretches with parent width, icon positions look "shuffled"
 * even though DOM order is unchanged.
 *
 * We lock the grid with `w-max self-start` so panel expansion does not distort
 * top-row control button spacing.
 */
describe('controls island layout regression locks', () => {
  it('keeps the top control grid width locked when vision panel is visible', () => {
    expect(controlsIslandSource).toContain('<div class="w-max self-start" grid grid-cols-3 gap-2>')
  })

  it('keeps vision entry as a regular top-grid control button', () => {
    const cameraButtonIndex = controlsIslandSource.indexOf('i-solar:camera-outline')
    const closeButtonIndex = controlsIslandSource.indexOf('i-solar:close-circle-outline')
    const visionPanelIndex = controlsIslandSource.indexOf('<VisionIsland v-if="visionPanelVisible" embedded />')

    expect(cameraButtonIndex).toBeGreaterThan(-1)
    expect(closeButtonIndex).toBeGreaterThan(cameraButtonIndex)
    expect(visionPanelIndex).toBeGreaterThan(closeButtonIndex)
  })
})
