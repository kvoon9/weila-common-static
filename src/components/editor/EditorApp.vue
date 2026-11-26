<script setup lang="ts">
import type { EditorFile } from '~/shared/editor-types'
import { File as DiffsFile, FileDiff } from '@pierre/diffs'
import { Editor } from '@pierre/diffs/edit'
import { FileTree } from '@pierre/trees'
import { marked } from 'marked'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const props = defineProps<{ files: EditorFile[] }>()

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

let copiedTimer: ReturnType<typeof setTimeout> | undefined

function stripFrontmatter(source: string): string {
  return source.startsWith('---') ? source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') : source
}

function renderFile(): void {
  if (!current.value || !fileView.value) return
  fileView.value.render({
    file: { name: current.value.id, contents: content.value },
    containerWrapper: editorEl.value,
  })
}

function syncTreeStatus(): void {
  tree.value?.setGitStatus(modifiedIds.value.map((path) => ({ path, status: 'modified' as const })))
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
      theme: 'pierre-light',
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
  // ?file= 深链:文档页「打开编辑器」直接定位到对应文件
  const query = new URLSearchParams(location.search).get('file')
  const deepFile = query ? props.files.find((file) => file.id === query) : undefined
  if (deepFile) {
    selectedId.value = deepFile.id
    content.value = deepFile.content
  }

  const id = selectedId.value

  tree.value = new FileTree({
    paths: props.files.map((file) => file.id),
    initialExpansion: 'open',
    initialSelectedPaths: id ? [id] : [],
    flattenEmptyDirectories: true,
    search: true,
    labels: {
      searchPlaceholder: '搜索文档…',
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
      const path = paths.find((item) => props.files.some((file) => file.id === item))
      if (path && path !== selectedId.value) void openFile(path)
    },
  })
  tree.value.render({ containerWrapper: treeEl.value })
  syncTreeStatus()

  if (!id) return

  try {
    fileView.value = new DiffsFile({
      theme: 'pierre-light',
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
      <div ref="treeEl" class="tree" />
      <div class="sidebar-foot">修改仅在本页生效,不会保存到仓库</div>
    </aside>

    <main class="main">
      <header class="toolbar">
        <div class="path">
          <span class="path-text" :title="current?.sourcePath">{{ current?.id ?? '未选择文档' }}</span>
          <span v-if="dirty" class="dirty-chip">临时修改</span>
        </div>

        <div class="actions">
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
  grid-template-columns: 300px minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  color: #1f2328;
  background: #fff;
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

.tree {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
</style>
