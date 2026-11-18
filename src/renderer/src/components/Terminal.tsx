import { useTerminalOpen } from '@renderer/components/terminal-store'
import { useSetting } from '@renderer/hooks/useSetting'
import { cn } from 'cn'
import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const TerminalComponent = () => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  if (fitAddonRef.current === null) {
    fitAddonRef.current = new FitAddon()
  }
  const open = useTerminalOpen()
  const { terminalConfig } = useSetting()

  useEffect(() => {
    const container = terminalRef.current
    const fitAddon = fitAddonRef.current
    if (!container || !fitAddon || !terminalConfig?.selected) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    })
    terminal.loadAddon(fitAddon)
    terminal.open(container)
    fitAddon.fit()
    window.api.terminal.createTerminal()

    const unsubscribe = window.api.terminal.onOutput((data) => {
      terminal.write(data)
    })

    const inputDisposable = terminal.onData((input) => {
      window.api.terminal.sendInput(input)
    })

    return () => {
      unsubscribe()
      inputDisposable.dispose()
      terminal.dispose()
      window.api.terminal.disposeTerminal()
    }
  }, [terminalConfig?.selected])

  useEffect(() => {
    const container = terminalRef.current
    if (!container) return
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit()
    })

    resizeObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={terminalRef}
      className={cn(
        'size-full h-[200px] transition-[height] duration-300',
        open ? 'h-[200px]' : 'h-0'
      )}
    />
  )
}

export default TerminalComponent
