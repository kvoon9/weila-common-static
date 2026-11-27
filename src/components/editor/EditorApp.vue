<script setup lang="ts">
import type { EditorFile } from '~/shared/editor-types'
import { File as DiffsFile, FileDiff } from '@pierre/diffs'
import { Editor } from '@pierre/diffs/edit'
import { FileTree } from '@pierre/trees'
import { marked } from 'marked'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps<{ files: EditorFile[] }>()

/** 跟随系统深浅色,Pierre 组件据此切换主题 */
const isDark = ref(typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
const themeName = computed(() => (isDark.value ? 'pierre-dark' : 'pierre-light'))

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = (event: MediaQueryListEvent) => {
    isDark.value = event.matches
  }
  media.addEventListener('change', onChange)
  onBeforeUnmount(() => media.removeEventListener('change', onChange))
}

watch(themeName, (name) => {
  fileView.value?.setOptions({ ...fileView.value.options, theme: name })
  diffView.value?.setOptions({ ...diffView.value.options, theme: name })
})

const treeEl = ref<HTMLElement>()
const editorEl = ref<HTMLElement>()
const diffEl = ref<HTMLElement>()

const tree = shallowRef<FileTree>()
const fileView = shallowRef<DiffsFile>()
const editor = shallowRef<Editor<'file'>>()
const diffView = shallowRef<FileDiff>()

/** 当前页面内的临时改写,不落盘,刷新即还原 */
const scratch = ref<Record<string, string>>({})
const selectedId = ref(props.files[0]?.id ?? '')
const content = ref(props.files[0]?.content ?? '')
const mode = ref<'edit' | 'diff'>('edit')
const error = ref('')
const copied = ref(false)

const current = computed(() => props.files.find((file) => file.id === selectedId.value))
const dirty = computed(() => !!current.value && content.value !== current.value.content)
const previewHtml = computed(() => marked.parse(stripFrontmatter(content.value), { async: false }) as string)
const modifiedIds = computed(() => Object.keys(scratch.value))

// 当前文件对应的线上文档路由:intl/<文档>/<语言>.md → /intl/<文档>,pages/<路径>.md → /<路径>
const docHref = computed(() => {
  const id = current.value?.id
  if (!id) return null
  if (id.startsWith('intl/'))
    return `${import.meta.env.BASE_URL}intl/${id.slice('intl/'.length).replace(/\/[^/]+\.md$/, '')}`
  if (id.startsWith('pages/')) return `${import.meta.env.BASE_URL}${id.slice('pages/'.length).replace(/\.md$/, '')}`
  return null
})

interface SearchHit {
  file: EditorFile
  /** 正文命中时,第一条命中所在行的上下文片段;仅标题或路径命中时为 null */
  snippet: { before: string; match: string; after: string } | null
  /** 正文命中次数 */
  count: number
}

const searchQuery = ref('')

// 标题、路径、正文统一搜索;正文命中时带出第一条命中所在行的上下文
const searchHits = computed<SearchHit[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  const hits: SearchHit[] = []
  for (const file of props.files) {
    const lower = file.content.toLowerCase()
    const first = lower.indexOf(query)
    const named = file.title.toLowerCase().includes(query) || file.id.toLowerCase().includes(query)
    if (first === -1 && !named) continue

    let snippet: SearchHit['snippet'] = null
    let count = 0
    if (first !== -1) {
      for (let at = first; at !== -1; at = lower.indexOf(query, at + query.length)) count++

      const lineStart = file.content.lastIndexOf('\n', first) + 1
      const newline = file.content.indexOf('\n', first)
      const lineEnd = newline === -1 ? file.content.length : newline
      const before = file.content.slice(Math.max(lineStart, first - 40), first)
      const match = file.content.slice(first, first + query.length)
      const after = file.content.slice(first + query.length, Math.min(lineEnd, first + query.length + 80))
      snippet = {
        before: (first - lineStart > 40 ? '…' : '') + before,
        match,
        after: after + (lineEnd > first + query.length + 80 ? '…' : ''),
      }
    }

    hits.push({ file, snippet, count })
  }
  return hits
})

function openHit(hit: SearchHit): void {
  searchQuery.value = ''
  void openFile(hit.file.id)
}

let copiedTimer: ReturnType<typeof setTimeout> | undefined
let treeTitleObserver: MutationObserver | undefined

/** 树行是虚拟列表,滚动会重建节点;给每个文件行补原生 title,长标题悬停可看全名 */
function observeTreeTitles(): MutationObserver | undefined {
  const root = treeEl.value?.querySelector('file-tree-container')?.shadowRoot
  if (!root) return

  const apply = () => {
    root.querySelectorAll('[role="treeitem"]').forEach((row) => {
      const label = row.getAttribute('aria-label')
      if (label && row.getAttribute('title') !== label) row.setAttribute('title', label)
    })
  }
  const observer = new MutationObserver(apply)
  observer.observe(root, { childList: true, subtree: true })
  apply()
  return observer
}

