import type { TokenResponse, UserResponse } from '@/api/types'
import { ApiError, apiFetch } from '@/lib/http'
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

// Un unico restore en vuelo. Sin esto, el doble montaje de StrictMode dispara dos
// refrescos con el mismo token: el segundo llega ya rotado y el backend lo trata
// como reutilizacion robada, cerrando todas las sesiones del usuario.
let restoring: Promise<UserResponse | null> | null = null

/** Recupera la sesion tras recargar, usando el refresh guardado. null si no hay o caduco. */
export function restore(): Promise<UserResponse | null> {
  if (restoring) return restoring
  restoring = doRestore().finally(() => {
    restoring = null
  })
  return restoring
}

async function doRestore(): Promise<UserResponse | null> {
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
  } catch (err) {
    // Solo un rechazo del backend invalida la sesion; un fallo de red no la borra.
    if (err instanceof ApiError) clearSession()
    return null
  }
}

/** Revoca todas las sesiones del usuario, esta incluida. */
export async function logoutEverywhere(): Promise<void> {
  await apiFetch<void>('/api/v1/auth/logout-all', { method: 'POST' })
  clearSession()
}

/**
 * Da de baja la cuenta. Exige la contrasena: un token robado no basta.
 * Lanza ApiError si no coincide; si va bien, la sesion local queda cerrada.
 */
export async function deleteAccount(password: string): Promise<void> {
  await apiFetch<void>('/api/v1/auth/me', { method: 'DELETE', body: { password } })
  clearSession()
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
