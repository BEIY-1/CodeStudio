import { registerDatabaseIpc } from './database.ipc'
import { registerFileIpc } from './file.ipc'
import { registerAppIpc } from './app.ipc'

export function registerIpcHandlers(): void {
  registerDatabaseIpc()
  registerFileIpc()
  registerAppIpc()
  console.log('IPC handlers registered')
}
