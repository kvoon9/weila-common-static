import { $ } from 'zx'
import { stageDist } from './stage.ts'

await stageDist()
await $`pnpm exec wrangler deploy`
