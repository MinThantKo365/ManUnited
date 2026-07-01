<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    position?: string | null
    photoUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    /** Overrides initials on the avatar (e.g. coach) */
    label?: string | null
  }>(),
  { size: 'md' },
)

const initials = computed(() =>
  props.name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const label = computed(() => props.label || initials.value)

const fallbackAvatar = computed(() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#b91c1c'/><stop offset='100%' stop-color='#7f1d1d'/></linearGradient></defs><circle cx='80' cy='80' r='78' fill='url(#g)'/><text x='80' y='92' text-anchor='middle' fill='white' font-size='48' font-weight='700' font-family='Arial,sans-serif'>${label.value}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

const avatarSrc = computed(() => props.photoUrl || fallbackAvatar.value)
</script>

<template>
  <div :class="['player-avatar', size]">
    <img :src="avatarSrc" :alt="name" />
  </div>
</template>

<style scoped>
.player-avatar {
  position: relative;
  flex-shrink: 0;
}

.player-avatar.sm {
  width: 3.25rem;
  height: 3.25rem;
}

.player-avatar.md {
  width: 4.5rem;
  height: 4.5rem;
}

.player-avatar.lg {
  width: 6rem;
  height: 6rem;
}

img {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid var(--color-border);
  background: #111;
}
</style>
