import fs from 'node:fs/promises'
import path from 'node:path'
import { AppSettings } from '../type/settings'
import { app, dialog } from 'electron'

const settingsPath = path.join(app.getPath('userData'), 'settings.json')
export const tempDir = path.join(app.getPath('temp'), 'changeImgGUI')

const defaultSettings: AppSettings = {
  projects: []
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
  try {
    const content = await fs.readFile(settingsPath, 'utf-8')
    return { ...defaultSettings, ...JSON.parse(content) }
  } catch {
    return defaultSettings
  }
}

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await fs.mkdir(path.dirname(settingsPath), {
    recursive: true
  })

  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

export const copyImagesToTemp = async (paths: string[]): Promise<string[]> => {
  // 清空暫存資料夾
  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })

  // 複製圖片並回傳暫存路徑
  return Promise.all(
    paths.map(async (sourcePath) => {
      const targetPath = path.join(tempDir, path.basename(sourcePath))

      await fs.copyFile(sourcePath, targetPath)

      return targetPath
    })
  )
}
