import type USelect from './components/USelect.vue'

declare module 'vue' {
  interface GlobalComponents {
    USelect: typeof USelect
  }
}
export {}
