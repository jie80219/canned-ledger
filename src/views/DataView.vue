<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { db, getMeta, setMeta } from '../db/schema'
import type { MerchantRule } from '../db/types'
import { makeTx } from '../db/factory'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import { downloadFile, exportBackup, importBackup, validateBackup, type Backup } from '../io/backup'
import { transactionsToCsv } from '../io/csv'
import { matchRule, parseInvoiceCsv, type Invoice } from '../io/invoice'
import { getRules, setRules } from '../io/rules'
import { addDays, diffDays, today } from '../domain/dates'
import { formatMoney, toMinor } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import Sheet from '../components/Sheet.vue'
import { iconText } from '../icons'

const ui = useUi()
const { book, accounts, categories, categoryMap } = useBook()

// ---- 備份
const lastBackup = ref<string | null>(null)
onMounted(async () => (lastBackup.value = await getMeta<string | null>('lastBackupAt', null)))
const backupAge = computed(() => (lastBackup.value ? diffDays(lastBackup.value.slice(0, 10), today()) : null))

async function doExport() {
  const b = await exportBackup()
  downloadFile(`tuntun-ledger-${today()}.json`, JSON.stringify(b), 'application/json')
  // 存本地日期，避免 UTC 跨日誤差
  lastBackup.value = today()
  await setMeta('lastBackupAt', today())
  ui.notify('已下載備份檔')
}

const pending = shallowRef<Backup | null>(null) // 不能是 deep reactive，否則寫入 IndexedDB 時無法複製
const pendingCounts = computed(() =>
  pending.value ? Object.entries(pending.value.tables).map(([t, rows]) => `${t} ${rows?.length ?? 0}`).join('、') : '',
)
async function pickBackup(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    pending.value = validateBackup(JSON.parse(await file.text()))
  } catch (err) {
    ui.notify((err as Error).message || '檔案格式錯誤')
  }
}
async function doImport(mode: 'overwrite' | 'merge') {
  try {
    const { written } = await importBackup(pending.value, mode)
    const books = await db.books.toArray()
    if (!books.some((b) => b.id === ui.bookId) && books[0]) ui.setBook(books[0].id)
    ui.notify(`已還原 ${written} 筆資料`)
  } catch (err) {
    ui.notify('還原失敗：' + (err as Error).message)
  }
  pending.value = null
}

// ---- CSV 匯出
const csvFrom = ref(addDays(today(), -365))
const csvTo = ref(today())
async function doCsv() {
  const txs = (
    await db.transactions.where('[bookId+date]').between([ui.bookId, csvFrom.value], [ui.bookId, csvTo.value], true, true).toArray()
  ).sort((a, b) => a.date.localeCompare(b.date))
  if (!txs.length) return ui.notify('這段期間沒有交易')
  downloadFile(`${book.value?.name ?? 'ledger'}-${csvFrom.value}-${csvTo.value}.csv`, transactionsToCsv(txs, accounts.value, categories.value), 'text/csv;charset=utf-8')
}

// ---- 發票匯入
interface Row { inv: Invoice; categoryId?: string; selected: boolean; dup: boolean }
const rows = ref<Row[]>([])
const invAccount = ref('')
const fallbackCat = ref('')
const rules = ref<MerchantRule[]>([])
const expenseCats = computed(() => {
  const list = categories.value.filter((c) => c.kind === 'expense' && !c.hidden)
  return list.filter((c) => !c.parentId).flatMap((t) => [t, ...list.filter((c) => c.parentId === t.id)])
})
const catLabel = (id: string) => {
  const c = categoryMap.value.get(id)
  if (!c) return '未分類'
  const p = c.parentId ? categoryMap.value.get(c.parentId) : undefined
  return `${iconText(c.icon)} ${p ? p.name + '›' : ''}${c.name}`
}

