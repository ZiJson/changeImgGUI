import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ImageChecks, ImagePathPair } from 'src/main/type/image'
import { CompanyFolder, ProjectInfo } from 'src/main/type/settings'

export const useChangeImg = () => {
  const queryClient = useQueryClient()
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [selectedCompanyFolder, setSelectedCompanyFolder] = useState<CompanyFolder | null>(null)
  const [newImagePaths, setNewImagePaths] = useState<string[]>([])

  const selectProject = (project: ProjectInfo | null) => {
    setProject(project)
    setSelectedCompanyFolder(null)
  }

  const { data: companyFolderList, isLoading: isLoadingCompanyFolderList } = useQuery({
    queryKey: ['company-folder-list', project],
    queryFn: () => window.api.project.getCompanyFolderList(project!),
    enabled: !!project
  })

  const { data: favIcon } = useQuery({
    queryKey: ['fav-icon-by-company-folder', project, selectedCompanyFolder],
    queryFn: () => window.api.project.getFavIconByCompanyFolder(selectedCompanyFolder!),
    enabled: !!project && !!selectedCompanyFolder
  })

  const { data: imageFolder } = useQuery({
    queryKey: ['image-folder-by-company-folder', project, selectedCompanyFolder],
    queryFn: () => window.api.project.getImageFolderByCompanyFolder(selectedCompanyFolder!),
    enabled: !!project && !!selectedCompanyFolder
  })

  const { data: checkResult, refetch: checkImages } = useQuery({
    queryKey: ['check-images-match', project, selectedCompanyFolder, newImagePaths],
    queryFn: () =>
      window.api.image.checkImagesMatch({
        companyFolder: selectedCompanyFolder!,
        newImagePaths
      }),
    enabled: !!project && !!selectedCompanyFolder && !!newImagePaths.length
  })

  const selectImages = async () => {
    const result = await window.api.selectImages()

    if (!result) return
    setNewImagePaths(result)
  }

  const clearImages = () => {
    setNewImagePaths([])
  }

  const fixImageFileNames = async () => {
    const imagePairs: ImagePathPair[] =
      checkResult?.results.map((p) => ({ newPath: p.newPath, oldPath: p.oldPath })) || []
    const result = await window.api.image.fixImageFileNames(imagePairs)

    if (!result) return
    setNewImagePaths(result.map((p) => p.newPath))
  }

  const fixImageFileSizes = async () => {
    const imagePairs: ImagePathPair[] =
      checkResult?.results.map((p) => ({ newPath: p.newPath, oldPath: p.oldPath })) || []
    const result = await window.api.image.compressImages(imagePairs)

    if (!result) return
    queryClient.invalidateQueries({ queryKey: ['check-images-match'] })
  }

  const fixImageFileFormats = async () => {
    const imagePairs: ImagePathPair[] =
      checkResult?.results.map((p) => ({ newPath: p.newPath, oldPath: p.oldPath })) || []
    const result = await window.api.image.convertImages(imagePairs)

    if (!result) return
    setNewImagePaths(result.map((p) => p.newPath))
  }

  const [fixLoading, setFixLoading] = useState(false)

  const fixImages = async (key: keyof ImageChecks) => {
    setFixLoading(true)
    try {
      switch (key) {
        case 'filenameMatches':
          return await fixImageFileNames()
        case 'sizeDifferenceAcceptable':
          return await fixImageFileSizes()
        case 'extensionMatches':
          return await fixImageFileFormats()
        default:
          return
      }
    } finally {
      setFixLoading(false)
    }
  }

  const [replaceImagesLoading, setReplaceImagesLoading] = useState(false)
  const replaceImages = async () => {
    setReplaceImagesLoading(true)
    try {
      const imagePairs: ImagePathPair[] =
        checkResult?.results.map((p) => ({ newPath: p.newPath, oldPath: p.oldPath })) || []
      const result = await window.api.image.replaceImages(imagePairs)

      if (!result) return
      setNewImagePaths(result.map((p) => p.newPath))
    } finally {
      setReplaceImagesLoading(false)
      queryClient.invalidateQueries({ queryKey: ['git-info'] })
      queryClient.invalidateQueries({ queryKey: ['git-image-paths'] })
    }
  }

  return {
    selectedProject: project,
    selectProject,
    selectedCompanyFolder,
    selectCompanyFolder: setSelectedCompanyFolder,
    companyFolderList,
    isLoadingCompanyFolderList,
    favIcon,
    imageFolder,
    selectImages,
    clearImages,
    newImagePaths,
    checkResult,
    checkImages,
    fixImages,
    fixLoading,
    replaceImages,
    replaceImagesLoading
  }
}
