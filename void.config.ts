import { defineConfig } from 'void/config'

export default defineConfig({
  routing: {
    trailingSlash: true,
  },
  cloudflare: {
    name: 'docs',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_als'],
  },
})
