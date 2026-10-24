<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ file: File }>()
const emit = defineEmits<{ done: [data: string]; cancel: [] }>()

const BOX = 240
const OUT = 128

const url = URL.createObjectURL(props.file)
onBeforeUnmount(() => URL.revokeObjectURL(url))

const img = ref<HTMLImageElement>()
const nat = ref({ w: 0, h: 0 })
const zoom = ref(1)
const pos = ref({ x: 0, y: 0 })
const failed = ref(false)

// 縮放 1 = 剛好蓋滿方框
const scale = computed(() => (nat.value.w ? Math.max(BOX / nat.value.w, BOX / nat.value.h) * zoom.value : 1))

function clamp() {
  const w = nat.value.w * scale.value
  const h = nat.value.h * scale.value
  pos.value = {
    x: Math.min(0, Math.max(BOX - w, pos.value.x)),
    y: Math.min(0, Math.max(BOX - h, pos.value.y)),
  }
}

function onLoad() {
  const el = img.value!
  nat.value = { w: el.naturalWidth, h: el.naturalHeight }
  pos.value = { x: (BOX - el.naturalWidth * scale.value) / 2, y: (BOX - el.naturalHeight * scale.value) / 2 }
}

function setZoom(z: number) {
  // 以方框中心為準縮放
  const before = scale.value
  zoom.value = Math.min(4, Math.max(1, z))
  const r = scale.value / before
  pos.value = { x: BOX / 2 - (BOX / 2 - pos.value.x) * r, y: BOX / 2 - (BOX / 2 - pos.value.y) * r }
  clamp()
}

// 拖曳；兩指時縮放
const pointers = new Map<number, { x: number; y: number }>()
let pinch = 0
function down(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  pinch = pointers.size === 2 ? dist() : 0
}
function move(e: PointerEvent) {
  const p = pointers.get(e.pointerId)
  if (!p) return
  if (pointers.size === 1) {
    pos.value = { x: pos.value.x + e.clientX - p.x, y: pos.value.y + e.clientY - p.y }
    clamp()
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2 && pinch) {
    const d = dist()
    setZoom((zoom.value * d) / pinch)
    pinch = d
  }
}
function up(e: PointerEvent) {
  pointers.delete(e.pointerId)
  pinch = 0
}
function dist() {
  const [a, b] = [...pointers.values()]
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function confirm() {
  const c = document.createElement('canvas')
  c.width = c.height = OUT
  const ctx = c.getContext('2d')!
  const k = OUT / BOX
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img.value!, pos.value.x * k, pos.value.y * k, nat.value.w * scale.value * k, nat.value.h * scale.value * k)
  // 舊版 Safari 不能輸出 WebP，會退回 PNG
  const webp = c.toDataURL('image/webp', 0.85)
  emit('done', webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png'))
}
</script>

<template>
  <div class="cropper">
    <p v-if="failed" class="muted small">讀不到這張圖，換一張試試</p>
    <template v-else>
      <div class="box" :style="{ width: `${BOX}px`, height: `${BOX}px` }" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel.prevent="setZoom(zoom - $event.deltaY / 300)">
        <img
          ref="img"
          :src="url"
          alt=""
          draggable="false"
          :style="{ width: `${nat.w * scale}px`, height: `${nat.h * scale}px`, transform: `translate(${pos.x}px, ${pos.y}px)` }"
          @load="onLoad"
          @error="failed = true"
        />
      </div>
      <input class="zoom" type="range" min="1" max="4" step="0.01" :value="zoom" aria-label="縮放" @input="setZoom(+($event.target as HTMLInputElement).value)" />
      <p class="muted small">拖曳移動，滑桿或兩指縮放</p>
    </template>
    <div class="actions">
      <button class="btn ghost" @click="emit('cancel')">重選</button>
      <button class="btn" :disabled="failed || !nat.w" @click="confirm">使用這張</button>
    </div>
  </div>
</template>

<style scoped>
.cropper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.box { position: relative; overflow: hidden; border-radius: 30%; background: var(--surface-2); touch-action: none; cursor: grab; }
.box img { position: absolute; left: 0; top: 0; max-width: none; transform-origin: 0 0; user-select: none; pointer-events: none; }
.zoom { width: 240px; accent-color: var(--accent); }
.actions { display: flex; gap: 8px; width: 100%; }
.actions .btn { flex: 1; }
</style>
