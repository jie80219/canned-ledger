<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Account, AccountType } from '../db/types'
import { useBalances } from '../composables/useBalances'
import { useConverter } from '../composables/useRates'
import { cardSummary } from '../domain/creditCard'
import { today } from '../domain/dates'
import { convert, formatMoney } from '../domain/money'
import { reorder } from '../db/repo'
import CatIcon from '../components/CatIcon.vue'

const { accounts, currency, allTxs, balanceMap } = useBalances()
const { rates } = useConverter(accounts, currency)

const GROUPS: Array<{ type: AccountType; label: string }> = [
  { type: 'cash', label: '現金' },
  { type: 'bank', label: '銀行' },
  { type: 'ewallet', label: '電子支付' },
  { type: 'credit', label: '信用卡' },
  { type: 'asset', label: '其他資產' },
  { type: 'liability', label: '負債' },
]

const visible = computed(() => accounts.value.filter((a) => !a.archived))

// 排序模式：每組各自一份可拖曳的清單，存的時候照分組順序整串寫回
const sorting = ref(false)
const groupLists = ref<Record<string, Account[]>>({})
watch(visible, (v) => (groupLists.value = Object.fromEntries(GROUPS.map((g) => [g.type, v.filter((a) => a.type === g.type)]))), { immediate: true })
const saveOrder = () => reorder('accounts', GROUPS.flatMap((g) => groupLists.value[g.type] ?? []))

const archived = computed(() => accounts.value.filter((a) => a.archived))

function toBook(a: Account, v: number) {
  return a.currency === currency.value ? v : convert(v, a.currency, currency.value, rates.value.get(a.currency) ?? 1)
}

const worth = computed(() => {
  let assets = 0
  let debts = 0
  for (const a of visible.value) {
    if (!a.includeInNetWorth) continue
    const v = toBook(a, balanceMap.value.get(a.id) ?? 0)
    if (v >= 0) assets += v
    else debts -= v
  }
  return { assets, debts, net: assets - debts }
})

// 各類別總計（換算成帳本幣別，與淨資產一樣不含不計入淨資產的帳戶）
const groupTotal = (type: AccountType) =>
  visible.value.filter((a) => a.type === type && a.includeInNetWorth).reduce((s, a) => s + toBook(a, balanceMap.value.get(a.id) ?? 0), 0)

const summaries = computed(() => {
  const t = today()
  const m = new Map<string, ReturnType<typeof cardSummary>>()
  for (const a of visible.value) {
    if (a.type !== 'credit' || !a.credit) continue
    const txs = allTxs.value.filter((x) => x.accountId === a.id || x.toAccountId === a.id)
    m.set(a.id, cardSummary(a.id, a.initialBalance, a.credit, txs, t))
  }
  return m
})
</script>

