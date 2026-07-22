import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { GalaxyDay } from '@/api/types'
import { useGalaxyDay, useGalaxyDetail, useGalaxyMembers, useLeaveGalaxy } from '@/api/galaxies'
import { Card, ConfirmButton } from '@/components/ui'

const LUM = ['var(--lum-0)', 'var(--lum-1)', 'var(--lum-2)', 'var(--lum-3)', 'var(--lum-4)']

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Una estrella del mapa. El nivel se lee por color (rampa --lum), pero tambien por
 * tamano y halo: el brillo nunca depende solo del tono. La apagada sigue ahi,
 * pequena — la estrella se apaga, nunca desaparece.
 */
function DayStar({ day, selected, onSelect }: { day: GalaxyDay; selected: boolean; onSelect: () => void }) {
  const r = 3 + day.level * 1.1
  const dayNum = Number(day.date.slice(8, 10))

  return (
    <button
      onClick={onSelect}
      aria-label={`${longDate(day.date)}: ${day.completions} de ${day.activeMembers}`}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-all duration-200 outline-none hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-primary/70 ${
        selected ? 'bg-white/[0.07]' : ''
      }`}
    >
      <svg viewBox="0 0 28 28" className="h-7 w-7">
        {day.level >= 3 && (
          <circle cx="14" cy="14" r={r * 2.1} fill={LUM[day.level]} opacity="0.22" />
        )}
        <circle
          cx="14"
          cy="14"
          r={r}
          fill={LUM[day.level]}
          className={day.level === 4 ? 'twinkle' : undefined}
        />
      </svg>
      <span className={`text-[10px] tabular-nums ${selected ? 'text-ink' : 'text-faint'}`}>{dayNum}</span>
    </button>
  )
}

/** El desglose lista quienes cumplieron, nunca los ausentes. */
function DayBreakdown({ galaxyId, date }: { galaxyId: string; date: string }) {
  const { data, isLoading } = useGalaxyDay(galaxyId, date)

  if (isLoading) return <p className="animate-pulse py-2 text-sm text-muted">Mirando ese dia...</p>
  if (!data) return null

  const full = data.activeMembers > 0 && data.completions === data.activeMembers

  return (
    <div className="rise border-t border-border pt-4">
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">{longDate(data.date)}</span> ·{' '}
        <span className={`font-semibold tabular-nums ${full ? 'text-gold-soft' : 'text-ink'}`}>
          {data.completions} de {data.activeMembers}
        </span>{' '}
        {data.completions === 1 ? 'cumplio' : 'cumplieron'}
        {full && ' — pleno ✦'}
      </p>
      {data.completedBy.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.completedBy.map((name) => (
            <li
              key={name}
              className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-0.5 text-xs text-gold-soft"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-semibold text-ink tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] tracking-[0.14em] text-faint uppercase">{label}</div>
    </div>
  )
}

export function GalaxyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const detail = useGalaxyDetail(id!)
  const members = useGalaxyMembers(id!)
  const leave = useLeaveGalaxy()
  const [selected, setSelected] = useState<string | null>(null)

  if (detail.isLoading) {
    return <p className="animate-pulse py-16 text-center text-muted">Enfocando la galaxia...</p>
  }
  if (detail.isError || !detail.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Esta galaxia no existe o se perdio de vista.</p>
        <Link to="/galaxias" className="mt-2 inline-block text-sm text-primary-strong hover:underline">
          Volver a galaxias
        </Link>
      </div>
    )
  }

  const { galaxy, map } = detail.data

  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <Link to="/galaxias" className="text-xs text-faint transition-colors hover:text-muted">
          ← Galaxias
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink">{galaxy.name}</h1>
            {galaxy.description && <p className="mt-1 text-sm text-muted">{galaxy.description}</p>}
            <p className="mt-2 text-xs text-faint">
              <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5">{galaxy.theme}</span>
              <span className="ml-2">
                {galaxy.activeMembers} {galaxy.activeMembers === 1 ? 'habitante' : 'habitantes'}
              </span>
            </p>
          </div>
          {galaxy.member && (
            <ConfirmButton
              confirmLabel="Abandonar"
              onConfirm={() => leave.mutate(galaxy.id, { onSuccess: () => void navigate('/galaxias') })}
              busy={leave.isPending}
            >
              Salir de aqui
            </ConfirmButton>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-20">
        <Card className="rise p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">
              Mapa de brillo ·{' '}
              {map.days.length === 1 ? 'primer dia' : `ultimos ${map.days.length} dias`}
            </h2>
          </div>

          {/* El brillo es proporcional a cuanta gente cumplio; el pleno (nivel 4) parpadea. */}
          <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
            {map.days.map((day) => (
              <DayStar
                key={day.date}
                day={day}
                selected={selected === day.date}
                onSelect={() => setSelected(selected === day.date ? null : day.date)}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Stat value={String(map.perfectDays)} label={map.perfectDays === 1 ? 'dia pleno' : 'dias plenos'} />
            <Stat value={String(map.totalStars)} label="cumplimientos" />
            <Stat value={`${Math.round(map.averageRatio * 100)}%`} label="brillo medio" />
          </div>

          {selected && <div className="mt-4">{id && <DayBreakdown galaxyId={id} date={selected} />}</div>}
        </Card>

        <Card className="rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
          <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Habitantes</h2>
          {members.isLoading && <p className="mt-3 animate-pulse text-sm text-muted">Contando estrellas...</p>}
          {members.data && (
            <>
              <ul className="mt-3 flex flex-wrap gap-2">
                {members.data.content.map((m) => (
                  <li
                    key={m.userId}
                    className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-sm text-muted"
                  >
                    {m.displayName}
                  </li>
                ))}
              </ul>
              {members.data.hasNext && (
                <p className="mt-3 text-xs text-faint">
                  y {members.data.totalElements - members.data.content.length} mas
                </p>
              )}
            </>
          )}
        </Card>
      </main>
    </>
  )
}
