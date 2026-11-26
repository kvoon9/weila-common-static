import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { WorkExportedDocsData } from '../src/shared/work-exported-docs-types'
import { parseDoc, renderSite, SyncError, type GeneratedFile } from './sync-apipost.ts'

const TREE_PATH = 'src/shared/work-exported-docs.json'

function fixture() {
  return {
    code: 0,
    msg: '成功',
    data: {
      project_name: '示例项目',
      project: {
        marks: [
          { mark_id: '1', name: '已完成' },
          { mark_id: '2', name: '需修改' },
        ],
      },
      list: [
        {
          target_id: 'up',
          parent_id: '0',
          target_type: 'folder',
          name: '上游',
          sort: 1,
          updated_at: '2025-01-01T00:00:00+08:00',
        },
        {
          target_id: 'group',
          parent_id: 'up',
          target_type: 'folder',
          name: '分组',
          sort: 1,
          updated_at: '2025-01-01T00:00:00+08:00',
        },
        {
          target_id: '39e2d403b7d0e8',
          parent_id: 'group',
          target_type: 'folder',
          name: '企业api',
          sort: 1,
          updated_at: '2025-01-01T00:00:00+08:00',
        },
        {
          target_id: 'folder-a',
          parent_id: '39e2d403b7d0e8',
          target_type: 'folder',
          name: '消息',
          sort: 2,
          description: '消息分组说明',
          updated_at: '2025-01-01T00:00:00+08:00',
        },
        {
          target_id: 'api-a',
          parent_id: '39e2d403b7d0e8',
          target_type: 'api',
          name: '取消息 | <b>',
          sort: 1,
          method: 'POST',
          url: 'https://api.example.com/v2/a?appid=x&sign=y&et=1',
          mark_id: '1',
          description: '',
          updated_at: '2026-01-02T03:04:05+08:00',
          request: {
            restful: {
              parameter: [{ key: 'id', field_type: 'number', not_null: 1, description: '路径 ID', value: '7' }],
            },
            query: {
              parameter: [
                {
                  key: 'appid',
                  field_type: 'string',
                  not_null: 1,
                  description: '查询 <值> | 说明',
                  value: 'a|b',
                },
                { key: '', field_type: 'string', not_null: 1, description: '没有参数名', value: '跳过' },
                { key: 'optional', field_type: 'string', not_null: -1, description: '', value: '' },
              ],
            },
            header: { parameter: [] },
            cookie: { parameter: [] },
            body: { mode: 'json', raw: '{\r\n\t"group_id": 1,   \r\n\t"date": "today"\r\n}' },
          },
          response: {
            example: [
              {
                example_id: '1',
                raw: '{\r\n  "errcode": 0\r\n}',
                raw_parameter: [
                  { key: 'errcode', field_type: 'number', not_null: 1, description: '错误码', value: '0' },
                  {
                    key: 'data.messages.msg_id',
                    field_type: 'number',
                    not_null: 1,
                    description: '消息 ID',
                    value: '1',
                  },
                ],
                expect: { code: '200', name: '成功' },
              },
              {
                example_id: '2',
                raw: '',
                raw_parameter: [],
                expect: { code: '404', name: '失败' },
              },
              {
                example_id: '3',
                raw: '',
                raw_parameter: [{ key: 'extra', field_type: 'string', not_null: -1, description: '', value: '' }],
                expect: { code: '201', name: '字段示例' },
              },
              {
                example_id: '4',
                raw: '',
                raw_parameter: [],
                expect: { code: '', name: '' },
              },
            ],
          },
        },
        {
          target_id: 'api-b',
          parent_id: 'folder-a',
          target_type: 'api',
          name: '发消息',
          sort: 1,
          method: 'GET',
          url: 'https://api.example.com/v2/b?appid=x',
          mark_id: '9',
          description: '发送 <em>文本</em>',
          updated_at: '2025-01-01T00:00:00+08:00',
          request: {
            restful: { parameter: [] },
            query: { parameter: [] },
            header: { parameter: [] },
            cookie: { parameter: [] },
            body: { mode: 'none', raw: '' },
          },
          response: { example: [] },
        },
      ],
    },
  }
}

function minimalDoc() {
  return {
    code: 0,
    msg: '成功',
    data: {
      project_name: '示例项目',
      project: { marks: [] },
      list: [
        {
          target_id: '39e2d403b7d0e8',
          parent_id: '0',
          target_type: 'folder',
          name: '企业api',
          sort: 1,
          updated_at: '2026-01-01T00:00:00+08:00',
        },
        {
          target_id: 'api',
          parent_id: '39e2d403b7d0e8',
          target_type: 'api',
          name: '接口',
          sort: 1,
          method: 'GET',
          url: 'https://example.com/v2/api',
          mark_id: '1',
          description: '',
          updated_at: '2026-01-01T00:00:00+08:00',
          request: {
            restful: { parameter: [] },
            query: { parameter: [] },
            header: { parameter: [] },
            cookie: { parameter: [] },
            body: { mode: 'none', raw: '' },
          },
          response: { example: [] },
        },
      ],
    },
  }
}

type MinimalDoc = ReturnType<typeof minimalDoc>

function lastItem(doc: MinimalDoc) {
  return doc.data.list[1] as {
    target_type: string
    parent_id: string
    url: string
    request: { body: { mode: string } }
  }
}

