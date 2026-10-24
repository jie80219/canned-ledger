import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'

// Node 18 沒有全域 crypto
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })

// Node 18 沒有全域 CustomEvent，Dexie 關閉資料庫時會用到
if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class<T> extends Event {
    detail: T
    constructor(type: string, init?: CustomEventInit<T>) {
      super(type, init)
      this.detail = init?.detail as T
    }
  } as unknown as typeof CustomEvent
}
