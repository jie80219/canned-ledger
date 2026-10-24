<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { saveTx } from '../db/repo'
import { useBalances } from '../composables/useBalances'
import { useUi } from '../stores/ui'
import { cardSummary, computeDue, cycleContaining, previousCycle, type Cycle } from '../domain/creditCard'
import { addDays, clampDay, fmt, parse, shiftYM, today } from '../domain/dates'
import { formatMoney, toMajor, toMinor } from '../domain/money'
import { evaluate } from '../domain/calc'
import TopBar from '../components/TopBar.vue'
import TxList from '../components/TxList.vue'
import Sheet from '../components/Sheet.vue'

const props = defineProps<{ id: string }>()
const ui = useUi()
const router = useRouter()
const { accountMap, categoryMap, allTxs, balanceMap } = useBalances()

const account = computed(() => accountMap.value.get(props.id))
const balance = computed(() => balanceMap.value.get(props.id) ?? 0)
const myTxs = computed(() => allTxs.value.filter((t) => t.accountId === props.id || t.toAccountId === props.id))
const cur = computed(() => account.value?.currency ?? 'TWD')

const summary = computed(() =>
  account.value?.credit ? cardSummary(props.id, account.value.initialBalance, account.value.credit, myTxs.value, today()) : null,
)

// 信用卡：依帳單週期瀏覽；其他帳戶：依月份
const cycle = ref<Cycle>()
watch(
  () => account.value?.credit,
  (c) => {
    if (c && !cycle.value) cycle.value = cycleContaining(c, today())
  },
  { immediate: true },
)
function shiftCycle(n: number) {
  const c = account.value!.credit!
  cycle.value = n < 0 ? previousCycle(c, cycle.value!) : cycleContaining(c, addDays(cycle.value!.end, 1))
}
const cycleDue = computed(() =>
  cycle.value && account.value?.credit
    ? computeDue(props.id, account.value.initialBalance, account.value.credit, myTxs.value, cycle.value)
    : null,
)
const cycleClosed = computed(() => !!cycle.value && cycle.value.end < today())

const t = parse(today())
const ym = ref({ y: t.y, m: t.m })
const range = computed(() =>
  cycle.value && account.value?.credit
    ? { start: cycle.value.start, end: cycle.value.end }
    : { start: fmt(ym.value.y, ym.value.m, 1), end: clampDay(ym.value.y, ym.value.m, 31) },
)
const listTxs = computed(() => myTxs.value.filter((x) => x.date >= range.value.start && x.date <= range.value.end))
const cycleSpend = computed(() =>
  listTxs.value.reduce((s, x) => s + (x.accountId === props.id && x.kind === 'expense' ? x.amount : 0), 0),
)

// 餘額調整
const showAdjust = ref(false)
const target = ref('')
function openAdjust() {
  target.value = String(toMajor(balance.value, cur.value))
  showAdjust.value = true
}
async function adjust() {
  const raw = target.value.trim()
  const neg = raw.startsWith('-')
  const want = toMinor(evaluate(raw.replace(/^-/, '')), cur.value) * (neg ? -1 : 1)
  const diff = want - balance.value
  if (diff) {
    await saveTx({ bookId: account.value!.bookId, kind: 'adjust', date: today(), amount: diff, accountId: props.id, note: '餘額調整' })
    ui.notify('已調整餘額')
  }
  showAdjust.value = false
}
const lbl = (d: string) => d.slice(5).replace('-', '/')
</script>

