import { describe, expect, it } from 'vitest'
import { buildCategories, upgradeCategoryIcons } from '../src/db/seed'
import { CATEGORY_GLYPHS, GLYPHS, iconText } from '../src/icons'
import { freshDb } from './helpers'

describe('分類圖示', () => {
  it('每個預設分類都有 5 款存在的自繪圖示', () => {
    for (const ids of Object.values(CATEGORY_GLYPHS)) {
      expect(ids).toHaveLength(5)
      ids.forEach((id) => expect(GLYPHS[id], id).toBeDefined())
    }
  })

  it('新帳本的預設分類直接用自繪圖示', () => {
    const cats = buildCategories('b')
    expect(cats.find((c) => c.name === '午餐')?.icon).toBe(`svg:${CATEGORY_GLYPHS['午餐'][0]}`)
  })

  it('舊資料只換還是預設 emoji 的分類，改過的保留，只跑一次', async () => {
    const d = freshDb()
    await d.categories.bulkPut([
      { id: '1', bookId: 'b', kind: 'expense', name: '午餐', icon: '🍱', color: '#888', sortOrder: 0, updatedAt: 0 },
      { id: '2', bookId: 'b', kind: 'expense', name: '晚餐', icon: '🍣', color: '#888', sortOrder: 1, updatedAt: 0 },
      { id: '3', bookId: 'b', kind: 'expense', name: '貓砂', icon: '🐱', color: '#888', sortOrder: 2, updatedAt: 0 },
    ])
    expect(await upgradeCategoryIcons(d)).toBe(1)
    expect((await d.categories.get('1'))?.icon).toBe(`svg:${CATEGORY_GLYPHS['午餐'][0]}`)
    expect((await d.categories.get('2'))?.icon).toBe('🍣')
    expect((await d.categories.get('3'))?.icon).toBe('🐱')
    await d.categories.update('1', { icon: '🍱' })
    expect(await upgradeCategoryIcons(d)).toBe(0)
  })

  it('純文字場合只保留 emoji', () => {
    expect(iconText('🍜')).toBe('🍜')
    expect(iconText('svg:meal-bowl')).toBe('')
  })
})
