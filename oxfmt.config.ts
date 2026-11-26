import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 120,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  proseWrap: 'preserve',
  astro: true,
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.astro/**',
    '.wrangler/**',
    // helpdoc 是历史遗留的静态站中站,不参与格式化
    'public/helpdoc/**',
    'src/content/**',
    'src/pages/**/*.md',
    // Apipost 同步脚本生成的 JSON,必须保持脚本输出字节,供 --check 逐字节比较
    'src/shared/work-exported-docs.json',
    'src/vender/**',
    'pnpm-lock.yaml',
  ],
})
