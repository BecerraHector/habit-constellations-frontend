import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserResponse } from '@/api/types'
import * as auth from '@/api/auth'
import type { RegisterInput } from '@/api/auth'

type Status = 'loading' | 'authenticated' | 'anonymous'

interface Session {
  status: Status
  user: UserResponse | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  // Al arrancar, intenta recuperar la sesion con el refresh guardado.
  useEffect(() => {
    let alive = true
    auth.restore().then((restored) => {
      if (!alive) return
      setUser(restored)
      setStatus(restored ? 'authenticated' : 'anonymous')
    })
    return () => {
      alive = false
    }
  }, [])

  async function signIn(email: string, password: string) {
    const signed = await auth.login(email, password)
    setUser(signed)
    setStatus('authenticated')
  }

  async function signUp(input: RegisterInput) {
    await auth.register(input)
    await signIn(input.email, input.password)
  }

  async function signOut() {
    await auth.logout()
    setUser(null)
    setStatus('anonymous')
  }

  return (
    <SessionContext value={{ status, user, signIn, signUp, signOut }}>{children}</SessionContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession fuera de SessionProvider')
  return ctx
}
