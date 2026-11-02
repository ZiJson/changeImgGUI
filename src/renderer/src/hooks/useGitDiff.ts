import { useQuery } from '@tanstack/react-query'
import { ProjectInfo } from 'src/main/type/settings'

export const useGitDiff = (project: ProjectInfo | null) => {
  const { data: gitStatus } = useQuery({
    queryKey: ['git-info', project],
    queryFn: () => window.api.git.getGitStatus(project!.path),
    enabled: !!project,
    refetchInterval: 2000
  })

  const { data: repoInfo } = useQuery({
    queryKey: ['git-repo', project],
    queryFn: () => window.api.git.getGitRepoInfo(project!.path),
    enabled: !!project
  })

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
  return useQuery({
    queryKey: ['git-image-paths', project, relativePath],
    queryFn: () => window.api.git.getGitImagePaths(project!.path, relativePath),
    enabled: !!project && !!relativePath && isInView,
    refetchInterval: 2000
  })
}
