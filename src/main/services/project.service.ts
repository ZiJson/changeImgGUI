import { CompanyFolder, ProjectInfo } from '../type/settings'
import fs from 'node:fs/promises'
import * as settingService from './setting.service'
import path from 'node:path'

export const addNewProject = async (project: ProjectInfo): Promise<void> => {
  const settings = await settingService.getSettings()

  settings.projects.push(project)

  await settingService.saveSettings(settings)
}

export const updateProject = async (project: ProjectInfo): Promise<void> => {
  const settings = await settingService.getSettings()

  const index = settings.projects.findIndex((p) => p.path === project.path)

  if (index !== -1) {
    settings.projects[index] = project
  }

  await settingService.saveSettings(settings)
}

export const deleteProject = async (project: ProjectInfo): Promise<void> => {
  const settings = await settingService.getSettings()

  const index = settings.projects.findIndex((p) => p.path === project.path)

  if (index !== -1) {
    settings.projects.splice(index, 1)
  }

  await settingService.saveSettings(settings)
}

export const getProjects = async (): Promise<ProjectInfo[]> => {
  const settings = await settingService.getSettings()

  return settings.projects
}

export const getCompanyFolderList = async (project: ProjectInfo): Promise<CompanyFolder[]> => {
  const companyListPath = project.companyListPath

  if (!companyListPath) {
    return []
  }

  const entries = await fs.readdir(companyListPath, {
    withFileTypes: true
  })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(entry.parentPath, entry.name)
    }))
}

export const getFavIconByCompanyFolder = async (companyFolder: CompanyFolder): Promise<string> => {
  const search = async (folderPath: string): Promise<string> => {
    const iconPath = path.join(folderPath, 'favicon.ico')

    try {
      await fs.access(iconPath)
      return iconPath
    } catch {
      // 目前資料夾沒有 favicon.ico，繼續往下搜尋
    }

    let entries

    try {
      entries = await fs.readdir(folderPath, { withFileTypes: true })
    } catch {
      return ''
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const result = await search(path.join(folderPath, entry.name))

      if (result) return result
    }

    return ''
  }

  return search(companyFolder.path)
}

export const getImageFolderByCompanyFolder = async (
  companyFolder: CompanyFolder
): Promise<string> => {
  const imageExtensions = new Set(['.webp', '.png', '.jpg'])

  const search = async (folderPath: string): Promise<string> => {
    let entries

    try {
      entries = await fs.readdir(folderPath, { withFileTypes: true })
    } catch {
      return ''
    }

    // 計算目前資料夾中的圖片數量（不包含子資料夾）
    const imageCount = entries.filter(
      (entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())
    ).length

    if (imageCount >= 1) {
      return folderPath
    }

    // 遞迴搜尋子資料夾
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const result = await search(path.join(folderPath, entry.name))

      if (result) return result
    }

    return ''
  }

  return search(companyFolder.path)
}

export const getImageAlternative = async (props: {
  companyFolder: CompanyFolder
  newImagePaths: string[]
}): Promise<{ newPath: string; oldPath: string }[]> => {
  const { companyFolder, newImagePaths } = props
  const alternatives: { newPath: string; oldPath: string }[] = []
  const imageExtensions = new Set(['.webp', '.png', '.jpg', '.jpeg'])

  // 1. 特殊處理 favicon.ico
  const newFavIconPath = newImagePaths.find(
    (imagePath) => path.extname(imagePath).toLowerCase() === '.ico'
  )

  if (newFavIconPath) {
    const oldFavIconPath = await getFavIconByCompanyFolder(companyFolder)

    if (oldFavIconPath) {
      alternatives.push({
        newPath: newFavIconPath,
        oldPath: oldFavIconPath
      })
    }
  }

  // 2. 取得舊圖片資料夾
  const imageFolder = await getImageFolderByCompanyFolder(companyFolder)

  if (!imageFolder) return alternatives

  let entries

  try {
    entries = await fs.readdir(imageFolder, { withFileTypes: true })
  } catch {
    return alternatives
  }

  const oldImages = entries
    .filter(
      (entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())
    )
    .map((entry) => ({
      name: path.parse(entry.name).name.toLowerCase(),
      path: path.join(imageFolder, entry.name)
    }))

  // 3. 逐一匹配非 ico 圖片
  for (const newPath of newImagePaths) {
    const extension = path.extname(newPath).toLowerCase()

    if (extension === '.ico' || !imageExtensions.has(extension)) continue

    const newName = path.parse(newPath).name.toLowerCase()

    // 第一階段：完整檔名匹配（忽略副檔名）
    let matchedImage = oldImages.find((image) => image.name === newName)

    // 第二階段：忽略新檔名前綴，匹配舊檔名尾端
    if (!matchedImage) {
      matchedImage = oldImages
        .filter((image) => newName.endsWith(image.name))
        .sort((a, b) => b.name.length - a.name.length)[0]
    }

    // 兩階段都找不到就放棄
    if (!matchedImage) continue

    alternatives.push({
      newPath,
      oldPath: matchedImage.path
    })
  }

  return alternatives
}
