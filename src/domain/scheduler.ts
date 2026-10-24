import { db as defaultDb, setMeta, type LedgerDB } from '../db/schema'
import { makeTx } from '../db/factory'
import type { Account, Recurring, Transaction } from '../db/types'
import { addDays, today as todayStr, type DateStr } from './dates'
import { convert } from './money'
import { getRate, type RateResult } from './fx'
import { isFinished, occurrenceDate } from './recurrence'
import { computeDue, cyclesDueIn } from './creditCard'

export interface SchedulerDeps {
  db?: LedgerDB
  today?: DateStr
  getRate?: (base: string, quote: string, date: DateStr) => Promise<RateResult | null>
}

export interface SchedulerResult {
  created: number
  pending: number
}

const MAX_PER_RULE = 1000

/**
 * 補跑引擎：GitHub Pages 沒有後端排程，所以每次開 App／切回前景時執行，
 * 把上次之後到今天之間該發生的週期交易與信用卡自動扣款依日期補齊。
 * 每筆自動交易都有唯一的 autoKey，重複執行或多分頁同時執行都不會重複入帳。
 */
export async function runScheduler(deps: SchedulerDeps = {}): Promise<SchedulerResult> {
  const d = deps.db ?? defaultDb
  const today = deps.today ?? todayStr()
  const rate = deps.getRate ?? ((b, q, date) => getRate(b, q, date, { db: d, today }))
  const result: SchedulerResult = { created: 0, pending: 0 }

  const accounts = new Map((await d.accounts.toArray()).map((a) => [a.id, a]))
  await runRecurring(d, today, accounts, rate, result)
  await runAutopay(d, today, accounts, rate, result)
  await setMeta('lastSchedulerRun', today, d)
  return result
}

async function addUnique(d: LedgerDB, tx: Transaction, result: SchedulerResult): Promise<boolean> {
  if (tx.autoKey && (await d.transactions.where('autoKey').equals(tx.autoKey).count())) return false
  try {
    await d.transactions.add(tx)
  } catch (e) {
    if ((e as Error).name === 'ConstraintError') return false // 另一個分頁剛好先寫入
    throw e
  }
  result.created++
  if (tx.status === 'pending') result.pending++
  return true
}

async function buildRecurringTx(
  rule: Recurring,
  date: DateStr,
  accounts: Map<string, Account>,
  rate: NonNullable<SchedulerDeps['getRate']>,
): Promise<Transaction | null> {
  const acc = accounts.get(rule.template.accountId)
  if (!acc) return null
  const base = {
    bookId: rule.bookId,
    kind: rule.template.kind,
    date,
    accountId: acc.id,
    categoryId: rule.template.categoryId,
    note: rule.template.note || rule.name,
    recurringId: rule.id,
    autoKey: `r:${rule.id}:${date}`,
  } as const

  let amount = rule.amount
  let original: Transaction['original']
  let status: Transaction['status'] = 'confirmed'
  let pendingReason: string | undefined

  if (rule.currency !== acc.currency) {
    const feeRate = rule.template.kind === 'expense' ? acc.credit?.foreignFeeRate ?? 0 : 0
    const r = await rate(rule.currency, acc.currency, date)
    amount = r ? convert(rule.amount, rule.currency, acc.currency, r.rate, feeRate) : 0
    original = {
      currency: rule.currency,
      amount: rule.amount,
      rate: r?.rate ?? 0,
      rateDate: r?.date ?? date,
      rateSource: r?.source ?? 'none',
      feeRate,
    }
    if (!r) {
      status = 'pending'
      pendingReason = '無法取得匯率，請手動輸入金額'
    } else if (rule.fxMode === 'confirm') {
      status = 'pending'
      pendingReason = '依帳單輸入實際入帳金額'
    }
  }

  let toAmount: number | undefined
  if (rule.template.kind === 'transfer') {
    const to = accounts.get(rule.template.toAccountId ?? '')
    if (!to) return null
    if (to.currency !== acc.currency) {
      const r = await rate(acc.currency, to.currency, date)
      toAmount = r ? convert(amount, acc.currency, to.currency, r.rate) : 0
      if (!r) {
        status = 'pending'
        pendingReason = '無法取得匯率，請手動輸入金額'
      }
    }
    return makeTx({ ...base, amount, toAccountId: to.id, toAmount, original, status, pendingReason })
  }
  return makeTx({ ...base, amount, original, status, pendingReason })
}

