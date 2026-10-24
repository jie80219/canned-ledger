<script setup lang="ts">
import { computed } from 'vue'
import type { Account, AccountType } from '../db/types'
import { useBalances } from '../composables/useBalances'
import { useConverter } from '../composables/useRates'
import { cardSummary } from '../domain/creditCard'
import { today } from '../domain/dates'
import { convert, formatMoney } from '../domain/money'

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
      <RouterLink to="/accounts/new" class="icon-btn" aria-label="新增帳戶">＋</RouterLink>
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
        <div class="section-label">{{ g.label }}</div>
        <div class="list">
          <RouterLink v-for="a in visible.filter((a) => a.type === g.type)" :key="a.id" :to="`/accounts/${a.id}`" class="row">
            <span class="emoji" :style="{ background: a.color + '30' }">{{ a.icon }}</span>
            <span class="grow">
              <div>{{ a.name }} <span v-if="a.currency !== currency" class="badge">{{ a.currency }}</span></div>
              <div v-if="summaries.get(a.id)" class="sub">
                下次繳款 {{ summaries.get(a.id)!.nextDue.slice(5).replace('-', '/') }} ·
                <template v-if="a.credit?.display === 'available'">已刷 {{ formatMoney(summaries.get(a.id)!.debt, a.currency) }}</template>
                <template v-else>可用 {{ formatMoney(summaries.get(a.id)!.available, a.currency) }}</template>
                <template v-if="a.credit?.autopay !== 'off'"> · 自動扣款</template>
              </div>
            </span>
            <span v-if="a.credit?.display === 'available' && summaries.get(a.id)" class="num" :class="{ expense: summaries.get(a.id)!.available < 0 }">
              <span class="small muted">可用</span> {{ formatMoney(summaries.get(a.id)!.available, a.currency) }}
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
          <span class="emoji">{{ a.icon }}</span><span class="grow">{{ a.name }}</span>
          <span class="num">{{ formatMoney(balanceMap.get(a.id) ?? 0, a.currency) }}</span>
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.worth .big { font-size: 1.875rem; font-weight: 700; }
.split { display: flex; gap: 18px; font-size: 0.8125rem; color: var(--muted); margin-top: 4px; }
</style>
