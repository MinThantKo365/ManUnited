<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import PlayerCard from '@/components/PlayerCard.vue'
import { fetchTeam, type TeamPlayer } from '@/services/footballApi'

defineOptions({
  name: 'PlayersView',
})

const loading = ref(true)
const error = ref('')
const query = ref('')
const players = ref<TeamPlayer[]>([])

const keyPlayers = new Set([
  'Bruno Fernandes',
  'Casemiro',
  'Marcus Rashford',
  'Rasmus Højlund',
  'André Onana',
  'Lisandro Martínez',
])

const loadPlayers = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchTeam()
    players.value = response.squad ?? []
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
  if (!term) return players.value
  return players.value.filter((player) => player.name.toLowerCase().includes(term))
})
</script>

<template>
  <section class="players-view">
    <div class="section-head">
      <h2>Squad</h2>
      <p>Search through Manchester United first-team players and staff roles.</p>
    </div>

    <input v-model="query" type="search" placeholder="Search players by name..." />

    <p v-if="error" class="error">{{ error }}</p>

    <LoadingSkeleton v-else-if="loading" :cards="8" height="11rem" />

    <TransitionGroup v-else name="fade-slide" tag="div" class="players-grid">
      <PlayerCard
        v-for="player in filteredPlayers"
        :key="player.id"
        :player="player"
        :to="`/players/${player.id}`"
        :highlighted="keyPlayers.has(player.name)"
      />
    </TransitionGroup>
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

input {
  width: 100%;
  max-width: 24rem;
  border: 1px solid var(--color-border);
  border-radius: 0.7rem;
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.65rem 0.8rem;
}

.players-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.error {
  color: #ffffff;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 0.7rem;
  padding: 0.75rem;
}
</style>
