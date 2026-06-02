# Sprint 1: CodeStudio 基础框架 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 CodeStudio Electron 桌面应用的完整基础骨架——主进程、渲染进程、SQLite 数据库、UI 设计系统、布局框架、路由、状态管理和模块占位页。

**Architecture:** 使用 electron-vite 构建工具串联 Electron 主进程和 React 渲染进程。主进程通过 IPC 白名单安全桥接 SQLite 和文件系统。渲染进程使用 React + TailwindCSS + shadcn/ui 构建深色主题 UI，Zustand 管理状态，Framer Motion 驱动动效。采用功能模块优先的目录结构，每个模块自含组件。

**Tech Stack:** electron-vite, Electron, React 18, TypeScript 5 strict, TailwindCSS, shadcn/ui, Framer Motion, Zustand, better-sqlite3, lucide-react, react-router-dom

---

## 前置准备

- [ ] **Step 0: 创建项目目录结构**

```bash
cd "F:\first-cc\A4-CodeStudio"
mkdir -p electron/database/migrations
mkdir -p electron/ipc
mkdir -p electron/utils
mkdir -p src/renderer/assets/fonts
mkdir -p src/renderer/components/ui
mkdir -p src/renderer/components/layout
mkdir -p src/renderer/components/shared
mkdir -p src/renderer/modules/dashboard
mkdir -p src/renderer/modules/generator
mkdir -p src/renderer/modules/decoder
mkdir -p src/renderer/modules/batch
mkdir -p src/renderer/modules/scan-workspace
mkdir -p src/renderer/modules/history
mkdir -p src/renderer/modules/settings
mkdir -p src/renderer/stores
mkdir -p src/renderer/hooks
mkdir -p src/renderer/lib
mkdir -p src/renderer/styles
mkdir -p src/renderer/types
mkdir -p shared/types
mkdir -p resources
```

---

### Task 1: 项目脚手架 — package.json 与核心配置

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `electron-builder.yml`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "codestudio",
  "version": "1.0.0",
  "description": "QR & Barcode Workspace - 专业离线二维码与条码工作站",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder --win",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --fix"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.0",
    "@electron-toolkit/utils": "^3.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "electron": "^30.0.0",
    "electron-builder": "^24.0.0",
    "electron-vite": "^2.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "postcss": "^8.4.0",
    "prettier": "^3.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.1.0",
    "zustand": "^4.5.0"
  }
}
```

- [ ] **Step 2: 创建 electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '@shared': resolve('shared'),
      },
    },
    plugins: [react()],
    build: {
      outDir: 'out/renderer',
    },
  },
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./out",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": [
    "electron/**/*.ts",
    "shared/**/*.ts",
    "electron.vite.config.ts"
  ]
}
```

- [ ] **Step 5: 创建 tsconfig.web.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "outDir": "./out",
    "declaration": true,
    "paths": {
      "@/*": ["./src/renderer/*"],
      "@shared/*": ["./shared/*"]
    },
    "baseUrl": "."
  },
  "include": [
    "src/renderer/**/*.ts",
    "src/renderer/**/*.tsx",
    "shared/**/*.ts"
  ]
}
```

- [ ] **Step 6: 创建 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0F14',
          surface: '#111827',
          hover: '#1A2332',
          border: '#1E293B',
          'border-hover': '#334155',
          primary: '#3B82F6',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          'text-primary': '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"LXGW WenKai"', '"Noto Sans SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        sidebar: '48px',
        'sidebar-expanded': '240px',
        panel: '320px',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-right': 'slideRight 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [animate],
} satisfies Config
```

- [ ] **Step 7: 创建 postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 8: 创建 electron-builder.yml**

```yaml
appId: com.codestudio.app
productName: CodeStudio
directories:
  buildResources: resources
  output: dist
files:
  - out/**/*
  - "!node_modules"
win:
  target:
    - target: nsis
      arch: [x64]
  icon: resources/icon.png
nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false
```

- [ ] **Step 9: 创建 .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { browser: true, node: true, es2024: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
}
```

- [ ] **Step 10: 创建 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 11: 安装依赖**

```bash
cd "F:\first-cc\A4-CodeStudio"
pnpm install
```
Expected: 所有依赖安装成功，无错误。

- [ ] **Step 12: 验证 TypeScript 配置**

```bash
pnpm typecheck
```
Expected: 无文件需要检查（尚无 .ts 文件），配置加载成功。

---

### Task 2: Electron 主进程入口

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/utils/crash-reporter.ts`

- [ ] **Step 1: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database/connection'
import { registerIpcHandlers } from './ipc'
import { setupCrashReporter } from './utils/crash-reporter'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: 'CodeStudio',
    backgroundColor: '#0B0F14',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer (dev only)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Crash recovery for renderer process
function setupCrashRecovery(win: BrowserWindow): void {
  let crashCount = 0
  let crashTimer: NodeJS.Timeout | null = null

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Render process gone:', details.reason, details.exitCode)
    crashCount++

    if (crashTimer) clearTimeout(crashTimer)

    if (crashCount >= 3) {
      // Hard reload after 3 consecutive crashes
      crashCount = 0
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.session.clearCache()
        mainWindow.webContents.reloadIgnoringCache()
      }
      return
    }

    // Auto reload
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload()
    }

    // Reset crash counter after 30s of stability
    crashTimer = setTimeout(() => {
      crashCount = 0
    }, 30000)
  })
}

