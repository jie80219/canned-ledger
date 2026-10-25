<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MerchantRule } from '../db/types'
import { useBook } from '../composables/useBook'
import { getRules, setRules } from '../io/rules'
import TopBar from '../components/TopBar.vue'
import { iconText } from '../icons'

const { bookId, categories, categoryMap } = useBook()
const rules = ref<MerchantRule[]>([])
const keyword = ref('')
const categoryId = ref('')

watch(bookId, async (id) => (rules.value = await getRules(id)), { immediate: true })

const cats = computed(() => {
  const list = categories.value.filter((c) => c.kind === 'expense' && !c.hidden)
  return list.filter((c) => !c.parentId).flatMap((t) => [t, ...list.filter((c) => c.parentId === t.id)])
})
const label = (id: string) => {
  const c = categoryMap.value.get(id)
  if (!c) return '（分類已刪除）'
  const p = c.parentId ? categoryMap.value.get(c.parentId) : undefined
  return `${iconText(c.icon)} ${p ? p.name + ' › ' : ''}${c.name}`
}
async function persist(next: MerchantRule[]) {
  rules.value = next
  await setRules(bookId.value, next)
}
async function add() {
  const k = keyword.value.trim()
  if (!k || !categoryId.value) return
  await persist([{ keyword: k, categoryId: categoryId.value }, ...rules.value.filter((r) => r.keyword !== k)])
  keyword.value = ''
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="店家自動分類" back />
    <p class="help">匯入發票時，店名或品項包含關鍵字就自動套用分類，由上往下比對第一個符合的規則。</p>
    <div class="list">
      <div class="field"><label>關鍵字</label><input v-model="keyword" placeholder="例如：全家、星巴克" maxlength="30" /></div>
      <div class="field">
        <label>分類</label>
        <USelect v-model="categoryId">
          <option value="" disabled>選擇分類</option>
          <option v-for="c in cats" :key="c.id" :value="c.id" :data-icon="c.icon" :data-color="c.color">{{ label(c.id) }}</option>
        </USelect>
      </div>
    </div>
    <button class="btn block" :disabled="!keyword.trim() || !categoryId" @click="add">新增規則</button>

    <div v-if="rules.length" class="section-label">{{ rules.length }} 條規則</div>
    <div class="list">
      <div v-for="r in rules" :key="r.keyword" class="row">
        <span class="grow">{{ r.keyword }}<div class="sub">→ {{ label(r.categoryId) }}</div></span>
        <button class="icon-btn" aria-label="刪除" @click="persist(rules.filter((x) => x !== r))">✕</button>
      </div>
    </div>
  </main>
</template>
