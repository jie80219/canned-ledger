<script setup lang="ts">
import { computed, ref } from 'vue'
import { db } from '../db/schema'
import type { Transaction } from '../db/types'
import { useBook } from '../composables/useBook'
import { useLive } from '../composables/useLive'
import { useConverter } from '../composables/useRates'
import { useUi } from '../stores/ui'
import { addDays, clampDay, fmt, parse, shiftYM, startOfWeek, today } from '../domain/dates'
import { formatMoney, toMajor, toMinor } from '../domain/money'
import { byCategory, totals, trend } from '../domain/stats'
import EChart from '../components/EChart.vue'
import TxList from '../components/TxList.vue'

type Period = 'week' | 'month' | 'year' | 'custom'
const ui = useUi()
const { bookId, accounts, categories, currency, accountMap, categoryMap } = useBook()
const { conv, missing } = useConverter(accounts, currency)

const period = ref<Period>('month')
const anchor = ref(today())
const custom = ref({ start: addDays(today(), -29), end: today() })
const kind = ref<'expense' | 'income'>('expense')
const drill = ref<string>() // 下鑽的大類 id

const range = computed(() => {
  const a = parse(anchor.value)
  switch (period.value) {
    case 'week': {
      const s = startOfWeek(anchor.value)
      return { start: s, end: addDays(s, 6) }
    }
    case 'month':
      return { start: fmt(a.y, a.m, 1), end: clampDay(a.y, a.m, 31) }
    case 'year':
      return { start: fmt(a.y, 1, 1), end: fmt(a.y, 12, 31) }
    default:
      return custom.value
  }
})
const label = computed(() => {
  const a = parse(anchor.value)
  if (period.value === 'month') return `${a.y} 年 ${a.m} 月`
  if (period.value === 'year') return `${a.y} 年`
  if (period.value === 'week') return `${range.value.start.slice(5).replace('-', '/')} – ${range.value.end.slice(5).replace('-', '/')}`
  return ''
})
function shift(n: number) {
  const a = parse(anchor.value)
  if (period.value === 'week') anchor.value = addDays(anchor.value, 7 * n)
  else if (period.value === 'month') {
    const p = shiftYM(a.y, a.m, n)
    anchor.value = fmt(p.y, p.m, 1)
  } else if (period.value === 'year') anchor.value = fmt(a.y + n, 1, 1)
}

const txs = useLive<Transaction[]>(
  () =>
    db.transactions
      .where('[bookId+date]')
      .between([ui.bookId, range.value.start], [ui.bookId, range.value.end], true, true)
      .toArray(),
  [],
  [bookId, range],
)

const sum = computed(() => totals(txs.value, conv.value))
const slices = computed(() =>
  drill.value
    ? byCategory(txs.value, kind.value, categories.value, conv.value, { parentId: drill.value })
    : byCategory(txs.value, kind.value, categories.value, conv.value, { parentOnly: true }),
)
const sliceTotal = computed(() => slices.value.reduce((s, x) => s + x.amount, 0))

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

const pieOption = computed(() => ({
  tooltip: { trigger: 'item', valueFormatter: (v: number) => formatMoney(v, currency.value) },
  series: [
    {
      type: 'pie',
      radius: ['52%', '78%'],
      itemStyle: { borderRadius: 6, borderColor: css('--surface'), borderWidth: 2 },
      label: { show: false },
      data: slices.value.map((s) => ({
        name: `${s.category?.icon ?? '🥫'} ${s.category?.name ?? '未分類'}`,
        value: s.amount,
        id: s.id,
        itemStyle: { color: s.category?.color ?? '#aaa' },
      })),
    },
  ],
}))

const trendData = computed(() =>
  trend(txs.value, range.value.start, range.value.end, period.value === 'year' ? 'month' : 'day', conv.value),
)
const barOption = computed(() => ({
  grid: { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
  tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatMoney(toMinor(v, currency.value), currency.value) },
  xAxis: {
    type: 'category',
    data: trendData.value.map((b) => b.label),
    axisLine: { lineStyle: { color: css('--border') } },
    axisLabel: { color: css('--muted'), fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: css('--border'), type: 'dashed' } },
    axisLabel: { color: css('--muted'), fontSize: 10 },
  },
  series: [
    {
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: { borderRadius: [4, 4, 0, 0], color: kind.value === 'expense' ? css('--expense') : css('--income') },
      data: trendData.value.map((b) => toMajor(b[kind.value], currency.value)),
    },
  ],
}))

const topTxs = computed(() =>
  txs.value
    .filter((t) => t.kind === kind.value)
    .sort((a, b) => conv.value(b) - conv.value(a))
    .slice(0, 10),
)

const drillTxs = computed(() => {
  if (!drill.value) return []
  return txs.value.filter((t) => {
    if (t.kind !== kind.value) return false
    const c = categoryMap.value.get(t.categoryId ?? '')
    return (c?.parentId ?? c?.id) === drill.value
  })
})

function onSlice(id: string) {
  if (!drill.value && id !== 'none') drill.value = id
}
</script>

