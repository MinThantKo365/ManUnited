<script setup lang="ts">
withDefaults(
  defineProps<{
    cards?: number
    height?: string
  }>(),
  {
    cards: 3,
    height: '7rem',
  },
)
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="index in cards" :key="index" class="skeleton-card" :style="{ height }" />
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  gap: 0.75rem;
}

.skeleton-card {
  border-radius: 0.9rem;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-background-soft) 85%, #000000) 25%,
    color-mix(in srgb, var(--color-background-soft) 65%, #ffffff) 50%,
    color-mix(in srgb, var(--color-background-soft) 85%, #000000) 75%
  );
  background-size: 200% 100%;
  animation: shine 1.2s infinite;
}

@keyframes shine {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
