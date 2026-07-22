import { NavLink, Outlet } from 'react-router-dom'
import { useSession } from '@/auth/session'
import { Starfield } from '@/components/Starfield'
import { Button } from '@/components/ui'

const LINKS = [
  { to: '/', label: 'Tu cielo' },
  { to: '/galaxias', label: 'Galaxias' },
]

/** Marco comun de las vistas privadas: cielo de fondo, navegacion y salir. */
export function AppLayout() {
  const { signOut } = useSession()

  return (
    <div className="min-h-screen">
      <Starfield />

      <header className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-6 pb-2">
        <nav className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 backdrop-blur-xl">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,var(--color-indigo-deep),var(--color-violet-hot))] font-medium text-white shadow-[0_2px_16px_-4px_rgb(139_125_255/0.6)]'
                    : 'text-muted hover:text-ink'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" onClick={() => void signOut()}>
          Salir
        </Button>
      </header>

      <Outlet />
    </div>
  )
}
