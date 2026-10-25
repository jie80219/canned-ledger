<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/schema'
import { plain } from '../db/factory'
import type { Category, Transaction, TxKind } from '../db/types'
import { confirmTx, deleteTx, reorder, saveCategory, saveTx } from '../db/repo'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import { evaluate } from '../domain/calc'
import { today } from '../domain/dates'
import { CURRENCIES, convert, currency as cinfo, formatMoney, toMajor, toMinor } from '../domain/money'
import { getRate, type RateResult } from '../domain/fx'
import Keypad from '../components/Keypad.vue'
import Sheet from '../components/Sheet.vue'
import TopBar from '../components/TopBar.vue'
import CatIcon from '../components/CatIcon.vue'
import { iconText } from '../icons'

const props = defineProps<{ id?: string }>()
const ui = useUi()
const route = useRoute()
const router = useRouter()
const { accounts, categories, categoryMap, accountMap } = useBook()

const existing = ref<Transaction>()
const kind = ref<Exclude<TxKind, 'adjust'>>('expense')
const expr = ref('')
const inputCurrency = ref('TWD')
const parentId = ref<string>()
const categoryId = ref<string>()
const accountId = ref('')
const toAccountId = ref('')
const toExpr = ref('') // 跨幣別轉帳的轉入金額
const date = ref(today())
const note = ref('')
const overrideExpr = ref('') // 外幣交易的實際入帳金額（可選）
const rate = ref<RateResult | null>(null)
const rateLoading = ref(false)
const showCurrency = ref(false)
const actualExpr = ref('') // 待確認交易的實際金額

const activeAccounts = computed(() => accounts.value.filter((a) => !a.archived || a.id === accountId.value || a.id === toAccountId.value))
// 轉帳只在現金、銀行、電子支付之間；信用卡繳款、證券等其他資產與載具補登不列入（編輯舊資料時保留原本選的）
const transferAccounts = computed(() =>
  activeAccounts.value.filter((a) => (a.includeInNetWorth && ['cash', 'bank', 'ewallet'].includes(a.type)) || a.id === accountId.value || a.id === toAccountId.value),
)
const account = computed(() => accountMap.value.get(accountId.value))
const toAccount = computed(() => accountMap.value.get(toAccountId.value))
const accCur = computed(() => account.value?.currency ?? 'TWD')
const isForeign = computed(() => kind.value !== 'transfer' && inputCurrency.value !== accCur.value)
const crossTransfer = computed(() => kind.value === 'transfer' && !!toAccount.value && toAccount.value.currency !== accCur.value)
const feeRate = computed(() => (kind.value === 'expense' ? account.value?.credit?.foreignFeeRate ?? 0 : 0))

const value = computed(() => Math.max(0, evaluate(expr.value)))
const minor = computed(() => toMinor(value.value, inputCurrency.value))
const converted = computed(() =>
  isForeign.value && rate.value ? convert(minor.value, inputCurrency.value, accCur.value, rate.value.rate, feeRate.value) : null,
)

const topCats = computed(() =>
  categories.value.filter((c) => c.kind === (kind.value === 'income' ? 'income' : 'expense') && !c.parentId && !c.hidden),
)
const subCats = computed(() => (parentId.value ? categories.value.filter((c) => c.parentId === parentId.value && !c.hidden) : []))
const recentCats = ref<string[]>([])
const recentShown = computed(() =>
  recentCats.value.filter((i) => categoryMap.value.get(i)?.kind === kind.value && !categoryMap.value.get(i)?.hidden).slice(0, 5),
)

function pickTop(id: string) {
  if (editing.value) return router.push(`/settings/categories?edit=${id}`)
  parentId.value = id
  categoryId.value = id
}

