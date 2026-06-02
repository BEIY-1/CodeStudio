# Sprint 1: CodeStudio 基础框架设计

> 日期：2026-06-01 | 状态：已确认 | 目标平台：Windows

---

## 1. 概述

构建 CodeStudio 的 Electron 桌面应用基础骨架，包含完整的构建工具链、UI 设计系统、数据库层、IPC 通信架构和模块化代码组织。所有后续 Sprint 在此框架之上扩展功能。

---

## 2. 技术架构

### 2.1 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 桌面壳 | Electron | 最新稳定版 |
| 构建工具 | electron-vite | 最新 |
| UI 框架 | React 18 + TypeScript 5 strict | 最新 |
| 样式 | TailwindCSS + shadcn/ui | 最新 |
| 动效 | Framer Motion | 最新 |
| 状态管理 | Zustand | 最新 |
| 数据库 | better-sqlite3 | 最新 |
| 包管理 | pnpm | 最新 |

### 2.2 目录结构

```
CodeStudio/
├── electron/                     # 主进程
│   ├── main.ts                   # 入口：窗口、生命周期、崩溃恢复
│   ├── preload.ts                # contextBridge 白名单 API
│   ├── database/
│   │   ├── connection.ts         # 连接管理 + WAL + 自动修复
│   │   ├── migrations.ts         # 迁移执行器
│   │   └── migrations/           # SQL 迁移文件
│   │       └── 001-initial.sql
│   ├── ipc/
│   │   ├── index.ts              # 注册所有 IPC 通道
│   │   ├── database.ipc.ts       # 数据库操作
│   │   ├── file.ipc.ts           # 文件读写/导出
│   │   └── app.ipc.ts            # 平台/版本信息
│   └── utils/
│       └── crash-reporter.ts
│
├── src/renderer/
│   ├── App.tsx                   # 根组件：ThemeProvider + Router + ErrorBoundary
│   ├── main.tsx                  # ReactDOM 入口
│   ├── assets/
│   │   └── fonts/                # 思源黑体 + 霞鹜文楷 + JetBrains Mono
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 组件库
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # 顶层布局容器
│   │   │   ├── Sidebar.tsx       # 窄/宽侧边栏
│   │   │   ├── Workspace.tsx     # 主工作区容器
│   │   │   └── DetailPanel.tsx   # 右侧可折叠面板
│   │   └── shared/               # 公共业务组件
│   ├── modules/
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── generator/
│   │   │   └── GeneratorPage.tsx
│   │   ├── decoder/
│   │   │   └── DecoderPage.tsx
│   │   ├── batch/
│   │   │   └── BatchPage.tsx
│   │   ├── scan-workspace/
│   │   │   └── ScanWorkspacePage.tsx
│   │   ├── history/
│   │   │   └── HistoryPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   ├── stores/
│   │   ├── app-store.ts          # 全局应用状态
│   │   ├── settings-store.ts     # 用户设置
│   │   └── database-store.ts     # 数据库连接状态
│   ├── hooks/
│   │   ├── use-database.ts       # 数据库 hook
│   │   ├── use-ipc.ts            # IPC 通信 hook
│   │   └── use-toast.ts          # 消息提示 hook
│   ├── lib/
│   │   ├── ipc-client.ts         # IPC 客户端封装
│   │   ├── constants.ts          # 常量定义
│   │   └── utils.ts              # 工具函数
│   ├── styles/
│   │   ├── globals.css           # TailwindCSS + CSS 变量
│   │   └── theme.ts              # 主题配置导出
│   └── types/
│       └── ipc.d.ts              # IPC 通道类型定义
│
├── shared/
│   └── types/
│       ├── database.ts           # 数据库相关类型
│       └── models.ts             # 业务模型类型
│
├── resources/                    # 应用图标等静态资源
├── electron-builder.yml
├── electron.vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── package.json
```

### 2.3 设计原则

- **功能模块优先**：每个模块自含组件/hooks/store/types，高内聚低耦合
- **IPC 白名单**：渲染进程仅能调用 preload 暴露的 API，contextIsolation + noNodeIntegration
- **参数化查询**：所有 SQL 使用 prepared statement，100% 防注入
- **模块级隔离**：React Error Boundary 包围每个模块，单模块崩溃不影响全局

---

## 3. UI 设计系统

### 3.1 设计语言

**现代东方极简** — 在 Linear/Raycast 的克制现代风格之上，融入中式留白、水墨意境和典雅中文排版。

### 3.2 配色方案

```
根背景    #0B0F14   →   最深色，窗口底色
表面      #111827   →   卡片、侧边栏、面板
悬浮层    #1A2332   →   hover 状态、下拉菜单
边框      #1E293B   →   分隔线、输入框边框
边框悬浮  #334155   →   hover 边框

主色      #3B82F6   →   按钮、链接、选中态
强调色    #F59E0B   →   东方琥珀金点缀
成功      #10B981   →   成功状态
警告      #F59E0B   →   警告状态
危险      #EF4444   →   错误/删除

文字主    #F1F5F9   →   正文
文字辅    #94A3B8   →   辅助说明
文字弱    #64748B   →   占位符、禁用态
```

