export interface GenerationRecord {
  id: string
  type: 'qr' | 'barcode' | 'encrypted'
  content: string
  format: 'PNG' | 'SVG' | 'PDF' | null
  file_path: string | null
  created_at: number
  tags: string
  favorite: number
}

export interface ScanRecord {
  id: string
  source: 'image' | 'camera' | 'scanner_gun'
  raw_data: string
  detected_type: string | null
  rule_match: string | null
  scanned_at: number
  tags: string
  favorite: number
}

export interface BatchTask {
  id: string
  source_type: 'excel' | 'csv'
  source_path: string | null
  template: string | null
  total_count: number
  success_count: number
  status: 'pending' | 'running' | 'done' | 'failed'
  error_message: string | null
  created_at: number
  completed_at: number | null
}

export interface Rule {
  id: string
  name: string
  pattern: string
  category: string
  action_type: 'sound' | 'save_db' | 'export_csv' | 'webhook' | null
  action_config: string
  enabled: number
  sort_order: number
  created_at: number
}
