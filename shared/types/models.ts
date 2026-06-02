export type ModuleId =
  | 'dashboard'
  | 'generator'
  | 'decoder'
  | 'batch'
  | 'scan-workspace'
  | 'history'
  | 'settings'

export interface NavItem {
  id: ModuleId
  label: string
  icon: string
}

export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
  duration?: number
}