app.whenReady().then(async () => {
  setupCrashReporter()

  // Initialize database before creating window
  try {
    initDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization failed:', err)
  }

  registerIpcHandlers()
  createWindow()

  if (mainWindow) {
    setupCrashRecovery(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})

export { mainWindow }
```

- [ ] **Step 2: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

export type IpcApi = {
  db: {
    query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>
    execute: (sql: string, params?: unknown[]) => Promise<{ changes: number }>
    run: (sql: string, params?: unknown[]) => Promise<{ lastInsertId: string }>
  }
  file: {
    saveDialog: (defaultName: string, filters: { name: string; extensions: string[] }[]) => Promise<{ filePath: string | null }>
    write: (path: string, data: string) => Promise<{ success: boolean }>
    read: (path: string) => Promise<{ data: string | null }>
  }
  app: {
    getPlatform: () => Promise<{ platform: string }>
    getVersion: () => Promise<{ version: string }>
    getPath: (name: string) => Promise<{ path: string }>
  }
  clipboard: {
    write: (text: string) => Promise<{ success: boolean }>
    read: () => Promise<{ text: string }>
  }
}

const api: IpcApi = {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
    execute: (sql, params) => ipcRenderer.invoke('db:execute', { sql, params }),
    run: (sql, params) => ipcRenderer.invoke('db:run', { sql, params }),
  },
  file: {
    saveDialog: (defaultName, filters) => ipcRenderer.invoke('file:save-dialog', { defaultName, filters }),
    write: (path, data) => ipcRenderer.invoke('file:write', { path, data }),
    read: (path) => ipcRenderer.invoke('file:read', { path }),
  },
  app: {
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name) => ipcRenderer.invoke('app:get-path', { name }),
  },
  clipboard: {
    write: (text) => ipcRenderer.invoke('clipboard:write', { text }),
    read: () => ipcRenderer.invoke('clipboard:read'),
  },
}

contextBridge.exposeInMainWorld('api', api)
```

- [ ] **Step 3: 创建 electron/utils/crash-reporter.ts**

```typescript
import { crashReporter } from 'electron'
import { join } from 'path'
import { app } from 'electron'

export function setupCrashReporter(): void {
  crashReporter.start({
    productName: 'CodeStudio',
    companyName: 'CodeStudio',
    submitURL: '',
    uploadToServer: false,
    crashesDirectory: join(app.getPath('userData'), 'crashes'),
  })
}
```

---

### Task 3: 数据库层 — 连接管理与迁移

**Files:**
- Create: `electron/database/connection.ts`
- Create: `electron/database/migrations.ts`
- Create: `electron/database/migrations/001-initial.sql`

- [ ] **Step 1: 创建迁移 SQL 文件**

`electron/database/migrations/001-initial.sql`:
```sql
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  format TEXT,
  file_path TEXT,
  created_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_gen_type ON generation_history(type);
CREATE INDEX IF NOT EXISTS idx_gen_created ON generation_history(created_at DESC);

CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  raw_data TEXT NOT NULL,
  detected_type TEXT,
  rule_match TEXT,
  scanned_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scan_date ON scan_history(scanned_at DESC);

CREATE TABLE IF NOT EXISTS batch_tasks (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_path TEXT,
  template TEXT,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  action_type TEXT,
  action_config TEXT DEFAULT '{}',
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

- [ ] **Step 2: 创建 electron/database/migrations.ts**

```typescript
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'

interface Migration {
  version: number
  name: string
  sql: string
}

export function loadMigrations(): Migration[] {
  const migrationsDir = join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  return files.map((file) => {
    const match = file.match(/^(\d+)-(.+)\.sql$/)
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}`)
    }
    const version = parseInt(match[1]!, 10)
    const name = match[2]!
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    return { version, name, sql }
  })
}

export function runMigrations(db: Database.Database): void {
  // Ensure schema_version table exists (first migration creates it but we need it to check)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `)

  const currentVersion = db.prepare(
    'SELECT MAX(version) as version FROM schema_version'
  ).get() as { version: number | null } | undefined

  const current = currentVersion?.version ?? 0
  const migrations = loadMigrations()

  const pending = migrations.filter((m) => m.version > current)

  if (pending.length === 0) {
    console.log(`Database at version ${current}, no migrations pending`)
    return
  }

  const applyMigration = db.transaction(() => {
    for (const migration of pending) {
      console.log(`Applying migration ${migration.version}: ${migration.name}`)
      db.exec(migration.sql)
      db.prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)').run(
        migration.version,
        Date.now()
      )
    }
  })

  applyMigration()
  console.log(`Database migrated from version ${current} to ${pending[pending.length - 1]!.version}`)
}
```

- [ ] **Step 3: 创建 electron/database/connection.ts**

```typescript
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, statSync } from 'fs'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

const BACKUP_DIR = join(app.getPath('userData'), 'backups')
const MAX_BACKUPS = 5
const BACKUP_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

let backupTimer: NodeJS.Timeout | null = null

export function getDbPath(): string {
  return join(app.getPath('userData'), 'codestudio.db')
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): Database.Database {
  const dbPath = getDbPath()

  db = new Database(dbPath, {
    // verbose: console.log,  // uncomment for debugging
  })

  // Performance & safety pragmas
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')

  // Integrity check on startup
  const integrity = db.pragma('integrity_check') as { integrity_check: string }[]
  const isOk = integrity.every((row) => row.integrity_check === 'ok')

  if (!isOk) {
    console.error('Database integrity check failed, attempting recovery...')
    db.close()
    db = null
    // Try to restore from latest backup
    const restored = restoreFromBackup(dbPath)
    if (restored) {
      db = new Database(dbPath)
      db.pragma('journal_mode = WAL')
      db.pragma('foreign_keys = ON')
      db.pragma('busy_timeout = 5000')
    } else {
      throw new Error('Database corrupted and no backup available')
    }
  }

  // Run migrations
  runMigrations(db)

  // Start periodic backups
  startPeriodicBackup()

  return db
}

