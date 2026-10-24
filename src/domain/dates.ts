// 日期一律用本地時區的 'YYYY-MM-DD' 字串，字串比較即日期比較

export type DateStr = string

const pad = (n: number) => String(n).padStart(2, '0')

export function fmt(y: number, m: number, d: number): DateStr {
  return `${y}-${pad(m)}-${pad(d)}`
}

export function parse(s: DateStr): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

export function today(now = new Date()): DateStr {
  return fmt(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate()
}

/** 指定年月的第 day 天，超過月底就取月底（例如 31 號遇到 2 月） */
export function clampDay(y: number, m: number, day: number): DateStr {
  return fmt(y, m, Math.min(day, daysInMonth(y, m)))
}

export function addDays(s: DateStr, n: number): DateStr {
  const { y, m, d } = parse(s)
  const dt = new Date(y, m - 1, d + n)
  return fmt(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

/** 月份位移；anchorDay 指定原始日，避免 31→28→28 的漂移 */
export function addMonths(s: DateStr, n: number, anchorDay?: number): DateStr {
  const { y, m, d } = parse(s)
  const total = y * 12 + (m - 1) + n
  return clampDay(Math.floor(total / 12), (total % 12) + 1, anchorDay ?? d)
}

export function shiftYM(y: number, m: number, n: number): { y: number; m: number } {
  const total = y * 12 + (m - 1) + n
  return { y: Math.floor(total / 12), m: (total % 12) + 1 }
}

export function weekday(s: DateStr): number {
  const { y, m, d } = parse(s)
  return new Date(y, m - 1, d).getDay()
}

/** 以週一為一週開始 */
export function startOfWeek(s: DateStr): DateStr {
  return addDays(s, -((weekday(s) + 6) % 7))
}

export function diffDays(a: DateStr, b: DateStr): number {
  const pa = parse(a)
  const pb = parse(b)
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000)
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export function labelDay(s: DateStr, ref = today()): string {
  if (s === ref) return '今天'
  if (s === addDays(ref, -1)) return '昨天'
  const { m, d } = parse(s)
  return `${m}月${d}日 週${WEEK[weekday(s)]}`
}
