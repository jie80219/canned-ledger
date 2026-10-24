<script setup lang="ts">
import { computed } from 'vue'
import type { Account, Category, Transaction } from '../db/types'
import { labelDay } from '../domain/dates'
import { formatMoney } from '../domain/money'

const props = defineProps<{
  txs: Transaction[]
  accounts: Map<string, Account>
  categories: Map<string, Category>
  showDayTotal?: boolean
}>()

const groups = computed(() => {
  const map = new Map<string, Transaction[]>()
  for (const t of [...props.txs].sort((a, b) => (b.date + (b.time ?? '') + b.createdAt).localeCompare(a.date + (a.time ?? '') + a.createdAt))) {
    const g = map.get(t.date) ?? []
    g.push(t)
    map.set(t.date, g)
  }
  return [...map.entries()]
})

function cur(t: Transaction) {
  return props.accounts.get(t.accountId)?.currency ?? 'TWD'
}

function title(t: Transaction) {
  if (t.kind === 'transfer') {
    const to = props.accounts.get(t.toAccountId ?? '')
    return `${props.accounts.get(t.accountId)?.name ?? '?'} → ${to?.name ?? '?'}`
  }
  if (t.kind === 'adjust') return '餘額調整'
  const c = props.categories.get(t.categoryId ?? '')
  return c?.name ?? '未分類'
}

function icon(t: Transaction) {
  if (t.kind === 'transfer') return t.autopayOf ? '💳' : '🔁'
  if (t.kind === 'adjust') return '⚖️'
  return props.categories.get(t.categoryId ?? '')?.icon ?? '📦'
}

function dayExpense(list: Transaction[]) {
  // 日小計只在同幣別時有意義，取第一筆的幣別
  const c = cur(list[0])
  return list.filter((t) => t.kind === 'expense' && cur(t) === c).reduce((s, t) => s + t.amount, 0)
}
</script>

<template>
  <div v-for="[date, list] in groups" :key="date">
    <div class="card-title">
      <span>{{ labelDay(date) }}</span>
      <span v-if="showDayTotal && dayExpense(list)" class="num">支出 {{ formatMoney(dayExpense(list), cur(list[0])) }}</span>
    </div>
    <div class="list">
      <RouterLink v-for="t in list" :key="t.id" :to="`/tx/${t.id}`" class="row">
        <span class="emoji" :style="{ background: (categories.get(t.categoryId ?? '')?.color ?? '#999') + '26' }">{{ icon(t) }}</span>
        <span class="grow">
          <div>
            {{ title(t) }}
            <span v-if="t.status === 'pending'" class="badge pending">待確認</span>
            <span v-else-if="t.recurringId" class="badge">週期</span>
          </div>
          <div class="sub">
            <template v-if="t.kind !== 'transfer'">{{ accounts.get(t.accountId)?.name }}</template>
            <template v-if="t.original"> · {{ formatMoney(t.original.amount, t.original.currency) }}</template>
            <template v-if="t.note"> · {{ t.note }}</template>
          </div>
        </span>
        <span class="num" :class="t.kind === 'expense' ? 'expense' : t.kind === 'income' ? 'income' : 'muted'">
          {{ formatMoney(t.kind === 'expense' ? -t.amount : t.amount, cur(t), { sign: t.kind === 'income' }) }}
        </span>
      </RouterLink>
    </div>
  </div>
</template>
