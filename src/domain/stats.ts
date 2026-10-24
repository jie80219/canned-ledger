import type { Account, Category, Transaction } from '../db/types'
import { addDays, parse, type DateStr } from './dates'

export interface Converter {
  /** 把帳戶幣別金額換算為帳本幣別最小單位 */
  (tx: Transaction): number
}

export function makeConverter(
  accounts: Account[],
  bookCurrency: string,
  rates: Map<string, number>,
  decimalsOf: (code: string) => number,
): Converter {
  const cur = new Map(accounts.map((a) => [a.id, a.currency]))
  return (tx) => {
    const c = cur.get(tx.accountId) ?? bookCurrency
    if (c === bookCurrency) return tx.amount
    const major = tx.amount / 10 ** decimalsOf(c)
    return Math.round(major * (rates.get(c) ?? 1) * 10 ** decimalsOf(bookCurrency))
  }
}

export function inRange(tx: Transaction, start: DateStr, end: DateStr) {
  return tx.date >= start && tx.date <= end
}

export function totals(txs: Transaction[], conv: Converter) {
  let expense = 0
  let income = 0
  for (const t of txs) {
    if (t.kind === 'expense') expense += conv(t)
    else if (t.kind === 'income') income += conv(t)
  }
  return { expense, income, net: income - expense }
}

export interface CatSlice {
  category: Category | undefined
  id: string
  amount: number
  count: number
}

/** 依分類彙總；parentOnly 時子分類併入大類 */
export function byCategory(
  txs: Transaction[],
  kind: 'expense' | 'income',
  categories: Category[],
  conv: Converter,
  opts: { parentOnly?: boolean; parentId?: string } = {},
): CatSlice[] {
  const cats = new Map(categories.map((c) => [c.id, c]))
  const map = new Map<string, CatSlice>()
  for (const t of txs) {
    if (t.kind !== kind) continue
    let c = t.categoryId ? cats.get(t.categoryId) : undefined
    if (opts.parentId !== undefined) {
      const top = c?.parentId ?? c?.id
      if (top !== opts.parentId) continue
    } else if (opts.parentOnly && c?.parentId) c = cats.get(c.parentId)
    const id = c?.id ?? 'none'
    const s = map.get(id) ?? { category: c, id, amount: 0, count: 0 }
    s.amount += conv(t)
    s.count++
    map.set(id, s)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

export interface TrendBucket {
  key: string
  label: string
  expense: number
  income: number
}

/** 週/月看每日、年看每月 */
export function trend(txs: Transaction[], start: DateStr, end: DateStr, unit: 'day' | 'month', conv: Converter): TrendBucket[] {
  const buckets = new Map<string, TrendBucket>()
  if (unit === 'day') {
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const { m, d: dd } = parse(d)
      buckets.set(d, { key: d, label: `${m}/${dd}`, expense: 0, income: 0 })
    }
  } else {
    const s = parse(start)
    const e = parse(end)
    for (let y = s.y, m = s.m; y * 12 + m <= e.y * 12 + e.m; m === 12 ? (y++, (m = 1)) : m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      buckets.set(key, { key, label: `${m}月`, expense: 0, income: 0 })
    }
  }
  for (const t of txs) {
    if (t.kind !== 'expense' && t.kind !== 'income') continue
    const b = buckets.get(unit === 'day' ? t.date : t.date.slice(0, 7))
    if (b) b[t.kind] += conv(t)
  }
  return [...buckets.values()]
}
