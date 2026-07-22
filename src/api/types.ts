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

/** La ventana efectiva viaja en la respuesta: el backend pudo recortar la pedida. */
export interface HabitHistory {
  from: string
  to: string
  dates: string[]
}

export interface Galaxy {
  id: string
  name: string
  description: string | null
  theme: string
  creatorId: string
  createdAt: string
  activeMembers: number
  member: boolean
  joinedOn: string | null
  habitId: string | null
}

/** Una estrella del mapa: nivel 0..4 mas las cifras crudas que lo explican. */
export interface GalaxyDay {
  date: string
  activeMembers: number
  completions: number
  level: number
}

export interface GalaxyMap {
  from: string
  to: string
  maxLevel: number
  perfectDays: number
  totalStars: number
  averageRatio: number
  days: GalaxyDay[]
}

export interface GalaxyDetail {
  galaxy: Galaxy
  map: GalaxyMap
}

export interface GalaxyDayDetail {
  date: string
  activeMembers: number
  completions: number
  level: number
  completedBy: string[]
}

export interface GalaxyMember {
  userId: string
  displayName: string
  joinedOn: string
}

export interface ThemeCount {
  theme: string
  galaxies: number
  members: number
}

export interface InviteCode {
  inviteCode: string
}

export interface FriendRequest {
  requestId: string
  userId: string
  displayName: string
  direction: 'INCOMING' | 'OUTGOING'
  createdAt: string
}

/** Resumen agregado de un amigo: nunca nombres de habitos ni email. */
export interface Friend {
  userId: string
  displayName: string
  friendsSince: string
  activeHabits: number
  bestCurrentStreak: number
  longestStreakEver: number
  totalStars: number
  totalConstellations: number
  completedToday: number
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}
