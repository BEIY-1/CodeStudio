export const theme = {
  colors: {
    bg: '#0B0F14',
    surface: '#111827',
    hover: '#1A2332',
    border: '#1E293B',
    borderHover: '#334155',
    primary: '#3B82F6',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
  font: {
    sans: '"Noto Sans SC", system-ui, sans-serif',
    display: '"LXGW WenKai", "Noto Sans SC", serif',
    mono: '"JetBrains Mono", monospace',
  },
  sidebar: {
    narrow: 48,
    expanded: 240,
  },
  panel: 320,
} as const

export type Theme = typeof theme
