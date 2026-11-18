export interface AppSettings {
  projects: ProjectInfo[]
  terminal: TerminalConfig
}

export type ProjectInfo = {
  name: string
  path: string
  description: string
  companyListPath?: string
  configPath?: string
}

export type CompanyFolder = {
  name: string
  path: string
}

export type CompanyConfig = {
  path: string
  content: string
}

export type TerminalType = 'bash' | 'wsl'

export interface TerminalConfig {
  options: TerminalType[]
  selected: TerminalType
}

export type RevealMode = 'select' | 'open'

export interface RevealOptions {
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
