# Weila Static Content

```text
/
├── src/
│   ├── pages/           # 页面和路由
│   │   ├── ios/         # iOS 平台相关页面
│   │   ├── android/     # Android 平台相关页面
│   │   ├── web/         # Web 平台相关页面
│   │   └── *.astro      # 通用页面
│   ├── components/      # Vue 组件
│   ├── layouts/         # Astro 布局组件
│   └── shared/          # 共享常量和工具
└── package.json
```

## 📱 部署路由

所有路由均以 `/common` 为基础路径。

### iOS 路由

- **企业版隐私政策**: `/common/ios/corp/privacy`
- **企业版许可证**: `/common/ios/corp/license`
- **个人版隐私政策**: `/common/ios/personal/privacy`

### Android 路由

- **企业版隐私政策**: `/common/android/corp/privacy`
- **企业版服务协议**: `/common/android/corp/service`
- **个人版隐私政策**: `/common/android/personal/privacy`
- **个人版许可证**: `/common/android/personal/license`

### Web 路由

- **企业版隐私政策**: `/common/web/corp/privacy`

### 其他

- **应用下载页面**: `/common/app-download`
