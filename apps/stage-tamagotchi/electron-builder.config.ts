/* eslint-disable no-template-curly-in-string */

import type { Configuration } from 'electron-builder'

import os from 'node:os'
import path from 'node:path'

import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'

import { isMacOS } from 'std-env'

function hasXcode26OrAbove() {
  if (!isMacOS)
    return false
  try {
    const output = execSync('xcodebuild -version')
      .toString()

      .match(/Xcode (\d+)/)
    if (!output)
      return false
    return Number.parseInt(output[1], 10) >= 26
  }
  catch {
    return false
  }
}

/**
 * Checks whether the local Xcode toolchain can compile Rin's `.icon` catalog.
 *
 * Use when:
 * - macOS packaging wants to prefer the new `.icon` asset catalog on Xcode 26+
 * - The build must fall back to `icon.icns` on machines where `actool` crashes
 *
 * Expects:
 * - The workspace contains `build/icon.icon/icon.json`
 * - The selected Xcode command line tools provide `xcrun actool`
 *
 * Returns:
 * - `true` only when `actool` can compile the icon catalog with the same flags
 *   used by electron-builder's macOS icon composer
 */
function canCompileMacOSIconCatalog() {
  if (!isMacOS)
    return false

  const iconCatalogPath = path.resolve('build', 'icon.icon')
  const iconCatalogManifestPath = path.join(iconCatalogPath, 'icon.json')
  if (!existsSync(iconCatalogManifestPath))
    return false

  const probeRoot = path.join(os.tmpdir(), 'rin-icon-probe-')
  const tempDir = `${probeRoot}${Date.now()}`
  const compiledIconPath = path.join(tempDir, 'Icon.icon')
  const outputPath = path.join(tempDir, 'out')

  try {
    cpSync(iconCatalogPath, compiledIconPath, { recursive: true })
    mkdirSync(outputPath, { recursive: true })

    // NOTICE:
    // electron-builder 26.8.1 feeds `.icon` assets into `actool` with these
    // exact arguments from app-builder-lib's macOS icon composer. Some Xcode 26
    // environments still crash on our current icon catalog despite reporting a
    // supported version. Probe with the same flags so we can fall back to the
    // stable `icon.icns` path before the real package step fails.
    execSync([
      'xcrun',
      'actool',
      `"${compiledIconPath}"`,
      '--compile',
      `"${outputPath}"`,
      '--output-format',
      'human-readable-text',
      '--notices',
      '--warnings',
      '--output-partial-info-plist',
      `"${path.join(outputPath, 'assetcatalog_generated_info.plist')}"`,
      '--app-icon',
      'Icon',
      '--include-all-app-icons',
      '--accent-color',
      'AccentColor',
      '--enable-on-demand-resources',
      'NO',
      '--development-region',
      'en',
      '--target-device',
      'mac',
      '--minimum-deployment-target',
      '26.0',
      '--platform',
      'macosx',
    ].join(' '), { stdio: 'ignore' })

    return existsSync(path.join(outputPath, 'Icon.icns'))
      && existsSync(path.join(outputPath, 'Assets.car'))
  }
  catch {
    return false
  }
  finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

/**
 * Determine whether to use the .icon format for the macOS app icon based on the
 * Xcode version while building.
 * This is friendly to developers whose macOS and/or Xcode versions are below 26.
 */
const xcode26OrAbove = hasXcode26OrAbove()
const useIconFormattedMacAppIcon = xcode26OrAbove && canCompileMacOSIconCatalog()
if (!xcode26OrAbove) {
  console.warn('[electron-builder/config] Warning: Xcode version is below 26. Using .icns format for macOS app icon.')
}
else if (!useIconFormattedMacAppIcon) {
  console.warn('[electron-builder/config] Warning: Xcode 26+ is available, but actool could not compile build/icon.icon on this machine. Falling back to icon.icns for macOS packaging.')
}
else {
  // NOTICE: This success-path message intentionally uses stderr via `console.warn`.
  // The artifact metadata CLI imports this config and is used in GitHub Actions
  // command substitution for `GITHUB_ENV`; writing this log to stdout would break
  // machine-readable output such as `BUNDLE_NAME=$(...)`.
  console.warn('[electron-builder/config] Xcode version is 26 or above. Using .icon format for macOS app icon.')
}

export default {
  appId: 'ai.moeru.airi',
  productName: 'Rin',
  directories: {
    output: 'dist',
    buildResources: 'build',
  },
  // // For self-publishing, testing, and distribution after modified the code without access to
  // // an Apple Developer account, comment and uncomment the following lines.
  // // Later on when you obtained one, you can set up the necessary certificates and provisioning
  // // profiles to enable these security features.
  // //
  // // https://www.bigbinary.com/blog/code-sign-notorize-mac-desktop-app
  // // https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/
  // afterSign: async (context) => {
  //   const { electronPlatformName, appOutDir } = context
  //   if (electronPlatformName !== 'darwin')
  //     return
  //   if (env.CI !== 'true') {
  //     console.warn('Skipping notarizing step. Packaging is not running in CI')
  //     return
  //   }

  //   const appName = context.packager.appInfo.productFilename
  //   await notarize({
  //     appPath: `${appOutDir}/${appName}.app`,
  //     teamId: env.APPLE_DEVELOPER_TEAM_ID!,
  //     appleId: env.APPLE_DEVELOPER_APPLE_ID!,
  //     appleIdPassword: env.APPLE_DEVELOPER_APPLE_APP_SPECIFIC_PASSWORD!,
  //   })
  // },
  files: [
    'out/**',
    'resources/**',
    'package.json',
    // NOTICE: Exclude npm `electron` package from app payload.
    // Electron runtime is already provided by the outer app bundle; bundling a nested
    // `node_modules/electron/dist/Electron.app` makes electron-builder deep-sign it and
    // fails on non-code resources (for example `locale.pak`) with timestamp/signing errors.
    '!**/node_modules/electron{,/**}',
    '!**/.vscode/*',
    '!src/**/*',
    '!**/node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/**/{.turbo,test,src,__tests__,tests,example,examples}',
    '**/node_modules/debug/**/*',
    '**/node_modules/superjson/**/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!vite.config.{js,ts,mjs,cjs}',
    '!uno.config.{js,ts,mjs,cjs}',
    '!{.eslintcache,eslint.config.ts,.yaml,dev-app-update.yml,CHANGELOG.md,README.md}',
    '!{.env,.env.*,.npmrc,pnpm-lock.yaml}',
    '!{tsconfig.json}',
  ],
  asar: true,
  asarUnpack: [
    '**/*.node',
  ],
  extraResources: [
    {
      from: '../../engines/stage-tamagotchi-godot/build/${os}',
      to: 'godot-stage',
      filter: ['**/*'],
    },
  ],
  extraMetadata: {
    name: 'ai.moeru.airi',
    main: 'out/main/index.js',
    homepage: 'https://airi.moeru.ai/docs/',
    repository: 'https://github.com/moeru-ai/airi',
    license: 'MIT',
  },
  win: {
    executableName: 'airi',
    // NOTICE: Keep `channel: 'latest-${arch}'` for architecture-aware updater metadata.
    // electron-builder expands `${arch}` at publish-time (for example: `latest-x64`, `latest-arm64`),
    // and electron-updater later consumes that expanded channel to resolve platform-specific *.yml files.
    // This prevents cross-arch lookups such as arm64 clients reading x64 metadata.
    publish: {
      provider: 'github',
      owner: 'moeru-ai',
      repo: 'airi',
      channel: 'latest-${arch}',
    },
  },
  nsis: {
    artifactName: '${productName}-${version}-windows-${arch}-setup.${ext}',
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}',
    createDesktopShortcut: 'always',
    deleteAppDataOnUninstall: true,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  mac: {
    entitlementsInherit: 'build/entitlements.mac.plist',
    // NOTICE: Same channel rule as Windows. Keep `${arch}` here so generated metadata resolves
    // to architecture-specific update feeds on macOS (for example: `latest-x64-mac.yml`, `latest-arm64-mac.yml`).
    publish: {
      provider: 'github',
      owner: 'moeru-ai',
      repo: 'airi',
      // NOTICE: `channel: 'latest-${arch}'` matters because electron-builder expands
      // `${arch}` before it writes any publish metadata, and electron-updater later
      // reuses that expanded channel string when deciding which `*.yml` file to fetch.
      //
      // Without this, the updater would look for `latest-mac.yml` for both x64 and arm64 macOS builds,
      // which means the x64 build would be used for arm64 (Apple Silicon) users, causing suboptimal performance and higher resource usage. By embedding `${arch}`
      // into the channel name, we ensure that the updater looks for `latest-x64-mac.yml` and `latest-arm64-mac.yml` respectively.
      //
      // This is how channel name was constructed:
      //
      // 1. `expandPublishConfig(...)` expands string values in the publish config.
      //    That is where `latest-${arch}` becomes `latest-x64` or `latest-arm64`.
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/app-builder-lib/src/publish/PublishManager.ts#L521-L532
      //
      // 2. The expanded publish config is written into `app-update.yml`.
      //    The packaged app therefore carries `channel: latest-x64` or
      //    `channel: latest-arm64`, not the literal template string.
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/app-builder-lib/src/publish/PublishManager.ts#L93-L96
      //
      // 3. electron-builder also uses that expanded channel when generating update
      //    metadata files. `getUpdateInfoFileName(channel, packager, arch)` builds the
      //    filename as:
      //      `${channel}${osSuffix}${getArchPrefixForUpdateFile(arch, packager)}.yml`
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/app-builder-lib/src/publish/updateInfoBuilder.ts#L65-L68
      //
      // 4. For macOS, `osSuffix` is `-mac` and `getArchPrefixForUpdateFile(...)`
      //    returns an empty string. So:
      //      `latest-x64`   -> `latest-x64-mac.yml`
      //      `latest-arm64` -> `latest-arm64-mac.yml`
      //    This is the publish-time side of the behavior.
      //
      // 5. At runtime, electron-updater reads the embedded `app-update.yml` and takes
      //    its `channel` value. It does not reconstruct `latest-${arch}` itself; it
      //    consumes the already-expanded value from step 2.
      //
      // 6. `Provider.getChannelFilePrefix()` appends the platform suffix:
      //    - macOS -> `-mac`
      //    - Windows -> ``
      //    - Linux x64 -> `-linux`
      //    - Linux non-x64 -> `-linux-${arch}`
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/electron-updater/src/providers/Provider.ts#L44-L52
      //
      // 7. `getCustomChannelName(channel)` then returns:
      //      `${channel}${this.getChannelFilePrefix()}`
      //    So the updater turns:
      //      `latest-x64`   -> `latest-x64-mac`
      //      `latest-arm64` -> `latest-arm64-mac`
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/electron-updater/src/providers/Provider.ts#L58-L60
      //
      // 8. GitHubProvider passes that channel name into `getChannelFilename(channel)`,
      //    which simply appends `.yml`, so the final lookup becomes:
      //      `latest-x64-mac.yml`
      //      `latest-arm64-mac.yml`
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/electron-updater/src/util.ts#L27-L29
      //    https://github.com/electron-userland/electron-builder/blob/ed422f36540a93e9bd2a19bc7a5e729bf2b033ea/packages/electron-updater/src/providers/GitHubProvider.ts#L132-L145
      //
      // Resulting filenames with this config:
      // - macOS x64 -> `latest-x64-mac.yml`
      // - macOS arm64 -> `latest-arm64-mac.yml`
      // - Windows x64 -> `latest-x64.yml`
      // - Linux x64 -> `latest-x64-linux.yml`
      // - Linux arm64 -> `latest-arm64-linux-arm64.yml`
      channel: 'latest-${arch}',
    },
    extendInfo: [
      {
        NSMicrophoneUsageDescription: 'Rin requires microphone access for voice interaction',
      },
      {
        NSCameraUsageDescription: 'Rin requires camera access for vision interaction',
      },
    ],
    // For self-publishing, testing, and distribution after modified the code without access to
    // an Apple Developer account, comment and uncomment the following 4 lines.
    // Later on when you obtained one, you can set up the necessary certificates and provisioning
    // profiles to enable these security features.
    // hardenedRuntime: false,
    hardenedRuntime: true,
    // notarize: false,
    notarize: true,
    // NOTICE:
    // electron-builder delegates macOS signing to @electron/osx-sign, which walks
    // every binary-looking file under `Rin.app/Contents`. Electron locale/resource
    // packs such as `locale.pak`, `*.bin`, and `*.dat` are data files, not Mach-O
    // executables, but `isBinaryFile(...)` still surfaces them as signing targets.
    // That keeps build:mac stuck in deep codesign for a very long time and prevents
    // the pipeline from ever reaching DMG generation.
    //
    // We skip only these non-code Electron framework resources here. They remain
    // sealed by the enclosing app/framework signature, so this narrows the signing
    // scope without changing the shipped runtime payload.
    signIgnore: [
      '/Contents/Frameworks/Electron Framework\\.framework(?:/Versions/(?:A|Current))?/Resources/.*\\.(pak|bin|dat)$',
    ],
    executableName: 'Rin',
    icon: useIconFormattedMacAppIcon ? 'icon.icon' : 'icon.icns',
  },
  dmg: {
    artifactName: '${productName}-${version}-darwin-${arch}.${ext}',
  },
  linux: {
    target: [
      'deb',
      'rpm',
    ],
    // NOTICE: Same channel rule as Windows/macOS. Keep `${arch}` to avoid x64/arm64 feed collisions on Linux.
    publish: {
      provider: 'github',
      owner: 'moeru-ai',
      repo: 'airi',
      channel: 'latest-${arch}',
    },
    category: 'Utility',
    synopsis: 'AI VTuber/Waifu chatbot app inspired by Neuro-sama.',
    description: 'AIRI is an AI VTuber/Waifu chatbot supporting Live2D/VRM avatars, featuring human-like interactions and modular stage-based rendering.',
    executableName: 'airi',
    artifactName: '${productName}-${version}-linux-${arch}.${ext}',
    icon: 'build/icons/icon.png',
  },
  appImage: {
    artifactName: '${productName}-${version}-linux-${arch}.${ext}',
  },
  npmRebuild: false,

} satisfies Configuration
