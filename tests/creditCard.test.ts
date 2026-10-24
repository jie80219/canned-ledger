import { describe, expect, it } from 'vitest'
import { cardSummary, computeDue, cycleContaining, cycleEndingIn, cyclesDueIn } from '../src/domain/creditCard'
import { makeTx } from '../src/db/factory'
import { credit } from './helpers'

const spend = (date: string, amount: number) =>
  makeTx({ bookId: 'b', kind: 'expense', date, amount, accountId: 'card' })
const refund = (date: string, amount: number) =>
  makeTx({ bookId: 'b', kind: 'income', date, amount, accountId: 'card' })
const pay = (date: string, amount: number) =>
  makeTx({ bookId: 'b', kind: 'transfer', date, amount, accountId: 'bank', toAccountId: 'card' })

describe('帳單週期', () => {
  it('結帳 5 號、當月 20 號繳', () => {
    expect(cycleEndingIn(credit(), 2026, 3)).toEqual({ start: '2026-02-06', end: '2026-03-05', due: '2026-03-20' })
  })
  it('結帳 31 號遇 2 月、次月繳', () => {
    const c = credit({ statementDay: 31, dueDay: 15, dueMonthOffset: 1 })
    expect(cycleEndingIn(c, 2026, 2)).toEqual({ start: '2026-02-01', end: '2026-02-28', due: '2026-03-15' })
    expect(cycleEndingIn(c, 2026, 3)).toEqual({ start: '2026-03-01', end: '2026-03-31', due: '2026-04-15' })
  })
  it('跨年', () => {
    const c = credit({ statementDay: 25, dueDay: 10, dueMonthOffset: 1 })
    expect(cycleEndingIn(c, 2026, 12)).toEqual({ start: '2026-11-26', end: '2026-12-25', due: '2027-01-10' })
    expect(cycleContaining(c, '2026-12-28').end).toBe('2027-01-25')
  })
  it('繳款日早於結帳日時自動移到次月', () => {
    const c = credit({ statementDay: 20, dueDay: 5, dueMonthOffset: 0 })
    expect(cycleEndingIn(c, 2026, 3).due).toBe('2026-04-05')
  })
  it('列出區間內的繳款日', () => {
    const due = cyclesDueIn(credit(), '2026-01-01', '2026-04-01').map((c) => c.due)
    expect(due).toEqual(['2026-01-20', '2026-02-20', '2026-03-20'])
  })
})

describe('本期應繳', () => {
  const c = credit()
  const cyc = cycleEndingIn(c, 2026, 3) // 02-06 ~ 03-05，03-20 繳

  it('消費 − 退款', () => {
    const txs = [spend('2026-02-10', 3000), refund('2026-02-15', 500), spend('2026-03-06', 999)]
    expect(computeDue('card', 0, c, txs, cyc)).toMatchObject({ statement: 2500, due: 2500 })
  })
  it('期間內提前繳、結帳後部分繳', () => {
    const txs = [spend('2026-02-10', 3000), pay('2026-02-20', 1000), pay('2026-03-10', 500)]
    expect(computeDue('card', 0, c, txs, cyc)).toMatchObject({ statement: 2000, paidAfter: 500, due: 1500 })
  })
  it('上期未繳會結轉', () => {
    const txs = [spend('2026-01-10', 1000), spend('2026-02-10', 2000)]
    expect(computeDue('card', 0, c, txs, cyc).due).toBe(3000)
  })
  it('最低應繳', () => {
    const txs = [spend('2026-02-10', 3333)]
    expect(computeDue('card', 0, c, txs, cyc).minimum).toBe(334)
  })
})

describe('卡片摘要', () => {
  it('已出帳未繳 / 未出帳 / 可用額度', () => {
    const c = credit({ creditLimit: 10000 })
    const txs = [spend('2026-02-10', 3000), spend('2026-03-08', 1200)]
    const s = cardSummary('card', 0, c, txs, '2026-03-12')
    expect(s).toMatchObject({ debt: 4200, billedUnpaid: 3000, unbilled: 1200, available: 5800, nextDue: '2026-03-20' })
  })
})

describe('期初餘額視為未出帳', () => {
  // 結帳日 7 號、繳款日 22 號，10/25 設定：額度 20000、未出帳 10024
  const c = credit({ statementDay: 7, dueDay: 22, creditLimit: 20000, openingDate: '2026-10-25' })
  it('設定當下全部算未出帳，可用 = 額度 − 未出帳', () => {
    const s = cardSummary('card', -10024, c, [], '2026-10-25')
    expect([s.billedUnpaid, s.unbilled, s.available]).toEqual([0, 10024, 9976])
  })
  it('下次結帳後才變成待繳', () => {
    const s = cardSummary('card', -10024, c, [spend('2026-11-03', 500)], '2026-11-10')
    expect([s.billedUnpaid, s.unbilled]).toEqual([10524, 0])
    expect(computeDue('card', -10024, c, [], cycleContaining(c, '2026-10-01')).due).toBe(0)
  })
})
