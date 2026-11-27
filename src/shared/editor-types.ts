// 编辑器页共享的数据类型。
// 构建期读文件的部分在 editor-files.ts,这里只放客户端也能安全引用的形状。

export interface EditorFile {
  /** 树中的路径,如 intl/ios/personal/privacy/zh-CN.md 或 pages/android/privacy.md */
  id: string
  /** 仓库内的源文件路径,如 src/content/intl/ios/personal/privacy/zh-CN.md */
  sourcePath: string
  /** 构建时的原始内容 */
  content: string
  /** 正文首个 h1,文件树用它作为显示名 */
  title: string
}
