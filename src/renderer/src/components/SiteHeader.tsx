import { Separator } from '@renderer/components/ui/separator'
import { SidebarTrigger } from '@renderer/components/ui/sidebar'
import { useLocation } from 'react-router'
import { data } from './AppSidebar'
import packageJson from '../../../../package.json'
import { Button } from './ui/button'


export function SiteHeader() {
  const location = useLocation()
  const title = data.navMain.find((item) => item.url === location.pathname)?.title
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" size="icon" />
      <Separator orientation="vertical" className="my-2" />
      <h1 className="text-base font-medium">{title}</h1>
      <div className='flex-1 flex items-center justify-end'>
      <Button variant='link' onClick={()=>window.api.openExternal(packageJson.homepage)}>
        GITHUB
      </Button>
      </div>
    </header>
  )
}
