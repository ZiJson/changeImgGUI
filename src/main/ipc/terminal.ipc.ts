import { BrowserWindow, ipcMain } from 'electron'
import pty from 'node-pty'

let terminalProcess: pty.IPty | null = null

export const registerTerminalIPC = (mainWindow: BrowserWindow) => {
  ipcMain.handle('create-terminal', () => {
    // 已經有 Terminal 就不重複建立
    if (terminalProcess) {
      return true
    }

    const shell = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash'

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    })

    terminalProcess = ptyProcess

    ptyProcess.onData((data) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-output', data)
      }
    })

    ptyProcess.onExit(() => {
      if (terminalProcess === ptyProcess) {
        terminalProcess = null
      }
    })

    return true
  })

  ipcMain.on('terminal-input', (_, input: string) => {
    terminalProcess?.write(input)
  })

  ipcMain.handle('dispose-terminal', () => {
    const terminal = terminalProcess
    if (!terminal) return

    terminalProcess = null
    terminal.kill()
  })
}
