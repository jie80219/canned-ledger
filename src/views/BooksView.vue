<script setup lang="ts">
import { computed, ref } from 'vue'
import { db } from '../db/schema'
import type { Book } from '../db/types'
import { deleteBook, saveBook } from '../db/repo'
import { createBook } from '../db/seed'
import { useLive } from '../composables/useLive'
import { useUi } from '../stores/ui'
import { CURRENCIES } from '../domain/money'
import TopBar from '../components/TopBar.vue'
import Sheet from '../components/Sheet.vue'
import IconPicker from '../components/IconPicker.vue'
import CatIcon from '../components/CatIcon.vue'

const ui = useUi()
const books = useLive<Book[]>(() => db.books.orderBy('sortOrder').toArray(), [])
const edit = ref<Partial<Book> | null>(null)
const showIcons = ref(false)
const confirmName = ref('')
const isNew = computed(() => !!edit.value && !edit.value.id)

function openNew() {
  edit.value = { name: '', icon: '✈️', currency: 'TWD' }
  confirmName.value = ''
}
function openEdit(b: Book) {
  edit.value = { ...b }
  confirmName.value = ''
}
async function commit() {
  const e = edit.value!
  if (!e.name?.trim()) return ui.notify('請輸入帳本名稱')
  if (isNew.value) {
    const b = await createBook({ name: e.name.trim(), icon: e.icon!, currency: e.currency! })
    ui.setBook(b.id)
    ui.notify(`已建立「${b.name}」並切換過去`)
  } else await saveBook({ ...(e as Book), name: e.name.trim() })
  edit.value = null
}
async function remove() {
  const e = edit.value as Book
  if (books.value.length <= 1) return ui.notify('至少要保留一個帳本')
  const name = books.value.find((b) => b.id === e.id)?.name
  if (confirmName.value !== name) return ui.notify('請輸入帳本名稱確認刪除')
  await deleteBook(e.id)
  if (ui.bookId === e.id) ui.setBook(books.value.find((b) => b.id !== e.id)!.id)
  ui.notify('已刪除帳本')
  edit.value = null
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="帳本管理" back>
      <button class="icon-btn" aria-label="新增帳本" @click="openNew">＋</button>
    </TopBar>
    <p class="help">每個帳本有自己的幣別、帳戶、分類與預算，適合把旅行、家庭、代墊分開記。</p>
    <div class="list">
      <div v-for="b in books" :key="b.id" class="row">
        <button class="icon-tap" @click="openEdit(b)"><CatIcon :icon="b.icon" :color="b.color" :size="38" /></button>
        <button class="grow plain left" @click="ui.setBook(b.id); ui.notify(`切換到「${b.name}」`)">
          {{ b.name }}<div class="sub">{{ b.currency }}</div>
        </button>
        <span v-if="b.id === ui.bookId" class="badge">使用中</span>
        <button class="mini" aria-label="編輯" @click="openEdit(b)">✎</button>
      </div>
    </div>

    <Sheet v-if="edit" :title="isNew ? '新增帳本' : '編輯帳本'" @close="edit = null">
      <div class="list">
        <div class="field">
          <button class="icon-tap" @click="showIcons = true"><CatIcon :icon="edit.icon" :color="edit.color ?? '#7a9a6b'" :size="44" /></button>
          <input v-model="edit.name" placeholder="例如：東京旅行" maxlength="20" />
        </div>
        <div class="field">
          <label>幣別</label>
          <select v-model="edit.currency" :disabled="!isNew">
            <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">{{ c.code }} {{ c.name }}</option>
          </select>
        </div>
      </div>
      <p v-if="isNew" class="help">會自動建立一個「現金」帳戶與預設分類。帳本幣別建立後不能改，統計會換算成這個幣別。</p>
      <button class="btn block" @click="commit">{{ isNew ? '建立' : '儲存' }}</button>
      <template v-if="!isNew && books.length > 1">
        <div class="section-label">刪除帳本（帳本內所有資料都會刪除）</div>
        <div class="list"><div class="field"><input v-model="confirmName" :placeholder="`輸入「${books.find((b) => b.id === edit!.id)?.name}」確認`" /></div></div>
        <button class="btn danger block" @click="remove">刪除帳本</button>
      </template>
    </Sheet>
    <IconPicker v-if="showIcons && edit" v-model="edit.icon!" @close="showIcons = false" />
  </main>
</template>

<style scoped>
.plain { border: 0; background: transparent; padding: 0; color: inherit; font: inherit; }
.left { text-align: left; }
.emoji.plain { background: var(--surface-2); }
.mini { border: 0; background: var(--surface-2); width: 30px; height: 30px; border-radius: 8px; color: var(--muted); }
.icon-pick { border: 0; flex: none; font-size: 1.25rem; }
</style>
