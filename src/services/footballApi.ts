import axios from 'axios'

const AUTH_TOKEN = import.meta.env.VITE_FOOTBALL_API_KEY || import.meta.env.VITE_X_AUTH_TOKEN
const TEAM_ID = 66
/** Premier League 2026/27 — API uses the season start year (2026). */
export const SEASON_START_YEAR = Number(import.meta.env.VITE_FOOTBALL_SEASON) || 2026
export const SEASON_LABEL = `${SEASON_START_YEAR}/${SEASON_START_YEAR + 1}`
const SEASON_DATE_FROM = `${SEASON_START_YEAR}-08-01`
const SEASON_DATE_TO = `${SEASON_START_YEAR + 1}-07-01`
const SEASON_CACHE_KEY = `s${SEASON_START_YEAR}`

const CACHE_TTL = 5 * 60 * 1000
const CACHE_TTL_STANDINGS = 3 * 60 * 1000
const CACHE_TTL_MATCHDAY = 10 * 60 * 1000
const LIVE_MATCH_STATUSES_PARAM = 'LIVE,IN_PLAY,PAUSED'
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

export type TeamCoach = {
  id?: number | null
  name: string
  nationality?: string | null
  dateOfBirth?: string | null
}

type TeamResponse = {
  id: number
  name: string
  squad: TeamPlayer[]
  coach?: TeamCoach | null
}

type CompetitionTeam = {
  id: number
  name: string
  coach?: {
    id?: number | null
    name?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
  } | null
  squad?: Array<{
    id: number
    name: string
    position?: string | null
    nationality?: string | null
    shirtNumber?: number | null
    dateOfBirth?: string | null
    role?: string | null
  }>
}

type CompetitionTeamsResponse = {
  teams: CompetitionTeam[]
}

type PersonResponse = {
  id: number
  name: string
  position?: string | null
  section?: string | null
  shirtNumber?: number | null
  nationality?: string | null
  dateOfBirth?: string | null
}

const MAN_UTD_COACH_FALLBACK: TeamCoach = {
  name: 'Michael Carrick',
  nationality: 'England',
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

type StandingsApiResponse = {
  season?: {
    currentMatchday?: number | null
    startDate?: string
    endDate?: string
  }
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

export type LeagueStandingsResult = {
  rows: StandingRow[]
  currentMatchday: number | null
  seasonLabel: string
  limited: boolean
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
  localStorage.setItem(
    key,
    JSON.stringify({ timestamp: Date.now(), data, ttlMs } satisfies CacheEntry<T>),
  )
}

const api = axios.create({
  baseURL: '/api/football',
  timeout: 15000,
})

const mapApiError = (status?: number) => {
  if (status === 401) {
    return (
      'Unauthorized (401): API key is missing or wrong. ' +
      'Locally: VITE_FOOTBALL_API_KEY in .env. On Vercel: FOOTBALL_API_KEY.'
    )
  }
  if (status === 403) {
    return (
      'Forbidden (403): This endpoint is not on your football-data.org plan. ' +
      'United team data (/teams/66) usually works on free tier; full PL table may need a paid plan.'
    )
  }
  if (status === 429) {
    return 'Rate limit (429): wait 1–2 minutes or upgrade your API plan.'
  }
  if (status === 404) {
    return 'Endpoint not found. Check Vercel proxy and team ID.'
  }
  if (status === 500) {
    return 'Server: FOOTBALL_API_KEY may be missing on Vercel.'
  }
  return 'Unable to load data. Please try again later.'
}

const resolveErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return IS_DEV
        ? 'Network/CORS error. Restart dev server after .env changes.'
        : 'Network error reaching the football API proxy.'
    }
    const status = error.response.status
    if ([401, 403, 429, 404, 500].includes(status)) {
      return mapApiError(status)
    }
    const body = error.response.data
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
    ) {
      return (body as { message: string }).message
    }
    return mapApiError(status)
  }
  return 'Unable to load data. Please try again later.'
}

const assertDevApiToken = () => {
  if (IS_DEV && !AUTH_TOKEN) {
    throw new Error('Missing VITE_FOOTBALL_API_KEY in .env. Restart the dev server.')
  }
}

const isForbidden = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 403

const isPremierLeagueMatch = (match: MatchItem) => {
  const code = match.competition?.code?.toUpperCase()
  if (code === 'PL') return true
  const name = match.competition?.name?.toLowerCase() ?? ''
  return name.includes('premier league')
}

const seasonFromMs = new Date(SEASON_DATE_FROM).getTime()
const seasonToMs = new Date(SEASON_DATE_TO).getTime()

