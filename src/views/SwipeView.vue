<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Account } from '../db/types'
import { deleteTx, saveTx } from '../db/repo'
import { useBalances } from '../composables/useBalances'
import { useUi } from '../stores/ui'
import { evaluate } from '../domain/calc'
import { addDays, today } from '../domain/dates'
import { currency as cinfo, formatMoney, toMinor } from '../domain/money'
import CatIcon from '../components/CatIcon.vue'
import Keypad from '../components/Keypad.vue'
import Sheet from '../components/Sheet.vue'
import TopBar from '../components/TopBar.vue'

const ui = useUi()
const route = useRoute()
const { accounts, allTxs, balanceMap } = useBalances()

const usable = computed(() => accounts.value.filter((a) => !a.archived))
const fromId = ref(String(route.query.from ?? ''))
watch(usable, (v) => {
  if (!v.some((a) => a.id === fromId.value)) fromId.value = (v.find((a) => a.type === 'bank') ?? v[0])?.id ?? ''
}, { immediate: true })
const from = computed(() => usable.value.find((a) => a.id === fromId.value))

const HIDE_KEY = 'swipe-hide-amount'
const hidden = ref(false)
try { hidden.value = localStorage.getItem(HIDE_KEY) === '1' } catch {}
function toggleHidden() {
  hidden.value = !hidden.value
  try { localStorage.setItem(HIDE_KEY, hidden.value ? '1' : '0') } catch {}
}

// 目標帳戶依過去 90 天從這個帳戶轉入的次數排序，同次數照帳戶順序
const targets = computed(() => {
  const since = addDays(today(), -90)
  const n = new Map<string, number>()
  for (const t of allTxs.value)
    if (t.kind === 'transfer' && t.accountId === fromId.value && t.toAccountId && t.date >= since) n.set(t.toAccountId, (n.get(t.toAccountId) ?? 0) + 1)
  return usable.value.filter((a) => a.id !== fromId.value).sort((a, b) => (n.get(b.id) ?? 0) - (n.get(a.id) ?? 0))
})

// 由內到外三圈，各圈容量 5 / 8 / 12
const RINGS = [{ r: 0.21, cap: 5 }, { r: 0.32, cap: 8 }, { r: 0.43, cap: 12 }]
const placed = computed(() => {
  const out: Array<{ a: Account; x: number; y: number }> = []
  let i = 0
  for (const ring of RINGS) {
    const items = targets.value.slice(i, i + ring.cap)
    items.forEach((a, k) => {
      const ang = -Math.PI / 2 + (k / items.length) * Math.PI * 2 + (ring.r > 0.21 ? Math.PI / items.length : 0)
      out.push({ a, x: 0.5 + ring.r * Math.cos(ang), y: 0.5 + ring.r * Math.sin(ang) })
    })
    i += items.length
  }
  return out
})
const ringsUsed = computed(() => RINGS.filter((_, k) => targets.value.length > RINGS.slice(0, k).reduce((s, r) => s + r.cap, 0)))

const stage = ref<HTMLElement>()
const drag = ref<{ x: number; y: number } | null>(null)
const hoverId = ref('')

function local(e: PointerEvent) {
  const r = stage.value!.getBoundingClientRect()
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.width }
}
function hitTest(p: { x: number; y: number }) {
  const w = stage.value!.getBoundingClientRect().width
  const radius = (26 * 1.3) / w
  let best = ''
  let bestD = Infinity
  for (const t of placed.value) {
    const d = Math.hypot(t.x - p.x, t.y - p.y)
    if (d < radius && d < bestD) [best, bestD] = [t.a.id, d]
  }
  return best
}
function onDown(e: PointerEvent) {
  if (!from.value) return
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  drag.value = local(e)
}
function onMove(e: PointerEvent) {
  if (!drag.value) return
  drag.value = local(e)
  hoverId.value = hitTest(drag.value)
}
function onUp() {
  if (!drag.value) return
  const id = hoverId.value
  drag.value = null
  hoverId.value = ''
  if (id) openSheet(id)
}

const toId = ref('')
const to = computed(() => usable.value.find((a) => a.id === toId.value))
const expr = ref('')
const toExpr = ref('')
const date = ref(today())
const note = ref('')
const cross = computed(() => !!to.value && !!from.value && to.value.currency !== from.value.currency)
const shown = computed(() => expr.value || '0')

function openSheet(id: string) {
  toId.value = id
  expr.value = ''
  toExpr.value = ''
  note.value = ''
  date.value = today()
}

const undo = ref<{ id: string; text: string } | null>(null)
let undoTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(undoTimer))

async function submit() {
  const a = from.value
  const b = to.value
  if (!a || !b) return
  const amount = toMinor(Math.max(0, evaluate(expr.value || '0')), a.currency)
  if (amount <= 0) return ui.notify('請輸入金額')
  const toAmount = cross.value ? toMinor(Math.max(0, evaluate(toExpr.value || '0')), b.currency) : undefined
  if (cross.value && !toAmount) return ui.notify('請輸入轉入金額')
  const id = await saveTx({ bookId: ui.bookId, kind: 'transfer', date: date.value, accountId: a.id, toAccountId: b.id, toAmount, amount, note: note.value.trim() })
  toId.value = ''
  clearTimeout(undoTimer)
  undo.value = { id, text: `已轉 ${formatMoney(amount, a.currency)} → ${b.name}` }
  undoTimer = setTimeout(() => (undo.value = null), 5000)
}
async function revert() {
  if (!undo.value) return
  await deleteTx(undo.value.id)
  undo.value = null
  ui.notify('已復原')
}

