<script setup lang="ts">
const items = [
  { to: '/', icon: '🧾', label: '明細' },
  { to: '/stats', icon: '📊', label: '統計' },
  { to: '/accounts', icon: '👛', label: '帳戶' },
  { to: '/settings', icon: '⚙️', label: '設定' },
]
</script>

<template>
  <nav class="nav">
    <RouterLink v-for="(it, i) in items.slice(0, 2)" :key="i" :to="it.to" class="item" active-class="" exact-active-class="on">
      <span class="ic">{{ it.icon }}</span>{{ it.label }}
    </RouterLink>
    <RouterLink to="/add" class="add" aria-label="記一筆">＋</RouterLink>
    <RouterLink v-for="(it, i) in items.slice(2)" :key="i + 2" :to="it.to" class="item" active-class="" exact-active-class="on">
      <span class="ic">{{ it.icon }}</span>{{ it.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: calc(var(--nav-h) + var(--safe-b));
  padding-bottom: var(--safe-b);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
}
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
  width: 60px;
  filter: grayscale(1);
  opacity: 0.75;
}
.item.on { color: var(--text); filter: none; opacity: 1; font-weight: 600; }
.ic { font-size: 21px; line-height: 1.2; }
.add {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: var(--accent);
  color: var(--on-accent);
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 300;
  margin-top: -18px;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 40%, transparent);
}
</style>
