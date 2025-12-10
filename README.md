# Weila Static Content

[本项目](https://github.com/kvoon9/weila-common-static)用于存储和展示[微喇公共静态内容](https://github.com/kvoon9/weila-common-static/tree/main/src/pages)，包括 iOS、Android、Web 平台的隐私政策、许可证、个人版隐私政策等。

Push 版本后，将会在 [Release](https://github.com/kvoon9/weila-common-static/releases) 上发布 Release 版本，并在 Vercel 上部署

## 部署环境

- [Vercel 部署环境](https://weila-static-content.vercel.app)
- [VoisWork cn 国内部署环境](https://voiswork.cn/common)
- [VoisWork com 海外部署环境](https://voiswork.com/common)

## 目录结构

```text
/
├── src/
│   ├── pages/           # 项目文档
│   │   ├── ios/         # iOS 平台相关页面
│   │   ├── android/     # Android 平台相关页面
│   │   ├── web/         # Web 平台相关页面
│   │
│   │   ├── corp/        # 将弃用，请使用 ios/corp 目录
│   │   ├── corp-web/    # 将弃用，请使用 web/corp 目录
│   │   └── *.astro      # 通用页面
│   │
│   ├── components/      # Vue 组件
│   ├── layouts/         # Astro 布局组件
│   └── shared/          # 共享常量和工具
└── package.json
```

## 如何提交代码？

### 通过 GitHub Web 界面快速编辑

Markdown 文档或简单文件，可以直接在 GitHub 上编辑：

1. **找到要编辑的文件**
   - 在 GitHub 仓库页面浏览到目标文件
   - 点击文件右上角的铅笔图标 ✏️ (Edit this file)

2. **进行编辑**
   - 在 Web 编辑器中修改内容
   - GitHub 会自动预览 Markdown 渲染效果

3. **提交更改**
   - 在提交信息框中填写清晰的描述
   - 选择 "Create a new branch for this commit and start a pull request"
   - 点击 "Propose changes"

4. **创建 Pull Request**
   - GitHub 会自动跳转到 PR 创建页面
   - 填写 PR 标题和描述
   - 点击 "Create pull request"

### 代码审查流程

1. **自动检查**
   - CI 会自动运行 lint 和构建检查
   - 确保所有检查通过

2. **人工审查**
   - 至少需要一位维护者批准
   - 根据反馈进行修改

3. **合并**
   - 维护者 squash merge 到主分支
   - 删除功能分支

### 注意事项

- 修改 Markdown 文件时，确保语法正确
- 更新文档时，同步更新相关链接
- 添加新页面时，更新目录结构说明
- 遵循现有代码风格和约定