const isInSeasonWindow = (utcDate: string) => {
  const t = new Date(utcDate).getTime()
  return t >= seasonFromMs && t < seasonToMs
}

const filterSeasonMatches = (matches: MatchItem[]) =>
  matches.filter((m) => isInSeasonWindow(m.utcDate))

const sortByKickoffAsc = (list: MatchItem[]) =>
  [...list].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

const seasonTeamMatchParams = () => ({
  season: SEASON_START_YEAR,
  dateFrom: SEASON_DATE_FROM,
  dateTo: SEASON_DATE_TO,
})

const seasonCompetitionParams = (extra?: Record<string, string | number | undefined>) => ({
  season: SEASON_START_YEAR,
  ...extra,
})

const getFixtures = (teamId: number, params?: Record<string, string | number>) =>
  api.get<MatchesResponse>(`/teams/${teamId}/matches`, { params })

const getTeam = (teamId: number) => api.get<TeamResponse>(`/teams/${teamId}`)

const getCompetitionTeams = (code: string, season: number) =>
  api.get<CompetitionTeamsResponse>(`/competitions/${code}/teams`, { params: { season } })

const getPerson = (id: number) => api.get<PersonResponse>(`/persons/${id}`)

const getCompetitionScorers = (competitionCode: string) =>
  api.get<CompetitionScorersResponse>(`/competitions/${competitionCode}/scorers`, {
    params: { limit: 500, season: SEASON_START_YEAR },
  })

const getMatch = (id: number) => api.get<MatchDetail>(`/matches/${id}`)

const getCompetitionStandings = (code: string) =>
  api.get<StandingsApiResponse>(`/competitions/${code}/standings`, {
    params: { season: SEASON_START_YEAR },
  })

const getCompetitionMatches = (code: string, params?: Record<string, string | number | undefined>) =>
  api.get<MatchesEnvelope>(`/competitions/${code}/matches`, {
    params: seasonCompetitionParams(params),
  })

const fetchTeamMatchesRaw = async (): Promise<MatchItem[]> => {
  try {
    const response = await getFixtures(TEAM_ID, seasonTeamMatchParams())
    return filterSeasonMatches(response.data.matches ?? [])
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 400) {
      throw error
    }
    const response = await getFixtures(TEAM_ID, {
      dateFrom: SEASON_DATE_FROM,
      dateTo: SEASON_DATE_TO,
    })
    return filterSeasonMatches(response.data.matches ?? [])
  }
}

const mapSquadPlayer = (player: {
  id: number
  name: string
  position?: string | null
  nationality?: string | null
  shirtNumber?: number | null
  dateOfBirth?: string | null
  role?: string | null
}): TeamPlayer => ({
  id: player.id,
  name: player.name,
  position: player.position ?? null,
  nationality: player.nationality ?? null,
  shirtNumber: player.shirtNumber ?? null,
  dateOfBirth: player.dateOfBirth ?? null,
  role: player.role ?? 'PLAYER',
  status: 'Active',
})

const resolveCoach = (coach?: CompetitionTeam['coach']): TeamCoach => {
  if (coach?.name) {
    return {
      id: coach.id,
      name: coach.name,
      nationality: coach.nationality ?? null,
      dateOfBirth: coach.dateOfBirth ?? null,
    }
  }
  return MAN_UTD_COACH_FALLBACK
}

const fetchTeamFromCompetition = async (): Promise<TeamResponse> => {
  const seasons = [SEASON_START_YEAR, SEASON_START_YEAR - 1, SEASON_START_YEAR - 2]
  for (const season of seasons) {
    try {
      const response = await getCompetitionTeams('PL', season)
      const team = response.data.teams?.find((t) => t.id === TEAM_ID)
      if (team?.squad?.length) {
        return {
          id: team.id,
          name: team.name,
          squad: team.squad.map(mapSquadPlayer),
          coach: resolveCoach(team.coach),
        }
      }
    } catch (error) {
      if (!isForbidden(error)) {
        throw error
      }
    }
  }
  throw new Error(
    `Squad not published for ${SEASON_LABEL} yet. football-data.org has no roster for this season.`,
  )
}

export const enrichPlayerFromPerson = async (player: TeamPlayer): Promise<TeamPlayer> => {
  if (player.shirtNumber != null) return player
  const cacheKey = `football-person-${player.id}`
  const cached = getCache<TeamPlayer>(cacheKey)
  if (cached) return { ...player, ...cached }

  try {
    const response = await getPerson(player.id)
    const enriched: TeamPlayer = {
      ...player,
      shirtNumber: response.data.shirtNumber ?? player.shirtNumber ?? null,
      position: response.data.position || response.data.section || player.position,
      nationality: response.data.nationality ?? player.nationality,
      dateOfBirth: response.data.dateOfBirth ?? player.dateOfBirth,
    }
    setCache(cacheKey, enriched, CACHE_TTL)
    return enriched
  } catch {
    return player
  }
}

