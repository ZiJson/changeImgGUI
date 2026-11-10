import { CompanyFolder, ProjectInfo } from '../type/settings'
import * as projectService from '../services/project.service'
import { ProjectIPC } from './index.ipc'
import { handle } from '../ipc-handler'

export const registerProjectIpc = (): void => {
  handle(ProjectIPC.ADD_NEW_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.addNewProject(project)
  })
  handle(ProjectIPC.UPDATE_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.updateProject(project)
  })
  handle(ProjectIPC.DELETE_PROJECT, async (_, project: ProjectInfo) => {
    return await projectService.deleteProject(project)
  })
  handle(ProjectIPC.GET_PROJECTS, async () => {
    return await projectService.getProjects()
  })
  handle(ProjectIPC.GET_COMPANY_FOLDER_LIST, async (_, project: ProjectInfo) => {
    return await projectService.getCompanyFolderList(project)
  })
  handle(ProjectIPC.GET_FAV_ICON_BY_COMPANY_FOLDER, async (_, companyFolder: CompanyFolder) => {
    return await projectService.getFavIconByCompanyFolder(companyFolder)
  })
  handle(ProjectIPC.GET_IMAGE_FOLDER_BY_COMPANY_FOLDER, async (_, companyFolder: CompanyFolder) => {
    return await projectService.getImageFolderByCompanyFolder(companyFolder)
  })
  handle(
    ProjectIPC.SWITCH_COMPANY_CONFIG,
    async (_, configFilePath: string, companyCode: string) => {
      return await projectService.switchCompanyConfig(configFilePath, companyCode)
    }
  )
  handle(
    ProjectIPC.GET_ACTIVE_COMPANY_CODE,
    async (_, configFilePath: string, companyCodes: string[]) => {
      return await projectService.getActiveCompanyCode(configFilePath, companyCodes)
    }
  )
  handle(
    ProjectIPC.GET_COMPANY_CONFIG_BY_COMPANY_FOLDER,
    async (_, companyFolder: CompanyFolder) => {
      return await projectService.getCompanyConfigByCompanyFolder(companyFolder)
    }
  )
}
