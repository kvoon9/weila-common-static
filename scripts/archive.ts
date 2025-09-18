import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { $, echo } from 'zx'
import { name as pkgName, version } from '../package.json'

async function run() {
  const outputDir = 'pkg'
  const filename = `${pkgName}_${version}.tar.gz`

  const filepath = resolve(outputDir, filename)

  if (existsSync(filepath))
    await $`rm ${filepath}`

  if (!existsSync(outputDir))
    mkdirSync(outputDir)

  await $`tar -czf ${filepath} -C dist .`

  echo`Archive done: ${filepath}`
}

await run()
