<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import {
  fetchTeam,
  SEASON_LABEL,
  type TeamCoach,
  type TeamPlayer,
} from '@/services/footballApi'
import { positionAbbrev } from '@/utils/positionAbbrev'

defineOptions({
  name: 'PlayersView',
})

const loading = ref(true)
const error = ref('')
const query = ref('')
const players = ref<TeamPlayer[]>([])
const coach = ref<TeamCoach | null>(null)

const keyPlayers = new Set([
  'Bruno Fernandes',
  'Casemiro',
  'Marcus Rashford',
  'Rasmus Højlund',
  'André Onana',
  'Lisandro Martínez',
  'Matheus Cunha',
  'Benjamin Sesko',
])

const loadPlayers = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchTeam()
    players.value = response.squad ?? []
    coach.value = response.coach ?? null
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Unable to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(loadPlayers)

const filteredPlayers = computed(() => {
  const term = query.value.trim().toLowerCase()
  const squad = players.value.filter((player) => (player.role ?? 'PLAYER') === 'PLAYER')
  if (!term) return squad
  return squad.filter((player) => player.name.toLowerCase().includes(term))
})

const playersByPosition = computed(() => {
  const groups = new Map<string, TeamPlayer[]>()
  for (const player of filteredPlayers.value) {
    const key = positionAbbrev(player.position)
    const list = groups.get(key) ?? []
    list.push(player)
    groups.set(key, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
})
</script>

<template>
  <section class="players-view">
    <div class="section-head">
      <h2>Squad</h2>
      <p>Search through Manchester United {{ SEASON_LABEL }} squad and staff roles.</p>
    </div>

    <article v-if="coach" class="coach-card">
      <PlayerAvatar :name="coach.name" label="HC" size="lg" />
      <div>
        <p class="coach-label">Head Coach</p>
        <h3>{{ coach.name }}</h3>
        <p class="coach-meta">{{ coach.nationality || '—' }}</p>
      </div>
    </article>

    <input v-model="query" type="search" placeholder="Search players by name..." />

    <p v-if="error" class="error">{{ error }}</p>

    <LoadingSkeleton v-else-if="loading" :cards="8" height="11rem" />

    <p v-else-if="!filteredPlayers.length" class="empty">No players found for this squad.</p>

    <template v-else>
      <section v-for="[position, group] in playersByPosition" :key="position" class="position-group">
        <h3 class="group-title">{{ position }}</h3>
        <TransitionGroup name="fade-slide" tag="div" class="players-grid">
          <PlayerCard
            v-for="player in group"
            :key="player.id"
            :player="player"
            :to="`/players/${player.id}`"
            :highlighted="keyPlayers.has(player.name)"
          />
        </TransitionGroup>
      </section>
    </template>
  </section>
</template>

<style scoped>
.players-view {
  display: grid;
  gap: 1rem;
}

.section-head h2 {
  font-size: 1.4rem;
  font-weight: 700;
}

.section-head p {
  color: var(--color-text-muted);
}

.coach-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.coach-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.coach-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

.coach-meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

input {
  width: 100%;
  max-width: 24rem;
  border: 1px solid var(--color-border);
  border-radius: 0.7rem;
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.65rem 0.8rem;
}

.position-group {
  display: grid;
  gap: 0.75rem;
}

.group-title {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.players-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.empty {
  color: var(--color-text-muted);
}

.error {
  color: #ffffff;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 0.7rem;
  padding: 0.75rem;
}
</style>
