import { db, uid } from './schema'
import { makeTx } from './factory'
import type { Account, Book, Budget, Category, Recurring, Transaction } from './types'

const stamp = <T extends { updatedAt: number }>(o: T): T => ({ ...o, updatedAt: Date.now() })

// ---- 交易
export async function saveTx(tx: Partial<Transaction> & Pick<Transaction, 'bookId' | 'kind' | 'date' | 'amount' | 'accountId'>) {
  if (tx.id && (await db.transactions.get(tx.id))) {
    const next = stamp(tx as Transaction)
    if (next.autoKey == null) delete next.autoKey
    await db.transactions.put(next)
    return next.id
  }
  const created = makeTx(tx)
  await db.transactions.add(created)
  return created.id
}

export const deleteTx = (id: string) => db.transactions.delete(id)

/**
 * 確認待確認交易。輸入實際金額時：外幣交易反推實際匯率；
 * 同幣別轉帳（信用卡自動扣款）兩端金額一起更新。
 */
export async function confirmTx(
  id: string,
  actualAmount?: number,
  opts: { originalDecimals?: number; accountDecimals?: number; sameCurrency?: boolean } = {},
) {
  const tx = await db.transactions.get(id)
  if (!tx) return
  const patch: Partial<Transaction> = { status: 'confirmed', pendingReason: undefined, updatedAt: Date.now() }
  if (actualAmount !== undefined) {
    patch.amount = actualAmount
    if (tx.kind === 'transfer' && opts.sameCurrency) patch.toAmount = actualAmount
    if (tx.original?.amount && opts.originalDecimals !== undefined && opts.accountDecimals !== undefined) {
      const rate = actualAmount / 10 ** opts.accountDecimals / (tx.original.amount / 10 ** opts.originalDecimals)
      patch.original = { ...tx.original, rate, rateSource: '實際帳單', feeRate: 0 }
    }
  }
  await db.transactions.update(id, patch)
}

// ---- 帳本
export async function saveBook(b: Book) {
  await db.books.put(stamp(b))
}

export async function deleteBook(id: string) {
  await db.transaction('rw', [db.books, db.accounts, db.categories, db.transactions, db.recurring, db.budgets], async () => {
    await db.transactions.where('bookId').equals(id).delete()
    await db.accounts.where('bookId').equals(id).delete()
    await db.categories.where('bookId').equals(id).delete()
    await db.recurring.where('bookId').equals(id).delete()
    await db.budgets.where('bookId').equals(id).delete()
    await db.books.delete(id)
  })
}

// ---- 帳戶
export async function saveAccount(a: Account) {
  const prev = await db.accounts.get(a.id)
  const next = stamp(a)
  // 剛開啟自動扣款時記錄起始日，避免補出過去的扣款
  if (next.credit && next.credit.autopay !== 'off' && (!prev?.credit || prev.credit.autopay === 'off')) {
    next.credit = { ...next.credit, autopaySince: new Date().toLocaleDateString('sv') }
  }
  await db.accounts.put(next)
}

export async function accountTxCount(id: string) {
  return (await db.transactions.where('accountId').equals(id).count()) + (await db.transactions.where('toAccountId').equals(id).count())
}

export async function deleteAccount(id: string) {
  if (await accountTxCount(id)) {
    await db.accounts.update(id, { archived: true, updatedAt: Date.now() })
    return 'archived' as const
  }
  await db.accounts.delete(id)
  return 'deleted' as const
}

// ---- 分類
export async function saveCategory(c: Category) {
  await db.categories.put(stamp(c))
}

export async function deleteCategory(id: string) {
  const used = await db.transactions.where('categoryId').equals(id).count()
  const children = await db.categories.where('parentId').equals(id).toArray()
  if (used || children.length) {
    await db.categories.update(id, { hidden: true, updatedAt: Date.now() })
    return 'hidden' as const
  }
  await db.categories.delete(id)
  return 'deleted' as const
}

/**
 * 換到另一個大類底下（parentId），或變成大類（undefined）。
 * 只有兩層，所以還有子分類的大類不能變成子分類。
 */
export async function moveCategory(id: string, parentId?: string) {
  return db.transaction('rw', db.categories, async () => {
    const c = await db.categories.get(id)
    if (!c) return 'missing' as const
    if (c.parentId === parentId) return 'ok' as const
    const { parentId: _old, ...rest } = c
    if (parentId) {
      const p = await db.categories.get(parentId)
      if (!p || p.id === id || p.parentId || p.kind !== c.kind) return 'invalid' as const
      if (await db.categories.where('parentId').equals(id).count()) return 'has-children' as const
      const n = await db.categories.where('parentId').equals(parentId).count()
      await db.categories.put(stamp({ ...rest, parentId, color: p.color, sortOrder: n }))
    } else {
      const n = await db.categories.where('bookId').equals(c.bookId).filter((x) => x.kind === c.kind && !x.parentId).count()
      await db.categories.put(stamp({ ...rest, sortOrder: n }))
    }
    return 'ok' as const
  })
}

export async function reorder<T extends { id: string; sortOrder: number }>(table: 'categories' | 'accounts', items: T[]) {
  const now = Date.now()
  await db.transaction('rw', db.table(table), async () => {
    for (const [i, it] of items.entries()) await db.table(table).update(it.id, { sortOrder: i, updatedAt: now })
  })
}

// ---- 週期
export async function saveRecurring(r: Recurring) {
  await db.recurring.put(stamp(r))
}

export async function deleteRecurring(id: string) {
  await db.recurring.delete(id)
}

// ---- 預算
export async function saveBudget(b: Omit<Budget, 'id' | 'updatedAt'> & { id?: string }) {
  await db.budgets.put({ ...b, id: b.id ?? uid(), updatedAt: Date.now() })
}

export const deleteBudget = (id: string) => db.budgets.delete(id)
