<script setup lang="ts">
import { computed } from 'vue'
import { usePet } from '../composables/usePet'
import { petSvg } from '../icons/pets'
import { MOODS, STAGES } from '../domain/pet'

const { pet, progress, mood, hungry } = usePet()
const svg = computed(() => (pet.value && progress.value ? petSvg(pet.value.species, progress.value.stage, mood.value, { hungry: hungry.value, crack: progress.value.level - 1 }) : ''))
</script>

<template>
  <RouterLink v-if="pet === null" to="/pet" class="card pet-card">
    <span class="pet" v-html="petSvg('hamster', 0, 'happy')" />
    <span class="grow"><b>領養一隻寵物</b><span class="muted small">記帳就能養大牠，還有成就可以收集</span></span>
    <span class="chev">›</span>
  </RouterLink>
  <RouterLink v-else-if="pet && progress" to="/pet" class="card pet-card">
    <span class="pet" v-html="svg" />
    <span class="grow">
      <b>{{ pet.name }} <span class="muted small">Lv{{ progress.level }} {{ STAGES[progress.stage] }}</span></b>
      <span class="progress"><i :style="{ width: (progress.into / progress.need) * 100 + '%' }" /></span>
      <span class="muted small">{{ hungry ? '肚子餓了' : MOODS[mood] }}<template v-if="progress.streak > 1"> · 連續 {{ progress.streak }} 天</template></span>
    </span>
    <span class="chev">›</span>
  </RouterLink>
</template>

<style scoped>
.pet-card { display: flex; align-items: center; gap: 12px; padding: 10px 14px; color: inherit; margin-bottom: 10px; }
.pet { width: 56px; height: 56px; flex: none; }
.pet :deep(svg) { width: 100%; height: 100%; }
.grow { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.chev { color: var(--muted); }
</style>
