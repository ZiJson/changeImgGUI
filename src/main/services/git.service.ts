import { simpleGit } from 'simple-git'
import { GitImagePaths } from '../type/git'
import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'
import { spawn } from 'child_process'
import sharp from 'sharp'

export const getGitStatus = async (projectPath: string) => {
  const git = simpleGit(projectPath)

  const status = await git.status()

  return {
    current: status.current,
    tracking: status.tracking,
    isClean: status.isClean(),
    modified: status.modified,
    staged: status.staged,
    not_added: status.not_added,
    deleted: status.deleted,
    renamed: status.renamed,
    conflicted: status.conflicted
  }
}

const getGitImageBuffer = (projectPath: string, relativePath: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const child = spawn('git', ['show', `HEAD:${relativePath}`], {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const chunks: Buffer[] = []
    const errors: Buffer[] = []

    child.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    child.stderr.on('data', (chunk: Buffer) => {
      errors.push(chunk)
    })

    child.on('error', reject)

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(errors).toString('utf8') || `git show failed: ${code}`))
        return
      }

      resolve(Buffer.concat(chunks))
    })
  })

export const getGitImagePaths = async (
  projectPath: string,
  relativePath: string
): Promise<GitImagePaths> => {
  const currentPath = path.resolve(projectPath, relativePath)

  // 從 Git HEAD 取得舊圖片的原始二進位資料
  const buffer = await getGitImageBuffer(projectPath, relativePath)

  // 寫入 App 暫存目錄
  const tempRoot = path.join(app.getPath('userData'), 'image-diff')
  await fs.mkdir(tempRoot, { recursive: true })

  const tempDir = await fs.mkdtemp(path.join(tempRoot, 'image-'))
  const oldPath = path.join(tempDir, path.basename(relativePath))

  await fs.writeFile(oldPath, buffer)

  const isIco = path.extname(relativePath).toLowerCase() === '.ico'

  if (isIco) {
    return {
      current: {
        path: currentPath,
        width: null,
        height: null,
        size: null
      },
      old: {
        path: oldPath,
        width: null,
        height: null,
        size: null
      }
    }
  }

  // 同時取得新舊圖片的 metadata 與檔案大小
  const [currentMetadata, currentStat, oldMetadata] = await Promise.all([
    sharp(currentPath).metadata(),
    fs.stat(currentPath),
    sharp(oldPath).metadata()
  ])

  return {
    current: {
      path: currentPath,
      width: currentMetadata.width ?? 0,
      height: currentMetadata.height ?? 0,
      size: currentStat.size
    },
    old: {
      path: oldPath,
      width: oldMetadata.width ?? 0,
      height: oldMetadata.height ?? 0,
      size: buffer.length
    }
  }
}
