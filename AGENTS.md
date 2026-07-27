# AGENTS.md

通用项目说明见 [CLAUDE.md](./CLAUDE.md)。本文件记录需要特别注意的项目约定。

## i18n（多语言）约定

**本项目没有使用 Astro 标准 i18n 路由**，而是自建的一套文件后缀约定。改动多语言内容前必须读完本节。

### 文件约定

- 多语言文档位于 `src/pages/intl/`，每种语言一个独立的 md 文件，靠**文件名后缀**区分语言：
  - `_zh-CN`（简体中文）、`_zh-TW`（繁体中文）、`_en`（英文）
- 例：`src/pages/intl/ios/personal/privacy_zh-CN.md` → URL `/common/intl/ios/personal/privacy_zh-CN`
- `intl/` 之外的页面（如 `src/pages/android/`）只有中文单文件，无多语言版本
- 内容靠人工逐文件翻译维护，没有消息字典 / key 抽取

### 语言切换导航

- 每篇 md 的 frontmatter `navigation` 手写指向**其他**语言版本的链接（条目名用目标语言书写），由 `src/layouts/Typo.astro` 渲染为 `NavigationDropdown` 下拉
- 新增/删除某个语言版本时，必须同步更新**同篇文档所有语言版本**的 `navigation`
- 注意 URL 中的平台段要与目录一致（如 `android-next` 不要错写成 `android`）

### 裸路径入口与 `?lang=` 参数

- `src/pages/intl/[...path].astro` 扫描所有 `*_<lang>.md`，为每篇文档生成**无语言后缀的裸路径**入口页（如 `/intl/ios/personal/license`），按 `?lang=` 跳转到对应后缀页；无参数或语言不存在时回退 `zh-CN`
- `Typo.astro` 中的内联脚本处理「URL 后缀与 `?lang=` 不一致」的纠正跳转（如 `license_en?lang=zh-CN` → `license_zh-CN`）
- **新增语言时**，必须同时更新这两处文件中的语言正则 / 白名单（当前为 `zh-CN|zh-TW|en`）

### 硬性约束

- 本站是纯静态构建，无 SSR / 中间件：不要引入任何依赖运行时语言检测（如 `Accept-Language`）的方案，dev 下能跑不代表部署后有效
