# CodeStudio

> QR & Barcode Workspace — 专业离线二维码与条码工作站

## 技术栈

- **桌面壳**: Electron 30
- **构建工具**: electron-vite 2
- **UI**: React 18 + TypeScript 5 strict
- **样式**: TailwindCSS 3 + 自定义深色主题
- **动效**: Framer Motion 11
- **状态管理**: Zustand 4 (persist)
- **数据库**: better-sqlite3 (WAL 模式, 自动备份)
- **图标**: lucide-react

## 项目结构

```
CodeStudio/
├── electron/              # 主进程
│   ├── main.ts            # 窗口 + 崩溃恢复
│   ├── preload.ts         # IPC 安全桥接
│   ├── database/          # SQLite 连接 + 迁移
│   ├── ipc/               # IPC 通道 (db/file/clipboard)
│   └── utils/             # 崩溃报告
├── src/renderer/          # 渲染进程
│   ├── components/        # 通用组件 (ui/layout/shared)
│   ├── modules/           # 功能模块
│   │   ├── dashboard/     # 工作台首页
│   │   ├── generator/     # QR + 条码 + 加密生成
│   │   ├── decoder/       # 图片/摄像头/扫码枪/多码
│   │   ├── batch/         # Excel/CSV 批量处理
│   │   ├── scan-workspace/# 扫码工作台
│   │   ├── history/       # 历史记录
│   │   └── settings/      # 设置 + 规则引擎 + 签名
│   ├── stores/            # Zustand 状态管理
│   ├── utils/             # 工具函数 (crypto/signature)
│   └── styles/            # 全局样式 + 主题
└── shared/types/          # 共享类型定义
```

## 命令

```bash
npm run dev          # 开发模式 (HMR)
npm run build        # 生产构建
npm run package      # 构建 + 打包 Windows exe
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查
```

## 运行要求

- Node.js >= 22
- Windows 10+
- **数据库功能**: 需要 Visual Studio Build Tools (或 `windows-build-tools`)
  - 安装: `npm install --global windows-build-tools`
  - 或手动安装 Visual Studio 2022 with "Desktop development with C++"
  - 安装后运行: `npx @electron/rebuild`

## 设计系统

- **风格**: 现代东方极简 (Linear + 中式留白)
- **配色**: 深色主题 (#0B0F14 背景, #3B82F6 主色, #F59E0B 琥珀金)
- **字体**: 霞鹜文楷 (标题) + 思源黑体 (正文) + JetBrains Mono (代码)
- **布局**: 窄侧边栏 (48px/240px) + 工作区 + 可折叠面板 (320px)
