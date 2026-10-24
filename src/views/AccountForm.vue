<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db, uid } from '../db/schema'
import { plain } from '../db/factory'
import type { Account, AccountType, CreditSettings } from '../db/types'
import { deleteAccount, saveAccount } from '../db/repo'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import { cycleContaining } from '../domain/creditCard'
import { today } from '../domain/dates'
import { CURRENCIES, toMajor, toMinor } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import IconPicker from '../components/IconPicker.vue'
import CatIcon from '../components/CatIcon.vue'
import { BANKS, iconText } from '../icons'

const props = defineProps<{ id?: string }>()
const ui = useUi()
const router = useRouter()
const { accounts, currency } = useBook()

const TYPES: Array<[AccountType, string, string]> = [
  ['cash', '現金', '👛'],
  ['bank', '銀行', '🏦'],
  ['ewallet', '電子支付', '📲'],
  ['credit', '信用卡', '💳'],
  ['asset', '其他資產', '📈'],
  ['liability', '負債', '🧾'],
]
const COLORS = ['#e6b450', '#85a8c9', '#d98c9f', '#7fb59a', '#c39bd3', '#e8a87c', '#9aa6d6', '#b8a07e', '#8a8a8a']
const defaultCredit = (): CreditSettings => ({
  statementDay: 5,
  dueDay: 20,
  dueMonthOffset: 0,
  creditLimit: 0,
  autopay: 'off',
  minimumRate: 0.1,
  autopayConfirm: true,
  foreignFeeRate: 0.015,
})

const a = ref<Account>({
  id: uid(),
  bookId: ui.bookId,
  name: '',
  type: 'bank',
  currency: currency.value,
  initialBalance: 0,
  icon: '🏦',
  color: COLORS[1],
  includeInNetWorth: true,
  sortOrder: 0,
  updatedAt: 0,
})
const isNew = ref(!props.id)
const initial = ref('0')
// 信用卡／負債用正數輸入欠款，iPhone 數字鍵盤沒有負號
const owe = ref(true)
const isDebt = computed(() => a.value.type === 'credit' || a.value.type === 'liability')
const limit = ref('0')
const feePct = ref('1.5')
const minPct = ref('10')
const showIcons = ref(false)

onMounted(async () => {
  if (props.id) {
    const found = await db.accounts.get(props.id)
    if (!found) return router.replace('/accounts')
    a.value = structuredClone(found)
  } else {
    a.value.currency = (await db.books.get(ui.bookId))?.currency ?? 'TWD'
    a.value.sortOrder = await db.accounts.where('bookId').equals(ui.bookId).count()
  }
  owe.value = a.value.initialBalance <= 0
  initial.value = String(toMajor(isDebt.value ? Math.abs(a.value.initialBalance) : a.value.initialBalance, a.value.currency))
  if (a.value.credit) {
    limit.value = String(toMajor(a.value.credit.creditLimit, a.value.currency))
    feePct.value = String(+(a.value.credit.foreignFeeRate * 100).toFixed(2))
    minPct.value = String(+(a.value.credit.minimumRate * 100).toFixed(2))
  }
})

function setType(t: AccountType, icon: string) {
  const wasDefaultIcon = TYPES.some(([, , i]) => i === a.value.icon)
  a.value.type = t
  if (wasDefaultIcon) a.value.icon = icon
  if (t === 'credit' && !a.value.credit) a.value.credit = defaultCredit()
}

// 選銀行時套用該行圖示與品牌色；「其他」則恢復帳戶類型的預設圖示
const bank = computed({
  get: () => (a.value.icon.startsWith('svg:bank-') ? a.value.icon.slice(4) : ''),
  set: (id: string) => {
    if (!id) {
      if (bank.value) a.value.icon = TYPES.find(([t]) => t === a.value.type)![2]
      return
    }
    a.value.icon = `svg:${id}`
    a.value.color = BANKS[id].color
    if (!a.value.name.trim()) a.value.name = BANKS[id].name
  },
})

