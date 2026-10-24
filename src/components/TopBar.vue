<script setup lang="ts">
import { useRouter } from 'vue-router'
defineProps<{ title: string; back?: boolean }>()
const router = useRouter()
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="topbar">
    <button v-if="back" class="icon-btn" aria-label="返回" @click="goBack">‹</button>
    <h1>{{ title }}</h1>
    <slot />
  </header>
</template>
