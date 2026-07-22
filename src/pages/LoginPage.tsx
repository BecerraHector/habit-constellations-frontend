import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/auth/session'
import { ApiError } from '@/lib/http'
import { Button, Card, ErrorText, Field, Wordmark } from '@/components/ui'
import { Starfield } from '@/components/Starfield'

export function LoginPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      // El backend no distingue email inexistente de clave mala, a proposito.
      setError(err instanceof ApiError ? 'Email o contrasena incorrectos' : 'No se pudo conectar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Starfield />
      <Card glow className="rise w-full max-w-sm p-8">
        <Wordmark className="text-center text-[22px] leading-snug" />
        <p className="mt-2 text-center text-sm text-muted">Enciende tu cielo, un dia a la vez.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••••"
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full py-3" busy={busy}>
            Entrar
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted">
          Aun no tienes cuenta?{' '}
          <Link
            to="/registro"
            className="rounded font-medium text-primary-strong outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            Crear una
          </Link>
        </p>
      </Card>
    </div>
  )
}
