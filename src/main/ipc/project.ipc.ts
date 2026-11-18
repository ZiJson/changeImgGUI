import type { CompanyFolder, ProjectInfo } from '../../shared/settings'
import * as projectService from '../services/project.service'
import { ProjectChannel } from '../../shared/ipc'
import { handle } from '../ipc-handler'

export const registerProjectIpc = (): void => {
  handle(ProjectChannel.addNewProject, async (_, project: ProjectInfo) => {
    return await projectService.addNewProject(project)
  })
  handle(ProjectChannel.updateProject, async (_, project: ProjectInfo) => {
    return await projectService.updateProject(project)
  })
  handle(ProjectChannel.deleteProject, async (_, project: ProjectInfo) => {
    return await projectService.deleteProject(project)
  })
  handle(ProjectChannel.getProjects, async () => {
    return await projectService.getProjects()
  })
  handle(ProjectChannel.getCompanyFolderList, async (_, project: ProjectInfo) => {
    return await projectService.getCompanyFolderList(project)
  })
  handle(ProjectChannel.getFavIconByCompanyFolder, async (_, companyFolder: CompanyFolder) => {
    return await projectService.getFavIconByCompanyFolder(companyFolder)
  })
  handle(ProjectChannel.getImageFolderByCompanyFolder, async (_, companyFolder: CompanyFolder) => {
    return await projectService.getImageFolderByCompanyFolder(companyFolder)
  })
  handle(
    ProjectChannel.switchCompanyConfig,
    async (_, configFilePath: string, companyCode: string) => {
      return await projectService.switchCompanyConfig(configFilePath, companyCode)
    }
  )
  handle(
    ProjectChannel.getActiveCompanyCode,
    async (_, configFilePath: string, companyCodes: string[]) => {
      return await projectService.getActiveCompanyCode(configFilePath, companyCodes)
    }
  )
  handle(
    ProjectChannel.getCompanyConfigByCompanyFolder,
    async (_, companyFolder: CompanyFolder) => {
      return await projectService.getCompanyConfigByCompanyFolder(companyFolder)
    }
  )
}
