import { describe, expect, it } from 'vitest'
import { parseInvoiceCsv } from '../src/io/invoice'
import { exportBackup, importBackup } from '../src/io/backup'
import { transactionsToCsv } from '../src/io/csv'
import { makeTx } from '../src/db/factory'
import { account, freshDb } from './helpers'

const SAMPLE = `表頭=M|載具名稱|載具號碼|發票日期|商店統編|商店店名|發票號碼|總金額|發票狀態|
明細=D|發票號碼|小計|品項名稱|
M|手機條碼|/ABC1234|20260105|12345678|全家便利商店|AB12345678|85|開立|
D|AB12345678|35|鮮奶|
D|AB12345678|50|御飯糰|
M|手機條碼|/ABC1234|20260103|87654321|台灣中油|CD87654321|1200|開立|
D|CD87654321|1200|95無鉛汽油|
M|手機條碼|/ABC1234|20260104|11111111|某店|EF11111111|99|作廢|
`

describe('發票 CSV', () => {
  it('解析表頭與明細、略過作廢', () => {
    const inv = parseInvoiceCsv(SAMPLE)
    expect(inv.map((i) => i.invoiceNo)).toEqual(['CD87654321', 'AB12345678'])
    expect(inv[1]).toMatchObject({ date: '2026-01-05', sellerName: '全家便利商店', total: 85 })
    expect(inv[1].items).toHaveLength(2)
  })
  it('逗號分隔也能解析', () => {
    const inv = parseInvoiceCsv('M,手機條碼,/A,20260105,1,"店,名",XY00000001,10,開立\n')
    expect(inv[0].sellerName).toBe('店,名')
  })
})

describe('備份', () => {
  it('匯出 → 清空 → 匯入後完全一致', async () => {
    const db = freshDb()
    await db.accounts.add(account({ id: 'bank' }))
    await db.transactions.add(makeTx({ bookId: 'b', kind: 'expense', date: '2026-01-01', amount: 100, accountId: 'bank' }))
    const snap = JSON.parse(JSON.stringify(await exportBackup(db)))
    await db.transactions.clear()
    await importBackup(snap, 'overwrite', db)
    expect(await exportBackup(db).then((b) => b.tables)).toEqual(snap.tables)
  })
  it('合併時較新的勝出', async () => {
    const db = freshDb()
    await db.accounts.add(account({ id: 'bank', name: '新名字', updatedAt: 200 }))
    await importBackup(
      { app: 'canned-ledger', schemaVersion: 1, exportedAt: '', tables: { accounts: [account({ id: 'bank', name: '舊', updatedAt: 100 }), account({ id: 'x', updatedAt: 1 })] } },
      'merge',
      db,
    )
    expect((await db.accounts.get('bank'))!.name).toBe('新名字')
    expect(await db.accounts.count()).toBe(2)
  })
  it('拒絕非本 App 的檔案', async () => {
    await expect(importBackup({ foo: 1 }, 'merge', freshDb())).rejects.toThrow()
  })
})

describe('CSV 匯出', () => {
  it('含 BOM 並跳脫逗號', () => {
    const csv = transactionsToCsv(
      [makeTx({ bookId: 'b', kind: 'expense', date: '2026-01-01', amount: 100, accountId: 'bank', note: 'a,b' })],
      [account({ id: 'bank', name: '銀行' })],
      [],
    )
    expect(csv.startsWith('﻿日期')).toBe(true)
    expect(csv).toContain('"a,b"')
  })
})
