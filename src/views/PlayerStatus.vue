<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { fetchPlayerById, fetchTeamScorers, type TeamPlayer } from '@/services/footballApi'

defineOptions({
  name: 'PlayerStatusView',
})

const route = useRoute()
const loading = ref(true)
const error = ref('')
const player = ref<TeamPlayer | null>(null)
const playerGoals = ref<number | null>(null)
const playerAssists = ref<number | null>(null)
const playerAppearances = ref<number | null>(null)

const keyPlayers = new Set([
  'Bruno Fernandes',
  'Casemiro',
  'Marcus Rashford',
  'Rasmus Højlund',
  'André Onana',
  'Lisandro Martínez',
])

const playerId = computed(() => Number(route.params.id))

const initials = computed(() => {
  if (!player.value) return 'MU'
  return player.value.name
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const avatar = computed(() => {
  if (!player.value) return ''
  if (player.value.photoUrl) return player.value.photoUrl
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' text-anchor='middle' fill='white' font-size='56' font-family='Arial'>${initials.value}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

const statusLabel = computed(() => player.value?.status || 'Active')
const isKeyPlayer = computed(() => (player.value ? keyPlayers.has(player.value.name) : false))
const statValue = (value: number | null) => (value == null ? 'N/A' : value)

const loadPlayer = async () => {
  loading.value = true
  error.value = ''
  player.value = null
  playerGoals.value = null
  playerAssists.value = null
  playerAppearances.value = null

  try {
    if (Number.isNaN(playerId.value)) {
      throw new Error('Invalid player identifier.')
    }
    const data = await fetchPlayerById(playerId.value)
    if (!data) {
      throw new Error('Player not found.')
    }
    player.value = data

    const scorers = await fetchTeamScorers('PL')
    const scorerData =
      scorers.find((item) => item.player.id === data.id) ??
      scorers.find((item) => item.player.name.toLowerCase() === data.name.toLowerCase())

    if (scorerData) {
      playerGoals.value = scorerData.goals ?? null
      playerAssists.value = scorerData.assists ?? null
      playerAppearances.value = scorerData.playedMatches ?? null
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Unable to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(loadPlayer)
</script>

<template>
  <section class="player-status">
    <p v-if="error" class="error">{{ error }}</p>

    <LoadingSkeleton v-else-if="loading" :cards="1" height="18rem" />

    <article v-else-if="player" :class="['profile-card', { key: isKeyPlayer }]">
      <div class="profile-top">
        <img :src="avatar" :alt="player.name" />
        <div>
          <h2>{{ player.name }}</h2>
          <p>{{ player.position || 'Unknown Position' }}</p>
          <span v-if="isKeyPlayer" class="key-badge">Key Player</span>
        </div>
      </div>

      <div class="details-grid">
        <p><strong>National Team:</strong> {{ player.nationality || 'Unknown' }}</p>
        <p><strong>Jersey Number:</strong> {{ player.shirtNumber ?? 'N/A' }}</p>
        <p><strong>Status:</strong> {{ statusLabel }}</p>
        <p><strong>Date of Birth:</strong> {{ player.dateOfBirth || 'Unknown' }}</p>
      </div>

      <div class="stats-box">
        <h3>Basic Stats</h3>
        <p>Goals: {{ statValue(playerGoals) }}</p>
        <p>Assists: {{ statValue(playerAssists) }}</p>
        <p>Appearances: {{ statValue(playerAppearances) }}</p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.player-status {
  display: grid;
  gap: 1rem;
}

.profile-card {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-background-soft);
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.profile-card.key {
  border-color: var(--color-accent);
  box-shadow: 0 14px 24px rgba(199, 1, 1, 0.25);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

img {
  width: 6rem;
  height: 6rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  object-fit: cover;
}

h2 {
  font-size: 1.35rem;
  font-weight: 700;
}

.profile-top p {
  color: var(--color-text-muted);
}

.key-badge {
  display: inline-block;
  margin-top: 0.4rem;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.details-grid {
  display: grid;
  gap: 0.55rem;
}

.details-grid strong {
  font-weight: 700;
}

.stats-box {
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  border-radius: 0.85rem;
  padding: 0.8rem;
  display: grid;
  gap: 0.35rem;
}

.stats-box h3 {
  font-size: 1rem;
  font-weight: 700;
}

.error {
  color: #ffffff;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 0.7rem;
  padding: 0.75rem;
}
</style>
