// intl 多语言文档收集器,是「文档路径 / 语言清单 / 标题 / 渲染组件」的唯一数据源。
//
// 数据来自 Astro Content Layer(见 src/content.config.ts):
//   src/content/intl/<文档路径>/<语言>.md
// 语言清单来自 astro.config.ts 的 i18n.locales(经 astro:config/client 读取),
// 这里不再硬编码任何语言代码。
import { i18n } from 'astro:config/client'
import { getCollection, render } from 'astro:content'

/** 站点支持的全部语言,顺序即切换器展示顺序 */
export const LOCALES: readonly string[] = (i18n?.locales ?? []) as string[]

/** 站点默认语言,无 JS 与缺语言时的降级目标 */
export const DEFAULT_LOCALE: string = i18n?.defaultLocale ?? LOCALES[0] ?? ''

const PREFIX = 'intl/'

export interface LangDoc {
  /** 文档裸路径,如 ios/personal/privacy(不含 intl/ 前缀,不含语言) */
  path: string
  /** 该文档实际存在的语言,按 LOCALES 顺序 */
  langs: string[]
  /** 每种语言的页面标题(取正文首个 h1) */
  titles: Record<string, string>
  /** 每种语言渲染后的 Content 组件 */
  contents: Record<string, unknown>
}

/** 读取全部 intl 文档,按裸路径索引 */
export async function loadIntlDocs(): Promise<Map<string, LangDoc>> {
  const entries = await getCollection('intl')
  const docs = new Map<string, LangDoc>()

  const parsed = entries
    .map((entry) => {
      // id: intl/ios/personal/privacy/zh-CN
      const id = entry.id.slice(PREFIX.length)
      const slash = id.lastIndexOf('/')
      return { docPath: id.slice(0, slash), lang: id.slice(slash + 1), entry }
    })
    // 忽略不在 i18n.locales 里的语言文件(留文件不生效,便于临时下架某语言)
    .filter(({ lang }) => LOCALES.includes(lang))
    // 先按 LOCALES 顺序,再按文档路径,保证 langs 数组顺序稳定
    .sort((a, b) => LOCALES.indexOf(a.lang) - LOCALES.indexOf(b.lang) || a.docPath.localeCompare(b.docPath))

  for (const { docPath, lang, entry } of parsed) {
    const { Content, headings } = await render(entry)
    const title = headings.find(h => h.depth === 1)?.text ?? 'Weila Static'
    const doc = docs.get(docPath) ?? { path: docPath, langs: [], titles: {}, contents: {} }
    doc.langs.push(lang)
    doc.titles[lang] = title
    doc.contents[lang] = Content
    docs.set(docPath, doc)
  }

  return docs
}

/** 文档的默认展示语言:优先站点默认语言,否则该文档存在的第一种语言 */
export function pickDefaultLang(doc: Pick<LangDoc, 'langs'>): string {
  return doc.langs.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : doc.langs[0] ?? DEFAULT_LOCALE
}

/** 语言显示名(切换器、语言徽标共用);语言清单本身来自 astro.config.ts 的 i18n.locales */
export const LANG_LABELS: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
}
