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
