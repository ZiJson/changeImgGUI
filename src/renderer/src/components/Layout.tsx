import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { SiteHeader } from './SiteHeader'

export default function Layout({ children }: { children: React.ReactNode }) {
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
      <SidebarInset>
        <SiteHeader />
        <div className="overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
