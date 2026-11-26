import { writeFileSync } from 'node:fs'
import { $ } from 'zx'

const name = process.env.PREVIEW_NAME
if (name === undefined || name === '') throw new Error('PREVIEW_NAME is required')

const config = 'wrangler.preview.jsonc'
writeFileSync(
  config,
  `${JSON.stringify(
    {
      name,
      compatibility_date: '2026-02-24',
      compatibility_flags: ['nodejs_als'],
      workers_dev: true,
      preview_urls: true,
      assets: {
        directory: './dist-deploy',
        html_handling: 'force-trailing-slash',
        not_found_handling: '404-page',
      },
    },
    null,
    2,
  )}\n`,
)

if (process.argv.includes('--dry-run')) await $`pnpm exec wrangler deploy --config ${config} --dry-run`
else await $`pnpm exec wrangler deploy --config ${config}`
