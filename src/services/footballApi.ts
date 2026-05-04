import axios from 'axios'

const AUTH_TOKEN = import.meta.env.VITE_FOOTBALL_API_KEY || import.meta.env.VITE_X_AUTH_TOKEN
const TEAM_ID = 66
const CACHE_TTL = 5 * 60 * 1000
const CACHE_TTL_STANDINGS = 3 * 60 * 1000
const IS_DEV = import.meta.env.DEV

type CacheEntry<T> = {
  timestamp: number
  data: T
  ttlMs?: number
}

export type MatchScore = {
  fullTime?: {
    home?: number | null
    away?: number | null
  }
  halfTime?: {
    home?: number | null
    away?: number | null
  }
}

export type MatchItem = {
  id: number
  status: string
  utcDate: string
  matchday?: number | null
  homeTeam: {
    id?: number
    name: string
    shortName?: string
  }
  awayTeam: {
    id?: number
    name: string
    shortName?: string
  }
  competition?: {
    id?: number
    name?: string
    code?: string
  }
  score?: MatchScore
  venue?: string | { name?: string | null } | null
}

export type MatchGoal = {
  minute?: number | null
  injuryTime?: number | null
  /** e.g. REGULAR, PENALTY, OWN */
  type?: string | null
  team: { id?: number; name?: string }
  scorer: { id?: number; name?: string }
  assist?: { id?: number; name?: string } | null
}

export type MatchDetail = MatchItem & {
  referees?: { name: string; type?: string }[]
  goals?: MatchGoal[]
}

export type StandingRow = {
  position: number
  teamId: number
  teamName: string
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export type TeamPlayer = {
  id: number
  name: string
  position?: string | null
  nationality?: string | null
  shirtNumber?: number | null
  role?: string | null
  status?: string | null
  photoUrl?: string | null
  dateOfBirth?: string | null
}

type TeamResponse = {
  id: number
  name: string
  squad: TeamPlayer[]
}

type MatchesResponse = {
  matches: MatchItem[]
}

type ScorerItem = {
  player: {
    id: number
    name: string
  }
  team: {
    id: number
  }
  playedMatches?: number | null
  goals?: number | null
  assists?: number | null
}

type CompetitionScorersResponse = {
  scorers: ScorerItem[]
}

const getCache = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>
    const ttl = parsed.ttlMs ?? CACHE_TTL
    if (Date.now() - parsed.timestamp > ttl) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

const setCache = <T>(key: string, data: T, ttlMs: number = CACHE_TTL) => {
  const payload: CacheEntry<T> = {
    timestamp: Date.now(),
    data,
    ttlMs,
  }
  localStorage.setItem(key, JSON.stringify(payload))
}

const api = axios.create({
  // Vite proxy keeps the token out of browser request headers.
  baseURL: '/api/football',
  timeout: 15000,
})

const mapApiError = (status?: number) => {
  if (status === 401 || status === 403) {
    return 'API key is invalid or not authorized for this endpoint.'
  }
  if (status === 429) {
    return 'football-data.org rate limit exceeded (429). Few free-tier requests are allowed each minute — wait 1–2 minutes, open fewer tabs, or upgrade your API plan.'
  }
  if (status === 404) {
    return 'Requested API endpoint was not found. Verify Vercel proxy route and team ID.'
  }
  return 'Unable to load data. Please try again later.'
}

const resolveErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return IS_DEV
        ? 'Network/CORS error. Restart the dev server so proxy settings and .env are reloaded.'
        : 'Network error while reaching the football API proxy.'
    }
    return mapApiError(error.response?.status)
  }
  return 'Unable to load data. Please try again later.'
}

const assertDevApiToken = () => {
  if (IS_DEV && !AUTH_TOKEN) {
    throw new Error('Missing VITE_FOOTBALL_API_KEY in .env. Restart the dev server.')
  }
}

const getFixtures = (teamId: number) => api.get<MatchesResponse>(`/teams/${teamId}/matches`)
const getTeam = (teamId: number) => api.get<TeamResponse>(`/teams/${teamId}`)
const getCompetitionScorers = (competitionCode: string) =>
  api.get<CompetitionScorersResponse>(`/competitions/${competitionCode}/scorers`, {
    params: { limit: 500 },
  })

type StandingsApiResponse = {
  season?: { currentMatchday?: number | null }
  standings?: Array<{
    type?: string
    table?: Array<{
      position: number
      team: { id: number; name: string }
      playedGames: number
      won: number
      draw: number
      lost: number
      points: number
      goalsFor: number
      goalsAgainst: number
      goalDifference: number
    }>
  }>
}

type MatchesEnvelope = { matches: MatchItem[] }

const getMatch = (id: number) => api.get<MatchDetail>(`/matches/${id}`)
const getCompetitionStandings = (code: string) =>
  api.get<StandingsApiResponse>(`/competitions/${code}/standings`)
