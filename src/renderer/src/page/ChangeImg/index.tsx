import { LocalImg } from '@renderer/components/LocalImg'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@renderer/components/ui/item'
import {
  Select,
  SelectContent,
  SelectValue,
  SelectTrigger,
  SelectGroup,
  SelectItem
} from '@renderer/components/ui/select'
import { Spinner } from '@renderer/components/ui/spinner'
import { useChangeImg } from '@renderer/hooks/useChangeImg'
import { useProjects } from '@renderer/hooks/useProjects'
import { cn } from '@renderer/lib/utils'
import {
  IconArrowsExchange2,
  IconCheck,
  IconLibraryPhoto,
  IconTrash,
  IconX
} from '@tabler/icons-react'
import { ImageChecks } from 'src/main/type/image'
import { GitDiffCard } from './GitDiffCard'
import { getNameFromPath } from '@renderer/lib/tool'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@renderer/components/ui/combobox'

const ChangeImg = () => {
  const { projects } = useProjects()
  const {
    selectedProject,
    selectProject,
    companyFolderList,
    selectCompanyFolder,
    selectedCompanyFolder,
    favIcon,
    imageFolder,
    selectImages,
    clearImages,
    newImagePaths,
    checkResult,
    fixImages,
    fixLoading,
    replaceImages,
    replaceImagesLoading
  } = useChangeImg()
  const items = projects.map((p) => ({
    value: p,
    label: p.name
  }))
  const companyItems =
    companyFolderList?.map((p) => ({
      label: p.name,
      value: p
    })) || []

  console.log(checkResult)
  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Web 專案</CardTitle>
          <CardAction>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue>{(v) => v?.name || '選擇專案'}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem
                      key={item.value.companyListPath}
                      value={item.value}
                      disabled={!item.value.companyListPath}
                      onClick={() => selectProject(item.value)}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <CardDescription className="text-xs">※ 僅可選擇已設定companyList的專案</CardDescription>
        </CardFooter>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>盤口</CardTitle>
          <CardAction>
            <Combobox
              items={companyItems}
              itemToStringValue={(item: (typeof companyItems)[0]) => item.label}
            >
              <ComboboxInput
                placeholder="選擇盤口"
                disabled={!companyFolderList?.length}
                className="w-[180px]"
              />
              <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: (typeof companyItems)[0]) => (
                    <ComboboxItem
                      key={item.label}
                      value={item}
                      onClick={() => selectCompanyFolder(item.value)}
                    >
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </CardAction>
        </CardHeader>
        {selectedCompanyFolder && (
          <CardContent>
            <Item
              variant="outline"
              render={
                <div>
                  <ItemContent>
                    <ItemTitle>Favicon</ItemTitle>
                    <ItemDescription>{favIcon}</ItemDescription>
                  </ItemContent>
                  <ItemMedia variant="image">
                    <LocalImg src={favIcon} alt="favicon" className="object-cover" />
                  </ItemMedia>
                </div>
              }
            />
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>靜態圖片目錄</ItemTitle>
                <ItemDescription>{imageFolder}</ItemDescription>
              </ItemContent>
            </Item>
          </CardContent>
        )}
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>匯入替換圖片</CardTitle>
          <CardDescription>共 {newImagePaths.length} 個圖片</CardDescription>
          <CardAction className="flex gap-2">
            <Button size="sm" onClick={selectImages}>
              <IconLibraryPhoto />
              選取圖片
              <span className="sr-only">匯入替換圖片</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!newImagePaths.length}
              onClick={clearImages}
            >
              <IconTrash />
              清空
            </Button>
          </CardAction>
        </CardHeader>
        {newImagePaths.length > 0 && (
          <CardContent className="flex flex-row gap-4">
            <div className="flex-1">
              <div className="bg-muted h-fit">
                {checkResult?.results.map((p) => {
                  return (
                    <Item key={p.newPath} size="xs" className="h-10">
                      <ItemContent className="flex flex-row items-center justify-between gap-2 text-xs">
                        <div className="flex-3">{getNameFromPath(p.newPath)}</div>
                        <IconArrowsExchange2 className={cn('text-muted-foreground flex-1')} />
                        <div className="flex-3 text-right">
                          {getNameFromPath(p.oldPath || '') || '_'}
                        </div>
                      </ItemContent>
                    </Item>
                  )
                })}
              </div>
              <CardDescription
                className={cn(
                  'mt-2 text-right',
                  checkResult?.summary.unmatched &&
                    checkResult?.summary.unmatched > 0 &&
                    'text-destructive'
                )}
              >{`${checkResult?.summary.matched} / ${checkResult?.summary.total} 已匹配`}</CardDescription>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-muted">
                {checkResult?.results.map((p) => {
                  return (
                    <Item key={p.newPath} size="xs" className="h-10">
                      <ItemContent className="flex flex-row items-center gap-3! text-xs opacity-60">
                        {Object.entries(p.checks).map(([key, value]) => {
                          return (
                            <Badge
                              key={key}
                              className={
                                value
                                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                              }
                            >
                              {value ? <IconCheck /> : <IconX />}
                              {checkNameMap[key as keyof ImageChecks].label}
                            </Badge>
                          )
                        })}
                      </ItemContent>
                    </Item>
                  )
                })}
                {checkResult && (
                  <Item size="xs">
                    <ItemContent className="flex flex-row items-center gap-3! pt-1 text-xs">
                      {Object.entries(checkNameMap).map(([key, value]) => {
                        const needFix =
                          checkResult.summary.checks[key as keyof ImageChecks].failed > 0
                        return (
                          <div key={key} className="relative -translate-y-1/2">
                            <Button
                              className="absolute z-10 w-full"
                              size="xs"
                              variant="outline"
                              title={value.description}
                              disabled={key === 'aspectRatioMatches' || fixLoading || !needFix}
                              onClick={() => fixImages(key as keyof ImageChecks)}
                            >
                              {fixLoading ? <Spinner /> : '修正'}
                            </Button>
                            <Badge className="opacity-0">
                              {value ? <IconCheck /> : <IconX />}
                              {value.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </ItemContent>
                  </Item>
                )}
              </div>
              <Button
                disabled={checkResult?.summary.unmatched !== 0 || replaceImagesLoading}
                onClick={replaceImages}
              >
                {replaceImagesLoading ? <Spinner /> : null}
                替換圖片
              </Button>
            </div>
          </CardContent>
        )}
        <CardFooter>
          <CardDescription className="flex flex-col gap-1 text-xs">
            <p>※ 需所有圖片皆匹配成功才可替換</p>
            <p>※ 此功能僅提供圖片比對修正與替換，其餘請配合IDE使用</p>
          </CardDescription>
        </CardFooter>
      </Card>

      <GitDiffCard project={selectedProject} />
    </div>
  )
}

export default ChangeImg

const checkNameMap: Record<
  keyof ImageChecks,
  {
    label: string
    description: string
  }
> = {
  filenameMatches: { label: '檔名', description: '修改檔案名稱' },
  extensionMatches: { label: '副檔名', description: '圖片轉檔' },
  aspectRatioMatches: { label: '長寬比一致', description: '剪裁圖片' },
  sizeDifferenceAcceptable: { label: '檔案大小差異', description: '圖片壓縮' }
}
