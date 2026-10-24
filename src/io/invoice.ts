// 財政部電子發票整合服務平台「載具歸戶消費明細」CSV
// 格式：M 行為發票表頭、D 行為品項明細；分隔符為 | （舊版或轉存過的檔案可能是逗號）
//   M|載具名稱|載具號碼|發票日期(yyyyMMdd)|商店統編|商店店名|發票號碼|總金額|發票狀態|
//   D|發票號碼|小計|品項名稱|

export interface InvoiceItem {
  name: string
  amount: number
}

export interface Invoice {
  invoiceNo: string
  date: string // YYYY-MM-DD
  sellerId: string
  sellerName: string
  total: number
  status: string
  items: InvoiceItem[]
}

function splitLine(line: string): string[] {
  const sep = line.includes('|') ? '|' : ','
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

function toDate(s: string): string | null {
  const m = s.replace(/[^\d]/g, '')
  if (m.length === 8) return `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)}`
  // 民國年 1130105
  if (m.length === 7) return `${Number(m.slice(0, 3)) + 1911}-${m.slice(3, 5)}-${m.slice(5, 7)}`
  return null
}

const num = (s: string) => Number(s.replace(/[^\d.-]/g, '')) || 0

export function parseInvoiceCsv(text: string): Invoice[] {
  const byNo = new Map<string, Invoice>()
  const orphanItems: Array<[string, InvoiceItem]> = []
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const f = splitLine(line)
    const tag = f[0].replace(/^"|"$/g, '')
    if (tag === 'M' && f.length >= 8) {
      const date = toDate(f[3])
      if (!date || !f[6]) continue
      byNo.set(f[6], {
        invoiceNo: f[6],
        date,
        sellerId: f[4],
        sellerName: f[5],
        total: num(f[7]),
        status: f[8] ?? '',
        items: byNo.get(f[6])?.items ?? [],
      })
    } else if (tag === 'D' && f.length >= 4) {
      const item = { name: f[3], amount: num(f[2]) }
      const inv = byNo.get(f[1])
      if (inv) inv.items.push(item)
      else orphanItems.push([f[1], item])
    }
  }
  for (const [no, item] of orphanItems) byNo.get(no)?.items.push(item)
  // 作廢發票不匯入
  return [...byNo.values()].filter((i) => !/作廢/.test(i.status)).sort((a, b) => a.date.localeCompare(b.date))
}

export function matchRule<T extends { keyword: string }>(rules: T[], text: string): T | undefined {
  return rules.find((r) => r.keyword && text.includes(r.keyword))
}
