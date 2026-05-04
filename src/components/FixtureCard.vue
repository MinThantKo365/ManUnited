<script setup lang="ts">
import { RouterLink } from 'vue-router'

type Team = {
  name: string
  shortName?: string
}

type FixtureScore = {
  fullTime?: {
    home?: number | null
    away?: number | null
  }
  halfTime?: {
    home?: number | null
    away?: number | null
  }
}

type Fixture = {
  id: number
  utcDate: string
  status: string
  homeTeam: Team
  awayTeam: Team
  score?: FixtureScore
}

const props = defineProps<{
  fixture: Fixture
  highlight?: boolean
  /** When set, entire card links to match detail. */
  to?: string
  /** PL / neutral lists: hide “Opponent” line built for club view. */
  neutral?: boolean
}>()

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'LIVE'])

const isFinished = () => props.fixture.status === 'FINISHED'

const scoreText = () => {
  const home = props.fixture.score?.fullTime?.home
  const away = props.fixture.score?.fullTime?.away
  if (home != null && away != null) return `${home} - ${away}`
  if (LIVE_STATUSES.has(props.fixture.status)) return 'LIVE'
  if (isFinished()) {
    const fh = props.fixture.score?.fullTime?.home ?? '-'
    const fa = props.fixture.score?.fullTime?.away ?? '-'
    return `${fh} - ${fa}`
  }
  return 'vs'
}

const opponent = () => {
  const isUnitedHome = props.fixture.homeTeam.name.toLowerCase().includes('manchester united')
  return isUnitedHome ? props.fixture.awayTeam.name : props.fixture.homeTeam.name
}
</script>

<template>
  <RouterLink v-if="to" :to="to" class="fixture-card-link">
    <article :class="['fixture-card', { highlight, live: LIVE_STATUSES.has(fixture.status) }]">
      <div class="fixture-top">
        <p class="status">{{ fixture.status }}</p>
        <p class="date">{{ formatDate(fixture.utcDate) }}</p>
      </div>
      <p v-if="!neutral" class="opponent">Opponent: {{ opponent() }}</p>

      <div class="teams">
        <p>{{ fixture.homeTeam.shortName || fixture.homeTeam.name }}</p>
        <strong>{{ scoreText() }}</strong>
        <p>{{ fixture.awayTeam.shortName || fixture.awayTeam.name }}</p>
      </div>
      <p v-if="to" class="hint">Tap for match details</p>
    </article>
  </RouterLink>

  <article
    v-else
    :class="['fixture-card', { highlight, live: LIVE_STATUSES.has(fixture.status) }]"
  >
    <div class="fixture-top">
      <p class="status">{{ fixture.status }}</p>
      <p class="date">{{ formatDate(fixture.utcDate) }}</p>
    </div>
    <p v-if="!neutral" class="opponent">Opponent: {{ opponent() }}</p>

    <div class="teams">
      <p>{{ fixture.homeTeam.shortName || fixture.homeTeam.name }}</p>
      <strong>{{ scoreText() }}</strong>
      <p>{{ fixture.awayTeam.shortName || fixture.awayTeam.name }}</p>
    </div>
  </article>
</template>

<style scoped>
.fixture-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.fixture-card {
  border: 1px solid var(--color-border);
  border-radius: 0.9rem;
  background: var(--color-background-soft);
  padding: 1rem;
  display: grid;
  gap: 0.7rem;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
}

.fixture-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-hover);
  box-shadow: 0 10px 25px var(--shadow-color);
}

.fixture-card.highlight {
  border-color: #c70101;
  box-shadow:
    0 0 0 1px #c70101 inset,
    0 12px 24px rgba(199, 1, 1, 0.28);
}

.fixture-card.live {
  border-color: rgba(34, 197, 94, 0.55);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25);
}

.fixture-top {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
}

.status {
  font-size: 0.8rem;
  color: #ffffff;
  background: #c70101;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
}

.live .status {
  background: #15803d;
}

.date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.opponent {
  color: var(--color-text);
  font-weight: 600;
}

.hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin: 0;
}

.teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.4rem;
}

.teams p {
  font-weight: 600;
}

.teams p:last-child {
  text-align: right;
}

strong {
  color: #ffffff;
  background: #000000;
  border-radius: 0.5rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.95rem;
}

.live strong {
  background: #14532d;
}
</style>
