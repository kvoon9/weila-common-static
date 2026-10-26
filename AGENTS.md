# AGENTS.md

通用项目说明见 [CLAUDE.md](./CLAUDE.md)。本文件记录需要特别注意的项目约定。

## i18n（多语言）约定

**本项目不生成 `/<locale>/` 形式的 URL**。多语言文档的**语言信息来自 App WebView bridge**（不是 URL），因此 Astro 的 i18n 路由能力（`prefixDefaultLocale`、`fallback`、`Astro.preferredLocale`）在本项目**全部用不上 / 不适用**（纯静态构建也没有服务端 `Accept-Language` 协商）。改动多语言内容前必须读完本节。

### 语言清单的单一来源

- 语言代码只在 `astro.config.ts` 的 `i18n.locales` 里定义，`i18n.defaultLocale` 是降级目标
- 页面通过 `astro:config/client` 读取这份配置（封装在 `src/shared/intl.ts` 的 `LOCALES` / `DEFAULT_LOCALE`），**不要在别处再硬编码语言代码列表**
- 例外(属于 UI 文案,需手动维护):语言显示名 `LANG_LABELS` 在 `src/shared/intl.ts`(文档切换器与首页语言徽标共用);bridge 返回值归一化 `normalizeLang` 在 `src/pages/intl/[...path].astro`

### 文件约定（Astro Content Layer）

- 多语言 md 源文件位于 `src/content/intl/`，结构是 **`<文档路径>/<语言>.md`**（一篇文档一个目录，目录下按语言分文件）
- 例：`src/content/intl/ios/personal/privacy/zh-CN.md` → URL `/common/intl/ios/personal/privacy`（裸路径，无语言后缀）
- collection 定义在 `src/content.config.ts`，用 `glob()` loader；`generateId` 保留原始大小写（默认实现会小写化，把 `zh-CN` 破坏成 `zh-cn`）
- md 文件**不写 frontmatter**（无 `layout`、无 `navigation`），正文以 `# 标题` 开头；首个 h1 即该语言版本的页面标题
- `intl/` 之外的页面（如 `src/pages/android/`）只有中文单文件、走 `Typo.astro` 布局，与多语言体系无关
- 内容靠人工逐文件翻译维护，没有消息字典 / key 抽取

### URL 与语言解析（`src/pages/intl/[...path].astro`）

- 每篇文档只生成**一个干净裸路径**页面（如 `/intl/ios/personal/license`），构建期内嵌该文档全部语言版本，客户端切换显示；无 JS 环境默认展示 `i18n.defaultLocale`
- 语言解析优先级（客户端内联脚本）：
  1. `?lang=xx` 显式覆盖（**仅兼容旧链接，新链接不要再携带**）：合法且该文档支持时同步生效，跳过 bridge、不写 localStorage；非法值或该文档不支持的语言静默忽略，走常规解析
  2. **App WebView bridge**：`get-page-params` → `data.lang`（`zh-CN`/`zh-TW`/`en`），内联迷你实现见下
  3. `localStorage.voisIntlLang`：记住用户上一次的选择，减少首屏闪烁
  4. `navigator.language` 兜底（浏览器场景），归一化后仍不支持则回退 `i18n.defaultLocale`
- **已废弃、不要再加回来**：旧版语言后缀 URL（`license_zh-CN`）已移除，现在直接 404（已确认无存量链接）；`?lang=xx` 仅作为旧链接兼容保留（见上面优先级第 1 条），不要在新入口/分享文案里拼它
- 文档没有的语言版本自动降级到 `i18n.defaultLocale`
- 语言切换器（右上角）由页面按该文档可用语言**自动生成**

### bridge（App WebView 语言获取）

- 页面内联了一段 ES5 迷你 bridge（对齐 `@vois/webview-bridge@0.5.1` 源码，见 `[...path].astro` 内注释）：Android 走 `WebViewJavascriptBridge` + ready 事件，iOS 走 `webkit.messageHandlers.uniBridgeCall` + 50ms 轮询，业务协议 `get-page-params`
- bridge 库无超时机制，页面自行设 2s 超时，超时后维持当前语言；iOS 端 `lang` 归一化未验证，前端统一用 `normalizeLang` 兜底（`zh`→`zh-CN`、`zh-rTW`/`zh-Hant*`→`zh-TW`）
- 桌面调试：`localStorage.voisIntlBridgeDebug = '1'` 启用模拟 bridge，`localStorage.voisIntlBridgeDebugLang = 'en'` 指定返回语言
- 参考实现：`vois-app-webview-next` 的 `usePageParams.ts` / `useLangQuery.ts`（消费同一个 bridge 协议）

### 新增语言时

1. 在 `astro.config.ts` 的 `i18n.locales` 里加上语言代码（决定展示顺序与是否生效）
2. 按 `<文档路径>/<语言>.md` 放源文件即可 —— 页面、切换器、首页导航树会自动包含它，**无需改任何代码**
3. 按需在 `LANG_LABELS` 补显示名、在 `normalizeLang` 补 bridge 归一化规则

> 注：不在 `i18n.locales` 里的语言文件会被 `loadIntlDocs()` 跳过（不报错），可用来临时下架某语言。

### 硬性约束

- 本站是纯静态构建，无 SSR / 中间件：不要引入任何依赖服务端语言检测（如 `Accept-Language` 请求头协商）的方案，dev 下能跑不代表部署后有效
- 不要在 `src/pages/` 下放非路由的辅助模块（如曾经的 `intl/docs.ts`）——它会被 Astro 当成 endpoint 生成假路由并告警。共享逻辑放 `src/shared/`