const payAccounts = computed(() =>
  accounts.value.filter((x) => x.id !== a.value.id && !x.archived && x.type !== 'credit' && x.currency === a.value.currency),
)
// 預覽：下一期的結帳日與繳款日
const preview = computed(() => (a.value.credit ? cycleContaining(a.value.credit, today()) : null))

function openingBalance() {
  const v = toMinor(Number(initial.value) || 0, a.value.currency)
  return isDebt.value ? (owe.value ? -1 : 1) * Math.abs(v) : v
}

async function save() {
  if (!a.value.name.trim()) return ui.notify('請輸入帳戶名稱')
  const acc: Account = { ...plain(a.value), name: a.value.name.trim(), initialBalance: openingBalance() }
  if (acc.type === 'credit' && acc.credit) {
    acc.credit = {
      ...acc.credit,
      creditLimit: toMinor(Number(limit.value) || 0, acc.currency),
      foreignFeeRate: (Number(feePct.value) || 0) / 100,
      minimumRate: (Number(minPct.value) || 0) / 100,
    }
    if (acc.credit.autopay !== 'off' && !acc.credit.payFromAccountId) return ui.notify('開啟自動扣款需要選擇扣款帳戶')
  } else delete acc.credit
  await saveAccount(acc)
  ui.notify('已儲存')
  router.back()
}

async function remove() {
  const r = await deleteAccount(a.value.id)
  ui.notify(r === 'archived' ? '帳戶有交易紀錄，已改為封存' : '已刪除')
  router.replace('/accounts')
}
async function unarchive() {
  a.value.archived = false
  await saveAccount(plain(a.value))
  ui.notify('已取消封存')
}
</script>

