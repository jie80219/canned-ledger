import type { DateStr } from '../domain/dates'

export interface Book {
  id: string
  name: string
  currency: string
  icon: string
  color: string
  budgetStartDay: number // 預算起算日（例如每月 5 號發薪）
  sortOrder: number
  archived?: boolean
  updatedAt: number
}

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'asset' | 'liability'

export interface CreditSettings {
  statementDay: number // 結帳日 1-31
  dueDay: number // 繳款日 1-31
  dueMonthOffset: 0 | 1 // 繳款日在結帳日當月(0)或次月(1)
  creditLimit: number
  payFromAccountId?: string // 自動扣款的銀行帳戶
  autopay: 'full' | 'minimum' | 'off'
  minimumRate: number // 最低應繳比例
  autopayConfirm: boolean // 先產生待確認，再由使用者確認
  autopaySince?: DateStr // 從這天之後的繳款日才自動產生，避免補出舊帳
  foreignFeeRate: number // 海外交易手續費
  display?: 'spent' | 'available' // 帳戶列表顯示已刷金額（預設）或可用額度
}

export interface Account {
  id: string
  bookId: string
  name: string
  type: AccountType
  currency: string
  initialBalance: number
  icon: string
  color: string
  includeInNetWorth: boolean
  sortOrder: number
  archived?: boolean
  credit?: CreditSettings
  updatedAt: number
}

export type CategoryKind = 'expense' | 'income'

export interface Category {
  id: string
  bookId: string
  kind: CategoryKind
  parentId?: string
  name: string
  icon: string
  color: string
  hidden?: boolean
  sortOrder: number
  updatedAt: number
}

export type TxKind = 'expense' | 'income' | 'transfer' | 'adjust'

export interface OriginalAmount {
  currency: string
  amount: number // 原幣最小單位
  rate: number // 1 原幣 = rate 帳戶幣
  rateDate: DateStr
  rateSource: string
  feeRate?: number
}

export interface Transaction {
  id: string
  bookId: string
  kind: TxKind
  date: DateStr
  time?: string
  amount: number // 帳戶幣別最小單位；adjust 為帶正負號
  accountId: string
  toAccountId?: string
  toAmount?: number // 轉入帳戶幣別金額（跨幣別轉帳）
  categoryId?: string
  note: string
  tags: string[]
  original?: OriginalAmount
  status: 'confirmed' | 'pending'
  pendingReason?: string
  recurringId?: string
  autopayOf?: { cardId: string; cycleEnd: DateStr }
  invoiceNo?: string
  /** 自動產生來源的唯一鍵（r:/a:/inv:），靠 unique index 防重複；一般交易不設定 */
  autoKey?: string
  createdAt: number
  updatedAt: number
}

export type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Recurring {
  id: string
  bookId: string
  name: string
  template: {
    kind: 'expense' | 'income' | 'transfer'
    accountId: string
    toAccountId?: string
    categoryId?: string
    note: string
  }
  amount: number // 以 currency 計的最小單位
  currency: string // 可為外幣，例如 USD 訂閱
  fxMode: 'auto' | 'confirm'
  freq: Freq
  interval: number
  startDate: DateStr
  endDate?: DateStr
  count?: number // 總期數上限
  generated: number // 已產生期數（下一期 = 第 generated 期）
  active: boolean
  updatedAt: number
}

export interface Budget {
  id: string
  bookId: string
  categoryId?: string // 未設定 = 總預算
  amount: number
  updatedAt: number
}

export interface FxRate {
  base: string
  quote: string
  date: DateStr
  rate: number
  source: string
  fetchedAt: number
}

/** 使用者上傳的圖示，128×128 WebP 的 data URL */
export interface Asset {
  id: string
  data: string
  updatedAt: number
}

export interface Meta {
  key: string
  value: unknown
}

export interface MerchantRule {
  keyword: string
  categoryId: string
}
