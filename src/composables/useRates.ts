import { computed, ref, watch, type Ref } from 'vue'
import type { Account } from '../db/types'
import { rateTable } from '../domain/fx'
import { currency as currencyInfo } from '../domain/money'
import { makeConverter } from '../domain/stats'

/** 把帳本內各幣別帳戶換算為帳本幣別 */
export function useConverter(accounts: Ref<Account[]>, bookCurrency: Ref<string>) {
  const rates = ref(new Map<string, number>())
  const missing = ref<string[]>([])
  watch(
    [() => accounts.value.map((a) => a.currency).join(), bookCurrency],
    async () => {
      const codes = accounts.value.map((a) => a.currency)
      if (codes.every((c) => c === bookCurrency.value)) {
        rates.value = new Map()
        missing.value = []
        return
      }
      const r = await rateTable(codes, bookCurrency.value)
      rates.value = r.rates
      missing.value = r.missing
    },
    { immediate: true },
  )
  const conv = computed(() =>
    makeConverter(accounts.value, bookCurrency.value, rates.value, (c) => currencyInfo(c).decimals),
  )
  return { conv, rates, missing }
}
