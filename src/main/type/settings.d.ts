export interface AppSettings {
  projects: ProjectInfo[]
  terminal: TerminalConfig
}

type ProjectInfo = {
  name: string
  path: string
  description: string
  companyListPath?: string
  configPath?: string
}

type CompanyFolder = {
  name: string
  path: string
}

type CompanyConfig = {
  path: string
  content: string
}

type TerminalType = 'bash' | 'wsl'

interface TerminalConfig {
  options: TerminalType[]
  selected: TerminalType
}

type RevealMode = 'select' | 'open'

interface RevealOptions {
  path: string
  mode?: RevealMode
}

export type ErrorLog = {
  id: string
  channel: string
  message: string
  stack?: string
  timestamp: number
}
