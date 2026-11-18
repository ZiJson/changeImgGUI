import {
  gitImagePathsQueryOptions,
  gitInfoQueryOptions,
  gitRepoQueryOptions
} from '@renderer/lib/queries'
import { useQuery } from '@tanstack/react-query'
import type { ProjectInfo } from 'src/shared/settings'

export const useGitDiff = (project: ProjectInfo | null) => {
  const { data: gitStatus } = useQuery(gitInfoQueryOptions(project))
  const { data: repoInfo } = useQuery(gitRepoQueryOptions(project))

  return {
    gitStatus,
    repoInfo
  }
}

export const useGitImagePaths = (
  project: ProjectInfo | null,
  relativePath: string,
  isInView: boolean
) => {
  return useQuery(gitImagePathsQueryOptions(project, relativePath, isInView))
}
