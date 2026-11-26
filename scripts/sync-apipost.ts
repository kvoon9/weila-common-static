import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ISSUE_ID = '739e2fbb6870000'
const ROOT_TARGET_ID = '39e2d403b7d0e8'
const PAGE_TITLE = '企业 API 手册'
const OUTPUT_PATH = 'src/pages/corp-api.md'
const SOURCE_URL = 'https://docs.apipost.net/docs/detail/739e2fbb6870000?target_id=39e2d403b7d0e8&locale=zh-cn'
const DOC_URL = `https://docs.apipost.net/doc/down?issue_id=${ISSUE_ID}`

export class SyncError extends Error {
  override name = 'SyncError'
}

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
  if (!Array.isArray(value)) throw new SyncError(`${label} 不是数组`)
  return value.map((entry, index) => {
    if (!isRecord(entry)) throw new SyncError(`${label}[${index}] 不是对象`)
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
  if (!isRecord(container)) throw new SyncError(`request.${group} 不是对象`)
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
  if (!isRecord(response)) throw new SyncError(`接口「${apiName}」的 response 不是对象`)
  if (response.example === undefined || response.example === null) return []
  if (!Array.isArray(response.example)) throw new SyncError(`接口「${apiName}」的 response.example 不是数组`)
  return response.example.map((entry, index) => {
    if (!isRecord(entry)) throw new SyncError(`接口「${apiName}」的 response.example[${index}] 不是对象`)
    const expect = isRecord(entry.expect) ? entry.expect : {}
    return {
      name: asString(expect.name),
      code: asString(expect.code),
      raw: normalizeRaw(asString(entry.raw)),
      fields: parseParams(entry.raw_parameter, `接口「${apiName}」的 response.example[${index}].raw_parameter`),
    }
  })
}

function parseApi(entry: RawRecord, marks: Map<string, string>): ApiNode {
  const name = requireString(entry.name, `接口 ${asString(entry.target_id)} 缺少 name`)
  const method = requireString(entry.method, `接口「${name}」缺少 method`)
  const rawUrl = requireString(entry.url, `接口「${name}」缺少 url`)
  let endpoint: string
  try {
    const parsed = new URL(rawUrl)
    endpoint = `${parsed.origin}${parsed.pathname}`
  } catch {
    throw new SyncError(`接口「${name}」的 url 无法解析：${rawUrl}`)
  }
  const markName = marks.get(asString(entry.mark_id)) || null

  const request = entry.request
  if (!isRecord(request)) throw new SyncError(`接口「${name}」缺少 request`)
  const body = request.body
  if (!isRecord(body)) throw new SyncError(`接口「${name}」缺少 request.body`)
  const mode = body.mode
  if (mode !== 'json' && mode !== 'none') {
    throw new SyncError(`接口「${name}」的 body.mode 不是 json 或 none：${asString(mode)}`)
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
    name: requireString(entry.name, `目录 ${asString(entry.target_id)} 缺少 name`),
    description: asString(entry.description),
    children: [],
  }
}

function parseMarks(project: unknown): Map<string, string> {
  const marks = new Map<string, string>()
  if (!isRecord(project)) return marks
  const list = project.marks
  if (list === undefined || list === null) return marks
  if (!Array.isArray(list)) throw new SyncError('project.marks 不是数组')
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
    if (Number.isNaN(time)) throw new SyncError(`无法解析 updated_at：${value}`)
    if (time > latestTime) {
      latestTime = time
      latest = value
    }
  }
  if (latest === null) throw new SyncError('list 中没有任何 updated_at')
  const match = TIME_PATTERN.exec(latest)
  if (match === null) throw new SyncError(`无法格式化 updated_at：${latest}`)
  return `${match[1]} ${match[2]}`
}

export function parseDoc(json: unknown): Manual {
  if (!isRecord(json)) throw new SyncError('响应不是对象')
  if (json.code !== 0) throw new SyncError(`接口返回 code ${asString(json.code)}：${asString(json.msg)}`)
  const data = json.data
  if (!isRecord(data) || !Array.isArray(data.list)) throw new SyncError('响应缺少 data.list')
  const list = data.list.filter((item): item is RawRecord => isRecord(item))
  if (list.length !== data.list.length) throw new SyncError('data.list 中存在非对象条目')

  const marks = parseMarks(data.project)
  const entries = new Map<string, Entry>()
  for (const [index, item] of list.entries()) {
    const id = requireString(item.target_id, `list[${index}] 缺少 target_id`)
    const parentId = requireString(item.parent_id, `list[${index}] 缺少 parent_id`)
    const type = item.target_type
    if (type !== 'api' && type !== 'folder') {
      throw new SyncError(`list[${index}]（${id}）的 target_type 不是 api 或 folder：${asString(type)}`)
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
      if (seen.has(current)) throw new SyncError(`parent_id 成环：${current}`)
      seen.add(current)
      const item = entries.get(current)
      if (item === undefined) throw new SyncError(`parent_id ${current} 不在 list 中`)
      if (item.parentId === '0') break
      current = item.parentId
    }
  }

  const root = entries.get(ROOT_TARGET_ID)
  if (root === undefined) throw new SyncError(`list 中缺少根目录 ${ROOT_TARGET_ID}`)
  if (root.node.kind !== 'folder') throw new SyncError(`根目录 ${ROOT_TARGET_ID} 不是 folder`)

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
    projectName: requireString(data.project_name, '响应缺少 data.project_name'),
    pathNames,
    updatedAt: latestUpdatedAt(list),
    children: (childrenByParent.get(root.id) ?? []).map(attach),
  }
}

