<script setup lang="ts">
import { ACCOUNT_TYPE_LABEL, byType } from '../domain/accounts'
import { computed, onMounted, ref } from 'vue'
import type { Goal, GoalStyle } from '../db/types'
import { uid } from '../db/schema'
import { accountBalance, deleteGoal, saveGoal } from '../db/repo'
import { checkProgress, setPet } from '../db/progress'
import { usePet } from '../composables/usePet'
import { useBook } from '../composables/useBook'
import { useUi } from '../stores/ui'
import { ACHIEVEMENTS } from '../domain/achievements'
import { MOODS, SPECIES, STAGES, perDay, type Species } from '../domain/pet'
import { formatMoney, toMajor, toMinor } from '../domain/money'
import { petSvg } from '../icons/pets'
import TopBar from '../components/TopBar.vue'
import Sheet from '../components/Sheet.vue'
import GoalArt from '../components/GoalArt.vue'

const ui = useUi()
const { bookId, accounts } = useBook()
const { pet, progress, unlocked, mood, hungry, lines } = usePet()

// 領養
const pick = ref<Species>('hamster')
const petName = ref('囤囤')
async function adopt() {
  await setPet({ species: pick.value, name: petName.value.trim() || SPECIES[pick.value] })
}
const renaming = ref(false)
async function rename() {
  if (pet.value && petName.value.trim()) await setPet({ ...pet.value, name: petName.value.trim() })
  renaming.value = false
}

const svg = computed(() =>
  pet.value && progress.value ? petSvg(pet.value.species, progress.value.stage, mood.value, { hungry: hungry.value, crack: progress.value.level - 1 }) : '',
)
const said = ref('')
const bounce = ref(false)
function poke() {
  const l = lines.value.filter((x) => x !== said.value)
  said.value = l[Math.floor(Math.random() * l.length)] ?? lines.value[0] ?? ''
  bounce.value = false
  requestAnimationFrame(() => (bounce.value = true))
}
const showXp = ref(false)

// 存錢目標
const goals = computed(() => (progress.value?.goals ?? []).filter((g) => g.goal.bookId === bookId.value))
const savable = computed(() => accounts.value.filter((a) => !a.archived && a.type !== 'credit' && a.type !== 'liability'))
const editing = ref<Goal | null>(null)
const form = ref({ amount: '', includeExisting: false })
const confirmDelete = ref(false)
const STYLES: Array<[GoalStyle, string]> = [
  ['jar', '存錢罐'],
  ['plant', '植物'],
  ['house', '蓋房子'],
]
const isNew = computed(() => !!editing.value && !goals.value.some((g) => g.goal.id === editing.value!.id))
const editCur = computed(() => accounts.value.find((a) => a.id === editing.value?.accountId)?.currency ?? 'TWD')

function newGoal() {
  editing.value = { id: uid(), bookId: bookId.value, name: '', target: 0, accountId: savable.value[0]?.id ?? '', style: 'jar', baseline: 0, createdAt: Date.now(), updatedAt: 0 }
  form.value = { amount: '', includeExisting: false }
  confirmDelete.value = false
}
function editGoal(g: Goal) {
  editing.value = { ...g }
  form.value = { amount: String(toMajor(g.target, editCur.value)), includeExisting: false }
  confirmDelete.value = false
}
async function submitGoal() {
  const g = editing.value!
  const amount = Number(form.value.amount)
  if (!g.name.trim() || !g.accountId || !(amount > 0)) return ui.notify('請填名稱、帳戶與目標金額')
  g.target = toMinor(amount, editCur.value)
  if (isNew.value) g.baseline = form.value.includeExisting ? 0 : await accountBalance(g.accountId)
  if (!g.deadline) delete g.deadline
  await saveGoal({ ...g })
  editing.value = null
  celebrate(await checkProgress())
}
async function removeGoal() {
  if (!confirmDelete.value) return (confirmDelete.value = true)
  await deleteGoal(editing.value!.id)
  editing.value = null
}

// 徽章
const badges = computed(() => ACHIEVEMENTS.map((a) => ({ ...a, date: unlocked.value[a.id] })))
const badgeCount = computed(() => badges.value.filter((b) => b.date).length)
const showBadge = ref<(typeof badges.value)[number] | null>(null)

const confetti = ref(false)
function celebrate(r: Awaited<ReturnType<typeof checkProgress>>) {
  if (r.goals.length) {
    confetti.value = true
    setTimeout(() => (confetti.value = false), 2600)
    ui.notify(`達成存錢目標「${r.goals[0].name}」！`)
  } else if (r.achievements.length) ui.notify(`解鎖成就：${r.achievements.map((a) => a.name).join('、')}`)
}
onMounted(async () => celebrate(await checkProgress()))
</script>

