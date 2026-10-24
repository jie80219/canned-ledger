<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TopBar from '../components/TopBar.vue'
import CatIcon from '../components/CatIcon.vue'
import { EXPENSE, INCOME, PALETTE } from '../db/seed'
import { CATEGORY_CHARACTER, CATEGORY_GLYPHS, CHARACTERS, GLYPHS } from '../icons'

type Mark = 'like' | 'nope'
interface Row { name: string; parent?: string; emoji: string; color: string; options: string[] }

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const seen = new Set<string>()
  for (const [kind, seeds] of [['支出', EXPENSE], ['收入', INCOME]] as const) {
    seeds.forEach(([name, emoji, children], i) => {
      const color = PALETTE[i % PALETTE.length]
      const push = (n: string, e: string, parent?: string) => {
        if (seen.has(n) || !CATEGORY_GLYPHS[n]) return
        seen.add(n)
        const chr = parent ? undefined : CATEGORY_CHARACTER[n]
        out.push({ name: n, parent: parent ?? kind, emoji: e, color, options: [...CATEGORY_GLYPHS[n], ...(chr ? [chr] : [])] })
      }
      push(name, emoji)
      children?.forEach(([cn, ce]) => push(cn, ce, name))
    })
  }
  return out
})

const KEY = 'cl.iconPreview'
const marks = ref<Record<string, Mark>>(load())
function load(): Record<string, Mark> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}
watch(marks, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 無痕模式 */ } }, { deep: true })

const k = (row: Row, opt: string) => `${row.name}/${opt}`
function cycle(row: Row, opt: string) {
  const id = k(row, opt)
  const cur = marks.value[id]
  if (!cur) marks.value[id] = 'like'
  else if (cur === 'like') marks.value[id] = 'nope'
  else delete marks.value[id]
}

const dark = ref(false)
const mono = ref(false)
const label = (opt: string) => (GLYPHS[opt] ?? CHARACTERS[opt])?.name ?? opt

const summary = computed(() =>
  rows.value
    .map((r) => {
      const like = r.options.filter((o) => marks.value[k(r, o)] === 'like').map(label)
      const nope = r.options.filter((o) => marks.value[k(r, o)] === 'nope').map(label)
      if (!like.length && !nope.length) return ''
      return `${r.name}：${like.length ? `喜歡 ${like.join('、')}` : ''}${like.length && nope.length ? '；' : ''}${nope.length ? `不要 ${nope.join('、')}` : ''}`
    })
    .filter(Boolean)
    .join('\n'),
)
const counts = computed(() => {
  const v = Object.values(marks.value)
  return { like: v.filter((m) => m === 'like').length, nope: v.filter((m) => m === 'nope').length }
})

const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(summary.value || '全部都可以')
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
function reset() { marks.value = {} }
</script>

<template>
  <main class="page no-nav" :class="{ 'preview-dark': dark }">
    <TopBar title="圖示預覽" back />

    <section class="card intro">
      <p>每個分類有 3 款自繪圖示，大類另外多一款「囤囤角色風」。點圖示切換：<b class="like-t">✓ 喜歡</b> → <b class="nope-t">✗ 不要</b> → 不標。全部挑完按「複製結果」貼回來給我。</p>
      <div class="toggles">
        <label><input v-model="dark" type="checkbox" /> 深色背景</label>
        <label><input v-model="mono" type="checkbox" /> 單色</label>
      </div>
    </section>

    <section v-for="r in rows" :key="r.parent + r.name" class="cat-row">
      <div class="cat-name">
        <span class="parent">{{ r.parent }}</span>
        <b>{{ r.name }}</b>
      </div>
      <div class="tiles">
        <div class="tile ref">
          <CatIcon :icon="r.emoji" :color="mono ? '#888' : r.color" :size="44" />
          <span>emoji</span>
        </div>
        <button v-for="o in r.options" :key="o" class="tile" :class="marks[k(r, o)]" @click="cycle(r, o)">
          <CatIcon :icon="'svg:' + o" :color="mono ? (dark ? '#e8e2d6' : '#3d3328') : r.color" :size="44" />
          <span>{{ label(o) }}</span>
          <i v-if="marks[k(r, o)]" class="badge">{{ marks[k(r, o)] === 'like' ? '✓' : '✗' }}</i>
        </button>
      </div>
    </section>

    <div class="bar">
      <span class="small">✓ {{ counts.like }}　✗ {{ counts.nope }}</span>
      <button class="btn ghost" @click="reset">清除</button>
      <button class="btn" @click="copy">{{ copied ? '已複製' : '複製結果' }}</button>
    </div>
  </main>
</template>

<style scoped>
.intro p { margin: 0 0 10px; line-height: 1.6; }
.toggles { display: flex; gap: 16px; }
.toggles label { display: flex; align-items: center; gap: 6px; }
.like-t { color: #4f9a5c; }
.nope-t { color: #d0574b; }
.cat-row { padding: 10px 4px; border-bottom: 1px solid var(--border); }
.cat-name { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.parent { font-size: 0.75rem; color: var(--muted); }
.tiles { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.tile { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 2px 6px; border-radius: 14px; border: 2px solid transparent; background: var(--surface); font: inherit; color: inherit; cursor: pointer; }
.tile span { font-size: 0.6875rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.tile.ref { background: transparent; cursor: default; }
.tile.like { border-color: #4f9a5c; }
.tile.nope { border-color: #d0574b; opacity: 0.45; }
.badge { position: absolute; top: 2px; right: 4px; font-style: normal; font-size: 0.75rem; font-weight: 700; }
.like .badge { color: #4f9a5c; }
.nope .badge { color: #d0574b; }
.preview-dark .cat-row { background: #23201c; }
.preview-dark .tile { background: #2e2a25; }
.preview-dark .tile.ref { background: transparent; }
.preview-dark .cat-name b { color: #f0ebe2; }
.bar { position: sticky; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 10px 4px calc(var(--safe-b) + 10px); background: var(--bg); border-top: 1px solid var(--border); }
.bar .small { flex: 1; }
</style>
