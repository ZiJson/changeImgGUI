import { BrowserWindow, ipcMain } from 'electron'
import * as settingService from '../services/setting.service'
import pty from 'node-pty'
import os from 'node:os'
import { TerminalConfig } from '../type/settings'

let terminalProcess: pty.IPty | null = null

export const registerTerminalIPC = (mainWindow: BrowserWindow) => {
  ipcMain.handle('create-terminal', async () => {
    // 已經有 Terminal 就不重複建立
    if (terminalProcess) {
      terminalProcess.kill()
      terminalProcess = null
    }
    const settings = await settingService.getSettings()
    const isWsl = settings.terminal.selected === 'wsl'

    const shell = process.platform === 'win32' ? (isWsl ? 'wsl.exe' : 'bash.exe') : 'bash'

    const arg = isWsl && process.platform === 'win32' ? ['--cd', '~'] : []

    const ptyProcess = pty.spawn(shell, arg, {
      name: 'xterm-256color',
      cols: 100,
      rows: 30,
      cwd: os.homedir(),
      env: process.env
    })
    console.log(ptyProcess)
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

  ipcMain.handle('terminal-settings', async (): Promise<TerminalConfig> => {
    const settings = await settingService.getSettings()

    return { ...settings.terminal, options: ['bash', 'wsl'] }
  })

  ipcMain.handle('terminal-settings-update', async (_, config: TerminalConfig) => {
    const settings = await settingService.getSettings()
    settings.terminal = config
    await settingService.saveSettings(settings)
  })
}
