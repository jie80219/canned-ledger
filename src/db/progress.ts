import { db, getMeta, setMeta, type LedgerDB } from './schema'
import type { Goal, Transaction } from './types'
import { balanceOf } from '../domain/balance'
import { today, type DateStr } from '../domain/dates'
import { unlock, type Achievement, type Facts } from '../domain/achievements'
import {
  budgetMonths,
  computeXp,
  currentStreak,
  goalSaved,
  isManual,
  levelOf,
  recordDays,
  stageOf,
  streakRuns,
  type PetInfo,
} from '../domain/pet'

export const getPet = (d: LedgerDB = db) => getMeta<PetInfo | null>('pet', null, d)
export const setPet = (p: PetInfo, d: LedgerDB = db) => setMeta('pet', { ...p }, d)
export const getAchievements = (d: LedgerDB = db) => getMeta<Record<string, DateStr>>('achievements', {}, d)

/** 記帳的時刻：有填時間用時間，否則只有當天建立的交易才看建立時間 */
function hourOf(t: Transaction): number | undefined {
  if (t.time) return Number(t.time.slice(0, 2))
  const c = new Date(t.createdAt)
  return today(c) === t.date ? c.getHours() : undefined
}

export async function loadProgress(d: LedgerDB = db, ref = today()) {
  const [txs, books, budgets, goals, accounts, recurring, backupAt] = await Promise.all([
    d.transactions.toArray(),
    d.books.toArray(),
    d.budgets.toArray(),
    d.goals.toArray(),
    d.accounts.toArray(),
    d.recurring.count(),
    getMeta<string | null>('lastBackupAt', null, d),
  ])
  const days = recordDays(txs, ref)
  const months = budgetMonths(txs, books, budgets, ref)
  const goalRows = goals
    .filter((g) => !g.archived)
    .map((g) => {
      const a = accounts.find((x) => x.id === g.accountId)
      const saved = a ? goalSaved(g, balanceOf(a.id, a.initialBalance, txs)) : 0
      return { goal: g, saved, account: a }
    })
  const xp = computeXp(
    days,
    months,
    goalRows.map((r) => r.saved / r.goal.target),
  )
  const lv = levelOf(xp.total)
  const manual = txs.filter(isManual)
  const hours = manual.map(hourOf).filter((h): h is number => h !== undefined)
  const accCur = new Map(accounts.map((a) => [a.id, a.currency]))
  const currencies = new Set(manual.flatMap((t) => [accCur.get(t.accountId), t.original?.currency].filter(Boolean)))
  let run = 0
  let metRun = 0
  for (const m of months) metRun = Math.max(metRun, (run = m.met ? run + 1 : 0))
  const facts: Facts = {
    txCount: manual.length,
    maxStreak: Math.max(0, ...streakRuns(days)),
    budgetMet: months.filter((m) => m.met).length,
    budgetMetRun: metRun,
    goalsCreated: goals.length,
    goalsDone: goals.filter((g) => g.achievedAt).length + goalRows.filter((r) => !r.goal.achievedAt && r.saved >= r.goal.target).length,
    recurring,
    invoices: txs.some((t) => t.invoiceNo) ? 1 : 0,
    backedUp: !!backupAt,
    nightOwl: hours.some((h) => h < 5),
    earlyBird: hours.some((h) => h >= 5 && h < 8),
    currencies: currencies.size,
    books: books.length,
    level: lv.level,
  }
  return {
    days,
    lastDay: days[days.length - 1] as DateStr | undefined,
    streak: currentStreak(days, ref),
    months,
    goals: goalRows,
    xp,
    ...lv,
    stage: stageOf(lv.level),
    facts,
  }
}

export type Progress = Awaited<ReturnType<typeof loadProgress>>

/** 開 App 時跑：標記剛完成的存錢目標、解鎖新成就 */
export async function checkProgress(d: LedgerDB = db, ref = today()): Promise<{ achievements: Achievement[]; goals: Goal[] }> {
  const p = await loadProgress(d, ref)
  const done = p.goals.filter((r) => !r.goal.achievedAt && r.saved >= r.goal.target).map((r) => r.goal)
  for (const g of done) await d.goals.update(g.id, { achievedAt: ref, updatedAt: Date.now() })
  const { all, fresh } = unlock(p.facts, await getAchievements(d), ref)
  if (fresh.length) await setMeta('achievements', all, d)
  return { achievements: fresh, goals: done }
}