export function closeDatabase(): void {
  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }

  // Final backup on close
  try {
    performBackup()
  } catch (err) {
    console.error('Final backup failed:', err)
  }

  if (db) {
    db.close()
    db = null
  }
}

function performBackup(): void {
  if (!db) return

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const timestamp = Date.now()
  const backupPath = join(BACKUP_DIR, `codestudio-${timestamp}.db`)

  // Use VACUUM INTO if available, otherwise copy
  try {
    db.exec(`VACUUM INTO '${backupPath.replace(/\\/g, '\\\\')}'`)
  } catch {
    // Fallback: close, copy, reopen with integrity check
    const dbPath = getDbPath()
    db.close()
    copyFileSync(dbPath, backupPath)
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
  }

  // Clean up old backups (keep last MAX_BACKUPS)
  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('codestudio-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  for (let i = MAX_BACKUPS; i < backups.length; i++) {
    try {
      unlinkSync(backups[i]!.path)
      console.log(`Removed old backup: ${backups[i]!.name}`)
    } catch (err) {
      console.error(`Failed to remove old backup ${backups[i]!.name}:`, err)
    }
  }
}

function startPeriodicBackup(): void {
  backupTimer = setInterval(() => {
    try {
      performBackup()
      console.log('Periodic backup completed')
    } catch (err) {
      console.error('Periodic backup failed:', err)
    }
  }, BACKUP_INTERVAL_MS)

  // Don't block app exit
  if (backupTimer && typeof backupTimer.unref === 'function') {
    backupTimer.unref()
  }
}

function restoreFromBackup(dbPath: string): boolean {
  if (!existsSync(BACKUP_DIR)) return false

  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('codestudio-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (backups.length === 0) return false

  const latestBackup = backups[0]!
  console.log(`Restoring from backup: ${latestBackup.name}`)

  try {
    copyFileSync(latestBackup.path, dbPath)
    return true
  } catch (err) {
    console.error('Failed to restore from backup:', err)
    return false
  }
}
```

---

### Task 4: IPC 通道注册

**Files:**
- Create: `electron/ipc/index.ts`
- Create: `electron/ipc/database.ipc.ts`
- Create: `electron/ipc/file.ipc.ts`
- Create: `electron/ipc/app.ipc.ts`

- [ ] **Step 1: 创建 electron/ipc/database.ipc.ts**

```typescript
import { ipcMain } from 'electron'
import { getDb } from '../database/connection'

interface QueryArgs {
  sql: string
  params?: unknown[]
}

export function registerDatabaseIpc(): void {
  ipcMain.handle('db:query', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      const stmt = db.prepare(args.sql)
      const rows = args.params ? stmt.all(...args.params) : stmt.all()
      return { rows }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:query error:', message)
      return { rows: [], error: message }
    }
  })

  ipcMain.handle('db:execute', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      const stmt = db.prepare(args.sql)
      const result = args.params ? stmt.run(...args.params) : stmt.run()
      return { changes: result.changes }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:execute error:', message)
      return { changes: 0, error: message }
    }
  })

  ipcMain.handle('db:run', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      const stmt = db.prepare(args.sql)
      const result = args.params ? stmt.run(...args.params) : stmt.run()
      return { lastInsertId: String(result.lastInsertRowid) }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:run error:', message)
      return { lastInsertId: '', error: message }
    }
  })
}
```

- [ ] **Step 2: 创建 electron/ipc/file.ipc.ts**

```typescript
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync, readFileSync, existsSync } from 'fs'

interface SaveDialogArgs {
  defaultName: string
  filters: { name: string; extensions: string[] }[]
}

interface FileWriteArgs {
  path: string
  data: string
}

interface FileReadArgs {
  path: string
}

