<script setup lang="ts">
type Team = {
  name: string
  shortName?: string
}

type FixtureScore = {
  fullTime?: {
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
}>()

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

const isFinished = () => props.fixture.status === 'FINISHED'

const scoreText = () => {
  if (!isFinished()) return 'vs'
  const home = props.fixture.score?.fullTime?.home ?? '-'
  const away = props.fixture.score?.fullTime?.away ?? '-'
  return `${home} - ${away}`
}

const opponent = () => {
  const isUnitedHome = props.fixture.homeTeam.name.toLowerCase().includes('manchester united')
  return isUnitedHome ? props.fixture.awayTeam.name : props.fixture.homeTeam.name
}
</script>

<template>
  <article :class="['fixture-card', { highlight }]">
    <div class="fixture-top">
      <p class="status">{{ fixture.status }}</p>
      <p class="date">{{ formatDate(fixture.utcDate) }}</p>
    </div>
    <p class="opponent">Opponent: {{ opponent() }}</p>

    <div class="teams">
      <p>{{ fixture.homeTeam.shortName || fixture.homeTeam.name }}</p>
      <strong>{{ scoreText() }}</strong>
      <p>{{ fixture.awayTeam.shortName || fixture.awayTeam.name }}</p>
    </div>
  </article>
</template>

<style scoped>
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

.date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.opponent {
  color: var(--color-text);
  font-weight: 600;
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
</style>
