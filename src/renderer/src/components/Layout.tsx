import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'
import TerminalComponent from './Terminal'
import { Drawer, DrawerContent } from './ui/drawer'
import { useLayoutEffect, useState } from 'react'

import { useTerminalStore } from '@renderer/stores/useTerminalStore'
import { cn } from 'cn'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

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
      <SidebarInset className="size-full overflow-hidden">
        <SiteHeader />
        <div className="flex-1 overflow-auto p-4">{children}</div>
        <div className={cn('h-fit shrink-0 border transition-all duration-300')}>
          <TerminalComponent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
