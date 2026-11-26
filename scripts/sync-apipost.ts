import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  ApiPage,
  Parameter,
  ResponseExample,
  SidebarItem,
  WorkExportedDocsData,
} from '../src/shared/work-exported-docs-types'

const ISSUE_ID = '739e2fbb6870000'
const ROOT_TARGET_ID = '39e2d403b7d0e8'
const PAGE_TITLE = '企业 API 手册'
const DATA_PATH = 'src/shared/work-exported-docs.json'
const SOURCE_URL = 'https://docs.apipost.net/docs/detail/739e2fbb6870000?target_id=39e2d403b7d0e8&locale=zh-cn'
const DOC_URL = `https://docs.apipost.net/doc/down?issue_id=${ISSUE_ID}`

export class SyncError extends Error {
  override name = 'SyncError'
}

export type ApiNode = {
  kind: 'api'
  name: string
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

export type FolderNode = {
  kind: 'folder'
  name: string
  description: string
  children: TreeNode[]
}

export type TreeNode = ApiNode | FolderNode

export type Manual = {
  title: string
  sourceUrl: string
  projectName: string
  pathNames: string[]
  updatedAt: string
  children: TreeNode[]
}

type RawRecord = Record<string, unknown>

type Entry = {
  id: string
  parentId: string
  sort: number
  node: TreeNode
}

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

const requireString = (value: unknown, message: string): string => {
  if (typeof value !== 'string' || value.trim() === '') throw new SyncError(message)
  return value
}

function parseParams(value: unknown, label: string): Parameter[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new SyncError(`${label} is not an array`)
  return value.map((entry, index) => {
    if (!isRecord(entry)) throw new SyncError(`${label}[${index}] is not an object`)
    return {
      key: asString(entry.key),
      type: asString(entry.field_type),
      required: entry.not_null === 1,
      description: asString(entry.description),
      value: asString(entry.value),
    }
  })
}

function requestParams(request: RawRecord, group: string): Parameter[] {
  const container = request[group]
  if (container === undefined || container === null) return []
  if (!isRecord(container)) throw new SyncError(`request.${group} is not an object`)
  return parseParams(container.parameter, `request.${group}.parameter`)
}

function normalizeRaw(raw: string): string {
  return raw
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
}

function parseExamples(response: unknown, apiName: string): ResponseExample[] {
  if (response === undefined || response === null) return []
  if (!isRecord(response)) throw new SyncError(`response of API "${apiName}" is not an object`)
  if (response.example === undefined || response.example === null) return []
  if (!Array.isArray(response.example)) throw new SyncError(`response.example of API "${apiName}" is not an array`)
  return response.example.map((entry, index) => {
    if (!isRecord(entry)) throw new SyncError(`response.example[${index}] of API "${apiName}" is not an object`)
    const expect = isRecord(entry.expect) ? entry.expect : {}
    return {
      name: asString(expect.name),
      code: asString(expect.code),
      raw: normalizeRaw(asString(entry.raw)),
      fields: parseParams(entry.raw_parameter, `response.example[${index}].raw_parameter of API "${apiName}"`),
    }
  })
}

function parseApi(entry: RawRecord, marks: Map<string, string>): ApiNode {
  const name = requireString(entry.name, `API ${asString(entry.target_id)} is missing name`)
  const method = requireString(entry.method, `API "${name}" is missing method`)
  const rawUrl = requireString(entry.url, `API "${name}" is missing url`)
  let endpoint: string
  try {
    const parsed = new URL(rawUrl)
    endpoint = `${parsed.origin}${parsed.pathname}`
  } catch {
    throw new SyncError(`url of API "${name}" cannot be parsed: ${rawUrl}`)
  }
  const markName = marks.get(asString(entry.mark_id)) || null

  const request = entry.request
  if (!isRecord(request)) throw new SyncError(`API "${name}" is missing request`)
  const body = request.body
  if (!isRecord(body)) throw new SyncError(`API "${name}" is missing request.body`)
  const mode = body.mode
  if (mode !== 'json' && mode !== 'none') {
    throw new SyncError(`body.mode of API "${name}" is not json or none: ${asString(mode)}`)
  }
  const rawBody = mode === 'json' ? normalizeRaw(asString(body.raw)) : ''

  const examples = parseExamples(entry.response, name)

  return {
    kind: 'api',
    name,
    description: asString(entry.description),
    method,
    endpoint,
    markName,
    pathParameters: requestParams(request, 'restful'),
    queryParameters: requestParams(request, 'query'),
    headerParameters: requestParams(request, 'header'),
    cookieParameters: requestParams(request, 'cookie'),
    body: rawBody === '' ? null : rawBody,
    examples,
  }
}

function parseFolder(entry: RawRecord): FolderNode {
  return {
    kind: 'folder',
    name: requireString(entry.name, `folder ${asString(entry.target_id)} is missing name`),
    description: asString(entry.description),
    children: [],
  }
}

function parseMarks(project: unknown): Map<string, string> {
  const marks = new Map<string, string>()
  if (!isRecord(project)) return marks
  const list = project.marks
  if (list === undefined || list === null) return marks
  if (!Array.isArray(list)) throw new SyncError('project.marks is not an array')
  for (const entry of list) {
    if (!isRecord(entry)) continue
    const id = asString(entry.mark_id)
    if (id !== '') marks.set(id, asString(entry.name))
  }
  return marks
}

const TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/

function latestUpdatedAt(list: RawRecord[]): string {
  let latest: string | null = null
  let latestTime = Number.NEGATIVE_INFINITY
  for (const entry of list) {
    const value = entry.updated_at
    if (typeof value !== 'string' || value === '') continue
    const time = Date.parse(value)
    if (Number.isNaN(time)) throw new SyncError(`cannot parse updated_at: ${value}`)
    if (time > latestTime) {
      latestTime = time
      latest = value
    }
  }
  if (latest === null) throw new SyncError('no updated_at found in list')
  const match = TIME_PATTERN.exec(latest)
  if (match === null) throw new SyncError(`cannot format updated_at: ${latest}`)
  return `${match[1]} ${match[2]}`
}

export function parseDoc(json: unknown): Manual {
  if (!isRecord(json)) throw new SyncError('response is not an object')
  if (json.code !== 0) throw new SyncError(`API returned code ${asString(json.code)}: ${asString(json.msg)}`)
  const data = json.data
  if (!isRecord(data) || !Array.isArray(data.list)) throw new SyncError('response is missing data.list')
  const list = data.list.filter((item): item is RawRecord => isRecord(item))
  if (list.length !== data.list.length) throw new SyncError('data.list contains non-object entries')

  const marks = parseMarks(data.project)
  const entries = new Map<string, Entry>()
  for (const [index, item] of list.entries()) {
    const id = requireString(item.target_id, `list[${index}] is missing target_id`)
    const parentId = requireString(item.parent_id, `list[${index}] is missing parent_id`)
    const type = item.target_type
    if (type !== 'api' && type !== 'folder') {
      throw new SyncError(`target_type of list[${index}] (${id}) is not api or folder: ${asString(type)}`)
    }
    entries.set(id, {
      id,
      parentId,
      sort: typeof item.sort === 'number' ? item.sort : 0,
      node: type === 'api' ? parseApi(item, marks) : parseFolder(item),
    })
  }

  for (const entry of entries.values()) {
    const seen = new Set<string>()
    let current = entry.id
    while (true) {
      if (seen.has(current)) throw new SyncError(`parent_id cycle at ${current}`)
      seen.add(current)
      const item = entries.get(current)
      if (item === undefined) throw new SyncError(`parent_id ${current} is not in list`)
      if (item.parentId === '0') break
      current = item.parentId
    }
  }

  const root = entries.get(ROOT_TARGET_ID)
  if (root === undefined) throw new SyncError(`list is missing the root folder ${ROOT_TARGET_ID}`)
  if (root.node.kind !== 'folder') throw new SyncError(`root folder ${ROOT_TARGET_ID} is not a folder`)

  const pathNames: string[] = []
  for (let cursor: Entry | undefined = root; cursor !== undefined;) {
    pathNames.push(cursor.node.name)
    cursor = cursor.parentId === '0' ? undefined : entries.get(cursor.parentId)
  }
  pathNames.reverse()

  const childrenByParent = new Map<string, Entry[]>()
  for (const entry of entries.values()) {
    const siblings = childrenByParent.get(entry.parentId) ?? []
    siblings.push(entry)
    childrenByParent.set(entry.parentId, siblings)
  }
  for (const siblings of childrenByParent.values()) siblings.sort((a, b) => a.sort - b.sort)

  const attach = (entry: Entry): TreeNode => {
    if (entry.node.kind !== 'folder') return entry.node
    entry.node.children = (childrenByParent.get(entry.id) ?? []).map(attach)
    return entry.node
  }

  return {
    title: PAGE_TITLE,
    sourceUrl: SOURCE_URL,
    projectName: requireString(data.project_name, 'response is missing data.project_name'),
    pathNames,
    updatedAt: latestUpdatedAt(list),
    children: (childrenByParent.get(root.id) ?? []).map(attach),
  }
}

function slugSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function endpointSegments(endpoint: string): string[] {
  return new URL(endpoint).pathname
    .split('/')
    .map(slugSegment)
    .filter((segment) => segment !== '')
}

function uniqueSlug(endpoint: string, used: Set<string>): string {
  const segments = endpointSegments(endpoint)
  const base = segments.slice(-2).join('-') || 'api'
  if (!used.has(base)) return base
  for (let count = 3; count <= segments.length; count += 1) {
    const candidate = segments.slice(-count).join('-')
    if (!used.has(candidate)) return candidate
  }
  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export function buildData(manual: Manual): WorkExportedDocsData {
  const used = new Set<string>()
  const pages: ApiPage[] = []

  const build = (nodes: TreeNode[]): SidebarItem[] =>
    nodes.map((node) => {
      if (node.kind === 'api') {
        const slug = uniqueSlug(node.endpoint, used)
        used.add(slug)
        pages.push({
          slug,
          title: node.name,
          description: node.description,
          method: node.method,
          endpoint: node.endpoint,
          markName: node.markName,
          pathParameters: node.pathParameters,
          queryParameters: node.queryParameters,
          headerParameters: node.headerParameters,
          cookieParameters: node.cookieParameters,
          body: node.body,
          examples: node.examples,
        })
        return { title: node.name, description: node.description, kind: 'api', slug, children: [] }
      }
      return {
        title: node.name,
        description: node.description,
        kind: 'group',
        slug: null,
        children: build(node.children),
      }
    })

  const rootName = manual.pathNames.at(-1) ?? manual.title
  return {
    title: manual.title,
    sourceUrl: manual.sourceUrl,
    projectName: manual.projectName,
    pathNames: manual.pathNames,
    updatedAt: manual.updatedAt,
    tree: [{ title: rootName, description: '', kind: 'group', slug: null, children: build(manual.children) }],
    pages,
  }
}

async function fetchDoc(): Promise<unknown> {
  const response = await fetch(DOC_URL)
  if (!response.ok) throw new SyncError(`failed to download the Apipost doc: HTTP ${response.status}`)
  return response.json()
}

async function readText(path: string): Promise<string | null> {
  return readFile(path, 'utf8').catch(() => null)
}

async function writeFileAtomic(path: string, content: string): Promise<void> {
  const directory = dirname(path)
  await mkdir(directory, { recursive: true })
  const temporary = join(directory, `.${basename(path)}.tmp`)
  await writeFile(temporary, content)
  await rename(temporary, path)
}

async function main(argv: string[]): Promise<number> {
  try {
    const content = `${JSON.stringify(buildData(parseDoc(await fetchDoc())), null, 2)}\n`
    if (argv.includes('--check')) {
      if ((await readText(DATA_PATH)) === content) {
        console.log(`${DATA_PATH} is up to date with the upstream`)
        return 0
      }
      console.error(`${DATA_PATH} is out of date with the upstream; run pnpm sync:apipost to regenerate it`)
      return 1
    }
    await writeFileAtomic(DATA_PATH, content)
    console.log(`Wrote ${DATA_PATH}`)
    return 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return 1
  }
}

const entryPoint = process.argv[1]
if (entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href) {
  process.exitCode = await main(process.argv.slice(2))
}
