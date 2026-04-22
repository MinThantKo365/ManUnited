<script setup lang="ts">
defineOptions({
  name: 'LeagueLiveView',
})

type TableRow = {
  position: number
  team: string
  played: number
  wins: number
  losses: number
  draws: number
  goalDifference: string
  points: number
}

type MatchdayFixture = {
  date: string
  home: string
  away: string
  venue: string
  isUnitedFixture?: boolean
}

const standings: TableRow[] = [
  { position: 1, team: 'Arsenal', played: 33, wins: 21, losses: 5, draws: 7, goalDifference: '+37', points: 70 },
  { position: 2, team: 'Manchester City', played: 32, wins: 20, losses: 5, draws: 7, goalDifference: '+36', points: 67 },
  { position: 3, team: 'Manchester United', played: 33, wins: 17, losses: 8, draws: 7, goalDifference: '+13', points: 58 },
  { position: 4, team: 'Aston Villa', played: 33, wins: 16, losses: 7, draws: 10, goalDifference: '+6', points: 58 },
  { position: 5, team: 'Liverpool', played: 33, wins: 15, losses: 8, draws: 10, goalDifference: '+11', points: 55 },
  { position: 6, team: 'Brighton', played: 34, wins: 13, losses: 10, draws: 11, goalDifference: '+9', points: 50 },
  { position: 7, team: 'Chelsea', played: 34, wins: 13, losses: 12, draws: 9, goalDifference: '+8', points: 48 },
]

const matchday34Fixtures: MatchdayFixture[] = [
  { date: 'April 23', home: 'Burnley', away: 'Manchester City', venue: 'Turf Moor' },
  { date: 'April 23', home: 'Bournemouth', away: 'Leeds United', venue: 'Vitality Stadium' },
  { date: 'April 25', home: 'Arsenal', away: 'Newcastle', venue: 'Emirates Stadium' },
  { date: 'April 25', home: 'Liverpool', away: 'Crystal Palace', venue: 'Anfield' },
  {
    date: 'April 28',
    home: 'Manchester United',
    away: 'Brentford',
    venue: 'Old Trafford',
    isUnitedFixture: true,
  },
]
</script>

<template>
  <section class="league-live">
    <div class="section-head">
      <h2>Premier League Live Dashboard</h2>
      <p>As of April 22, 2026</p>
    </div>

    <article class="panel">
      <h3>Premier League Standings</h3>
      <div class="table-wrap">
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
              :key="row.team"
              :class="{ 'united-row': row.team === 'Manchester United' }"
            >
              <td>{{ row.position }}</td>
              <td class="team">{{ row.team }}</td>
              <td>{{ row.played }}</td>
              <td>{{ row.wins }}</td>
              <td>{{ row.losses }}</td>
              <td>{{ row.draws }}</td>
              <td>{{ row.goalDifference }}</td>
              <td class="points">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="panel">
      <div class="fixtures-head">
        <h3>Matchday 34</h3>
        <span class="badge">Upcoming Fixtures</span>
      </div>
      <div class="fixture-list">
        <article
          v-for="fixture in matchday34Fixtures"
          :key="`${fixture.date}-${fixture.home}-${fixture.away}`"
          :class="['fixture-item', { highlighted: fixture.isUnitedFixture }]"
        >
          <p class="date">{{ fixture.date }}</p>
          <p class="teams">
            <strong>{{ fixture.home }}</strong>
            <span>vs.</span>
            <strong>{{ fixture.away }}</strong>
          </p>
          <p class="venue">{{ fixture.venue }}</p>
          <p v-if="fixture.isUnitedFixture" class="fixture-note">
            Crucial match for United's Champions League position.
          </p>
        </article>
      </div>
    </article>

    <article class="panel">
      <h3>United Status</h3>
      <div class="status-grid">
        <div class="status-card">
          <span>Position</span>
          <strong>3rd</strong>
        </div>
        <div class="status-card">
          <span>Points</span>
          <strong>58</strong>
        </div>
        <div class="status-card">
          <span>Tie Break</span>
          <strong>Ahead of Villa on GD</strong>
        </div>
        <div class="status-card">
          <span>Next Big Game</span>
          <strong>Brentford (H), April 28</strong>
        </div>
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

.fixture-item {
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  background: var(--color-surface-elevated);
  padding: 0.75rem;
  display: grid;
  gap: 0.2rem;
  box-shadow: 0 8px 18px var(--shadow-color);
}

.fixture-item.highlighted {
  border-color: rgba(255, 84, 112, 0.7);
  background: linear-gradient(120deg, rgba(163, 0, 29, 0.32), rgba(14, 26, 56, 0.75));
  box-shadow:
    0 0 18px rgba(255, 73, 104, 0.32),
    0 0 0 1px rgba(255, 110, 132, 0.3);
}

.date {
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.teams {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-text);
}

.teams span {
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.venue {
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

.fixture-note {
  color: #ffdbe3;
  font-size: 0.8rem;
  margin-top: 0.15rem;
}

.status-grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 700px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}

.status-card {
  border: 1px solid var(--color-border);
  border-radius: 0.8rem;
  background: var(--color-surface-elevated);
  padding: 0.7rem;
  display: grid;
  gap: 0.25rem;
}

.status-card span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.status-card strong {
  color: var(--color-text);
  font-size: 1.02rem;
}
</style>
