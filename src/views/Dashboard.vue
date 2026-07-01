<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FixtureCard from '@/components/FixtureCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { fetchMatches, SEASON_LABEL, type MatchItem } from '@/services/footballApi'

defineOptions({
  name: 'DashboardView',
})

type FixtureFilter = 'upcoming' | 'finished'

const loading = ref(true)
const error = ref('')
const matches = ref<MatchItem[]>([])
const filter = ref<FixtureFilter>('upcoming')

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetchMatches()
    matches.value = response.matches ?? []
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Unable to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const upcomingFixtures = computed(() =>
  [...matches.value]
    .filter((match) =>
      ['SCHEDULED', 'TIMED', 'POSTPONED', 'IN PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'].includes(
        match.status,
      ),
    )
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()),
)

const finishedFixtures = computed(() =>
  [...matches.value]
    .filter((match) => match.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()),
)

const nextFixture = computed(() => upcomingFixtures.value[0] ?? null)
const lastFiveResults = computed(() => finishedFixtures.value.slice(0, 5))
const filteredFixtures = computed(() =>
  (filter.value === 'upcoming' ? upcomingFixtures.value : finishedFixtures.value).slice(0, 6),
)

const quickStats = computed(() => {
  const results = finishedFixtures.value
  const total = results.length
  let wins = 0
  let draws = 0
  let losses = 0

  for (const match of results) {
    const home = match.score?.fullTime?.home
    const away = match.score?.fullTime?.away
    if (home == null || away == null) continue
    const isUnitedHome = match.homeTeam.name.toLowerCase().includes('manchester united')
    const unitedGoals = isUnitedHome ? home : away
    const opponentGoals = isUnitedHome ? away : home
    if (unitedGoals > opponentGoals) wins += 1
    if (unitedGoals === opponentGoals) draws += 1
    if (unitedGoals < opponentGoals) losses += 1
  }

  return { total, wins, draws, losses }
})
</script>

<template>
  <section class="dashboard">
    <div class="section-head">
      <h2>Home Dashboard</h2>
      <p>{{ SEASON_LABEL }} season — track upcoming fixtures, form, and quick performance insights.</p>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-else>
      <article class="panel">
        <h3>Next Match</h3>
        <LoadingSkeleton v-if="loading" :cards="1" height="8rem" />
        <FixtureCard v-else-if="nextFixture" :fixture="nextFixture" :highlight="true"
          :to="`/fixtures/${nextFixture.id}`" />
        <p v-else class="empty">No upcoming fixture available for team 66.</p>
      </article>
      <div class="grid">


        <article class="panel">
          <h3>Last 5 Results</h3>
          <LoadingSkeleton v-if="loading" :cards="3" />
          <TransitionGroup v-else name="fade-slide" tag="div" class="fixture-list">
            <FixtureCard v-for="fixture in lastFiveResults" :key="fixture.id" :fixture="fixture"
              :to="`/fixtures/${fixture.id}`" />
          </TransitionGroup>
        </article>
      </div>

      <article class="panel">
        <h3>Quick Stats</h3>
        <LoadingSkeleton v-if="loading" :cards="1" height="6.2rem" />
        <div v-else class="stats-grid">
          <div class="stat-card">
            <span>Played</span>
            <strong>{{ quickStats.total }}</strong>
          </div>
          <div class="stat-card">
            <span>Wins</span>
            <strong>{{ quickStats.wins }}</strong>
          </div>
          <div class="stat-card">
            <span>Draws</span>
            <strong>{{ quickStats.draws }}</strong>
          </div>
          <div class="stat-card">
            <span>Losses</span>
            <strong>{{ quickStats.losses }}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="fixtures-head">
          <h3>Fixtures</h3>
          <div class="filters">
            <button :class="{ active: filter === 'upcoming' }" type="button" @click="filter = 'upcoming'">
              Upcoming
            </button>
            <button :class="{ active: filter === 'finished' }" type="button" @click="filter = 'finished'">
              Finished
            </button>
          </div>
        </div>
        <LoadingSkeleton v-if="loading" :cards="4" />
        <TransitionGroup v-else name="fade-slide" tag="div" class="fixture-list">
          <FixtureCard v-for="fixture in filteredFixtures" :key="fixture.id" :fixture="fixture"
            :to="`/fixtures/${fixture.id}`" />
        </TransitionGroup>
      </article>
    </template>
  </section>
</template>

<style scoped>
.dashboard {
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

.grid.two-col {
  display: grid;
  gap: 1rem;
}

@media (min-width: 980px) {
  .grid.two-col {
    grid-template-columns: 1fr 1fr;
  }
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-background-soft);
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  box-shadow: 0 12px 28px var(--shadow-color);
}

h3 {
  font-size: 1.05rem;
  font-weight: 700;
}

.fixture-list {
  display: grid;
  gap: 0.7rem;
}

.fixtures-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

button {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text);
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  font-weight: 600;
}

button.active {
  border-color: #c70101;
  background: #c70101;
  color: #ffffff;
}

.stats-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.stat-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 0.7rem;
  display: grid;
  gap: 0.2rem;
}

.stat-card span {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.stat-card strong {
  color: var(--color-accent);
  font-size: 1.35rem;
  font-weight: 700;
}

.error {
  color: #ffffff;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 0.7rem;
  padding: 0.75rem;
}

.empty {
  color: var(--color-text-muted);
}
</style>
