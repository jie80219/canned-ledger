import { defineStore } from 'pinia'
import type { SchedulerResult } from '../domain/scheduler'

export type ThemeMode = 'auto' | 'light' | 'dark'
export type Accent = 'olive' | 'berry' | 'sky' | 'peach'

// 只是個人偏好，存 localStorage；讀寫失敗（無痕模式等）時退回預設值
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

export const useUi = defineStore('ui', {
  state: () => ({
    bookId: load('cl.bookId', ''),
    theme: load<ThemeMode>('cl.theme', 'auto'),
    accent: load<Accent>('cl.accent', 'olive'),
    toast: '' as string,
    scheduler: null as SchedulerResult | null,
    locked: false,
  }),
  actions: {
    setBook(id: string) {
      this.bookId = id
      save('cl.bookId', id)
    },
    setTheme(t: ThemeMode) {
      this.theme = t
      save('cl.theme', t)
      applyTheme(this.theme, this.accent)
    },
    setAccent(a: Accent) {
      this.accent = a
      save('cl.accent', a)
      applyTheme(this.theme, this.accent)
    },
    notify(msg: string) {
      this.toast = msg
      setTimeout(() => {
        if (this.toast === msg) this.toast = ''
      }, 2600)
    },
  },
})

export function applyTheme(mode: ThemeMode, accent: Accent) {
  const el = document.documentElement
  if (mode === 'auto') delete el.dataset.theme
  else el.dataset.theme = mode
  el.dataset.accent = accent
}
