// 首页导航树的数据模型:把「页面文件」统一成 { 路径, 标题, 语言 } 的条目,
// 再按路径层级组装成树。标题优先取文章自身的标题,而不是文件名;
// 目录展示名可按路径或段名汉化(见 FOLDER_LABELS),未配置的目录保持路径段原样。
import { DEFAULT_LOCALE, loadIntlDocs } from './intl'

/**
 * 目录显示名(汉化)。
 * - 精确路径:该完整路径的目录名,优先级最高(如 intl 下的 ios 与单语 ios 区分「iOS 版 App」)
 * - 段名:同名目录共用(如 personal/corp 这类与平台无关的分层)
 * 未配置的目录保持原样,新增目录不需要动这里。
 */
const FOLDER_LABELS: { exact?: Record<string, string>, segment?: Record<string, string> } = {
  exact: {
    // intl 树的合成根目录(分区标题已说明「多语言」,目录名不再重复)
    'intl': 'App WebView 文档',
    'ios': 'iOS 版 App',
    'android': 'Android 版 App',
    'web': 'Web 版',
    'intl/ios': 'iOS 版 App',
    'intl/android': 'Android 版 App',
    'intl/web': 'Web 版',
    'intl/android-next': 'Android 版 VoisChat',
    'intl/ios-next': 'iOS 版 VoisChat',
    'intl/corp-web': 'Web 企业版',
  },
  segment: {
    'android-next': 'Android 版 VoisChat',
    'ios-next': 'iOS 版 VoisChat',
    'corp-web': 'Web 企业版',
    'corp': '企业版',
    'personal': '个人版',
  },
}

/** dirPath 到当前目录为止的相对路径,如 ios/personal;folderPath 加上目录名 */
function folderLabel(folderPath: string, name: string): string {
  return FOLDER_LABELS.exact?.[folderPath] ?? FOLDER_LABELS.segment?.[name] ?? name
}

export interface PageNode {
  type: 'page'
  /** 相对站点根(base 之后)的路径,如 ios/personal/privacy */
  path: string
  /** 文章标题:md 取正文首个 h1,astro 页取 <Layout title="..."> */
  title: string
  /** 多语言文档才有:该文档实际存在的语言 */
  langs?: string[]
}

export interface FolderNode {
  type: 'folder'
  /** 该目录显示名(汉化);未配置时等于路径段 */
  label?: string
  children: TreeStructure
  /** 该目录下(递归)的页面总数 */
  count: number
}

export type TreeNode = PageNode | FolderNode
export type TreeStructure = Record<string, TreeNode>

// —— 单页标题提取 ——

interface MarkdownModule {
  getHeadings?: () => { depth: number, text: string }[]
}

/** md 页面:标题取正文首个 h1 */
function markdownTitle(mod: MarkdownModule, fallback: string): string {
  return mod.getHeadings?.().find(h => h.depth === 1)?.text ?? fallback
}

/** astro 页面:标题取 <Layout title="..."> ;没有则回退到文件名 */
function astroTitle(source: string, fallback: string): string {
  const m = /<Layout[^>]*\btitle=(?:"([^"]*)"|'([^']*)')/.exec(source)
  return (m?.[1] ?? m?.[2])?.trim() || fallback
}

/** ios/personal/privacy → privacy */
function basename(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

/** 路径段前 i+1 位拼回相对路径,如 ['ios', 'personal'], 1 → ios/personal */
function folderPath(parts: string[], i: number): string {
  return parts.slice(0, i + 1).join('/')
}

// —— 收集所有页面 ——

/** 收集 intl 之外的普通页面(单语) */
function collectPlainPages(): PageNode[] {
  const pages: PageNode[] = []

  const mdPages = import.meta.glob('../pages/**/*.md', { eager: true }) as Record<string, MarkdownModule>
  for (const [file, mod] of Object.entries(mdPages)) {
    const path = file.replace(/^\.\.\/pages\//, '').replace(/\.md$/, '')
    pages.push({ type: 'page', path, title: markdownTitle(mod, basename(path)) })
  }

  // astro 页面用源码里的 <Layout title> 当标题(?raw 只读源码,开销很小)
  const astroPages = import.meta.glob(['../pages/**/*.astro', '!../pages/index.astro', '!../pages/intl/**'], {
    eager: true,
    query: '?raw',
    import: 'default',
  }) as Record<string, string>
  for (const [file, source] of Object.entries(astroPages)) {
    const path = file.replace(/^\.\.\/pages\//, '').replace(/\.astro$/, '')
    pages.push({ type: 'page', path, title: astroTitle(source, basename(path)) })
  }

  return pages
}

/** 收集 intl 文档(一篇文档一个入口,标题用默认语言版本) */
async function collectIntlPages(): Promise<PageNode[]> {
  const docs = await loadIntlDocs()
  return [...docs.values()].map((doc) => {
    const lang = doc.langs.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : doc.langs[0]
    return {
      type: 'page' as const,
      path: `intl/${doc.path}`,
      title: doc.titles[lang] ?? doc.path,
      langs: doc.langs,
    }
  })
}

// —— 组装成树 ——

function createFolder(path: string, name: string): FolderNode {
  return { type: 'folder', label: folderLabel(path, name), children: {}, count: 0 }
}

function insert(tree: TreeStructure, page: PageNode): void {
  const parts = page.path.split('/')
  let level = tree

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLeaf = i === parts.length - 1

    if (isLeaf) {
      level[part] = page
      continue
    }

    const existing = level[part]
    if (existing?.type !== 'folder') {
      // 新目录:按「到当前层为止的完整路径 + 目录段名」解析显示名
      const folder = createFolder(folderPath(parts, i), part)
      level[part] = folder
    }
    level = (level[part] as FolderNode).children
  }
}

/** 递归填充每个目录下的页面总数 */
function fillCounts(tree: TreeStructure): number {
  let total = 0
  for (const node of Object.values(tree))
    total += node.type === 'page' ? 1 : fillCounts(node.children)
  return total
}

function applyCounts(tree: TreeStructure): number {
  const total = fillCounts(tree)
  for (const node of Object.values(tree)) {
    if (node.type === 'folder')
      node.count = applyCounts(node.children)
  }
  return total
}

/**
 * 构建首页导航树。
 * 单语页面与 intl 多语言文档分开返回:两者都可能有 ios / web 这类同名目录,
 * 混在一棵树里会被误认为同一来源。
 */
export async function loadPageTree(): Promise<{ plain: TreeStructure, intl: TreeStructure }> {
  const plain: TreeStructure = {}
  const intl: TreeStructure = {}

  for (const page of collectPlainPages())
    insert(plain, page)
  for (const page of await collectIntlPages())
    insert(intl, page)

  applyCounts(plain)
  applyCounts(intl)
  return { plain, intl }
}
