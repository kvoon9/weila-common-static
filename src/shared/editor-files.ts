// 编辑器页的数据源:把仓库里的 Markdown 源文件在构建期读成字符串,随页面一起下发。
// 只包含可编辑的文档源:src/content/intl/** 与 src/pages/**/*.md。
// 这个模块只允许被 editor.astro 的 frontmatter 导入,不要进入客户端运行时。

import type { EditorFile } from './editor-types'

const intlSources = import.meta.glob('../content/intl/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const pageSources = import.meta.glob('../pages/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function collect(
  sources: Record<string, string>,
  keyPrefix: string,
  idPrefix: string,
  sourcePrefix: string,
): EditorFile[] {
  return Object.entries(sources).map(([file, content]) => {
    const relative = file.slice(keyPrefix.length)
    return {
      id: `${idPrefix}/${relative}`,
      sourcePath: `${sourcePrefix}/${relative}`,
      content,
    }
  })
}

export function loadEditorFiles(): EditorFile[] {
  return [
    ...collect(intlSources, '../content/intl/', 'intl', 'src/content/intl'),
    ...collect(pageSources, '../pages/', 'pages', 'src/pages'),
  ].sort((a, b) => a.id.localeCompare(b.id))
}
