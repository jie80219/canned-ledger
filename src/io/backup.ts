import { db as defaultDb, TABLES, type LedgerDB, type TableName } from '../db/schema'

export const BACKUP_APP = 'tuntun-ledger'
/** 改名前匯出的備份也要能還原 */
const LEGACY_BACKUP_APPS = ['canned-ledger']
export const SCHEMA_VERSION = 1

export interface Backup {
  app: string
  schemaVersion: number
  exportedAt: string
  tables: Partial<Record<TableName, unknown[]>>
}

export async function exportBackup(d: LedgerDB = defaultDb): Promise<Backup> {
  const tables: Backup['tables'] = {}
  await d.transaction('r', TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) tables[t] = await d.table(t).toArray()
  })
  return { app: BACKUP_APP, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables }
}

export function validateBackup(data: unknown): Backup {
  const b = data as Backup
  if (!b || (b.app !== BACKUP_APP && !LEGACY_BACKUP_APPS.includes(b.app)) || typeof b.tables !== 'object') throw new Error('不是囤囤帳的備份檔')
  if (b.schemaVersion > SCHEMA_VERSION) throw new Error('備份檔版本比目前 App 新，請先更新 App')
  return b
}

/**
 * overwrite：清空後還原。
 * merge：以 id 比對，updatedAt 較新的勝出（沒有 updatedAt 的資料表直接覆寫）。
 */
export async function importBackup(
  data: unknown,
  mode: 'overwrite' | 'merge',
  d: LedgerDB = defaultDb,
): Promise<{ written: number }> {
  const b = validateBackup(data)
  let written = 0
  await d.transaction('rw', TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) {
      const rows = (b.tables[t] ?? []) as Array<Record<string, any>>
      const table = d.table(t)
      if (mode === 'overwrite') {
        await table.clear()
        await table.bulkAdd(rows)
        written += rows.length
        continue
      }
      const toPut: typeof rows = []
      for (const row of rows) {
        if (row.id === undefined || row.updatedAt === undefined) {
          toPut.push(row)
          continue
        }
        const cur = await table.get(row.id)
        if (!cur || (cur.updatedAt ?? 0) < row.updatedAt) toPut.push(row)
      }
      if (t === 'transactions') {
        // 自動交易的 autoKey 是唯一鍵：本機已有同 key 的不同 id 交易時，保留本機那筆
        for (let i = toPut.length - 1; i >= 0; i--) {
          const k = toPut[i].autoKey
          if (!k) continue
          const dup = await table.where('autoKey').equals(k).first()
          if (dup && dup.id !== toPut[i].id) toPut.splice(i, 1)
        }
      }
      await table.bulkPut(toPut)
      written += toPut.length
    }
  })
  return { written }
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
