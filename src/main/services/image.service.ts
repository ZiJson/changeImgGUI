import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import type { CompanyFolder } from '../type/settings'
import { getFavIconByCompanyFolder, getImageFolderByCompanyFolder } from './project.service'
import {
  ImageAlternative,
  ImageAlternativeResult,
  ImageAlternativeSummary,
  ImageChecks,
  ImageMetadata,
  ImagePathPair
} from '../type/image'

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg'])

// 檔名不區分大小寫，且不包含副檔名
const getFileNameWithoutExtension = (filePath: string): string =>
  path.parse(filePath).name.toLowerCase()

const getExtension = (filePath: string): string => path.extname(filePath).toLowerCase()

const createEmptyChecks = (): ImageChecks => ({
  filenameMatches: null,
  extensionMatches: null,
  aspectRatioMatches: null,
  sizeDifferenceAcceptable: null
})

/**
 * 讀取圖片 metadata。
 * 不支援或損壞的圖片會回傳 null。
 */
const getImageMetadata = async (imagePath: string): Promise<ImageMetadata | null> => {
  try {
    const [metadata, stat] = await Promise.all([sharp(imagePath).metadata(), fs.stat(imagePath)])

    if (
      !metadata.width ||
      !metadata.height ||
      !Number.isFinite(metadata.width) ||
      !Number.isFinite(metadata.height)
    ) {
      return null
    }

    return {
      width: metadata.width,
      height: metadata.height,
      size: stat.size
    }
  } catch {
    return null
  }
}

/**
 * 比對圖片替代候選。
 *
 * 比對規則：
 * 1. 新圖片為 .ico：直接匹配 favicon.ico。
 * 2. 其他圖片：先找檔名完全相同的圖片（忽略副檔名）。
 * 3. 沒有完全符合時，找新檔名以舊檔名結尾的圖片。
 * 4. 有多個候選時，選擇檔名最長者。
 *
 * 檢查項目：
 * - filenameMatches：不含副檔名的檔名是否完全相同。
 * - extensionMatches：副檔名是否相同。
 * - aspectRatioMatches：長寬比是否完全相同。
 * - sizeDifferenceAcceptable：檔案大小差異是否在 50% 以內。
 */