export function registerFileIpc(): void {
  ipcMain.handle('file:save-dialog', async (_event, args: SaveDialogArgs) => {
    try {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return { filePath: null }

      const result = await dialog.showSaveDialog(window, {
        defaultPath: args.defaultName,
        filters: args.filters,
      })

      return { filePath: result.canceled ? null : result.filePath ?? null }
    } catch (error) {
      console.error('file:save-dialog error:', error)
      return { filePath: null }
    }
  })

  ipcMain.handle('file:write', async (_event, args: FileWriteArgs) => {
    try {
      writeFileSync(args.path, args.data, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('file:write error:', error)
      return { success: false }
    }
  })

  ipcMain.handle('file:read', async (_event, args: FileReadArgs) => {
    try {
      if (!existsSync(args.path)) {
        return { data: null }
      }
      const data = readFileSync(args.path, 'utf-8')
      return { data }
    } catch (error) {
      console.error('file:read error:', error)
      return { data: null }
    }
  })
}
```

- [ ] **Step 3: 创建 electron/ipc/app.ipc.ts**

```typescript
import { ipcMain, app, clipboard } from 'electron'

export function registerAppIpc(): void {
  ipcMain.handle('app:get-platform', async () => {
    return { platform: process.platform }
  })

  ipcMain.handle('app:get-version', async () => {
    return { version: app.getVersion() }
  })

  ipcMain.handle('app:get-path', async (_event, args: { name: string }) => {
    try {
      const path = app.getPath(args.name as Parameters<typeof app.getPath>[0])
      return { path }
    } catch (error) {
      console.error('app:get-path error:', error)
      return { path: '' }
    }
  })

  ipcMain.handle('clipboard:write', async (_event, args: { text: string }) => {
    try {
      clipboard.writeText(args.text)
      return { success: true }
    } catch (error) {
      console.error('clipboard:write error:', error)
      return { success: false }
    }
  })

  ipcMain.handle('clipboard:read', async () => {
    try {
      const text = clipboard.readText()
      return { text }
    } catch (error) {
      console.error('clipboard:read error:', error)
      return { text: '' }
    }
  })
}
```

- [ ] **Step 4: 创建 electron/ipc/index.ts**

```typescript
import { registerDatabaseIpc } from './database.ipc'
import { registerFileIpc } from './file.ipc'
import { registerAppIpc } from './app.ipc'

export function registerIpcHandlers(): void {
  registerDatabaseIpc()
  registerFileIpc()
  registerAppIpc()
  console.log('IPC handlers registered')
}
```

---

### Task 5: 共享类型定义

**Files:**
- Create: `shared/types/database.ts`
- Create: `shared/types/models.ts`
- Create: `src/renderer/types/ipc.d.ts`

- [ ] **Step 1: 创建 shared/types/database.ts**

```typescript
export interface GenerationRecord {
  id: string
  type: 'qr' | 'barcode' | 'encrypted'
  content: string
  format: 'PNG' | 'SVG' | 'PDF' | null
  file_path: string | null
  created_at: number
  tags: string // JSON array
  favorite: number // 0 | 1
}

export interface ScanRecord {
  id: string
  source: 'image' | 'camera' | 'scanner_gun'
  raw_data: string
  detected_type: string | null
  rule_match: string | null
  scanned_at: number
  tags: string
  favorite: number
}

export interface BatchTask {
  id: string
  source_type: 'excel' | 'csv'
  source_path: string | null
  template: string | null
  total_count: number
  success_count: number
  status: 'pending' | 'running' | 'done' | 'failed'
  error_message: string | null
  created_at: number
  completed_at: number | null
}

export interface Rule {
  id: string
  name: string
  pattern: string
  category: string
  action_type: 'sound' | 'save_db' | 'export_csv' | 'webhook' | null
  action_config: string // JSON
  enabled: number // 0 | 1
  sort_order: number
  created_at: number
}
```

- [ ] **Step 2: 创建 shared/types/models.ts**

```typescript
export type ModuleId = 'dashboard' | 'generator' | 'decoder' | 'batch' | 'scan-workspace' | 'history' | 'settings'

export interface NavItem {
  id: ModuleId
  label: string
  icon: string
}

export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
  duration?: number
}
```

- [ ] **Step 3: 创建 src/renderer/types/ipc.d.ts**

```typescript
import type { IpcApi } from '../../electron/preload'

declare global {
  interface Window {
    api: IpcApi
  }
}

export {}
```

---

### Task 6: 渲染进程入口 + CSS 主题系统

**Files:**
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/styles/globals.css`
- Create: `src/renderer/styles/theme.ts`
- Create: `src/renderer/lib/constants.ts`
- Create: `src/renderer/lib/utils.ts`
- Create: `src/renderer/lib/ipc-client.ts`
- Create: `src/renderer/index.html` (if needed)

- [ ] **Step 1: 创建 src/renderer/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  :root {
    --background: 11 15 20;       /* #0B0F14 */
    --surface: 17 24 39;          /* #111827 */
    --hover: 26 35 50;            /* #1A2332 */
    --border: 30 41 59;           /* #1E293B */
    --border-hover: 51 65 85;     /* #334155 */
    --primary: 59 130 246;        /* #3B82F6 */
    --accent: 245 158 11;         /* #F59E0B */
    --success: 16 185 129;        /* #10B981 */
    --warning: 245 158 11;        /* #F59E0B */
    --danger: 239 68 68;          /* #EF4444 */
    --text-primary: 241 245 249;  /* #F1F5F9 */
    --text-secondary: 148 163 184;/* #94A3B8 */
    --text-muted: 100 116 139;    /* #64748B */

    --radius: 0.5rem;
    --sidebar-width: 48px;
    --sidebar-expanded-width: 240px;
    --panel-width: 320px;
  }

  * {
    @apply border-brand-border;
  }

  body {
    @apply bg-brand-bg text-brand-text-primary font-sans antialiased;
    margin: 0;
    padding: 0;
    overflow: hidden;
    user-select: none;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  /* Focus styling */
  :focus-visible {
    @apply outline-2 outline-offset-2 outline-brand-primary;
  }
}

@layer components {
  .glass-panel {
    @apply bg-brand-surface/80 backdrop-blur-sm border border-brand-border/50 rounded-lg;
  }
}
```

- [ ] **Step 2: 创建 src/renderer/styles/theme.ts**

```typescript
export const theme = {
  colors: {
    bg: '#0B0F14',
    surface: '#111827',
    hover: '#1A2332',
    border: '#1E293B',
    borderHover: '#334155',
    primary: '#3B82F6',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
  font: {
    sans: '"Noto Sans SC", system-ui, sans-serif',
    display: '"LXGW WenKai", "Noto Sans SC", serif',
    mono: '"JetBrains Mono", monospace',
  },
  radius: '0.5rem',
  sidebar: {
    narrow: 48,
    expanded: 240,
  },
  panel: 320,
} as const

export type Theme = typeof theme
```

- [ ] **Step 3: 创建 src/renderer/lib/constants.ts**

```typescript
import type { NavItem } from '@shared/types/models'

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: 'LayoutDashboard' },
  { id: 'generator', label: '生成器', icon: 'QrCode' },
  { id: 'decoder', label: '解码器', icon: 'Scan' },
  { id: 'batch', label: '批量中心', icon: 'Layers' },
  { id: 'scan-workspace', label: '扫码工作台', icon: 'ClipboardList' },
  { id: 'history', label: '历史记录', icon: 'History' },
  { id: 'settings', label: '设置', icon: 'Settings' },
] as const

export const APP_NAME = 'CodeStudio'
export const APP_DESCRIPTION = 'QR & Barcode Workspace'
export const MIN_WINDOW_WIDTH = 1024
export const MIN_WINDOW_HEIGHT = 680
```

- [ ] **Step 4: 创建 src/renderer/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
```

