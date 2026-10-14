# AGENTS.md

通用项目说明见 [CLAUDE.md](./CLAUDE.md)。本文件记录需要特别注意的项目约定。

## i18n（多语言）约定

**本项目没有使用 Astro 标准 i18n 路由**。多语言文档的**语言信息来自 App WebView bridge**（不是 URL）。改动多语言内容前必须读完本节。

### 文件约定

- 多语言 md 源文件位于 `src/content/intl/`（**不**在 `src/pages/` 下，不直接生成页面），每种语言一个文件，靠**文件名后缀**区分：`_zh-CN`、`_zh-TW`、`_en`
- md 文件**不写 frontmatter**（无 `layout`、无 `navigation`），正文以 `# 标题` 开头；首个 h1 即该语言版本的页面标题
- 例：`src/content/intl/ios/personal/privacy_zh-CN.md` → URL `/common/intl/ios/personal/privacy`（裸路径，无语言后缀）
- `intl/` 之外的页面（如 `src/pages/android/`）只有中文单文件、走 `Typo.astro` 布局，与多语言体系无关
- 内容靠人工逐文件翻译维护，没有消息字典 / key 抽取

### URL 与语言解析（`src/pages/intl/[...path].astro`）

- 每篇文档生成一个**干净裸路径**页面（如 `/intl/ios/personal/license`），构建期内嵌该文档全部语言版本，客户端切换显示；无 JS 环境默认展示 `zh-CN`
- 语言解析优先级（客户端内联脚本）：
  1. `?lang=` 显式覆盖——**仅兼容旧链接**，新链接不要再携带
  2. 旧版语言后缀路径（`license_zh-CN`）——仍会生成对应页面（兼容已发布 App 内的旧链接），强制该语言并自动把 URL 规范化为裸路径（`history.replaceState`，无跳转）
  3. **App WebView bridge**：`get-page-params` → `data.lang`（`zh-CN`/`zh-TW`/`en`），内联迷你实现见下
  4. `navigator.language` 兜底（浏览器场景），归一化后仍不支持则回退 `zh-CN`
- 文档没有的语言版本自动降级到 `zh-CN`
- 语言切换器（右上角）由页面按该文档可用语言**自动生成**（`LANG_LABELS`），不再手写 navigation frontmatter

### bridge（App WebView 语言获取）

- 页面内联了一段 ES5 迷你 bridge（对齐 `@vois/webview-bridge@0.5.1` 源码，见 `[...path].astro` 内注释）：Android 走 `WebViewJavascriptBridge` + ready 事件，iOS 走 `webkit.messageHandlers.uniBridgeCall` + 50ms 轮询，业务协议 `get-page-params`
- bridge 库无超时机制，页面自行设 2s 超时，超时后维持当前语言；iOS 端 `lang` 归一化未验证，前端统一用 `normalizeLang` 兜底（`zh`→`zh-CN`、`zh-rTW`/`zh-Hant*`→`zh-TW`）
- 桌面调试：`localStorage.voisIntlBridgeDebug = '1'` 启用模拟 bridge，`localStorage.voisIntlBridgeDebugLang = 'en'` 指定返回语言
- 参考实现：`vois-app-webview-next` 的 `usePageParams.ts` / `useLangQuery.ts`（消费同一个 bridge 协议）

### 新增语言时

- 在 `src/pages/intl/[...path].astro` 中同步更新：`LANG_ORDER`、`LANG_LABELS`、getStaticPaths / 脚本里的语言正则（当前为 `zh-CN|zh-TW|en`）、`normalizeLang` 归一化表
- 新增该语言的后缀 md 文件即可，旧后缀兼容页与切换器会自动生成

### 硬性约束

- 本站是纯静态构建，无 SSR / 中间件：不要引入任何依赖服务端语言检测（如 `Accept-Language` 请求头协商）的方案，dev 下能跑不代表部署后有效