async function runRecurring(
  d: LedgerDB,
  today: DateStr,
  accounts: Map<string, Account>,
  rate: NonNullable<SchedulerDeps['getRate']>,
  result: SchedulerResult,
) {
  const rules = (await d.recurring.toArray()).filter((r) => r.active)
  for (const rule of rules) {
    // 先在 transaction 外把匯率抓好（IndexedDB transaction 不能跨 fetch）
    const planned: Array<{ k: number; tx: Transaction | null }> = []
    for (let k = rule.generated; planned.length < MAX_PER_RULE; k++) {
      if (isFinished(rule, k)) break
      const date = occurrenceDate(rule, k)
      if (date > today) break
      planned.push({ k, tx: await buildRecurringTx(rule, date, accounts, rate) })
    }
    if (!planned.length) continue
    await d.transaction('rw', d.transactions, d.recurring, async () => {
      for (const p of planned) if (p.tx) await addUnique(d, p.tx, result)
      const fresh = await d.recurring.get(rule.id)
      const next = planned[planned.length - 1].k + 1
      if (fresh && fresh.generated < next) await d.recurring.update(rule.id, { generated: next })
    })
  }
}

async function runAutopay(
  d: LedgerDB,
  today: DateStr,
  accounts: Map<string, Account>,
  rate: NonNullable<SchedulerDeps['getRate']>,
  result: SchedulerResult,
) {
  for (const card of accounts.values()) {
    const c = card.credit
    if (card.type !== 'credit' || !c || c.autopay === 'off' || !c.payFromAccountId || card.archived) continue
    const bank = accounts.get(c.payFromAccountId)
    if (!bank) continue
    const since = c.autopaySince ?? today
    const cycles = cyclesDueIn(c, addDays(since, -1), today)
    for (const cyc of cycles) {
      const autoKey = `a:${card.id}:${cyc.end}`
      if (await d.transactions.where('autoKey').equals(autoKey).count()) continue
      const fx = bank.currency === card.currency ? null : await rate(card.currency, bank.currency, cyc.due)
      await d.transaction('rw', d.transactions, async () => {
        const txs = await d.transactions
          .where('accountId')
          .equals(card.id)
          .or('toAccountId')
          .equals(card.id)
          .toArray()
        const info = computeDue(card.id, card.initialBalance, c, txs, cyc)
        const cardAmount = c.autopay === 'minimum' ? info.minimum : info.due
        if (cardAmount <= 0) return
        let bankAmount = cardAmount
        let status: Transaction['status'] = c.autopayConfirm ? 'pending' : 'confirmed'
        let pendingReason = c.autopayConfirm ? '核對帳單金額後確認扣款' : undefined
        if (bank.currency !== card.currency) {
          bankAmount = fx ? convert(cardAmount, card.currency, bank.currency, fx.rate) : 0
          if (!fx) {
            status = 'pending'
            pendingReason = '無法取得匯率，請手動輸入金額'
          }
        }
        await addUnique(
          d,
          makeTx({
            bookId: card.bookId,
            kind: 'transfer',
            date: cyc.due,
            accountId: bank.id,
            toAccountId: card.id,
            amount: bankAmount,
            toAmount: cardAmount,
            note: `${card.name} 自動扣款（${cyc.start.slice(5)}～${cyc.end.slice(5)} 帳單）`,
            status,
            pendingReason,
            autopayOf: { cardId: card.id, cycleEnd: cyc.end },
            autoKey,
          }),
          result,
        )
      })
    }
  }
}
