<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { positionAbbrev } from '@/utils/positionAbbrev'

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

const positionCode = computed(() => positionAbbrev(props.player.position))
const status = computed(() => props.player.status || 'Active')
const componentTag = computed(() => (props.to ? RouterLink : 'article'))
</script>

<template>
  <component :is="componentTag" :to="to" :class="['player-card', { highlighted, clickable: !!to }]">
    <div class="header">
      <PlayerAvatar
        :name="player.name"
        :position="player.position"
        :photo-url="player.photoUrl"
        size="md"
      />
      <div class="identity">
        <h3>{{ player.name }}</h3>
        <span class="position-badge">{{ positionCode }}</span>
      </div>
    </div>

    <div class="meta">
      <p>Nationality: {{ player.nationality || 'Unknown' }}</p>
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
  gap: 0.85rem;
  align-items: center;
}

.identity {
  display: grid;
  gap: 0.35rem;
}

h3 {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.position-badge {
  display: inline-flex;
  width: fit-content;
  padding: 0.12rem 0.5rem;
  border-radius: 0.4rem;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.meta {
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
