import { handle } from '../ipc-handler'
import {
  checkImagesMatch,
  compressImages,
  convertImages,
  fixImageFileNames,
  replaceImages
} from '../services/image.service'
import { ImageChannel } from '../../shared/ipc'

export const registerImageIpc = (): void => {
  handle(ImageChannel.checkImagesMatch, async (_, props) => {
    return await checkImagesMatch(props)
  })
  handle(ImageChannel.fixImageFileNames, async (_, imagePairs) => {
    return await fixImageFileNames(imagePairs)
  })
  handle(ImageChannel.compressImages, async (_, imagePairs) => {
    return await compressImages(imagePairs)
  })
  handle(ImageChannel.convertImages, async (_, imagePairs) => {
    return await convertImages(imagePairs)
  })
  handle(ImageChannel.replaceImages, async (_, imagePairs) => {
    return await replaceImages(imagePairs)
  })
}
