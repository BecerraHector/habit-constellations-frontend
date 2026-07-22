import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Habit } from '@/api/types'
import { useArchiveHabit, useHabit, useHabitHistory, useToggleCompletion, useUpdateHabit } from '@/api/habits'
import { Button, Card, ConfirmButton, Field } from '@/components/ui'

/** Fecha local del navegador en ISO; el backend revalida contra la zona del usuario. */
function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/**
 * Una casilla del calendario. Solo hoy y ayer se pueden encender o apagar: es la
 * misma ventana que el backend admite, y aqui se refleja para que el resto de dias
 * no parezcan botones rotos.
 */
function DayCell({
  dayNum,
  done,
  today,
  future,
  editable,
  busy,
  label,
  onToggle,
}: {
  dayNum: number
  done: boolean
  today: boolean
  future: boolean
  editable: boolean
  busy: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      disabled={!editable || busy}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={editable ? done : undefined}
      className={`flex flex-col items-center gap-1 rounded-xl py-1.5 outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-primary/70 ${
        editable ? 'hover:bg-white/[0.06]' : 'cursor-default'
      } ${future ? 'invisible' : ''}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5">
        {done && <circle cx="10" cy="10" r="7" fill="var(--color-gold)" opacity="0.18" />}
        <circle
          cx="10"
          cy="10"
          r={done ? 3.2 : 2}
          fill={done ? 'var(--color-gold)' : editable ? '#55558a' : '#33334f'}
          className={done && today ? 'twinkle' : undefined}
        />
      </svg>
      <span
        className={`text-[10px] tabular-nums ${
          today ? 'font-semibold text-ink' : done ? 'text-muted' : 'text-faint'
        }`}
      >
        {dayNum}
      </span>
    </button>
  )
}

/**
 * El calendario del habito: cada mes es una ventana del historial. Hoy y ayer son
 * interactivos (la ventana de repaso del backend); el pasado es solo memoria.
 */
function HistoryCalendar({ habit }: { habit: Habit }) {
  const now = new Date()
  const todayIso = iso(now)
  const yesterdayIso = iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const first = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const from = iso(first)
  const to = iso(new Date(view.year, view.month, daysInMonth))

  const history = useHabitHistory(habit.id, from, to)
  const toggle = useToggleCompletion()
  const done = new Set(history.data?.dates ?? [])

  // La semana empieza en lunes; getDay() da 0 para el domingo.
  const leading = (first.getDay() + 6) % 7
  const atCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth()

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  return (
    <Card className="rise p-5 sm:p-6" style={{ animationDelay: '80ms' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium tracking-[0.14em] text-faint uppercase">Historia</h2>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => shift(-1)}
            aria-label="Mes anterior"
            className="rounded-lg px-2 py-1 text-muted outline-none transition duration-200 hover:bg-white/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            ‹
          </button>
          <span className="min-w-32 text-center text-ink">
            {MONTHS[view.month]} {view.year}
          </span>
          <button
            onClick={() => shift(1)}
            disabled={atCurrentMonth}
            aria-label="Mes siguiente"
            className="rounded-lg px-2 py-1 text-muted outline-none transition duration-200 hover:bg-white/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/70 disabled:invisible"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-center text-[10px] tracking-[0.14em] text-faint">
            {d}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dateIso = iso(new Date(view.year, view.month, i + 1))
          const isDone = done.has(dateIso)
          const editable =
            !habit.archived && (dateIso === todayIso || dateIso === yesterdayIso)
          return (
            <DayCell
              key={dateIso}
              dayNum={i + 1}
              done={isDone}
              today={dateIso === todayIso}
              future={dateIso > todayIso}
              editable={editable}
              busy={toggle.isPending}
              label={`${i + 1} de ${MONTHS[view.month]}: ${isDone ? 'cumplido' : 'sin cumplir'}`}
              onToggle={() => toggle.mutate({ id: habit.id, done: !isDone, date: dateIso })}
            />
          )
        })}
      </div>

      {!habit.archived && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-faint">
          Puedes encender o apagar hoy y ayer; el resto es historia escrita.
        </p>
      )}
    </Card>
  )
}

function Stat({ value, label, gold = false }: { value: number; label: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`font-display text-xl font-semibold tabular-nums ${
          gold ? 'text-gold-soft [text-shadow:0_0_20px_rgb(255_212_121/0.4)]' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] tracking-[0.14em] text-faint uppercase">{label}</div>
    </div>
  )
}

function EditForm({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const update = useUpdateHabit()
  const [name, setName] = useState(habit.name)
  const [description, setDescription] = useState(habit.description ?? '')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await update.mutateAsync({ id: habit.id, name: name.trim(), description: description.trim() })
    onClose()
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 max-w-md space-y-3">
      <Field
        label="Nombre"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
        maxLength={80}
        autoFocus
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
      />
      <div className="flex gap-2">
        <Button type="submit" busy={update.isPending}>
          Guardar
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const habitQ = useHabit(id!)
  const archive = useArchiveHabit()
  const [editing, setEditing] = useState(false)

  if (habitQ.isLoading) {
    return <p className="animate-pulse py-16 text-center text-muted">Enfocando la estrella…</p>
  }
  if (habitQ.isError || !habitQ.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted">Este habito no existe o se perdio de vista.</p>
        <Link to="/" className="mt-2 inline-block text-sm text-primary-strong hover:underline">
          Volver a tu cielo
        </Link>
      </div>
    )
  }

  const habit = habitQ.data
  const { progress } = habit

  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <Link to="/" className="text-xs text-faint transition-colors hover:text-muted">
          ← Tu cielo
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {habit.name}
              {habit.archived && (
                <span className="ml-2 align-middle rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs font-normal text-faint">
                  archivado
                </span>
              )}
            </h1>
            {editing ? (
              <EditForm habit={habit} onClose={() => setEditing(false)} />
            ) : (
              habit.description && <p className="mt-1 text-sm text-muted">{habit.description}</p>
            )}
          </div>
          {!editing && !habit.archived && (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <ConfirmButton
                confirmLabel="Archivar"
                onConfirm={() => archive.mutate(habit.id, { onSuccess: () => void navigate('/') })}
                busy={archive.isPending}
              >
                Archivar
              </ConfirmButton>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-20">
        <Card className="rise p-5 sm:p-6">
          <div className="grid grid-cols-4 gap-3">
            <Stat
              value={progress.currentStreak}
              label="racha actual"
              gold={progress.currentStreak > 0}
            />
            <Stat value={progress.longestStreak} label="mejor racha" />
            <Stat value={progress.totalCompletions} label="estrellas" />
            <Stat value={progress.completedConstellations} label="constelaciones" />
          </div>
        </Card>

        <HistoryCalendar habit={habit} />
      </main>
    </>
  )
}
