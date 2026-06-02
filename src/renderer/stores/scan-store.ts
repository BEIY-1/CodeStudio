import { create } from 'zustand'

export interface ScanEntry {
  id: string
  text: string
  format: string
  source: 'image' | 'camera' | 'scanner_gun' | 'multi' | 'manual'
  timestamp: number
  tags: string[]
}

interface ScanState {
  entries: ScanEntry[]
  addEntry: (text: string, format?: string, source?: ScanEntry['source']) => void
  removeEntry: (id: string) => void
  clearEntries: () => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
}

let counter = 0
function safeId(): string {
  counter++
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 9)}`
}

// Try to load persisted data, silently fail
function loadPersisted(): ScanEntry[] {
  try {
    const raw = localStorage.getItem('codestudio-scan-entries')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Validate entries have required fields
    return parsed.filter(
      (e: unknown) =>
        e && typeof e === 'object' &&
        typeof (e as ScanEntry).id === 'string' &&
        typeof (e as ScanEntry).text === 'string',
    ).slice(0, 100)
  } catch {
    return []
  }
}

function savePersisted(entries: ScanEntry[]): void {
  try {
    localStorage.setItem(
      'codestudio-scan-entries',
      JSON.stringify(entries.slice(0, 100)),
    )
  } catch { /* quota exceeded or unavailable */ }
}

export const useScanStore = create<ScanState>((set, get) => ({
  entries: loadPersisted(),

  addEntry: (text, format = 'unknown', source = 'manual') => {
    if (!text || !text.trim()) return
    const t = text.trim()
    const state = get()
    if (state.entries.some((e) => e.text === t)) return
    const entry: ScanEntry = {
      id: safeId(),
      text: t,
      format,
      source,
      timestamp: Date.now(),
      tags: [],
    }
    const newEntries = [entry, ...state.entries].slice(0, 1000)
    savePersisted(newEntries)
    set({ entries: newEntries })
  },

  removeEntry: (id) => {
    const newEntries = get().entries.filter((e) => e.id !== id)
    savePersisted(newEntries)
    set({ entries: newEntries })
  },

  clearEntries: () => {
    savePersisted([])
    set({ entries: [] })
  },

  addTag: (id, tag) => {
    if (!tag.trim()) return
    const newEntries = get().entries.map((e) =>
      e.id === id && !e.tags.includes(tag.trim())
        ? { ...e, tags: [...e.tags, tag.trim()] }
        : e,
    )
    savePersisted(newEntries)
    set({ entries: newEntries })
  },

  removeTag: (id, tag) => {
    const newEntries = get().entries.map((e) =>
      e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e,
    )
    savePersisted(newEntries)
    set({ entries: newEntries })
  },
}))
