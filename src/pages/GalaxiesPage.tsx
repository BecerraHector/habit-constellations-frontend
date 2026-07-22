import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Galaxy } from '@/api/types'
import { useHabits } from '@/api/habits'
import {
  useCatalog,
  useCreateGalaxy,
  useDiscover,
  useJoinGalaxy,
  useMyGalaxies,
} from '@/api/galaxies'
import { Button, Card, Field } from '@/components/ui'

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long' })
}

/**
 * Al unirse (o crear) se enlaza un habito propio: un unico registro alimenta la
 * racha personal y el brillo del grupo. Este selector ofrece los habitos activos
 * o dejar que el backend cree uno nuevo con el nombre de la galaxia.
 */
function HabitPicker({
  value,
  onChange,
  newLabel,
}: {
  value: string
  onChange: (v: string) => void
  newLabel: string
}) {
  const { data: habits } = useHabits()
  const active = habits?.filter((h) => !h.archived) ?? []

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-[0.12em] text-muted uppercase">
        Habito que lo sostiene
      </span>
      {/* Fondo solido a proposito: un select nativo con fondo translucido pinta el
          desplegable blanco en el modo oscuro de Windows. */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-border bg-[#0a0a18] px-3.5 py-2.5 text-ink transition duration-200 outline-none hover:border-border-strong focus:border-primary/70 focus:shadow-[0_0_0_3px_rgb(139_125_255/0.15)]"
      >
        <option value="">{newLabel}</option>
        {active.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function GalaxyCard({ galaxy, index }: { galaxy: Galaxy; index: number }) {
  const join = useJoinGalaxy()
  const [joining, setJoining] = useState(false)
  const [habitId, setHabitId] = useState('')

  // Una galaxia sin habitantes es una reliquia: sigue ahi, a oscuras, y quien la
  // descubra puede revivirla heredando su historia. El pasado nunca se borra.
  const relic = !galaxy.member && galaxy.activeMembers === 0

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`truncate text-lg font-semibold ${relic ? 'text-muted' : 'text-ink'}`}>
            {galaxy.name}
          </h3>
          {galaxy.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">{galaxy.description}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          {relic && (
            <span className="rounded-full border border-border bg-white/[0.02] px-2.5 py-0.5 text-xs text-faint">
              a oscuras
            </span>
          )}
          <span className="rounded-full border border-border bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted">
            {galaxy.theme}
          </span>
        </span>
      </div>
      <p className="mt-3 text-xs text-faint">
        {relic
          ? 'Nadie la habita ya. Unete y vuelve a encenderla: su historia sigue aqui.'
          : `${galaxy.activeMembers} ${galaxy.activeMembers === 1 ? 'habitante' : 'habitantes'}`}
        {galaxy.member && galaxy.joinedOn && (
          <span className="text-gold-soft"> · dentro desde el {shortDate(galaxy.joinedOn)}</span>
        )}
      </p>
    </>
  )

  if (galaxy.member) {
    return (
      <Link
        to={`/galaxias/${galaxy.id}`}
        className="rise block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      >
        <Card className="p-5 transition-colors duration-300 hover:border-border-strong">{inner}</Card>
      </Link>
    )
  }

  return (
    <Card
      className="rise p-5 transition-colors duration-300 hover:border-border-strong"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {inner}
      {joining ? (
        <div className="mt-4 space-y-3">
          <HabitPicker value={habitId} onChange={setHabitId} newLabel="Una estrella nueva" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setJoining(false)}>
              Cancelar
            </Button>
            <Button
              busy={join.isPending}
              onClick={() => join.mutate({ id: galaxy.id, habitId: habitId || null })}
            >
              Unirme
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setJoining(true)}>
            Unirme
          </Button>
        </div>
      )}
    </Card>
  )
}

function NewGalaxyForm() {
  const create = useCreateGalaxy()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('')
  const [description, setDescription] = useState('')
  const [habitId, setHabitId] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !theme.trim()) return
    await create.mutateAsync({
      name: name.trim(),
      theme: theme.trim().toLowerCase(),
      description: description.trim(),
      habitId: habitId || null,
    })
    setName('')
    setTheme('')
    setDescription('')
    setHabitId('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-3.5 text-sm text-muted transition duration-200 outline-none hover:border-border-strong hover:bg-white/[0.03] hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/70"
      >
        + Forjar una galaxia nueva
      </button>
    )
  }

  return (
    <Card className="rise p-5 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Nombre"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          maxLength={80}
          placeholder="Madrugadores"
          autoFocus
          required
        />
        <Field
          label="Tema"
          hint="una palabra: deporte, lectura…"
          name="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          maxLength={32}
          placeholder="deporte"
          required
        />
        <Field
          label="Descripcion"
          hint="opcional"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="off"
          maxLength={280}
          placeholder="Levantarse antes de las 7"
        />
        <HabitPicker value={habitId} onChange={setHabitId} newLabel="Una estrella nueva con el nombre de la galaxia" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" busy={create.isPending}>
            Forjar galaxia
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function GalaxiesPage() {
  // El filtro vive en la URL: un enlace a /galaxias?tema=lectura llega filtrado.
  const [params, setParams] = useSearchParams()
  const theme = params.get('tema')
  const setTheme = (t: string | null) =>
    setParams(t ? { tema: t } : {}, { replace: true })
  const mine = useMyGalaxies()
  const catalog = useCatalog()
  const discover = useDiscover(theme)

  // Las que ya habito no se repiten en descubrir.
  const discovered = discover.data?.filter((g) => !g.member) ?? []

  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Galaxias</h1>
        <p className="mt-1 text-sm text-muted">
          Cielos compartidos: cada dia brilla segun cuanta gente cumplio.
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 pb-20">
        <section className="space-y-4">
          {mine.isLoading && <p className="animate-pulse text-center text-muted">Buscando tus galaxias…</p>}
          {mine.data && mine.data.length > 0 && (
            <>
              <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Tus galaxias</h2>
              {mine.data.map((g, i) => (
                <GalaxyCard key={g.id} galaxy={g} index={i} />
              ))}
            </>
          )}
          <NewGalaxyForm />
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Descubrir</h2>

          {catalog.data && catalog.data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTheme(null)}
                className={`rounded-full border px-3 py-1 text-xs transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                  theme === null
                    ? 'border-primary/60 bg-primary/15 text-primary-strong'
                    : 'border-border text-muted hover:border-border-strong hover:text-ink'
                }`}
              >
                todas
              </button>
              {catalog.data.map((t) => (
                <button
                  key={t.theme}
                  onClick={() => setTheme(t.theme)}
                  className={`rounded-full border px-3 py-1 text-xs transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                    theme === t.theme
                      ? 'border-primary/60 bg-primary/15 text-primary-strong'
                      : 'border-border text-muted hover:border-border-strong hover:text-ink'
                  }`}
                >
                  {t.theme} <span className="text-faint">· {t.members}</span>
                </button>
              ))}
            </div>
          )}

          {discover.isLoading && <p className="animate-pulse text-center text-muted">Explorando el cielo…</p>}
          {discover.data && discovered.length === 0 && (
            <Card className="px-6 py-8 text-center text-sm text-muted">
              Nada nuevo que descubrir por aqui{theme ? ` en «${theme}»` : ''}. Forja tu la primera.
            </Card>
          )}
          {discovered.map((g, i) => (
            <GalaxyCard key={g.id} galaxy={g} index={i} />
          ))}
        </section>
      </main>
    </>
  )
}
