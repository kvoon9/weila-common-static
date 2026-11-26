import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { $ } from 'zx'

// 站点以 /common 前缀对外访问。Astro 的 base 只影响链接,构建产物仍在根目录,
// 这里把 dist 放进 dist-deploy/common,让 Cloudflare 直接按路径命中,避免 rewrite
// 在尾斜杠 307 时丢掉 /common 前缀。
const stage = 'dist-deploy'

rmSync(stage, { recursive: true, force: true })
await $`pnpm build`

mkdirSync(`${stage}/common`, { recursive: true })
for (const entry of readdirSync('dist')) cpSync(`dist/${entry}`, `${stage}/common/${entry}`, { recursive: true })

// 页面里的 favicon 是根绝对路径
cpSync('dist/favicon.svg', `${stage}/favicon.svg`)
// 根路径保留一份入口页,Cloudflare Worker 的就绪探针会请求 /
cpSync('dist/index.html', `${stage}/index.html`)

await $`pnpm exec void deploy --dir ${stage}`
