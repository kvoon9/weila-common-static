export type Parameter = {
  key: string
  type: string
  required: boolean
  description: string
  value: string
}

export type ResponseExample = {
  name: string
  code: string
  raw: string
  fields: Parameter[]
}

export type SidebarItem = {
  title: string
  description: string
  kind: 'group' | 'api'
  slug: string | null
  children: SidebarItem[]
}

export type ApiPage = {
  slug: string
  title: string
  description: string
  method: string
  endpoint: string
  markName: string | null
  pathParameters: Parameter[]
  queryParameters: Parameter[]
  headerParameters: Parameter[]
  cookieParameters: Parameter[]
  body: string | null
  examples: ResponseExample[]
}

export type WorkExportedDocsData = {
  title: string
  sourceUrl: string
  projectName: string
  pathNames: string[]
  updatedAt: string
  tree: SidebarItem[]
  pages: ApiPage[]
}
