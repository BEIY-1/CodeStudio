CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_history (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  format TEXT,
  file_path TEXT,
  created_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_gen_type ON generation_history(type);
CREATE INDEX IF NOT EXISTS idx_gen_created ON generation_history(created_at DESC);

CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  raw_data TEXT NOT NULL,
  detected_type TEXT,
  rule_match TEXT,
  scanned_at INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  favorite INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scan_date ON scan_history(scanned_at DESC);

CREATE TABLE IF NOT EXISTS batch_tasks (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_path TEXT,
  template TEXT,
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  action_type TEXT,
  action_config TEXT DEFAULT '{}',
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
