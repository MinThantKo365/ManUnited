<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FixtureCard from '@/components/FixtureCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { fetchMatches, type MatchItem } from '@/services/footballApi'

defineOptions({
  name: 'FixturesView',
})

type FilterState = 'all' | 'upcoming' | 'finished'

const loading = ref(true)
const error = ref('')
const matches = ref<MatchItem[]>([])
const filter = ref<FilterState>('all')

const loadMatches = async () => {
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

onMounted(loadMatches)

const sortedMatches = computed(() =>
  [...matches.value].sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime()),
)

const filteredMatches = computed(() => {
  if (filter.value === 'all') return sortedMatches.value
  if (filter.value === 'upcoming') {
    return sortedMatches.value.filter((match) =>
      [
        'TIMED',
        'SCHEDULED',
        'POSTPONED',
        'IN PLAY',
        'PAUSED',
        'EXTRA_TIME',
        'PENALTY_SHOOTOUT',
      ].includes(match.status),
    )
  }
  return sortedMatches.value.filter((match) => match.status === 'FINISHED')
})
</script>

<template>
  <section class="fixtures-page">
    <div class="section-head">
      <h2>Fixtures</h2>
      <p>Full Manchester United fixture list with scores, status, and kickoff dates.</p>
    </div>

    <div class="filters">
      <button :class="{ active: filter === 'all' }" type="button" @click="filter = 'all'">
        All
      </button>
      <button :class="{ active: filter === 'upcoming' }" type="button" @click="filter = 'upcoming'">
        Upcoming
      </button>
      <button :class="{ active: filter === 'finished' }" type="button" @click="filter = 'finished'">
        Finished
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <LoadingSkeleton v-else-if="loading" :cards="6" height="8rem" />

    <TransitionGroup v-else name="fade-slide" tag="div" class="fixtures-grid">
      <FixtureCard v-for="fixture in filteredMatches" :key="fixture.id" :fixture="fixture"
        :to="`/fixtures/${fixture.id}`" />
    </TransitionGroup>
  </section>
</template>

<style scoped>
.fixtures-page {
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

.filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button {
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
  border-radius: 0.6rem;
  padding: 0.42rem 0.72rem;
  font-weight: 600;
}

button.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-contrast);
}

.fixtures-grid {
  display: grid;
  gap: 0.8rem;
}

.error {
  color: #ffffff;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 0.7rem;
  padding: 0.75rem;
}
</style>
