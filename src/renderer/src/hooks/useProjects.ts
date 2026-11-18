import { getNameFromPath } from '@renderer/lib/tool'
import { projectsQueryOptions, queryKeys } from '@renderer/lib/queries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import type { ProjectInfo } from 'src/shared/settings'

export const useProjects = (curProjects?: ProjectInfo) => {
  const queryClient = useQueryClient()
  const { data, isLoading: isProjectsLoading } = useQuery(projectsQueryOptions)

  const { mutateAsync: add, isPending: isAdding } = useMutation({
    mutationFn: window.api.project.addNewProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    }
  })

  const { mutateAsync: update, isPending: isUpdating } = useMutation({
    mutationFn: window.api.project.updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    }
  })

  const { mutateAsync: del, isPending: isDeleting } = useMutation({
    mutationFn: window.api.project.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    }
  })

  const { mutateAsync: getCompanyFolderList, isPending: isLoadingCompanyFolders } = useMutation({
    mutationFn: window.api.project.getCompanyFolderList
  })

  const [isPickingProject, setIsPickingProject] = useState(false)

  const pickNewProject = useCallback(async (): Promise<ProjectInfo | null> => {
    setIsPickingProject(true)
    try {
      const projectPath = await window.api.selectDirectory()

      if (!projectPath) return null

      return {
        name: getNameFromPath(projectPath),
        path: projectPath,
        description: ''
      }
    } finally {
      setIsPickingProject(false)
    }
  }, [])

  const createProject = useCallback(
    async (project: ProjectInfo) => {
      const name = project.name.trim() || getNameFromPath(project.path)
      await add({ ...project, name })
    },
    [add]
  )

  const setCompanyListPath = useCallback(
    async (project?: ProjectInfo) => {
      const p = project || curProjects

      if (!p) {
        return
      }
      const companyListPath = (await window.api.selectDirectory(p.path)) || undefined

      await update({ ...p, companyListPath })
    },
    [update, curProjects]
  )

  const setConfigPath = useCallback(
    async (project?: ProjectInfo) => {
      const p = project || curProjects

      if (!p) {
        return
      }
      const configPath = (await window.api.selectFile(p.path)) || undefined

      await update({ ...p, configPath })
    },
    [update, curProjects]
  )

  const deleteProject = useCallback(
    async (project?: ProjectInfo) => {
      const p = project || curProjects

      if (!p) {
        return
      }
      await del(p)
    },
    [del, curProjects]
  )

  const hasCompanyListPath = useMemo(() => {
    return !!curProjects?.companyListPath
  }, [curProjects])

  return {
    projects: data || [],
    isProjectsLoading,
    isAdding,
    isUpdating,
    isDeleting,
    isPickingProject,
    isLoadingCompanyFolders,
    pickNewProject,
    createProject,
    deleteProject,
    setCompanyListPath,
    getCompanyFolderList,
    hasCompanyListPath,
    setConfigPath
  }
}
