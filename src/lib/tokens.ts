import type { TokenResponse } from '@/api/types'

// El access token (JWT, vida corta) vive solo en memoria: se pierde al recargar y
// ningun script de otra pestana lo alcanza. El refresh (opaco) va en localStorage
// para recuperar la sesion tras recargar; el backend lo rota en cada uso y cierra
// todas las sesiones si se reutiliza uno revocado, que es lo que acota el riesgo.

const REFRESH_KEY = 'hc.refresh'

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setSession(tokens: TokenResponse): void {
  accessToken = tokens.accessToken
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearSession(): void {
  accessToken = null
  localStorage.removeItem(REFRESH_KEY)
}
