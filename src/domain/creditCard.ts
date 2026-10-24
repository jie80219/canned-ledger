import type { CreditSettings, Transaction } from '../db/types'
import { addDays, clampDay, parse, shiftYM, type DateStr } from './dates'
import { afterOpening, balanceOf } from './balance'

export interface Cycle {
  start: DateStr
  end: DateStr // 結帳日
  due: DateStr // 繳款日
}

/** 結帳日落在 y 年 m 月的那一期 */
export function cycleEndingIn(c: CreditSettings, y: number, m: number): Cycle {
  const end = clampDay(y, m, c.statementDay)
  const prev = shiftYM(y, m, -1)
  const start = addDays(clampDay(prev.y, prev.m, c.statementDay), 1)
  const dm = shiftYM(y, m, c.dueMonthOffset)
  let due = clampDay(dm.y, dm.m, c.dueDay)
  if (due <= end) {
    const nm = shiftYM(dm.y, dm.m, 1)
    due = clampDay(nm.y, nm.m, c.dueDay)
  }
  return { start, end, due }
}

export function cycleContaining(c: CreditSettings, date: DateStr): Cycle {
  const { y, m } = parse(date)
  const cyc = cycleEndingIn(c, y, m)
  if (date > cyc.end) {
    const n = shiftYM(y, m, 1)
    return cycleEndingIn(c, n.y, n.m)
  }
  return cyc
}

export function previousCycle(c: CreditSettings, cyc: Cycle): Cycle {
  return cycleContaining(c, addDays(cyc.start, -1))
}

/** 繳款日落在 (fromExclusive, toInclusive] 的所有帳單週期，依日期排序 */
export function cyclesDueIn(c: CreditSettings, fromExclusive: DateStr, toInclusive: DateStr): Cycle[] {
  const out: Cycle[] = []
  const a = parse(fromExclusive)
  const b = parse(toInclusive)
  let cur = shiftYM(a.y, a.m, -2)
  while (cur.y * 12 + cur.m <= b.y * 12 + b.m) {
    const cyc = cycleEndingIn(c, cur.y, cur.m)
    if (cyc.due > fromExclusive && cyc.due <= toInclusive) out.push(cyc)
    cur = shiftYM(cur.y, cur.m, 1)
  }
  return out
}

/** 轉入卡片的繳款金額（以卡片幣別） */
function paymentInto(cardId: string, tx: Transaction): number {
  if (tx.kind === 'transfer' && tx.toAccountId === cardId) return tx.toAmount ?? tx.amount
  return 0
}

export interface DueInfo {
  statement: number // 結帳日當下欠款
  paidAfter: number // 結帳日後、繳款日前已繳
  due: number // 本期應繳
  minimum: number
}

/**
 * 本期應繳 = 結帳日當天的欠款 − 結帳日之後已繳的款項。
 * 用餘額計算，所以退款、期間內提前繳款、上期未繳結轉都會自然算進去。
 */
export function computeDue(
  cardId: string,
  initialBalance: number,
  c: CreditSettings,
  txs: Transaction[],
  cyc: Cycle,
): DueInfo {
  txs = txs.filter((t) => afterOpening(c, t))
  const opening = c.openingDate && cyc.end < c.openingDate ? 0 : initialBalance
  const statement = Math.max(0, -balanceOf(cardId, opening, txs, cyc.end))
  let paidAfter = 0
  for (const tx of txs) {
    if (tx.date <= cyc.end || tx.date > cyc.due) continue
    if (tx.autopayOf?.cardId === cardId && tx.autopayOf.cycleEnd === cyc.end) continue
    paidAfter += paymentInto(cardId, tx)
  }
  const due = Math.max(0, statement - paidAfter)
  const minimum = Math.min(due, Math.ceil(statement * c.minimumRate))
  return { statement, paidAfter, due, minimum }
}

export interface CardSummary {
  debt: number // 目前總欠款
  billedUnpaid: number // 已出帳未繳
  unbilled: number // 未出帳消費
  available: number // 可用額度
  current: Cycle
  lastClosed: Cycle
  nextDue: DateStr
}

export function cardSummary(
  cardId: string,
  initialBalance: number,
  c: CreditSettings,
  txs: Transaction[],
  today: DateStr,
): CardSummary {
  txs = txs.filter((t) => afterOpening(c, t))
  const current = cycleContaining(c, today)
  const lastClosed = previousCycle(c, current)
  const debt = Math.max(0, -balanceOf(cardId, initialBalance, txs, today))
  const info = computeDue(cardId, initialBalance, c, txs, lastClosed)
  // 繳款日已過的部分不再視為「已出帳未繳」，改由總欠款反映
  let paidSinceClose = 0
  for (const tx of txs) {
    if (tx.date > lastClosed.end && tx.date <= today) paidSinceClose += paymentInto(cardId, tx)
  }
  const billedUnpaid = Math.max(0, info.statement - paidSinceClose)
  const unbilled = Math.max(0, debt - billedUnpaid)
  const nextDue = billedUnpaid > 0 && lastClosed.due >= today ? lastClosed.due : current.due
  return { debt, billedUnpaid, unbilled, available: c.creditLimit - debt, current, lastClosed, nextDue }
}
