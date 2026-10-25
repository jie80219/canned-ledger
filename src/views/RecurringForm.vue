<script setup lang="ts">
import { ACCOUNT_TYPE_LABEL, byType } from '../domain/accounts'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db, uid } from '../db/schema'
import { plain } from '../db/factory'
import type { Freq, Recurring } from '../db/types'
import { deleteRecurring, saveRecurring } from '../db/repo'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import { runScheduler } from '../domain/scheduler'
import { occurrenceDate } from '../domain/recurrence'
import { today } from '../domain/dates'
import { CURRENCIES, toMajor, toMinor } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import { iconText } from '../icons'

const props = defineProps<{ id?: string }>()
const ui = useUi()
const router = useRouter()
const { accounts, categories, accountMap, categoryMap } = useBook()

const r = ref<Recurring>({
  id: uid(),
  bookId: ui.bookId,
  name: '',
  template: { kind: 'expense', accountId: '', note: '' },
  amount: 0,
  currency: 'TWD',
  fxMode: 'confirm',
  freq: 'monthly',
  interval: 1,
  startDate: today(),
  generated: 0,
  active: true,
  updatedAt: 0,
})
let original: Recurring | undefined
const amount = ref('')
const endMode = ref<'never' | 'date' | 'count'>('never')

onMounted(async () => {
  if (props.id) {
    original = await db.recurring.get(props.id)
    if (!original) return router.replace('/recurring')
    r.value = structuredClone(original)
    amount.value = String(toMajor(r.value.amount, r.value.currency))
    endMode.value = r.value.endDate ? 'date' : r.value.count ? 'count' : 'never'
  } else {
    const acc = (await db.accounts.where('bookId').equals(ui.bookId).toArray()).find((a) => !a.archived)
    r.value.template.accountId = acc?.id ?? ''
    r.value.currency = acc?.currency ?? 'TWD'
  }
})

const account = computed(() => accountMap.value.get(r.value.template.accountId))
const isForeign = computed(() => !!account.value && r.value.currency !== account.value.currency)
const cats = computed(() =>
  categories.value.filter((c) => !c.hidden && c.kind === (r.value.template.kind === 'income' ? 'income' : 'expense')),
)
const catLabel = (id: string) => {
  const c = categoryMap.value.get(id)!
  const p = c.parentId ? categoryMap.value.get(c.parentId) : undefined
  return `${iconText(c.icon)} ${p ? p.name + ' › ' : ''}${c.name}`
}
// 依大類→子類排序
const catOptions = computed(() => {
  const tops = cats.value.filter((c) => !c.parentId)
  return tops.flatMap((t) => [t, ...cats.value.filter((c) => c.parentId === t.id)])
})

watch(
  () => r.value.template.kind,
  (k) => {
    if (k === 'transfer') r.value.currency = account.value?.currency ?? r.value.currency
    if (r.value.template.categoryId && categoryMap.value.get(r.value.template.categoryId)?.kind !== (k === 'income' ? 'income' : 'expense'))
      r.value.template.categoryId = undefined
  },
)

const preview = computed(() => {
  const out: string[] = []
  for (let k = 0; k < 3; k++) {
    if (r.value.count && endMode.value === 'count' && k >= r.value.count) break
    const d = occurrenceDate(r.value, k)
    if (endMode.value === 'date' && r.value.endDate && d > r.value.endDate) break
    out.push(d)
  }
  return out
})

async function save() {
  const x: Recurring = plain(r.value)
  if (!x.name.trim()) x.name = x.template.categoryId ? categoryMap.value.get(x.template.categoryId)!.name : '週期記帳'
  x.amount = toMinor(Number(amount.value) || 0, x.currency)
  if (x.amount <= 0) return ui.notify('請輸入金額')
  if (!x.template.accountId) return ui.notify('請選擇帳戶')
  if (x.template.kind === 'transfer' && (!x.template.toAccountId || x.template.toAccountId === x.template.accountId))
    return ui.notify('請選擇不同的轉入帳戶')
  if (x.template.kind !== 'transfer') delete x.template.toAccountId
  if (endMode.value !== 'date') delete x.endDate
  if (endMode.value !== 'count') delete x.count
  x.interval = Math.max(1, Math.floor(x.interval || 1))

  // 改了排程：已產生的期數換算成新規則下「已過」的期數，避免重複或漏記
  if (original && original.generated > 0 && (original.startDate !== x.startDate || original.freq !== x.freq || original.interval !== x.interval)) {
    const lastDone = occurrenceDate(original, original.generated - 1)
    let k = 0
    while (k < 10000 && occurrenceDate(x, k) <= lastDone) k++
    x.generated = k
  }
  await saveRecurring(x)
  const res = await runScheduler()
  if (res.created) ui.scheduler = res
  ui.notify(res.created ? `已儲存，補記 ${res.created} 筆` : '已儲存')
  router.back()
}

async function remove() {
  await deleteRecurring(r.value.id)
  ui.notify('已刪除規則（已記的交易會保留）')
  router.replace('/recurring')
}

const FREQS: Array<[Freq, string]> = [
  ['daily', '天'],
  ['weekly', '週'],
  ['monthly', '月'],
  ['yearly', '年'],
]
</script>

