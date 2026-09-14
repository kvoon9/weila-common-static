import antfu from '@antfu/eslint-config'
import { globalIgnores } from 'eslint/config'

export default antfu({
  formatters: false,
  unocss: true,
  astro: true,
  vue: false,
}, {
  files: ['**/*.md'],
  languageOptions: { frontmatter: 'yaml' },
}, {
  rules: {
    'antfu/no-top-level-await': 'off',
  },
}, globalIgnores([
  '**/helpdoc/**/*',
  '**/vender/**/*',
]))
