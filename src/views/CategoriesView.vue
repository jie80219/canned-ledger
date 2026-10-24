<script setup lang="ts">
import { computed, ref } from 'vue'
import { uid } from '../db/schema'
import type { Category, CategoryKind } from '../db/types'
import { deleteCategory, reorder, saveCategory } from '../db/repo'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import TopBar from '../components/TopBar.vue'
import Sheet from '../components/Sheet.vue'
import IconPicker from '../components/IconPicker.vue'
import CatIcon from '../components/CatIcon.vue'

const ui = useUi()
const { categories } = useBook()
const kind = ref<CategoryKind>('expense')
const showHidden = ref(false)
const COLORS = ['#e8a87c', '#85a8c9', '#c39bd3', '#7fb59a', '#e6b450', '#d98c9f', '#8fb4a8', '#b8a07e', '#9aa6d6', '#c9a27e']

const tops = computed(() => categories.value.filter((c) => c.kind === kind.value && !c.parentId && (showHidden.value || !c.hidden)))
const childrenOf = (id: string) => categories.value.filter((c) => c.parentId === id && (showHidden.value || !c.hidden))
const expanded = ref<string>()

// 編輯
const edit = ref<Category | null>(null)
const showIcons = ref(false)
function openNew(parent?: Category) {
  const siblings = parent ? childrenOf(parent.id) : tops.value
  edit.value = {
    id: uid(),
    bookId: ui.bookId,
    kind: kind.value,
    parentId: parent?.id,
    name: '',
    icon: parent?.icon ?? '📦',
    color: parent?.color ?? COLORS[tops.value.length % COLORS.length],
    sortOrder: siblings.length,
    updatedAt: 0,
  }
}
const isNew = computed(() => !!edit.value && !categories.value.some((c) => c.id === edit.value!.id))
async function commit() {
  const c = edit.value!
  if (!c.name.trim()) return ui.notify('請輸入名稱')
  await saveCategory({ ...c, name: c.name.trim() })
  // 改大類顏色時，子類一起換
  if (!c.parentId) for (const ch of childrenOf(c.id)) if (ch.color !== c.color) await saveCategory({ ...ch, color: c.color })
  edit.value = null
}
async function toggleHidden() {
  const c = edit.value!
  await saveCategory({ ...c, hidden: !c.hidden })
  edit.value = null
}
async function remove() {
  const r = await deleteCategory(edit.value!.id)
  ui.notify(r === 'hidden' ? '分類已被使用，改為隱藏' : '已刪除')
  edit.value = null
}
async function move(list: Category[], i: number, d: -1 | 1) {
  const j = i + d
  if (j < 0 || j >= list.length) return
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  await reorder('categories', next)
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="分類管理" back>
      <button class="icon-btn" aria-label="新增大類" @click="openNew()">＋</button>
    </TopBar>
    <div class="seg" style="margin-bottom: 8px">
      <button :class="{ on: kind === 'expense' }" @click="kind = 'expense'">支出</button>
      <button :class="{ on: kind === 'income' }" @click="kind = 'income'">收入</button>
    </div>
    <label class="small muted hidden-toggle"><input v-model="showHidden" type="checkbox" /> 顯示已隱藏</label>

    <div class="list">
      <template v-for="(c, i) in tops" :key="c.id">
        <div class="row" :class="{ muted: c.hidden }">
          <button class="icon-tap" @click="edit = { ...c }"><CatIcon :icon="c.icon" :color="c.color" :size="38" /></button>
          <button class="grow plain left" @click="expanded = expanded === c.id ? undefined : c.id">
            {{ c.name }} <span v-if="c.hidden" class="badge">隱藏</span>
            <div class="sub">{{ childrenOf(c.id).length }} 個子分類 {{ expanded === c.id ? '▴' : '▾' }}</div>
          </button>
          <button class="mini" aria-label="上移" :disabled="i === 0" @click="move(tops, i, -1)">↑</button>
          <button class="mini" aria-label="下移" :disabled="i === tops.length - 1" @click="move(tops, i, 1)">↓</button>
        </div>
        <template v-if="expanded === c.id">
          <div v-for="(ch, j) in childrenOf(c.id)" :key="ch.id" class="row child" :class="{ muted: ch.hidden }">
            <button class="icon-tap" @click="edit = { ...ch }"><CatIcon :icon="ch.icon" :color="ch.color" :size="34" /></button>
            <button class="grow plain left" @click="edit = { ...ch }">{{ ch.name }} <span v-if="ch.hidden" class="badge">隱藏</span></button>
            <button class="mini" aria-label="上移" :disabled="j === 0" @click="move(childrenOf(c.id), j, -1)">↑</button>
            <button class="mini" aria-label="下移" :disabled="j === childrenOf(c.id).length - 1" @click="move(childrenOf(c.id), j, 1)">↓</button>
          </div>
          <button class="row child" @click="openNew(c)"><span class="emoji">＋</span><span class="grow" style="color: var(--accent)">新增子分類</span></button>
        </template>
      </template>
    </div>
    <p class="help" style="margin-top: 10px">點圖示編輯，點名稱展開子分類。刪除已使用的分類會改為隱藏，舊交易不受影響。</p>

    <Sheet v-if="edit" :title="isNew ? (edit.parentId ? '新增子分類' : '新增分類') : '編輯分類'" @close="edit = null">
      <div class="list">
        <div class="field">
          <button class="icon-tap" @click="showIcons = true"><CatIcon :icon="edit.icon" :color="edit.color" :size="44" /></button>
          <input v-model="edit.name" placeholder="名稱" maxlength="12" />
        </div>
        <div v-if="!edit.parentId" class="field">
          <label>顏色</label>
          <div class="color-dots">
            <button v-for="col in COLORS" :key="col" :class="{ on: edit.color === col }" :style="{ background: col }" :aria-label="col" @click="edit.color = col" />
          </div>
        </div>
      </div>
      <button class="btn block" @click="commit">儲存</button>
      <div v-if="!isNew" class="sheet-actions">
        <button class="btn ghost" @click="toggleHidden">{{ edit.hidden ? '取消隱藏' : '隱藏' }}</button>
        <button class="btn danger" @click="remove">刪除</button>
      </div>
    </Sheet>
    <IconPicker v-if="showIcons && edit" v-model="edit.icon" :name="edit.name" :color="edit.color" @close="showIcons = false" />
  </main>
</template>

<style scoped>
.hidden-toggle { display: flex; align-items: center; gap: 6px; margin: 0 4px 10px; justify-content: flex-end; }
.plain { border: 0; background: transparent; padding: 0; color: inherit; font: inherit; }
.left { text-align: left; }
.emoji.plain { background: var(--surface-2); }
.child { padding-left: 34px; }
.mini { border: 0; background: var(--surface-2); width: 30px; height: 30px; border-radius: 8px; color: var(--muted); }
.mini:disabled { opacity: 0.3; }
.icon-pick { border: 0; flex: none; font-size: 1.25rem; }
.sheet-actions { display: flex; gap: 8px; margin-top: 8px; }
.sheet-actions .btn { flex: 1; }
</style>
