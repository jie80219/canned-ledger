<script setup lang="ts">
// 計算機鍵盤：支援 + − × ÷
import { OPS, evaluate } from '../domain/calc'
const expr = defineModel<string>({ required: true })
const props = defineProps<{ decimals: number; submitLabel?: string }>()
const emit = defineEmits<{ submit: [] }>()

function press(k: string) {
  let s = expr.value
  if (k === '⌫') s = s.slice(0, -1)
  else if (k === 'C') s = ''
  else if (OPS.includes(k)) {
    if (!s) return
    s = OPS.includes(s.slice(-1)) ? s.slice(0, -1) + k : s + k
  } else if (k === '.') {
    if (props.decimals === 0) return
    const last = s.split(/[+−×÷]/).pop() ?? ''
    if (last.includes('.')) return
    s += last ? '.' : '0.'
  } else {
    const last = s.split(/[+−×÷]/).pop() ?? ''
    const dot = last.indexOf('.')
    if (dot >= 0 && last.length - dot > props.decimals) return
    if (last === '0') s = s.slice(0, -1)
    if (last.replace('.', '').length >= 10) return
    s += k
  }
  expr.value = s
}

const hasOp = () => /[+−×÷]/.test(expr.value.slice(1))
function onSubmit() {
  if (hasOp()) {
    const v = Math.max(0, evaluate(expr.value))
    expr.value = String(Number(v.toFixed(props.decimals)))
  } else emit('submit')
}
</script>

<template>
  <div class="keypad">
    <button v-for="k in ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '.', '0', '⌫', '+']" :key="k" :class="{ op: OPS.includes(k) || k === '⌫' }" @click="press(k)">
      {{ k }}
    </button>
    <button class="ok" @click="onSubmit">{{ hasOp() ? '=' : submitLabel ?? '完成' }}</button>
  </div>
</template>

<style scoped>
.keypad { display: grid; grid-template-columns: repeat(4, 1fr) 1.2fr; grid-template-rows: repeat(4, 54px); gap: 6px; }
.keypad button { border: 0; border-radius: 14px; background: var(--surface); font-size: 1.375rem; box-shadow: var(--shadow); }
.keypad button:active { background: var(--surface-2); }
.keypad .op { color: var(--accent); background: var(--accent-soft); }
.ok { grid-column: 5; grid-row: 1 / span 4; background: var(--accent) !important; color: var(--on-accent); font-size: 1.125rem !important; font-weight: 600; }
</style>
