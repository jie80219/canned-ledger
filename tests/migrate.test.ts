import { describe, expect, it } from 'vitest'
import { LedgerDB, migrateLegacyDb } from '../src/db/schema'
import { account, freshDb } from './helpers'

describe('改名後的資料庫搬移', () => {
  it('新資料庫是空的時，複製舊資料庫的資料', async () => {
    const old = new LedgerDB('canned-ledger')
    await old.books.put({ id: 'b', name: '日常', currency: 'TWD', icon: '🥫', color: '#888', sortOrder: 0, updatedAt: 0 } as never)
    await old.accounts.put(account({ id: 'bank' }))
    old.close()

    const d = freshDb()
    expect(await migrateLegacyDb(d)).toBe(true)
    expect(await d.books.count()).toBe(1)
    expect((await d.accounts.get('bank'))?.name).toBe('bank')
    // 已經有資料就不再搬
    expect(await migrateLegacyDb(d)).toBe(false)
    await new LedgerDB('canned-ledger').delete()
  })

  it('沒有舊資料庫時什麼都不做', async () => {
    expect(await migrateLegacyDb(freshDb())).toBe(false)
  })
})
