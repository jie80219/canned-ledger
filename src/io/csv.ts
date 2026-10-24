import type { Account, Category, Transaction } from '../db/types'
import { toMajor } from '../domain/money'

const KIND_LABEL: Record<Transaction['kind'], string> = {
  expense: '支出',
  income: '收入',
  transfer: '轉帳',
  adjust: '餘額調整',
}

function cell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function transactionsToCsv(txs: Transaction[], accounts: Account[], categories: Category[]): string {
  const acc = new Map(accounts.map((a) => [a.id, a]))
  const cat = new Map(categories.map((c) => [c.id, c]))
  const catName = (id?: string) => {
    const c = id ? cat.get(id) : undefined
    if (!c) return ['', '']
    const p = c.parentId ? cat.get(c.parentId) : undefined
    return p ? [p.name, c.name] : [c.name, '']
  }
  const header = ['日期', '類型', '分類', '子分類', '金額', '幣別', '帳戶', '轉入帳戶', '轉入金額', '原幣', '原幣金額', '匯率', '備註', '狀態']
  const lines = [header.join(',')]
  for (const t of [...txs].sort((a, b) => a.date.localeCompare(b.date))) {
    const a = acc.get(t.accountId)
    const to = t.toAccountId ? acc.get(t.toAccountId) : undefined
    const cur = a?.currency ?? ''
    const [c1, c2] = catName(t.categoryId)
    lines.push(
      [
        t.date,
        KIND_LABEL[t.kind],
        c1,
        c2,
        toMajor(t.amount, cur),
        cur,
        a?.name ?? '',
        to?.name ?? '',
        to ? toMajor(t.toAmount ?? t.amount, to.currency) : '',
        t.original?.currency ?? '',
        t.original ? toMajor(t.original.amount, t.original.currency) : '',
        t.original?.rate ?? '',
        t.note,
        t.status === 'pending' ? '待確認' : '',
      ]
        .map(cell)
        .join(','),
    )
  }
  // BOM 讓 Excel 正確辨識 UTF-8
  return '﻿' + lines.join('\r\n')
}
