import { reactive } from 'vue'
import { db, uid } from '../db/schema'

// 上傳的圖示存在 assets 資料表，讀過一次就留在記憶體
const cache = reactive(new Map<string, string>())
const loading = new Set<string>()

export function assetUrl(id: string): string | undefined {
  if (!cache.has(id) && !loading.has(id)) {
    loading.add(id)
    db.assets
      .get(id)
      .then((a) => a && cache.set(id, a.data))
      .finally(() => loading.delete(id))
  }
  return cache.get(id)
}

/** 存一張圖，回傳可以直接當 icon 用的 `img:<id>` */
export async function saveAsset(data: string): Promise<string> {
  const id = uid()
  await db.assets.put({ id, data, updatedAt: Date.now() })
  cache.set(id, data)
  return `img:${id}`
}