// 長按分類進入編輯模式（像 iPhone 主畫面）：圖示抖動、拖曳排序、點 − 隱藏、點圖示編輯
const editing = ref(false)
const editList = ref<Category[]>([])
watch([topCats, editing], () => (editList.value = [...topCats.value]), { immediate: true })
let pressTimer: ReturnType<typeof setTimeout> | undefined
let pressAt: { x: number; y: number } | null = null
function pressStart(e: PointerEvent) {
  if (editing.value) return
  pressAt = { x: e.clientX, y: e.clientY }
  clearTimeout(pressTimer)
  pressTimer = setTimeout(() => {
    editing.value = true
    navigator.vibrate?.(10)
    swallowNextClick()
  }, 450)
}
// 長按觸發後手指放開時的那次 click 會落在新出現的編輯圖示上，要吃掉
function swallowNextClick() {
  const eat = (e: Event) => {
    e.stopPropagation()
    e.preventDefault()
  }
  window.addEventListener('click', eat, { capture: true, once: true })
  window.addEventListener('pointerup', () => setTimeout(() => window.removeEventListener('click', eat, true), 400), { once: true })
}
function pressMove(e: PointerEvent) {
  if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 8) pressEnd()
}
function pressEnd() {
  pressAt = null
  clearTimeout(pressTimer)
}
onUnmounted(() => clearTimeout(pressTimer))
const saveCatOrder = () => {
  const k = kind.value === 'income' ? 'income' : 'expense'
  const hiddenTops = categories.value.filter((c) => c.kind === k && !c.parentId && c.hidden)
  return reorder('categories', [...editList.value, ...hiddenTops])
}
async function hideCat(c: Category) {
  await saveCategory({ ...plain(c), hidden: true })
  if (parentId.value === c.id) parentId.value = categoryId.value = ''
  ui.notify(`已隱藏「${c.name}」，可到分類管理恢復`)
}

async function loadRate() {
  if (!isForeign.value && !crossTransfer.value) {
    rate.value = null
    return
  }
  rateLoading.value = true
  const [b, q] = crossTransfer.value ? [accCur.value, toAccount.value!.currency] : [inputCurrency.value, accCur.value]
  rate.value = await getRate(b, q, date.value)
  rateLoading.value = false
}
watch([inputCurrency, accountId, toAccountId, date, kind], loadRate)

// 跨幣別轉帳：自動帶入估算的轉入金額
watch([expr, rate, crossTransfer], () => {
  if (crossTransfer.value && rate.value && !existing.value) {
    const v = convert(toMinor(value.value, accCur.value), accCur.value, toAccount.value!.currency, rate.value.rate)
    toExpr.value = String(toMajor(v, toAccount.value!.currency))
  }
})

let hydrating = true
watch(kind, (k, old) => {
  if (!hydrating && old && k !== old) {
    parentId.value = undefined
    categoryId.value = undefined
  }
})

onMounted(async () => {
  const bookTxs = await db.transactions.where('bookId').equals(ui.bookId).reverse().sortBy('createdAt')
  const counts = new Map<string, number>()
  for (const t of bookTxs.slice(0, 80)) if (t.categoryId) counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1)
  recentCats.value = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)

  const copyFrom = route.query.copy ? await db.transactions.get(String(route.query.copy)) : undefined
  const src = props.id ? await db.transactions.get(props.id) : copyFrom
  if (props.id && !src) return router.replace('/')
  if (src) {
    if (props.id) existing.value = src
    kind.value = src.kind === 'adjust' ? 'income' : src.kind
    accountId.value = src.accountId
    toAccountId.value = src.toAccountId ?? ''
    const acc = await db.accounts.get(src.accountId)
    if (src.original) {
      inputCurrency.value = src.original.currency
      expr.value = String(toMajor(src.original.amount, src.original.currency))
      overrideExpr.value = String(toMajor(src.amount, acc?.currency ?? 'TWD'))
    } else {
      inputCurrency.value = acc?.currency ?? 'TWD'
      expr.value = String(toMajor(src.amount, inputCurrency.value))
    }
    if (src.toAccountId && src.toAmount !== undefined) {
      const to = await db.accounts.get(src.toAccountId)
      toExpr.value = String(toMajor(src.toAmount, to?.currency ?? 'TWD'))
    }
    const c = src.categoryId ? await db.categories.get(src.categoryId) : undefined
    categoryId.value = c?.id
    parentId.value = c?.parentId ?? c?.id
    note.value = src.note
    date.value = props.id ? src.date : today()
    actualExpr.value = String(toMajor(src.amount, acc?.currency ?? 'TWD'))
  } else {
    if (route.query.kind === 'income' || route.query.kind === 'transfer') kind.value = route.query.kind
    const last = bookTxs[0]
    const acc = (last && accountMap.value.get(last.accountId)) || (await db.accounts.where('bookId').equals(ui.bookId).first())
    accountId.value = (route.query.account as string) || acc?.id || ''
    inputCurrency.value = (await db.accounts.get(accountId.value))?.currency ?? 'TWD'
  }
  loadRate()
  await nextTick()
  hydrating = false
})

const canSave = computed(
  () =>
    value.value > 0 &&
    !!accountId.value &&
    (kind.value !== 'transfer' || (!!toAccountId.value && toAccountId.value !== accountId.value)),
)

