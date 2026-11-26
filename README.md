# VoisChat Docs

| 环境          | 预览地址                                          |
| ------------- | ------------------------------------------------- |
| Cloudflare    | https://voischat-docs.voischat.workers.dev/common |
| VoisWork CN   | https://voiswork.cn/common                        |
| VoisWork 海外 | https://voiswork.com/common                       |
| VoisChat CN   | https://api.voischat.cn/common/                   |

## 企业 API 手册

`src/shared/work-exported-docs.json` 由 Apipost 文档自动生成，请勿手改。Astro 路由在构建期渲染页面，每个接口一个页面。侧边栏只展示这份手册，请求和响应示例由 `@pierre/diffs` 预渲染成静态高亮代码块。

- `pnpm sync:apipost` 拉取上游文档并重新生成 JSON。
- `pnpm sync:apipost --check` 只比对不写入。一致时退出码为 0。不一致时退出码为 1，并列出文件。

输出只取决于上游数据。上游不变时重复运行得到相同字节。上游更新后运行同步脚本并提交生成结果。

## 部署与预览

生产部署（手动）：构建并 stage 到 `dist-deploy/`，然后用仓库里的 `wrangler.jsonc` 部署到 Cloudflare Workers。

```sh
pnpm deploy
```

PR 预览由 Cloudflare Workers Builds 自动生成：在 Workers & Pages → voischat-docs → Settings → Build 连接仓库，并在 Settings → Build → Branch control 打开 Enable Preview Builds 即可。非 main 分支的每个 PR 都会构建并得到一个 Preview URL 评论。本地预览同链路可用 `pnpm deploy:preview`（stage 后运行 `wrangler preview`）。
