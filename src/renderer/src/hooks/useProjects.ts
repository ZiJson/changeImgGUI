import { getNameFromPath } from '@renderer/lib/tool'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { ProjectInfo } from 'src/main/type/settings'

export const useProjects = (curProjects?: ProjectInfo) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: window.api.project.getProjects
  })

  const { mutateAsync: add } = useMutation({
    mutationFn: window.api.project.addNewProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: window.api.project.updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const { mutateAsync: del } = useMutation({
    mutationFn: window.api.project.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const { mutateAsync: getCompanyFolderList } = useMutation({
    mutationFn: window.api.project.getCompanyFolderList
  })

  const addNewProject = useCallback(async () => {
    const projectPath = await window.api.selectDirectory()

    if (projectPath) {
      const project: ProjectInfo = {
        name: getNameFromPath(projectPath),
        path: projectPath,
        description: ''
      }

      await add(project)
    }
  }, [add])

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
    isLoading,
    addNewProject,
    deleteProject,
    setCompanyListPath,
    getCompanyFolderList,
    hasCompanyListPath
  }
}
