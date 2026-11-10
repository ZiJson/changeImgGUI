import { handle } from '../ipc-handler'
import { getGitImagePaths, getGitStatus, getRepoInfo } from '../services/git.service'
import { GitIPC } from './index.ipc'

export const registerGitIpc = (): void => {
  handle(GitIPC.GET_GIT_STATUS, async (_, projectPath) => {
    return await getGitStatus(projectPath)
  })
  handle(GitIPC.GET_GIT_IMAGE_PATHS, async (_, projectPath, relativePath) => {
    return await getGitImagePaths(projectPath, relativePath)
  })
  handle(GitIPC.GET_GIT_REPO_INFO, async (_, projectPath) => {
    return await getRepoInfo(projectPath)
  })
}
