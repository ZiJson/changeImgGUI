import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle
} from '@renderer/components/ui/field'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@renderer/components/ui/item'
import { Input } from '@renderer/components/ui/input'
import { PathExplorer } from '@renderer/components/ui/pathExplorer'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Spinner } from '@renderer/components/ui/spinner'
import { useProjects } from '@renderer/hooks/useProjects'
import { useSetting } from '@renderer/hooks/useSetting'
import { IconChevronDown, IconFolderOpen } from '@tabler/icons-react'
import { useState } from 'react'
import type { ProjectInfo } from 'src/shared/settings'

const Settings = () => {
  const { projects, pickNewProject, createProject, isAdding, isPickingProject, isProjectsLoading } =
    useProjects()
  const { terminalConfig, onTerminalChange, isLoadingTerminalConfig, isUpdatingTerminal } =
    useSetting()
  const [draft, setDraft] = useState<ProjectInfo | null>(null)
  const [name, setName] = useState('')

  const onAdd = async () => {
    const next = await pickNewProject()
    if (!next) return
    setDraft(next)
    setName(next.name)
  }

  const onConfirmName = async () => {
    if (!draft || isAdding) return
    await createProject({ ...draft, name })
    setDraft(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="min-w-sm">
        <CardHeader>
          <CardTitle>目前web專案</CardTitle>
          <CardDescription>※ 可選擇wsl上專案並自動使用wsl git 環境</CardDescription>
          <Badge className="bg-sky-50 p-1 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            盤口路徑
          </Badge>
          <CardAction>
            <Button size="sm" onClick={onAdd} disabled={isAdding || isPickingProject}>
              {(isAdding || isPickingProject) && <Spinner data-icon="inline-start" />}
              新增
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isProjectsLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            projects.map((project) => <ProjectItem key={project.path} project={project} />)
          )}
        </CardContent>
      </Card>
      <Card className="min-w-sm">
        <CardHeader>
          <CardTitle>Terminal</CardTitle>
          <CardDescription>終端機類型</CardDescription>
          {isUpdatingTerminal && (
            <CardAction>
              <Spinner />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingTerminalConfig ? (
            <Skeleton className="h-16 w-full max-w-sm" />
          ) : (
            <RadioGroup
              value={terminalConfig?.selected || ''}
              onValueChange={(value) => onTerminalChange(value)}
              disabled={isUpdatingTerminal}
              className="max-w-sm"
            >
              {terminalConfig?.options.map((opt) => (
                <FieldLabel key={opt} htmlFor={`term=${opt}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{opt}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem value={opt} id={`term=${opt}`} disabled={isUpdatingTerminal} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open && !isAdding) setDraft(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>命名專案</DialogTitle>
            <DialogDescription>預設使用資料夾名稱，可以改成更好記的顯示名稱。</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">顯示名稱</FieldLabel>
              <Input
                id="project-name"
                value={name}
                autoFocus
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void onConfirmName()
                  }
                }}
              />
            </Field>
            <Field>
              <FieldLabel>路徑</FieldLabel>
              <PathExplorer path={draft?.path} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={isAdding}>
              取消
            </Button>
            <Button onClick={onConfirmName} disabled={isAdding}>
              {isAdding && <Spinner data-icon="inline-start" />}
              建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const ProjectItem = ({ project }: { project: ProjectInfo }) => {
  const { setCompanyListPath, hasCompanyListPath, setConfigPath, deleteProject, isDeleting } =
    useProjects(project)
  const [pendingPath, setPendingPath] = useState<'company' | 'config' | null>(null)

  const onSetCompanyListPath = async () => {
    setPendingPath('company')
    try {
      await setCompanyListPath()
    } finally {
      setPendingPath(null)
    }
  }

  const onSetConfigPath = async () => {
    setPendingPath('config')
    try {
      await setConfigPath()
    } finally {
      setPendingPath(null)
    }
  }

  return (
    <Collapsible className="data-open:bg-muted">
      <CollapsibleTrigger
        className="group"
        render={
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{project.name}</ItemTitle>
              <ItemDescription>
                <PathExplorer path={project.path} />
              </ItemDescription>
              <ItemDescription>{project.description}</ItemDescription>
            </ItemContent>
            <ItemMedia>
              {hasCompanyListPath && (
                <Badge className="size-3 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"></Badge>
              )}
            </ItemMedia>
            <ItemActions>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={(event) => {
                  event.stopPropagation()
                  void deleteProject(project)
                }}
              >
                {isDeleting && <Spinner data-icon="inline-start" />}
                刪除
              </Button>
              <Button variant="ghost" size="xs">
                <IconChevronDown className="ml-auto group-data-panel-open:rotate-180" />
              </Button>
            </ItemActions>
          </Item>
        }
      />
      <CollapsibleContent className="bg-muted flex flex-col items-start gap-2 p-2.5 text-sm">
        <Item variant="outline" size="xs">
          <ItemContent>
            <ItemTitle>companyList</ItemTitle>
            <ItemDescription>{project.companyListPath || '未設定'}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingPath !== null}
              onClick={onSetCompanyListPath}
            >
              {pendingPath === 'company' ? <Spinner /> : <IconFolderOpen />}
            </Button>
          </ItemActions>
        </Item>
        <Item variant="outline" size="xs">
          <ItemContent>
            <ItemTitle>multipage.config.js</ItemTitle>
            <ItemDescription>{project.configPath || '未設定'}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingPath !== null}
              onClick={onSetConfigPath}
            >
              {pendingPath === 'config' ? <Spinner /> : <IconFolderOpen />}
            </Button>
          </ItemActions>
        </Item>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default Settings