<template>
  <main class="page">
    <header class="topbar">
      <h1>帳戶</h1>
      <button v-if="visible.length > 1" class="text-btn" @click="sorting = !sorting">{{ sorting ? '完成' : '排序' }}</button>
      <RouterLink v-if="!sorting && visible.length > 1" to="/swipe" class="text-btn">滑滑轉帳</RouterLink>
      <RouterLink v-if="!sorting" to="/accounts/new" class="icon-btn" aria-label="新增帳戶">＋</RouterLink>
    </header>

    <section class="card worth">
      <div class="small muted">淨資產</div>
      <div class="big num">{{ formatMoney(worth.net, currency) }}</div>
      <div class="split">
        <span>資產 <b class="num income">{{ formatMoney(worth.assets, currency) }}</b></span>
        <span>負債 <b class="num expense">{{ formatMoney(worth.debts, currency) }}</b></span>
      </div>
    </section>

    <template v-for="g in GROUPS" :key="g.type">
      <template v-if="visible.some((a) => a.type === g.type)">
        <div class="section-label group-head">{{ g.label }}<span class="num" :class="{ expense: groupTotal(g.type) < 0 }">{{ formatMoney(groupTotal(g.type), currency) }}</span></div>
        <VueDraggable v-if="sorting" v-model="groupLists[g.type]" class="list" handle=".handle" :animation="150" :force-fallback="true" @end="saveOrder">
          <div v-for="a in groupLists[g.type]" :key="a.id" class="row">
            <CatIcon :icon="a.icon" :color="a.color" :size="38" />
            <span class="grow">{{ a.name }}</span>
            <span class="handle" aria-label="拖曳排序">≡</span>
          </div>
        </VueDraggable>
        <div v-else class="list">
          <RouterLink v-for="a in visible.filter((a) => a.type === g.type)" :key="a.id" :to="`/accounts/${a.id}`" class="row">
            <CatIcon :icon="a.icon" :color="a.color" :size="38" />
            <span class="grow">
              <div>{{ a.name }} <span v-if="a.currency !== currency" class="badge">{{ a.currency }}</span></div>
              <div v-if="summaries.get(a.id)" class="sub">
                下次繳款 {{ summaries.get(a.id)!.nextDue.slice(5).replace('-', '/') }} ·
                <template v-if="a.credit?.display === 'available'">未出帳 {{ formatMoney(-summaries.get(a.id)!.unbilled, a.currency) }}</template>
                <template v-else>可用 {{ formatMoney(summaries.get(a.id)!.available, a.currency) }}</template>
                <template v-if="a.credit?.autopay !== 'off'"> · 自動扣款</template>
              </div>
            </span>
            <span v-if="summaries.get(a.id)" class="card-amt num">
              <span v-if="a.credit?.display === 'available'" :class="{ expense: summaries.get(a.id)!.available < 0 }">
                <span class="small muted">可用</span> {{ formatMoney(summaries.get(a.id)!.available, a.currency) }}
              </span>
              <span v-else :class="{ expense: summaries.get(a.id)!.unbilled > 0 }">
                <span class="small muted">未出帳</span> {{ formatMoney(-summaries.get(a.id)!.unbilled, a.currency) }}
              </span>
              <span v-if="summaries.get(a.id)!.billedUnpaid" class="small expense">待繳 {{ formatMoney(summaries.get(a.id)!.billedUnpaid, a.currency) }}</span>
            </span>
            <span v-else class="num" :class="{ expense: (balanceMap.get(a.id) ?? 0) < 0 }">{{ formatMoney(balanceMap.get(a.id) ?? 0, a.currency) }}</span>
            <span class="chev">›</span>
          </RouterLink>
        </div>
      </template>
    </template>

    <template v-if="archived.length">
      <div class="section-label">已封存</div>
      <div class="list">
        <RouterLink v-for="a in archived" :key="a.id" :to="`/accounts/${a.id}`" class="row muted">
          <CatIcon :icon="a.icon" :color="a.color" :size="38" /><span class="grow">{{ a.name }}</span>
          <span class="num">{{ formatMoney(balanceMap.get(a.id) ?? 0, a.currency) }}</span>
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.topbar .text-btn { text-decoration: none; }
.topbar button.text-btn { margin-left: auto; border: 0; background: transparent; color: var(--accent); font: inherit; font-weight: 600; padding: 6px 8px; }
.handle { flex: none; width: 34px; height: 34px; display: grid; place-items: center; color: var(--muted); font-size: 1.25rem; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }
.sortable-ghost { opacity: 0.4; }
.worth .big { font-size: 1.875rem; font-weight: 700; }
.card-amt { display: flex; flex-direction: column; align-items: flex-end; white-space: nowrap; }
.group-head { display: flex; justify-content: space-between; align-items: baseline; }
.group-head .num { font-size: 0.875rem; font-weight: 600; color: var(--text); }
.group-head .num.expense { color: var(--expense); }
.split { display: flex; gap: 18px; font-size: 0.8125rem; color: var(--muted); margin-top: 4px; }
</style>
