import type { Buffer } from 'node:buffer'

import type { createContext } from '@moeru/eventa/adapters/electron/main'
import type { BrowserWindow } from 'electron'

import { Buffer as NodeBuffer } from 'node:buffer'

import { defineInvokeHandler } from '@moeru/eventa'
import { app, safeStorage, shell } from 'electron'
import { isLinux, isMacOS, isWindows } from 'std-env'
import { object, record, string } from 'valibot'

import {
  electron,
  electronAppOpenUserDataFolder,
  electronAppQuit,
  electronSecureStoreDelete,
  electronSecureStoreGet,
  electronSecureStoreSet,
} from '../../../shared/eventa'
import { createConfig } from '../../libs/electron/persistence'

const secureStoreConfigSchema = object({
  entries: record(string(), string()),
})

let secureStoreSetupDone = false

const secureStoreConfig = createConfig('secure-store', 'config.json', secureStoreConfigSchema, {
  default: { entries: {} },
  autoHeal: true,
})

function ensureSecureStoreConfigReady() {
  if (secureStoreSetupDone)
    return
  secureStoreConfig.setup()
  secureStoreSetupDone = true
}

function normalizeSecureStoreKey(rawKey: string) {
  const key = rawKey.trim()
  if (!key)
    throw new Error('Secure storage key is required.')
  return key
}

function assertSecureStorageAvailable() {
  if (!safeStorage.isEncryptionAvailable())
    throw new Error('Secure storage is unavailable on this device.')
}

function readSecureEntries() {
  ensureSecureStoreConfigReady()
  return secureStoreConfig.get()?.entries ?? {}
}

function writeSecureEntries(entries: Record<string, string>) {
  secureStoreConfig.update({ entries })
}

export function createAppService(params: { context: ReturnType<typeof createContext>['context'], window: BrowserWindow }) {
  defineInvokeHandler(params.context, electron.app.isMacOS, () => isMacOS)
  defineInvokeHandler(params.context, electron.app.isWindows, () => isWindows)
  defineInvokeHandler(params.context, electron.app.isLinux, () => isLinux)
  defineInvokeHandler(params.context, electronAppOpenUserDataFolder, async () => {
    const path = app.getPath('userData')
    const openResult = await shell.openPath(path)
    if (openResult) {
      throw new Error(openResult)
    }
    return { path }
  })
  defineInvokeHandler(params.context, electronAppQuit, () => app.quit())
  defineInvokeHandler(params.context, electronSecureStoreSet, async (payload) => {
    assertSecureStorageAvailable()
    const key = normalizeSecureStoreKey(payload.key)
    const value = payload.value
    if (!value)
      throw new Error('Secure storage value is required.')

    const encrypted = safeStorage.encryptString(value)
    const entries = readSecureEntries()
    entries[key] = encrypted.toString('base64')
    writeSecureEntries(entries)
  })
  defineInvokeHandler(params.context, electronSecureStoreGet, async (payload) => {
    assertSecureStorageAvailable()
    const key = normalizeSecureStoreKey(payload.key)
    const entries = readSecureEntries()
    const encoded = entries[key]
    if (!encoded) {
      return {
        hasValue: false,
      }
    }

    try {
      const decrypted = safeStorage.decryptString(NodeBuffer.from(encoded, 'base64') as Buffer)
      return {
        hasValue: true,
        value: decrypted,
      }
    }
    catch {
      delete entries[key]
      writeSecureEntries(entries)
      return {
        hasValue: false,
      }
    }
  })
  defineInvokeHandler(params.context, electronSecureStoreDelete, async (payload) => {
    const key = normalizeSecureStoreKey(payload.key)
    const entries = readSecureEntries()
    if (!(key in entries))
      return
    delete entries[key]
    writeSecureEntries(entries)
  })
}
