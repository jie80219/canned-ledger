import type { Recurring } from '../db/types'
import { addDays, addMonths, parse, type DateStr } from './dates'

/** 第 k 期（從 0 起算）的日期；月/年以起始日為錨點，避免月底漂移 */
export function occurrenceDate(rule: Pick<Recurring, 'freq' | 'interval' | 'startDate'>, k: number): DateStr {
  const n = k * Math.max(1, rule.interval)
  const anchor = parse(rule.startDate).d
  switch (rule.freq) {
    case 'daily':
      return addDays(rule.startDate, n)
    case 'weekly':
      return addDays(rule.startDate, 7 * n)
    case 'monthly':
      return addMonths(rule.startDate, n, anchor)
    case 'yearly':
      return addMonths(rule.startDate, 12 * n, anchor)
  }
}

export function isFinished(rule: Recurring, k: number): boolean {
  if (rule.count && k >= rule.count) return true
  if (rule.endDate && occurrenceDate(rule, k) > rule.endDate) return true
  return false
}

export function nextDate(rule: Recurring): DateStr | null {
  return isFinished(rule, rule.generated) ? null : occurrenceDate(rule, rule.generated)
}

const FREQ_LABEL = { daily: '天', weekly: '週', monthly: '個月', yearly: '年' }

export function describeFreq(rule: Pick<Recurring, 'freq' | 'interval'>): string {
  const unit = FREQ_LABEL[rule.freq]
  if (rule.interval <= 1) return { daily: '每天', weekly: '每週', monthly: '每月', yearly: '每年' }[rule.freq]
  return `每 ${rule.interval} ${unit}`
}
