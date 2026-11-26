import { $ } from 'zx'

await $`pnpm build:deploy`
await $`pnpm exec void deploy --dir dist-deploy`
