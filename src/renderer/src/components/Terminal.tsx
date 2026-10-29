import { useSetting } from '@renderer/hooks/useSetting'
import { useTerminalStore } from '@renderer/stores/useTerminalStore'
import { cn } from 'cn'
import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css' // 引入xterm的基础样式

const TerminalComponent = () => {
  const terminalRef = useRef(null)
  const terminalInstanceRef = useRef<Terminal>(null)
  const fitAddonRef = useRef(new FitAddon())
  const open = useTerminalStore((s) => s.open)
  const { terminalConfig } = useSetting()

  useEffect(() => {
    if (!terminalRef.current|| !terminalConfig?.selected) return
    console.log('update')

    // 初始化终端实例
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    })
    // 挂载适配插件，让终端自动填充容器
    terminal.loadAddon(fitAddonRef.current)
    terminal.open(terminalRef.current)
    fitAddonRef.current.fit()
    // 调用主进程创建pty连接
    window.api.terminal.createTerminal()

    // 接收主进程发来的输出，写入终端
    window.api.terminal.onOutput((data) => {
      terminal.write(data)
    })

    // 监听用户输入，发送给主进程
    terminal.onData((input) => {
      window.api.terminal.sendInput(input)
    })

    terminalInstanceRef.current = terminal

    // 组件卸载时清理终端实例
    return () => {
      terminal.dispose()
      window.api.terminal.disposeTerminal()
    }
  }, [terminalConfig?.selected])

  useEffect(() => {
    if (!terminalRef.current) return
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current.fit()
    })

    resizeObserver.observe(terminalRef.current!)
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
