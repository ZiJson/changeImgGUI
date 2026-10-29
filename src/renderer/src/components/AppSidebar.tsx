import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { route } from '@renderer/route'
import { IconTerminal2, type Icon } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router'
import packageJson from '../../../../package.json'

import { useTerminalStore } from '@renderer/stores/useTerminalStore'

export const data = {
  navMain: route
}

export function AppSidebar() {
  const toggleOpen = useTerminalStore((s) => s.toggleOpen)
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain.filter((item) => !!item.title)} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton variant="outline" onClick={toggleOpen} tooltip="終端機">
              <IconTerminal2 />
              terminal
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-muted-foreground text-xs whitespace-nowrap">v {packageJson.version}</p>
      </SidebarFooter>
    </Sidebar>
  )
}

export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const location = useLocation()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link to={item.url}>
                <SidebarMenuButton tooltip={item.title} isActive={location.pathname === item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
