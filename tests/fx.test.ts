import { describe, expect, it } from 'vitest'
import { getRate } from '../src/domain/fx'
import { freshDb } from './helpers'

describe('匯率', () => {
  it('抓取後快取，第二次不再連網', async () => {
    const db = freshDb()
    let calls = 0
    const fetchJson = async (url: string) => {
      calls++
      expect(url).toContain('@2026-03-01')
      return { date: '2026-03-01', usd: { twd: 32.1, jpy: 150 } }
    }
    const r = await getRate('USD', 'TWD', '2026-03-01', { db, fetchJson, today: '2026-03-05' })
    expect(r).toMatchObject({ rate: 32.1 })
    await getRate('USD', 'JPY', '2026-03-01', { db, fetchJson, today: '2026-03-05' })
    expect(calls).toBe(1)
  })
  it('離線時用最近的快取並標記 stale', async () => {
    const db = freshDb()
    await db.fxRates.put({ base: 'USD', quote: 'TWD', date: '2026-02-01', rate: 31.5, source: 's', fetchedAt: 0 })
    const fetchJson = async () => {
      throw new Error('offline')
    }
    const r = await getRate('USD', 'TWD', '2026-03-01', { db, fetchJson, today: '2026-03-05' })
    expect(r).toMatchObject({ rate: 31.5, stale: true, date: '2026-02-01' })
    const inv = await getRate('TWD', 'USD', '2026-03-01', { db, fetchJson, today: '2026-03-05' })
    expect(inv!.rate).toBeCloseTo(1 / 31.5)
  })
})
