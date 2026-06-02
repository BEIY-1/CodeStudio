import { create } from 'zustand'

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

function loadSettings(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem('codestudio-settings')
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

function saveSettings(s: Partial<SettingsState>): void {
  try { localStorage.setItem('codestudio-settings', JSON.stringify(s)) } catch { /* ok */ }
}

const defaults = { language: 'zh-CN' as const, defaultExportFormat: 'PNG' as const, autoSave: true, scanSoundEnabled: false }

export const useSettingsStore = create<SettingsState>((set) => {
  const saved = loadSettings()
  return {
    ...defaults,
    ...saved,
    setLanguage: (language) => set((s) => { const n = { ...s, language }; saveSettings(n); return n }),
    setDefaultExportFormat: (fmt) => set((s) => { const n = { ...s, defaultExportFormat: fmt }; saveSettings(n); return n }),
    setAutoSave: (autoSave) => set((s) => { const n = { ...s, autoSave }; saveSettings(n); return n }),
    setScanSoundEnabled: (v) => set((s) => { const n = { ...s, scanSoundEnabled: v }; saveSettings(n); return n }),
  }
})
