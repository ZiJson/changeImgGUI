import { shell } from 'electron'
import { handle } from '../ipc-handler'
import {
  revealInFileExplorer,
  selectDirectory,
  selectFile,
  selectImages
} from '../services/setting.service'
import { registerProjectIpc } from './project.ipc'
import { registerImageIpc } from './image.ipc'
import { registerGitIpc } from './git.ipc'
import { IndexChannel } from '../../shared/ipc'
import type { RevealMode } from '../../shared/settings'

const registerIndexIpc = (): void => {
  handle(IndexChannel.selectDirectory, async (_, defaultPath) => {
    return await selectDirectory(defaultPath)
  })
  handle(IndexChannel.selectImages, async (_, defaultPath) => {
    return await selectImages(defaultPath)
  })
  handle(IndexChannel.selectFile, async (_, defaultPath) => {
    return await selectFile(defaultPath)
  })
  handle(IndexChannel.openExternal, async (_, url) => {
    await shell.openExternal(url)
  })
  handle(IndexChannel.revealInFileExplorer, async (_, path, mode: RevealMode = 'select') => {
    return await revealInFileExplorer(path, mode)
  })
}

export const registerAllIpc = (): void => {
  registerIndexIpc()
  registerProjectIpc()
  registerImageIpc()
  registerGitIpc()
}
