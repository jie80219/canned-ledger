<script setup lang="ts">
import { computed, ref } from 'vue'
import { db } from '../db/schema'
import type { Budget, Transaction } from '../db/types'
import { deleteBudget, saveBook, saveBudget } from '../db/repo'
import { useBook } from '../composables/useBook'
import { useLive } from '../composables/useLive'
import { useConverter } from '../composables/useRates'
import { useUi } from '../stores/ui'
import { budgetPeriod } from '../domain/budget'
import { diffDays, today } from '../domain/dates'
import { formatMoney, toMajor, toMinor } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import Sheet from '../components/Sheet.vue'

const ui = useUi()
const { bookId, book, accounts, categories, currency, categoryMap } = useBook()
const { conv } = useConverter(accounts, currency)

const budgets = useLive<Budget[]>(() => db.budgets.where('bookId').equals(ui.bookId).toArray(), [], [bookId])
const period = computed(() => budgetPeriod(today(), book.value?.budgetStartDay ?? 1))
const txs = useLive<Transaction[]>(
  () =>
    db.transactions
      .where('[bookId+date]')
      .between([ui.bookId, period.value.start], [ui.bookId, period.value.end], true, true)
      .filter((t) => t.kind === 'expense')
      .toArray(),
  [],
  [bookId, period],
)

const total = computed(() => budgets.value.find((b) => !b.categoryId))
// 子分類的支出併入大類
const spentByTop = computed(() => {
  const m = new Map<string, number>()
  for (const t of txs.value) {
    const c = categoryMap.value.get(t.categoryId ?? '')
    const top = c?.parentId ?? c?.id ?? 'none'
    m.set(top, (m.get(top) ?? 0) + conv.value(t))
  }
  return m
})
const spentAll = computed(() => [...spentByTop.value.values()].reduce((a, b) => a + b, 0))
const daysLeft = computed(() => diffDays(today(), period.value.end) + 1)

const catBudgets = computed(() =>
  budgets.value
    .filter((b) => b.categoryId && categoryMap.value.get(b.categoryId))
    .map((b) => ({ b, c: categoryMap.value.get(b.categoryId!)!, spent: spentByTop.value.get(b.categoryId!) ?? 0 }))
    .sort((x, y) => x.c.sortOrder - y.c.sortOrder),
)
const pct = (spent: number, amount: number) => (amount ? (spent / amount) * 100 : 0)
const level = (p: number) => (p >= 100 ? 'over' : p >= 80 ? 'warn' : '')

// 編輯
const editing = ref<{ id?: string; categoryId?: string } | null>(null)
const amountInput = ref('')
const pickCat = ref('')
const freeCats = computed(() =>
  categories.value.filter((c) => c.kind === 'expense' && !c.parentId && !c.hidden && !budgets.value.some((b) => b.categoryId === c.id)),
)
function open(b?: Budget, categoryId?: string) {
  editing.value = { id: b?.id, categoryId: b?.categoryId ?? categoryId }
  amountInput.value = b ? String(toMajor(b.amount, currency.value)) : ''
  pickCat.value = freeCats.value[0]?.id ?? ''
}
async function commit() {
  const e = editing.value!
  const amount = toMinor(Number(amountInput.value) || 0, currency.value)
  const categoryId = e.categoryId === 'pick' ? pickCat.value : e.categoryId
  if (amount <= 0) {
    if (e.id) await deleteBudget(e.id)
  } else await saveBudget({ id: e.id, bookId: ui.bookId, categoryId: categoryId || undefined, amount })
  editing.value = null
}
async function remove() {
  if (editing.value?.id) await deleteBudget(editing.value.id)
  editing.value = null
}
async function setStartDay(d: number) {
  if (book.value) await saveBook({ ...book.value, budgetStartDay: d })
}
const lbl = (d: string) => d.slice(5).replace('-', '/')
</script>

<template>
  <main class="page no-nav">
    <TopBar title="預算" back />

    <div class="list">
      <div class="field">
        <label>每期起算日</label>
        <select :value="book?.budgetStartDay ?? 1" @change="setStartDay(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="d in 28" :key="d" :value="d">每月 {{ d }} 號{{ d === 1 ? '（自然月）' : '' }}</option>
        </select>
      </div>
    </div>
    <p class="help">本期 {{ lbl(period.start) }} – {{ lbl(period.end) }}，還剩 {{ daysLeft }} 天。發薪日不是 1 號的話，改成發薪日比較準。</p>

    <section class="card">
      <div class="card-title" style="margin: 0 0 8px">
        <span>總預算</span>
        <button class="link" @click="open(total)">{{ total ? '修改' : '設定' }}</button>
      </div>
      <template v-if="total">
        <div class="big num">{{ formatMoney(total.amount - spentAll, currency) }}</div>
        <div class="small muted" style="margin-bottom: 8px">
          剩餘 · 已花 {{ formatMoney(spentAll, currency) }} / {{ formatMoney(total.amount, currency) }}
          <template v-if="total.amount > spentAll"> · 每天可花 {{ formatMoney(Math.floor((total.amount - spentAll) / daysLeft), currency) }}</template>
        </div>
        <div class="progress" :class="level(pct(spentAll, total.amount))"><i :style="{ width: Math.min(100, pct(spentAll, total.amount)) + '%' }" /></div>
      </template>
      <div v-else class="small muted">還沒設定總預算</div>
    </section>

    <div class="section-label">分類預算</div>
    <div class="list">
      <button v-for="{ b, c, spent } in catBudgets" :key="b.id" class="row cat-row" @click="open(b)">
        <span class="emoji" :style="{ background: c.color + '26' }">{{ c.icon }}</span>
        <span class="grow">
          <span class="top"><span>{{ c.name }}</span><span class="num small" :class="{ expense: spent > b.amount }">{{ formatMoney(spent, currency) }} / {{ formatMoney(b.amount, currency) }}</span></span>
          <span class="progress" :class="level(pct(spent, b.amount))"><i :style="{ width: Math.min(100, pct(spent, b.amount)) + '%' }" /></span>
        </span>
      </button>
      <button v-if="freeCats.length" class="row" @click="open(undefined, 'pick')">
        <span class="emoji">＋</span><span class="grow" style="color: var(--accent)">新增分類預算</span>
      </button>
    </div>

    <Sheet v-if="editing" :title="editing.categoryId && editing.categoryId !== 'pick' ? `${categoryMap.get(editing.categoryId)?.name} 預算` : editing.categoryId === 'pick' ? '新增分類預算' : '總預算'" @close="editing = null">
      <div class="list">
        <div v-if="editing.categoryId === 'pick'" class="field">
          <label>分類</label>
          <select v-model="pickCat">
            <option v-for="c in freeCats" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
          </select>
        </div>
        <div class="field"><label>每期金額</label><input v-model="amountInput" inputmode="decimal" placeholder="0" /><span class="hint">{{ currency }}</span></div>
      </div>
      <button class="btn block" @click="commit">儲存</button>
      <button v-if="editing.id" class="btn danger block" style="margin-top: 6px" @click="remove">移除預算</button>
    </Sheet>
  </main>
</template>

<style scoped>
.big { font-size: 26px; font-weight: 700; }
.link { border: 0; background: none; color: var(--accent); padding: 0; font-size: 13px; }
.cat-row .grow { display: flex; flex-direction: column; gap: 6px; }
.top { display: flex; justify-content: space-between; gap: 8px; }
</style>
