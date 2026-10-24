<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { db, migrateLegacyDb } from './db/schema'
import { ensureSeed } from './db/seed'
import { runScheduler } from './domain/scheduler'
import { hasPin } from './domain/lock'
import { applyFontScale, applyTheme, useUi } from './stores/ui'
import BottomNav from './components/BottomNav.vue'
import LockScreen from './components/LockScreen.vue'

const ui = useUi()
const route = useRoute()
const ready = ref(false)
let lastRun = 0

async function schedule() {
  // 切換前景很頻繁，最多每分鐘跑一次
  if (Date.now() - lastRun < 60_000) return
  lastRun = Date.now()
  try {
    const res = await runScheduler()
    if (res.created) ui.scheduler = res
  } catch (e) {
    console.error('[scheduler]', e)
  }
}

async function onVisible() {
  if (document.visibilityState !== 'visible') return
  if (await hasPin()) ui.locked = true
  schedule()
}

onMounted(async () => {
  applyTheme(ui.theme, ui.accent)
  applyFontScale(ui.fontScale)
  await migrateLegacyDb()
  const firstId = await ensureSeed()
  if (!ui.bookId || !(await db.books.get(ui.bookId))) ui.setBook(firstId)
  ui.locked = await hasPin()
  ready.value = true
  schedule()
  // 降低瀏覽器自動清除 IndexedDB 的機率
  navigator.storage?.persist?.().catch(() => {})
  document.addEventListener('visibilitychange', onVisible)
})
onUnmounted(() => document.removeEventListener('visibilitychange', onVisible))
</script>

<template>
  <LockScreen v-if="ui.locked" />
  <template v-else-if="ready">
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="route.path" />
    </RouterView>
    <BottomNav v-if="route.meta.nav" />
  </template>
  <div v-if="ui.toast" class="toast" role="status">{{ ui.toast }}</div>
</template>
