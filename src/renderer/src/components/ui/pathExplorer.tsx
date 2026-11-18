import { getNameFromPath } from '@renderer/lib/tool'
import { MouseEventHandler } from 'react'
import type { RevealMode } from 'src/shared/settings'

interface PathExplorerProps {
  path?: string
  shortCut?: boolean
  mode?: RevealMode
}

export const PathExplorer = ({ path, mode = 'open', shortCut = false }: PathExplorerProps) => {
  if (!path) return
  const handleClick: MouseEventHandler = (e) => {
    e.stopPropagation()
    window.api.revealInFileExplorer(path, mode)
  }
  return <a onClick={handleClick}>{shortCut ? getNameFromPath(path) : path}</a>
}
