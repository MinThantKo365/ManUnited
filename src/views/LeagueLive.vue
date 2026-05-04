<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FixtureCard from '@/components/FixtureCard.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import {
  fetchPremierLeagueLiveMatches,
  fetchPremierLeagueMatchdayMatches,
  fetchPremierLeagueStandings,
  type MatchItem,
  type StandingRow,
} from '@/services/footballApi'

defineOptions({
  name: 'LeagueLiveView',
})

const TEAM_UNITED_ID = 66

const loadingStandings = ref(true)
const loadingLive = ref(true)
const loadingMatchday = ref(true)
const errorStandings = ref('')
const errorLive = ref('')
const errorMatchday = ref('')
const standings = ref<StandingRow[]>([])
const currentMatchday = ref<number | null>(null)
const liveMatches = ref<MatchItem[]>([])
const matchdayFixtures = ref<MatchItem[]>([])
const lastRefresh = ref<string>('')

/** Slower poll = fewer upstream calls → less HTTP 429 from football-data.org. */
const pollMs = 120_000
let pollId: ReturnType<typeof setInterval> | null = null

const formatGd = (n: number) => (n > 0 ? `+${n}` : `${n}`)

const isUnitedRow = (row: StandingRow) =>
  row.teamId === TEAM_UNITED_ID || row.teamName.toLowerCase().includes('manchester united')

const loadStandings = async () => {
  loadingStandings.value = true
  errorStandings.value = ''
  try {
    const data = await fetchPremierLeagueStandings()
    standings.value = data.rows
    currentMatchday.value = data.currentMatchday
  } catch (e) {
    errorStandings.value = e instanceof Error ? e.message : 'Could not load standings.'
  } finally {
    loadingStandings.value = false
  }
}

const loadLive = async (force = false) => {
  loadingLive.value = true
  errorLive.value = ''
  try {
    liveMatches.value = await fetchPremierLeagueLiveMatches({ force })
  } catch (e) {
    errorLive.value = e instanceof Error ? e.message : 'Could not load live matches.'
  } finally {
    loadingLive.value = false
    lastRefresh.value = new Date().toLocaleString()
  }
}

const loadMatchday = async () => {
  loadingMatchday.value = true
  errorMatchday.value = ''
  try {
    const md = currentMatchday.value
    if (md != null && md > 0) {
      matchdayFixtures.value = await fetchPremierLeagueMatchdayMatches(md)
    } else {
      matchdayFixtures.value = []
    }
  } catch (e) {
    errorMatchday.value = e instanceof Error ? e.message : 'Could not load matchday fixtures.'
  } finally {
    loadingMatchday.value = false
  }
}

const refreshAll = async () => {
  await loadStandings()
  await loadLive(true)
  await loadMatchday()
}

const matchdayLabel = computed(() =>
  currentMatchday.value != null ? `Matchday ${currentMatchday.value}` : 'Current matchday',
)

onMounted(async () => {
  await loadStandings()
  await loadLive(true)
  await loadMatchday()
  pollId = setInterval(() => {
    void loadLive(false)
  }, pollMs)
})

onBeforeUnmount(() => {
  if (pollId) clearInterval(pollId)
})
</script>

<template>
  <section class="league-live">
    <div class="section-head">
      <h2>Premier League</h2>
      <p>Live scores, table, and this round’s fixtures from the API.</p>
      <p v-if="lastRefresh" class="updated">Live section last checked: {{ lastRefresh }}</p>
      <button type="button" class="refresh" @click="refreshAll">Refresh all</button>
    </div>

    <article class="panel">
      <h3>Live now</h3>
      <p v-if="errorLive" class="error soft">{{ errorLive }}</p>
      <LoadingSkeleton v-else-if="loadingLive" :cards="2" height="6rem" />
      <p v-else-if="!liveMatches.length" class="empty">No Premier League matches in play right now.</p>
      <div v-else class="fixture-list">
        <FixtureCard
          v-for="m in liveMatches"
          :key="m.id"
          :fixture="m"
          neutral
          :highlight="m.homeTeam.name.toLowerCase().includes('manchester united') || m.awayTeam.name.toLowerCase().includes('manchester united')"
          :to="`/fixtures/${m.id}`"
        />
      </div>
    </article>

    <article class="panel">
      <h3>Premier League standings</h3>
      <p v-if="errorStandings" class="error soft">{{ errorStandings }}</p>
      <LoadingSkeleton v-else-if="loadingStandings" :cards="1" height="10rem" />
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>PL</th>
              <th>W</th>
              <th>L</th>
              <th>D</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in standings"
              :key="row.teamId"
              :class="{ 'united-row': isUnitedRow(row) }"
            >
              <td>{{ row.position }}</td>
              <td class="team">{{ row.teamName }}</td>
              <td>{{ row.played }}</td>
              <td>{{ row.won }}</td>
              <td>{{ row.lost }}</td>
              <td>{{ row.draw }}</td>
              <td>{{ formatGd(row.goalDifference) }}</td>
              <td class="points">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="panel">
      <div class="fixtures-head">
        <h3>{{ matchdayLabel }}</h3>
        <span class="badge">All games this round</span>
      </div>
      <p v-if="errorMatchday" class="error soft">{{ errorMatchday }}</p>
      <LoadingSkeleton v-else-if="loadingMatchday" :cards="4" height="6rem" />
      <p v-else-if="!matchdayFixtures.length" class="empty">No fixtures loaded for this matchday.</p>
      <div v-else class="fixture-list">
        <FixtureCard
          v-for="m in matchdayFixtures"
          :key="m.id"
          :fixture="m"
          neutral
          :highlight="m.homeTeam.name.toLowerCase().includes('manchester united') || m.awayTeam.name.toLowerCase().includes('manchester united')"
          :to="`/fixtures/${m.id}`"
        />
      </div>
    </article>
  </section>
</template>

<style scoped>
.league-live {
  display: grid;
  gap: 1rem;
}

.section-head h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
}

.section-head p {
  color: var(--color-text-muted);
}

.updated {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.refresh {
  margin-top: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  color: var(--color-text);
  border-radius: 0.55rem;
  padding: 0.35rem 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.refresh:hover {
  border-color: var(--color-border-hover);
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
  color: var(--color-text);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  color: var(--color-text);
}

th,
td {
  padding: 0.65rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

thead th {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td.team {
  font-weight: 600;
}

td.points {
  font-weight: 700;
}

.united-row {
  background: #a3001d;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.united-row td {
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.fixtures-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.badge {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  color: var(--color-text);
  background: var(--color-surface-elevated);
}

.fixture-list {
  display: grid;
  gap: 0.65rem;
}

.empty {
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.error.soft {
  color: var(--color-text);
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 0.65rem;
  padding: 0.65rem;
  font-size: 0.9rem;
}
</style>
