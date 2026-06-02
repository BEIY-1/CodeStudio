import { create } from 'zustand'

export type ActionType = 'sound' | 'save_db' | 'export_csv' | 'webhook' | 'tag' | 'highlight'

export interface Rule {
  id: string
  name: string
  pattern: string
  category: string
  actionType: ActionType
  actionConfig: string
  enabled: boolean
  sortOrder: number
  createdAt: number
}

interface RulesState {
  rules: Rule[]
  addRule: (rule: Omit<Rule, 'id' | 'createdAt'>) => void
  updateRule: (id: string, updates: Partial<Rule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
}

let rCounter = 0
function safeId(): string {
  rCounter++
  return `rule-${Date.now()}-${rCounter}`
}

function createDefaults(): Rule[] {
  const now = Date.now()
  return [
    { id: safeId(), name: '资产标签', pattern: 'A*', category: '资产', actionType: 'tag', actionConfig: '{"tag":"资产"}', enabled: true, sortOrder: 0, createdAt: now },
    { id: safeId(), name: '设备序列号', pattern: 'SN*', category: '设备', actionType: 'tag', actionConfig: '{"tag":"设备"}', enabled: true, sortOrder: 1, createdAt: now + 1 },
    { id: safeId(), name: '订单编号', pattern: 'ORD-*', category: '订单', actionType: 'tag', actionConfig: '{"tag":"订单"}', enabled: true, sortOrder: 2, createdAt: now + 2 },
  ]
}

function loadRules(): Rule[] {
  try {
    const raw = localStorage.getItem('codestudio-rules')
    if (!raw) return createDefaults()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaults()
    return parsed.filter(
      (e: unknown) => e && typeof e === 'object' && typeof (e as Rule).id === 'string',
    )
  } catch {
    return createDefaults()
  }
}

function saveRules(rules: Rule[]): void {
  try { localStorage.setItem('codestudio-rules', JSON.stringify(rules)) } catch { /* ok */ }
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: loadRules(),

  addRule: (rule) => {
    const newRules = [...get().rules, { ...rule, id: safeId(), createdAt: Date.now() }]
      .sort((a, b) => a.sortOrder - b.sortOrder)
    saveRules(newRules)
    set({ rules: newRules })
  },

  updateRule: (id, updates) => {
    const newRules = get().rules
      .map((r) => (r.id === id ? { ...r, ...updates } : r))
      .sort((a, b) => a.sortOrder - b.sortOrder)
    saveRules(newRules)
    set({ rules: newRules })
  },

  removeRule: (id) => {
    const newRules = get().rules.filter((r) => r.id !== id)
    saveRules(newRules)
    set({ rules: newRules })
  },

  toggleRule: (id) => {
    const newRules = get().rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r,
    )
    saveRules(newRules)
    set({ rules: newRules })
  },
}))

export function matchRules(text: string, rules: Rule[]): Rule[] {
  if (!text || !rules?.length) return []
  return rules
    .filter((r) => r?.enabled && r?.pattern)
    .filter((r) => {
      try {
        const p = r.pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        return new RegExp('^' + p + '$', 'i').test(text)
      } catch { return false }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getActionLabel(type: ActionType): string {
  const m: Record<string, string> = {
    sound: '播放声音', save_db: '保存数据库', export_csv: '导出 CSV',
    webhook: '调用 Webhook', tag: '添加标签', highlight: '高亮显示',
  }
  return m[type] ?? type
}
