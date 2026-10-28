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
import { type Icon } from '@tabler/icons-react'
import { Link } from 'react-router'
import packageJson from '../../../../package.json'

export const data = {
  navMain: route
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader />
      <SidebarContent>
        <NavMain items={data.navMain.filter((item) => !!item.title)} />
      </SidebarContent>
      <SidebarFooter>
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
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link to={item.url}>
                <SidebarMenuButton tooltip={item.title}>
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