<template>
  <main class="page no-nav">
    <TopBar :title="id ? '編輯週期記帳' : '新增週期記帳'" back>
      <button class="icon-btn" style="width: auto; padding: 0 10px; color: var(--accent); font-weight: 600" @click="save">儲存</button>
    </TopBar>

    <div class="seg" style="margin-bottom: 12px">
      <button :class="{ on: r.template.kind === 'expense' }" @click="r.template.kind = 'expense'">支出</button>
      <button :class="{ on: r.template.kind === 'income' }" @click="r.template.kind = 'income'">收入</button>
      <button :class="{ on: r.template.kind === 'transfer' }" @click="r.template.kind = 'transfer'">轉帳</button>
    </div>

    <div class="list">
      <div class="field"><label>名稱</label><input v-model="r.name" placeholder="例如：Netflix" maxlength="30" /></div>
      <div class="field">
        <label>金額</label>
        <input v-model="amount" inputmode="decimal" placeholder="0" />
        <USelect v-model="r.currency" :disabled="r.template.kind === 'transfer'" style="flex: 0 0 auto; width: auto">
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.code }}</option>
        </USelect>
      </div>
      <div class="field">
        <label>{{ r.template.kind === 'transfer' ? '轉出帳戶' : '帳戶' }}</label>
        <USelect v-model="r.template.accountId">
          <option v-for="a in byType(accounts.filter((a) => !a.archived))" :key="a.id" :value="a.id" :data-icon="a.icon" :data-color="a.color" :data-group="ACCOUNT_TYPE_LABEL[a.type]">{{ a.name }}（{{ a.currency }}）</option>
        </USelect>
      </div>
      <div v-if="r.template.kind === 'transfer'" class="field">
        <label>轉入帳戶</label>
        <USelect v-model="r.template.toAccountId">
          <option :value="undefined" disabled>選擇帳戶</option>
          <option v-for="a in byType(accounts.filter((a) => !a.archived && a.id !== r.template.accountId && a.currency === account?.currency))" :key="a.id" :value="a.id" :data-icon="a.icon" :data-color="a.color" :data-group="ACCOUNT_TYPE_LABEL[a.type]">{{ a.name }}</option>
        </USelect>
      </div>
      <div v-else class="field">
        <label>分類</label>
        <USelect v-model="r.template.categoryId">
          <option :value="undefined">未分類</option>
          <option v-for="c in catOptions" :key="c.id" :value="c.id" :data-icon="c.icon" :data-color="c.color">{{ catLabel(c.id) }}</option>
        </USelect>
      </div>
      <div class="field"><label>備註</label><input v-model="r.template.note" maxlength="200" /></div>
    </div>

    <template v-if="isForeign">
      <div class="section-label">外幣換算（{{ r.currency }} → {{ account?.currency }}）</div>
      <div class="list">
        <button class="row" @click="r.fxMode = 'confirm'">
          <span class="grow"><div>先待確認，帳單出來再填實際金額</div><div class="sub">以當日匯率估算入帳，標成待確認；建議信用卡訂閱用這個</div></span>
          <span v-if="r.fxMode === 'confirm'">✓</span>
        </button>
        <button class="row" @click="r.fxMode = 'auto'">
          <span class="grow"><div>用當天匯率直接入帳</div><div class="sub">金額＝原幣 × 扣款日匯率{{ account?.credit?.foreignFeeRate ? ` × (1 + ${(account.credit.foreignFeeRate * 100).toFixed(1)}% 手續費)` : '' }}</div></span>
          <span v-if="r.fxMode === 'auto'">✓</span>
        </button>
      </div>
    </template>

    <div class="section-label">重複</div>
    <div class="list">
      <div class="field">
        <label>頻率</label>
        <span class="small">每</span>
        <input v-model.number="r.interval" type="number" min="1" style="flex: 0 0 52px; text-align: center" />
        <div class="seg" style="flex: 1">
          <button v-for="[f, l] in FREQS" :key="f" :class="{ on: r.freq === f }" @click="r.freq = f">{{ l }}</button>
        </div>
      </div>
      <div class="field"><label>開始日期</label><input v-model="r.startDate" type="date" required /></div>
      <div class="field">
        <label>結束</label>
        <USelect v-model="endMode">
          <option value="never">永不</option>
          <option value="date">指定日期</option>
          <option value="count">指定次數</option>
        </USelect>
      </div>
      <div v-if="endMode === 'date'" class="field"><label>結束日期</label><input v-model="r.endDate" type="date" /></div>
      <div v-if="endMode === 'count'" class="field"><label>總次數</label><input v-model.number="r.count" type="number" min="1" /><span class="hint">次</span></div>
      <div v-if="id" class="field">
        <label class="grow">啟用</label>
        <input v-model="r.active" type="checkbox" class="switch" />
      </div>
    </div>
    <p class="help">
      接下來：{{ preview.join('、') || '—' }}
      <template v-if="r.startDate < today()">（開始日期在過去，儲存後會補記到今天）</template>
    </p>

    <button v-if="id" class="btn danger block" style="margin-top: 12px" @click="remove">刪除規則</button>
  </main>
</template>
