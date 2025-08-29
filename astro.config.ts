import vue from '@astrojs/vue'
// @ts-check
import { defineConfig } from 'astro/config'

import UnoCSS from 'unocss/astro'

// https://astro.build/config
export default defineConfig({
  site: 'https://demoui.weila.hk',
  base: '/weila-common-static',
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
