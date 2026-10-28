export interface GitImageInfo {
  path: string
  width: number | null
  height: number | null
  size: number | null // bytes
}

export interface GitImagePaths {
  current: GitImageInfo
  old: GitImageInfo
}

type GitStatus = {
  current: string | null
  tracking: string | null
  isClean: boolean
  modified: string[]
  staged: string[]
  not_added: string[]
  deleted: string[]
  renamed: string[]
  conflicted: string[]
}