async function save(again = false) {
  if (!canSave.value) {
    ui.notify(value.value <= 0 ? '請輸入金額' : kind.value === 'transfer' ? '請選擇不同的轉入帳戶' : '請選擇帳戶')
    return
  }
  const base: Partial<Transaction> = existing.value ? plain(existing.value) : {}
  const tx: Parameters<typeof saveTx>[0] = {
    ...base,
    bookId: existing.value?.bookId ?? ui.bookId,
    kind: kind.value,
    date: date.value,
    accountId: accountId.value,
    note: note.value.trim(),
    amount: minor.value,
    categoryId: kind.value === 'transfer' ? undefined : categoryId.value,
    toAccountId: kind.value === 'transfer' ? toAccountId.value : undefined,
    toAmount: undefined,
    original: undefined,
  }
  if (isForeign.value) {
    const override = overrideExpr.value ? toMinor(Math.max(0, evaluate(overrideExpr.value)), accCur.value) : null
    const amount = override ?? converted.value
    if (amount === null) {
      ui.notify('取不到匯率，請填入實際入帳金額')
      return
    }
    tx.amount = amount
    tx.original = {
      currency: inputCurrency.value,
      amount: minor.value,
      rate: override ? toMajor(override, accCur.value) / value.value : rate.value!.rate,
      rateDate: rate.value?.date ?? date.value,
      rateSource: override ? '手動輸入' : rate.value!.source,
      feeRate: override ? 0 : feeRate.value,
    }
  }
  if (crossTransfer.value) tx.toAmount = toMinor(Math.max(0, evaluate(toExpr.value)), toAccount.value!.currency)
  await saveTx(tx)
  ui.notify(existing.value ? '已更新' : '已記一筆')
  if (again) {
    expr.value = ''
    note.value = ''
    overrideExpr.value = ''
  } else router.back()
}

async function remove() {
  if (!existing.value) return
  await deleteTx(existing.value.id)
  ui.notify('已刪除')
  router.back()
}

async function confirmPending() {
  const tx = existing.value!
  const acc = accountMap.value.get(tx.accountId)!
  const actual = toMinor(Math.max(0, evaluate(actualExpr.value)), acc.currency)
  await confirmTx(tx.id, actual, {
    originalDecimals: tx.original ? cinfo(tx.original.currency).decimals : undefined,
    accountDecimals: cinfo(acc.currency).decimals,
    sameCurrency: !tx.toAccountId || accountMap.value.get(tx.toAccountId)?.currency === acc.currency,
  })
  ui.notify('已確認')
  router.back()
}

const title = computed(() => (existing.value ? '編輯' : '記一筆'))
</script>

