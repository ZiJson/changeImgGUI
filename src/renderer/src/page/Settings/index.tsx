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
import { Field, FieldContent, FieldLabel, FieldTitle } from '@renderer/components/ui/field'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@renderer/components/ui/item'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { useProjects } from '@renderer/hooks/useProjects'
import { useSetting } from '@renderer/hooks/useSetting'
import { IconChevronDown, IconFolderOpen } from '@tabler/icons-react'
import { ProjectInfo } from 'src/main/type/settings'

const Settings = () => {
  const { projects, addNewProject, deleteProject } = useProjects()
  const { terminalConfig, onTerminalChange } = useSetting()

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
            <Button size="sm" onClick={addNewProject}>
              新增
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {projects.map((project) => (
            <ProjectItem
              key={project.path}
              project={project}
              onDelete={() => deleteProject(project)}
            />
          ))}
        </CardContent>
      </Card>
      <Card className="min-w-sm">
        <CardHeader>
          <CardTitle>Terminal</CardTitle>
          <CardDescription>終端機類型</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={terminalConfig?.selected || ''}
            onValueChange={(v) => onTerminalChange(v)}
            className="max-w-sm"
          >
            {terminalConfig?.options.map((opt) => (
              <FieldLabel key={opt} htmlFor={`term=${opt}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{opt}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem value={opt} id={`term=${opt}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}

const ProjectItem = ({ project, onDelete }: { project: ProjectInfo; onDelete: () => void }) => {
  const { setCompanyListPath, hasCompanyListPath } = useProjects(project)

  return (
    <Collapsible className="data-open:bg-muted">
      <CollapsibleTrigger
        className="group"
        render={
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{project.name}</ItemTitle>
              <ItemDescription>{project.path}</ItemDescription>
              <ItemDescription>{project.description}</ItemDescription>
            </ItemContent>
            <ItemMedia>
              {hasCompanyListPath && (
                <Badge className="size-3 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"></Badge>
              )}
            </ItemMedia>
            <ItemActions>
              <Button variant="destructive" size="sm" onClick={onDelete}>
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
            <Button variant="outline" size="sm" onClick={() => setCompanyListPath()}>
              <IconFolderOpen />
            </Button>
          </ItemActions>
        </Item>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default Settings