<template>
  <main class="page no-nav">
    <TopBar title="養成" back />

    <template v-if="pet === null">
      <section class="card adopt">
        <p class="muted small">選一隻寵物，記帳就能把牠養大。經驗值全部從你的記帳紀錄算出來。</p>
        <div class="species">
          <button v-for="(label, s) in SPECIES" :key="s" :class="{ on: pick === s }" @click="pick = s">
            <span class="pet-sm" v-html="petSvg(s, 2, 'happy')" />{{ label }}
          </button>
        </div>
        <div class="field"><label>名字</label><input v-model="petName" maxlength="10" /></div>
        <button class="btn block" @click="adopt">領養</button>
      </section>
    </template>

    <template v-else-if="pet && progress">
      <section class="card hero">
        <div v-if="said" class="bubble">{{ said }}</div>
        <button class="pet-big" :class="{ bounce }" aria-label="摸摸寵物" @click="poke" v-html="svg" />
        <div class="name">
          <template v-if="renaming">
            <input v-model="petName" maxlength="10" class="rename" @keyup.enter="rename" />
            <button class="btn" @click="rename">好</button>
          </template>
          <button v-else class="link" @click="(petName = pet.name), (renaming = true)">{{ pet.name }} ✎</button>
        </div>
        <div class="muted small">{{ SPECIES[pet.species] }} · {{ STAGES[progress.stage] }} · {{ hungry ? '肚子餓了' : MOODS[mood] }}</div>
        <button class="lv" @click="showXp = !showXp">
          <b>Lv{{ progress.level }}</b>
          <span class="progress"><i :style="{ width: (progress.into / progress.need) * 100 + '%' }" /></span>
          <span class="muted small num">{{ progress.into }}/{{ progress.need }}</span>
        </button>
        <div v-if="showXp" class="xp">
          <div v-for="p in progress.xp.parts" :key="p.label" class="small"><span class="muted">{{ p.label }}</span><b class="num">+{{ p.xp }}</b></div>
          <div class="small"><span>總經驗值</span><b class="num">{{ progress.xp.total }}</b></div>
        </div>
        <div class="stats">
          <div><b class="num">{{ progress.streak }}</b><span class="muted small">連續天數</span></div>
          <div><b class="num">{{ progress.days.length }}</b><span class="muted small">記帳天數</span></div>
          <div><b class="num">{{ badgeCount }}/{{ badges.length }}</b><span class="muted small">成就</span></div>
        </div>
      </section>

      <div class="section-label">存錢目標</div>
      <div class="list">
        <button v-for="g in goals" :key="g.goal.id" class="row goal" @click="editGoal(g.goal)">
          <GoalArt :kind="g.goal.style" :frac="g.saved / g.goal.target" :size="52" />
          <span class="grow">
            <div>{{ g.goal.name }} <span v-if="g.goal.achievedAt" class="badge">已達成</span></div>
            <div class="progress" style="margin: 6px 0"><i :style="{ width: Math.min(100, (g.saved / g.goal.target) * 100) + '%' }" /></div>
            <div class="sub num">
              {{ formatMoney(g.saved, g.account?.currency ?? 'TWD') }} / {{ formatMoney(g.goal.target, g.account?.currency ?? 'TWD') }}
              <template v-if="perDay(g.goal, g.saved)"> · 每天還要存 {{ formatMoney(perDay(g.goal, g.saved)!, g.account?.currency ?? 'TWD') }}</template>
            </div>
          </span>
        </button>
        <button class="row add" :disabled="!savable.length" @click="newGoal">＋ 新增存錢目標</button>
      </div>
      <p class="help">進度是對應帳戶從建立目標後增加的金額，轉帳存進去就會往上長。</p>

      <div class="section-label">成就徽章</div>
      <div class="badges">
        <button v-for="b in badges" :key="b.id" :class="{ off: !b.date }" @click="showBadge = b">
          <span class="medal">{{ b.icon }}</span>
          <span class="small">{{ b.date ? b.name : '？？？' }}</span>
        </button>
      </div>
    </template>

    <Sheet v-if="editing" :title="isNew ? '新增存錢目標' : '編輯存錢目標'" @close="editing = null">
      <div class="list">
        <div class="field"><label>名稱</label><input v-model="editing.name" placeholder="例如：日本旅行" maxlength="20" /></div>
        <div class="field"><label>目標金額</label><input v-model="form.amount" inputmode="decimal" /><span class="hint">{{ editCur }}</span></div>
        <div class="field">
          <label>存到</label>
          <USelect v-model="editing.accountId" :disabled="!isNew">
            <option v-for="a in byType(savable)" :key="a.id" :value="a.id" :data-icon="a.icon" :data-color="a.color" :data-group="ACCOUNT_TYPE_LABEL[a.type]">{{ a.name }}</option>
          </USelect>
        </div>
        <div class="field"><label>截止日</label><input v-model="editing.deadline" type="date" /></div>
        <div class="field">
          <label>樣式</label>
          <div class="seg" style="flex: 1">
            <button v-for="[k, l] in STYLES" :key="k" :class="{ on: editing.style === k }" @click="editing.style = k">{{ l }}</button>
          </div>
        </div>
        <div v-if="isNew" class="field">
          <label class="grow">把帳戶目前餘額算進去</label>
          <input v-model="form.includeExisting" type="checkbox" class="switch" />
        </div>
      </div>
      <button class="btn block" @click="submitGoal">儲存</button>
      <button v-if="!isNew" class="btn ghost block danger" @click="removeGoal">{{ confirmDelete ? '再按一次刪除' : '刪除目標' }}</button>
    </Sheet>

    <Sheet v-if="showBadge" :title="showBadge.date ? showBadge.name : '尚未解鎖'" @close="showBadge = null">
      <div class="badge-detail">
        <span class="medal big" :class="{ off: !showBadge.date }">{{ showBadge.icon }}</span>
        <p>{{ showBadge.hint }}</p>
        <p v-if="showBadge.date" class="muted small">{{ showBadge.date }} 解鎖</p>
      </div>
    </Sheet>

    <div v-if="confetti" class="confetti" aria-hidden="true">
      <i v-for="n in 40" :key="n" :style="{ left: (n * 37) % 100 + '%', animationDelay: (n % 10) * 0.08 + 's', background: ['#e8b84a', '#c9705a', '#7a9a6b', '#8fc6e8', '#d98c9f'][n % 5] }" />
    </div>
  </main>
