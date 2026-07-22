import type { TokenResponse, UserResponse } from '@/api/types'
import { apiFetch } from '@/lib/http'
import { clearSession, getRefreshToken, setSession } from '@/lib/tokens'

export interface RegisterInput {
  email: string
  password: string
  displayName: string
  zoneId: string
}

export async function login(email: string, password: string): Promise<UserResponse> {
  const tokens = await apiFetch<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
  setSession(tokens)
  return tokens.user
}

export async function register(input: RegisterInput): Promise<UserResponse> {
  // El registro no inicia sesion: devuelve el usuario y despues se hace login.
  return apiFetch<UserResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

/** Recupera la sesion tras recargar, usando el refresh guardado. null si no hay o caduco. */
export async function restore(): Promise<UserResponse | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const tokens = await apiFetch<TokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })
    setSession(tokens)
    return tokens.user
  } catch {
    clearSession()
    return null
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  clearSession()
  if (!refreshToken) return
  // Idempotente en el backend; si falla la red, la sesion local ya esta cerrada.
  try {
    await apiFetch<void>('/api/v1/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })
  } catch {
    /* sin efecto: el token se revoca solo al caducar */
  }
}
