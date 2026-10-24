import type { Transaction } from '../db/types'
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

export function balances(
  accounts: Array<{ id: string; initialBalance: number }>,
  txs: Transaction[],
  asOf?: DateStr,
): Map<string, number> {
  const map = new Map(accounts.map((a) => [a.id, a.initialBalance]))
  for (const tx of txs) {
    if (asOf && tx.date > asOf) continue
    for (const [id, delta] of effects(tx)) {
      if (map.has(id)) map.set(id, map.get(id)! + delta)
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
