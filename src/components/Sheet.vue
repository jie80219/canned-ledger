<script setup lang="ts">
defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="sheet" role="dialog">
        <h3 v-if="title">{{ title }}</h3>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