- [ ] **Step 5: 创建 src/renderer/lib/ipc-client.ts**

```typescript
export async function queryDb<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await window.api.db.query<T>(sql, params)
  return result.rows
}

export async function executeDb(sql: string, params?: unknown[]): Promise<number> {
  const result = await window.api.db.execute(sql, params)
  return result.changes
}

export async function runDb(sql: string, params?: unknown[]): Promise<string> {
  const result = await window.api.db.run(sql, params)
  return result.lastInsertId
}
```

- [ ] **Step 6: 创建 src/renderer/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 7: 创建 src/renderer/App.tsx**

```typescript
import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
```

---

### Task 7: shadcn/ui 按钮组件（手动实现核心组件）

由于 shadcn/ui 需要 CLI 交互，我们手动实现核心 UI 组件，保持与 shadcn/ui 完全一致的 API 和使用 radix-ui 原始语意。

**Files:**
- Create: `src/renderer/components/ui/button.tsx`
- Create: `src/renderer/components/ui/input.tsx`
- Create: `src/renderer/components/ui/card.tsx`
- Create: `src/renderer/components/ui/tooltip.tsx`
- Create: `src/renderer/components/ui/toast.tsx` (使用 sonner 或自定义)
- Create: `src/renderer/components/ui/use-toast.ts`

- [ ] **Step 1: 创建 src/renderer/components/ui/button.tsx**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-brand-primary text-white hover:bg-blue-600 shadow-sm': variant === 'default',
            'bg-brand-danger text-white hover:bg-red-600 shadow-sm': variant === 'destructive',
            'border border-brand-border bg-transparent hover:bg-brand-hover text-brand-text-primary': variant === 'outline',
            'bg-brand-hover text-brand-text-primary hover:bg-brand-border': variant === 'secondary',
            'hover:bg-brand-hover text-brand-text-primary': variant === 'ghost',
            'text-brand-primary underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
```

- [ ] **Step 2: 创建 src/renderer/components/ui/input.tsx**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-brand-border bg-brand-bg px-3 py-1 text-sm text-brand-text-primary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-text-muted hover:border-brand-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
```

- [ ] **Step 3: 创建 src/renderer/components/ui/card.tsx**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-brand-border bg-brand-surface text-brand-text-primary shadow-sm', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-display text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-brand-text-secondary', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 4: 创建 src/renderer/components/ui/tooltip.tsx**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

export function TooltipProvider({ children }: { children: React.ReactNode }): JSX.Element {
  // Simplified provider - wraps the app to provide tooltip context
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
  delayDuration?: number
}

export function Tooltip({ children, delayDuration = 300 }: TooltipProps): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const timerRef = React.useRef<NodeJS.Timeout>()

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setOpen(true), delayDuration)
  }

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-block"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }): JSX.Element {
  return <>{children}</>
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function TooltipContent({ children, side = 'right', className }: TooltipContentProps): JSX.Element {
  const { open } = React.useContext(TooltipContext)

  if (!open) return <></>

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={cn(
        'absolute z-50 animate-fade-in rounded-md border border-brand-border bg-brand-hover px-3 py-1.5 text-xs text-brand-text-primary shadow-md',
        sideStyles[side],
        className,
      )}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 5: 创建 Toast 系统**

`src/renderer/components/ui/use-toast.ts`:
```typescript
import { create } from 'zustand'

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? 3000
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export function toast(props: Omit<Toast, 'id'>): void {
  useToastStore.getState().addToast(props)
}
```

---

### Task 8: Zustand 状态管理

**Files:**
- Create: `src/renderer/stores/app-store.ts`
- Create: `src/renderer/stores/settings-store.ts`
- Create: `src/renderer/stores/database-store.ts`

- [ ] **Step 1: 创建 src/renderer/stores/app-store.ts**

```typescript
import { create } from 'zustand'

interface AppState {
  sidebarExpanded: boolean
  detailPanelOpen: boolean
  detailPanelType: string | null
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  togglePanel: (type?: string) => void
  closePanel: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarExpanded: false,
  detailPanelOpen: false,
  detailPanelType: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  togglePanel: (type) =>
    set((state) => {
      if (type && state.detailPanelType === type) {
        return { detailPanelOpen: !state.detailPanelOpen }
      }
      return {
        detailPanelOpen: type ? true : !state.detailPanelOpen,
        detailPanelType: type ?? state.detailPanelType,
      }
    }),

  closePanel: () => set({ detailPanelOpen: false, detailPanelType: null }),
}))
```

- [ ] **Step 2: 创建 src/renderer/stores/settings-store.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  language: 'zh-CN'
  defaultExportFormat: 'PNG' | 'SVG' | 'PDF'
  autoSave: boolean
  scanSoundEnabled: boolean
  setLanguage: (lang: 'zh-CN') => void
  setDefaultExportFormat: (format: 'PNG' | 'SVG' | 'PDF') => void
  setAutoSave: (enabled: boolean) => void
  setScanSoundEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'zh-CN',
      defaultExportFormat: 'PNG',
      autoSave: true,
      scanSoundEnabled: false,

      setLanguage: (language) => set({ language }),
      setDefaultExportFormat: (defaultExportFormat) => set({ defaultExportFormat }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setScanSoundEnabled: (scanSoundEnabled) => set({ scanSoundEnabled }),
    }),
    {
      name: 'codestudio-settings',
    },
  ),
)
```

- [ ] **Step 3: 创建 src/renderer/stores/database-store.ts**

```typescript
import { create } from 'zustand'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface DatabaseState {
  status: ConnectionStatus
  error: string | null
  lastBackup: number | null
  setStatus: (status: ConnectionStatus) => void
  setError: (error: string | null) => void
  setLastBackup: (timestamp: number) => void
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  status: 'disconnected',
  error: null,
  lastBackup: null,
  setStatus: (status) => set({ status, error: status === 'error' ? undefined : undefined }),
  setError: (error) => set({ error, status: 'error' }),
  setLastBackup: (lastBackup) => set({ lastBackup }),
}))
```

---

### Task 9: 布局框架 — Sidebar + Workspace + DetailPanel

**Files:**
- Create: `src/renderer/components/layout/AppShell.tsx`
- Create: `src/renderer/components/layout/Sidebar.tsx`
- Create: `src/renderer/components/layout/Workspace.tsx`
- Create: `src/renderer/components/layout/DetailPanel.tsx`

- [ ] **Step 1: 创建 src/renderer/components/layout/Sidebar.tsx**

```typescript
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  QrCode,
  Scan,
  Layers,
  ClipboardList,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ModuleId } from '@shared/types/models'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  QrCode,
  Scan,
  Layers,
  ClipboardList,
  History,
  Settings,
}

