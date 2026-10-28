import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

let checking = false
let promptOpen = false

export const setupAutoUpdater = () => {
  // 開發環境不檢查更新
  if (!app.isPackaged) return

  // 找到新版時先不要自動下載
  autoUpdater.autoDownload = false

  // 不要因為使用者一般退出 App，就自動安裝已下載的更新
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    console.info('[Updater] 正在檢查更新')
  })

  autoUpdater.on('update-not-available', (info) => {
    console.info('[Updater] 已是最新版本：', info.version)
    checking = false
  })

  autoUpdater.on('update-available', async (info) => {
    checking = false

    if (promptOpen) return
    promptOpen = true

    try {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: '發現新版本',
        message: `發現新版 ${info.version}`,
        detail: `目前版本：${app.getVersion()}\n是否下載並安裝更新？`,
        buttons: ['下載更新', '稍後再說'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      })

      if (response !== 0) return

      await autoUpdater.downloadUpdate()

      // 正常情況下會由 update-downloaded 事件提示安裝
    } catch (error) {
      console.error('[Updater] 下載更新失敗', error)

      await dialog.showMessageBox({
        type: 'error',
        title: '更新失敗',
        message: '無法下載更新，請稍後再試。',
        detail: error instanceof Error ? error.message : String(error)
      })
    } finally {
      promptOpen = false
    }
  })

  autoUpdater.on('download-progress', (progress) => {
    console.info(`[Updater] 下載進度：${progress.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: '更新已下載',
      message: `版本 ${info.version} 已下載完成`,
      detail: '重新啟動應用程式即可完成更新。現在要重新啟動嗎？',
      buttons: ['立即重新啟動', '稍後再說'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    })

    if (response === 0) {
      autoUpdater.quitAndInstall()
    }
  })

  autoUpdater.on('error', (error) => {
    checking = false
    console.error('[Updater] 更新錯誤', error)
  })
}

export const checkForUpdates = async () => {
  if (!app.isPackaged || checking) return

  checking = true

  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    checking = false
    console.error('[Updater] 檢查更新失敗', error)
  }
}
