import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  unocss: true,
  astro: true,
  vue: false,
}, {
  rules: {
    'antfu/no-top-level-await': 'off',
  },
  ignores: ['**/vender/**/*'],
})
