# VoisChat Docs

| 环境          | 预览地址                                          |
| ------------- | ------------------------------------------------- |
| Cloudflare    | https://voischat-docs.voischat.workers.dev/common |
| VoisWork CN   | https://voiswork.cn/common                        |
| VoisWork 海外 | https://voiswork.com/common                       |
| VoisChat CN   | https://api.voischat.cn/common/                   |

## 企业 API 手册

`src/shared/work-exported-docs.json` 由 Apipost 文档自动生成，请勿手改。页面由 `src/pages/work-exported-docs/` 的 Astro 路由在构建期渲染：每个接口一个页面，侧边栏只展示这份手册的目录，请求/响应示例用 `@pierre/diffs` 预渲染成静态高亮代码块。

- `pnpm sync:apipost` 拉取上游文档并重新生成 JSON
- `pnpm sync:apipost --check` 只比对不写入：与上游一致时退出码为 0，不一致时退出码为 1 并列出文件

生成结果只取决于上游数据，上游不变时重复运行得到相同字节。上游更新后运行同步脚本并提交生成结果即可。
