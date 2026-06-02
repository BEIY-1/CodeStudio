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
  setStatus: (status) =>
    set({ status, error: status !== 'error' ? null : undefined }),
  setError: (error) => set({ error, status: 'error' }),
  setLastBackup: (lastBackup) => set({ lastBackup }),
}))
