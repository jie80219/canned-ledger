<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/schema'
import type { Book, Budget, Transaction } from '../db/types'
import { useBook } from '../composables/useBook'
import { useLive } from '../composables/useLive'
import { useConverter } from '../composables/useRates'
import { useUi } from '../stores/ui'
import { clampDay, daysInMonth, fmt, parse, shiftYM, today } from '../domain/dates'
import { formatMoney } from '../domain/money'
import { totals } from '../domain/stats'
import { budgetPeriod } from '../domain/budget'
import TxList from '../components/TxList.vue'
import Sheet from '../components/Sheet.vue'
import CatIcon from '../components/CatIcon.vue'

const ui = useUi()
const router = useRouter()
const { bookId, book, accounts, currency, accountMap, categoryMap } = useBook()
const { conv } = useConverter(accounts, currency)

const t = parse(today())
const ym = ref({ y: t.y, m: t.m })
const range = computed(() => ({ start: fmt(ym.value.y, ym.value.m, 1), end: clampDay(ym.value.y, ym.value.m, 31) }))

const monthTxs = useLive<Transaction[]>(
  () =>
    db.transactions
      .where('[bookId+date]')
      .between([ui.bookId, range.value.start], [ui.bookId, range.value.end], true, true)
      .toArray(),
  [],
  [bookId, range],
)
const sum = computed(() => totals(monthTxs.value, conv.value))

const pendingCount = useLive(
  () => db.transactions.where('status').equals('pending').filter((t) => t.bookId === ui.bookId).count(),
  0,
  [bookId],
)

// 總預算（依帳本預算起算日）
const totalBudget = useLive<Budget | undefined>(
  () => db.budgets.where('bookId').equals(ui.bookId).filter((b) => !b.categoryId).first(),
  undefined,
  [bookId],
)
const period = computed(() => budgetPeriod(today(), book.value?.budgetStartDay ?? 1))
const periodTxs = useLive<Transaction[]>(
  () =>
    db.transactions
      .where('[bookId+date]')
      .between([ui.bookId, period.value.start], [ui.bookId, period.value.end], true, true)
      .toArray(),
  [],
  [bookId, period],
)
const budgetUsed = computed(() => totals(periodTxs.value, conv.value).expense)
const budgetPct = computed(() => (totalBudget.value ? (budgetUsed.value / totalBudget.value.amount) * 100 : 0))

const isCurrentMonth = computed(() => ym.value.y === t.y && ym.value.m === t.m)
const dailyAvg = computed(() => {
  const days = isCurrentMonth.value ? t.d : daysInMonth(ym.value.y, ym.value.m)
  return Math.round(sum.value.expense / days)
})

function shift(n: number) {
  ym.value = shiftYM(ym.value.y, ym.value.m, n)
}

const books = useLive<Book[]>(() => db.books.orderBy('sortOrder').toArray(), [])
const showBooks = ref(false)
function pickBook(id: string) {
  ui.setBook(id)
  showBooks.value = false
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <button class="book-btn" @click="showBooks = true">
        <CatIcon :icon="book?.icon" :color="book?.color" :size="26" :tint="false" /> {{ book?.name }} <span class="muted small">▾</span>
      </button>
      <span style="flex: 1" />
      <RouterLink to="/search" class="icon-btn" aria-label="搜尋">🔍</RouterLink>
    </header>

    <section class="card summary">
      <div class="month">
        <button class="icon-btn" aria-label="上個月" @click="shift(-1)">‹</button>
        <span>{{ ym.y }} 年 {{ ym.m }} 月</span>
        <button class="icon-btn" aria-label="下個月" @click="shift(1)">›</button>
      </div>
      <div class="muted small">本月支出</div>
      <div class="big num">{{ formatMoney(sum.expense, currency) }}</div>
      <div class="sub-stats">
        <div><span class="muted small">收入</span><b class="num income">{{ formatMoney(sum.income, currency) }}</b></div>
        <div><span class="muted small">結餘</span><b class="num">{{ formatMoney(sum.net, currency) }}</b></div>
        <div><span class="muted small">日均</span><b class="num">{{ formatMoney(dailyAvg, currency) }}</b></div>
      </div>
      <RouterLink v-if="totalBudget" to="/budget" class="budget">
        <div class="budget-head small">
          <span>預算剩餘 <b class="num">{{ formatMoney(totalBudget.amount - budgetUsed, currency) }}</b></span>
          <span class="muted num">{{ Math.round(budgetPct) }}%</span>
        </div>
        <div class="progress" :class="{ warn: budgetPct >= 80, over: budgetPct >= 100 }">
          <i :style="{ width: Math.min(100, budgetPct) + '%' }" />
        </div>
      </RouterLink>
    </section>

    <button v-if="ui.scheduler" class="banner" @click="ui.scheduler = null">
      <span>🤖</span>
      <span class="grow">
        已自動入帳 {{ ui.scheduler.created }} 筆<template v-if="ui.scheduler.pending">，其中 {{ ui.scheduler.pending }} 筆待確認</template>
      </span>
      <span class="muted">✕</span>
    </button>
    <button v-if="pendingCount" class="banner pending" @click="router.push('/search?status=pending')">
      <span>⏳</span><span class="grow">{{ pendingCount }} 筆交易待確認（外幣金額或信用卡扣款）</span><span class="chev">›</span>
    </button>

    <div class="chips shortcuts">
      <RouterLink to="/recurring" class="chip">🔁 週期記帳</RouterLink>
      <RouterLink to="/budget" class="chip">🎯 預算</RouterLink>
      <RouterLink to="/settings/data" class="chip">🧾 匯入發票</RouterLink>
    </div>

    <TxList v-if="monthTxs.length" :txs="monthTxs" :accounts="accountMap" :categories="categoryMap" show-day-total />
    <div v-else class="empty">
      <div class="big">🐹</div>
      這個月還沒有記帳<br />點下方 ＋ 記第一筆吧
    </div>

    <Sheet v-if="showBooks" title="切換帳本" @close="showBooks = false">
      <div class="list">
        <button v-for="b in books" :key="b.id" class="row" @click="pickBook(b.id)">
          <CatIcon :icon="b.icon" :color="b.color" :size="38" />
          <span class="grow">{{ b.name }} <span class="sub">{{ b.currency }}</span></span>
          <span v-if="b.id === bookId">✓</span>
        </button>
      </div>
      <RouterLink to="/settings/books" class="btn ghost block" style="display: block; text-align: center">管理帳本</RouterLink>
    </Sheet>
  </main>
</template>

<style scoped>
.book-btn { border: 0; background: var(--surface); border-radius: 99px; padding: 7px 14px; font-weight: 600; box-shadow: var(--shadow); }
.summary { padding: 8px 18px 16px; }
.month { display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 600; margin-bottom: 4px; }
.big { font-size: 2.125rem; font-weight: 700; letter-spacing: -0.5px; color: var(--expense); }
.sub-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.sub-stats div { display: flex; flex-direction: column; }
.sub-stats b { font-size: 0.9375rem; }
.budget { display: block; color: inherit; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border); }
.budget-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
.shortcuts { margin: 4px 0 6px; }
.grow { flex: 1; }
</style>
