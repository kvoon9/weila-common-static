# VoisChat Docs

| 环境          | 预览地址                                          |
| ------------- | ------------------------------------------------- |
| Cloudflare    | https://voischat-docs.voischat.workers.dev/common |
| VoisWork CN   | https://voiswork.cn/common                        |
| VoisWork 海外 | https://voiswork.com/common                       |
| VoisChat CN   | https://api.voischat.cn/common/                   |

## 企业 API 手册

`src/pages/work-exported-docs/**` 与 `src/shared/work-exported-docs.json` 由 Apipost 文档自动生成，请勿手改。每个接口生成一个页面，侧边栏只展示这份手册的目录。

- `pnpm sync:apipost` 拉取上游文档并重新生成页面
- `pnpm sync:apipost --check` 只比对不写入：与上游一致时退出码为 0，不一致时退出码为 1 并列出文件

生成结果只取决于上游数据，上游不变时重复运行得到相同字节；上游删除的接口页面会在同步时一并清理。上游更新后运行同步脚本并提交生成结果即可。