function stripFrontmatter(source: string): string {
  return source.startsWith('---') ? source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : source
}

/** 文件树显示名:Markdown 标题,替代 en.md / zh-CN.md 这种难辨认的文件名 */
function treeLabel(file: EditorFile): string {
  return file.title.replace(/[/\\]/g, '／')
}

function treePath(file: EditorFile): string {
  const parts = file.id.split('/')
  parts[parts.length - 1] = treeLabel(file)
  return parts.join('/')
}

// 显示路径与真实文件 id 的双向映射;极端重名时退回原始路径,保证树里的 key 唯一
const treePathById = new Map<string, string>()
const fileByTreePath = new Map<string, EditorFile>()
for (const file of props.files) {
  let path = treePath(file)
  if (fileByTreePath.has(path)) path = file.id
  treePathById.set(file.id, path)
  fileByTreePath.set(path, file)
}

function renderFile(): void {
  if (!current.value || !fileView.value) return
  fileView.value.render({
    file: { name: current.value.id, contents: content.value },
    containerWrapper: editorEl.value,
  })
}

function syncTreeStatus(): void {
  tree.value?.setGitStatus(
    modifiedIds.value
      .map((id) => treePathById.get(id))
      .filter((path): path is string => !!path)
      .map((path) => ({ path, status: 'modified' as const })),
  )
}

function handleEdit(text: string): void {
  const file = current.value
  if (!file) return

  const wasDirty = scratch.value[file.id] !== undefined
  content.value = text

  if (text === file.content) delete scratch.value[file.id]
  else scratch.value[file.id] = text

  // 只在「干净 ↔ 有改动」切换时刷新树的角标,避免每敲一个字都重绘文件树
  if (wasDirty !== (scratch.value[file.id] !== undefined)) syncTreeStatus()
}

async function openFile(id: string): Promise<void> {
  const file = props.files.find((item) => item.id === id)
  if (!file || id === selectedId.value) return

  selectedId.value = id
  content.value = scratch.value[id] ?? file.content
  mode.value = 'edit'

  await nextTick()
  renderFile()

  // 搜索结果打开文件时同步树的选中项,并滚到可见位置
  const path = treePathById.get(id) ?? id
  tree.value?.getItem(path)?.select()
  tree.value?.scrollToPath(path, { offset: 'nearest' })
}

function resetFile(): void {
  const file = current.value
  if (!file) return

  content.value = file.content
  delete scratch.value[file.id]
  syncTreeStatus()

  if (mode.value === 'diff') mode.value = 'edit'
  void nextTick(renderFile)
}

async function copySource(): Promise<void> {
  let ok = false

  try {
    await navigator.clipboard.writeText(content.value)
    ok = true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = content.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    ok = document.execCommand('copy')
    textarea.remove()
  }

  if (!ok) {
    error.value = '复制失败,请手动选择源码复制'
    return
  }

  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 2000)
}

function renderDiff(): void {
  const file = current.value
  if (!file || !diffEl.value) return

  if (!dirty.value) {
    diffEl.value.replaceChildren()
    return
  }

  if (!diffView.value) {
    diffView.value = new FileDiff({
      theme: themeName.value,
      diffStyle: 'unified',
      overflow: 'wrap',
      disableFileHeader: true,
    })
  }

  diffView.value.render({
    oldFile: { name: file.id, contents: file.content },
    newFile: { name: file.id, contents: content.value },
    containerWrapper: diffEl.value,
  })
}

async function showDiff(): Promise<void> {
  mode.value = 'diff'
  await nextTick()
  renderDiff()
}

