export interface GitImageInfo {
  path: string
  width: number | null
  height: number | null
  size: number | null
}

export interface GitImagePaths {
  current: GitImageInfo
  old: GitImageInfo
}

export type GitStatus = {
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

export type GitRepoInfo = {
  root: string
}
