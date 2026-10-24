import { computed } from 'vue'
import { db } from '../db/schema'
import type { Budget, Transaction } from '../db/types'
import { getAchievements, getPet, loadProgress, type Progress } from '../db/progress'
import { budgetPeriod } from '../domain/budget'
import { addDays, diffDays, fmt, parse, shiftYM, today } from '../domain/dates'
import { formatMoney } from '../domain/money'
import { totals } from '../domain/stats'
import { isHungry, moodOf, type PetInfo } from '../domain/pet'
import { useBook } from './useBook'
import { useLive } from './useLive'
import { useConverter } from './useRates'

export function usePet() {
  const { bookId, book, accounts, currency, categoryMap } = useBook()
  const { conv } = useConverter(accounts, currency)
  const pet = useLive<PetInfo | null | undefined>(() => getPet(), undefined)
  const progress = useLive<Progress | null>(() => loadProgress(), null)
  const unlocked = useLive<Record<string, string>>(() => getAchievements(), {})

  const ref = today()
  const period = computed(() => budgetPeriod(ref, book.value?.budgetStartDay ?? 1))
  const budget = useLive<Budget | undefined>(
    () => db.budgets.where('bookId').equals(bookId.value).filter((b) => !b.categoryId).first(),
    undefined,
    [bookId],
  )
  // 上個月 1 號到今天，用來算本期預算與月比較
  const t = parse(ref)
  const prev = shiftYM(t.y, t.m, -1)
  const from = computed(() => [fmt(prev.y, prev.m, 1), period.value.start].sort()[0])
  const txs = useLive<Transaction[]>(
    () => db.transactions.where('[bookId+date]').between([bookId.value, from.value], [bookId.value, ref], true, true).toArray(),
    [],
    [bookId, from],
  )
  const spent = (start: string, end: string) => totals(txs.value.filter((x) => x.date >= start && x.date <= end), conv.value).expense

  const hungry = computed(() => isHungry(progress.value?.lastDay, ref))
  const mood = computed(() => {
    const p = period.value
    const used = budget.value ? spent(p.start, p.end) / budget.value.amount : undefined
    const elapsed = (diffDays(p.start, ref) + 1) / (diffDays(p.start, p.end) + 1)
    return hungry.value ? 'sad' : moodOf({ used, elapsed, lastDay: progress.value?.lastDay, ref })
  })

  const lines = computed(() => {
    const p = progress.value
    if (!p) return []
    if (hungry.value) return ['好幾天沒看到你記帳了，肚子咕嚕咕嚕…', '記一筆帳餵我好不好？']
    const out: string[] = []
    if (p.stage === 0) out.push('蛋裡好像有東西在動…')
    if (p.streak >= 2) out.push(`連續記帳 ${p.streak} 天了，繼續保持！`)
    if (mood.value === 'happy' && budget.value) out.push('這個月預算控制得很好耶')
    if (mood.value === 'worried') out.push('這個月花得有點快，要不要踩一下煞車？')
    if (mood.value === 'sad' && budget.value) out.push('預算有點吃緊…下個月一起加油')
    const cur = spent(fmt(t.y, t.m, 1), ref)
    const last = spent(fmt(prev.y, prev.m, 1), addDays(fmt(prev.y, prev.m, 1), t.d - 1))
    if (cur && last) {
      const pct = Math.round((Math.abs(cur - last) / last) * 100)
      out.push(`這個月花了 ${formatMoney(cur, currency.value)}，比上個月同期${cur <= last ? '少' : '多'} ${pct}%${cur <= last ? ' 耶' : ''}`)
    }
    const byCat = new Map<string, number>()
    for (const x of txs.value) {
      if (x.kind !== 'expense' || x.date < fmt(t.y, t.m, 1)) continue
      const c = categoryMap.value.get(x.categoryId ?? '')
      const top = categoryMap.value.get(c?.parentId ?? '') ?? c
      if (top) byCat.set(top.name, (byCat.get(top.name) ?? 0) + conv.value(x))
    }
    const top = [...byCat].sort((a, b) => b[1] - a[1])[0]
    if (top) out.push(`這個月花最多的是「${top[0]}」，共 ${formatMoney(top[1], currency.value)}`)
    for (const g of p.goals) {
      if (g.saved < g.goal.target && g.account) out.push(`「${g.goal.name}」還差 ${formatMoney(g.goal.target - g.saved, g.account.currency)}`)
    }
    if (!out.length) out.push('今天也一起囤一點吧！')
    return out
  })

  return { pet, progress, unlocked, mood, hungry, lines }
}