export const fetchTeam = async (): Promise<TeamResponse> => {
  assertDevApiToken()
  const cacheKey = `football-team-${TEAM_ID}-${SEASON_CACHE_KEY}-v2`
  const cached = getCache<TeamResponse>(cacheKey)
  if (cached?.squad?.length) return cached

  try {
    const response = await getTeam(TEAM_ID)
    let data = response.data
    if (!data.squad?.length) {
      data = await fetchTeamFromCompetition()
    } else {
      data = {
        ...data,
        squad: data.squad.map((p) => ({ ...p, role: p.role ?? 'PLAYER', status: p.status ?? 'Active' })),
        coach: resolveCoach(data.coach as CompetitionTeam['coach']),
      }
    }
    if (!data.coach?.name) {
      data.coach = MAN_UTD_COACH_FALLBACK
    }
    setCache(cacheKey, data)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const data = await fetchTeamFromCompetition()
      setCache(cacheKey, data)
      return data
    }
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchMatches = async (): Promise<MatchesResponse> => {
  assertDevApiToken()
  const cacheKey = `football-matches-${TEAM_ID}-${SEASON_CACHE_KEY}`
  const cached = getCache<MatchesResponse>(cacheKey)
  if (cached) return cached

  try {
    const matches = await fetchTeamMatchesRaw()
    const payload = { matches }
    setCache(cacheKey, payload)
    return payload
  } catch (error) {
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchPlayerById = async (playerId: number) => {
  const team = await fetchTeam()
  const player = team.squad.find((p) => p.id === playerId) ?? null
  if (!player) return null
  return enrichPlayerFromPerson(player)
}

export const fetchTeamScorers = async (competitionCode = 'PL'): Promise<ScorerItem[]> => {
  assertDevApiToken()
  const cacheKey = `football-scorers-${competitionCode}-${TEAM_ID}-${SEASON_CACHE_KEY}`
  const cached = getCache<ScorerItem[]>(cacheKey)
  if (cached) return cached

  try {
    const response = await getCompetitionScorers(competitionCode)
    const teamScorers = (response.data.scorers ?? []).filter((item) => item.team.id === TEAM_ID)
    setCache(cacheKey, teamScorers)
    return teamScorers
  } catch (error) {
    if (isForbidden(error)) return []
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchMatchById = async (matchId: number): Promise<MatchDetail> => {
  assertDevApiToken()
  try {
    const response = await getMatch(matchId)
    return response.data
  } catch (error) {
    if (isForbidden(error) || (axios.isAxiosError(error) && error.response?.status === 404)) {
      const { matches } = await fetchMatches()
      const found = matches.find((m) => m.id === matchId)
      if (found) return found
    }
    throw new Error(resolveErrorMessage(error))
  }
}

export const computeUnitedSeasonStats = (finishedMatches: MatchItem[]): StandingRow => {
  let played = 0
  let won = 0
  let draw = 0
  let lost = 0
  let goalsFor = 0
  let goalsAgainst = 0

  for (const match of finishedMatches) {
    if (!isPremierLeagueMatch(match)) continue
    const home = match.score?.fullTime?.home
    const away = match.score?.fullTime?.away
    if (home == null || away == null) continue

    const isUnitedHome = match.homeTeam.name.toLowerCase().includes('manchester united')
    const unitedGoals = isUnitedHome ? home : away
    const opponentGoals = isUnitedHome ? away : home

    played += 1
    goalsFor += unitedGoals
    goalsAgainst += opponentGoals
    if (unitedGoals > opponentGoals) won += 1
    else if (unitedGoals === opponentGoals) draw += 1
    else lost += 1
  }

  return {
    position: 0,
    teamId: TEAM_ID,
    teamName: 'Manchester United',
    played,
    won,
    draw,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: won * 3 + draw,
  }
}

const inferCurrentMatchday = (matches: MatchItem[]): number | null => {
  const days = matches
    .map((m) => m.matchday)
    .filter((d): d is number => d != null && d > 0)
  if (!days.length) return null
  return Math.max(...days)
}

const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'IN PLAY', 'PAUSED'])

export const fetchUnitedLiveMatches = async (): Promise<MatchItem[]> => {
  assertDevApiToken()
  try {
    const response = await getFixtures(TEAM_ID, {
      ...seasonTeamMatchParams(),
      status: LIVE_MATCH_STATUSES_PARAM,
    })
    return sortByKickoffAsc(filterSeasonMatches(response.data.matches ?? []))
  } catch (error) {
    if (isForbidden(error)) {
      const { matches } = await fetchMatches()
      return sortByKickoffAsc(matches.filter((m) => LIVE_STATUSES.has(m.status)))
    }
    throw new Error(resolveErrorMessage(error))
  }
}

let liveMatchesLastFetched = 0
let liveMatchesLastResult: MatchItem[] | null = null

export const fetchPremierLeagueStandings = async (): Promise<LeagueStandingsResult> => {
  assertDevApiToken()
  const cacheKey = `pl-standings-${SEASON_CACHE_KEY}`
  const cached = getCache<LeagueStandingsResult>(cacheKey)
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
    const payload: LeagueStandingsResult = {
      rows,
      currentMatchday,
      seasonLabel: SEASON_LABEL,
      limited: false,
    }
    setCache(cacheKey, payload, CACHE_TTL_STANDINGS)
    return payload
  } catch (error) {
    if (!isForbidden(error)) {
      throw new Error(resolveErrorMessage(error))
    }
    const { matches } = await fetchMatches()
    const pl = matches.filter(isPremierLeagueMatch)
    const payload: LeagueStandingsResult = {
      rows: [computeUnitedSeasonStats(pl.filter((m) => m.status === 'FINISHED'))],
      currentMatchday: inferCurrentMatchday(pl),
      seasonLabel: SEASON_LABEL,
      limited: true,
    }
    setCache(cacheKey, payload, CACHE_TTL_STANDINGS)
    return payload
  }
}

export const fetchPremierLeagueLiveMatches = async (opts?: { force?: boolean }) => {
  assertDevApiToken()
  const minGapMs = 45_000
  const now = Date.now()
  if (!opts?.force && liveMatchesLastResult && now - liveMatchesLastFetched < minGapMs) {
    return liveMatchesLastResult
  }
  try {
    const response = await getCompetitionMatches('PL', { status: LIVE_MATCH_STATUSES_PARAM })
    const sorted = sortByKickoffAsc(response.data.matches ?? [])
    liveMatchesLastFetched = Date.now()
    liveMatchesLastResult = sorted
    return sorted
  } catch (error) {
    if (isForbidden(error)) {
      const sorted = await fetchUnitedLiveMatches()
      liveMatchesLastFetched = Date.now()
      liveMatchesLastResult = sorted
      return sorted
    }
    throw new Error(resolveErrorMessage(error))
  }
}

export const fetchPremierLeagueScheduledMatches = async (): Promise<MatchItem[]> => {
  assertDevApiToken()
  try {
    const response = await getCompetitionMatches('PL', { status: 'SCHEDULED,TIMED' })
    return sortByKickoffAsc(response.data.matches ?? [])
  } catch (error) {
    if (isForbidden(error)) {
      const { matches } = await fetchMatches()
      return sortByKickoffAsc(
        matches.filter((m) => ['SCHEDULED', 'TIMED', 'POSTPONED'].includes(m.status)),
      )
    }
    throw new Error(resolveErrorMessage(error))
  }
}

const filterUnitedUpcomingPl = (matches: MatchItem[], matchday?: number | null) =>
  sortByKickoffAsc(
    matches.filter(
      (m) =>
        isPremierLeagueMatch(m) &&
        ['SCHEDULED', 'TIMED', 'POSTPONED'].includes(m.status) &&
        (matchday == null || matchday <= 0 || m.matchday == null || m.matchday === matchday),
    ),
  )

export const fetchPremierLeagueMatchdayMatches = async (
  matchday?: number | null,
): Promise<MatchItem[]> => {
  assertDevApiToken()
  const cacheKey = `pl-matchday-${matchday ?? 'upcoming'}-${SEASON_CACHE_KEY}`
  const cached = getCache<MatchItem[]>(cacheKey)
  if (cached) return cached

  if (matchday == null || matchday <= 0) {
    const { matches } = await fetchMatches()
    const upcoming = filterUnitedUpcomingPl(matches)
    setCache(cacheKey, upcoming, CACHE_TTL_MATCHDAY)
    return upcoming
  }

  try {
    const response = await getCompetitionMatches('PL', { matchday })
    const sorted = sortByKickoffAsc(response.data.matches ?? [])
    setCache(cacheKey, sorted, CACHE_TTL_MATCHDAY)
    return sorted
  } catch (error) {
    if (!isForbidden(error)) {
      throw new Error(resolveErrorMessage(error))
    }
    const { matches } = await fetchMatches()
    const upcoming = filterUnitedUpcomingPl(matches, matchday)
    setCache(cacheKey, upcoming, CACHE_TTL_MATCHDAY)
    return upcoming
  }
}
