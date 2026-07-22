import { useEffect, useRef, useState } from 'react'
import type { Habit } from '@/api/types'
import { useArchiveHabit, useToggleCompletion } from '@/api/habits'
import { Button, Card, ConfirmButton } from '@/components/ui'

const BAND_W = 320
const BAND_H = 48

/**
 * Banda de constelacion del ciclo actual: cada dia es un punto sobre una curva
 * suave; los cumplidos brillan en oro y quedan conectados por un trazo, como una
 * constelacion dibujandose. La forma es deterministica (depende solo del indice)
 * para que no cambie entre renders.
 *
 * `celebrate` enciende la ceremonia: la estrella recien ganada estalla con dos
 * ondas. Solo se activa cuando el usuario acaba de marcar, no al cargar la lista.
 */
function ConstellationBand({
  filled,
  pending,
  celebrate = false,
}: {
  filled: number
  pending: number
  celebrate?: boolean
}) {
  const total = filled + pending
  if (total === 0) return null

  const pts = Array.from({ length: total }, (_, i) => {
    const x = total === 1 ? BAND_W / 2 : 12 + (i * (BAND_W - 24)) / (total - 1)
    // Curva pseudoaleatoria pero estable: dos senos desfasados.
    const y = BAND_H / 2 + Math.sin(i * 0.9) * 9 + Math.sin(i * 2.3 + 1) * 4
    return { x, y }
  })

  const litPath = pts
    .slice(0, filled)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const newest = filled > 0 ? pts[filled - 1] : null

  return (
    <svg
      viewBox={`0 0 ${BAND_W} ${BAND_H}`}
      className="h-12 w-full max-w-xs"
      aria-label={`${filled} de ${total} estrellas del ciclo`}
    >
      {filled > 1 && (
        <path d={litPath} fill="none" stroke="var(--color-gold)" strokeOpacity="0.35" strokeWidth="1" />
      )}
      {celebrate && newest && (
        <>
          <circle
            cx={newest.x}
            cy={newest.y}
            r="7"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="1"
            className="burst"
          />
          <circle
            cx={newest.x}
            cy={newest.y}
            r="7"
            fill="none"
            stroke="var(--color-gold-soft)"
            strokeWidth="0.6"
            className="burst burst-late"
          />
        </>
      )}
      {pts.map((p, i) => {
        const lit = i < filled
        const last = i === filled - 1
        return (
          <g key={i} className={lit && last && celebrate ? 'ignite' : undefined}>
            {lit && <circle cx={p.x} cy={p.y} r="5.5" fill="var(--color-gold)" fillOpacity="0.18" />}
            <circle
              cx={p.x}
              cy={p.y}
              r={lit ? 2.4 : 1.7}
              fill={lit ? 'var(--color-gold)' : '#43436b'}
              className={lit && last ? 'twinkle' : undefined}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function HabitCard({ habit, index = 0 }: { habit: Habit; index?: number }) {
  const toggle = useToggleCompletion()
  const archive = useArchiveHabit()
  const { progress } = habit
  const done = progress.completedToday
  const streakAlive = progress.currentStreak > 0

  // La ceremonia dura un instante tras marcar; el temporizador la apaga solo.
  const [justLit, setJustLit] = useState(false)
  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (litTimer.current) clearTimeout(litTimer.current)
  }, [])

  function onToggle() {
    const marking = !done
    toggle.mutate(
      { id: habit.id, done: marking },
      {
        onSuccess: () => {
          if (!marking) return
          setJustLit(true)
          if (litTimer.current) clearTimeout(litTimer.current)
          litTimer.current = setTimeout(() => setJustLit(false), 1400)
        },
      },
    )
  }

  return (
    <Card
      glow={done}
      className="rise p-5 transition-colors duration-300 hover:border-border-strong sm:p-6"
      // Entrada escalonada de la lista.
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-ink">{habit.name}</h3>
          {habit.description && (
            <p className="mt-0.5 truncate text-sm text-muted">{habit.description}</p>
          )}
          {progress.completedConstellations > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-xs text-gold-soft">
              ✦ {progress.completedConstellations}{' '}
              {progress.completedConstellations === 1 ? 'constelacion forjada' : 'constelaciones forjadas'}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div
            className={`font-display text-3xl leading-none font-semibold tabular-nums ${
              streakAlive ? 'text-gold-soft [text-shadow:0_0_24px_rgb(255_212_121/0.45)]' : 'text-faint'
            } ${justLit ? 'pop' : ''}`}
          >
            {progress.currentStreak}
          </div>
          <div className="mt-1 text-[11px] tracking-[0.14em] text-faint uppercase">
            {progress.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <ConstellationBand
          filled={progress.starsInCurrentCycle}
          pending={progress.daysToNextConstellation}
          celebrate={justLit}
        />
        <div className="ml-auto flex items-center gap-2">
          <ConfirmButton
            aria-label={`Archivar ${habit.name}`}
            onConfirm={() => archive.mutate(habit.id)}
            busy={archive.isPending}
          >
            Archivar
          </ConfirmButton>
          <Button
            variant={done ? 'ghost' : 'primary'}
            onClick={onToggle}
            busy={toggle.isPending}
            className={done ? 'border-gold/30 text-gold-soft hover:border-gold/50 hover:text-gold-soft' : ''}
          >
            {done ? '✓ Hoy hecho' : 'Marcar hoy'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
