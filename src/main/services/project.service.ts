import { CompanyFolder, ProjectInfo } from '../type/settings'
import fs from 'node:fs/promises'
import * as settingService from './setting.service'
import path from 'node:path'

export const addNewProject = async (project: ProjectInfo): Promise<void> => {
  const settings = await settingService.getSettings()
  try {
    project.configPath = (await getConfigFileByProjectPath(project.path)) || undefined
  } catch (error) {
    console.error(error)
  }
  try {
    project.companyListPath = (await findDirectory(project.path, 'companyList')) || undefined
  } catch (error) {
    console.error(error)
  }

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

export const getConfigFileByProjectPath = async (projectPath: string): Promise<string> => {
  const configPath = await findDirectory(projectPath, 'config')

  if (!configPath) {
    throw new Error(`Config directory not found: ${projectPath}`)
  }

  try {
    const entries = await fs.readdir(configPath, { withFileTypes: true })

    const multipageFile = entries.find(
      (entry) => entry.isFile() && /^multipage\.project(\..+)?$/.test(entry.name)
    )

    if (multipageFile) {
      return path.join(configPath, multipageFile.name)
    }
  } catch {
    // Fallback to index file
  }

  const entries = await fs.readdir(configPath, { withFileTypes: true })

  const indexFile = entries.find((entry) => entry.isFile() && /^index(\..+)?$/.test(entry.name))

  if (!indexFile) {
    throw new Error(`Config file not found in: ${configPath}`)
  }

  return path.join(configPath, indexFile.name)
}

export const findDirectory = async (dir: string, target: string): Promise<string | null> => {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.name === target) {
      return fullPath
    }

    const result = await findDirectory(fullPath, target)

    if (result) return result
  }

  return null
}

export const switchCompanyConfig = async (
  configFilePath: string,
  companyCode: string
): Promise<void> => {
  const content = await fs.readFile(configFilePath, 'utf-8')
  const lines = content.split(/\r\n|\n|\r/)

  // 1. Detect exported variable name
  const variableName = getExportedVariableName(content)
  const escapedVariable = escapeRegExp(variableName)
  const escapedCompany = escapeRegExp(companyCode)

  // 2. Find active declaration
  const activePattern = new RegExp(`^\\s*(?:const|let|var)\\s+${escapedVariable}\\s*=`)

  const activeIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (activePattern.test(line)) indexes.push(index)
    return indexes
  }, [])

  // 3. Find commented declaration matching company code
  const targetPattern = new RegExp(
    `^\\s*//\\s*(?:const|let|var)\\s+${escapedVariable}\\s*=.*${escapedCompany}`
  )

  const targetIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (targetPattern.test(line)) indexes.push(index)
    return indexes
  }, [])

  if (activeIndexes.length !== 1) {
    throw new Error(
      `Expected exactly one active declaration for "${variableName}", found ${activeIndexes.length}`
    )
  }

  if (targetIndexes.length !== 1) {
    throw new Error(
      `Expected exactly one commented declaration for "${companyCode}", found ${targetIndexes.length}`
    )
  }

  const activeIndex = activeIndexes[0]
  const targetIndex = targetIndexes[0]

  // 4. Already selected
  if (activeIndex === targetIndex) return

  // 5. Comment current declaration
  lines[activeIndex] = lines[activeIndex].replace(/^(\s*)/, '$1// ')

  // 6. Uncomment target declaration
  lines[targetIndex] = lines[targetIndex].replace(/^(\s*)\/\/\s?/, '$1')

  // 7. Preserve original line endings
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n'

  await fs.writeFile(configFilePath, lines.join(lineEnding), 'utf-8')
}

const getExportedVariableName = (content: string): string => {
  const patterns = [/module\.exports\s*=\s*(\w+)\s*;?/, /export\s+default\s+(\w+)\s*;?/]

  for (const pattern of patterns) {
    const match = content.match(pattern)

    if (match) return match[1]
  }

  throw new Error('Cannot detect exported variable')
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getActiveCompanyCode = async (
  configFilePath: string,
  companyCodes: string[]
): Promise<string | null> => {
  const content = await fs.readFile(configFilePath, 'utf-8')
  const variableName = getExportedVariableName(content)

  const escapedVariable = escapeRegExp(variableName)

  const activePattern = new RegExp(`^\\s*(?:const|let|var)\\s+${escapedVariable}\\s*=.*$`, 'm')

  const match = content.match(activePattern)
  if (!match) {
    throw new Error(`Active declaration not found: ${variableName}`)
  }

  const activeLine = match[0]

  return companyCodes.find((code) => activeLine.includes(code)) ?? null
}

export const initializeProjects = async (): Promise<ProjectInfo[]> => {
  const settings = await settingService.getSettings()

  let hasChanges = false

  const projects = await Promise.all(
    settings.projects.map(async (project) => {
      const updatedProject = { ...project }

      if (!updatedProject.configPath) {
        updatedProject.configPath = await getConfigFileByProjectPath(updatedProject.path)
        hasChanges = true
      }

      if (!updatedProject.companyListPath) {
        updatedProject.companyListPath =
          (await findDirectory(updatedProject.path, 'companyList')) || undefined

        hasChanges = true
      }

      return updatedProject
    })
  )

  if (hasChanges) {
    settings.projects = projects
    await settingService.saveSettings(settings)
  }

  return projects
}