<template>
  <main class="page">
    <header class="topbar"><h1>統計</h1></header>

    <div class="seg">
      <button v-for="[k, l] in [['week', '週'], ['month', '月'], ['year', '年'], ['custom', '自訂']] as const" :key="k" :class="{ on: period === k }" @click="period = k; drill = undefined">{{ l }}</button>
    </div>
    <div v-if="period !== 'custom'" class="nav-row">
      <button class="icon-btn" aria-label="上一期" @click="shift(-1)">‹</button>
      <b>{{ label }}</b>
      <button class="icon-btn" aria-label="下一期" @click="shift(1)">›</button>
    </div>
    <div v-else class="custom">
      <input v-model="custom.start" type="date" /> – <input v-model="custom.end" type="date" />
    </div>

    <div class="totals">
      <button class="card tot" :class="{ on: kind === 'expense' }" @click="kind = 'expense'; drill = undefined">
        <span class="small muted">支出</span><b class="num expense">{{ formatMoney(sum.expense, currency) }}</b>
      </button>
      <button class="card tot" :class="{ on: kind === 'income' }" @click="kind = 'income'; drill = undefined">
        <span class="small muted">收入</span><b class="num income">{{ formatMoney(sum.income, currency) }}</b>
      </button>
    </div>
    <p v-if="missing.length" class="help">⚠️ 取不到 {{ missing.join('、') }} 匯率，這些帳戶以 1:1 計算</p>

    <section class="card">
      <div class="card-title" style="margin: 0 0 4px">
        <span>
          <button v-if="drill" class="link" @click="drill = undefined">‹ 全部分類</button>
          <template v-else>分類佔比</template>
          <template v-if="drill"> / {{ categoryMap.get(drill)?.name }}</template>
        </span>
        <span v-if="!drill" class="small">點分類看明細</span>
      </div>
      <template v-if="slices.length">
        <EChart :option="pieOption" height="200px" @click="(p) => onSlice(p.data.id)" />
        <div class="rank">
          <button v-for="s in slices" :key="s.id" class="rank-row" @click="onSlice(s.id)">
            <span class="emoji" :style="{ background: (s.category?.color ?? '#aaa') + '26' }">{{ s.category?.icon ?? '🥫' }}</span>
            <span class="grow">
              <span class="rank-top">
                <span>{{ s.category?.name ?? '未分類' }} <span class="muted small">{{ s.count }} 筆</span></span>
                <b class="num">{{ formatMoney(s.amount, currency) }}</b>
              </span>
              <span class="progress"><i :style="{ width: (s.amount / sliceTotal) * 100 + '%', background: s.category?.color }" /></span>
            </span>
            <span class="pct num small muted">{{ ((s.amount / sliceTotal) * 100).toFixed(1) }}%</span>
          </button>
        </div>
      </template>
      <div v-else class="empty">這段期間沒有{{ kind === 'expense' ? '支出' : '收入' }}</div>
    </section>

    <template v-if="drill">
      <div class="section-label">{{ categoryMap.get(drill)?.name }} 明細</div>
      <TxList :txs="drillTxs" :accounts="accountMap" :categories="categoryMap" />
    </template>
    <template v-else>
      <section v-if="period !== 'custom' || txs.length" class="card">
        <div class="card-title" style="margin: 0 0 4px"><span>{{ period === 'year' ? '每月' : '每日' }}趨勢</span></div>
        <EChart :option="barOption" height="180px" />
      </section>

      <div v-if="topTxs.length" class="section-label">單筆排行</div>
      <div v-if="topTxs.length" class="list">
        <RouterLink v-for="(t, i) in topTxs" :key="t.id" :to="`/tx/${t.id}`" class="row">
          <span class="no num">{{ i + 1 }}</span>
          <span class="emoji">{{ categoryMap.get(t.categoryId ?? '')?.icon ?? '🥫' }}</span>
          <span class="grow">
            <div>{{ categoryMap.get(t.categoryId ?? '')?.name ?? '未分類' }}</div>
            <div class="sub">{{ t.date }}<template v-if="t.note"> · {{ t.note }}</template></div>
          </span>
          <b class="num">{{ formatMoney(conv(t), currency) }}</b>
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.nav-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 6px 0; }
.custom { display: flex; align-items: center; gap: 8px; justify-content: center; margin: 10px 0; }
.custom input { border: 1px solid var(--border); border-radius: 10px; padding: 6px 8px; background: var(--surface); }
.totals { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.tot { border: 2px solid transparent; text-align: left; display: flex; flex-direction: column; gap: 2px; }
.tot.on { border-color: var(--accent); }
.tot b { font-size: 19px; }
.rank { margin-top: 6px; }
.rank-row { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: transparent; padding: 8px 0; text-align: left; }
.rank-row .grow { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.rank-top { display: flex; justify-content: space-between; gap: 8px; }
.pct { width: 46px; text-align: right; }
.no { width: 18px; color: var(--muted); text-align: center; }
.link { border: 0; background: none; color: var(--accent); padding: 0; font-size: 13px; }
</style>
