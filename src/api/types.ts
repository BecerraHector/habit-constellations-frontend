// Espejo de los DTOs del backend. Se mantienen a mano (no generados) mientras la
// superficie sea pequena; si crece, se pasa al esquema OpenAPI ya publicado.

export interface UserResponse {
  id: string
  email: string
  displayName: string
  zoneId: string
  inviteCode: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  refreshToken: string
  user: UserResponse
}

export interface Progress {
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  lastCompletedDate: string | null
  completedToday: boolean
  starsInCurrentCycle: number
  completedConstellations: number
  daysToNextConstellation: number
}

export interface Habit {
  id: string
  name: string
  description: string | null
  archived: boolean
  progress: Progress
}
