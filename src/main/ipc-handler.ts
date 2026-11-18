import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { mainWindowRef } from '.'
import { AppChannel, type IpcInvokeMap } from '../shared/ipc'

export const handle = <C extends keyof IpcInvokeMap>(
  channel: C,
  listener: (
    event: IpcMainInvokeEvent,
    ...args: IpcInvokeMap[C]['args']
  ) => IpcInvokeMap[C]['return'] | Promise<IpcInvokeMap[C]['return']>
): void => {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      // Renderer payloads are untrusted. The channel map types the contract;
      // handlers still treat the values as data coming from the other process.
      return await listener(event, ...(args as IpcInvokeMap[C]['args']))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      mainWindowRef?.webContents.send(AppChannel.errorLog, {
        id: crypto.randomUUID(),
        channel,
        message,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now()
      })

      throw error
    }
  })
}