### 3.3 字体系统

| 用途 | 字体 | 字重 |
|------|------|------|
| 品牌/模块标题 | 霞鹜文楷 LXGW WenKai | 700 |
| 中文正文 | 思源黑体 Noto Sans SC | 400/500 |
| 代码/数据/ID | JetBrains Mono | 400/500 |
| 数字/条码值 | JetBrains Mono | 500 |

系统回退：`"LXGW WenKai", "Noto Sans SC", "JetBrains Mono", system-ui, sans-serif`

### 3.4 布局规范

```
┌──────┬────────────────────────┬──────────┐
│      │                        │          │
│ Side │    Main Workspace      │  Detail  │
│ bar  │    (路由内容区)         │  Panel   │
│ 48px │    flex-1              │  320px   │
│      │                        │  (可折叠)│
└──────┴────────────────────────┴──────────┘
```

- **Sidebar**：默认 48px 窄模式（仅图标），hover/点击展开到 240px（含文字），参考 Linear.app
- **Workspace**：flex-1 主工作区，路由模块在此渲染
- **Detail Panel**：320px 右侧属性面板，默认折叠，从 workspace 内触发展开
- **最小窗口**：1024×680px，低于此尺寸自动折叠 sidebar + panel

### 3.5 动效规范

| 场景 | 动效 | 时长 |
|------|------|------|
| 路由切换 | 淡入 + Y:8px→0 | 200ms ease-out |
| 悬浮态 | 背景/边框变化 | 150ms ease |
| Sidebar 展开 | spring stiffness:300 damping:30 | ~300ms |
| Panel 开关 | 水平滑动 | 200ms ease |
| Modal/Dialog | 淡入 + scale 0.96→1 | 200ms ease-out |
| Toast | 从右侧滑入 | 200ms ease-out |

- 尊重 `prefers-reduced-motion`，检测到时降级为 0ms 即显

### 3.6 图标

- 使用 `lucide-react`（与 shadcn/ui 配套，Linear 风格线条图标）
- 侧边栏导航图标 20px，工作区内操作图标 16px

---

## 4. 状态管理

### 4.1 Zustand Stores

```typescript
// app-store.ts — 全局应用状态
interface AppState {
  sidebarExpanded: boolean;
  sidebarWidth: 48 | 240;
  detailPanelOpen: boolean;
  detailPanelWidth: number;
  theme: 'dark';  // MVP 仅深色
  toggleSidebar: () => void;
  togglePanel: () => void;
}

// settings-store.ts — 用户设置（持久化到 localStorage）
interface SettingsState {
  language: 'zh-CN';
  defaultExportFormat: 'PNG' | 'SVG' | 'PDF';
  autoSave: boolean;
  scanSoundEnabled: boolean;
  // actions...
}

// database-store.ts — 数据库连接状态
interface DatabaseState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  lastBackup: number | null;
  // actions...
}
```

### 4.2 持久化策略

- Zustand `persist` 中间件 → localStorage
- 仅持久化 settings 和 UI 偏好，不持久化数据库状态
- 窗口位置/大小通过 Electron `win.getBounds()` 存储到 userData

---

## 5. 数据库设计

### 5.1 连接配置

```typescript
// WAL 模式 + 外键 + 自动修复
const PRAGMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  PRAGMA integrity_check;
`;
```

数据库文件位置：`app.getPath('userData')/codestudio.db`

### 5.2 表结构

```sql
-- 生成记录
CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'qr' | 'barcode' | 'encrypted'
  content TEXT NOT NULL,
  format TEXT,                  -- 'PNG' | 'SVG' | 'PDF'
  file_path TEXT,
  created_at INTEGER NOT NULL,  -- unix timestamp ms
  tags TEXT DEFAULT '[]',       -- JSON array
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_gen_type ON generation_history(type);
CREATE INDEX IF NOT EXISTS idx_gen_created ON generation_history(created_at DESC);

-- 扫描记录
CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,         -- 'image' | 'camera' | 'scanner_gun'
  raw_data TEXT NOT NULL,
  detected_type TEXT,           -- 自动检测的内容类型
  rule_match TEXT,              -- 匹配的规则名称
  scanned_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scan_date ON scan_history(scanned_at DESC);

