import { IconDashboard, IconPhotoCog } from '@tabler/icons-react'
// import Home from '@renderer/page/Home'
import Settings from '@renderer/page/Settings'
import ChangeImg from './page/ChangeImg'

export const route = [
  // {
  //   title: '首頁',
  //   url: '/',
  //   icon: IconListDetails,
  //   element: <Home />
  // },
  {
    title: '盤口更換圖片',
    url: '/changeImg',
    icon: IconPhotoCog,
    element: <ChangeImg />
  },
  {
    title: '設定',
    url: '/settings',
    icon: IconDashboard,
    element: <Settings />
  }
]