export function Sidebar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarExpanded, toggleSidebar } = useAppStore()

  const currentPath = location.pathname.replace('/', '') || 'dashboard'

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarExpanded ? 240 : 48 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-brand-surface border-r border-brand-border overflow-hidden"
    >
      {/* Brand area */}
      <div className="flex items-center justify-center h-12 border-b border-brand-border">
        {sidebarExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 px-3"
          >
            <QrCode className="w-5 h-5 text-brand-primary" />
            <span className="font-display text-sm font-bold text-brand-text-primary">CodeStudio</span>
          </motion.div>
        ) : (
          <QrCode className="w-5 h-5 text-brand-primary" />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 space-y-1 px-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = currentPath === item.id

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger>
                <button
                  onClick={() => navigate(`/${item.id === 'dashboard' ? '' : item.id}`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-all duration-150',
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover',
                  )}
                >
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              {!sidebarExpanded && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-brand-border p-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full"
        >
          {sidebarExpanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.aside>
  )
}
```

- [ ] **Step 2: 创建 src/renderer/components/layout/Workspace.tsx**

```typescript
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export function Workspace(): JSX.Element {
  const location = useLocation()

  return (
    <main className="flex-1 overflow-auto bg-brand-bg">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        <Outlet />
      </motion.div>
    </main>
  )
}
```

- [ ] **Step 3: 创建 src/renderer/components/layout/DetailPanel.tsx**

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'

export function DetailPanel(): JSX.Element {
  const { detailPanelOpen, closePanel } = useAppStore()

  return (
    <AnimatePresence>
      {detailPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden border-l border-brand-border bg-brand-surface"
        >
          <div className="w-[320px] h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <h3 className="font-display text-sm font-semibold text-brand-text-primary">
                详情面板
              </h3>
              <Button variant="ghost" size="icon" onClick={closePanel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-4 text-sm text-brand-text-secondary">
              选择项目以查看详情
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: 创建 src/renderer/components/layout/AppShell.tsx**

```typescript
import { Sidebar } from './Sidebar'
import { Workspace } from './Workspace'
import { DetailPanel } from './DetailPanel'
import { ToastContainer } from '@/components/ui/toast-container'

export function AppShell(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg">
      <Sidebar />
      <Workspace />
      <DetailPanel />
      <ToastContainer />
    </div>
  )
}
```

---

### Task 10: Toast 容器 + ErrorBoundary

**Files:**
- Create: `src/renderer/components/ui/toast-container.tsx`
- Create: `src/renderer/components/shared/ErrorBoundary.tsx`
- Create: `src/renderer/components/shared/ModuleErrorCard.tsx`

- [ ] **Step 1: 创建 src/renderer/components/ui/toast-container.tsx**

```typescript
import { AnimatePresence, motion } from 'framer-motion'
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useToastStore, type Toast } from './use-toast'

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const colorMap = {
  info: 'border-brand-primary text-brand-primary',
  success: 'border-brand-success text-brand-success',
  warning: 'border-brand-warning text-brand-warning',
  error: 'border-brand-danger text-brand-danger',
}

