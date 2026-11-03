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
