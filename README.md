# VoisChat Docs

| 环境          | 预览地址                                          |
| ------------- | ------------------------------------------------- |
| Cloudflare    | https://voischat-docs.voischat.workers.dev/common |
| VoisWork CN   | https://voiswork.cn/common                        |
| VoisWork 海外 | https://voiswork.com/common                       |
| VoisChat CN   | https://api.voischat.cn/common/                   |

## 企业 API 手册

`src/pages/corp-api.md` 由 Apipost 文档自动生成，请勿手改。

- `pnpm sync:apipost` 拉取上游文档并重新生成页面
- `pnpm sync:apipost --check` 只比对不写入：页面与上游一致时退出码为 0，不一致时退出码为 1 并提示文件路径

页面内容只取决于上游数据，上游不变时重复运行得到相同字节。上游更新后运行同步脚本并提交生成结果即可。