const getCompetitionMatches = (code: string, params?: Record<string, string | number | undefined>) =>
  api.get<MatchesEnvelope>(`/competitions/${code}/matches`, { params })

export const fetchTeam = async (): Promise<TeamResponse> => {
  assertDevApiToken()

  const cacheKey = `football-team-${TEAM_ID}`
  const cached = getCache<TeamResponse>(cacheKey)
  if (cached) return cached

  try {
    const response = await getTeam(TEAM_ID)
    setCache(cacheKey, response.data)
    return response.data
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchMatches = async (): Promise<MatchesResponse> => {
  assertDevApiToken()

  const cacheKey = `football-matches-${TEAM_ID}`
  const cached = getCache<MatchesResponse>(cacheKey)
  if (cached) return cached

  try {
    const response = await getFixtures(TEAM_ID)
    setCache(cacheKey, response.data)
    return response.data
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchPlayerById = async (playerId: number) => {
  const team = await fetchTeam()
  return team.squad.find((player) => player.id === playerId) ?? null
}

export const fetchTeamScorers = async (competitionCode = 'PL'): Promise<ScorerItem[]> => {
  assertDevApiToken()

  const cacheKey = `football-scorers-${competitionCode}-${TEAM_ID}`
  const cached = getCache<ScorerItem[]>(cacheKey)
  if (cached) return cached

  try {
    const response = await getCompetitionScorers(competitionCode)
    const teamScorers = (response.data.scorers ?? []).filter((item) => item.team.id === TEAM_ID)
    setCache(cacheKey, teamScorers)
    return teamScorers
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchMatchById = async (matchId: number): Promise<MatchDetail> => {
  assertDevApiToken()
  try {
    const response = await getMatch(matchId)
    return response.data
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchPremierLeagueStandings = async (): Promise<{
  rows: StandingRow[]
  currentMatchday: number | null
}> => {
  assertDevApiToken()
  const cacheKey = 'pl-standings-table'
  const cached = getCache<{ rows: StandingRow[]; currentMatchday: number | null }>(cacheKey)
  if (cached) return cached

  try {
    const response = await getCompetitionStandings('PL')
    const currentMatchday = response.data.season?.currentMatchday ?? null
    const groups = response.data.standings ?? []
    const total =
      groups.find((g) => g.type === 'TOTAL')?.table ?? groups[0]?.table ?? []
    const rows: StandingRow[] = total.map((row) => ({
      position: row.position,
      teamId: row.team.id,
      teamName: row.team.name,
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
    }))
    const payload = { rows, currentMatchday }
    setCache(cacheKey, payload, CACHE_TTL_STANDINGS)
    return payload
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

/** One request instead of four — avoids burning the API rate limit on every poll. */
const LIVE_MATCH_STATUSES_PARAM = 'IN_PLAY,PAUSED,EXTRA_TIME,PENALTY_SHOOTOUT'

let liveMatchesLastFetched = 0
let liveMatchesLastResult: MatchItem[] | null = null

/** Live / in-play Premier League matches — throttled unless `force` is true (e.g. user Refresh). */
export const fetchPremierLeagueLiveMatches = async (
  opts?: { force?: boolean },
): Promise<MatchItem[]> => {
  assertDevApiToken()
  const minGapMs = 45_000
  const now = Date.now()
  if (
    !opts?.force &&
    liveMatchesLastResult &&
    now - liveMatchesLastFetched < minGapMs
  ) {
    return liveMatchesLastResult
  }
  try {
    const response = await getCompetitionMatches('PL', { status: LIVE_MATCH_STATUSES_PARAM })
    const list = response.data.matches ?? []
    const sorted = [...list].sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    )
    liveMatchesLastFetched = Date.now()
    liveMatchesLastResult = sorted
    return sorted
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

/** Upcoming PL fixtures (scheduled + timed) in one request. */
export const fetchPremierLeagueScheduledMatches = async (): Promise<MatchItem[]> => {
  assertDevApiToken()
  try {
    const response = await getCompetitionMatches('PL', {
      status: 'SCHEDULED,TIMED',
    })
    const list = response.data.matches ?? []
    return [...list].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

const CACHE_TTL_MATCHDAY = 10 * 60 * 1000

export const fetchPremierLeagueMatchdayMatches = async (
  matchday: number,
): Promise<MatchItem[]> => {
  assertDevApiToken()
  const cacheKey = `pl-matchday-${matchday}`
  const cached = getCache<MatchItem[]>(cacheKey)
  if (cached) return cached

  try {
    const response = await getCompetitionMatches('PL', { matchday })
    const list = response.data.matches ?? []
    const sorted = [...list].sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    )
    setCache(cacheKey, sorted, CACHE_TTL_MATCHDAY)
    return sorted
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}
