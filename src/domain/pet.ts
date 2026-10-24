import type { Book, Budget, Goal, Transaction } from '../db/types'
import { budgetPeriod } from './budget'
import { addDays, diffDays, today, type DateStr } from './dates'

export type Species = 'hamster' | 'squirrel' | 'rabbit'
export type Mood = 'happy' | 'normal' | 'worried' | 'sad'
export type Stage = 0 | 1 | 2 | 3

export interface PetInfo {
  species: Species
  name: string
}

export const SPECIES: Record<Species, string> = { hamster: '囤囤倉鼠', squirrel: '松鼠', rabbit: '兔子' }
export const STAGES = ['蛋', '幼年', '少年', '成年'] as const
export const MOODS: Record<Mood, string> = { happy: '開心', normal: '普通', worried: '擔心', sad: '難過' }

/** 只算使用者自己記的帳，自動產生的不算 */
export const isManual = (t: Transaction) => !t.autoKey && !t.recurringId && !t.autopayOf

export function recordDays(txs: Transaction[], ref = today()): DateStr[] {
  return [...new Set(txs.filter((t) => isManual(t) && t.date <= ref).map((t) => t.date))].sort()
}

/** 連續記帳的每一段長度 */
export function streakRuns(days: DateStr[]): number[] {
  const runs: number[] = []
  for (let i = 0; i < days.length; i++) {
    if (i && diffDays(days[i - 1], days[i]) === 1) runs[runs.length - 1]++
    else runs.push(1)
  }
  return runs
}

/** 到今天（或昨天，今天還沒記也不算斷）為止的連續天數 */
export function currentStreak(days: DateStr[], ref = today()): number {
  const last = days[days.length - 1]
  if (!last || diffDays(last, ref) > 1) return 0
  return streakRuns(days).pop()!
}

export interface BudgetMonth {
  bookId: string
  end: DateStr
  met: boolean
}

/** 每個帳本已結束的預算週期是否沒超支（用目前的總預算金額回推） */
export function budgetMonths(txs: Transaction[], books: Book[], budgets: Budget[], ref = today()): BudgetMonth[] {
  const out: BudgetMonth[] = []
  for (const b of books) {
    const budget = budgets.find((x) => x.bookId === b.id && !x.categoryId)
    if (!budget) continue
    const mine = txs.filter((t) => t.bookId === b.id)
    const first = mine.filter(isManual).reduce<DateStr | undefined>((m, t) => (!m || t.date < m ? t.date : m), undefined)
    if (!first) continue
    let p = budgetPeriod(first, b.budgetStartDay)
    while (p.end < ref) {
      const spent = mine.filter((t) => t.kind === 'expense' && t.date >= p.start && t.date <= p.end).reduce((s, t) => s + t.amount, 0)
      out.push({ bookId: b.id, end: p.end, met: spent <= budget.amount })
      p = budgetPeriod(addDays(p.end, 1), b.budgetStartDay)
    }
  }
  return out.sort((a, b) => (a.end < b.end ? -1 : 1))
}

export interface XpPart {
  label: string
  xp: number
}

/** 經驗值全部從資料推算，不另外存，也就不能手動灌 */
export function computeXp(days: DateStr[], months: BudgetMonth[], goalFractions: number[]): { total: number; parts: XpPart[] } {
  const runs = streakRuns(days)
  const bonus = (n: number, xp: number) => runs.filter((r) => r >= n).length * xp
  const parts: XpPart[] = [
    { label: `記帳 ${days.length} 天`, xp: days.length * 10 },
    { label: '連續記帳 7／30／100 天', xp: bonus(7, 50) + bonus(30, 200) + bonus(100, 500) },
    { label: `預算達標 ${months.filter((m) => m.met).length} 個月`, xp: months.filter((m) => m.met).length * 100 },
    { label: '存錢目標進度', xp: goalFractions.reduce((s, f) => s + Math.floor(Math.min(1, Math.max(0, f)) * 10) * 30, 0) },
  ]
  return { total: parts.reduce((s, p) => s + p.xp, 0), parts }
}

/** 升到下一級要 40 + 10×目前等級 */
export function levelOf(xp: number): { level: number; into: number; need: number } {
  let level = 1
  let rest = xp
  while (rest >= 40 + 10 * level) {
    rest -= 40 + 10 * level
    level++
  }
  return { level, into: rest, need: 40 + 10 * level }
}

export function stageOf(level: number): Stage {
  return level >= 30 ? 3 : level >= 15 ? 2 : level >= 5 ? 1 : 0
}

/** used/budget：本期已用比例；elapsed：本期已過比例。沒設預算時看最近有沒有記帳 */
export function moodOf(opts: { used?: number; elapsed: number; lastDay?: DateStr; ref?: DateStr }): Mood {
  const ref = opts.ref ?? today()
  if (opts.used !== undefined) {
    if (opts.used > 1) return 'sad'
    const r = opts.used / Math.max(opts.elapsed, 0.01)
    return r <= 0.9 ? 'happy' : r <= 1.1 ? 'normal' : r <= 1.3 ? 'worried' : 'sad'
  }
  if (!opts.lastDay) return 'normal'
  const gap = diffDays(opts.lastDay, ref)
  return gap <= 1 ? 'happy' : gap <= 3 ? 'normal' : 'worried'
}

export const isHungry = (lastDay: DateStr | undefined, ref = today()) => !!lastDay && diffDays(lastDay, ref) > 3

export function goalSaved(g: Goal, balance: number): number {
  return Math.max(0, balance - g.baseline)
}

/** 有截止日時，每天還要存多少（最小單位，無條件進位） */
export function perDay(g: Goal, saved: number, ref = today()): number | undefined {
  if (!g.deadline || saved >= g.target) return undefined
  const days = diffDays(ref, g.deadline) + 1
  return days > 0 ? Math.ceil((g.target - saved) / days) : undefined
}