<template>
  <main class="page no-nav editor">
    <TopBar :title="title" back>
      <RouterLink v-if="existing" :to="`/add?copy=${existing.id}`" class="icon-btn" aria-label="複製">⧉</RouterLink>
    </TopBar>

    <div v-if="existing?.status === 'pending'" class="card pending-card">
      <div><span class="badge pending">待確認</span> {{ existing.pendingReason }}</div>
      <div v-if="existing.original" class="small muted" style="margin-top: 4px">
        原幣 {{ formatMoney(existing.original.amount, existing.original.currency) }} · 估算匯率 {{ existing.original.rate.toFixed(4) }}
        <template v-if="existing.original.feeRate"> · 含手續費 {{ (existing.original.feeRate * 100).toFixed(1) }}%</template>
      </div>
      <div class="confirm-row">
        <label class="small">實際{{ existing.kind === 'transfer' ? '扣款' : '入帳' }}金額（{{ accCur }}）</label>
        <input v-model="actualExpr" inputmode="decimal" class="actual" />
        <button class="btn" @click="confirmPending">確認</button>
      </div>
    </div>

    <div class="seg kinds">
      <button :class="{ on: kind === 'expense' }" @click="kind = 'expense'">支出</button>
      <button :class="{ on: kind === 'income' }" @click="kind = 'income'">收入</button>
      <button :class="{ on: kind === 'transfer' }" @click="kind = 'transfer'">轉帳</button>
    </div>

    <div class="amount card">
      <button v-if="kind !== 'transfer'" class="cur-btn" @click="showCurrency = true">{{ inputCurrency }} ▾</button>
      <span v-else class="cur-btn static">{{ accCur }}</span>
      <div class="value num" :class="kind">{{ expr || '0' }}</div>
    </div>
    <RouterLink v-if="kind === 'transfer' && !existing" :to="`/swipe?from=${accountId}`" replace class="swipe-link small">改用滑滑轉帳 ›</RouterLink>
    <div v-if="isForeign" class="fx small">
      <template v-if="rateLoading">取得匯率中…</template>
      <template v-else-if="rate">
        ≈ <b class="num">{{ formatMoney(converted ?? 0, accCur) }}</b>
        <span class="muted">（1 {{ inputCurrency }} = {{ rate.rate.toFixed(4) }} {{ accCur }} · {{ rate.date }}{{ rate.stale ? ' 離線快取' : '' }}<template v-if="feeRate"> · 含海外手續費 {{ (feeRate * 100).toFixed(1) }}%</template>）</span>
      </template>
      <template v-else><span class="expense">取不到匯率，請填入實際入帳金額</span></template>
    </div>

    <template v-if="kind !== 'transfer'">
      <template v-if="recentShown.length && !existing && !editing">
        <div class="small muted recent-label">最近使用</div>
        <div class="cat-grid recent">
          <button v-for="id in recentShown" :key="id" class="cat" :class="{ on: categoryId === id }" @click="categoryId = id; parentId = categoryMap.get(id)?.parentId ?? id">
            <CatIcon :icon="categoryMap.get(id)?.icon" :color="categoryMap.get(id)?.color" :size="46" />
            <span>{{ categoryMap.get(id)?.name }}</span>
          </button>
        </div>
        <div class="small muted recent-label">全部分類</div>
      </template>
      <div v-if="editing" class="edit-bar">
        <span class="small muted">拖曳排序 · 點圖示編輯 · 點 − 隱藏</span>
        <button type="button" class="done" @click="editing = false">完成</button>
      </div>
      <VueDraggable v-if="editing" v-model="editList" class="cat-grid jiggle" :animation="200" :force-fallback="true" @end="saveCatOrder">
        <div v-for="(c, i) in editList" :key="c.id" class="cat" :style="{ animationDelay: `${(i % 3) * -0.09}s` }" @click="pickTop(c.id)">
          <span class="icon-wrap">
            <CatIcon :icon="c.icon" :color="c.color" :size="46" />
            <button type="button" class="minus" aria-label="隱藏" @click.stop="hideCat(c)" @pointerdown.stop>−</button>
          </span>
          <span>{{ c.name }}</span>
        </div>
        <template #footer>
          <RouterLink :to="`/settings/categories?new=${kind === 'income' ? 'income' : 'expense'}`" class="cat add-tile">
            <span class="add-icon">＋</span>
            <span>新增</span>
          </RouterLink>
        </template>
      </VueDraggable>
      <div v-else class="cat-grid">
        <button
          v-for="c in topCats"
          :key="c.id"
          class="cat"
          :class="{ on: parentId === c.id }"
          @click="pickTop(c.id)"
          @pointerdown="pressStart"
          @pointermove="pressMove"
          @pointerup="pressEnd"
          @pointercancel="pressEnd"
          @pointerleave="pressEnd"
          @contextmenu.prevent
        >
          <CatIcon :icon="c.icon" :color="c.color" :size="46" />
          <span>{{ c.name }}</span>
        </button>
      </div>
      <div v-if="subCats.length && !editing" class="chips subs">
        <button v-for="c in subCats" :key="c.id" class="chip" :class="{ on: categoryId === c.id }" @click="categoryId = categoryId === c.id ? parentId : c.id">
          <CatIcon :icon="c.icon" :color="c.color" :size="24" /> {{ c.name }}
        </button>
      </div>
    </template>

    <div class="list">
      <div class="field">
        <label>{{ kind === 'transfer' ? '轉出帳戶' : '帳戶' }}</label>
        <select v-model="accountId">
          <option v-for="a in kind === 'transfer' ? transferAccounts : activeAccounts" :key="a.id" :value="a.id">{{ iconText(a.icon) }} {{ a.name }}（{{ a.currency }}）</option>
        </select>
      </div>
      <div v-if="kind === 'transfer'" class="field">
        <label>轉入帳戶</label>
        <select v-model="toAccountId">
          <option value="" disabled>選擇帳戶</option>
          <option v-for="a in transferAccounts.filter((a) => a.id !== accountId)" :key="a.id" :value="a.id">{{ iconText(a.icon) }} {{ a.name }}（{{ a.currency }}）</option>
        </select>
      </div>
      <div v-if="crossTransfer" class="field">
        <label>轉入金額</label>
        <input v-model="toExpr" inputmode="decimal" />
        <span class="hint">{{ toAccount?.currency }}</span>
      </div>
      <div v-if="isForeign" class="field">
        <label>實際入帳</label>
        <input v-model="overrideExpr" inputmode="decimal" :placeholder="converted !== null ? `留空用估算 ${toMajor(converted, accCur)}` : '必填'" />
        <span class="hint">{{ accCur }}</span>
      </div>
      <div class="field">
        <label>日期</label>
        <input v-model="date" type="date" required />
      </div>
      <div class="field">
        <label>備註</label>
        <input v-model="note" placeholder="寫點什麼…" maxlength="200" />
      </div>
    </div>

    <div class="actions">
      <button v-if="existing" class="btn danger" @click="remove">刪除</button>
      <button v-else class="btn ghost" @click="save(true)">再記一筆</button>
    </div>

    <div class="pad-wrap">
      <Keypad v-model="expr" :decimals="cinfo(kind === 'transfer' ? accCur : inputCurrency).decimals" @submit="save()" />
    </div>

    <Sheet v-if="showCurrency" title="幣別" @close="showCurrency = false">
      <div class="list">
        <button v-for="c in CURRENCIES" :key="c.code" class="row" @click="inputCurrency = c.code; showCurrency = false">
          <span class="grow">{{ c.code }} <span class="sub">{{ c.name }}</span></span>
          <span v-if="c.code === accCur" class="badge">帳戶幣別</span>
          <span v-if="c.code === inputCurrency">✓</span>
        </button>
      </div>
    </Sheet>
  </main>