onMounted(async () => {
  // ?file= 深链:直接定位到指定文件(兼容历史链接)
  const query = new URLSearchParams(location.search).get('file')
  const deepFile = query ? props.files.find((file) => file.id === query) : undefined
  if (deepFile) {
    selectedId.value = deepFile.id
    content.value = deepFile.content
  }

  const id = selectedId.value

  tree.value = new FileTree({
    paths: props.files.map((file) => treePathById.get(file.id) ?? file.id),
    initialExpansion: 'open',
    initialSelectedPaths: id ? [treePathById.get(id) ?? id] : [],
    flattenEmptyDirectories: true,
    labels: {
      gitStatusTitles: {
        modified: '有临时修改',
        added: '新增',
        deleted: '删除',
        ignored: '忽略',
        renamed: '重命名',
        untracked: '未跟踪',
      },
    },
    onSelectionChange: (paths) => {
      const path = paths.find((item) => fileByTreePath.has(item))
      const file = path ? fileByTreePath.get(path) : undefined
      if (file && file.id !== selectedId.value) void openFile(file.id)
    },
  })
  tree.value.render({ containerWrapper: treeEl.value })
  treeTitleObserver = observeTreeTitles()
  syncTreeStatus()

  if (!id) return

  try {
    fileView.value = new DiffsFile({
      theme: themeName.value,
      overflow: 'wrap',
      disableFileHeader: true,
      onEditChange: (event) => {
        handleEdit(event.file.contents)
      },
    })
    renderFile()
    await fileView.value.prepareForEditing()
    editor.value = new Editor('file', {})
    editor.value.edit(fileView.value)
  } catch (reason) {
    error.value = `编辑器加载失败:${reason instanceof Error ? reason.message : String(reason)}`
  }
})

onBeforeUnmount(() => {
  clearTimeout(copiedTimer)
  treeTitleObserver?.disconnect()
  editor.value?.cleanUp('discard')
  fileView.value?.cleanUp()
  diffView.value?.cleanUp()
  tree.value?.cleanUp()
})
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-head">
        <span class="sidebar-title">文档</span>
        <span class="sidebar-count">{{ files.length }}</span>
      </div>
      <div class="search">
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="搜索标题 / 路径 / 内容"
          aria-label="搜索文档"
          @keydown.esc="searchQuery = ''"
        />
      </div>

      <div class="tree-area">
        <div ref="treeEl" class="tree" />
        <div v-if="searchQuery.trim()" class="search-results">
          <div v-if="!searchHits.length" class="search-empty">没有匹配的文档</div>
          <button v-for="hit in searchHits" :key="hit.file.id" type="button" class="hit" @click="openHit(hit)">
            <span class="hit-head">
              <span class="hit-title">{{ hit.file.title }}</span>
              <span v-if="hit.count > 1" class="hit-count">{{ hit.count }} 处</span>
            </span>
            <span class="hit-path">{{ hit.file.id }}</span>
            <span v-if="hit.snippet" class="hit-snippet"
              >{{ hit.snippet.before }}<mark>{{ hit.snippet.match }}</mark>{{ hit.snippet.after }}</span
            >
          </button>
        </div>
      </div>

      <div class="sidebar-foot">修改仅在本页生效,不会保存到仓库</div>
    </aside>

    <main class="main">
      <header class="toolbar">
        <div class="path">
          <span class="path-text" :title="current?.sourcePath">{{ current?.id ?? '未选择文档' }}</span>
          <span v-if="dirty" class="dirty-chip">临时修改</span>
        </div>

        <div class="actions">
          <a v-if="docHref" class="text-btn" :href="docHref" target="_blank" rel="noopener noreferrer">查看文档</a>
          <button type="button" class="copy-btn" :class="{ copied }" @click="copySource">
            {{ copied ? '已复制' : '复制 Markdown' }}
          </button>
          <button v-if="dirty" type="button" class="text-btn" @click="resetFile">还原</button>
          <div class="segmented" role="group" aria-label="视图">
            <button
              type="button"
              :class="{ active: mode === 'edit' }"
              :aria-pressed="mode === 'edit'"
              @click="mode = 'edit'"
            >
              编辑
            </button>
            <button
              type="button"
              :class="{ active: mode === 'diff' }"
              :aria-pressed="mode === 'diff'"
              @click="showDiff"
            >
              Diff
            </button>
          </div>
        </div>
      </header>

      <section class="panes" :class="{ diff: mode === 'diff' }">
        <div v-show="mode === 'edit'" class="pane editor-pane">
          <div ref="editorEl" class="diffs-host" />
        </div>

        <div v-show="mode === 'edit'" class="pane preview-pane">
          <div class="markdown-body" v-html="previewHtml" />
        </div>

        <div v-show="mode === 'diff'" class="pane diff-pane">
          <div v-if="!dirty" class="no-diff">没有改动</div>
          <div ref="diffEl" class="diffs-host" />
        </div>

        <div v-if="!current" class="pane empty-state">从左侧选择一篇文档</div>
      </section>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  color: #1f2328;
  background: #fff;
  color-scheme: light;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
}