function plain(value: string): string {
  return value.replace(/\s*[\r\n]+\s*/g, ' ').trim()
}

function textLine(value: string): string {
  return plain(value).replaceAll('<', '&lt;')
}

function cellText(value: string): string {
  return plain(value).replaceAll('<', '&lt;').replaceAll('|', '\\|') || '-'
}

function longestBacktickRun(value: string): number {
  let longest = 0
  let current = 0
  for (const character of value) {
    if (character === '`') {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}

function codeSpan(value: string): string {
  const text = plain(value)
  const fence = '`'.repeat(longestBacktickRun(text) + 1)
  const padding = /^`|`$/.test(text) ? ' ' : ''
  return `${fence}${padding}${text}${padding}${fence}`
}

function tableCode(value: string): string {
  return codeSpan(value).replaceAll('|', '\\|')
}

function fencedJsonc(raw: string): string {
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(raw) + 1))
  return `${fence}jsonc\n${raw}\n${fence}`
}

function pushTable(blocks: string[], headers: string[], rows: string[][]): void {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ]
  blocks.push(lines.join('\n'))
}

const WITH_EXAMPLE_HEADERS = ['参数名', '类型', '必填', '说明', '示例值']
const WITHOUT_EXAMPLE_HEADERS = ['参数名', '类型', '必填', '说明']

function parameterRow(parameter: Parameter, withExample: boolean): string[] {
  const row = [
    tableCode(parameter.key),
    cellText(parameter.type),
    parameter.required ? '是' : '否',
    cellText(parameter.description),
  ]
  if (withExample) row.push(parameter.value === '' ? '-' : tableCode(parameter.value))
  return row
}

function pushParameterTable(blocks: string[], label: string, params: Parameter[], withExample: boolean): void {
  const rows = params
    .filter((parameter) => parameter.key !== '')
    .map((parameter) => parameterRow(parameter, withExample))
  if (rows.length === 0) return
  blocks.push(`**${label}**`)
  pushTable(blocks, withExample ? WITH_EXAMPLE_HEADERS : WITHOUT_EXAMPLE_HEADERS, rows)
}

function exampleTitle(example: ResponseExample, index: number): string {
  const name = textLine(example.name)
  const code = textLine(example.code)
  if (name !== '' && code !== '') return `**${name}（${code}）**`
  if (name !== '') return `**${name}**`
  return `**示例 ${index + 1}**`
}

function renderNode(node: TreeNode, level: number, blocks: string[]): void {
  blocks.push(`${'#'.repeat(level)} ${textLine(node.name)}`)
  const description = textLine(node.description)
  if (description !== '') blocks.push(description)
  if (node.kind === 'folder') {
    for (const child of node.children) renderNode(child, level + 1, blocks)
    return
  }

  blocks.push(`${codeSpan(node.method)} ${codeSpan(node.endpoint)}`)
  if (node.markName !== null) blocks.push(`状态：**${textLine(node.markName)}**`)
  pushParameterTable(blocks, 'Path 参数', node.pathParameters, true)
  pushParameterTable(blocks, 'Query 参数', node.queryParameters, true)
  pushParameterTable(blocks, 'Header 参数', node.headerParameters, true)
  pushParameterTable(blocks, 'Cookie 参数', node.cookieParameters, true)

  if (node.body !== null) {
    blocks.push('**请求 Body**')
    blocks.push(fencedJsonc(node.body))
  }

  for (const [index, example] of node.examples.entries()) {
    if (example.raw === '' && !example.fields.some((field) => field.key !== '')) continue
    blocks.push(exampleTitle(example, index))
    if (example.raw !== '') blocks.push(fencedJsonc(example.raw))
    pushParameterTable(blocks, '响应字段', example.fields, false)
  }
}

export function renderManual(manual: Manual): string {
  const path = manual.pathNames.map((name) => textLine(name)).join(' / ')
  const blocks = [
    "---\nlayout: '~/layouts/Typo.astro'\n---",
    `# ${textLine(manual.title)}`,
    `> 来源：[Apipost 文档「${path}」](${manual.sourceUrl})（${textLine(manual.projectName)}），上游更新于 ${manual.updatedAt}。`,
  ]
  for (const node of manual.children) renderNode(node, 2, blocks)
  return `${blocks.join('\n\n')}\n`
}

async function fetchDoc(): Promise<unknown> {
  const response = await fetch(DOC_URL)
  if (!response.ok) throw new SyncError(`下载 Apipost 文档失败：HTTP ${response.status}`)
  return response.json()
}

async function main(argv: string[]): Promise<number> {
  try {
    const manual = parseDoc(await fetchDoc())
    const markdown = renderManual(manual)
    if (argv.includes('--check')) {
      const current = await readFile(OUTPUT_PATH, 'utf8').catch(() => null)
      if (current === markdown) {
        console.log(`${OUTPUT_PATH} 与上游一致`)
        return 0
      }
      console.error(`${OUTPUT_PATH} 与上游不一致，请运行 pnpm sync:apipost 生成最新内容`)
      return 1
    }
    const directory = dirname(OUTPUT_PATH)
    await mkdir(directory, { recursive: true })
    const temporary = join(directory, `.${basename(OUTPUT_PATH)}.tmp`)
    await writeFile(temporary, markdown)
    await rename(temporary, OUTPUT_PATH)
    console.log(`已写入 ${OUTPUT_PATH}`)
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
