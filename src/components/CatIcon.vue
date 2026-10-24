<script setup lang="ts">
import { computed } from 'vue'
import { iconSvg, parseIcon } from '../icons'
import { assetUrl } from '../icons/assets'

const props = withDefaults(defineProps<{ icon?: string; color?: string; size?: number; tint?: boolean }>(), {
  color: '#999',
  size: 36,
  tint: true,
})

const parsed = computed(() => parseIcon(props.icon))
const svg = computed(() => (parsed.value.kind === 'svg' || parsed.value.kind === 'chr' ? iconSvg(parsed.value.value) : ''))
const style = computed(() => {
  const k = parsed.value.kind
  return {
    width: `${props.size / 16}rem`,
    height: `${props.size / 16}rem`,
    color: props.color,
    background: k === 'txt' ? props.color : k === 'chr' || k === 'img' || !props.tint ? 'transparent' : props.color + '26',
  }
})
const txtSize = computed(() => {
  const n = [...parsed.value.value].length
  return `${(props.size * (n <= 1 ? 0.5 : n === 2 ? 0.4 : 0.3)) / 16}rem`
})
</script>

<template>
  <span class="cat-icon" :class="parsed.kind" :style="style">
    <span v-if="svg" class="svg" v-html="svg" />
    <img v-else-if="parsed.kind === 'img'" class="img" :src="assetUrl(parsed.value)" alt="" />
    <span v-else-if="parsed.kind === 'txt'" class="txt" :style="{ fontSize: txtSize }">{{ parsed.value }}</span>
    <span v-else class="em" :style="{ fontSize: `${(size * 0.55) / 16}rem` }">{{ parsed.value || '📦' }}</span>
  </span>
</template>

<style scoped>
.cat-icon { display: inline-flex; align-items: center; justify-content: center; border-radius: 30%; flex: none; overflow: hidden; line-height: 1; }
.svg { display: flex; width: 60%; height: 60%; }
.chr .svg { width: 100%; height: 100%; }
.svg :deep(svg) { width: 100%; height: 100%; }
img.img { width: 100%; height: 100%; object-fit: cover; }
.txt { color: #fff; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; }
</style>