.sidebar-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-title {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.sidebar-count {
  padding: 2px 7px;
  border-radius: 999px;
  color: #9ca3af;
  background: #f3f4f6;
  font-size: 11px;
}

.search {
  flex: none;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #1f2328;
  background: #fff;
  font: inherit;
  font-size: 12px;
}

.search-input:focus-visible {
  border-color: #3b82f6;
  outline: 2px solid rgb(59 130 246 / 0.2);
}

.tree-area {
  position: relative;
  flex: 1;
  min-height: 0;
}

.tree {
  height: 100%;
  overflow: hidden;
}

.search-results {
  position: absolute;
  inset: 0;
  overflow: auto;
  background: #fafafa;
}

.search-empty {
  padding: 16px 12px;
  color: #9ca3af;
  font-size: 12px;
}

.hit {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid #f0f0f0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.hit:hover {
  background: #f3f4f6;
}

.hit-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hit-title {
  overflow: hidden;
  color: #1f2328;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-count {
  flex: none;
  color: #9ca3af;
  font-size: 11px;
}

.hit-path {
  overflow: hidden;
  color: #9ca3af;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-snippet {
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-snippet mark {
  padding: 0 1px;
  border-radius: 2px;
  color: #92400e;
  background: #fef3c7;
}

.sidebar-foot {
  flex: none;
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
  color: #9ca3af;
  font-size: 11px;
  line-height: 1.5;
}

.main {
  display: grid;
  grid-template-rows: 52px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
}

.path {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.path-text {
  overflow: hidden;
  color: #374151;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dirty-chip {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  color: #92400e;
  background: #fef3c7;
  font-size: 11px;
}

.actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  padding: 6px 12px;
  border: 1px solid #111827;
  border-radius: 6px;
  color: #fff;
  background: #111827;
  font-size: 12px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #374151;
}

.copy-btn.copied {
  border-color: #a7f3d0;
  color: #065f46;
  background: #ecfdf5;
}

.text-btn {
  padding: 5px 10px;
  border: 0;
  border-radius: 6px;
  color: #6b7280;
  background: transparent;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
}

.text-btn:hover {
  color: #111827;
  background: #f3f4f6;
}

.segmented {
  display: inline-flex;
  overflow: hidden;
  padding: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.segmented button {
  padding: 5px 14px;
  border: 0;
  border-radius: 6px;
  color: #6b7280;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}

.segmented button.active {
  color: #111827;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

.copy-btn:focus-visible,
.segmented button:focus-visible,
.text-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
}

.panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.panes.diff {
  grid-template-columns: minmax(0, 1fr);
}

.pane {
  min-width: 0;
  min-height: 0;
}

.editor-pane,
.diff-pane {
  overflow: auto;
}

.preview-pane {
  overflow: auto;
  border-left: 1px solid #e5e7eb;
}

.diffs-host {
  min-height: 100%;
}

.preview-pane :deep(.markdown-body) {
  box-sizing: border-box;
  max-width: none;
  min-width: 0;
  margin: 0;
  padding: 24px 32px;
  font-size: 15px;
}

.no-diff,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 13px;
}

.no-diff + .diffs-host {
  display: none;
}

.error {
  position: absolute;
  right: 16px;
  bottom: 16px;
  max-width: 480px;
  padding: 10px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  background: #fef2f2;
  font-size: 12px;
}

/* 深色模式:编辑器整页切换为暗色,Pierre 组件与树跟随主题 */
@media (prefers-color-scheme: dark) {
  .app {
    color-scheme: dark;
    color: #e6edf3;
    background: #0d1117;
  }

  .sidebar {
    border-right-color: #30363d;
    background: #010409;
  }

  .sidebar-head {
    border-bottom-color: #30363d;
  }

  .sidebar-title {
    color: #8b949e;
  }

  .sidebar-count {
    color: #8b949e;
    background: #21262d;
  }

  .sidebar-foot {
    border-top-color: #30363d;
    color: #6e7681;
  }

  .toolbar {
    border-bottom-color: #30363d;
  }

  .path-text {
    color: #c9d1d9;
  }

  .dirty-chip {
    color: #f0c36d;
    background: rgb(129 74 8 / 0.4);
  }

  .copy-btn {
    border-color: #f0f6fc;
    color: #0d1117;
    background: #e6edf3;
  }

  .copy-btn:hover {
    background: #fff;
  }

  .copy-btn.copied {
    border-color: #238636;
    color: #2ea043;
    background: rgb(35 134 54 / 0.15);
  }

  .text-btn {
    color: #8b949e;
  }

  .text-btn:hover {
    color: #e6edf3;
    background: #21262d;
  }

  .segmented {
    border-color: #30363d;
    background: #010409;
  }

  .segmented button {
    color: #8b949e;
  }

  .segmented button.active {
    color: #e6edf3;
    background: #21262d;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }

  .preview-pane {
    border-left-color: #30363d;
  }

  .no-diff,
  .empty-state {
    color: #6e7681;
  }

  .error {
    border-color: #f85149;
    color: #ff7b72;
    background: rgb(248 81 73 / 0.1);
  }
}
</style>