function ToastItem({ toast }: { toast: Toast }): JSX.Element {
  const removeToast = useToastStore((s) => s.removeToast)
  const Icon = iconMap[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-4 rounded-lg border bg-brand-surface shadow-lg min-w-[320px] max-w-[420px] ${colorMap[toast.type]}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-brand-text-secondary mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-brand-text-muted hover:text-brand-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/renderer/components/shared/ErrorBoundary.tsx**

```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ModuleErrorCard } from './ModuleErrorCard'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <ModuleErrorCard
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}
```

- [ ] **Step 3: 创建 src/renderer/components/shared/ModuleErrorCard.tsx**

```typescript
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ModuleErrorCardProps {
  error: Error | null
  moduleName?: string
  onRetry: () => void
}

export function ModuleErrorCard({ error, moduleName, onRetry }: ModuleErrorCardProps): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <AlertTriangle className="w-12 h-12 text-brand-danger mx-auto mb-2" />
          <CardTitle className="text-lg">
            {moduleName ? `${moduleName} 出现异常` : '页面出现异常'}
          </CardTitle>
          <CardDescription>
            {error?.message || '未知错误，请重试'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            重新加载
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 11: 7 个模块占位页面

**Files:**
- Create: `src/renderer/modules/dashboard/DashboardPage.tsx`
- Create: `src/renderer/modules/generator/GeneratorPage.tsx`
- Create: `src/renderer/modules/decoder/DecoderPage.tsx`
- Create: `src/renderer/modules/batch/BatchPage.tsx`
- Create: `src/renderer/modules/scan-workspace/ScanWorkspacePage.tsx`
- Create: `src/renderer/modules/history/HistoryPage.tsx`
- Create: `src/renderer/modules/settings/SettingsPage.tsx`

- [ ] **Step 1: 创建 Dashboard 页面**

`src/renderer/modules/dashboard/DashboardPage.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QrCode, Scan, Layers, History, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const quickActions = [
  { icon: QrCode, label: '生成二维码', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { icon: Scan, label: '扫描解码', color: 'text-brand-success', bg: 'bg-brand-success/10' },
  { icon: Layers, label: '批量处理', color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
  { icon: History, label: '查看历史', color: 'text-blue-400', bg: 'bg-blue-400/10' },
]

const stats = [
  { label: '今日生成', value: '0', icon: QrCode },
  { label: '今日扫描', value: '0', icon: Scan },
  { label: '批量任务', value: '0', icon: Layers },
]

export default function DashboardPage(): JSX.Element {
  return (
    <div className="h-full p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-text-primary">
          CodeStudio
        </h1>
        <p className="mt-2 text-brand-text-secondary">
          QR & Barcode Workspace — 专业离线二维码与条码工作站
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-brand-surface/50">
            <CardContent className="flex items-center gap-4 p-4">
              <stat.icon className="w-8 h-8 text-brand-primary" />
              <div>
                <div className="text-2xl font-mono font-medium text-brand-text-primary">
                  {stat.value}
                </div>
                <div className="text-xs text-brand-text-secondary">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-lg font-semibold text-brand-text-primary mb-4">
          快捷操作
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className={cn(
                'flex flex-col items-center gap-3 p-6 rounded-lg border border-brand-border',
                'hover:border-brand-border-hover hover:bg-brand-hover transition-all duration-150',
              )}
            >
              <div className={cn('p-3 rounded-lg', action.bg)}>
                <action.icon className={cn('w-6 h-6', action.color)} />
              </div>
              <span className="text-sm text-brand-text-secondary">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Features teaser */}
      <div>
        <h2 className="font-display text-lg font-semibold text-brand-text-primary mb-4">
          核心能力
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: '多类型生成', desc: 'QR Code、Barcode、WiFi、JSON 等 8+ 种格式' },
            { title: '智能解码', desc: '图片识别、摄像头扫描、扫码枪、多码同时解析' },
            { title: '离线加密', desc: 'AES-256-GCM 加密二维码，密码 + 企业密钥双模式' },
            { title: '规则引擎', desc: '自动分类、自动动作，扫码即响应' },
          ].map((feature) => (
            <Card key={feature.title} className="bg-brand-surface/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-accent" />
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 Generator 页面**

`src/renderer/modules/generator/GeneratorPage.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Barcode } from 'lucide-react'

export default function GeneratorPage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">生成器</h1>
      <p className="text-brand-text-secondary mb-8">生成 QR Code、Barcode 等二维码和条码</p>

      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-brand-surface/50 border-dashed border-brand-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-brand-primary/10">
                <QrCode className="w-5 h-5 text-brand-primary" />
              </div>
              QR Code 生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brand-text-secondary">
              支持 Text、URL、Email、Phone、WiFi、JSON 类型
            </p>
            <p className="text-xs text-brand-text-muted mt-2">
              Sprint 2 实现
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface/50 border-dashed border-brand-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-brand-accent/10">
                <Barcode className="w-5 h-5 text-brand-accent" />
              </div>
              条码生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brand-text-secondary">
              支持 Code128、Code39、EAN13、EAN8、UPC、DataMatrix
            </p>
            <p className="text-xs text-brand-text-muted mt-2">
              Sprint 2 实现
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3-7: 创建其余占位页面**（结构一致，各有独立内容）

`src/renderer/modules/decoder/DecoderPage.tsx`:
```typescript
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Image, Camera, Keyboard, Grid3X3 } from 'lucide-react'

const decodeModes = [
  { icon: Image, title: '图片识别', desc: '拖拽 JPG/PNG/WebP/BMP' },
  { icon: Camera, title: '摄像头', desc: 'USB/Laptop 实时扫描' },
  { icon: Keyboard, title: '扫码枪', desc: 'USB HID 自动识别' },
  { icon: Grid3X3, title: '多码识别', desc: '单图 QR×20 + Barcode×50' },
]

export default function DecoderPage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">解码器</h1>
      <p className="text-brand-text-secondary mb-8">图片识别 · 摄像头 · 扫码枪 · 多码解析</p>

      <div className="grid grid-cols-2 gap-4">
        {decodeModes.map((mode) => (
          <Card key={mode.title} className="bg-brand-surface/50 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <mode.icon className="w-5 h-5 text-brand-primary" />
                {mode.title}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-xs text-brand-text-muted mt-4">Sprint 3 实现</p>
    </div>
  )
}
```

`src/renderer/modules/batch/BatchPage.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet, FileText } from 'lucide-react'

export default function BatchPage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">批量中心</h1>
      <p className="text-brand-text-secondary mb-8">Excel/CSV 导入 · 模板变量 · 批量生成</p>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-brand-surface/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <FileSpreadsheet className="w-5 h-5 text-brand-success" />
              Excel 导入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs text-brand-text-muted block">
              id    name<br/>
              A001  Dell<br/>
              A002  HP
            </code>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface/50 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <FileText className="w-5 h-5 text-brand-accent" />
              CSV 导入
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <p className="text-xs text-brand-text-muted mt-4">Sprint 4 实现</p>
    </div>
  )
}
```

`src/renderer/modules/scan-workspace/ScanWorkspacePage.tsx`:
```typescript
export default function ScanWorkspacePage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">扫码工作台</h1>
      <p className="text-brand-text-secondary mb-8">去重 · 搜索 · 导出 · 时间戳</p>
      <div className="border border-dashed border-brand-border rounded-lg p-8 text-center">
        <p className="text-brand-text-muted text-sm">等待扫码输入...</p>
        <div className="mt-4 font-mono text-sm text-brand-text-secondary">
          <p>扫描结果</p>
          <hr className="my-2 border-brand-border" />
          <p className="text-brand-text-muted">— 共 0 条 —</p>
        </div>
      </div>
      <p className="text-xs text-brand-text-muted mt-4">Sprint 6 实现</p>
    </div>
  )
}
```

`src/renderer/modules/history/HistoryPage.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Star, Tag } from 'lucide-react'

