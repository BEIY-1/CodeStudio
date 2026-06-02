import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync, readFileSync, existsSync } from 'fs'

interface SaveDialogArgs {
  defaultName: string
  filters: { name: string; extensions: string[] }[]
}

interface FileWriteArgs {
  path: string
  data: string
  encoding?: 'utf-8' | 'base64'
}

interface FileReadArgs {
  path: string
  encoding?: 'utf-8' | 'base64'
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

      return { filePath: result.canceled ? null : (result.filePath ?? null) }
    } catch (error) {
      console.error('file:save-dialog error:', error)
      return { filePath: null }
    }
  })

  ipcMain.handle('file:open-directory', async () => {
    try {
      const window = BrowserWindow.getFocusedWindow()
      if (!window) return { dirPath: null }

      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'createDirectory'],
        title: '选择导出目录',
      })

      return { dirPath: result.canceled ? null : (result.filePaths[0] ?? null) }
    } catch (error) {
      console.error('file:open-directory error:', error)
      return { dirPath: null }
    }
  })

  ipcMain.handle('file:write', async (_event, args: FileWriteArgs) => {
    try {
      if (args.encoding === 'base64') {
        // Decode base64 to binary buffer for image files
        const buffer = Buffer.from(args.data, 'base64')
        writeFileSync(args.path, buffer)
      } else {
        writeFileSync(args.path, args.data, 'utf-8')
      }
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
      if (args.encoding === 'base64') {
        const buffer = readFileSync(args.path)
        return { data: buffer.toString('base64') }
      }
      const data = readFileSync(args.path, 'utf-8')
      return { data }
    } catch (error) {
      console.error('file:read error:', error)
      return { data: null }
    }
  })
}
