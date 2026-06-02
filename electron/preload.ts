import { contextBridge, ipcRenderer } from 'electron'

export type IpcApi = {
  db: {
    query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>
    execute: (sql: string, params?: unknown[]) => Promise<{ changes: number }>
    run: (sql: string, params?: unknown[]) => Promise<{ lastInsertId: string }>
  }
  file: {
    saveDialog: (
      defaultName: string,
      filters: { name: string; extensions: string[] }[],
    ) => Promise<{ filePath: string | null }>
    write: (path: string, data: string, encoding?: 'utf-8' | 'base64') => Promise<{ success: boolean }>
    read: (path: string, encoding?: 'utf-8' | 'base64') => Promise<{ data: string | null }>
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
    saveDialog: (defaultName, filters) =>
      ipcRenderer.invoke('file:save-dialog', { defaultName, filters }),
    write: (path, data, encoding) => ipcRenderer.invoke('file:write', { path, data, encoding }),
    read: (path, encoding) => ipcRenderer.invoke('file:read', { path, encoding }),
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