const label = (a: Account) => {
  const v = balanceMap.value.get(a.id) ?? 0
  return a.type === 'credit' ? `欠款 ${formatMoney(Math.max(0, -v), a.currency)}` : formatMoney(v, a.currency)
}
</script>

<template>
  <main class="page swipe">
    <TopBar title="滑滑轉帳" back>
      <RouterLink to="/accounts/new" class="icon-btn" aria-label="新增帳戶">＋</RouterLink>
    </TopBar>

    <section v-if="from" class="card head">
      <select v-model="fromId" class="from-select" aria-label="轉出帳戶">
        <option v-for="a in usable" :key="a.id" :value="a.id">{{ a.name }}</option>
      </select>
      <div class="bal">
        <span class="small muted">{{ from.type === 'credit' ? '目前' : '餘額' }}</span>
        <b class="num">{{ hidden ? '＊＊＊＊' : label(from) }}</b>
        <button class="eye" :aria-label="hidden ? '顯示金額' : '隱藏金額'" @click="toggleHidden">{{ hidden ? '顯示' : '隱藏' }}</button>
      </div>
    </section>

    <div v-if="!from" class="empty">先新增帳戶才能轉帳</div>
    <div v-else-if="!targets.length" class="empty">至少要有兩個帳戶才能轉帳</div>
    <div v-else ref="stage" class="stage">
      <div v-for="(r, k) in ringsUsed" :key="k" class="ring" :style="{ width: `${r.r * 200}%`, height: `${r.r * 200}%` }" />
      <div
        v-for="t in placed"
        :key="t.a.id"
        class="target"
        :class="{ hot: hoverId === t.a.id, dim: t.a.currency !== from.currency }"
        :style="{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }"
        @click="openSheet(t.a.id)"
      >
        <CatIcon :icon="t.a.icon" :color="t.a.color" :size="44" />
        <span class="name">{{ t.a.name }}</span>
      </div>
      <svg v-if="drag" class="line" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="50" y1="50" :x2="drag.x * 100" :y2="drag.y * 100" />
      </svg>
      <div
        class="center"
        :class="{ dragging: !!drag }"
        :style="drag ? { left: `${drag.x * 100}%`, top: `${drag.y * 100}%` } : {}"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="drag = null; hoverId = ''"
      >
        <CatIcon :icon="from.icon" :color="from.color" :size="68" />
      </div>
      <div v-if="!drag" class="hint small">拖曳中間的頭像到要轉入的帳戶</div>
    </div>

    <Sheet v-if="to && from" :title="`${from.name} → ${to.name}`" @close="toId = ''">
      <div class="amt num">{{ shown }} <span class="small muted">{{ from.currency }}</span></div>
      <div v-if="cross" class="field">
        <label class="small">轉入金額（{{ to.currency }}）</label>
        <input v-model="toExpr" inputmode="decimal" placeholder="實際入帳金額" />
      </div>
      <div class="field row2">
        <input v-model="date" type="date" aria-label="日期" />
        <input v-model="note" placeholder="備註" aria-label="備註" />
      </div>
      <Keypad v-model="expr" :decimals="cinfo(from.currency).decimals" @submit="submit" />
    </Sheet>

    <div v-if="undo" class="undo" role="status">
      <span>{{ undo.text }}</span>
      <button @click="revert">復原</button>
    </div>
  </main>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 6px; }
.from-select { font: inherit; font-size: 1.0625rem; font-weight: 600; border: 0; background: transparent; padding: 0; color: var(--text); }
.bal { display: flex; align-items: baseline; gap: 8px; }
.bal b { font-size: 1.375rem; }
.eye { margin-left: auto; border: 0; background: var(--surface-2); border-radius: 99px; padding: 3px 10px; font-size: 0.75rem; color: var(--muted); }
.stage { position: relative; width: 100%; aspect-ratio: 1; margin: 18px 0; touch-action: none; user-select: none; -webkit-user-select: none; }
.ring { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%; border: 1.5px dashed color-mix(in srgb, var(--accent) 35%, transparent); background: color-mix(in srgb, var(--accent) 5%, transparent); }
.target { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 2px; width: 64px; transition: transform 0.12s; cursor: pointer; }
.target .name { font-size: 0.6875rem; max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.target.hot { transform: translate(-50%, -50%) scale(1.25); }
.target.hot :deep(.cat-icon) { box-shadow: 0 0 0 3px var(--accent), 0 0 16px var(--accent); }
.target.dim :deep(.cat-icon) { filter: grayscale(1); opacity: 0.7; }
.center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2; cursor: grab; border-radius: 30%; box-shadow: 0 4px 14px rgb(0 0 0 / 0.15); transition: left 0.2s, top 0.2s; touch-action: none; }
.center.dragging { transition: none; cursor: grabbing; transform: translate(-50%, -50%) scale(0.85); }
.line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.line line { stroke: var(--accent); stroke-width: 0.6; stroke-dasharray: 2 1.5; }
.hint { position: absolute; left: 50%; top: calc(50% + 48px); transform: translateX(-50%); color: var(--muted); white-space: nowrap; pointer-events: none; }
.amt { font-size: 2rem; font-weight: 700; text-align: right; margin: 4px 4px 10px; }
.row2 { display: flex; gap: 8px; margin-bottom: 10px; }
.row2 input, .field input { flex: 1; min-width: 0; font-size: 1rem; }
.undo { position: fixed; left: 16px; right: 16px; max-width: 480px; margin: 0 auto; bottom: calc(24px + env(safe-area-inset-bottom)); z-index: 50; display: flex; align-items: center; gap: 10px; background: var(--text); color: var(--bg); border-radius: 14px; padding: 12px 14px; }
.undo span { flex: 1; }
.undo button { border: 0; background: transparent; color: var(--accent-soft); font: inherit; font-weight: 700; }
</style>
