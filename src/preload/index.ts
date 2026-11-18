import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI, type ElectronAPI } from '@electron-toolkit/preload'
import type { GitImagePaths, GitRepoInfo, GitStatus } from '../shared/git'
import type { ImageAlternativeResult, ImagePathPair } from '../shared/image'
import {
  AppChannel,
  GitChannel,
  ImageChannel,
  IndexChannel,
  ProjectChannel,
  TerminalChannel,
  type IpcInvokeMap,
  type IpcMainEventMap
} from '../shared/ipc'
import type {
  CompanyConfig,
  CompanyFolder,
  ErrorLog,
  ProjectInfo,
  RevealMode,
  TerminalConfig
} from '../shared/settings'

const invoke = <C extends keyof IpcInvokeMap>(
  channel: C,
  ...args: IpcInvokeMap[C]['args']
): Promise<IpcInvokeMap[C]['return']> => ipcRenderer.invoke(channel, ...args)

const onMainEvent = <C extends keyof IpcMainEventMap>(
  channel: C,
  callback: (...args: IpcMainEventMap[C]['args']) => void
): (() => void) => {
  const listener = (_event: IpcRendererEvent, ...args: unknown[]): void => {
    callback(...(args as IpcMainEventMap[C]['args']))
  }
  ipcRenderer.on(channel, listener)
  return () => {
    ipcRenderer.removeListener(channel, listener)
  }
}

const api = {
  selectDirectory: (defaultPath?: string): Promise<string | null> =>
    invoke(IndexChannel.selectDirectory, defaultPath),
  selectImages: (defaultPath?: string): Promise<string[] | null> =>
    invoke(IndexChannel.selectImages, defaultPath),
  selectFile: (defaultPath?: string): Promise<string | null> =>
    invoke(IndexChannel.selectFile, defaultPath),
  openExternal: (url: string): Promise<void> => invoke(IndexChannel.openExternal, url),
  revealInFileExplorer: (path: string, mode: RevealMode): Promise<boolean> =>
    invoke(IndexChannel.revealInFileExplorer, path, mode),
  onErrorLog: (callback: (error: ErrorLog) => void): (() => void) =>
    onMainEvent(AppChannel.errorLog, callback),
  project: {
    addNewProject: (project: ProjectInfo): Promise<void> =>
      invoke(ProjectChannel.addNewProject, project),
    updateProject: (project: ProjectInfo): Promise<void> =>
      invoke(ProjectChannel.updateProject, project),
    deleteProject: (project: ProjectInfo): Promise<void> =>
      invoke(ProjectChannel.deleteProject, project),
    getProjects: (): Promise<ProjectInfo[]> => invoke(ProjectChannel.getProjects),
    getCompanyFolderList: (project: ProjectInfo): Promise<CompanyFolder[]> =>
      invoke(ProjectChannel.getCompanyFolderList, project),
    getFavIconByCompanyFolder: (companyFolder: CompanyFolder): Promise<string> =>
      invoke(ProjectChannel.getFavIconByCompanyFolder, companyFolder),
    getImageFolderByCompanyFolder: (companyFolder: CompanyFolder): Promise<string> =>
      invoke(ProjectChannel.getImageFolderByCompanyFolder, companyFolder),
    switchCompanyConfig: (configFilePath: string, companyCode: string): Promise<void> =>
      invoke(ProjectChannel.switchCompanyConfig, configFilePath, companyCode),
    getActiveCompanyCode: (
      configFilePath: string,
      companyCodes: string[]
    ): Promise<string | null> =>
      invoke(ProjectChannel.getActiveCompanyCode, configFilePath, companyCodes),
    getCompanyConfigByCompanyFolder: (companyFolder: CompanyFolder): Promise<CompanyConfig> =>
      invoke(ProjectChannel.getCompanyConfigByCompanyFolder, companyFolder)
  },
  image: {
    checkImagesMatch: (props: {
      companyFolder: CompanyFolder
      newImagePaths: string[]
    }): Promise<ImageAlternativeResult> => invoke(ImageChannel.checkImagesMatch, props),
    fixImageFileNames: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      invoke(ImageChannel.fixImageFileNames, imagePairs),
    compressImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      invoke(ImageChannel.compressImages, imagePairs),
    convertImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      invoke(ImageChannel.convertImages, imagePairs),
    replaceImages: (imagePairs: ImagePathPair[]): Promise<ImagePathPair[]> =>
      invoke(ImageChannel.replaceImages, imagePairs)
  },
  git: {
    getGitStatus: (projectPath: string): Promise<GitStatus> =>
      invoke(GitChannel.getGitStatus, projectPath),
    getGitImagePaths: (projectPath: string, relativePath: string): Promise<GitImagePaths> =>
      invoke(GitChannel.getGitImagePaths, projectPath, relativePath),
    getGitRepoInfo: (projectPath: string): Promise<GitRepoInfo> =>
      invoke(GitChannel.getGitRepoInfo, projectPath)
  },
  terminal: {
    createTerminal: (): Promise<boolean> => invoke(TerminalChannel.create),
    onOutput: (callback: (data: string) => void): (() => void) =>
      onMainEvent(TerminalChannel.output, callback),
    sendInput: (input: string): void => {
      ipcRenderer.send(TerminalChannel.input, input)
    },
    disposeTerminal: (): Promise<void> => invoke(TerminalChannel.dispose),
    getTerminalConfig: (): Promise<TerminalConfig> => invoke(TerminalChannel.settings),
    updateTerminalConfig: (config: TerminalConfig): Promise<void> =>
      invoke(TerminalChannel.settingsUpdate, config)
  }
}

export type RenderAPI = typeof api

declare global {
  interface Window {
    electron: ElectronAPI
    api: RenderAPI
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
