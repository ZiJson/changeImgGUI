import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css' // 引入xterm的基础样式

const TerminalComponent = () => {
  const terminalRef = useRef(null)
  const terminalInstanceRef = useRef<Terminal>(null)
  const fitAddonRef = useRef(new FitAddon())

  useEffect(() => {
    if (!terminalRef.current) return

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
  }, [])

  return <div ref={terminalRef} className="size-full border" />
}

export default TerminalComponent
