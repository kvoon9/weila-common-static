// intl 多语言文档收集(供 src/pages/intl/[...path].astro 的 getStaticPaths 与渲染共用)。
// md 源文件位于 src/content/intl/,按「文档路径 → 各语言版本」分组。
export const LANG_ORDER = ['zh-CN', 'zh-TW', 'en'] as const

export interface LangModule {
  Content: unknown
  getHeadings: () => { depth: number, text: string }[]
}

export interface LangDoc {
  langs: string[]
  titles: Record<string, string>
  contents: Record<string, unknown>
}

export function getIntlDocs(): Map<string, LangDoc> {
  const modules = import.meta.glob('../../content/intl/**/*.md', { eager: true }) as Record<string, LangModule>
  const docs = new Map<string, LangDoc>()

  for (const [key, mod] of Object.entries(modules)) {
    const match = key.match(/content\/intl\/(.+)_(zh-CN|zh-TW|en)\.md$/)
    if (!match)
      continue
    const [, docPath, lang] = match
    const title = mod.getHeadings().find(h => h.depth === 1)?.text ?? 'Weila Static'
    const doc = docs.get(docPath) ?? { langs: [], titles: {}, contents: {} }
    doc.langs.push(lang)
    doc.titles[lang] = title
    doc.contents[lang] = mod.Content
    docs.set(docPath, doc)
  }

  for (const doc of docs.values())
    doc.langs.sort((a, b) => LANG_ORDER.indexOf(a as never) - LANG_ORDER.indexOf(b as never))

  return docs
}
