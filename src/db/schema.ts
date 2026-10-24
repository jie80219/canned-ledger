import Dexie, { type Table } from 'dexie'
import type { Account, Book, Budget, Category, FxRate, Meta, Recurring, Transaction } from './types'

export class LedgerDB extends Dexie {
  books!: Table<Book, string>
  accounts!: Table<Account, string>
  categories!: Table<Category, string>
  transactions!: Table<Transaction, string>
  recurring!: Table<Recurring, string>
  budgets!: Table<Budget, string>
  fxRates!: Table<FxRate, [string, string, string]>
  meta!: Table<Meta, string>

  constructor(name = 'canned-ledger') {
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
