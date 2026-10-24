import { uid } from './schema'
import type { Transaction } from './types'

type TxInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'tags' | 'note' | 'status'> &
  Partial<Pick<Transaction, 'id' | 'tags' | 'note' | 'status'>>

export function makeTx(input: TxInput): Transaction {
  const now = Date.now()
  const tx: Transaction = { id: uid(), tags: [], note: '', status: 'confirmed', ...input, createdAt: now, updatedAt: now }
  // unique index 會略過 undefined，但不會略過 null
  if (tx.autoKey == null) delete tx.autoKey
  return tx
}

/** 去掉 Vue reactive proxy，IndexedDB 的 structured clone 無法複製 Proxy */
export const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v))
