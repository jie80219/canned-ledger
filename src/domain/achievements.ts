import type { DateStr } from './dates'

export interface Facts {
  txCount: number
  maxStreak: number
  budgetMet: number
  budgetMetRun: number
  goalsCreated: number
  goalsDone: number
  recurring: number
  invoices: number
  backedUp: boolean
  nightOwl: boolean
  earlyBird: boolean
  currencies: number
  books: number
  level: number
}

export interface Achievement {
  id: string
  name: string
  icon: string
  hint: string
  test: (f: Facts) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-tx', name: '第一筆', icon: '✏️', hint: '記下第一筆帳', test: (f) => f.txCount >= 1 },
  { id: 'streak-7', name: '一週不間斷', icon: '🔥', hint: '連續記帳 7 天', test: (f) => f.maxStreak >= 7 },
  { id: 'streak-30', name: '月月記', icon: '📅', hint: '連續記帳 30 天', test: (f) => f.maxStreak >= 30 },
  { id: 'streak-100', name: '百日囤', icon: '💯', hint: '連續記帳 100 天', test: (f) => f.maxStreak >= 100 },
  { id: 'streak-365', name: '一整年', icon: '🏆', hint: '連續記帳 365 天', test: (f) => f.maxStreak >= 365 },
  { id: 'tx-100', name: '百筆達成', icon: '📒', hint: '累計記 100 筆', test: (f) => f.txCount >= 100 },
  { id: 'tx-1000', name: '千筆大師', icon: '📚', hint: '累計記 1000 筆', test: (f) => f.txCount >= 1000 },
  { id: 'budget-1', name: '守住預算', icon: '🎯', hint: '第一次整月沒超過總預算', test: (f) => f.budgetMet >= 1 },
  { id: 'budget-3', name: '預算三連勝', icon: '🥇', hint: '連續 3 個月沒超過總預算', test: (f) => f.budgetMetRun >= 3 },
  { id: 'goal-create', name: '立下目標', icon: '🐷', hint: '建立第一個存錢目標', test: (f) => f.goalsCreated >= 1 },
  { id: 'goal-done', name: '夢想成真', icon: '🎉', hint: '完成一個存錢目標', test: (f) => f.goalsDone >= 1 },
  { id: 'recurring', name: '自動駕駛', icon: '🔁', hint: '建立第一筆週期記帳', test: (f) => f.recurring >= 1 },
  { id: 'invoice', name: '發票收集者', icon: '🧾', hint: '匯入一次電子發票', test: (f) => f.invoices >= 1 },
  { id: 'backup', name: '有備無患', icon: '💾', hint: '匯出一次備份', test: (f) => f.backedUp },
  { id: 'night-owl', name: '夜貓子', icon: '🦉', hint: '在凌晨 0～4 點記帳', test: (f) => f.nightOwl },
  { id: 'early-bird', name: '早起鳥', icon: '🐦', hint: '在早上 5～7 點記帳', test: (f) => f.earlyBird },
  { id: 'fx-5', name: '外幣達人', icon: '🌏', hint: '記過 5 種幣別', test: (f) => f.currencies >= 5 },
  { id: 'books-2', name: '分門別類', icon: '🗂️', hint: '開第二本帳本', test: (f) => f.books >= 2 },
  { id: 'hatch', name: '破殼而出', icon: '🐣', hint: '寵物升到 Lv5', test: (f) => f.level >= 5 },
  { id: 'adult', name: '長大了', icon: '🐹', hint: '寵物升到 Lv30', test: (f) => f.level >= 30 },
]

/** 依目前資料補上新解鎖的成就；已解鎖的不會因為資料變動而收回 */
export function unlock(f: Facts, have: Record<string, DateStr>, date: DateStr): { all: Record<string, DateStr>; fresh: Achievement[] } {
  const fresh = ACHIEVEMENTS.filter((a) => !have[a.id] && a.test(f))
  const all = { ...have }
  for (const a of fresh) all[a.id] = date
  return { all, fresh }
}
