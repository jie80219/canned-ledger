import type { Account, AccountType } from '../db/types'

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: '現金',
  bank: '銀行',
  ewallet: '電子支付',
  credit: '信用卡',
  asset: '其他資產',
  liability: '負債',
}
const ORDER = Object.keys(ACCOUNT_TYPE_LABEL)

/** 依帳戶類型分組排序，同類型維持原本順序 */
export const byType = (list: Account[]) => [...list].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