async function pickInvoice(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  const buf = await file.arrayBuffer()
  // 財政部檔案是 UTF-8；舊檔可能是 Big5
  let text = new TextDecoder('utf-8').decode(buf)
  if (text.includes('�')) text = new TextDecoder('big5').decode(buf)
  const invs = parseInvoiceCsv(text)
  if (!invs.length) return ui.notify('沒有讀到發票資料，請確認是財政部「消費明細」CSV')
  rules.value = await getRules(ui.bookId)
  const existing = new Set((await db.transactions.where('autoKey').startsWith('inv:').toArray()).map((t) => t.autoKey))
  rows.value = invs.map((inv) => {
    const rule = matchRule(rules.value, inv.sellerName) ?? matchRule(rules.value, inv.items.map((i) => i.name).join(' '))
    const dup = existing.has(`inv:${inv.invoiceNo}`)
    return { inv, categoryId: rule?.categoryId, selected: !dup, dup }
  })
  const def = accounts.value.find((a) => a.type === 'credit' && !a.archived) ?? accounts.value.find((a) => !a.archived)
  invAccount.value = def?.id ?? ''
  fallbackCat.value = expenseCats.value.find((c) => c.name === '其他' && !c.parentId)?.id ?? ''
}
const selectedCount = computed(() => rows.value.filter((r) => r.selected).length)

async function rememberRule(r: Row) {
  if (!r.categoryId || !r.inv.sellerName) return
  const next = rules.value.filter((x) => x.keyword !== r.inv.sellerName)
  next.unshift({ keyword: r.inv.sellerName, categoryId: r.categoryId })
  rules.value = next
  await setRules(ui.bookId, next)
  // 同店家的其他列一起套用
  for (const o of rows.value) if (o.inv.sellerName === r.inv.sellerName && !o.dup) o.categoryId = r.categoryId
  ui.notify(`記住了：${r.inv.sellerName} → ${catLabel(r.categoryId)}`)
}

