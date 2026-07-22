import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/auth/session'
import { Starfield } from '@/components/Starfield'

/** Puerta de las rutas privadas. Mientras se recupera la sesion, no decide nada. */
export function RequireAuth() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Starfield />
        <p className="font-display animate-pulse text-sm text-muted">Encendiendo el cielo...</p>
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/entrar" replace />
  }

  return <Outlet />
}
