<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/schema'
import { confirmTx, deleteTx } from '../db/repo'
import type { Account, Category, Transaction } from '../db/types'
import { labelDay } from '../domain/dates'
import { formatMoney } from '../domain/money'
import CatIcon from './CatIcon.vue'
import SwipeRow, { type SwipeAction } from './SwipeRow.vue'

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

// 左右滑動：左滑刪除（可復原）、右滑複製；待確認的多一個確認
const router = useRouter()
const openRow = ref<{ id: string; side: 'left' | 'right' } | null>(null)
const undo = ref<Transaction | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(timer))

async function remove(t: Transaction) {
  await deleteTx(t.id)
  undo.value = t
  clearTimeout(timer)
  timer = setTimeout(() => (undo.value = null), 5000)
}
async function restore() {
  if (!undo.value) return
  await db.transactions.add(JSON.parse(JSON.stringify(undo.value)))
  undo.value = null
}
const leftActs = (t: Transaction): SwipeAction[] => [
  { label: '複製', color: 'var(--accent)', run: () => router.push(`/add?copy=${t.id}`) },
  ...(t.status === 'pending' ? [{ label: '確認', color: '#5b8db8', run: () => confirmTx(t.id) }] : []),
]
const rightActs = (t: Transaction): SwipeAction[] => [{ label: '刪除', color: 'var(--expense)', run: () => remove(t) }]

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
      <SwipeRow
        v-for="t in list"
        :key="t.id"
        :left="leftActs(t)"
        :right="rightActs(t)"
        :open="openRow?.id === t.id ? openRow.side : null"
        @open="(side) => (openRow = side ? { id: t.id, side } : null)"
      >
        <RouterLink :to="`/tx/${t.id}`" class="row" draggable="false">
          <CatIcon :icon="icon(t)" :color="categories.get(t.categoryId ?? '')?.color" :size="38" />
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
      </SwipeRow>
    </div>
  </div>
  <div v-if="undo" class="undo">
    <span>已刪除「{{ title(undo) }}」</span>
    <button type="button" @click="restore">復原</button>
  </div>
</template>

<style scoped>
.list > .swipe + .swipe { border-top: 1px solid var(--border); }
.undo {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-h) + var(--safe-b) + 16px);
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 480px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--text);
  color: var(--bg);
  z-index: 60;
}
.undo span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.undo button { border: 0; background: transparent; color: var(--accent-soft); font: inherit; font-weight: 700; }
</style>
