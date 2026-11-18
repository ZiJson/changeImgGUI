import {
  useChangeImgActions,
  useNewImagePaths,
  useSelectedCompanyFolder,
  useSelectedProject
} from '@renderer/page/ChangeImg/change-img-store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { ImageChecks, ImagePathPair } from 'src/shared/image'
import {
  activeCompanyCodeQueryOptions,
  checkImagesQueryOptions,
  companyConfigQueryOptions,
  companyFolderListQueryOptions,
  favIconQueryOptions,
  imageFolderQueryOptions,
  queryKeys
} from '@renderer/lib/queries'

const toImagePairs = (
  results: { newPath: string; oldPath: string | null }[] | undefined
): ImagePathPair[] =>
  results?.map((pair) => ({ newPath: pair.newPath, oldPath: pair.oldPath })) ?? []

export const useChangeImg = () => {
  const queryClient = useQueryClient()
  const project = useSelectedProject()
  const selectedCompanyFolder = useSelectedCompanyFolder()
  const newImagePaths = useNewImagePaths()
  const { selectProject, selectCompanyFolder, setNewImagePaths } = useChangeImgActions()

  const { data: companyFolderList, isLoading: isLoadingCompanyFolderList } = useQuery(
    companyFolderListQueryOptions(project)
  )

  const { data: favIcon, isLoading: isLoadingFavIcon } = useQuery(
    favIconQueryOptions(project, selectedCompanyFolder)
  )

  const { data: imageFolder, isLoading: isLoadingImageFolder } = useQuery(
    imageFolderQueryOptions(project, selectedCompanyFolder)
  )

  const {
    data: companyConfig,
    refetch: refetchCompanyConfig,
    isLoading: isLoadingCompanyConfig
  } = useQuery(companyConfigQueryOptions(project, selectedCompanyFolder))

  const {
    data: checkResult,
    refetch: checkImages,
    isFetching: isCheckingImages
  } = useQuery(checkImagesQueryOptions(project, selectedCompanyFolder, newImagePaths))

  const { data: activeCompanyCode, isLoading: isLoadingActiveCompanyCode } = useQuery(
    activeCompanyCodeQueryOptions(project, companyFolderList?.map((company) => company.name) ?? [])
  )

  const { mutateAsync: switchCompanyConfig, isPending: isSwitchingCompany } = useMutation({
    mutationKey: ['switchConfig', project, selectedCompanyFolder],
    mutationFn: () =>
      window.api.project.switchCompanyConfig(project!.configPath!, selectedCompanyFolder!.name!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeCompanyCodeAll })
    }
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
    const imagePairs = toImagePairs(checkResult?.results)
    const result = await window.api.image.fixImageFileNames(imagePairs)

    if (!result) return
    setNewImagePaths(result.map((pair) => pair.newPath))
  }

  const fixImageFileSizes = async () => {
    const imagePairs = toImagePairs(checkResult?.results)
    const result = await window.api.image.compressImages(imagePairs)

    if (!result) return
    queryClient.invalidateQueries({ queryKey: queryKeys.checkImagesAll })
  }

  const fixImageFileFormats = async () => {
    const imagePairs = toImagePairs(checkResult?.results)
    const result = await window.api.image.convertImages(imagePairs)

    if (!result) return
    setNewImagePaths(result.map((pair) => pair.newPath))
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
      const imagePairs = toImagePairs(checkResult?.results)
      const result = await window.api.image.replaceImages(imagePairs)

      if (!result) return
      setNewImagePaths(result.map((pair) => pair.newPath))
    } finally {
      setReplaceImagesLoading(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.gitInfoAll })
      queryClient.invalidateQueries({ queryKey: queryKeys.gitImagePathsAll })
    }
  }

  return {
    selectedProject: project,
    selectProject,
    selectedCompanyFolder,
    selectCompanyFolder,
    companyFolderList,
    isLoadingCompanyFolderList,
    favIcon,
    isLoadingFavIcon,
    imageFolder,
    isLoadingImageFolder,
    selectImages,
    clearImages,
    newImagePaths,
    checkResult,
    isCheckingImages,
    checkImages,
    fixImages,
    fixLoading,
    replaceImages,
    replaceImagesLoading,
    switchCompanyConfig,
    isSwitchingCompany,
    activeCompanyCode,
    isLoadingActiveCompanyCode,
    companyConfig,
    isLoadingCompanyConfig,
    refetchCompanyConfig
  }
}