<template>
  <main v-if="account" class="page no-nav">
    <TopBar :title="account.name" back>
      <RouterLink :to="`/accounts/${id}/edit`" class="icon-btn" aria-label="編輯">✎</RouterLink>
    </TopBar>

    <section class="card head">
      <span class="emoji big-emoji" :style="{ background: account.color + '30' }">{{ account.icon }}</span>
      <div>
        <div class="small muted">{{ account.credit ? '目前欠款' : '目前餘額' }}</div>
        <div class="bal num" :class="{ expense: balance < 0 }">
          {{ formatMoney(account.credit ? Math.max(0, -balance) : balance, cur) }}
        </div>
      </div>
    </section>

    <template v-if="summary && account.credit">
      <section class="card grid4">
        <div><span class="small muted">已出帳未繳</span><b class="num">{{ formatMoney(summary.billedUnpaid, cur) }}</b></div>
        <div><span class="small muted">未出帳消費</span><b class="num">{{ formatMoney(summary.unbilled, cur) }}</b></div>
        <div><span class="small muted">可用額度</span><b class="num">{{ formatMoney(summary.available, cur) }}</b></div>
        <div><span class="small muted">下次繳款日</span><b class="num">{{ summary.nextDue }}</b></div>
      </section>
      <div class="banner" :class="{ pending: account.credit.autopay === 'off' }">
        <span>{{ account.credit.autopay === 'off' ? '💡' : '🤖' }}</span>
        <span class="grow small">
          <template v-if="account.credit.autopay === 'off'">尚未開啟自動扣款。到「編輯」設定扣款帳戶，繳款日就會自動從銀行轉帳。</template>
          <template v-else>
            每月 {{ account.credit.dueDay }} 號自動從「{{ accountMap.get(account.credit.payFromAccountId ?? '')?.name ?? '?' }}」扣{{ account.credit.autopay === 'full' ? '全額' : '最低應繳' }}{{ account.credit.autopayConfirm ? '（扣款前先待確認）' : '' }}
          </template>
        </span>
      </div>
    </template>

    <div class="btns">
      <RouterLink v-if="account.credit" :to="`/add?kind=transfer&account=${account.credit.payFromAccountId ?? ''}`" class="btn ghost">手動繳款</RouterLink>
      <RouterLink :to="`/add?account=${id}`" class="btn ghost">記一筆</RouterLink>
      <button class="btn ghost" @click="openAdjust">調整餘額</button>
    </div>

    <div class="nav-row">
      <template v-if="cycle && account.credit">
        <button class="icon-btn" aria-label="上一期" @click="shiftCycle(-1)">‹</button>
        <div class="center">
          <b>{{ lbl(cycle.start) }} – {{ lbl(cycle.end) }} 帳單</b>
          <div class="small muted">
            繳款日 {{ cycle.due }} ·
            <template v-if="cycleClosed && cycleDue">結帳 {{ formatMoney(cycleDue.statement, cur) }}，尚需繳 {{ formatMoney(cycleDue.due, cur) }}</template>
            <template v-else>本期消費 {{ formatMoney(cycleSpend, cur) }}（未結帳）</template>
          </div>
        </div>
        <button class="icon-btn" aria-label="下一期" @click="shiftCycle(1)">›</button>
      </template>
      <template v-else>
        <button class="icon-btn" aria-label="上個月" @click="ym = shiftYM(ym.y, ym.m, -1)">‹</button>
        <b>{{ ym.y }} 年 {{ ym.m }} 月</b>
        <button class="icon-btn" aria-label="下個月" @click="ym = shiftYM(ym.y, ym.m, 1)">›</button>
      </template>
    </div>

    <TxList v-if="listTxs.length" :txs="listTxs" :accounts="accountMap" :categories="categoryMap" />
    <div v-else class="empty">這段期間沒有交易</div>

    <Sheet v-if="showAdjust" title="調整餘額" @close="showAdjust = false">
      <p class="help" style="margin: 0 4px 12px">輸入實際餘額，差額會記成一筆「餘額調整」。{{ account.credit ? '信用卡欠款請輸入負數。' : '' }}</p>
      <div class="list">
        <div class="field"><label>實際餘額</label><input v-model="target" inputmode="decimal" /><span class="hint">{{ cur }}</span></div>
      </div>
      <button class="btn block" @click="adjust">確定</button>
    </Sheet>
  </main>
  <main v-else class="page"><TopBar title="帳戶" back /><div class="empty">找不到帳戶</div></main>
</template>

<style scoped>
.head { display: flex; align-items: center; gap: 14px; }
.big-emoji { width: 52px; height: 52px; font-size: 26px; border-radius: 16px; }
.bal { font-size: 28px; font-weight: 700; }
.grid4 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid4 div { display: flex; flex-direction: column; }
.btns { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.btns .btn { flex: 1; text-align: center; padding: 10px; font-size: 14px; white-space: nowrap; }
.nav-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin: 8px 0; }
.center { text-align: center; flex: 1; }
.grow { flex: 1; }
</style>
