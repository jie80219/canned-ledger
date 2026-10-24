import { describe, expect, it } from 'vitest'
import { runScheduler } from '../src/domain/scheduler'
import type { Recurring } from '../src/db/types'
import { account, credit, freshDb } from './helpers'

const usdRate = async (b: string, q: string, date: string) =>
  b === 'USD' && q === 'TWD' ? { rate: 32, date, source: 'test' } : null

function rule(p: Partial<Recurring>): Recurring {
  return {
    id: 'r1',
    bookId: 'b',
    name: '房租',
    template: { kind: 'expense', accountId: 'bank', categoryId: 'c', note: '' },
    amount: 15000,
    currency: 'TWD',
    fxMode: 'auto',
    freq: 'monthly',
    interval: 1,
    startDate: '2026-01-05',
    generated: 0,
    active: true,
    updatedAt: 0,
    ...p,
  }
}

describe('補跑引擎', () => {
  it('離線三個月補齊且不重複', async () => {
    const db = freshDb()
    await db.accounts.add(account({ id: 'bank' }))
    await db.recurring.add(rule({}))
    const r1 = await runScheduler({ db, today: '2026-04-10', getRate: usdRate })
    expect(r1.created).toBe(4)
    const dates = (await db.transactions.orderBy('date').toArray()).map((t) => t.date)
    expect(dates).toEqual(['2026-01-05', '2026-02-05', '2026-03-05', '2026-04-05'])
    const r2 = await runScheduler({ db, today: '2026-04-10', getRate: usdRate })
    expect(r2.created).toBe(0)
    expect(await db.transactions.count()).toBe(4)
    expect((await db.recurring.get('r1'))!.generated).toBe(4)
  })

  it('同時執行兩次（模擬多分頁）也只入帳一次', async () => {
    const db = freshDb()
    await db.accounts.add(account({ id: 'bank' }))
    await db.recurring.add(rule({}))
    await Promise.all([
      runScheduler({ db, today: '2026-02-10', getRate: usdRate }),
      runScheduler({ db, today: '2026-02-10', getRate: usdRate }),
    ])
    expect(await db.transactions.count()).toBe(2)
  })

  it('USD 訂閱扣信用卡：當日匯率 + 海外手續費，confirm 模式為待確認', async () => {
    const db = freshDb()
    await db.accounts.bulkAdd([
      account({ id: 'bank' }),
      account({ id: 'card', type: 'credit', credit: credit({ autopay: 'off' }) }),
    ])
    await db.recurring.add(
      rule({
        name: 'Netflix',
        amount: 1599,
        currency: 'USD',
        fxMode: 'confirm',
        template: { kind: 'expense', accountId: 'card', note: '' },
        startDate: '2026-03-01',
      }),
    )
    const res = await runScheduler({ db, today: '2026-03-01', getRate: usdRate })
    expect(res).toEqual({ created: 1, pending: 1 })
    const tx = (await db.transactions.toArray())[0]
    expect(tx.amount).toBe(519) // 15.99 × 32 × 1.015 = 519.35
    expect(tx.original).toMatchObject({ currency: 'USD', amount: 1599, rate: 32, feeRate: 0.015 })
    expect(tx.status).toBe('pending')
  })

  it('抓不到匯率時轉為待確認', async () => {
    const db = freshDb()
    await db.accounts.add(account({ id: 'bank' }))
    await db.recurring.add(rule({ currency: 'JPY', amount: 980, startDate: '2026-03-01' }))
    await runScheduler({ db, today: '2026-03-01', getRate: async () => null })
    const tx = (await db.transactions.toArray())[0]
    expect(tx).toMatchObject({ status: 'pending', amount: 0 })
  })

  it('信用卡繳款日自動從銀行扣款（含退款與提前繳）', async () => {
    const db = freshDb()
    await db.accounts.bulkAdd([
      account({ id: 'bank', initialBalance: 50000 }),
      account({ id: 'card', type: 'credit', credit: credit({ autopaySince: '2026-03-01' }) }),
    ])
    const base = { bookId: 'b', note: '', tags: [], status: 'confirmed' as const, createdAt: 0, updatedAt: 0 }
    await db.transactions.bulkAdd([
      { ...base, id: 't1', kind: 'expense', date: '2026-02-10', amount: 3000, accountId: 'card' },
      { ...base, id: 't2', kind: 'income', date: '2026-02-12', amount: 200, accountId: 'card' },
      { ...base, id: 't3', kind: 'transfer', date: '2026-03-08', amount: 800, accountId: 'bank', toAccountId: 'card' },
      { ...base, id: 't4', kind: 'expense', date: '2026-03-09', amount: 999, accountId: 'card' },
    ])
    await runScheduler({ db, today: '2026-03-25' })
    const auto = await db.transactions.where('autoKey').equals('a:card:2026-03-05').first()
    expect(auto).toMatchObject({ date: '2026-03-20', accountId: 'bank', toAccountId: 'card', amount: 2000 })
    // 再跑不會重複；autopaySince 之前的繳款日不補
    await runScheduler({ db, today: '2026-03-25' })
    expect(await db.transactions.where('kind').equals('transfer').count()).toBe(2)
  })

  it('autopayConfirm 產生待確認扣款', async () => {
    const db = freshDb()
    await db.accounts.bulkAdd([
      account({ id: 'bank' }),
      account({ id: 'card', type: 'credit', credit: credit({ autopayConfirm: true, autopaySince: '2026-03-01' }) }),
    ])
    await db.transactions.add({
      id: 't1', bookId: 'b', kind: 'expense', date: '2026-02-10', amount: 500, accountId: 'card',
      note: '', tags: [], status: 'confirmed', createdAt: 0, updatedAt: 0,
    })
    const res = await runScheduler({ db, today: '2026-03-20' })
    expect(res).toEqual({ created: 1, pending: 1 })
  })
})
