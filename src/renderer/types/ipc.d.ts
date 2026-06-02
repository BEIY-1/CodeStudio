import type { IpcApi } from '../../electron/preload'

declare global {
  interface Window {
    api: IpcApi
  }
}

export {}
