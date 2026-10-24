import { computed } from 'vue'
import { db } from '../db/schema'
import { useUi } from '../stores/ui'
import { useLive } from './useLive'
import type { Account, Book, Category } from '../db/types'

/** 目前帳本與其帳戶、分類（皆為即時資料） */
export function useBook() {
  const ui = useUi()
  const bookId = computed(() => ui.bookId)
  const book = useLive<Book | undefined>(() => db.books.get(ui.bookId), undefined, [bookId])
  const accounts = useLive<Account[]>(
    async () => (await db.accounts.where('bookId').equals(ui.bookId).toArray()).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
    [bookId],
  )
  const categories = useLive<Category[]>(
    async () => (await db.categories.where('bookId').equals(ui.bookId).toArray()).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
    [bookId],
  )
  const currency = computed(() => book.value?.currency ?? 'TWD')
  const accountMap = computed(() => new Map(accounts.value.map((a) => [a.id, a])))
  const categoryMap = computed(() => new Map(categories.value.map((c) => [c.id, c])))
  return { bookId, book, accounts, categories, currency, accountMap, categoryMap }
}