function render(): GeneratedFile[] {
  return renderSite(parseDoc(fixture()))
}

function data(): WorkExportedDocsData {
  const file = render().find((item) => item.path === TREE_PATH)
  assert.ok(file, `missing ${TREE_PATH}`)
  return JSON.parse(file.content) as WorkExportedDocsData
}

test('writes a single data file', () => {
  assert.deepEqual(
    render().map((file) => file.path),
    [TREE_PATH],
  )
})

test('keeps the manual metadata', () => {
  const manual = data()
  assert.equal(manual.title, '企业 API 手册')
  assert.equal(
    manual.sourceUrl,
    'https://docs.apipost.net/docs/detail/739e2fbb6870000?target_id=39e2d403b7d0e8&locale=zh-cn',
  )
  assert.equal(manual.projectName, '示例项目')
  assert.deepEqual(manual.pathNames, ['上游', '分组', '企业api'])
  assert.equal(manual.updatedAt, '2026-01-02 03:04')
})

test('builds the sidebar tree in upstream order', () => {
  assert.deepEqual(data().tree, [
    {
      title: '企业api',
      description: '',
      kind: 'group',
      slug: null,
      children: [
        { title: '取消息 | <b>', description: '', kind: 'api', slug: 'v2-a', children: [] },
        {
          title: '消息',
          description: '消息分组说明',
          kind: 'group',
          slug: null,
          children: [
            {
              title: '发消息',
              description: '发送 <em>文本</em>',
              kind: 'api',
              slug: 'v2-b',
              children: [],
            },
          ],
        },
      ],
    },
  ])
})

test('writes one page per api with parsed request details', () => {
  const manual = data()
  assert.equal(manual.pages.length, 2)
  assert.deepEqual(
    manual.pages.map((page) => page.slug),
    ['v2-a', 'v2-b'],
  )

  const page = manual.pages[0]!
  assert.equal(page.title, '取消息 | <b>')
  assert.equal(page.description, '')
  assert.equal(page.method, 'POST')
  assert.equal(page.endpoint, 'https://api.example.com/v2/a')
  assert.equal(page.markName, '已完成')
  assert.deepEqual(page.pathParameters, [
    { key: 'id', type: 'number', required: true, description: '路径 ID', value: '7' },
  ])
  assert.deepEqual(
    page.queryParameters.map((parameter) => parameter.key),
    ['appid', '', 'optional'],
  )
  assert.equal(page.body, '{\n\t"group_id": 1,\n\t"date": "today"\n}')
})

test('keeps response examples and their fields', () => {
  const page = data().pages[0]!
  assert.equal(page.examples.length, 4)
  const success = page.examples[0]!
  assert.equal(success.name, '成功')
  assert.equal(success.code, '200')
  assert.equal(success.raw, '{\n  "errcode": 0\n}')
  assert.deepEqual(
    success.fields.map((field) => field.key),
    ['errcode', 'data.messages.msg_id'],
  )
  assert.equal(page.examples[1]!.raw, '')
  assert.deepEqual(
    page.examples[2]!.fields.map((field) => field.key),
    ['extra'],
  )
})

test('keeps descriptions raw for the renderer to escape', () => {
  const page = data().pages[1]!
  assert.equal(page.description, '发送 <em>文本</em>')
  assert.equal(page.markName, null)
})

test('adds path segments when endpoint slugs collide', () => {
  const doc = minimalDoc()
  const list = doc.data.list as unknown as Array<Record<string, unknown>>
  list.push({
    target_id: 'api-2',
    parent_id: '39e2d403b7d0e8',
    target_type: 'api',
    name: '接口 2',
    sort: 2,
    method: 'GET',
    url: 'https://example.com/x/v2/api',
    mark_id: '',
    description: '',
    updated_at: '2026-01-01T00:00:00+08:00',
    request: {
      restful: { parameter: [] },
      query: { parameter: [] },
      header: { parameter: [] },
      cookie: { parameter: [] },
      body: { mode: 'none', raw: '' },
    },
    response: { example: [] },
  })
  const manual = JSON.parse(renderSite(parseDoc(doc))[0]!.content) as WorkExportedDocsData
  assert.deepEqual(
    manual.pages.map((page) => page.slug),
    ['v2-api', 'x-v2-api'],
  )
})

test('is deterministic', () => {
  assert.deepEqual(render(), render())
})

test('throws SyncError for an upstream error code', () => {
  const doc = minimalDoc()
  doc.code = 1
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError when data.list is missing', () => {
  const doc = minimalDoc()
  delete (doc.data as Record<string, unknown>).list
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError when the root folder is missing', () => {
  const doc = minimalDoc()
  doc.data.list = doc.data.list.filter((item) => item.target_id !== '39e2d403b7d0e8')
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError for an unknown target_type', () => {
  const doc = minimalDoc()
  lastItem(doc).target_type = 'endpoint'
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError for an unknown body mode', () => {
  const doc = minimalDoc()
  lastItem(doc).request.body.mode = 'form'
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError for an unparsable url', () => {
  const doc = minimalDoc()
  lastItem(doc).url = 'not a url'
  assert.throws(() => parseDoc(doc), SyncError)
})

test('throws SyncError for a dangling parent_id', () => {
  const doc = minimalDoc()
  lastItem(doc).parent_id = 'ghost'
  assert.throws(() => parseDoc(doc), SyncError)
})
