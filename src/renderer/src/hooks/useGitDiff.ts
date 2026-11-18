import {
  gitImagePathsQueryOptions,
  gitInfoQueryOptions,
  gitRepoQueryOptions
} from '@renderer/lib/queries'
import { useQuery } from '@tanstack/react-query'
import type { ProjectInfo } from 'src/shared/settings'

export const useGitDiff = (project: ProjectInfo | null) => {
  const { data: gitStatus, isLoading: isLoadingGitStatus } = useQuery(gitInfoQueryOptions(project))
  const { data: repoInfo, isLoading: isLoadingRepoInfo } = useQuery(gitRepoQueryOptions(project))

  return {
    gitStatus,
    repoInfo,
    isLoadingGitStatus,
    isLoadingRepoInfo
  }
}

export const useGitImagePaths = (
  project: ProjectInfo | null,
  relativePath: string,
  isInView: boolean
) => {
  return useQuery(gitImagePathsQueryOptions(project, relativePath, isInView))
}
