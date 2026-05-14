import path from 'node:path'

import { existsSync, readFileSync, statSync } from 'node:fs'

const appRoot = path.resolve(import.meta.dirname, '..')
const repoRoot = path.resolve(appRoot, '..', '..')
const builderConfigPath = path.join(appRoot, 'electron-builder.config.ts')
const viteConfigPath = path.join(appRoot, 'electron.vite.config.ts')
const buildDir = path.join(appRoot, 'build')

/**
 * @typedef {'PASS' | 'WARN' | 'FAIL'} CheckLevel
 */

/**
 * @typedef {{
 *   level: CheckLevel
 *   label: string
 *   detail: string
 * }} CheckResult
 */

/** @type {CheckResult[]} */
const results = []

function push(level, label, detail) {
  results.push({ level, label, detail })
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8')
}

function fileExists(filePath) {
  return existsSync(filePath)
}

function fileHasContent(filePath) {
  if (!fileExists(filePath))
    return false

  try {
    return statSync(filePath).isFile() && statSync(filePath).size > 0
  }
  catch {
    return false
  }
}

function directoryExists(dirPath) {
  if (!fileExists(dirPath))
    return false

  try {
    return statSync(dirPath).isDirectory()
  }
  catch {
    return false
  }
}

const builderConfigText = readText(builderConfigPath)
const viteConfigText = readText(viteConfigPath)

if (/productName:\s*['"]AIRI['"]/.test(builderConfigText)) {
  push('FAIL', 'productName', 'electron-builder.config.ts still uses AIRI as the visible productName.')
}
else if (/productName:\s*['"]Rin(?: Desktop Pet)?['"]/.test(builderConfigText)) {
  push('PASS', 'productName', 'Visible productName is set to Rin.')
}
else {
  push('WARN', 'productName', 'Visible productName was not matched explicitly. Verify the user-facing app name manually.')
}

const dmgArtifactNameMatch = builderConfigText.match(/artifactName:\s*['"]([^'"]+)['"]/g) ?? []
const dmgArtifactContainsAiri = dmgArtifactNameMatch.some(entry => /AIRI|Airi|airi/.test(entry))
if (dmgArtifactContainsAiri) {
  push('FAIL', 'artifactName', 'AIRI still appears in a configured artifactName template.')
}
else {
  push('PASS', 'artifactName', 'Artifact naming templates do not contain AIRI.')
}

const permissionLines = builderConfigText
  .split('\n')
  .filter(line => line.includes('NSMicrophoneUsageDescription') || line.includes('NSCameraUsageDescription') || line.includes('NSNotifications'))

if (permissionLines.some(line => /AIRI|Airi|airi/.test(line))) {
  push('FAIL', 'macOS permission copy', 'AIRI still appears in macOS permission prompt copy.')
}
else {
  push('PASS', 'macOS permission copy', 'macOS permission prompt copy uses Rin branding.')
}

const iconPaths = [
  path.join(buildDir, 'icon.icns'),
  path.join(buildDir, 'icon.ico'),
  path.join(buildDir, 'icon.png'),
  path.join(buildDir, 'icon.icon', 'icon.json'),
]

const missingIcons = iconPaths.filter(iconPath => !fileHasContent(iconPath))
if (missingIcons.length > 0) {
  push('FAIL', 'icon resources', `Missing or empty icon resource files:\n- ${missingIcons.join('\n- ')}`)
}
else {
  push('PASS', 'icon resources', 'Required desktop icon resources are present.')
}

const visionAssetsRoot = path.join(appRoot, 'src', 'renderer', 'public', 'assets', 'vision')
if (directoryExists(visionAssetsRoot)) {
  push('PASS', 'vision assets', 'Local vision assets directory exists.')
}
else if (viteConfigText.includes('assets/vision')) {
  push('WARN', 'vision assets', 'Vision assets directory is missing locally. Build-time asset verification is configured and may fail until resources are restored.')
}
else {
  push('WARN', 'vision assets', 'Vision assets directory was not found. Verify whether the project expects them in another path.')
}

const godotBuildRoot = path.join(repoRoot, 'engines', 'stage-tamagotchi-godot', 'build')
if (directoryExists(godotBuildRoot)) {
  push('PASS', 'godot extraResources', 'Godot build directory exists for extraResources packaging.')
}
else if (builderConfigText.includes('stage-tamagotchi-godot/build/${os}')) {
  push(
    'FAIL',
    'godot extraResources',
    [
      'Configured Godot extraResources build directory is missing in this workspace.',
      'electron-builder will only warn when copying a missing source, but Rin expects the packaged Godot stage binary at runtime under process.resourcesPath/godot-stage.',
      'Generate engines/stage-tamagotchi-godot/build/${os} before creating a release build.',
    ].join('\n'),
  )
}
else {
  push('WARN', 'godot extraResources', 'No local Godot build directory found. Verify extraResources manually.')
}

const failCount = results.filter(result => result.level === 'FAIL').length
const warnCount = results.filter(result => result.level === 'WARN').length

for (const result of results) {
  console.log(`${result.level}  ${result.label}`)
  console.log(`      ${result.detail.replace(/\n/g, '\n      ')}`)
}

console.log('')
console.log(`Summary: ${results.length} checks, ${failCount} fail, ${warnCount} warn.`)

if (failCount > 0) {
  process.exitCode = 1
}
