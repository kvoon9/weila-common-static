import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { $ } from 'zx'

const stage = 'dist-deploy'

export async function stageDist(): Promise<void> {
  rmSync(stage, { recursive: true, force: true })
  await $`pnpm build`

  mkdirSync(`${stage}/common`, { recursive: true })
  for (const entry of readdirSync('dist')) cpSync(`dist/${entry}`, `${stage}/common/${entry}`, { recursive: true })

  cpSync('dist/favicon.svg', `${stage}/favicon.svg`)
  cpSync('dist/index.html', `${stage}/index.html`)
}

const entryPoint = process.argv[1]
if (entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href) {
  await stageDist()
}
