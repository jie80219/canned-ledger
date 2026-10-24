import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { LedgerDB } from '../src/db/schema'
import { makeTx } from '../src/db/factory'
import type { Goal, Transaction } from '../src/db/types'
import { checkProgress, loadProgress, setPet } from '../src/db/progress'
import { exportBackup, importBackup } from '../src/io/backup'
import { budgetMonths, computeXp, currentStreak, levelOf, moodOf, perDay, recordDays, stageOf, streakRuns } from '../src/domain/pet'
import { ACHIEVEMENTS, unlock } from '../src/domain/achievements'
import { account, freshDb } from './helpers'

const tx = (date: string, amount = 100, p: Partial<Transaction> = {}) =>
  makeTx({ bookId: 'b', kind: 'expense', date, amount, accountId: 'bank', ...p } as never)

const goal = (p: Partial<Goal> = {}): Goal => ({
  id: 'g', bookId: 'b', name: '旅行', target: 1000, accountId: 'bank', style: 'jar', baseline: 0, createdAt: 0, updatedAt: 0, ...p,
})

describe('連續記帳', () => {
  const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-06']
  it('只算手動記的帳，自動產生的不算', () => {
    expect(recordDays([tx('2026-01-01'), tx('2026-01-02', 1, { autoKey: 'x' }), tx('2026-01-01')], '2026-01-31')).toEqual(['2026-01-01'])
  })
  it('分段與目前連續天數，昨天有記也算還沒斷', () => {
    expect(streakRuns(days)).toEqual([3, 2])
    expect(currentStreak(days, '2026-01-06')).toBe(2)
    expect(currentStreak(days, '2026-01-07')).toBe(2)
    expect(currentStreak(days, '2026-01-08')).toBe(0)
  })
})

describe('經驗值與等級', () => {
  it('天數、連續獎勵、預算、目標進度加總', () => {
    const days = Array.from({ length: 7 }, (_, i) => `2026-01-0${i + 1}`)
    const xp = computeXp(days, [{ bookId: 'b', end: '2026-01-31', met: true }], [0.55, 2])
    expect(xp.total).toBe(70 + 50 + 100 + 150 + 300)
  })
  it('升級門檻逐級增加', () => {
    expect(levelOf(0)).toEqual({ level: 1, into: 0, need: 50 })
    expect(levelOf(50)).toEqual({ level: 2, into: 0, need: 60 })
    expect(levelOf(115)).toEqual({ level: 3, into: 5, need: 70 })
    expect([1, 5, 15, 30].map(stageOf)).toEqual([0, 1, 2, 3])
  })
})

describe('心情', () => {
  it('依預算花費速度', () => {
    expect(moodOf({ used: 0.4, elapsed: 0.5 })).toBe('happy')
    expect(moodOf({ used: 0.5, elapsed: 0.5 })).toBe('normal')
    expect(moodOf({ used: 0.6, elapsed: 0.5 })).toBe('worried')
    expect(moodOf({ used: 0.9, elapsed: 0.5 })).toBe('sad')
    expect(moodOf({ used: 1.01, elapsed: 1 })).toBe('sad')
  })
  it('沒設預算時看多久沒記帳', () => {
    expect(moodOf({ elapsed: 0.5, lastDay: '2026-01-10', ref: '2026-01-11' })).toBe('happy')
    expect(moodOf({ elapsed: 0.5, lastDay: '2026-01-05', ref: '2026-01-11' })).toBe('worried')
  })
})

describe('預算達標月份', () => {
  it('只看已結束的週期', () => {
    const books = [{ id: 'b', budgetStartDay: 1 }] as never
    const budgets = [{ id: 'x', bookId: 'b', amount: 500 }] as never
    const m = budgetMonths([tx('2026-01-10', 400), tx('2026-02-10', 600), tx('2026-03-01', 9999)], books, budgets, '2026-03-15')
    expect(m.map((x) => [x.end, x.met])).toEqual([['2026-01-31', true], ['2026-02-28', false]])
  })
})

describe('存錢目標', () => {
  it('每天要存多少，無條件進位', () => {
    expect(perDay(goal({ deadline: '2026-01-03' }), 0, '2026-01-01')).toBe(334)
    expect(perDay(goal(), 0)).toBeUndefined()
    expect(perDay(goal({ deadline: '2026-01-03' }), 1000, '2026-01-01')).toBeUndefined()
  })
  it('達成時標記日期並解鎖成就，第二次不重複', async () => {
    const d = freshDb()
    await d.accounts.put(account({ id: 'bank', initialBalance: 300 }))
    await d.goals.put(goal({ baseline: 300 }))
    await d.transactions.put(makeTx({ bookId: 'b', kind: 'income', date: '2026-01-02', amount: 1200, accountId: 'bank' } as never))
    const p = await loadProgress(d, '2026-01-02')
    expect(p.goals[0].saved).toBe(1200)
    const r = await checkProgress(d, '2026-01-02')
    expect(r.goals.map((g) => g.id)).toEqual(['g'])
    expect(r.achievements.map((a) => a.id)).toEqual(expect.arrayContaining(['first-tx', 'goal-create', 'goal-done']))
    expect((await d.goals.get('g'))?.achievedAt).toBe('2026-01-02')
    expect(await checkProgress(d, '2026-01-03')).toEqual({ achievements: [], goals: [] })
  })
})

describe('成就', () => {
  it('已解鎖的不會收回', () => {
    const f = Object.fromEntries(Object.keys({ txCount: 0 }).map((k) => [k, 0])) as never
    const { all, fresh } = unlock(f, { 'tx-100': '2026-01-01' }, '2026-02-01')
    expect(fresh).toEqual([])
    expect(all).toEqual({ 'tx-100': '2026-01-01' })
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })
})

describe('資料庫升級', () => {
  it('v2 升到 v3 保留原有資料', async () => {
    const name = `upgrade-${Math.random()}`
    const old = new Dexie(name)
    old.version(1).stores({ books: 'id, sortOrder', accounts: 'id, bookId, type, sortOrder', categories: 'id, bookId, kind, parentId, sortOrder', transactions: 'id, bookId, date, accountId, toAccountId, categoryId, kind, [bookId+date], recurringId, status, &autoKey', recurring: 'id, bookId', budgets: 'id, bookId, categoryId', fxRates: '[base+quote+date], date', meta: 'key' })
    old.version(2).stores({ assets: 'id' })
    await old.open()
    await old.table('accounts').put(account({ id: 'bank', initialBalance: 500 }))
    await old.table('transactions').put(tx('2026-01-01'))
    old.close()

    const d = new LedgerDB(name)
    expect(await d.accounts.count()).toBe(1)
    expect(await d.transactions.count()).toBe(1)
    expect(await d.goals.count()).toBe(0)
    await d.delete()
  })

  it('沒有 goals 的舊備份可以還原，新備份會帶上 goals 與寵物', async () => {
    const d = freshDb()
    await d.accounts.put(account({ id: 'bank' }))
    await d.goals.put(goal())
    await setPet({ species: 'rabbit', name: '小白' }, d)
    const b = await exportBackup(d)
    expect(b.tables.goals).toHaveLength(1)

    const e = freshDb()
    const { goals: _, ...oldTables } = b.tables
    await importBackup({ ...b, tables: oldTables }, 'overwrite', e)
    expect(await e.accounts.count()).toBe(1)
    expect(await e.goals.count()).toBe(0)
    await importBackup(b, 'merge', e)
    expect(await e.goals.count()).toBe(1)
  })
})