</template>

<style scoped>
.editor { padding-bottom: calc(260px + var(--safe-b)); }
.kinds { margin-bottom: 10px; }
.amount { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin-bottom: 6px; }
.cur-btn { border: 0; background: var(--surface-2); border-radius: 10px; padding: 6px 10px; font-weight: 600; font-size: 0.8125rem; }
.cur-btn.static { color: var(--muted); }
.value { flex: 1; text-align: right; font-size: 2.125rem; font-weight: 700; overflow-x: auto; white-space: nowrap; }
.value.transfer { color: var(--text); }
.fx { margin: 0 6px 10px; }
.swipe-link { display: block; text-align: right; margin: -4px 6px 10px; color: var(--accent); text-decoration: none; }
.recent-label { margin: 2px 4px 6px; }
.cat { -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; }
.edit-bar { display: flex; align-items: center; justify-content: space-between; margin: 0 4px 8px; }
.edit-bar .done { border: 0; background: var(--accent); color: #fff; font: inherit; font-weight: 600; border-radius: 99px; padding: 5px 14px; }
.jiggle .cat { position: relative; cursor: grab; animation: jiggle 0.26s ease-in-out infinite alternate; }
.jiggle .sortable-chosen, .jiggle .sortable-ghost { animation: none; }
.jiggle .sortable-ghost { opacity: 0.35; }
.icon-wrap { position: relative; display: inline-block; }
.minus { position: absolute; top: -7px; left: -7px; width: 22px; height: 22px; border-radius: 50%; border: 0; padding: 0; background: color-mix(in srgb, var(--text) 70%, transparent); color: var(--bg); font-size: 1rem; line-height: 22px; font-weight: 700; }
.add-tile { text-decoration: none; color: var(--muted); }
.add-icon { width: 46px; height: 46px; border-radius: 14px; border: 1.5px dashed var(--border); display: grid; place-items: center; font-size: 1.25rem; }
@keyframes jiggle { from { transform: rotate(-2.2deg); } to { transform: rotate(2.2deg); } }
@media (prefers-reduced-motion: reduce) { .jiggle .cat { animation: none; } }
.cat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px 4px; margin-bottom: 10px; }
.cat { border: 0; background: transparent; display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 0.75rem; padding: 2px 0; }
.cat .cat-icon { transition: transform 0.1s; }
.cat.on .cat-icon { transform: scale(1.06); box-shadow: 0 0 0 2px currentColor; }
.chip { white-space: nowrap; }
.chip .cat-icon { vertical-align: -0.3em; border-radius: 6px; }
.cat.on { font-weight: 600; }
.subs { margin-bottom: 12px; }
.actions { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.pad-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 12px calc(10px + var(--safe-b));
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid var(--border);
  z-index: 10;
}
.pad-wrap > * { max-width: 536px; margin: 0 auto; }
.pending-card { border: 1px solid color-mix(in srgb, var(--pending) 40%, transparent); }
.confirm-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.actual { flex: 1; min-width: 100px; border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; background: var(--bg); }
</style>
