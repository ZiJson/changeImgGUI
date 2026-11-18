import fs from 'node:fs/promises'
import path from 'node:path'
import type { AppSettings, RevealMode } from '../../shared/settings'
import { app, dialog, shell } from 'electron'
import { errorMessage, isEnoent, serviceError } from './service-error'

const settingsPath = path.join(app.getPath('userData'), 'settings.json')
export const tempDir = path.join(app.getPath('temp'), 'changeImgGUI')

const defaultSettings: AppSettings = {
  projects: [],
  terminal: {
    selected: 'bash',
    options: []
  }
}

export const selectDirectory = async (defaultPath?: string): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    ...(defaultPath ? { defaultPath } : {}),
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

export const selectFile = async (defaultPath?: string): Promise<string | null> => {
  const result = await dialog.showOpenDialog({
    ...(defaultPath ? { defaultPath } : {}),
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

export const selectImages = async (defaultPath?: string): Promise<string[] | null> => {
  const result = await dialog.showOpenDialog({
    ...(defaultPath ? { defaultPath } : {}),
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'ico', 'webp', 'svg']
      }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return await copyImagesToTemp(result.filePaths)
}

export const getSettings = async (): Promise<AppSettings> => {
  let content: string

  try {
    content = await fs.readFile(settingsPath, 'utf-8')
  } catch (error) {
    if (isEnoent(error)) return defaultSettings
    throw serviceError(
      `Failed to read settings file: ${settingsPath}. ${errorMessage(error)}`,
      error
    )
  }

  try {
    return { ...defaultSettings, ...(JSON.parse(content) as Partial<AppSettings>) }
  } catch (error) {
    throw serviceError(`Invalid settings file: ${settingsPath}. ${errorMessage(error)}`, error)
  }
}

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await fs.mkdir(path.dirname(settingsPath), {
      recursive: true
    })

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (error) {
    throw serviceError(
      `Failed to save settings file: ${settingsPath}. ${errorMessage(error)}`,
      error
    )
  }
}

export const copyImagesToTemp = async (paths: string[]): Promise<string[]> => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })
  } catch (error) {
    throw serviceError(
      `Failed to prepare the image temp directory: ${tempDir}. ${errorMessage(error)}`,
      error
    )
  }

  const usedNames = new Set<string>()

  return Promise.all(
    paths.map(async (sourcePath) => {
      const baseName = path.basename(sourcePath)

      if (usedNames.has(baseName)) {
        throw new Error(`Duplicate temp image file name: ${baseName}`)
      }

      usedNames.add(baseName)
      const targetPath = path.join(tempDir, baseName)

      try {
        await fs.copyFile(sourcePath, targetPath)
      } catch (error) {
        throw serviceError(
          `Failed to copy image to the temp directory: ${sourcePath}. ${errorMessage(error)}`,
          error
        )
      }

      return targetPath
    })
  )
}

export const revealInFileExplorer = async (path: string, mode: RevealMode = 'select') => {
  try {
    await fs.access(path)
  } catch (error) {
    throw serviceError(`Path not found: ${path}. ${errorMessage(error)}`, error)
  }

  if (mode === 'open') {
    const openError = await shell.openPath(path)

    if (openError) {
      throw new Error(`Failed to open path: ${path}. ${openError}`)
    }
  } else {
    shell.showItemInFolder(path)
  }

  return true
}
