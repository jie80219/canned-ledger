<script setup lang="ts">
import { computed } from 'vue'
import { db } from '../db/schema'
import type { Recurring } from '../db/types'
import { useBook } from '../composables/useBook'
import { useLive } from '../composables/useLive'
import { useUi } from '../stores/ui'
import { describeFreq, nextDate } from '../domain/recurrence'
import { formatMoney } from '../domain/money'
import TopBar from '../components/TopBar.vue'

const ui = useUi()
const { bookId, accountMap, categoryMap } = useBook()
const rules = useLive<Recurring[]>(() => db.recurring.where('bookId').equals(ui.bookId).toArray(), [], [bookId])

const rows = computed(() =>
  rules.value
    .map((r) => ({ r, next: r.active ? nextDate(r) : null }))
    .sort((a, b) => (a.next ?? '9999').localeCompare(b.next ?? '9999')),
)
function icon(r: Recurring) {
  if (r.template.kind === 'transfer') return '🔁'
  return categoryMap.value.get(r.template.categoryId ?? '')?.icon ?? '🥫'
}
</script>

<template>
  <main class="page no-nav">
    <TopBar title="週期記帳" back>
      <RouterLink to="/recurring/new" class="icon-btn" aria-label="新增">＋</RouterLink>
    </TopBar>
    <p class="help">到期時開 App 就會自動補記。外幣訂閱會用扣款當天的匯率換算，也可以設成先待確認、等帳單出來再填實際金額。</p>

    <div v-if="rows.length" class="list">
      <RouterLink v-for="{ r, next } in rows" :key="r.id" :to="`/recurring/${r.id}`" class="row" :class="{ muted: !next }">
        <span class="emoji">{{ icon(r) }}</span>
        <span class="grow">
          <div>{{ r.name }} <span v-if="r.currency !== accountMap.get(r.template.accountId)?.currency" class="badge">{{ r.currency }}</span></div>
          <div class="sub">
            {{ describeFreq(r) }} · {{ accountMap.get(r.template.accountId)?.name ?? '?' }}
            · {{ next ? `下次 ${next}` : r.active ? '已結束' : '已暫停' }}
            <template v-if="r.fxMode === 'confirm' && r.currency !== accountMap.get(r.template.accountId)?.currency"> · 待確認模式</template>
          </div>
        </span>
        <span class="num" :class="r.template.kind">{{ formatMoney(r.amount, r.currency) }}</span>
        <span class="chev">›</span>
      </RouterLink>
    </div>
    <div v-else class="empty">
      <div style="font-size: 40px">🗓️</div>
      還沒有週期記帳<br />房租、薪水、Netflix 都可以交給它
      <div style="margin-top: 14px"><RouterLink to="/recurring/new" class="btn">新增週期記帳</RouterLink></div>
    </div>
  </main>
</template>
