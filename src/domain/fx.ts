import Dexie from 'dexie'
import { db as defaultDb, type LedgerDB } from '../db/schema'
import { CURRENCIES } from './money'
import { today as todayStr, type DateStr } from './dates'

export interface RateResult {
  rate: number // 1 base = rate quote
  date: DateStr
  source: string
  stale?: boolean // 離線時用的舊匯率
}

export type FetchJson = (url: string) => Promise<any>

const defaultFetch: FetchJson = async (url) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

interface Source {
  name: string
  url: (base: string, tag: string) => string
  parse: (json: any, base: string) => Record<string, number> | null
}

// 皆不需金鑰、支援 CORS、含 TWD
const fawaz = (json: any, base: string) => {
  const table = json?.[base.toLowerCase()]
  if (!table) return null
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(table)) out[k.toUpperCase()] = v as number
  return out
}
const SOURCES: Source[] = [
  {
    name: 'currency-api (jsDelivr)',
    url: (b, tag) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/${b.toLowerCase()}.min.json`,
    parse: fawaz,
  },
  {
    name: 'currency-api (Cloudflare)',
    url: (b, tag) => `https://${tag}.currency-api.pages.dev/v1/currencies/${b.toLowerCase()}.min.json`,
    parse: fawaz,
  },
  {
    name: 'open.er-api.com',
    url: (b) => `https://open.er-api.com/v6/latest/${b}`,
    parse: (json) => (json?.result === 'success' ? json.rates : null),
  },
]

export interface FxOptions {
  db?: LedgerDB
  fetchJson?: FetchJson
  today?: DateStr
}

const inflight = new Map<string, Promise<RateResult | null>>()

export function getRate(base: string, quote: string, date: DateStr, opts: FxOptions = {}): Promise<RateResult | null> {
  if (base === quote) return Promise.resolve({ rate: 1, date, source: 'same' })
  const key = `${base}|${quote}|${date}`
  let p = inflight.get(key)
  if (!p) {
    p = fetchRate(base, quote, date, opts).finally(() => inflight.delete(key))
    inflight.set(key, p)
  }
  return p
}

async function fetchRate(base: string, quote: string, date: DateStr, opts: FxOptions): Promise<RateResult | null> {
  const d = opts.db ?? defaultDb
  const fetchJson = opts.fetchJson ?? defaultFetch
  const now = opts.today ?? todayStr()
  const cached = await d.fxRates.get([base, quote, date])
  if (cached) return { rate: cached.rate, date: cached.date, source: cached.source }

  const isPast = date < now
  for (const src of SOURCES) {
    // open.er-api 只有最新匯率，只用在今天
    if (isPast && src.name === 'open.er-api.com') continue
    try {
      const json = await fetchJson(src.url(base, isPast ? date : 'latest'))
      const table = src.parse(json, base)
      const rate = table?.[quote]
      if (!table || !rate) continue
      const wanted = new Set(CURRENCIES.map((c) => c.code))
      const rows = Object.entries(table)
        .filter(([q, r]) => wanted.has(q) && q !== base && r > 0)
        .map(([q, r]) => ({ base, quote: q, date, rate: r, source: src.name, fetchedAt: Date.now() }))
      await d.fxRates.bulkPut(rows)
      return { rate, date, source: src.name }
    } catch {
      // 換下一個來源
    }
  }
  return nearestCached(d, base, quote, date)
}

/** 抓不到時用最接近的快取（優先找該日之前，其次找之後，再試反向匯率） */
async function nearestCached(d: LedgerDB, base: string, quote: string, date: DateStr): Promise<RateResult | null> {
  const before = await d.fxRates
    .where('[base+quote+date]')
    .between([base, quote, Dexie.minKey], [base, quote, date], true, true)
    .last()
  const row =
    before ??
    (await d.fxRates.where('[base+quote+date]').between([base, quote, date], [base, quote, Dexie.maxKey]).first())
  if (row) return { rate: row.rate, date: row.date, source: row.source, stale: true }
  const inv = await d.fxRates
    .where('[base+quote+date]')
    .between([quote, base, Dexie.minKey], [quote, base, Dexie.maxKey])
    .last()
  if (inv) return { rate: 1 / inv.rate, date: inv.date, source: inv.source, stale: true }
  return null
}

/** 統計用：把多個幣別換算到 quote 的匯率表（抓不到的幣別視為 1 並回報） */
export async function rateTable(
  codes: string[],
  quote: string,
  opts: FxOptions = {},
): Promise<{ rates: Map<string, number>; missing: string[] }> {
  const date = opts.today ?? todayStr()
  const rates = new Map<string, number>([[quote, 1]])
  const missing: string[] = []
  await Promise.all(
    [...new Set(codes)]
      .filter((c) => c !== quote)
      .map(async (c) => {
        const r = await getRate(c, quote, date, opts)
        if (r) rates.set(c, r.rate)
        else missing.push(c)
      }),
  )
  return { rates, missing }
}
