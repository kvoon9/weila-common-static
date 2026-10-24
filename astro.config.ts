import vue from '@astrojs/vue'
// @ts-check
import { defineConfig } from 'astro/config'

import UnoCSS from 'unocss/astro'

export const base = '/common'

// https://astro.build/config
export default defineConfig({
  // NOTE: not working now
  site: 'https://demoui.weila.hk',
  base,
  // 语言清单的单一来源:页面通过 astro:config/client 读取这里(见 src/shared/intl.ts)。
  // 本项目不生成 /<locale>/ URL,详见 AGENTS.md 的 i18n 一节。
  i18n: {
    locales: ['zh-CN', 'zh-TW', 'en'],
    defaultLocale: 'zh-CN',
  },
  integrations: [
    UnoCSS({
      injectReset: true,
    }),
    vue(),
  ],

  vite: {
    server: {
      cors: true,
      proxy: {
        '/v1': {
          target: 'http://demo.weila.hk',
          timeout: 20 * 1000,
          // target: 'http://192.168.0.125:8088',
          changeOrigin: true,
          secure: false,
        },
        '/v2': {
          target: 'http://demo.weila.hk',
          timeout: 20 * 1000,
          // target: 'http://192.168.0.125:8090',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
})
