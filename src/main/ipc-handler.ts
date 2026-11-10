import { ipcMain } from 'electron'
import { mainWindowRef } from '.'

export const handle: typeof ipcMain.handle = (channel, listener) => {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await listener(event, ...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      mainWindowRef?.webContents.send('error-log', {
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
