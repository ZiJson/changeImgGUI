export interface AppSettings {
  projects: ProjectInfo[]
}

type ProjectInfo = {
  name: string
  path: string
  description: string
  companyListPath?: string
}

type CompanyFolder = {
  name: string
  path: string
}
