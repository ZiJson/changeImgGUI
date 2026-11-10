'use client'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from './ui/drawer'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { type ErrorLog } from 'src/main/type/settings'
import { AlertCircle, Bug, ChevronDown, ChevronUp, Clock, Copy, Trash2 } from 'lucide-react'

export function ErrorLog() {
  const [open, setOpen] = useState(false)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const onClear = () => {
    setErrorLogs([])
    setExpandedIds([])
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })

  const copyLog = async (error: ErrorLog) => {
    await navigator.clipboard.writeText(
      [
        `Message: ${error.message}`,
        `Channel: ${error.channel}`,
        `Time: ${formatTime(error.timestamp)}`,
        `Stack: ${error.stack ?? 'N/A'}`
      ].join('\n')
    )
  }

  useEffect(() => {
    return window.api.onErrorLog((error) => {
      setErrorLogs((prev) => [...prev, error])
    })
  }, [])

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        render={
          <Button
            variant={errorLogs.length > 0 ? 'destructive' : 'ghost'}
            title="Error Logs"
            className="fixed right-0 bottom-0 z-50 gap-2 shadow-lg"
          >
            <Bug className="size-4" />
            {errorLogs.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-xs">
                {errorLogs.length}
              </span>
            )}
          </Button>
        }
      />

      <DrawerContent className="flex flex-col">
        {/* Header */}
        <DrawerHeader className="border-b pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 rounded-lg p-2">
                <AlertCircle className="text-destructive size-5" />
              </div>

              <div>
                <DrawerTitle>Error Logs</DrawerTitle>
                <DrawerDescription className="text-xs">主程序錯誤日誌與例外追蹤</DrawerDescription>
              </div>
            </div>

            <div className="text-right">
              <p className="text-destructive text-lg font-bold tabular-nums">{errorLogs.length}</p>
              <p className="text-muted-foreground text-xs">Total Errors</p>
            </div>
          </div>
        </DrawerHeader>

        {/* Logs */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {errorLogs.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
              <div className="bg-muted rounded-full p-4">
                <Bug className="size-8" />
              </div>
              <p className="font-medium">No errors found</p>
              <p className="text-sm">目前沒有任何錯誤紀錄</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {errorLogs.map((error) => {
                const expanded = expandedIds.includes(error.id)

                return (
                  <div key={error.id} className="bg-card overflow-hidden rounded-xl border">
                    {/* Error Info */}
                    <div className="flex items-start gap-3 p-4">
                      <AlertCircle className="text-destructive mt-0.5 size-5 shrink-0" />

                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-semibold break-words">{error.message}</p>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-muted rounded-md px-2 py-1 font-mono text-xs">
                            {error.channel}
                          </span>

                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            {formatTime(error.timestamp)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLog(error)}
                        title="Copy error log"
                      >
                        <Copy />
                      </Button>
                    </div>

                    {/* Stack Trace */}
                    {error.stack && (
                      <div className="bg-muted/30 border-t">
                        <button
                          onClick={() => toggleExpand(error.id)}
                          className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between px-4 py-2 text-xs font-medium transition-colors"
                        >
                          <span>Stack Trace</span>
                          {expanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>

                        {expanded && (
                          <pre className="max-h-64 overflow-auto border-t bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300">
                            <code>{error.stack}</code>
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {errorLogs.length > 0 && (
          <div className="bg-background flex items-center justify-between border-t p-4">
            <span className="text-muted-foreground text-xs">{errorLogs.length} error records</span>

            <Button variant="destructive" size="sm" className="gap-2" onClick={onClear}>
              <Trash2 className="size-4" />
              Clear Logs
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
