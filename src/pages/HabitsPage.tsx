import { useState, type FormEvent } from 'react'
import { useCreateHabit, useHabits } from '@/api/habits'
import { useSession } from '@/auth/session'
import { HabitCard } from '@/components/HabitCard'
import { Button, Card, Field } from '@/components/ui'

// "lunes, 21 de julio" — el dia del usuario, que corta a SU medianoche. Sin el
// timeZone, un navegador en otra zona mostraria una fecha que el backend aun no
// (o ya no) considera "hoy".
function todayFor(zoneId: string | undefined) {
  return new Date().toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zoneId,
  })
}

function NewHabitForm() {
  const create = useCreateHabit()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [open, setOpen] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await create.mutateAsync({ name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-3.5 text-sm text-muted transition duration-200 outline-none hover:border-border-strong hover:bg-white/[0.03] hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/70"
      >
        + Nueva estrella que encender
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
          placeholder="Ir al gimnasio"
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
          placeholder="30 minutos bastan"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" busy={create.isPending}>
            Crear habito
          </Button>
        </div>
      </form>
    </Card>
  )
}

/** Resumen del dia: cuantas estrellas van encendidas hoy, antes del detalle. */
function DaySummary({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  const complete = done === total
  return (
    <Card className="rise flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">
          <span className={`font-semibold tabular-nums ${complete ? 'text-gold-soft' : 'text-ink'}`}>
            {done} de {total}
          </span>{' '}
          {total === 1 ? 'estrella encendida' : 'estrellas encendidas'} hoy
          {complete && ' — cielo pleno ✦'}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              complete
                ? 'bg-[linear-gradient(90deg,var(--color-gold),var(--color-gold-soft))]'
                : 'bg-[linear-gradient(90deg,var(--color-indigo-deep),var(--color-violet-hot))]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export function HabitsPage() {
  const { user } = useSession()
  const { data: habits, isLoading, isError } = useHabits()

  const doneToday = habits?.filter((h) => h.progress.completedToday).length ?? 0

  return (
    <>
      <header className="mx-auto max-w-2xl px-4 pt-6 pb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Tu cielo</h1>
        <p className="mt-1 text-sm text-muted">
          Hola, <span className="text-ink">{user?.displayName}</span>
          <span className="text-faint"> · {todayFor(user?.zoneId)}</span>
        </p>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-20">
        {habits && <DaySummary done={doneToday} total={habits.length} />}

        <NewHabitForm />

        {isLoading && (
          <p className="animate-pulse py-8 text-center text-muted">Encendiendo el cielo…</p>
        )}
        {isError && (
          <Card className="p-5 text-center text-danger">No se pudieron cargar tus habitos.</Card>
        )}

        {habits && habits.length === 0 && (
          <Card className="rise px-8 py-12 text-center">
            <p className="font-display text-lg text-ink">Tu cielo esta despejado</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
              Crea tu primer habito y cada dia cumplido encendera una estrella. A los 30, una
              constelacion.
            </p>
          </Card>
        )}

        {habits?.map((habit, i) => (
          <HabitCard key={habit.id} habit={habit} index={i + 1} />
        ))}
      </main>
    </>
  )
}
