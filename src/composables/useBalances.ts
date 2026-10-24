import { computed } from 'vue'
import { db } from '../db/schema'
import type { Transaction } from '../db/types'
import { balances } from '../domain/balance'
import { useUi } from '../stores/ui'
import { useBook } from './useBook'
import { useLive } from './useLive'

/** 目前帳本所有交易與帳戶餘額（截至今天以前含今天，與未來預記的交易分開） */
export function useBalances() {
  const ui = useUi()
  const book = useBook()
  const allTxs = useLive<Transaction[]>(() => db.transactions.where('bookId').equals(ui.bookId).toArray(), [], [book.bookId])
  const balanceMap = computed(() => balances(book.accounts.value, allTxs.value))
  return { ...book, allTxs, balanceMap }
}
