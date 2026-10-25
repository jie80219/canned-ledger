<script setup lang="ts">
// 列表左右滑動：往左露出右側按鈕（滑到底直接執行第一個），往右露出左側按鈕
import { ref } from 'vue'

export interface SwipeAction { label: string; color: string; run: () => void }
const props = defineProps<{ left?: SwipeAction[]; right?: SwipeAction[]; open?: 'left' | 'right' | null }>()
const emit = defineEmits<{ open: ['left' | 'right' | null] }>()

const BTN = 76
const x = ref(0)
const dragging = ref(false)
const el = ref<HTMLElement>()
let start: { x: number; y: number; base: number } | null = null
let horizontal = false
let moved = false

const rest = () => (props.open === 'left' ? (props.left?.length ?? 0) * BTN : props.open === 'right' ? -(props.right?.length ?? 0) * BTN : 0)

function down(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  start = { x: e.clientX, y: e.clientY, base: rest() }
  horizontal = false
  moved = false
}
function move(e: PointerEvent) {
  if (!start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (!horizontal) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) return (start = null)
    if (Math.abs(dx) < 10) return
    horizontal = true
    moved = true
    dragging.value = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  let v = start.base + dx
  if (v > 0 && !props.left?.length) v = 0
  if (v < 0 && !props.right?.length) v = 0
  x.value = v
}
function up() {
  if (!start) return
  start = null
  if (!horizontal) return
  dragging.value = false
  const w = el.value?.offsetWidth ?? 360
  const v = x.value
  x.value = 0
  if (v < -w * 0.6 && props.right?.length) return emit('open', null), props.right[0].run()
  if (v < -BTN / 2) return emit('open', 'right')
  if (v > BTN / 2) return emit('open', 'left')
  emit('open', null)
}
function cancel() {
  start = null
  dragging.value = false
  x.value = 0
}
// 滑動後放開不要觸發點擊；已展開時點一下先收合
function click(e: MouseEvent) {
  if (moved || props.open) {
    e.preventDefault()
    e.stopPropagation()
    if (!moved) emit('open', null)
  }
  moved = false
}
function act(a: SwipeAction) {
  emit('open', null)
  a.run()
}
</script>

<template>
  <div ref="el" class="swipe">
    <div v-if="left?.length" class="acts acts-l">
      <button v-for="a in left" :key="a.label" type="button" :style="{ background: a.color }" @click="act(a)">{{ a.label }}</button>
    </div>
    <div v-if="right?.length" class="acts acts-r">
      <button v-for="a in right" :key="a.label" type="button" :style="{ background: a.color }" @click="act(a)">{{ a.label }}</button>
    </div>
    <div
      class="front"
      :class="{ dragging }"
      :style="{ transform: `translateX(${dragging ? x : rest()}px)` }"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="cancel"
      @click.capture="click"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.swipe { position: relative; overflow: hidden; }
.front { position: relative; background: var(--surface); transition: transform 0.22s ease; touch-action: pan-y; }
.front.dragging { transition: none; }
.acts { position: absolute; top: 0; bottom: 0; display: flex; }
.acts-l { left: 0; }
.acts-r { right: 0; }
.acts button { width: 76px; border: 0; color: #fff; font: inherit; font-size: 0.875rem; font-weight: 600; }
</style>
