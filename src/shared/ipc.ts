import type { GitImagePaths, GitRepoInfo, GitStatus } from './git'
import type { ImageAlternativeResult, ImagePathPair } from './image'
import type {
  CompanyConfig,
  CompanyFolder,
  ErrorLog,
  ProjectInfo,
  RevealMode,
  TerminalConfig
} from './settings'

export const IndexChannel = {
  selectDirectory: 'select-directory',
  selectImages: 'select-images',
  selectFile: 'select-file',
  openExternal: 'open-external',
  revealInFileExplorer: 'reveal-in-file-explorer'
} as const

export const ProjectChannel = {
  addNewProject: 'project:add-new-project',
  updateProject: 'project:update-project',
  deleteProject: 'project:delete-project',
  getProjects: 'project:get-projects',
  getCompanyFolderList: 'project:get-company-folder-list',
  getFavIconByCompanyFolder: 'project:get-fav-icon-by-company-folder',
  getImageFolderByCompanyFolder: 'project:get-image-folder-by-company-folder',
  switchCompanyConfig: 'project:switch-company-config',
  getActiveCompanyCode: 'project:get-active-company-code',
  getCompanyConfigByCompanyFolder: 'project:get-company-config-by-company-folder'
} as const

export const ImageChannel = {
  checkImagesMatch: 'image:check-images-match',
  fixImageFileNames: 'image:fix-image-file-names',
  compressImages: 'image:compress-images',
  convertImages: 'image:convert-images',
  replaceImages: 'image:replace-images'
} as const

export const GitChannel = {
  getGitStatus: 'git:get-git-status',
  getGitImagePaths: 'git:get-git-image-paths',
  getGitRepoInfo: 'git:get-git-repo-info'
} as const

export const TerminalChannel = {
  create: 'create-terminal',
  output: 'terminal-output',
  input: 'terminal-input',
  dispose: 'dispose-terminal',
  settings: 'terminal-settings',
  settingsUpdate: 'terminal-settings-update'
} as const

export const AppChannel = {
  errorLog: 'error-log'
} as const

type CheckImagesMatchArgs = {
  companyFolder: CompanyFolder
  newImagePaths: string[]
}

export type IpcInvokeMap = {
  [IndexChannel.selectDirectory]: { args: [defaultPath?: string]; return: string | null }
  [IndexChannel.selectImages]: { args: [defaultPath?: string]; return: string[] | null }
  [IndexChannel.selectFile]: { args: [defaultPath?: string]; return: string | null }
  [IndexChannel.openExternal]: { args: [url: string]; return: void }
  [IndexChannel.revealInFileExplorer]: { args: [path: string, mode?: RevealMode]; return: boolean }
  [ProjectChannel.addNewProject]: { args: [project: ProjectInfo]; return: void }
  [ProjectChannel.updateProject]: { args: [project: ProjectInfo]; return: void }
  [ProjectChannel.deleteProject]: { args: [project: ProjectInfo]; return: void }
  [ProjectChannel.getProjects]: { args: []; return: ProjectInfo[] }
  [ProjectChannel.getCompanyFolderList]: { args: [project: ProjectInfo]; return: CompanyFolder[] }
  [ProjectChannel.getFavIconByCompanyFolder]: {
    args: [companyFolder: CompanyFolder]
    return: string
  }
  [ProjectChannel.getImageFolderByCompanyFolder]: {
    args: [companyFolder: CompanyFolder]
    return: string
  }
  [ProjectChannel.switchCompanyConfig]: {
    args: [configFilePath: string, companyCode: string]
    return: void
  }
  [ProjectChannel.getActiveCompanyCode]: {
    args: [configFilePath: string, companyCodes: string[]]
    return: string | null
  }
  [ProjectChannel.getCompanyConfigByCompanyFolder]: {
    args: [companyFolder: CompanyFolder]
    return: CompanyConfig
  }
  [ImageChannel.checkImagesMatch]: {
    args: [props: CheckImagesMatchArgs]
    return: ImageAlternativeResult
  }
  [ImageChannel.fixImageFileNames]: { args: [imagePairs: ImagePathPair[]]; return: ImagePathPair[] }
  [ImageChannel.compressImages]: { args: [imagePairs: ImagePathPair[]]; return: ImagePathPair[] }
  [ImageChannel.convertImages]: { args: [imagePairs: ImagePathPair[]]; return: ImagePathPair[] }
  [ImageChannel.replaceImages]: { args: [imagePairs: ImagePathPair[]]; return: ImagePathPair[] }
  [GitChannel.getGitStatus]: { args: [projectPath: string]; return: GitStatus }
  [GitChannel.getGitImagePaths]: {
    args: [projectPath: string, relativePath: string]
    return: GitImagePaths
  }
  [GitChannel.getGitRepoInfo]: { args: [projectPath: string]; return: GitRepoInfo }
  [TerminalChannel.create]: { args: []; return: boolean }
  [TerminalChannel.dispose]: { args: []; return: void }
  [TerminalChannel.settings]: { args: []; return: TerminalConfig }
  [TerminalChannel.settingsUpdate]: { args: [config: TerminalConfig]; return: void }
}

export type IpcMainEventMap = {
  [TerminalChannel.output]: { args: [data: string] }
  [AppChannel.errorLog]: { args: [error: ErrorLog] }
}

export type IpcRendererEventMap = {
  [TerminalChannel.input]: { args: [input: string] }
}
