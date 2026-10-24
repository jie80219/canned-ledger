<script setup lang="ts">
import { computed } from 'vue'
import type { GoalStyle } from '../db/types'

const props = withDefaults(defineProps<{ kind: GoalStyle; frac: number; size?: number }>(), { size: 64 })
const f = computed(() => Math.min(1, Math.max(0, props.frac)))
const uid = `g${Math.random().toString(36).slice(2, 8)}`
// 房子：由下往上 5 層、每層 2 塊
const bricks = computed(() => Array.from({ length: 10 }, (_, i) => ({ x: 22 + (i % 2) * 18, y: 70 - Math.floor(i / 2) * 9, on: i < Math.floor(f.value * 10) })))
const leaves = computed(() => Math.floor(f.value * 6))
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 80 80" aria-hidden="true" class="goal-art">
    <template v-if="kind === 'jar'">
      <clipPath :id="uid"><path d="M22 22h36v4c6 4 8 10 8 18v22a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V44c0-8 2-14 8-18Z" /></clipPath>
      <rect x="10" :y="74 - 52 * f" width="60" :height="52 * f" fill="#e8b84a" :clip-path="`url(#${uid})`" />
      <path d="M22 22h36v4c6 4 8 10 8 18v22a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8V44c0-8 2-14 8-18Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="20" y="14" width="40" height="8" rx="3" fill="#c9705a" />
      <rect x="34" y="17" width="12" height="2.5" rx="1" fill="#fff" />
    </template>
    <template v-else-if="kind === 'plant'">
      <path :d="`M40 66V${66 - 46 * f}`" stroke="#5f8a4f" stroke-width="3" stroke-linecap="round" />
      <ellipse v-for="i in leaves" :key="i" :cx="40 + (i % 2 ? -7 : 7)" :cy="62 - i * 7" rx="7" ry="3.5" :transform="`rotate(${i % 2 ? 30 : -30} ${40 + (i % 2 ? -7 : 7)} ${62 - i * 7})`" fill="#7a9a6b" />
      <g v-if="f >= 1"><circle cx="40" cy="18" r="7" fill="#f2a28f" /><circle cx="40" cy="18" r="3" fill="#f2c94c" /></g>
      <path d="M24 64h32l-4 12H28Z" fill="#c9705a" />
    </template>
    <template v-else>
      <rect v-for="(b, i) in bricks" :key="i" :x="b.x" :y="b.y" width="17" height="8" rx="1.5" :fill="b.on ? '#e8a65c' : 'none'" :stroke="b.on ? 'none' : 'currentColor'" stroke-opacity=".25" stroke-dasharray="2 2" />
      <path v-if="f >= 1" d="M16 34 40 14l24 20Z" fill="#c9705a" />
      <path d="M10 78h60" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </template>
  </svg>
</template>

<style scoped>
.goal-art { color: var(--muted); flex: none; }
</style>
