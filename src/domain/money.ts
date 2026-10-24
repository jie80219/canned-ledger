// 金額一律以「最小單位整數」儲存：TWD 存元、USD 存 cent

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimals: number
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', decimals: 0 },
  { code: 'USD', name: '美元', symbol: 'US$', decimals: 2 },
  { code: 'JPY', name: '日圓', symbol: '¥', decimals: 0 },
  { code: 'EUR', name: '歐元', symbol: '€', decimals: 2 },
  { code: 'GBP', name: '英鎊', symbol: '£', decimals: 2 },
  { code: 'CNY', name: '人民幣', symbol: 'CN¥', decimals: 2 },
  { code: 'HKD', name: '港幣', symbol: 'HK$', decimals: 2 },
  { code: 'KRW', name: '韓元', symbol: '₩', decimals: 0 },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$', decimals: 2 },
  { code: 'THB', name: '泰銖', symbol: '฿', decimals: 2 },
  { code: 'AUD', name: '澳幣', symbol: 'A$', decimals: 2 },
  { code: 'CAD', name: '加幣', symbol: 'C$', decimals: 2 },
  { code: 'VND', name: '越南盾', symbol: '₫', decimals: 0 },
  { code: 'MYR', name: '馬來幣', symbol: 'RM', decimals: 2 },
]

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]))

export function currency(code: string): CurrencyInfo {
  return BY_CODE.get(code) ?? { code, name: code, symbol: code + ' ', decimals: 2 }
}

export function toMinor(major: number, code: string): number {
  return Math.round(major * 10 ** currency(code).decimals)
}

export function toMajor(minor: number, code: string): number {
  return minor / 10 ** currency(code).decimals
}

/** 換匯：rate 為 1 單位 from 可換多少 to；feeRate 例如海外手續費 0.015 */
export function convert(minor: number, from: string, to: string, rate: number, feeRate = 0): number {
  if (from === to) return minor
  return toMinor(toMajor(minor, from) * rate * (1 + feeRate), to)
}

export function formatMoney(minor: number, code: string, opts: { sign?: boolean; symbol?: boolean } = {}): string {
  const c = currency(code)
  const abs = Math.abs(toMajor(minor, code)).toLocaleString('zh-TW', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  })
  const sign = minor < 0 ? '-' : opts.sign && minor > 0 ? '+' : ''
  return `${sign}${opts.symbol === false ? '' : c.symbol}${abs}`
}
