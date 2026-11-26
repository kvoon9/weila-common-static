import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['eslint', 'unicorn', 'typescript', 'oxc', 'import', 'vue'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },
  rules: {
    // no-comment 约定固化:行尾注释与 TODO/FIXME 类标记直接报错
    'no-inline-comments': 'error',
    'no-warning-comments': 'error',
    'no-unused-expressions': ['error', { allowTaggedTemplates: true }],
    // Astro 风格的副作用导入(CSS、全局类型)是合法写法
    'import/no-unassigned-import': 'off',
    // 内容收集按 LOCALES 顺序逐个 render,顺序即产物顺序
    'no-await-in-loop': 'off',
    // 构建期排序固定输入,原地 sort 即可
    'unicorn/no-array-sort': 'off',
    // 内联 bridge 是 ES5,保持 on* 赋值
    'unicorn/prefer-add-event-listener': 'off',
    'unicorn/require-post-message-target-origin': 'off',
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.astro/**',
    '.wrangler/**',
    'public/helpdoc/**',
    'src/vender/**',
    'src/content/**',
    'src/pages/**/*.md',
    'pnpm-lock.yaml',
  ],
})
