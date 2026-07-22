import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/auth/session'
import { ApiError } from '@/lib/http'
import { Button, Card, ErrorText, Field } from '@/components/ui'
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
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-center text-2xl font-semibold">Forja de Constelaciones</h1>
        <p className="mt-1 text-center text-sm text-muted">Enciende tu cielo, un dia a la vez.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Field
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Aun no tienes cuenta?{' '}
          <Link to="/registro" className="text-primary-strong hover:underline">
            Crear una
          </Link>
        </p>
      </Card>
    </div>
  )
}
