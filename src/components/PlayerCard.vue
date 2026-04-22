<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type Player = {
  id: number
  name: string
  position?: string | null
  nationality?: string | null
  shirtNumber?: number | null
  role?: string | null
  status?: string | null
  photoUrl?: string | null
}

const props = defineProps<{
  player: Player
  highlighted?: boolean
  to?: string
}>()

const initials = computed(() => {
  return props.player.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const fallbackAvatar = computed(() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='#1f2937'/><text x='50%' y='55%' font-size='42' fill='white' text-anchor='middle' font-family='Arial'>${initials.value}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

const avatarSrc = computed(() => props.player.photoUrl || fallbackAvatar.value)

const status = computed(() => props.player.status || 'Active')

const iconForPosition = computed(() => {
  const position = (props.player.position || '').toLowerCase()
  if (position.includes('goalkeeper')) return '🧤'
  if (position.includes('defence') || position.includes('defender')) return '🛡️'
  if (position.includes('midfield')) return '⚙️'
  if (position.includes('forward') || position.includes('attacker') || position.includes('winger'))
    return '🎯'
  return '🏟️'
})

const componentTag = computed(() => (props.to ? RouterLink : 'article'))
</script>

<template>
  <component :is="componentTag" :to="to" :class="['player-card', { highlighted, clickable: !!to }]">
    <div class="header">
      <img :src="avatarSrc" :alt="player.name" />
      <div>
        <h3>{{ player.name }}</h3>
        <p class="role">{{ player.role || 'Player' }}</p>
      </div>
    </div>

    <div class="meta">
      <p>
        <span>{{ iconForPosition }}</span> Position: {{ player.position || 'Unknown' }}
      </p>
      <p>Nationality: {{ player.nationality || 'Unknown' }}</p>
      <p>Jersey: {{ player.shirtNumber ?? 'N/A' }}</p>
      <p>Status: {{ status }}</p>
    </div>
  </component>
</template>

<style scoped>
.player-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 0.95rem;
  display: grid;
  gap: 0.85rem;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  text-decoration: none;
  color: inherit;
}

.player-card:hover {
  transform: translateY(-4px);
  border-color: #da020e;
  box-shadow: 0 10px 22px rgba(218, 2, 14, 0.24);
}

.player-card.highlighted {
  border-color: #c70101;
  box-shadow: 0 0 0 1px rgba(199, 1, 1, 0.45) inset;
}

.player-card.clickable {
  cursor: pointer;
}

.header {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

img {
  width: 3.1rem;
  height: 3.1rem;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

h3 {
  font-size: 1rem;
  font-weight: 700;
}

.role {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.meta {
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.meta span {
  margin-right: 0.3rem;
}
</style>
