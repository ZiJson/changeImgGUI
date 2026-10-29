import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CompanyFolder, ProjectInfo, TerminalConfig } from 'src/main/type/settings'
import { ImageAlternativeResult, ImagePathPair } from 'src/main/type/image'
import { StatusResult } from 'simple-git'
import { GitImagePaths } from 'src/main/type/git'

// Custom APIs for renderer
enum IndexIPC {
  SELECT_DIRECTORY = 'select-directory',
  SELECT_IMAGES = 'select-images',
  OPEN_EXTERNAL = 'open-external'
}

enum ProjectIPC {
  ADD_NEW_PROJECT = 'project:add-new-project',
  UPDATE_PROJECT = 'project:update-project',
  DELETE_PROJECT = 'project:delete-project',
  GET_PROJECTS = 'project:get-projects',
  GET_COMPANY_FOLDER_LIST = 'project:get-company-folder-list',
  GET_FAV_ICON_BY_COMPANY_FOLDER = 'project:get-fav-icon-by-company-folder',
  GET_IMAGE_FOLDER_BY_COMPANY_FOLDER = 'project:get-image-folder-by-company-folder'
}

enum ImageIPC {
  CHECK_IMAGES_MATCH = 'image:check-images-match',
  FIX_IMAGE_FILE_NAMES = 'image:fix-image-file-names',
  COMPRESS_IMAGES = 'image:compress-images',
  CONVERT_IMAGES = 'image:convert-images',
  REPLACE_IMAGES = 'image:replace-images'
}

enum GitIPC {
  GET_GIT_STATUS = 'git:get-git-status',
  GET_GIT_IMAGE_PATHS = 'git:get-git-image-paths'
}

const api = {
  selectDirectory: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke(IndexIPC.SELECT_DIRECTORY, defaultPath),
  selectImages: (defaultPath?: string): Promise<string[] | null> =>
    ipcRenderer.invoke(IndexIPC.SELECT_IMAGES, defaultPath),
  openExternal: (url: string) => ipcRenderer.invoke(IndexIPC.OPEN_EXTERNAL, url),
  project: {
    addNewProject: (project: ProjectInfo) =>
      ipcRenderer.invoke(ProjectIPC.ADD_NEW_PROJECT, project),
    updateProject: (project: ProjectInfo) => ipcRenderer.invoke(ProjectIPC.UPDATE_PROJECT, project),
    deleteProject: (project: ProjectInfo) => ipcRenderer.invoke(ProjectIPC.DELETE_PROJECT, project),
    getProjects: (): Promise<ProjectInfo[]> => ipcRenderer.invoke(ProjectIPC.GET_PROJECTS),
    getCompanyFolderList: (project: ProjectInfo): Promise<CompanyFolder[]> =>
      ipcRenderer.invoke(ProjectIPC.GET_COMPANY_FOLDER_LIST, project),
    getFavIconByCompanyFolder: (companyFolder: CompanyFolder): Promise<string> =>
      ipcRenderer.invoke(ProjectIPC.GET_FAV_ICON_BY_COMPANY_FOLDER, companyFolder),
    getImageFolderByCompanyFolder: (companyFolder: CompanyFolder): Promise<string> =>
      ipcRenderer.invoke(ProjectIPC.GET_IMAGE_FOLDER_BY_COMPANY_FOLDER, companyFolder)
  },
  image: {
    checkImagesMatch: (props: {
      companyFolder: CompanyFolder
      newImagePaths: string[]
    }): Promise<ImageAlternativeResult> => ipcRenderer.invoke(ImageIPC.CHECK_IMAGES_MATCH, props),
    fixImageFileNames: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      ipcRenderer.invoke(ImageIPC.FIX_IMAGE_FILE_NAMES, imagePairs),
    compressImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      ipcRenderer.invoke(ImageIPC.COMPRESS_IMAGES, imagePairs),
    convertImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      ipcRenderer.invoke(ImageIPC.CONVERT_IMAGES, imagePairs),
    replaceImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      ipcRenderer.invoke(ImageIPC.REPLACE_IMAGES, imagePairs)
  },
  git: {
    getGitStatus: (projectPath: string): Promise<StatusResult> =>
      ipcRenderer.invoke(GitIPC.GET_GIT_STATUS, projectPath),
    getGitImagePaths: (projectPath: string, relativePath: string): Promise<GitImagePaths> =>
      ipcRenderer.invoke(GitIPC.GET_GIT_IMAGE_PATHS, projectPath, relativePath)
  },
  terminal: {
    createTerminal: () => ipcRenderer.invoke('create-terminal'),
    onOutput: (callback: (data: string) => void) =>
      ipcRenderer.on('terminal-output', (_, data: string) => callback(data)),
    sendInput: (input: string) => ipcRenderer.send('terminal-input', input),
    disposeTerminal: () => ipcRenderer.invoke('dispose-terminal'),
    getTerminalConfig: (): Promise<TerminalConfig> => ipcRenderer.invoke('terminal-settings'),
    updateTerminalConfig: (config: TerminalConfig) =>
      ipcRenderer.invoke('terminal-settings-update', config)
  }
}

export type RenderAPI = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
