<script setup lang="ts">
// 取代原生 <select>：沿用 <option> 寫法，選項另外用底部選單呈現；option 可加 data-icon / data-color / data-group
import { computed, onMounted, onUpdated, ref, useAttrs } from 'vue'
import CatIcon from './CatIcon.vue'
import Sheet from './Sheet.vue'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ modelValue?: unknown; disabled?: boolean; title?: string }>()
const emit = defineEmits<{ 'update:modelValue': [unknown] }>()
const attrs = useAttrs()

interface Opt { value: unknown; label: string; icon?: string; color?: string; group?: string; disabled: boolean }
const hidden = ref<HTMLSelectElement>()
const opts = ref<Opt[]>([])
function read() {
  const els = hidden.value ? [...hidden.value.options] : []
  opts.value = els.map((o) => ({
    value: '_value' in o ? (o as unknown as { _value: unknown })._value : o.value,
    label: o.text.trim(),
    icon: o.dataset.icon,
    color: o.dataset.color,
    group: o.dataset.group,
    disabled: o.disabled,
  }))
}
onMounted(read)
onUpdated(read)

const current = computed(() => opts.value.find((o) => !o.disabled && o.value === props.modelValue) ?? opts.value.find((o) => o.value === props.modelValue))
const open = ref(false)
const groups = computed(() => {
  const out: Array<{ name?: string; items: Opt[] }> = []
  for (const o of opts.value) {
    if (o.disabled) continue
    const last = out[out.length - 1]
    if (last && last.name === o.group) last.items.push(o)
    else out.push({ name: o.group, items: [o] })
  }
  return out
})
const placeholder = computed(() => opts.value.find((o) => o.disabled)?.label ?? '請選擇')

function pick(o: Opt) {
  emit('update:modelValue', o.value)
  open.value = false
}
</script>

<template>
  <select ref="hidden" class="u-hidden" tabindex="-1" aria-hidden="true"><slot /></select>
  <button type="button" class="u-select" :class="attrs.class" :style="attrs.style as any" :disabled="disabled" :aria-label="attrs['aria-label'] as string" @click="open = true">
    <CatIcon v-if="current?.icon" :icon="current.icon" :color="current.color" :size="22" />
    <span class="u-label" :class="{ muted: !current || current.disabled }">{{ current?.label ?? placeholder }}</span>
    <span v-if="!disabled" class="u-caret">▾</span>
  </button>
  <Sheet v-if="open" :title="title ?? (attrs['aria-label'] as string) ?? placeholder" @close="open = false">
    <div class="u-list">
      <template v-for="(g, k) in groups" :key="k">
        <div v-if="g.name" class="u-group">{{ g.name }}</div>
        <button v-for="(o, i) in g.items" :key="i" type="button" class="u-opt" :class="{ on: o.value === modelValue }" @click="pick(o)">
          <CatIcon v-if="o.icon" :icon="o.icon" :color="o.color" :size="30" />
          <span class="u-label">{{ o.label }}</span>
          <span v-if="o.value === modelValue" class="u-check">✓</span>
        </button>
      </template>
    </div>
  </Sheet>
</template>

<style scoped>
.u-hidden { display: none; }
.u-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; padding: 6px 0; font: inherit; font-size: 0.9375rem; color: var(--text); text-align: left; cursor: pointer; }
.u-select:disabled { cursor: default; opacity: 0.6; }
.u-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.u-caret { color: var(--muted); font-size: 0.75rem; }
.u-list { display: flex; flex-direction: column; gap: 2px; padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
.u-group { font-size: 0.75rem; color: var(--muted); margin: 10px 6px 4px; }
.u-opt { display: flex; align-items: center; gap: 12px; border: 0; background: var(--surface); border-radius: 14px; padding: 10px 14px; font: inherit; font-size: 1rem; color: var(--text); text-align: left; }
.u-opt.on { background: var(--accent-soft); font-weight: 600; }
.u-check { color: var(--accent); font-weight: 700; }
</style>
