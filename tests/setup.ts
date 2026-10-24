import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'

// Node 18 沒有全域 crypto
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