export const checkImagesMatch = async ({
  companyFolder,
  newImagePaths
}: {
  companyFolder: CompanyFolder
  newImagePaths: string[]
}): Promise<ImageAlternativeResult> => {
  const imageFolder = await getImageFolderByCompanyFolder(companyFolder)

  // 只讀取圖片資料夾第一層的舊圖片
  let oldImagePaths: string[] = []

  if (imageFolder) {
    try {
      const entries = await fs.readdir(imageFolder, {
        withFileTypes: true
      })

      oldImagePaths = entries
        .filter(
          (entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
        )
        .map((entry) => path.join(imageFolder, entry.name))
    } catch {
      oldImagePaths = []
    }
  }

  const faviconPath = await getFavIconByCompanyFolder(companyFolder)

  const results: ImageAlternative[] = await Promise.all(
    newImagePaths.map(async (newPath): Promise<ImageAlternative> => {
      const extension = getExtension(newPath)

      let oldPath: string | null

      if (extension === '.ico') {
        // ICO 直接對應 favicon，不透過 Sharp 讀取 metadata
        oldPath = faviconPath || null
      } else {
        const newName = getFileNameWithoutExtension(newPath)

        // 優先使用檔名完全相同的候選
        const exactMatches = oldImagePaths.filter(
          (oldImagePath) => getFileNameWithoutExtension(oldImagePath) === newName
        )

        if (exactMatches.length > 0) {
          oldPath = exactMatches[0]
        } else {
          // 再找新檔名是否以舊檔名結尾
          const suffixMatches = oldImagePaths
            .filter((oldImagePath) => {
              const oldName = getFileNameWithoutExtension(oldImagePath)

              return newName.endsWith(oldName)
            })
            .sort(
              (a, b) =>
                getFileNameWithoutExtension(b).length - getFileNameWithoutExtension(a).length
            )

          oldPath = suffixMatches[0] ?? null
        }
      }

      if (!oldPath) {
        return {
          newPath,
          oldPath: null,
          checks: createEmptyChecks()
        }
      }

      const filenameMatches =
        getFileNameWithoutExtension(newPath) === getFileNameWithoutExtension(oldPath)

      const extensionMatches = getExtension(newPath) === getExtension(oldPath)

      // ICO 可能無法被 Sharp 解析，因此不進行圖片 metadata 比對
      if (extension === '.ico' || getExtension(oldPath) === '.ico') {
        return {
          newPath,
          oldPath,
          checks: {
            filenameMatches,
            extensionMatches,
            aspectRatioMatches: true,
            sizeDifferenceAcceptable: true
          }
        }
      }

      const [newMetadata, oldMetadata] = await Promise.all([
        getImageMetadata(newPath),
        getImageMetadata(oldPath)
      ])

      // 任一圖片無法取得 metadata，就略過長寬比與檔案大小檢查
      if (!newMetadata || !oldMetadata) {
        return {
          newPath,
          oldPath,
          checks: {
            filenameMatches,
            extensionMatches,
            aspectRatioMatches: null,
            sizeDifferenceAcceptable: null
          }
        }
      }

      // 用交叉相乘比較，避免浮點數除法的誤差
      const aspectRatioMatches =
        newMetadata.width * oldMetadata.height === oldMetadata.width * newMetadata.height

      // 新舊檔案大小差異 <= 舊檔案大小的 50%
      const sizeDifferenceAcceptable =
        oldMetadata.size > 0 &&
        (newMetadata.size <= oldMetadata.size ||
          Math.abs(newMetadata.size - oldMetadata.size) / oldMetadata.size <= 0.5)

      return {
        newPath,
        oldPath,
        checks: {
          filenameMatches,
          extensionMatches,
          aspectRatioMatches,
          sizeDifferenceAcceptable
        }
      }
    })
  )

  const checkKeys: (keyof ImageChecks)[] = [
    'filenameMatches',
    'extensionMatches',
    'aspectRatioMatches',
    'sizeDifferenceAcceptable'
  ]

  const summary: ImageAlternativeSummary = {
    total: results.length,
    matched: results.filter((result) => result.oldPath !== null).length,
    unmatched: results.filter((result) => result.oldPath === null).length,
    checks: {
      filenameMatches: { passed: 0, failed: 0, skipped: 0 },
      extensionMatches: { passed: 0, failed: 0, skipped: 0 },
      aspectRatioMatches: { passed: 0, failed: 0, skipped: 0 },
      sizeDifferenceAcceptable: { passed: 0, failed: 0, skipped: 0 }
    }
  }

  for (const result of results) {
    for (const key of checkKeys) {
      const value = result.checks[key]
      const counter = summary.checks[key]

      if (value === null) {
        counter.skipped++
      } else if (value) {
        counter.passed++
      } else {
        counter.failed++
      }
    }
  }
  return {
    results,
    summary
  }
}

export const fixImageFileNames = async (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> => {
  return Promise.all(
    imagePairs.map(async ({ newPath, oldPath }) => {
      if (!oldPath) {
        return { newPath, oldPath }
      }
      const oldFileName = path.parse(oldPath).name
      const newExtension = path.extname(newPath)

      const renamedPath = path.join(path.dirname(newPath), `${oldFileName}${newExtension}`)

      // 檔名已經相同，不需要重新命名
      if (newPath === renamedPath) {
        return { newPath, oldPath }
      }

      // 避免覆蓋已存在的檔案
      try {
        await fs.access(renamedPath)
        throw new Error(`目標檔案已存在：${renamedPath}`)
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('目標檔案已存在：')) {
          throw error
        }
      }

      await fs.rename(newPath, renamedPath)

      return {
        newPath: renamedPath,
        oldPath
      }
    })
  )
}

export const compressImages = async (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> => {
  await Promise.all(
    imagePairs.map(async ({ newPath, oldPath }) => {
      if (!oldPath) return
      const newExtension = path.extname(newPath).toLowerCase()
      const oldExtension = path.extname(oldPath).toLowerCase()

      // 副檔名不同，交給轉檔函式處理
      if (newExtension !== oldExtension) {
        return
      }

      if (!SUPPORTED_FORMATS.has(newExtension)) {
        return
        throw new Error(`不支援的圖片格式：${newExtension}`)
      }

      const [newStat, oldStat] = await Promise.all([fs.stat(newPath), fs.stat(oldPath)])

      const sizeDifferenceAcceptable =
        oldStat.size > 0 &&
        (newStat.size <= oldStat.size ||
          Math.abs(newStat.size - oldStat.size) / oldStat.size <= 0.5)

      // 新舊圖片大小差異在 50% 以內，不需要壓縮
      if (sizeDifferenceAcceptable) {
        return
      }

      const tempPath = `${newPath}.tmp`

      try {
        let pipeline = sharp(newPath)

        switch (newExtension) {
          case '.jpg':
          case '.jpeg':
            pipeline = pipeline.jpeg({
              quality: 80,
              mozjpeg: true
            })
            break

          case '.png':
            pipeline = pipeline.png({
              compressionLevel: 9,
              palette: true
            })
            break

          case '.webp':
            pipeline = pipeline.webp({
              quality: 80
            })
            break
        }

        await pipeline.toFile(tempPath)
        await fs.rename(tempPath, newPath)
      } catch (error) {
        await fs.rm(tempPath, { force: true })
        throw error
      }
    })
  )

  return imagePairs
}

const SUPPORTED_FORMATS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export const convertImages = async (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> => {
  return Promise.all(
    imagePairs.map(async ({ newPath, oldPath }) => {
      if (!oldPath) return { newPath, oldPath }
      const targetExtension = path.extname(oldPath).toLowerCase()

      if (!SUPPORTED_FORMATS.has(targetExtension)) {
        return { newPath, oldPath }
        throw new Error(`不支援的目標圖片格式：${targetExtension}`)
      }

      // 目標路徑位於原圖片所在目錄
      const targetPath = path.join(
        path.dirname(newPath),
        `${path.parse(newPath).name}${targetExtension}`
      )

      // 已經是目標格式，不需轉檔
      if (path.extname(newPath).toLowerCase() === targetExtension) {
        return { newPath, oldPath }
      }

      const tempPath = `${targetPath}.tmp`

      try {
        let pipeline = sharp(newPath)

        switch (targetExtension) {
          case '.jpg':
          case '.jpeg':
            pipeline = pipeline.jpeg({ quality: 90 })
            break
          case '.png':
            pipeline = pipeline.png()
            break
          case '.webp':
            pipeline = pipeline.webp({ quality: 90 })
            break
        }

        await pipeline.toFile(tempPath)

        // 不覆蓋既有檔案
        try {
          await fs.access(targetPath)
          throw new Error(`目標檔案已存在：${targetPath}`)
        } catch (error) {
          if (error instanceof Error && error.message.startsWith('目標檔案已存在：')) {
            throw error
          }
        }

        await fs.rename(tempPath, targetPath)
        await fs.unlink(newPath)

        return {
          newPath: targetPath,
          oldPath
        }
      } catch (error) {
        await fs.rm(tempPath, { force: true })
        throw error
      }
    })
  )
}

export const replaceImages = async (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> => {

  await Promise.all(
    imagePairs.map(async ({ newPath, oldPath }) => {
      if (!oldPath) return
      await fs.copyFile(newPath, oldPath)
    })
  )

  return imagePairs
}
