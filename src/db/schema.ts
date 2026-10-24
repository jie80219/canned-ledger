import Dexie, { type Table } from 'dexie'
import type { Account, Asset, Book, Budget, Category, FxRate, Goal, Meta, Recurring, Transaction } from './types'

export const DB_NAME = 'tuntun-ledger'
/** 改名前的資料庫名稱，啟動時搬到新名稱 */
const LEGACY_DB_NAME = 'canned-ledger'

export class LedgerDB extends Dexie {
  books!: Table<Book, string>
  accounts!: Table<Account, string>
  categories!: Table<Category, string>
  transactions!: Table<Transaction, string>
  recurring!: Table<Recurring, string>
  budgets!: Table<Budget, string>
  fxRates!: Table<FxRate, [string, string, string]>
  meta!: Table<Meta, string>
  assets!: Table<Asset, string>
  goals!: Table<Goal, string>

  constructor(name = DB_NAME) {
    super(name)
    this.version(1).stores({
      books: 'id, sortOrder',
      accounts: 'id, bookId, type, sortOrder',
      categories: 'id, bookId, kind, parentId, sortOrder',
      transactions:
        'id, bookId, date, accountId, toAccountId, categoryId, kind, [bookId+date], recurringId, status, &autoKey',
      recurring: 'id, bookId',
      budgets: 'id, bookId, categoryId',
      fxRates: '[base+quote+date], date',
      meta: 'key',
    })
    this.version(2).stores({ assets: 'id' })
    this.version(3).stores({ goals: 'id, bookId, accountId' })
  }
}

export const TABLES = [
  'books',
  'accounts',
  'categories',
  'transactions',
  'recurring',
  'budgets',
  'fxRates',
  'meta',
  'assets',
  'goals',
] as const

export type TableName = (typeof TABLES)[number]

export const db = new LedgerDB()

export const uid = () => crypto.randomUUID()

export async function getMeta<T>(key: string, fallback: T, d: LedgerDB = db): Promise<T> {
  const row = await d.meta.get(key)
  return row === undefined ? fallback : (row.value as T)
}

export function setMeta(key: string, value: unknown, d: LedgerDB = db) {
  return d.meta.put({ key, value })
}

/** 舊名稱的資料庫有資料、新的還是空的時候，整份複製過來。舊資料庫保留不刪。 */
export async function migrateLegacyDb(d: LedgerDB = db): Promise<boolean> {
  const names = (await indexedDB.databases?.())?.map((x) => x.name) ?? []
  if (!names.includes(LEGACY_DB_NAME)) return false
  if ((await d.books.count()) > 0) return false
  const old = new LedgerDB(LEGACY_DB_NAME)
  try {
    await old.open()
    if ((await old.books.count()) === 0) return false
    // 先讀完舊資料再寫，transaction 裡不能等待其他資料庫
    const data = await Promise.all(TABLES.map((t) => old.table(t).toArray()))
    await d.transaction('rw', TABLES.map((t) => d.table(t)), async () => {
      for (const [i, t] of TABLES.entries()) await d.table(t).bulkPut(data[i])
    })
    return true
  } finally {
    old.close()
  }
}
