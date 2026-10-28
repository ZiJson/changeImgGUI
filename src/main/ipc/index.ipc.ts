import { ipcMain, shell } from 'electron'
import { selectDirectory, selectImages } from '../services/setting.service'
import { registerProjectIpc } from './project.ipc'
import { registerImageIpc } from './image.ipc'
import { registerGitIpc } from './git.ipc'

export enum IndexIPC {
  SELECT_DIRECTORY = 'select-directory',
  SELECT_IMAGES = 'select-images',
  OPEN_EXTERNAL = 'open-external'
}

export enum ProjectIPC {
  ADD_NEW_PROJECT = 'project:add-new-project',
  UPDATE_PROJECT = 'project:update-project',
  DELETE_PROJECT = 'project:delete-project',
  GET_PROJECTS = 'project:get-projects',
  GET_COMPANY_FOLDER_LIST = 'project:get-company-folder-list',
  GET_FAV_ICON_BY_COMPANY_FOLDER = 'project:get-fav-icon-by-company-folder',
  GET_IMAGE_FOLDER_BY_COMPANY_FOLDER = 'project:get-image-folder-by-company-folder'
}

export enum ImageIPC {
  CHECK_IMAGES_MATCH = 'image:check-images-match',
  FIX_IMAGE_FILE_NAMES = 'image:fix-image-file-names',
  COMPRESS_IMAGES = 'image:compress-images',
  CONVERT_IMAGES = 'image:convert-images',
  REPLACE_IMAGES = 'image:replace-images'
}

export enum GitIPC {
  GET_GIT_STATUS = 'git:get-git-status',
  GET_GIT_IMAGE_PATHS = 'git:get-git-image-paths'
}

const registerIndexIpc = (): void => {
  ipcMain.handle(IndexIPC.SELECT_DIRECTORY, async (_, defaultPath) => {
    return await selectDirectory(defaultPath)
  })
  ipcMain.handle(IndexIPC.SELECT_IMAGES, async (_, defaultPath) => {
    return await selectImages(defaultPath)
  })
  ipcMain.handle(IndexIPC.OPEN_EXTERNAL, async (_, url: string) => {
  await shell.openExternal(url)
})
}

export const registerAllIpc = (): void => {
  registerIndexIpc()
  registerProjectIpc()
  registerImageIpc()
  registerGitIpc()
}
