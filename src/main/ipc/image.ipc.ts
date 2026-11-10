import { handle } from '../ipc-handler'
import {
  checkImagesMatch,
  compressImages,
  convertImages,
  fixImageFileNames,
  replaceImages
} from '../services/image.service'
import { ImageIPC } from './index.ipc'

export const registerImageIpc = (): void => {
  handle(ImageIPC.CHECK_IMAGES_MATCH, async (_, props) => {
    return await checkImagesMatch(props)
  })
  handle(ImageIPC.FIX_IMAGE_FILE_NAMES, async (_, imagePairs) => {
    return await fixImageFileNames(imagePairs)
  })
  handle(ImageIPC.COMPRESS_IMAGES, async (_, imagePairs) => {
    return await compressImages(imagePairs)
  })
  handle(ImageIPC.CONVERT_IMAGES, async (_, imagePairs) => {
    return await convertImages(imagePairs)
  })
  handle(ImageIPC.REPLACE_IMAGES, async (_, imagePairs) => {
    return await replaceImages(imagePairs)
  })
}
