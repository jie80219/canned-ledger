import { LedgerDB } from '../src/db/schema'
import type { Account, CreditSettings } from '../src/db/types'

let n = 0
export function freshDb() {
  return new LedgerDB(`test-${++n}-${Math.random()}`)
}

export function account(p: Partial<Account> & { id: string }): Account {
  return {
    bookId: 'b',
    name: p.id,
    type: 'bank',
    currency: 'TWD',
    initialBalance: 0,
    icon: '🏦',
    color: '#888',
    includeInNetWorth: true,
    sortOrder: 0,
    updatedAt: 0,
    ...p,
  }
}

export function credit(p: Partial<CreditSettings> = {}): CreditSettings {
  return {
    statementDay: 5,
    dueDay: 20,
    dueMonthOffset: 0,
    creditLimit: 100000,
    payFromAccountId: 'bank',
    autopay: 'full',
    minimumRate: 0.1,
    autopayConfirm: false,
    foreignFeeRate: 0.015,
    ...p,
  }
}