<template>
  <main class="page no-nav">
    <TopBar :title="isNew ? '新增帳戶' : '編輯帳戶'" back>
      <button class="icon-btn" style="width: auto; padding: 0 10px; color: var(--accent); font-weight: 600" @click="save">儲存</button>
    </TopBar>

    <div class="types">
      <button v-for="[t, l, i] in TYPES" :key="t" class="type" :class="{ on: a.type === t }" @click="setType(t, i)">
        <span>{{ i }}</span>{{ l }}
      </button>
    </div>

    <div class="list">
      <div v-if="a.type !== 'cash'" class="field">
        <label>銀行</label>
        <select v-model="bank">
          <option v-for="(b, id) in BANKS" :key="id" :value="id">{{ b.name }}</option>
          <option value="">其他</option>
        </select>
      </div>
      <div class="field">
        <button class="icon-tap" @click="showIcons = true"><CatIcon :icon="a.icon" :color="a.color" :size="44" /></button>
        <input v-model="a.name" placeholder="帳戶名稱，例如：國泰世華" maxlength="30" />
      </div>
      <div class="field">
        <label>顏色</label>
        <div class="color-dots">
          <button v-for="c in COLORS" :key="c" :class="{ on: a.color === c }" :style="{ background: c }" :aria-label="c" @click="a.color = c" />
        </div>
      </div>
      <div class="field">
        <label>幣別</label>
        <select v-model="a.currency" :disabled="!isNew">
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.code }} {{ c.name }}</option>
        </select>
      </div>
      <div class="field">
        <label>{{ isDebt ? '期初餘額' : '初始餘額' }}</label>
        <div v-if="isDebt" class="seg owe">
          <button :class="{ on: owe }" @click="owe = true">欠款</button>
          <button :class="{ on: !owe }" @click="owe = false">溢繳</button>
        </div>
        <input v-model="initial" inputmode="decimal" />
        <span class="hint">{{ a.currency }}</span>
      </div>
      <div class="field">
        <label class="grow">計入淨資產</label>
        <input v-model="a.includeInNetWorth" type="checkbox" class="switch" />
      </div>
    </div>
    <p v-if="isDebt" class="help">選「欠款」後直接輸入正數，例如目前欠 3,000 就填 3000，會存成負債。</p>

    <template v-if="a.type === 'credit' && a.credit">
      <div class="section-label">帳單設定</div>
      <div class="list">
        <div class="field">
          <label>結帳日</label>
          <select v-model.number="a.credit.statementDay">
            <option v-for="d in 31" :key="d" :value="d">每月 {{ d }} 號{{ d >= 29 ? '（小月取月底）' : '' }}</option>
          </select>
        </div>
        <div class="field">
          <label>繳款日</label>
          <select v-model.number="a.credit.dueMonthOffset" style="flex: 0 0 auto">
            <option :value="0">當月</option>
            <option :value="1">次月</option>
          </select>
          <select v-model.number="a.credit.dueDay">
            <option v-for="d in 31" :key="d" :value="d">{{ d }} 號</option>
          </select>
        </div>
        <div class="field">
          <label>信用額度</label>
          <input v-model="limit" inputmode="decimal" />
          <span class="hint">{{ a.currency }}</span>
        </div>
        <div class="field">
          <label>列表顯示</label>
          <div class="seg" style="flex: 1">
            <button :class="{ on: (a.credit.display ?? 'spent') === 'spent' }" @click="a.credit.display = 'spent'">未出帳 −金額</button>
            <button :class="{ on: a.credit.display === 'available' }" @click="a.credit.display = 'available'">可用額度</button>
          </div>
        </div>
        <div class="field">
          <label>海外手續費</label>
          <input v-model="feePct" inputmode="decimal" />
          <span class="hint">%</span>
        </div>
      </div>
      <p v-if="preview" class="help">本期：{{ preview.start }} ～ {{ preview.end }} 結帳，{{ preview.due }} 繳款</p>

      <div class="section-label">自動扣款</div>
      <div class="list">
        <div class="field">
          <label>扣款方式</label>
          <div class="seg" style="flex: 1">
            <button :class="{ on: a.credit.autopay === 'off' }" @click="a.credit.autopay = 'off'">關閉</button>
            <button :class="{ on: a.credit.autopay === 'full' }" @click="a.credit.autopay = 'full'">全額</button>
            <button :class="{ on: a.credit.autopay === 'minimum' }" @click="a.credit.autopay = 'minimum'">最低</button>
          </div>
        </div>
        <template v-if="a.credit.autopay !== 'off'">
          <div class="field">
            <label>扣款帳戶</label>
            <select v-model="a.credit.payFromAccountId">
              <option :value="undefined" disabled>選擇銀行帳戶</option>
              <option v-for="p in payAccounts" :key="p.id" :value="p.id">{{ iconText(p.icon) }} {{ p.name }}</option>
            </select>
          </div>
          <div v-if="a.credit.autopay === 'minimum'" class="field">
            <label>最低應繳</label>
            <input v-model="minPct" inputmode="decimal" />
            <span class="hint">%</span>
          </div>
          <div class="field">
            <label class="grow">扣款前先讓我確認金額</label>
            <input v-model="a.credit.autopayConfirm" type="checkbox" class="switch" />
          </div>
        </template>
      </div>
      <p class="help">
        每到繳款日，開啟 App 時會自動記一筆「扣款帳戶 → 信用卡」的轉帳，金額＝結帳時欠款扣掉結帳後已繳的錢。
        開啟確認時會先放在「待確認」，可以改成實際帳單金額（年費、回饋折抵）。只會補產生開啟之後的繳款日。
      </p>
    </template>

    <template v-if="!isNew">
      <button v-if="a.archived" class="btn ghost block" style="margin-top: 16px" @click="unarchive">取消封存</button>
      <button class="btn danger block" style="margin-top: 8px" @click="remove">刪除帳戶</button>
      <p class="help" style="text-align: center; margin-top: 4px">有交易紀錄的帳戶會改為封存，資料不會遺失。</p>
    </template>

    <IconPicker v-if="showIcons" v-model="a.icon" :color="a.color" @close="showIcons = false" />
  </main>
</template>

<style scoped>
.owe { flex: none; }
.types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.type { border: 2px solid transparent; background: var(--surface); border-radius: 14px; padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.8125rem; }
.type span { font-size: 1.375rem; }
.type.on { border-color: var(--accent); font-weight: 600; }
.icon-pick { border: 0; flex: none; font-size: 1.25rem; }
</style>
