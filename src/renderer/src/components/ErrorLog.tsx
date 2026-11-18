import { useEffect, useState } from 'react'
import { Bug, ChevronDown, Clock, Copy, Trash2 } from 'lucide-react'
import { type ErrorLog as ErrorLogEntry } from 'src/shared/settings'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from './ui/drawer'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import { Separator } from './ui/separator'

export function ErrorLog() {
  const [open, setOpen] = useState(false)
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([])

  const onClear = () => {
    setErrorLogs([])
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

  const copyLog = async (error: ErrorLogEntry) => {
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
            className="fixed right-0 bottom-0 z-50 shadow-lg"
          >
            <Bug data-icon="inline-start" />
            Error Logs
            {errorLogs.length > 0 && <Badge variant="secondary">{errorLogs.length}</Badge>}
          </Button>
        }
      />

      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Error Logs</DrawerTitle>
          <DrawerDescription>主程序錯誤日誌與例外追蹤</DrawerDescription>
          <Badge variant={errorLogs.length > 0 ? 'destructive' : 'secondary'}>
            {errorLogs.length} errors
          </Badge>
        </DrawerHeader>
        <Separator />

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {errorLogs.length === 0 ? (
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bug />
                </EmptyMedia>
                <EmptyTitle>沒有錯誤紀錄</EmptyTitle>
                <EmptyDescription>目前沒有任何主程序錯誤。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {errorLogs.map((error) => (
                <Card key={error.id} size="sm">
                  <CardHeader>
                    <CardTitle className="break-words">{error.message}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{error.channel}</Badge>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(error.timestamp)}
                      </span>
                    </CardDescription>
                    <CardAction>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyLog(error)}
                        title="Copy error log"
                      >
                        <Copy />
                      </Button>
                    </CardAction>
                  </CardHeader>
                  {error.stack && (
                    <CardContent>
                      <Collapsible>
                        <CollapsibleTrigger
                          className="w-full"
                          render={
                            <Button variant="ghost" size="sm" className="w-full justify-between" />
                          }
                        >
                          Stack Trace
                          <ChevronDown data-icon="inline-end" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="bg-muted text-muted-foreground mt-2 max-h-64 overflow-auto rounded-md p-4 font-mono text-xs">
                            <code>{error.stack}</code>
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {errorLogs.length > 0 && (
          <DrawerFooter>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">
                {errorLogs.length} error records
              </span>
              <Button variant="destructive" size="sm" onClick={onClear}>
                <Trash2 data-icon="inline-start" />
                Clear Logs
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
