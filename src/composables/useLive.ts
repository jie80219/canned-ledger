import { liveQuery } from 'dexie'
import { onUnmounted, shallowRef, watch, type Ref, type WatchSource } from 'vue'

/** Dexie liveQuery → Vue ref；deps 改變時重新訂閱 */
export function useLive<T>(querier: () => T | Promise<T>, initial: T, deps: WatchSource[] = []): Ref<T> {
  const value = shallowRef(initial) as Ref<T>
  let sub: { unsubscribe(): void } | undefined
  const start = () => {
    sub?.unsubscribe()
    sub = liveQuery(querier).subscribe({
      next: (v) => (value.value = v),
      error: (e) => console.error('[liveQuery]', e),
    })
  }
  watch(deps, start, { immediate: true })
  onUnmounted(() => sub?.unsubscribe())
  return value
}
