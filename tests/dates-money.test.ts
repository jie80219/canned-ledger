import { describe, expect, it } from 'vitest'
import { addMonths, clampDay, startOfWeek } from '../src/domain/dates'
import { convert, formatMoney, toMinor } from '../src/domain/money'
import { occurrenceDate } from '../src/domain/recurrence'

describe('dates', () => {
  it('月底取最後一天', () => {
    expect(clampDay(2026, 2, 31)).toBe('2026-02-28')
    expect(clampDay(2028, 2, 31)).toBe('2028-02-29')
  })
  it('addMonths 以錨點日避免漂移', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-01-31', 2, 31)).toBe('2026-03-31')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
  })
  it('週一為一週開始', () => {
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19') // 週日
  })
})

describe('money', () => {
  it('小數位依幣別', () => {
    expect(toMinor(15.99, 'USD')).toBe(1599)
    expect(toMinor(390.4, 'TWD')).toBe(390)
  })
  it('換匯含手續費', () => {
    // 15.99 USD × 32.5 × 1.015 = 527.45 → 527
    expect(convert(1599, 'USD', 'TWD', 32.5, 0.015)).toBe(527)
    expect(convert(1000, 'TWD', 'TWD', 99)).toBe(1000)
  })
  it('格式化', () => {
    expect(formatMoney(-1234, 'TWD')).toBe('-NT$1,234')
    expect(formatMoney(1599, 'USD', { sign: true })).toBe('+US$15.99')
  })
})

describe('recurrence', () => {
  it('每月 31 號', () => {
    const r = { freq: 'monthly' as const, interval: 1, startDate: '2026-01-31' }
    expect([0, 1, 2, 3].map((k) => occurrenceDate(r, k))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ])
  })
  it('每 2 週、每年 2/29', () => {
    expect(occurrenceDate({ freq: 'weekly', interval: 2, startDate: '2026-01-01' }, 1)).toBe('2026-01-15')
    expect(occurrenceDate({ freq: 'yearly', interval: 1, startDate: '2028-02-29' }, 1)).toBe('2029-02-28')
  })
})

import { evaluate } from '../src/domain/calc'
describe('計算機', () => {
  it('先乘除後加減、尾端運算子忽略', () => {
    expect(evaluate('100+20×3')).toBe(160)
    expect(evaluate('90÷3−5+')).toBe(25)
    expect(evaluate('12.5×2')).toBe(25)
  })
})

import { budgetPeriod } from '../src/domain/budget'
describe('預算週期', () => {
  it('自訂起算日', () => {
    expect(budgetPeriod('2026-10-03', 5)).toEqual({ start: '2026-09-05', end: '2026-10-04' })
    expect(budgetPeriod('2026-10-05', 5)).toEqual({ start: '2026-10-05', end: '2026-11-04' })
    expect(budgetPeriod('2026-10-24', 1)).toEqual({ start: '2026-10-01', end: '2026-10-31' })
  })
})
