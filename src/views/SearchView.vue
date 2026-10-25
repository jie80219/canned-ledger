<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '../db/schema'
import type { Transaction } from '../db/types'
import { useBook } from '../composables/useBook'
import { useLive } from '../composables/useLive'
import { useUi } from '../stores/ui'
import { confirmTx } from '../db/repo'
import { toMinor } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import TxList from '../components/TxList.vue'
import { iconText } from '../icons'

const ui = useUi()
const route = useRoute()
const { bookId, accounts, categories, accountMap, categoryMap } = useBook()

const q = ref('')
const kind = ref<'' | 'expense' | 'income' | 'transfer'>('')
const categoryId = ref((route.query.category as string) ?? '')
const accountId = ref((route.query.account as string) ?? '')
const status = ref((route.query.status as string) ?? '')
const from = ref('')
const to = ref('')
const min = ref('')
const max = ref('')
const showFilters = ref(!!(categoryId.value || accountId.value || status.value))

const all = useLive<Transaction[]>(() => db.transactions.where('bookId').equals(ui.bookId).toArray(), [], [bookId])

// 大類後面接它的子類
const catOptions = computed(() => {
  const list = categories.value.filter((c) => !c.hidden)
  return list.filter((c) => !c.parentId).sort((a, b) => a.kind.localeCompare(b.kind)).flatMap((t) => [t, ...list.filter((c) => c.parentId === t.id)])
})

const results = computed(() => {
  const text = q.value.trim().toLowerCase()
  const childOf = (id: string) => categoryMap.value.get(id)?.parentId
  return all.value.filter((t) => {
    if (kind.value && t.kind !== kind.value) return false
    if (status.value && t.status !== status.value) return false
    if (categoryId.value && t.categoryId !== categoryId.value && childOf(t.categoryId ?? '') !== categoryId.value) return false
    if (accountId.value && t.accountId !== accountId.value && t.toAccountId !== accountId.value) return false
    if (from.value && t.date < from.value) return false
    if (to.value && t.date > to.value) return false
    const cur = accountMap.value.get(t.accountId)?.currency ?? 'TWD'
    if (min.value && t.amount < toMinor(Number(min.value), cur)) return false
    if (max.value && t.amount > toMinor(Number(max.value), cur)) return false
    if (text) {
      const c = categoryMap.value.get(t.categoryId ?? '')
      const hay = [t.note, c?.name, accountMap.value.get(t.accountId)?.name, t.invoiceNo, t.tags.join(' ')].join(' ').toLowerCase()
      if (!hay.includes(text)) return false
    }
    return true
  })
})

function reset() {
  q.value = kind.value = categoryId.value = accountId.value = status.value = from.value = to.value = min.value = max.value = ''
}
const pendingCount = computed(() => results.value.filter((t) => t.status === 'pending').length)
async function confirmAll() {
  for (const t of results.value) if (t.status === 'pending') await confirmTx(t.id)
  ui.notify(`已確認 ${pendingCount.value} 筆`)
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="搜尋" back />
    <div class="search">
      <input v-model="q" type="search" placeholder="備註、分類、帳戶、發票號碼" autofocus />
      <button class="icon-btn" :class="{ on: showFilters }" aria-label="篩選" @click="showFilters = !showFilters">⚙︎</button>
    </div>

    <div v-if="showFilters" class="list">
      <div class="field">
        <label>類型</label>
        <select v-model="kind"><option value="">全部</option><option value="expense">支出</option><option value="income">收入</option><option value="transfer">轉帳</option></select>
      </div>
      <div class="field">
        <label>分類</label>
        <select v-model="categoryId">
          <option value="">全部</option>
          <option v-for="c in catOptions" :key="c.id" :value="c.id">{{ iconText(c.icon) }} {{ c.parentId ? '　' : '' }}{{ c.name }}</option>
        </select>
      </div>
      <div class="field">
        <label>帳戶</label>
        <select v-model="accountId"><option value="">全部</option><option v-for="a in accounts" :key="a.id" :value="a.id">{{ iconText(a.icon) }} {{ a.name }}</option></select>
      </div>
      <div class="field">
        <label>狀態</label>
        <select v-model="status"><option value="">全部</option><option value="pending">待確認</option><option value="confirmed">已確認</option></select>
      </div>
      <div class="field"><label>日期</label><input v-model="from" type="date" /><span class="hint">至</span><input v-model="to" type="date" /></div>
      <div class="field"><label>金額</label><input v-model="min" inputmode="decimal" placeholder="最低" /><span class="hint">–</span><input v-model="max" inputmode="decimal" placeholder="最高" /></div>
    </div>

    <div class="meta small muted">
      <span>{{ results.length }} 筆</span>
      <span>
        <button v-if="status === 'pending' && pendingCount" class="link" @click="confirmAll">全部以估算金額確認</button>
        <button class="link" @click="reset">清除條件</button>
      </span>
    </div>
    <TxList v-if="results.length" :txs="results.slice(0, 500)" :accounts="accountMap" :categories="categoryMap" />
    <div v-else class="empty">找不到符合的交易</div>
    <p v-if="results.length > 500" class="help" style="text-align: center">只顯示前 500 筆，請加條件縮小範圍</p>
  </main>
</template>

<style scoped>
.search { display: flex; gap: 8px; margin-bottom: 10px; }
.search input { flex: 1; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; background: var(--surface); font-size: 1rem; }
.icon-btn.on { background: var(--accent-soft); }
.meta { display: flex; justify-content: space-between; margin: 10px 4px; }
.link { border: 0; background: none; color: var(--accent); padding: 0 0 0 12px; font-size: 0.75rem; }
</style>
