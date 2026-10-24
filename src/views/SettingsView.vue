<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBook } from '../composables/useBook'
import { useUi, type Accent, type FontScale, type ThemeMode } from '../stores/ui'
import { hasPin, setPin, verifyPin } from '../domain/lock'
import { getMeta } from '../db/schema'
import { saveAccount } from '../db/repo'
import { plain } from '../db/factory'
import { diffDays, today } from '../domain/dates'
import Sheet from '../components/Sheet.vue'

const ui = useUi()
const { book, accounts } = useBook()

const cards = computed(() => accounts.value.filter((a) => a.type === 'credit' && a.credit && !a.archived))
const cardDisplay = computed(() => {
  const modes = new Set(cards.value.map((a) => a.credit!.display ?? 'spent'))
  return modes.size === 1 ? [...modes][0] : null
})
async function setCardDisplay(display: 'spent' | 'available') {
  for (const a of cards.value) await saveAccount({ ...plain(a), credit: { ...plain(a.credit!), display } })
}
const pinOn = ref(false)
const pinSheet = ref<'set' | 'off' | null>(null)
const pin1 = ref('')
const pin2 = ref('')
const backupAge = ref<number | null>(null)

onMounted(async () => {
  pinOn.value = await hasPin()
  const at = await getMeta<string | null>('lastBackupAt', null)
  backupAge.value = at ? diffDays(at.slice(0, 10), today()) : null
})

async function commitPin() {
  if (pinSheet.value === 'set') {
    if (!/^\d{4,6}$/.test(pin1.value)) return ui.notify('請輸入 4–6 位數字')
    if (pin1.value !== pin2.value) return ui.notify('兩次輸入不同')
    await setPin(pin1.value)
    pinOn.value = true
    ui.notify('已開啟密碼鎖')
  } else {
    if (!(await verifyPin(pin1.value))) return ui.notify('密碼錯誤')
    await setPin(null)
    pinOn.value = false
    ui.notify('已關閉密碼鎖')
  }
  pin1.value = pin2.value = ''
  pinSheet.value = null
}

const THEMES: Array<[ThemeMode, string]> = [['auto', '跟隨系統'], ['light', '淺色'], ['dark', '深色']]
const FONT_SCALES: Array<[FontScale, string]> = [[0.9, '小'], [1, '標準'], [1.15, '大'], [1.3, '特大']]
const ACCENTS: Array<[Accent, string, string]> = [
  ['olive', '橄欖', '#7a9a6b'],
  ['berry', '莓果', '#c4688a'],
  ['sky', '天空', '#5b8db8'],
  ['peach', '蜜桃', '#d98a5a'],
]
const version = __APP_VERSION__
</script>

<template>
  <main class="page">
    <header class="topbar"><h1>設定</h1></header>

    <RouterLink v-if="backupAge === null || backupAge >= 14" to="/settings/data" class="banner pending">
      <span>💾</span>
      <span class="grow small">{{ backupAge === null ? '還沒備份過。' : `已經 ${backupAge} 天沒備份了。` }}資料只存在這台裝置的瀏覽器，記得定期匯出 JSON 備份。</span>
      <span class="chev">›</span>
    </RouterLink>

    <div class="section-label">帳本 · {{ book?.icon }} {{ book?.name }}</div>
    <div class="list">
      <RouterLink to="/settings/books" class="row"><span class="emoji">📒</span><span class="grow">帳本管理</span><span class="chev">›</span></RouterLink>
      <RouterLink to="/settings/categories" class="row"><span class="emoji">🗂️</span><span class="grow">分類管理</span><span class="chev">›</span></RouterLink>
      <RouterLink to="/budget" class="row"><span class="emoji">🎯</span><span class="grow">預算</span><span class="chev">›</span></RouterLink>
      <RouterLink to="/recurring" class="row"><span class="emoji">🗓️</span><span class="grow">週期記帳</span><span class="chev">›</span></RouterLink>
      <RouterLink to="/settings/rules" class="row"><span class="emoji">🏷️</span><span class="grow">店家自動分類</span><span class="chev">›</span></RouterLink>
      <div v-if="cards.length" class="field">
        <label>信用卡顯示</label>
        <div class="seg" style="flex: 1">
          <button :class="{ on: cardDisplay === 'spent' }" @click="setCardDisplay('spent')">已刷 −金額</button>
          <button :class="{ on: cardDisplay === 'available' }" @click="setCardDisplay('available')">可用額度</button>
        </div>
      </div>
    </div>
    <p v-if="cards.length" class="help">套用到這個帳本的所有信用卡，也可以在各張卡的設定裡分別調整。</p>

    <div class="section-label">資料</div>
    <div class="list">
      <RouterLink to="/settings/data" class="row">
        <span class="emoji">💾</span><span class="grow">備份、匯出與發票匯入<div class="sub">{{ backupAge === null ? '尚未備份' : `上次備份 ${backupAge} 天前` }}</div></span><span class="chev">›</span>
      </RouterLink>
    </div>

    <div class="section-label">外觀</div>
    <div class="list">
      <div class="field">
        <label>主題</label>
        <div class="seg" style="flex: 1">
          <button v-for="[t, l] in THEMES" :key="t" :class="{ on: ui.theme === t }" @click="ui.setTheme(t)">{{ l }}</button>
        </div>
      </div>
      <div class="field">
        <label>主題色</label>
        <div class="color-dots">
          <button v-for="[a, l, c] in ACCENTS" :key="a" :class="{ on: ui.accent === a }" :style="{ background: c }" :aria-label="l" :title="l" @click="ui.setAccent(a)" />
        </div>
      </div>
      <div class="field">
        <label>字體大小</label>
        <div class="seg" style="flex: 1">
          <button v-for="[f, l] in FONT_SCALES" :key="f" :class="{ on: ui.fontScale === f }" @click="ui.setFontScale(f)">{{ l }}</button>
        </div>
      </div>
    </div>

    <div class="section-label">隱私</div>
    <div class="list">
      <div class="field">
        <label class="grow">密碼鎖</label>
        <input :checked="pinOn" type="checkbox" class="switch" @click.prevent="pinSheet = pinOn ? 'off' : 'set'" />
      </div>
    </div>
    <p class="help">密碼鎖只是防止旁人隨手打開；資料存在瀏覽器裡並沒有加密。</p>

    <div class="list" style="margin-top: 18px">
      <RouterLink to="/help" class="row"><span class="emoji">❓</span><span class="grow">使用說明</span><span class="chev">›</span></RouterLink>
    </div>
    <p class="help" style="text-align: center; margin-top: 16px">囤囤帳 TunTun v{{ version }} · 資料只存在本機</p>

    <Sheet v-if="pinSheet" :title="pinSheet === 'set' ? '設定密碼' : '關閉密碼鎖'" @close="pinSheet = null">
      <div class="list">
        <div class="field"><label>{{ pinSheet === 'set' ? '新密碼' : '目前密碼' }}</label><input v-model="pin1" type="password" inputmode="numeric" maxlength="6" autocomplete="off" /></div>
        <div v-if="pinSheet === 'set'" class="field"><label>再輸入一次</label><input v-model="pin2" type="password" inputmode="numeric" maxlength="6" autocomplete="off" /></div>
      </div>
      <p v-if="pinSheet === 'set'" class="help">忘記密碼就只能清除網站資料，請先備份。</p>
      <button class="btn block" @click="commitPin">確定</button>
    </Sheet>
  </main>
</template>
