import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'fs'
import { runMigrations } from './migrations'

let db: SqlJsDatabase | null = null
let SQL: SqlJsStatic | null = null

const BACKUP_DIR = join(app.getPath('userData'), 'backups')
const MAX_BACKUPS = 5
const BACKUP_INTERVAL_MS = 30 * 60 * 1000

let backupTimer: NodeJS.Timeout | null = null

export function getDbPath(): string {
  return join(app.getPath('userData'), 'codestudio.db')
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function getSql(): SqlJsStatic {
  if (!SQL) {
    throw new Error('SQL module not loaded.')
  }
  return SQL
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  SQL = await initSqlJs()

  const dbPath = getDbPath()

  if (existsSync(dbPath)) {
    try {
      const buffer = readFileSync(dbPath)
      db = new SQL.Database(buffer)
      // Verify integrity
      db.exec('PRAGMA integrity_check')
    } catch (err) {
      console.error('Failed to load database, attempting recovery:', err)
      const restored = restoreFromBackup(dbPath)
      if (restored) {
        const buffer = readFileSync(dbPath)
        db = new SQL.Database(buffer)
      } else {
        db = new SQL.Database()
      }
    }
  } else {
    db = new SQL.Database()
  }

  // Pragmas
  db.run('PRAGMA journal_mode = WAL')
  db.run('PRAGMA foreign_keys = ON')
  db.run('PRAGMA busy_timeout = 5000')

  // Run migrations
  runMigrations(db)
  saveToDisk()

  // Start periodic backups
  startPeriodicBackup()

  console.log('Database initialized (sql.js)')
  return db
}

export function saveToDisk(): void {
  if (!db) return
  const dbPath = getDbPath()
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(dbPath, buffer)
}

export function closeDatabase(): void {
  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }

  try {
    saveToDisk()
    performBackup()
  } catch (err) {
    console.error('Final backup failed:', err)
  }

  if (db) {
    db.close()
    db = null
  }
  SQL = null
}

function performBackup(): void {
  if (!db) return

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const timestamp = Date.now()
  const backupPath = join(BACKUP_DIR, `codestudio-${timestamp}.db`)

  const data = db.export()
  writeFileSync(backupPath, Buffer.from(data))

  // Clean up old backups
  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('codestudio-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  for (let i = MAX_BACKUPS; i < backups.length; i++) {
    try {
      unlinkSync(backups[i]!.path)
    } catch (err) {
      console.error(`Failed to remove old backup ${backups[i]!.name}:`, err)
    }
  }
}

function startPeriodicBackup(): void {
  backupTimer = setInterval(() => {
    try {
      saveToDisk()
      performBackup()
    } catch (err) {
      console.error('Periodic backup failed:', err)
    }
  }, BACKUP_INTERVAL_MS)

  if (backupTimer && typeof backupTimer.unref === 'function') {
    backupTimer.unref()
  }
}

function restoreFromBackup(dbPath: string): boolean {
  if (!existsSync(BACKUP_DIR)) return false

  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('codestudio-') && f.endsWith('.db'))
    .map((f) => ({
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (backups.length === 0) return false

  console.log(`Restoring from backup: ${backups[0]!.path}`)
  try {
    const data = readFileSync(backups[0]!.path)
    writeFileSync(dbPath, data)
    return true
  } catch (err) {
    console.error('Failed to restore from backup:', err)
    return false
  }
}
