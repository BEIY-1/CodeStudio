import type { NavItem } from '@shared/types/models'

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: '工作台', icon: 'LayoutDashboard' },
  { id: 'generator', label: '生成器', icon: 'QrCode' },
  { id: 'decoder', label: '解码器', icon: 'Scan' },
  { id: 'batch', label: '批量中心', icon: 'Layers' },
  { id: 'scan-workspace', label: '扫码工作台', icon: 'ClipboardList' },
  { id: 'history', label: '历史记录', icon: 'History' },
  { id: 'settings', label: '设置', icon: 'Settings' },
] as const

export const APP_NAME = 'CodeStudio'
export const APP_DESCRIPTION = 'QR & Barcode Workspace'
