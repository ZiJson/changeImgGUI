import { ElectronAPI } from '@electron-toolkit/preload'
import { RenderAPI } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: RenderAPI
  }
}
