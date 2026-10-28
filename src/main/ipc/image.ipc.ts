import { ipcMain } from 'electron'
import {
  checkImagesMatch,
  compressImages,
  convertImages,
  fixImageFileNames,
  replaceImages
} from '../services/image.service'
import { ImageIPC } from './index.ipc'

export const registerImageIpc = (): void => {
  ipcMain.handle(ImageIPC.CHECK_IMAGES_MATCH, async (_, props) => {
    return await checkImagesMatch(props)
  })
  ipcMain.handle(ImageIPC.FIX_IMAGE_FILE_NAMES, async (_, imagePairs) => {
    return await fixImageFileNames(imagePairs)
  })
  ipcMain.handle(ImageIPC.COMPRESS_IMAGES, async (_, imagePairs) => {
    return await compressImages(imagePairs)
  })
  ipcMain.handle(ImageIPC.CONVERT_IMAGES, async (_, imagePairs) => {
    return await convertImages(imagePairs)
  })
  ipcMain.handle(ImageIPC.REPLACE_IMAGES, async (_, imagePairs) => {
    return await replaceImages(imagePairs)
  })
}
