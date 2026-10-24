<script setup lang="ts">
import { ICONS } from '../db/seed'
import Sheet from './Sheet.vue'

const model = defineModel<string>({ required: true })
const emit = defineEmits<{ close: [] }>()
function pick(i: string) {
  model.value = i
  emit('close')
}
</script>

<template>
  <Sheet title="選擇圖示" @close="emit('close')">
    <div class="icons">
      <button v-for="i in ICONS" :key="i" :class="{ on: i === model }" @click="pick(i)">{{ i }}</button>
    </div>
  </Sheet>
</template>

<style scoped>
.icons { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
.icons button { border: 0; background: transparent; font-size: 24px; aspect-ratio: 1; border-radius: 10px; }
.icons button.on { background: var(--accent-soft); }
</style>
