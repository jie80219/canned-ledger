import { getMeta, setMeta } from '../db/schema'
import type { MerchantRule } from '../db/types'
import { plain } from '../db/factory'

// 店家 → 分類規則依帳本存放（分類是帳本各自的）
const key = (bookId: string) => `rules:${bookId}`

export const getRules = (bookId: string) => getMeta<MerchantRule[]>(key(bookId), [])
export const setRules = (bookId: string, rules: MerchantRule[]) => setMeta(key(bookId), plain(rules))
