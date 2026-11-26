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
    '.void/**',
    '.wrangler/**',
    '.void-wrangler.jsonc',
    // helpdoc 是历史遗留的静态站中站,不参与格式化
    'public/helpdoc/**',
    'src/content/**',
    'src/pages/**/*.md',
    'src/vender/**',
    'pnpm-lock.yaml',
  ],
})
