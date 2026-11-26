# VoisChat Docs

| 环境          | 预览地址                                          |
| ------------- | ------------------------------------------------- |
| Cloudflare    | https://voischat-docs.voischat.workers.dev/common |
| VoisWork CN   | https://voiswork.cn/common                        |
| VoisWork 海外 | https://voiswork.com/common                       |
| VoisChat CN   | https://api.voischat.cn/common/                   |

## PR 预览

每个 PR 会部署到 `https://voischat-docs-pr-<PR 号>.voischat.workers.dev/common/`，PR 关闭时自动删除对应 Worker。仓库需要配置 `CLOUDFLARE_API_TOKEN` secret（Workers Scripts:Edit 权限）。
