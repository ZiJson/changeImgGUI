import { simpleGit } from 'simple-git'
import type { GitImagePaths, GitRepoInfo, GitStatus } from '../../shared/git'
import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'
import { spawn } from 'child_process'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { errorMessage, serviceError } from './service-error'

export const isWslPath = (projectPath: string): boolean => {
  return /^\\\\wsl(?:\.localhost|\\$)\\/i.test(projectPath.replaceAll('/', '\\'))
}

export const toWslLinuxPath = (projectPath: string) => {
  const normalized = projectPath.replaceAll('/', '\\')
  const match = normalized.match(/^\\\\wsl(?:\.localhost|\$)\\([^\\]+)\\(.*)$/i)

  if (!match) {
    throw new Error(`Invalid WSL path: ${projectPath}`)
  }

  return {
    distro: match[1],
    linuxPath: `/${match[2].replaceAll('\\', '/')}`
  }
}

const runWslGit = (distro: string, projectPath: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn('wsl.exe', ['-d', distro, '--', 'git', '-C', projectPath, ...args], {
      windowsHide: true
    })

    let stdout = ''
    let stderr = ''

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    child.stdout.on('data', (data: string) => {
      stdout += data
    })

    child.stderr.on('data', (data: string) => {
      stderr += data
    })

    child.on('error', reject)

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(stderr.trim() || `Git exited with code ${code}`))
      }
    })
  })
}

export const getGitStatus = async (projectPath: string): Promise<GitStatus> => {
  try {
    if (!isWslPath(projectPath)) {
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
        renamed: status.renamed.map((file) => file.to),
        conflicted: status.conflicted
      }
    }

    const { distro, linuxPath } = toWslLinuxPath(projectPath)

    const output = await runWslGit(distro, linuxPath, ['status', '--porcelain=v1', '-b'])

    return parseGitStatus(output)
  } catch (error) {
    throw serviceError(`Failed to get Git status: ${projectPath}. ${errorMessage(error)}`, error)
  }
}

export const getRepoInfo = async (projectPath: string): Promise<GitRepoInfo> => {
  try {
    if (!isWslPath(projectPath)) {
      const git = simpleGit(projectPath)
      const root = await git.revparse(['--show-toplevel'])

      return {
        root: root.trim()
      }
    }

    const { distro, linuxPath } = toWslLinuxPath(projectPath)

    const output = await runWslGit(distro, linuxPath, ['rev-parse', '--show-toplevel'])

    return {
      root: output.trim()
    }
  } catch (error) {
    throw serviceError(
      `Failed to get the Git repository root: ${projectPath}. ${errorMessage(error)}`,
      error
    )
  }
}

const getGitImageBuffer = (projectPath: string, relativePath: string): Promise<Buffer> => {
  const useLocalGit = !isWslPath(projectPath)
  const wsl = !useLocalGit ? toWslLinuxPath(projectPath) : null

  const command = !useLocalGit ? 'wsl.exe' : 'git'

  const args = wsl
    ? ['-d', wsl.distro, '--', 'git', '-C', wsl.linuxPath, 'show', `HEAD:${relativePath}`]
    : ['show', `HEAD:${relativePath}`]

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...(wsl ? {} : { cwd: projectPath }),
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

    child.on('error', (error) => {
      reject(serviceError(`Failed to run git show: ${relativePath}. ${errorMessage(error)}`, error))
    })

    child.on('close', (code) => {
      if (code !== 0) {
        const detail = Buffer.concat(errors).toString('utf8').trim()
        reject(
          new Error(
            `Failed to read image from Git: ${relativePath}. ${detail || `exit code ${code}`}`
          )
        )
        return
      }

      resolve(Buffer.concat(chunks))
    })
  })
}

export const getGitImagePaths = async (
  projectPath: string,
  relativePath: string
): Promise<GitImagePaths> => {
  try {
    return await readGitImagePaths(projectPath, relativePath)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Failed to ')) throw error
    throw serviceError(
      `Failed to compare Git image: ${relativePath}. ${errorMessage(error)}`,
      error
    )
  }
}

const readGitImagePaths = async (
  projectPath: string,
  relativePath: string
): Promise<GitImagePaths> => {
  const currentPath = path.resolve(projectPath, relativePath)

  // 從 Git HEAD 取得舊圖片的原始二進位資料
  const buffer = await getGitImageBuffer(projectPath, relativePath)

  // 寫入 App 暫存目錄
  const tempRoot = path.join(app.getPath('userData'), 'image-diff')
  await fs.mkdir(tempRoot, { recursive: true })
  const tempDir = path.join(tempRoot, createHash('sha256').update(relativePath).digest('hex'))
  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })
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
  ]).catch((error: unknown) => {
    throw serviceError(
      `Failed to read Git image metadata: ${relativePath}. ${errorMessage(error)}`,
      error
    )
  })

  if (!currentMetadata.width || !currentMetadata.height) {
    throw new Error(`Failed to read current image dimensions: ${currentPath}`)
  }

  if (!oldMetadata.width || !oldMetadata.height) {
    throw new Error(`Failed to read Git image dimensions: ${oldPath}`)
  }

  return {
    current: {
      path: currentPath,
      width: currentMetadata.width,
      height: currentMetadata.height,
      size: currentStat.size
    },
    old: {
      path: oldPath,
      width: oldMetadata.width,
      height: oldMetadata.height,
      size: buffer.length
    }
  }
}

const parseGitStatus = (output: string): GitStatus => {
  const lines = output.split('\n').filter(Boolean)
  const branchLine = lines.shift() ?? ''

  const current = branchLine.match(/^## (.+?)(?:\.\.\.|$)/)?.[1] ?? null

  const tracking = branchLine.match(/\.\.\.(\S+)/)?.[1] ?? null

  const result: GitStatus = {
    current,
    tracking,
    isClean: lines.length === 0,
    modified: [],
    staged: [],
    not_added: [],
    deleted: [],
    renamed: [],
    conflicted: []
  }

  for (const line of lines) {
    const indexStatus = line[0]
    const workTreeStatus = line[1]
    const filePath = line.slice(3)

    if (indexStatus === '?' && workTreeStatus === '?') {
      result.not_added.push(filePath)
      continue
    }

    if (
      indexStatus === 'U' ||
      workTreeStatus === 'U' ||
      (indexStatus === 'A' && workTreeStatus === 'A') ||
      (indexStatus === 'D' && workTreeStatus === 'D')
    ) {
      result.conflicted.push(filePath)
      continue
    }

    if (indexStatus === 'R' || workTreeStatus === 'R') {
      result.renamed.push(filePath)
    }

    if (indexStatus === 'D' || workTreeStatus === 'D') {
      result.deleted.push(filePath)
    }

    if (indexStatus === 'M' || indexStatus === 'A' || indexStatus === 'R' || indexStatus === 'C') {
      result.staged.push(filePath)
    }

    if (workTreeStatus === 'M') {
      result.modified.push(filePath)
    }
  }

  return result
}
