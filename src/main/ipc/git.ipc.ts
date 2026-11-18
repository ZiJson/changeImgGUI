import { handle } from '../ipc-handler'
import { getGitImagePaths, getGitStatus, getRepoInfo } from '../services/git.service'
import { GitChannel } from '../../shared/ipc'

export const registerGitIpc = (): void => {
  handle(GitChannel.getGitStatus, async (_, projectPath) => {
    return await getGitStatus(projectPath)
  })
  handle(GitChannel.getGitImagePaths, async (_, projectPath, relativePath) => {
    return await getGitImagePaths(projectPath, relativePath)
  })
  handle(GitChannel.getGitRepoInfo, async (_, projectPath) => {
    return await getRepoInfo(projectPath)
  })
}