-- 批量任务
CREATE TABLE IF NOT EXISTS batch_tasks (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,    -- 'excel' | 'csv'
  source_path TEXT,
  template TEXT,                -- JSON template string
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'done' | 'failed'
  error_message TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- 规则配置
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,        -- 'A*' | 'SN*' | 'ORD-*'
  category TEXT NOT NULL,       -- 分类标签
  action_type TEXT,             -- 'sound' | 'save_db' | 'export_csv' | 'webhook'
  action_config TEXT DEFAULT '{}', -- JSON
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

### 5.3 容灾策略

1. **启动时**：执行 `PRAGMA integrity_check`，失败则从最近备份恢复
2. **运行时**：每 30 分钟自动备份到 `userData/backups/codestudio-{timestamp}.db`
3. **保留策略**：保留最近 5 个备份，自动清理旧备份
4. **迁移机制**：版本号表 `schema_version`，按序执行未应用的迁移文件

---

## 6. IPC 通信架构

### 6.1 通道定义

```typescript
// 数据库
'db:connect'       → void                    → { success: boolean }
'db:query'         → { sql, params }        → { rows: T[] }
'db:execute'       → { sql, params }        → { changes: number }
'db:run'           → { sql, params }        → { lastInsertId: string }

// 文件
'file:save-dialog' → { defaultName, filters } → { filePath: string | null }
'file:write'       → { path, data, encoding } → { success: boolean }
'file:read'        → { path, encoding }       → { data: string | null }

// 应用
'app:get-platform' → void                    → { platform: string }
'app:get-version'  → void                    → { version: string }
'app:get-path'     → { name }                → { path: string }

// 剪贴板
'clipboard:write'  → { text }                → { success: boolean }
'clipboard:read'   → void                    → { text: string }
```

### 6.2 安全约束

- 所有 IPC 调用渲染进程侧类型安全（TypeScript 泛型）
- 文件路径由主进程对话框获取，渲染进程无权直接访问文件系统路径
- 数据库参数绑定在 IPC handler 层，使用 `stmt.bind(params)` 而非字符串拼接
- 主进程的 `ipcMain.handle` 返回值全部通过 `result`/`error` 包结构，不 throw 跨越进程边界

---

## 7. 错误处理与鲁棒性

### 7.1 Electron 崩溃恢复

```
主进程 → crashReporter 记录 → 用户感知：自动重启
渲染进程 → 'render-process-gone' 事件 → 窗口 reload
         → 连续崩溃 3 次 → hardReload + 清除缓存
```

### 7.2 React 错误边界

```typescript
// 模块级 ErrorBoundary — 每个路由模块独立包裹
<ErrorBoundary fallback={<ModuleErrorCard />}>
  <GeneratorPage />
</ErrorBoundary>
```

错误信息显示模块名称、错误描述和"重新加载此模块"按钮。

### 7.3 全局异常处理

```typescript
// 未捕获 Promise
window.addEventListener('unhandledrejection', (event) => {
  logError('unhandledrejection', event.reason);
  showToast('操作出现异常，已自动恢复', 'error');
});

// 全局 Error
window.addEventListener('error', (event) => {
  logError('global-error', event.error);
});
```

### 7.4 数据备份策略

- 定时备份：每 30 分钟
- 关闭时备份：`app.on('before-quit')` 执行最后一次备份
- 损坏恢复：启动检测 → 自动修复 → 失败则从备份恢复

---

## 8. 构建与打包

### 8.1 electron-builder 配置

```yaml
appId: com.codestudio.app
productName: CodeStudio
directories:
  output: dist
win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

### 8.2 开发脚本

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-builder",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 9. Sprint 1 交付清单

| # | 项目 | 验收标准 |
|---|------|---------|
| 1 | Electron 主进程 | 窗口创建、最小 1024×680、关闭时保存位置 |
| 2 | 崩溃恢复 | 渲染进程崩溃自动 reload |
| 3 | React 渲染进程 | Vite HMR 热更新、React 18 |
| 4 | TypeScript strict | `tsc --noEmit` 零错误 |
| 5 | shadcn/ui 集成 | Button/Input/Card/Dialog/DropdownMenu/Tooltip/Toast |
| 6 | Tailwind 深色主题 | 自定义 CSS 变量、slate → 项目色板 |
| 7 | 中式字体系统 | 霞鹜文楷 + 思源黑体 + JetBrains Mono 加载正确 |
| 8 | 布局框架 | 窄侧边栏 + 工作区 + 可折叠面板，响应式 |
| 9 | Sidebar 导航 | 7 个模块 + 图标 + 展开/折叠 + 路由切换 |
| 10 | 动效 | 路由过渡、hover、sidebar 展开面板开关动画 |
| 11 | SQLite 连接 | WAL 模式、启动检测、4 张表创建 |
| 12 | IPC 通信 | 数据库/文件/剪贴板桥接可用 |
| 13 | Zustand stores | app/settings/database 三 store |
| 14 | Error Boundaries | 7 个模块独立错误隔离 |
| 15 | 自动备份 | 30 分钟定时 + 退出备份 |
| 16 | 7 个模块占位页 | 每个页面展示模块标题和简洁占位 UI |
| 17 | 打包配置 | `pnpm build` + `pnpm package` 产出 .exe |

---

## 10. 自审清单

- [x] 无 TBD / TODO 占位符
- [x] 各章节无内部矛盾
- [x] 范围聚焦 Sprint 1 基础框架，不涉及后续模块功能
- [x] 所有需求项可测试验收
- [x] IPC 安全策略明确（contextIsolation + noNodeIntegration + 参数化查询）
- [x] 鲁棒性策略覆盖崩溃/数据库损坏/状态丢失/异常未捕获 4 类场景
