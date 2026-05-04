<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { fetchMatchById, type MatchDetail, type MatchGoal } from '@/services/footballApi'

defineOptions({
  name: 'MatchDetailView',
})

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const match = ref<MatchDetail | null>(null)

const matchId = computed(() => Number(route.params.matchId))

const formatDateTime = (utc: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utc))

const scoreLine = computed(() => {
  const m = match.value
  if (!m) return ''
  const h = m.score?.fullTime?.home
  const a = m.score?.fullTime?.away
  const liveStatuses = ['IN_PLAY', 'PAUSED', 'LIVE']
  if (h != null && a != null) return `${h} - ${a}`
  if (liveStatuses.includes(m.status)) return 'Live — score updating'
  return 'vs'
})

const halfTimeLine = computed(() => {
  const m = match.value
  if (!m?.score?.halfTime) return ''
  const h = m.score.halfTime.home
  const a = m.score.halfTime.away
  if (h == null || a == null) return ''
  return `Half-time: ${h} - ${a}`
})

const venueText = computed(() => {
  const v = match.value?.venue
  if (!v) return null
  if (typeof v === 'string') return v
  return v.name ?? null
})

const minuteLabel = (g: MatchGoal) => {
  const m = g.minute
  const extra = g.injuryTime != null && g.injuryTime > 0 ? `+${g.injuryTime}` : ''
  if (m != null && m !== undefined) return `${m}${extra}'`
  return '—'
}

const typeSuffix = (g: MatchGoal) => {
  const t = (g.type ?? '').toUpperCase()
  if (t.includes('OWN')) return ' (o.g.)'
  if (t.includes('PENALTY')) return ' (pen.)'
  return ''
}

const isHomeScoringTeam = (m: MatchDetail, g: MatchGoal) => {
  if (g.team?.id != null && m.homeTeam?.id != null) return g.team.id === m.homeTeam.id
  const tn = g.team?.name?.toLowerCase() ?? ''
  const hn = m.homeTeam.name.toLowerCase()
  return tn !== '' && (tn.includes(hn) || hn.includes(tn))
}

const scorerLine = (g: MatchGoal) => {
  const name = g.scorer?.name?.trim() || 'Unknown'
  const ast = g.assist?.name?.trim()
  const assistTxt = ast ? ` (assist: ${ast})` : ''
  return `${minuteLabel(g)} ${name}${typeSuffix(g)}${assistTxt}`
}

const homeGoalsList = computed(() => {
  const m = match.value
  const list = m?.goals
  if (!m || !list?.length) return []
  return [...list].filter((g) => isHomeScoringTeam(m, g)).sort(goalSortKey)
})

const awayGoalsList = computed(() => {
  const m = match.value
  const list = m?.goals
  if (!m || !list?.length) return []
  return [...list].filter((g) => !isHomeScoringTeam(m, g)).sort(goalSortKey)
})

function goalSortKey(a: MatchGoal, b: MatchGoal) {
  const ma = (a.minute ?? 9999) + (a.injuryTime ?? 0) * 0.001
  const mb = (b.minute ?? 9999) + (b.injuryTime ?? 0) * 0.001
  return ma - mb
}

const hasGoalEvents = computed(
  () => !!(match.value?.goals?.length && match.value.goals.length > 0),
)

const load = async (silent = false) => {
  if (!silent) {
    loading.value = true
    error.value = ''
    match.value = null
  }
  try {
    const id = matchId.value
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error('Invalid match.')
    }
    match.value = await fetchMatchById(id)
  } catch (e) {
    if (!silent) {
      error.value = e instanceof Error ? e.message : 'Unable to load match.'
    }
  } finally {
    if (!silent) loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/fixtures')
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'])
let pollTimer: ReturnType<typeof setInterval> | null = null

const startLivePoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (!match.value || !LIVE_STATUSES.has(match.value.status)) return
  pollTimer = setInterval(() => {
    void load(true)
  }, 90_000)
}

onMounted(async () => {
  await load()
  startLivePoll()
})
watch(matchId, async () => {
  await load()
  startLivePoll()
})

