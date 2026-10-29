import { CompanyFolder, ProjectInfo } from 'src/main/type/settings'
import { create } from 'zustand'

interface ChangeImgState {
  project: ProjectInfo | null
  selectedCompanyFolder: CompanyFolder | null
  newImagePaths: string[]

  setProject: (project: ProjectInfo | null) => void
  setSelectedCompanyFolder: (folder: CompanyFolder | null) => void
  setNewImagePaths: (paths: string[]) => void
}

export const useChangeImgStore = create<ChangeImgState>((set) => ({
  project: null,
  selectedCompanyFolder: null,
  newImagePaths: [],

  setProject: (project) => set({ project }),
  setSelectedCompanyFolder: (selectedCompanyFolder) => set({ selectedCompanyFolder }),
  setNewImagePaths: (newImagePaths) => set({ newImagePaths })
}))
