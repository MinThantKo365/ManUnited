import axios from 'axios'

const AUTH_TOKEN = import.meta.env.VITE_FOOTBALL_API_KEY || import.meta.env.VITE_X_AUTH_TOKEN
const TEAM_ID = 66
const CACHE_TTL = 5 * 60 * 1000

type CacheEntry<T> = {
  timestamp: number
  data: T
}

export type MatchItem = {
  id: number
  status: string
  utcDate: string
  homeTeam: {
    name: string
    shortName?: string
  }
  awayTeam: {
    name: string
    shortName?: string
  }
  score?: {
    fullTime?: {
      home?: number | null
      away?: number | null
    }
  }
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
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return parsed.data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

const setCache = <T>(key: string, data: T) => {
  const payload: CacheEntry<T> = {
    timestamp: Date.now(),
    data,
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
    return 'Rate limit reached. Please wait a few minutes and try again.'
  }
  if (status === 404) {
    return 'Team data endpoint not found. Please verify the team ID.'
  }
  return 'Unable to load data. Please try again later.'
}

const resolveErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Network/CORS error. Restart the dev server so proxy settings and .env are reloaded.'
    }
    return mapApiError(error.response?.status)
  }
  return 'Unable to load data. Please try again later.'
}

const getFixtures = (teamId: number) => api.get<MatchesResponse>(`/teams/${teamId}/matches`)
const getTeam = (teamId: number) => api.get<TeamResponse>(`/teams/${teamId}`)
const getCompetitionScorers = (competitionCode: string) =>
  api.get<CompetitionScorersResponse>(`/competitions/${competitionCode}/scorers`, {
    params: { limit: 500 },
  })

export const fetchTeam = async (): Promise<TeamResponse> => {
  if (!AUTH_TOKEN) {
    throw new Error('Missing VITE_FOOTBALL_API_KEY in .env. Restart the dev server.')
  }

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
  if (!AUTH_TOKEN) {
    throw new Error('Missing VITE_FOOTBALL_API_KEY in .env. Restart the dev server.')
  }

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
  if (!AUTH_TOKEN) {
    throw new Error('Missing VITE_FOOTBALL_API_KEY in .env. Restart the dev server.')
  }

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