watch(
  () => match.value?.status,
  () => startLivePoll(),
)

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <section class="match-detail">
    <button type="button" class="back-btn" @click="goBack">← Back</button>

    <p v-if="error" class="error">{{ error }}</p>
    <LoadingSkeleton v-else-if="loading" :cards="1" height="14rem" />

    <article v-else-if="match" class="panel">
      <p class="status-pill">{{ match.status }}</p>
      <p v-if="match.competition" class="competition">{{ match.competition.name }}</p>
      <p class="kickoff">{{ formatDateTime(match.utcDate) }}</p>
      <p v-if="match.matchday != null" class="meta">Matchday {{ match.matchday }}</p>

      <div class="teams-row">
        <div class="team">
          <strong>{{ match.homeTeam.shortName || match.homeTeam.name }}</strong>
        </div>
        <div class="score">{{ scoreLine }}</div>
        <div class="team">
          <strong>{{ match.awayTeam.shortName || match.awayTeam.name }}</strong>
        </div>
      </div>

      <p v-if="halfTimeLine" class="ht">{{ halfTimeLine }}</p>
      <p v-if="venueText" class="venue">{{ venueText }}</p>

      <section v-if="hasGoalEvents" class="goals-section">
        <h4 class="goals-heading">Goals</h4>
        <div class="goals-columns">
          <div class="goal-col">
            <p class="goal-col-head">{{ match.homeTeam.shortName || match.homeTeam.name }}</p>
            <ul class="goal-list">
              <li v-for="(g, i) in homeGoalsList" :key="`${g.minute}-${g.scorer?.id}-${i}-h`">
                {{ scorerLine(g) }}
              </li>
              <li v-if="homeGoalsList.length === 0" class="goal-empty">—</li>
            </ul>
          </div>
          <div class="goal-col">
            <p class="goal-col-head">{{ match.awayTeam.shortName || match.awayTeam.name }}</p>
            <ul class="goal-list">
              <li v-for="(g, i) in awayGoalsList" :key="`${g.minute}-${g.scorer?.id}-${i}-a`">
                {{ scorerLine(g) }}
              </li>
              <li v-if="awayGoalsList.length === 0" class="goal-empty">—</li>
            </ul>
          </div>
        </div>
      </section>
      <p v-else-if="['FINISHED', 'IN_PLAY', 'PAUSED'].includes(match.status)" class="goals-note">

      </p>

      <ul v-if="match.referees?.length" class="refs">
        <li v-for="r in match.referees" :key="r.name">{{ r.name }}{{ r.type ? ` (${r.type})` : '' }}</li>
      </ul>
    </article>
  </section>
</template>

<style scoped>
.match-detail {
  display: grid;
  gap: 1rem;
}

.back-btn {
  justify-self: start;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
  border-radius: 0.6rem;
  padding: 0.45rem 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.back-btn:hover {
  border-color: var(--color-border-hover);
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-background-soft);
  padding: 1.1rem;
  display: grid;
  gap: 0.65rem;
  box-shadow: 0 12px 28px var(--shadow-color);
}

.status-pill {
  display: inline-block;
  width: fit-content;
  font-size: 0.8rem;
  color: #ffffff;
  background: #c70101;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-weight: 600;
}

.competition {
  font-weight: 700;
  color: var(--color-text);
}

.kickoff {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.meta {
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.teams-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.team {
  font-size: 1.05rem;
}

.team:last-of-type {
  text-align: right;
}

.score {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-accent);
  text-align: center;
  white-space: nowrap;
}

.ht,
.venue {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.refs {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.goals-section {
  margin-top: 0.35rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-border);
}

.goals-heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.goals-columns {
  display: grid;
  gap: 1rem;
  margin-top: 0.65rem;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 520px) {
  .goals-columns {
    grid-template-columns: 1fr;
  }
}

.goal-col-head {
  margin: 0 0 0.35rem;
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--color-accent);
}

.goal-list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-text);
  font-size: 0.88rem;
  line-height: 1.45;
}

.goal-empty {
  list-style: none;
  margin-left: -1.1rem;
  color: var(--color-text-muted);
}

.goals-note {
  margin: 0;
  padding-top: 0.65rem;
  font-size: 0.82rem;
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
