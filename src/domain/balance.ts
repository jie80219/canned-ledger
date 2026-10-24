import type { CreditSettings, Transaction } from '../db/types'
import type { DateStr } from './dates'

/** 一筆交易對各帳戶餘額的影響（帳戶幣別最小單位） */
export function effects(tx: Transaction): Array<[string, number]> {
  switch (tx.kind) {
    case 'expense':
      return [[tx.accountId, -tx.amount]]
    case 'income':
    case 'adjust':
      return [[tx.accountId, tx.amount]]
    case 'transfer':
      return tx.toAccountId
        ? [
            [tx.accountId, -tx.amount],
            [tx.toAccountId, tx.toAmount ?? tx.amount],
          ]
        : [[tx.accountId, -tx.amount]]
  }
}

/** 信用卡設了期初之後，之前記的交易已經包含在期初金額裡 */
export function afterOpening(c: CreditSettings | undefined, tx: Transaction): boolean {
  if (!c?.openingDate || tx.date > c.openingDate) return true
  if (tx.date < c.openingDate) return false
  return c.openingAt === undefined || tx.createdAt > c.openingAt
}

export function balances(
  accounts: Array<{ id: string; initialBalance: number; credit?: CreditSettings }>,
  txs: Transaction[],
  asOf?: DateStr,
): Map<string, number> {
  const map = new Map(accounts.map((a) => [a.id, a.initialBalance]))
  const credit = new Map(accounts.map((a) => [a.id, a.credit]))
  for (const tx of txs) {
    if (asOf && tx.date > asOf) continue
    for (const [id, delta] of effects(tx)) {
      if (map.has(id) && afterOpening(credit.get(id), tx)) map.set(id, map.get(id)! + delta)
    }
  }
  return map
}

export function balanceOf(accountId: string, initial: number, txs: Transaction[], asOf?: DateStr): number {
  let sum = initial
  for (const tx of txs) {
    if (asOf && tx.date > asOf) continue
    for (const [id, delta] of effects(tx)) if (id === accountId) sum += delta
  }
  return sum
}
