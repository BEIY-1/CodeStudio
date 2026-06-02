export async function queryDb<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await window.api.db.query<T>(sql, params)
  return result.rows
}

export async function executeDb(
  sql: string,
  params?: unknown[],
): Promise<number> {
  const result = await window.api.db.execute(sql, params)
  return result.changes
}

export async function runDb(
  sql: string,
  params?: unknown[],
): Promise<string> {
  const result = await window.api.db.run(sql, params)
  return result.lastInsertId
}
