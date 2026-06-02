import { app, BrowserWindow, shell } from 'electron'
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupCrashRecovery(win: BrowserWindow): void {
  let crashCount = 0
  let crashTimer: NodeJS.Timeout | null = null

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Render process gone:', details.reason, details.exitCode)
    crashCount++

    if (crashTimer) clearTimeout(crashTimer)

    if (crashCount >= 3) {
      crashCount = 0
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.session.clearCache()
        mainWindow.webContents.reloadIgnoringCache()
      }
      return
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.reload()
    }

    crashTimer = setTimeout(() => {
      crashCount = 0
    }, 30000)
  })
}

app.whenReady().then(async () => {
  setupCrashReporter()

  try {
    await initDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization failed (app will run without persistence):', err)
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
