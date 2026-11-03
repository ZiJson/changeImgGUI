import { isDirectory } from '@renderer/lib/tool'
import { MouseEventHandler } from 'react'
import { RevealMode } from 'src/main/type/settings'

export const PathExplorer = ({ path }: { path?: string }) => {
  if (!path) return
  const mode: RevealMode = isDirectory(path) ? 'open' : 'select'
  const handleClick: MouseEventHandler = (e) => {
    e.stopPropagation()
    window.api.revealInFileExplorer(path, mode)
  }
  return <a onClick={handleClick}>{path}</a>
}
