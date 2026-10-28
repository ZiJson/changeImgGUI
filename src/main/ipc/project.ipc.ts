import { ipcMain } from 'electron'
import { CompanyFolder, ProjectInfo } from '../type/settings'
import * as projectService from '../services/project.service'
import { ProjectIPC } from './index.ipc'

export const registerProjectIpc = (): void => {
  ipcMain.handle(ProjectIPC.ADD_NEW_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.addNewProject(project)
  })
  ipcMain.handle(ProjectIPC.UPDATE_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.updateProject(project)
  })
  ipcMain.handle(ProjectIPC.DELETE_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.deleteProject(project)
  })
  ipcMain.handle(ProjectIPC.GET_PROJECTS, async () => {
    return await projectService.getProjects()
  })
  ipcMain.handle(ProjectIPC.GET_COMPANY_FOLDER_LIST, async (_, project: ProjectInfo) => {
    return await projectService.getCompanyFolderList(project)
  })
  ipcMain.handle(
    ProjectIPC.GET_FAV_ICON_BY_COMPANY_FOLDER,
    async (_, companyFolder: CompanyFolder) => {
      return await projectService.getFavIconByCompanyFolder(companyFolder)
    }
  )
  ipcMain.handle(
    ProjectIPC.GET_IMAGE_FOLDER_BY_COMPANY_FOLDER,
    async (_, companyFolder: CompanyFolder) => {
      return await projectService.getImageFolderByCompanyFolder(companyFolder)
    }
  )
}
