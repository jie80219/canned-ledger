<script setup lang="ts">
import { computed, ref } from 'vue'
import { ICONS } from '../db/seed'
import { CHARACTERS, GLYPHS, recommendIcons } from '../icons'
import CatIcon from './CatIcon.vue'
import Sheet from './Sheet.vue'

const props = withDefaults(defineProps<{ name?: string; color?: string }>(), { name: '', color: '#7a9a6b' })
const model = defineModel<string>({ required: true })
const emit = defineEmits<{ close: [] }>()

type Tab = 'rec' | 'all' | 'emoji'
const recommended = computed(() => recommendIcons(props.name.trim()))
const tab = ref<Tab>(recommended.value.length ? 'rec' : 'all')
const q = ref('')

const all = computed(() => {
  const k = q.value.trim().toLowerCase()
  const entries = [...Object.entries(GLYPHS), ...Object.entries(CHARACTERS)]
  return entries
    .filter(([id, g]) => !k || g.name.includes(k) || g.tags.some((t) => t.toLowerCase().includes(k)) || id.includes(k))
    .map(([id]) => `svg:${id}`)
})

function pick(i: string) {
  model.value = i
  emit('close')
}
</script>

<template>
  <Sheet title="選擇圖示" @close="emit('close')">
    <div class="tabs">
      <button v-if="recommended.length" :class="{ on: tab === 'rec' }" @click="tab = 'rec'">推薦</button>
      <button :class="{ on: tab === 'all' }" @click="tab = 'all'">全部圖示</button>
      <button :class="{ on: tab === 'emoji' }" @click="tab = 'emoji'">emoji</button>
    </div>
    <input v-if="tab === 'all'" v-model="q" class="search" type="search" placeholder="搜尋，例如：咖啡、捷運、貓" />
    <div v-if="tab === 'emoji'" class="icons">
      <button v-for="i in ICONS" :key="i" class="em" :class="{ on: i === model }" @click="pick(i)">{{ i }}</button>
    </div>
    <div v-else class="icons">
      <button v-for="i in tab === 'rec' ? recommended : all" :key="i" :class="{ on: i === model }" @click="pick(i)">
        <CatIcon :icon="i" :color="color" :size="40" />
      </button>
      <p v-if="tab === 'all' && !all.length" class="muted small empty">找不到「{{ q }}」，換個關鍵字試試</p>
    </div>
  </Sheet>
</template>

<style scoped>
.tabs { display: flex; gap: 6px; margin-bottom: 10px; }
.tabs button { flex: 1; padding: 6px 0; border: 1px solid var(--border); border-radius: 10px; background: transparent; font: inherit; color: inherit; }
.tabs button.on { background: var(--accent-soft); border-color: var(--accent); font-weight: 600; }
.search { width: 100%; margin-bottom: 10px; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; background: var(--surface); color: inherit; font-size: 1rem; }
.icons { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
.icons button { border: 0; background: transparent; aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center; padding: 0; }
.icons button.em { font-size: 1.5rem; }
.icons button.on { background: var(--accent-soft); outline: 2px solid var(--accent); }
.empty { grid-column: 1 / -1; text-align: center; }
</style>
