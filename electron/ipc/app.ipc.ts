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
