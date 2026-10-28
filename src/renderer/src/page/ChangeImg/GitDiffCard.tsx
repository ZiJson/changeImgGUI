import { LocalImg } from '@renderer/components/LocalImg'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import { useGitDiff, useGitImagePaths } from '@renderer/hooks/useGitDiff'
import { ChevronDownIcon } from 'lucide-react'
import { ProjectInfo } from 'src/main/type/settings'
import { useInView } from 'react-intersection-observer'
import {
  Attachment,
  AttachmentDescription,
  AttachmentTitle,
  AttachmentContent,
  AttachmentMedia
} from '@renderer/components/ui/attachment'
import { getNameFromPath } from '@renderer/lib/tool'
import { Separator } from '@renderer/components/ui/separator'
import { IconArrowLeftBar } from '@tabler/icons-react'
import { GitImageInfo } from 'src/main/type/git'

export const GitDiffCard = ({ project }: { project: ProjectInfo | null }) => {
  const { gitStatus } = useGitDiff(project)
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Git Diff</CardTitle>
        <CardDescription>根目錄：{project?.path}</CardDescription>
        <CardDescription>當前分支：{gitStatus?.current}</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.entries(gitStatus || {}).map(([key, value]) => {
          if (key === 'current' || key === 'tracking' || key === 'isClean') {
            return null
          }
          return <DiffList key={key} diffs={value} keyName={key} project={project} />
        })}
      </CardContent>
      <CardFooter>
        <CardDescription className="flex flex-col gap-1 text-xs">
          <p>※ 此功能僅提供diff展示，方便檢查實際尺寸大小</p>
        </CardDescription>
      </CardFooter>
    </Card>
  )
}

const DiffList = ({
  project,
  diffs,
  keyName
}: {
  diffs?: string[]
  keyName: string
  project: ProjectInfo | null
}) => {
  if (diffs === undefined) {
    return null
  }
  return (
    <Collapsible className="data-open:bg-muted">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full">
            <Badge>{diffs?.length}</Badge>
            {keyName}
            <ChevronDownIcon className="ml-auto group-data-panel-open/button:rotate-180" />
          </Button>
        }
      />
      <CollapsibleContent className="flex flex-col items-start gap-2 px-6 pt-0 pb-2.5 text-sm">
        {diffs?.map((diff) => (
          <div key={diff} className="text-muted-foreground text-xs">
            <p>{diff}</p>
            {isImage(diff) ? <DiffImage project={project} imagePath={diff} /> : null}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const isImage = (path: string) =>
  path.endsWith('.png') ||
  path.endsWith('.jpg') ||
  path.endsWith('.jpeg') ||
  path.endsWith('.webp') ||
  path.endsWith('.ico')

const DiffImage = ({ project, imagePath }: { project: ProjectInfo | null; imagePath: string }) => {
  const { ref, inView } = useInView({
    triggerOnce: true
  })
  const { data: gitImagePaths } = useGitImagePaths(project, imagePath, inView)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`

    const units = ['KB', 'MB', 'GB', 'TB']
    let size = bytes / 1024
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const getDesc = (image?: GitImageInfo) => {
    if (!image || image.size === null) {
      return ''
    }

    const dimensions =
      image.width !== null && image.height !== null ? `${image.width}x${image.height} · ` : ''

    return `${dimensions}${formatSize(image.size)}`
  }

  return (
    <div className="flex scrollbar-none flex-col items-center gap-2 overflow-auto pt-2" ref={ref}>
      <div className="bg-muted flex h-full w-full items-center gap-6 rounded-md">
        <Attachment orientation="vertical" className="w-fit!">
          <AttachmentMedia className="aspect-auto min-w-40">
            <LocalImg src={gitImagePaths?.old.path} alt="diff" className="h-40 object-cover" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{getNameFromPath(imagePath)}</AttachmentTitle>
            <AttachmentDescription>{getDesc(gitImagePaths?.old)}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <div className="flex items-center gap-2">
          old
          <IconArrowLeftBar className="rotate-180" />
          new
        </div>
        <Attachment orientation="vertical" className="w-fit!">
          <AttachmentMedia className="aspect-auto min-w-40">
            <LocalImg src={gitImagePaths?.current.path} alt="diff" className="h-40 object-cover" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{getNameFromPath(imagePath)}</AttachmentTitle>
            <AttachmentDescription>{getDesc(gitImagePaths?.current)}</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </div>
      <Separator />
    </div>
  )
}
