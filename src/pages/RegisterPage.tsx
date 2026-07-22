import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/auth/session'
import { ApiError } from '@/lib/http'
import { Button, Card, ErrorText, Field, Wordmark } from '@/components/ui'
import { Starfield } from '@/components/Starfield'

// La zona horaria del navegador es un buen valor por defecto: el dia corta a
// medianoche del usuario, no del servidor.
const DEFAULT_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

export function RegisterPage() {
  const { signUp } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signUp({ email, password, displayName, zoneId: DEFAULT_ZONE })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <Starfield />
      <Card glow className="rise w-full max-w-sm p-8">
        <Wordmark className="text-center text-[22px] leading-snug" />
        <p className="mt-2 text-center text-sm text-muted">Tu primera estrella empieza aqui.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field
            label="Nombre visible"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            maxLength={60}
            placeholder="Como te veran tus amigos"
            required
          />
          <Field
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            spellCheck={false}
            placeholder="tu@correo.com"
            required
          />
          <Field
            label="Contrasena"
            hint="minimo 10 caracteres"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••••"
            minLength={10}
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full py-3" busy={busy}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted">
          Ya tienes cuenta?{' '}
          <Link
            to="/entrar"
            className="rounded font-medium text-primary-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
