import type { CompanyFolder, ProjectInfo } from 'src/shared/settings'
import { create } from 'zustand'

interface ChangeImgStore {
  project: ProjectInfo | null
  selectedCompanyFolder: CompanyFolder | null
  newImagePaths: string[]
  actions: {
    selectProject: (project: ProjectInfo | null) => void
    selectCompanyFolder: (folder: CompanyFolder | null) => void
    setNewImagePaths: (paths: string[]) => void
  }
}

const useChangeImgStore = create<ChangeImgStore>()((set) => ({
  project: null,
  selectedCompanyFolder: null,
  newImagePaths: [],
  actions: {
    selectProject: (project) => set({ project, selectedCompanyFolder: null }),
    selectCompanyFolder: (selectedCompanyFolder) => set({ selectedCompanyFolder }),
    setNewImagePaths: (newImagePaths) => set({ newImagePaths })
  }
}))

export const useSelectedProject = (): ProjectInfo | null =>
  useChangeImgStore((state) => state.project)

export const useSelectedCompanyFolder = (): CompanyFolder | null =>
  useChangeImgStore((state) => state.selectedCompanyFolder)

export const useNewImagePaths = (): string[] => useChangeImgStore((state) => state.newImagePaths)

export const useChangeImgActions = (): ChangeImgStore['actions'] =>
  useChangeImgStore((state) => state.actions)
