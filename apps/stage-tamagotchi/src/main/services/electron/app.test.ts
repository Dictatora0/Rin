import { Buffer as NodeBuffer } from 'node:buffer'

import { createContext, defineInvoke } from '@moeru/eventa'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  electronAppOpenUserDataFolder,
  electronSecureStoreDelete,
  electronSecureStoreGet,
  electronSecureStoreSet,
} from '../../../shared/eventa'
import { createAppService } from './app'

const appMock = vi.hoisted(() => ({
  getPath: vi.fn(),
  quit: vi.fn(),
}))

const shellMock = vi.hoisted(() => ({
  openPath: vi.fn(),
}))

const safeStorageMock = vi.hoisted(() => ({
  isEncryptionAvailable: vi.fn(),
  encryptString: vi.fn(),
  decryptString: vi.fn(),
}))

vi.mock('electron', () => ({
  app: appMock,
  shell: shellMock,
  safeStorage: safeStorageMock,
}))

vi.mock('std-env', () => ({
  isLinux: false,
  isMacOS: false,
  isWindows: true,
}))

describe('createAppService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appMock.getPath.mockReturnValue('/tmp/airi-user-data')
    safeStorageMock.isEncryptionAvailable.mockReturnValue(true)
    safeStorageMock.encryptString.mockImplementation((value: string) => NodeBuffer.from(`enc:${value}`, 'utf-8'))
    safeStorageMock.decryptString.mockImplementation((buffer: NodeBuffer) => {
      const text = buffer.toString('utf-8')
      return text.startsWith('enc:') ? text.slice(4) : ''
    })
  })

  it('opens the Electron userData folder and returns its path', async () => {
    const context = createContext()
    appMock.getPath.mockReturnValue('/tmp/airi-user-data')
    shellMock.openPath.mockResolvedValue('')

    createAppService({ context: context as never, window: {} as never })

    const openUserDataFolder = defineInvoke(context, electronAppOpenUserDataFolder)

    await expect(openUserDataFolder()).resolves.toEqual({ path: '/tmp/airi-user-data' })
    expect(appMock.getPath).toHaveBeenCalledWith('userData')
    expect(shellMock.openPath).toHaveBeenCalledWith('/tmp/airi-user-data')
  })

  it('throws when Electron fails to open the userData folder', async () => {
    const context = createContext()
    appMock.getPath.mockReturnValue('/tmp/airi-user-data')
    shellMock.openPath.mockResolvedValue('Failed to open path')

    createAppService({ context: context as never, window: {} as never })

    const openUserDataFolder = defineInvoke(context, electronAppOpenUserDataFolder)

    await expect(openUserDataFolder()).rejects.toThrow('Failed to open path')
    expect(appMock.getPath).toHaveBeenCalledWith('userData')
    expect(shellMock.openPath).toHaveBeenCalledWith('/tmp/airi-user-data')
  })

  it('stores, reads, and deletes secure values through safeStorage', async () => {
    const context = createContext()

    createAppService({ context: context as never, window: {} as never })

    const setValue = defineInvoke(context, electronSecureStoreSet)
    const getValue = defineInvoke(context, electronSecureStoreGet)
    const deleteValue = defineInvoke(context, electronSecureStoreDelete)

    await expect(getValue({ key: 'vision.autoUnlock' })).resolves.toEqual({ hasValue: false })

    await expect(setValue({ key: 'vision.autoUnlock', value: '123456' })).resolves.toBeUndefined()
    await expect(getValue({ key: 'vision.autoUnlock' })).resolves.toEqual({
      hasValue: true,
      value: '123456',
    })

    await expect(deleteValue({ key: 'vision.autoUnlock' })).resolves.toBeUndefined()
    await expect(getValue({ key: 'vision.autoUnlock' })).resolves.toEqual({ hasValue: false })
  })
})
