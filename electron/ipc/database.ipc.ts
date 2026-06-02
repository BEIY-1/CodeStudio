import { ipcMain } from 'electron'
import { getDb, saveToDisk } from '../database/connection'

interface QueryArgs {
  sql: string
  params?: unknown[]
}

function rowToObject(
  columns: string[],
  values: (string | number | null)[],
): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => {
    obj[col] = values[i]
  })
  return obj
}

export function registerDatabaseIpc(): void {
  ipcMain.handle('db:query', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      const stmt = db.prepare(args.sql)
      if (args.params) {
        stmt.bind(args.params as unknown[])
      }

      const rows: Record<string, unknown>[] = []
      while (stmt.step()) {
        const cols = stmt.getColumnNames()
        const vals = stmt.get()
        rows.push(rowToObject(cols, vals as (string | number | null)[]))
      }
      stmt.free()
      return { rows }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:query error:', message)
      return { rows: [], error: message }
    }
  })

  ipcMain.handle('db:execute', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      // For INSERT/UPDATE/DELETE, use run
      db.run(args.sql, args.params as unknown[] | undefined)
      const changes = db.getRowsModified()
      saveToDisk()
      return { changes }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:execute error:', message)
      return { changes: 0, error: message }
    }
  })

  ipcMain.handle('db:run', async (_event, args: QueryArgs) => {
    try {
      const db = getDb()
      db.run(args.sql, args.params as unknown[] | undefined)

      // Get last insert rowid
      const result = db.exec('SELECT last_insert_rowid() as id')
      let lastInsertId = ''
      if (result.length > 0 && result[0]!.values.length > 0) {
        lastInsertId = String(result[0]!.values[0]![0] ?? '')
      }
      saveToDisk()
      return { lastInsertId }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('db:run error:', message)
      return { lastInsertId: '', error: message }
    }
  })
}