async function doInvoiceImport() {
  const acc = accounts.value.find((a) => a.id === invAccount.value)
  if (!acc) return ui.notify('請選擇帳戶')
  let added = 0
  for (const r of rows.value) {
    if (!r.selected || r.dup) continue
    const items = r.inv.items.map((i) => i.name).filter(Boolean)
    const tx = makeTx({
      bookId: ui.bookId,
      kind: 'expense',
      date: r.inv.date,
      amount: toMinor(r.inv.total, acc.currency),
      accountId: acc.id,
      categoryId: r.categoryId || fallbackCat.value || undefined,
      note: [r.inv.sellerName, items.slice(0, 3).join('、') + (items.length > 3 ? '…' : '')].filter(Boolean).join(' · '),
      invoiceNo: r.inv.invoiceNo,
      autoKey: `inv:${r.inv.invoiceNo}`,
    })
    try {
      await db.transactions.add(tx)
      added++
    } catch (e) {
      if ((e as Error).name !== 'ConstraintError') throw e
    }
  }
  ui.notify(`已匯入 ${added} 張發票`)
  rows.value = []
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="資料" back />

    <div class="section-label">JSON 備份（全部帳本）</div>
    <div class="list">
      <button class="row" @click="doExport">
        <span class="emoji">⬇️</span>
        <span class="grow">下載備份檔<div class="sub">{{ backupAge === null ? '還沒備份過' : `上次備份 ${backupAge} 天前` }}</div></span>
      </button>
      <label class="row">
        <span class="emoji">⬆️</span><span class="grow">從備份檔還原<div class="sub">可選擇覆蓋或合併</div></span>
        <input type="file" accept="application/json,.json" hidden @change="pickBackup" />
      </label>
    </div>
    <p class="help">換手機或換瀏覽器時，在舊裝置下載備份、新裝置還原。建議存到 iCloud 雲碟或 Google Drive。</p>

    <div class="section-label">CSV 匯出（目前帳本）</div>
    <div class="list">
      <div class="field"><label>期間</label><input v-model="csvFrom" type="date" /><span class="hint">至</span><input v-model="csvTo" type="date" /></div>
      <button class="row" @click="doCsv"><span class="emoji">📄</span><span class="grow">下載 CSV<div class="sub">UTF-8 BOM，Excel 直接開不會亂碼</div></span></button>
    </div>

    <div class="section-label">財政部電子發票匯入</div>
    <div class="list">
      <label class="row">
        <span class="emoji">🧾</span><span class="grow">選擇消費明細 CSV<div class="sub">電子發票整合服務平台 → 個人 → 載具 → 消費明細 → 匯出</div></span>
        <input type="file" accept=".csv,text/csv,text/plain" hidden @change="pickInvoice" />
      </label>
      <RouterLink to="/settings/rules" class="row"><span class="emoji">🏷️</span><span class="grow">店家自動分類規則</span><span class="chev">›</span></RouterLink>
    </div>
    <p class="help">同一張發票號碼只會匯入一次，重複匯入同一個檔案也沒關係。</p>

    <Sheet v-if="pending" title="還原備份" @close="pending = null">
      <p class="small" style="margin: 0 4px 12px">備份時間 {{ pending.exportedAt.slice(0, 16).replace('T', ' ') }}<br /><span class="muted">{{ pendingCounts }}</span></p>
      <button class="btn block" @click="doImport('merge')">合併（保留較新的資料）</button>
      <button class="btn danger block" style="margin-top: 8px" @click="doImport('overwrite')">覆蓋（先清空這台裝置的資料）</button>
    </Sheet>

    <Sheet v-if="rows.length" :title="`匯入發票（${rows.length} 張）`" @close="rows = []">
      <div class="list">
        <div class="field">
          <label>記到帳戶</label>
          <select v-model="invAccount">
            <option v-for="a in accounts.filter((a) => !a.archived)" :key="a.id" :value="a.id">{{ iconText(a.icon) }} {{ a.name }}</option>
          </select>
        </div>
        <div class="field">
          <label>未分類時</label>
          <select v-model="fallbackCat">
            <option value="">未分類</option>
            <option v-for="c in expenseCats" :key="c.id" :value="c.id">{{ catLabel(c.id) }}</option>
          </select>
        </div>
      </div>
      <div class="inv-list">
        <div v-for="r in rows" :key="r.inv.invoiceNo" class="inv" :class="{ muted: r.dup }">
          <input v-model="r.selected" type="checkbox" :disabled="r.dup" />
          <div class="grow">
            <div class="inv-top">
              <span class="ellipsis">{{ r.inv.sellerName || r.inv.sellerId }}</span>
              <b class="num">{{ formatMoney(toMinor(r.inv.total, 'TWD'), 'TWD') }}</b>
            </div>
            <div class="sub">{{ r.inv.date }} · {{ r.inv.invoiceNo }}<template v-if="r.dup"> · 已匯入過</template></div>
            <div v-if="!r.dup" class="inv-cat">
              <select v-model="r.categoryId">
                <option :value="undefined">（預設）</option>
                <option v-for="c in expenseCats" :key="c.id" :value="c.id">{{ catLabel(c.id) }}</option>
              </select>
              <button v-if="r.categoryId" class="link" @click="rememberRule(r)">記住此店家</button>
            </div>
          </div>
        </div>
      </div>
      <button class="btn block" :disabled="!selectedCount" @click="doInvoiceImport">匯入 {{ selectedCount }} 張</button>
    </Sheet>
  </main>
</template>

<style scoped>
label.row { cursor: pointer; }
.inv-list { max-height: 50vh; overflow-y: auto; margin-bottom: 12px; }
.inv { display: flex; gap: 10px; align-items: flex-start; padding: 10px 4px; border-bottom: 1px solid var(--border); }
.inv input[type='checkbox'] { margin-top: 4px; }
.inv-top { display: flex; justify-content: space-between; gap: 8px; }
.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inv-cat { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
.inv-cat select { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 4px 6px; background: var(--surface); font-size: 0.8125rem; }
.link { border: 0; background: none; color: var(--accent); padding: 0; font-size: 0.75rem; white-space: nowrap; }
.sub { font-size: 0.75rem; color: var(--muted); }
</style>