</template>

<style scoped>
.adopt { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.species { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.species button { border: 2px solid transparent; background: var(--surface-2); border-radius: 14px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; font: inherit; color: inherit; }
.species button.on { border-color: var(--accent); background: var(--accent-soft); }
.pet-sm { width: 72px; height: 72px; }
.pet-sm :deep(svg), .pet-big :deep(svg) { width: 100%; height: 100%; }
.hero { position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 18px 16px 14px; }
.pet-big { width: 160px; height: 160px; border: 0; background: transparent; padding: 0; }
.bounce { animation: bounce 0.5s ease; }
@keyframes bounce { 30% { transform: translateY(-10px) scale(1.04); } 60% { transform: translateY(0) scale(0.98); } }
.bubble { position: relative; background: var(--surface-2); border-radius: 14px; padding: 8px 12px; font-size: 0.875rem; max-width: 90%; text-align: center; }
.bubble::after { content: ''; position: absolute; left: 50%; bottom: -6px; margin-left: -6px; border: 6px solid transparent; border-bottom: 0; border-top-color: var(--surface-2); }
.name { display: flex; gap: 6px; align-items: center; font-size: 1.125rem; font-weight: 700; }
.link { border: 0; background: none; font: inherit; color: inherit; }
.rename { border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; font-size: 1rem; width: 9em; background: var(--surface); color: inherit; }
.lv { display: flex; align-items: center; gap: 8px; width: 100%; border: 0; background: none; font: inherit; color: inherit; margin-top: 8px; }
.lv .progress { flex: 1; }
.xp { width: 100%; display: flex; flex-direction: column; gap: 4px; padding: 8px 4px 0; }
.xp div { display: flex; justify-content: space-between; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); text-align: center; }
.stats div { display: flex; flex-direction: column; }
.goal { text-align: left; font: inherit; color: inherit; width: 100%; }
.add { justify-content: center; color: var(--accent); font-weight: 600; font: inherit; width: 100%; }
.badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.badges button { border: 0; background: var(--surface); border-radius: 14px; padding: 10px 2px; display: flex; flex-direction: column; align-items: center; gap: 4px; font: inherit; color: inherit; box-shadow: var(--shadow); }
.medal { font-size: 1.75rem; line-height: 1; }
.off .medal, .medal.off { filter: grayscale(1); opacity: 0.3; }
.off .small { color: var(--muted); }
.badge-detail { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; padding-bottom: 8px; }
.medal.big { font-size: 3.5rem; }
.danger { color: var(--expense); margin-top: 8px; }
.confetti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; }
.confetti i { position: absolute; top: -10px; width: 8px; height: 12px; border-radius: 2px; animation: fall 2.4s ease-in forwards; }
@keyframes fall { to { transform: translateY(105vh) rotate(540deg); } }
</style>
