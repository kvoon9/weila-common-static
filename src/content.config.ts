import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

// intl 多语言文档:一篇文档一个目录,目录下按语言分文件(zh-CN.md / zh-TW.md / en.md)。
// 例:src/content/intl/ios/personal/privacy/zh-CN.md
// id 形如 intl/ios/personal/privacy/zh-CN,由 ~/shared/intl 的 loadIntlDocs() 解析成
// 「文档路径 + 语言」两段,不再靠文件名正则反推。
const intl = defineCollection({
  loader: glob({
    pattern: 'intl/**/*.md',
    base: './src/content',
    // 默认 generateId 会把 id 小写化(privacy_zh-CN → privacy_zh-cn),
    // 语言代码里的大小写必须保留,这里直接原样取去掉扩展名的相对路径。
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  // md 源文件不写 frontmatter,标题由正文首个 h1 推导
  schema: z.object({}).passthrough(),
})

export const collections = { intl }
