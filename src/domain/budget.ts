import { addDays, clampDay, parse, shiftYM, type DateStr } from './dates'

/** 含 date 的預算週期；startDay 例如 5 號發薪 → 每月 5 號到下月 4 號 */
export function budgetPeriod(date: DateStr, startDay: number): { start: DateStr; end: DateStr } {
  const { y, m } = parse(date)
  let start = clampDay(y, m, startDay)
  if (date < start) {
    const p = shiftYM(y, m, -1)
    start = clampDay(p.y, p.m, startDay)
  }
  const s = parse(start)
  const n = shiftYM(s.y, s.m, 1)
  return { start, end: addDays(clampDay(n.y, n.m, startDay), -1) }
}
