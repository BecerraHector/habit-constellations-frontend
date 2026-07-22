import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, logoutEverywhere } from '@/api/auth'
import { useSession } from '@/auth/session'
import { ApiError } from '@/lib/http'
import { Button, Card, ErrorText, Field } from '@/components/ui'

function ProfileCard() {
  const { user } = useSession()
  if (!user) return null

  const rows = [
    ['Nombre visible', user.displayName],
    ['Email', user.email],
    ['Zona horaria', user.zoneId],
  ] as const

  return (
    <Card className="rise p-5 sm:p-6">
      <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Tu cuenta</h2>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="truncate text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-xs text-faint">
        El dia corta a tu medianoche, la de «{user.zoneId}», no a la del servidor.
      </p>
    </Card>
  )
}

/** Revoca todas las sesiones (esta incluida) y vuelve al login. */
function SessionsCard() {
  const { endSession } = useSession()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onLogoutAll() {
    setBusy(true)
    setError(null)
    try {
      await logoutEverywhere()
      endSession()
      navigate('/entrar', { replace: true })
    } catch {
      setError('No se pudo cerrar las sesiones. Intentalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    <Card className="rise p-5 sm:p-6" style={{ animationDelay: '60ms' }}>
      <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Sesiones</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-sm text-muted">
          Si perdiste un movil o sospechas de un acceso ajeno, esto revoca todas tus
          sesiones, esta incluida.
        </p>
        <Button variant="ghost" busy={busy} onClick={() => void onLogoutAll()}>
          Cerrar sesion en todos los dispositivos
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </Card>
  )
}

/**
 * La baja es irreversible y exige la contrasena. El texto cuenta la verdad del
 * dominio: lo privado se borra; lo aportado a una galaxia queda como recuento
 * anonimo para no repintar el pasado de otras personas.
 */
function DangerCard() {
  const { endSession } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onDelete(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await deleteAccount(password)
      endSession()
      navigate('/entrar', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'La contrasena no es correcta.'
          : 'No se pudo completar la baja. Intentalo de nuevo.',
      )
      setBusy(false)
    }
  }

  return (
    <Card className="rise border-danger/25 p-5 sm:p-6" style={{ animationDelay: '120ms' }}>
      <h2 className="text-xs font-medium tracking-[0.14em] text-danger/80 uppercase">
        Zona de peligro
      </h2>
      <p className="mt-3 max-w-lg text-sm text-muted">
        Darte de baja borra tus habitos privados con todo su historial. Lo que aportaste a
        una galaxia se conserva como recuento anonimo — el cielo de los demas no se
        reescribe — pero deja de llevar tu nombre. No hay vuelta atras.
      </p>

      {open ? (
        <form onSubmit={onDelete} className="mt-4 space-y-3">
          <Field
            label="Confirma tu contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setPassword('')
                setError(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="danger" busy={busy} disabled={!password}>
              Apagar mi cielo para siempre
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button variant="danger" onClick={() => setOpen(true)}>
            Darme de baja
          </Button>
        </div>
      )}
    </Card>
  )
}

export function SettingsPage() {
  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Ajustes</h1>
        <p className="mt-1 text-sm text-muted">Tu cuenta, tus sesiones y la puerta de salida.</p>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-20">
        <ProfileCard />
        <SessionsCard />
        <DangerCard />
      </main>
    </>
  )
}
