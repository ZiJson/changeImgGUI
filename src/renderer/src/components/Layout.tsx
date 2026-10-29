import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'
import TerminalComponent from './Terminal'
import { Drawer, DrawerContent } from './ui/drawer'
import { useLayoutEffect, useState } from 'react'

import { useTerminalStore } from '@renderer/stores/useTerminalStore'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const open = useTerminalStore((s) => s.open)
  const onOpenChange = useTerminalStore((s) => s.onOpenChange)

  useLayoutEffect(() => {
    const ele = document.querySelector('#portal')
    setContainer(ele as HTMLElement)
  }, [])
  return (
    <SidebarProvider
      className="size-full"
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 50)'
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="size-full overflow-hidden" id="portal">
        <SiteHeader />
        <div className="p-4">{children}</div>
        <Drawer
          modal={false}
          showSwipeHandle
          disablePointerDismissal
          open={open}
          onOpenChange={onOpenChange}
        >
          <DrawerContent className="h-[30vh] scrollbar-none" container={container as HTMLElement}>
            <TerminalComponent />
          </DrawerContent>
        </Drawer>
      </SidebarInset>
    </SidebarProvider>
  )
}
