import { queryOptions } from '@tanstack/react-query'
import type { CompanyFolder, ProjectInfo } from 'src/shared/settings'

export const queryKeys = {
  projects: ['projects'] as const,
  companyFolderList: (project: ProjectInfo | null) => ['company-folder-list', project] as const,
  favIcon: (project: ProjectInfo | null, folder: CompanyFolder | null) =>
    ['fav-icon-by-company-folder', project, folder] as const,
  imageFolder: (project: ProjectInfo | null, folder: CompanyFolder | null) =>
    ['image-folder-by-company-folder', project, folder] as const,
  companyConfig: (project: ProjectInfo | null, folder: CompanyFolder | null) =>
    ['company-config-by-company-folder', project, folder] as const,
  checkImages: (project: ProjectInfo | null, folder: CompanyFolder | null, paths: string[]) =>
    ['check-images-match', project, folder, paths] as const,
  activeCompanyCode: (project: ProjectInfo | null) => ['activeCompanyCode', project] as const,
  activeCompanyCodeAll: ['activeCompanyCode'] as const,
  gitInfo: (project: ProjectInfo | null) => ['git-info', project] as const,
  gitInfoAll: ['git-info'] as const,
  gitRepo: (project: ProjectInfo | null) => ['git-repo', project] as const,
  gitImagePaths: (project: ProjectInfo | null, relativePath: string) =>
    ['git-image-paths', project, relativePath] as const,
  gitImagePathsAll: ['git-image-paths'] as const,
  checkImagesAll: ['check-images-match'] as const,
  terminal: ['terminal'] as const,
  terminalConfig: ['terminal', 'config'] as const
}

export const projectsQueryOptions = queryOptions({
  queryKey: queryKeys.projects,
  queryFn: () => window.api.project.getProjects()
})

export const companyFolderListQueryOptions = (project: ProjectInfo | null) =>
  queryOptions({
    queryKey: queryKeys.companyFolderList(project),
    queryFn: () => window.api.project.getCompanyFolderList(project!),
    enabled: !!project
  })

export const favIconQueryOptions = (project: ProjectInfo | null, folder: CompanyFolder | null) =>
  queryOptions({
    queryKey: queryKeys.favIcon(project, folder),
    queryFn: () => window.api.project.getFavIconByCompanyFolder(folder!),
    enabled: !!project && !!folder
  })

export const imageFolderQueryOptions = (
  project: ProjectInfo | null,
  folder: CompanyFolder | null
) =>
  queryOptions({
    queryKey: queryKeys.imageFolder(project, folder),
    queryFn: () => window.api.project.getImageFolderByCompanyFolder(folder!),
    enabled: !!project && !!folder
  })

export const companyConfigQueryOptions = (
  project: ProjectInfo | null,
  folder: CompanyFolder | null
) =>
  queryOptions({
    queryKey: queryKeys.companyConfig(project, folder),
    queryFn: () => window.api.project.getCompanyConfigByCompanyFolder(folder!),
    refetchInterval: 1000,
    enabled: !!project && !!folder
  })

export const checkImagesQueryOptions = (
  project: ProjectInfo | null,
  folder: CompanyFolder | null,
  newImagePaths: string[]
) =>
  queryOptions({
    queryKey: queryKeys.checkImages(project, folder, newImagePaths),
    queryFn: () =>
      window.api.image.checkImagesMatch({
        companyFolder: folder!,
        newImagePaths
      }),
    enabled: !!project && !!folder && newImagePaths.length > 0
  })

export const activeCompanyCodeQueryOptions = (
  project: ProjectInfo | null,
  companyCodes: string[]
) =>
  queryOptions({
    queryKey: queryKeys.activeCompanyCode(project),
    queryFn: () => window.api.project.getActiveCompanyCode(project!.configPath!, companyCodes),
    enabled: !!project?.configPath && companyCodes.length > 0
  })

export const gitInfoQueryOptions = (project: ProjectInfo | null) =>
  queryOptions({
    queryKey: queryKeys.gitInfo(project),
    queryFn: () => window.api.git.getGitStatus(project!.path),
    enabled: !!project,
    refetchInterval: 2000
  })

export const gitRepoQueryOptions = (project: ProjectInfo | null) =>
  queryOptions({
    queryKey: queryKeys.gitRepo(project),
    queryFn: () => window.api.git.getGitRepoInfo(project!.path),
    enabled: !!project
  })

export const gitImagePathsQueryOptions = (
  project: ProjectInfo | null,
  relativePath: string,
  isInView: boolean
) =>
  queryOptions({
    queryKey: queryKeys.gitImagePaths(project, relativePath),
    queryFn: () => window.api.git.getGitImagePaths(project!.path, relativePath),
    enabled: !!project && !!relativePath && isInView,
    refetchInterval: 2000
  })

export const terminalConfigQueryOptions = queryOptions({
  queryKey: queryKeys.terminalConfig,
  queryFn: () => window.api.terminal.getTerminalConfig()
})
