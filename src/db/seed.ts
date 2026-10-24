import { db, uid, type LedgerDB } from './schema'
import type { Account, Book, Category, CategoryKind } from './types'

export type CatSeed = [name: string, icon: string, children?: Array<[string, string]>]

export const EXPENSE: CatSeed[] = [
  ['餐飲', '🍜', [['早餐', '🥐'], ['午餐', '🍱'], ['晚餐', '🍲'], ['飲料', '🧋'], ['零食', '🍪']]],
  ['交通', '🚇', [['捷運', '🚇'], ['公車', '🚌'], ['計程車', '🚕'], ['加油', '⛽'], ['停車', '🅿️']]],
  ['購物', '🛍️', [['日用品', '🧻'], ['服飾', '👕'], ['3C', '📱']]],
  ['居家', '🏠', [['房租', '🔑'], ['水電瓦斯', '💡'], ['網路電話', '📶']]],
  ['娛樂', '🎮', [['電影', '🎬'], ['遊戲', '🕹️'], ['旅遊', '🏖️']]],
  ['訂閱', '📺', [['影音', '🎞️'], ['雲端', '☁️'], ['軟體', '💻']]],
  ['醫療', '💊'],
  ['教育', '📚'],
  ['社交', '🎁', [['聚餐', '🍻'], ['禮物', '🎁']]],
  ['寵物', '🐶'],
  ['保險', '🛡️'],
  ['其他', '📦'],
]
export const INCOME: CatSeed[] = [
  ['薪水', '💰'],
  ['獎金', '🧧'],
  ['投資', '📈'],
  ['兼職', '💼'],
  ['退款', '↩️'],
  ['其他', '📦'],
]

export const PALETTE = ['#e8a87c', '#85a8c9', '#c39bd3', '#7fb59a', '#e6b450', '#d98c9f', '#8fb4a8', '#b8a07e', '#9aa6d6', '#c9a27e']

export function buildCategories(bookId: string): Category[] {
  const out: Category[] = []
  const now = Date.now()
  const add = (kind: CategoryKind, seeds: CatSeed[]) =>
    seeds.forEach(([name, icon, children], i) => {
      const id = uid()
      const color = PALETTE[i % PALETTE.length]
      out.push({ id, bookId, kind, name, icon, color, sortOrder: i, updatedAt: now })
      children?.forEach(([cn, ci], j) =>
        out.push({ id: uid(), bookId, kind, parentId: id, name: cn, icon: ci, color, sortOrder: j, updatedAt: now }),
      )
    })
  add('expense', EXPENSE)
  add('income', INCOME)
  return out
}

export async function createBook(p: Pick<Book, 'name' | 'currency' | 'icon'>, d: LedgerDB = db): Promise<Book> {
  const now = Date.now()
  const book: Book = {
    id: uid(),
    color: '#7a9a6b',
    budgetStartDay: 1,
    sortOrder: await d.books.count(),
    updatedAt: now,
    ...p,
  }
  const cash: Account = {
    id: uid(),
    bookId: book.id,
    name: '現金',
    type: 'cash',
    currency: p.currency,
    initialBalance: 0,
    icon: '👛',
    color: '#e6b450',
    includeInNetWorth: true,
    sortOrder: 0,
    updatedAt: now,
  }
  await d.transaction('rw', d.books, d.accounts, d.categories, async () => {
    await d.books.add(book)
    await d.accounts.add(cash)
    await d.categories.bulkAdd(buildCategories(book.id))
  })
  return book
}

/** 第一次開啟時建立「日常」帳本與示範帳戶 */
export async function ensureSeed(d: LedgerDB = db): Promise<string> {
  const first = await d.books.orderBy('sortOrder').first()
  if (first) return first.id
  const book = await createBook({ name: '日常', currency: 'TWD', icon: '🐹' }, d)
  const now = Date.now()
  const bankId = uid()
  await d.accounts.bulkAdd([
    {
      id: bankId,
      bookId: book.id,
      name: '銀行帳戶',
      type: 'bank',
      currency: 'TWD',
      initialBalance: 0,
      icon: '🏦',
      color: '#85a8c9',
      includeInNetWorth: true,
      sortOrder: 1,
      updatedAt: now,
    },
    {
      id: uid(),
      bookId: book.id,
      name: '信用卡',
      type: 'credit',
      currency: 'TWD',
      initialBalance: 0,
      icon: '💳',
      color: '#d98c9f',
      includeInNetWorth: true,
      sortOrder: 2,
      updatedAt: now,
      credit: {
        statementDay: 5,
        dueDay: 20,
        dueMonthOffset: 0,
        creditLimit: 100000,
        payFromAccountId: bankId,
        autopay: 'off',
        minimumRate: 0.1,
        autopayConfirm: true,
        foreignFeeRate: 0.015,
      },
    },
  ])
  return book.id
}

export const ICONS = [
  '🍜', '🥐', '🍱', '🍲', '🧋', '🍪', '☕', '🍰', '🍣', '🍔', '🍕', '🥗', '🍎', '🍺', '🍻', '🍷',
  '🚇', '🚌', '🚕', '🚗', '⛽', '🅿️', '🚲', '🛵', '✈️', '🚄', '⛴️', '🚀',
  '🛍️', '🧻', '👕', '👗', '👟', '👜', '💄', '💍', '📱', '💻', '🎧', '📷', '⌚', '🖥️',
  '🏠', '🔑', '💡', '💧', '🔥', '📶', '🛋️', '🧹', '🧺', '🪴', '🛠️',
  '🎮', '🎬', '🕹️', '🎤', '🎨', '🎵', '🏖️', '⛺', '🎢', '🎳', '⚽', '🏀', '🏸', '🏋️', '🧘',
  '📺', '🎞️', '☁️', '📰', '🎟️',
  '💊', '🏥', '🦷', '👓', '🩺',
  '📚', '✏️', '🎓', '📝',
  '🎁', '💐', '🎂', '🧧', '💌', '👶', '🧸',
  '🐶', '🐱', '🐟', '🦜',
  '🛡️', '🧾', '🏛️', '💸', '🏧',
  '💰', '💼', '📈', '📉', '🪙', '💵', '💳', '🏦', '👛', '📲', '↩️', '🎯',
  '🐹', '⭐', '❤️', '🌱', '🌙', '☀️', '🍀', '🔖', '📦', '❓',
]
