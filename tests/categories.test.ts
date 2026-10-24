import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/db/schema'
import type { Category } from '../src/db/types'
import { moveCategory } from '../src/db/repo'
import { exportBackup, importBackup } from '../src/io/backup'
import { freshDb } from './helpers'

const cat = (p: Partial<Category> & { id: string }): Category => ({
  bookId: 'b',
  kind: 'expense',
  name: p.id,
  icon: '📦',
  color: '#888',
  sortOrder: 0,
  updatedAt: 0,
  ...p,
})

describe('分類換大類', () => {
  beforeEach(async () => {
    await db.categories.clear()
    await db.categories.bulkPut([
      cat({ id: 'food', color: '#e8a87c' }),
      cat({ id: 'fun', color: '#9aa6d6', sortOrder: 1 }),
      cat({ id: 'lunch', parentId: 'food' }),
      cat({ id: 'game', parentId: 'fun' }),
      cat({ id: 'salary', kind: 'income' }),
    ])
  })

  it('子分類換到另一個大類，顏色跟著新大類，排在最後', async () => {
    expect(await moveCategory('lunch', 'fun')).toBe('ok')
    const c = await db.categories.get('lunch')
    expect(c).toMatchObject({ parentId: 'fun', color: '#9aa6d6', sortOrder: 1 })
  })

  it('子分類拉出來變大類', async () => {
    expect(await moveCategory('lunch')).toBe('ok')
    const c = await db.categories.get('lunch')
    expect(c?.parentId).toBeUndefined()
    expect(c?.sortOrder).toBe(2)
  })

  it('還有子分類的大類不能變成子分類', async () => {
    expect(await moveCategory('food', 'fun')).toBe('has-children')
    expect((await db.categories.get('food'))?.parentId).toBeUndefined()
  })

  it('不能放進別的種類或子分類底下', async () => {
    expect(await moveCategory('lunch', 'salary')).toBe('invalid')
    expect(await moveCategory('lunch', 'game')).toBe('invalid')
  })
})

describe('上傳圖示', () => {
  it('備份會帶著圖片，還原後一樣', async () => {
    const a = freshDb()
    await a.assets.put({ id: 'x', data: 'data:image/png;base64,AAA', updatedAt: 1 })
    const snap = await exportBackup(a)
    const b = freshDb()
    await importBackup(snap, 'overwrite', b)
    expect((await b.assets.get('x'))?.data).toBe('data:image/png;base64,AAA')
  })
})
