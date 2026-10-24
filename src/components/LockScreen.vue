<script setup lang="ts">
import { ref } from 'vue'
import { verifyPin } from '../domain/lock'
import { useUi } from '../stores/ui'

const ui = useUi()
const pin = ref('')
const error = ref(false)

async function press(k: string) {
  error.value = false
  if (k === '⌫') pin.value = pin.value.slice(0, -1)
  else if (pin.value.length < 6) pin.value += k
  if (pin.value.length >= 4) {
    if (await verifyPin(pin.value)) ui.locked = false
    else if (pin.value.length === 6) {
      error.value = true
      pin.value = ''
    }
  }
}
</script>

<template>
  <div class="lock">
    <div class="mascot">🐹</div>
    <p>{{ error ? '密碼錯誤，再試一次' : '輸入密碼' }}</p>
    <div class="dots">
      <i v-for="i in 6" :key="i" :class="{ on: i <= pin.length }" />
    </div>
    <div class="pad">
      <button v-for="k in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']" :key="k" :disabled="!k" @click="press(k)">
        {{ k }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.lock { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 16px; }
.mascot { font-size: 3.5rem; }
.dots { display: flex; gap: 12px; margin: 8px 0 24px; }
.dots i { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--muted); }
.dots i.on { background: var(--accent); border-color: var(--accent); }
.pad { display: grid; grid-template-columns: repeat(3, 72px); gap: 14px; }
.pad button { height: 72px; border-radius: 50%; border: 0; background: var(--surface); font-size: 1.625rem; box-shadow: var(--shadow); }
.pad button:disabled { visibility: hidden; }
</style>
