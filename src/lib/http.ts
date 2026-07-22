import type { TokenResponse } from '@/api/types'
import { clearSession, getAccessToken, getRefreshToken, setSession } from '@/lib/tokens'

// Vacio en desarrollo: las peticiones salen a /api y vite las lleva al backend.
// En produccion, VITE_API_URL apunta al backend real.
const BASE = import.meta.env.VITE_API_URL ?? ''

/** Error con el codigo HTTP y el mensaje que el backend pone en ProblemDetail.detail. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface Options {
  method?: string
  body?: unknown
  // Los endpoints de auth publicos (login, register, refresh) no llevan token ni
  // deben disparar el reintento de refresco: un 401 ahi es la respuesta, no un token
  // caducado.
  auth?: boolean
}

// Un unico refresco en vuelo: si varias peticiones reciben 401 a la vez, comparten
// la misma promesa en lugar de rotar el refresh token varias veces (lo que cerraria
// la sesion por "reutilizacion").
let refreshing: Promise<string | null> | null = null

async function refreshAccess(): Promise<string | null> {
  if (refreshing) return refreshing
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        clearSession()
        return null
      }
      const tokens = (await res.json()) as TokenResponse
      setSession(tokens)
      return tokens.accessToken
    } catch {
      // Fallo de red: no borramos la sesion, puede recuperarse al reintentar.
      return null
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

async function send(path: string, options: Options, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  return fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const detail = data?.detail ?? data?.title ?? `Error ${res.status}`
    throw new ApiError(res.status, detail)
  }
  return data as T
}

/**
 * Cliente HTTP. Adjunta el token, y ante un 401 en un endpoint autenticado intenta
 * refrescar una sola vez y reintentar. Si el refresco no da token, propaga el 401
 * para que la sesion se cierre arriba.
 */
export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const authenticated = options.auth ?? true

  let res = await send(path, options, authenticated ? getAccessToken() : null)

  if (res.status === 401 && authenticated) {
    const fresh = await refreshAccess()
    if (fresh) {
      res = await send(path, options, fresh)
    }
  }

  return parse<T>(res)
}
