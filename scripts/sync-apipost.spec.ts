import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseDoc, renderManual, SyncError } from './sync-apipost.ts'

const SOURCE_LINE =
  '> 来源：[Apipost 文档「上游 / 分组 / 企业api」](https://docs.apipost.net/docs/detail/739e2fbb6870000?target_id=39e2d403b7d0e8&locale=zh-cn)（示例项目），上游更新于 2026-01-02 03:04。'

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

function render(): string {
  return renderManual(parseDoc(fixture()))
}

test('renders frontmatter, title and provenance', () => {
  const markdown = render()
  assert.ok(markdown.startsWith("---\nlayout: '~/layouts/Typo.astro'\n---\n\n# 企业 API 手册\n\n"))
  assert.ok(markdown.includes(SOURCE_LINE))
})

test('nests folders and keeps sibling sort order', () => {
  const markdown = render()
  assert.ok(markdown.includes('## 取消息 | &lt;b>'))
  assert.ok(markdown.includes('## 消息\n\n消息分组说明\n\n### 发消息'))
  assert.ok(markdown.indexOf('## 取消息') < markdown.indexOf('## 消息'))
  assert.ok(!markdown.includes('## 企业api'))
})

test('renders status only when the mark exists', () => {
  const markdown = render()
  assert.ok(markdown.includes('状态：**已完成**'))
  assert.equal(markdown.split('状态：').length - 1, 1)
})

test('renders one table per non-empty parameter group', () => {
  const markdown = render()
  assert.ok(markdown.includes('**Path 参数**'))
  assert.ok(markdown.includes('| `id` | number | 是 | 路径 ID | `7` |'))
  assert.ok(markdown.includes('**Query 参数**'))
  assert.ok(markdown.includes('| `appid` | string | 是 | 查询 &lt;值> \\| 说明 | `a\\|b` |'))
  assert.ok(markdown.includes('| `optional` | string | 否 | - | - |'))
  assert.ok(!markdown.includes('没有参数名'))
  assert.ok(!markdown.includes('**Header 参数**'))
  assert.ok(!markdown.includes('**Cookie 参数**'))
  assert.ok(markdown.includes('`POST` `https://api.example.com/v2/a`'))
})

test('renders the request body with normalized line endings', () => {
  const markdown = render()
  assert.ok(markdown.includes('**请求 Body**\n\n```jsonc\n{\n\t"group_id": 1,\n\t"date": "today"\n}\n```'))
  assert.ok(!markdown.includes('\r'))
})

test('renders response fields under the example that declares them', () => {
  const markdown = render()
  const success = markdown.indexOf('**成功（200）**')
  const fields = markdown.indexOf('**响应字段**')
  const named = markdown.indexOf('**字段示例（201）**')
  const errcode = markdown.indexOf('| `errcode` | number | 是 | 错误码 |')
  const extra = markdown.indexOf('| `extra` | string | 否 | - |')
  assert.ok(success < fields && fields < named)
  assert.ok(fields < errcode && errcode < named)
  assert.ok(named < extra)
  assert.ok(markdown.includes('| `data.messages.msg_id` | number | 是 | 消息 ID |'))
  assert.equal(markdown.split('**响应字段**').length - 1, 2)
  assert.ok(!markdown.includes('失败（404）'))
  assert.ok(!markdown.includes('示例 4'))
  assert.ok(markdown.includes('```jsonc\n{\n  "errcode": 0\n}\n```'))
})

test('renders descriptions as plain text', () => {
  assert.ok(render().includes('发送 &lt;em>文本&lt;/em>'))
})

test('is deterministic', () => {
  assert.equal(render(), render())
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