export default function HistoryPage(): JSX.Element {
  return (
    <div className="h-full p-8">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">历史记录</h1>
      <p className="text-brand-text-secondary mb-8">生成记录 · 扫描记录 · 批量任务</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-hover text-sm text-brand-text-secondary">
          <Search className="w-4 h-4" />
          搜索记录...
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Star className="w-4 h-4" /> 收藏
        </div>
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Tag className="w-4 h-4" /> 标签
        </div>
      </div>

      <Card className="bg-brand-surface/50 border-dashed">
        <CardContent className="p-12 text-center text-brand-text-muted text-sm">
          暂无历史记录
        </CardContent>
      </Card>
    </div>
  )
}
```

`src/renderer/modules/settings/SettingsPage.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSettingsStore } from '@/stores/settings-store'

export default function SettingsPage(): JSX.Element {
  const { defaultExportFormat, autoSave, setDefaultExportFormat, setAutoSave } = useSettingsStore()

  return (
    <div className="h-full p-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">设置</h1>
      <p className="text-brand-text-secondary mb-8">应用偏好配置</p>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">默认导出格式</CardTitle>
            <CardDescription>生成二维码时的默认导出格式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['PNG', 'SVG', 'PDF'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setDefaultExportFormat(fmt)}
                  className={`px-4 py-1.5 rounded-md text-sm border transition-colors ${
                    defaultExportFormat === fmt
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border text-brand-text-secondary hover:border-brand-border-hover'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">自动保存</CardTitle>
            <CardDescription>崩溃恢复时自动恢复未保存的工作</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSave ? 'bg-brand-primary' : 'bg-brand-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

### Task 12: 路由配置 + 线接所有组件

**Files:**
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/index.html` (在项目根)

- [ ] **Step 1: 更新 src/renderer/App.tsx 加入路由 + ErrorBoundary**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/modules/dashboard/DashboardPage'
import GeneratorPage from '@/modules/generator/GeneratorPage'
import DecoderPage from '@/modules/decoder/DecoderPage'
import BatchPage from '@/modules/batch/BatchPage'
import ScanWorkspacePage from '@/modules/scan-workspace/ScanWorkspacePage'
import HistoryPage from '@/modules/history/HistoryPage'
import SettingsPage from '@/modules/settings/SettingsPage'

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="generator"
          element={
            <ErrorBoundary>
              <GeneratorPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="decoder"
          element={
            <ErrorBoundary>
              <DecoderPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="batch"
          element={
            <ErrorBoundary>
              <BatchPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="scan-workspace"
          element={
            <ErrorBoundary>
              <ScanWorkspacePage />
            </ErrorBoundary>
          }
        />
        <Route
          path="history"
          element={
            <ErrorBoundary>
              <HistoryPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="settings"
          element={
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}
```

- [ ] **Step 2: 更新 src/renderer/main.tsx 添加 Router**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 3: 创建渲染进程 HTML 入口**

在项目根目录创建 `src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:" />
    <title>CodeStudio — QR & Barcode Workspace</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

---

### Task 13: 验证构建 + 运行

- [ ] **Step 1: TypeScript 类型检查**

```bash
cd "F:\first-cc\A4-CodeStudio"
pnpm typecheck
```
Expected: 零类型错误。

- [ ] **Step 2: Vite 构建**

```bash
pnpm build
```
Expected: main、preload、renderer 三端均构建成功。

- [ ] **Step 3: 启动开发模式**

```bash
pnpm dev
```
Expected: Electron 窗口启动，显示 CodeStudio 应用，深色主题生效，侧边栏可展开/折叠，7 个模块页面可通过路由访问。

- [ ] **Step 4: 验证清单**

手动验证所有 Sprint 1 验收项：
1. 窗口大小 ≥ 1024×680 ✅
2. 深色主题生效 (#0B0F14 背景) ✅
3. Sidebar 窄/宽切换流畅 ✅
4. 7 个模块页面可独立访问 ✅
5. Dashboard 显示统计卡片和快捷操作 ✅
6. 设置页面可切换导出格式 ✅
7. Framer Motion 路由过渡动画 ✅
8. 浏览器 console 无红色错误 ✅
9. 试关闭 + 重启 → 数据库文件存在于 userData ✅

- [ ] **Step 5: 打包验证**

```bash
pnpm package
```
Expected: 在 `dist/` 目录生成 Windows .exe 安装包。

---

## 自审清单

- [x] Spec 覆盖：所有 17 项交付清单均有对应任务（Task 1-13）
- [x] 无占位符：所有代码步骤均包含完整实现代码
- [x] 类型一致性：IpcApi 类型在 preload.ts 定义，ipc.d.ts 声明，ipc-client.ts 消费，类型名和参数签名一致
- [x] ModuleId 类型在 models.ts 定义，NAV_ITEMS 在 constants.ts 引用，Sidebar 消费，类型路径一致
- [x] 文件路径：所有 import 使用 @/ 别名或相对路径，与 tsconfig.web.json paths 配置一致
- [x] 数据库表字段与 shared/types/database.ts 接口字段一一对应
- [x] Toast 类型在 use-toast.ts、toast-container.tsx 中引用一致
- [x] 路由路径与 Sidebar navigate 调用一致（dashboard=''，其余='/module-id'）
