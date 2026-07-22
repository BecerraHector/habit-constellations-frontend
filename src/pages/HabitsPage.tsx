import { useState, type FormEvent } from 'react'
import { useCreateHabit, useHabits } from '@/api/habits'
import { useSession } from '@/auth/session'
import { HabitCard } from '@/components/HabitCard'
import { Starfield } from '@/components/Starfield'
import { Button, Card, Field } from '@/components/ui'

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
      <Button variant="ghost" className="w-full py-3" onClick={() => setOpen(true)}>
        + Nuevo habito
      </Button>
    )
  }

  return (
    <Card className="p-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Ir al gimnasio"
          autoFocus
          required
        />
        <Field
          label="Descripcion (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creando...' : 'Crear'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function HabitsPage() {
  const { user, signOut } = useSession()
  const { data: habits, isLoading, isError } = useHabits()

  return (
    <div className="min-h-screen">
      <Starfield />
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold">Tu cielo</h1>
          <p className="text-sm text-muted">Hola, {user?.displayName}</p>
        </div>
        <Button variant="ghost" onClick={() => void signOut()}>
          Salir
        </Button>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 pb-16">
        <NewHabitForm />

        {isLoading && <p className="text-muted">Cargando habitos...</p>}
        {isError && <p className="text-danger">No se pudieron cargar tus habitos.</p>}

        {habits && habits.length === 0 && (
          <Card className="p-8 text-center text-muted">
            Aun no hay nada en tu cielo. Crea tu primer habito para encender una estrella.
          </Card>
        )}

        {habits?.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </main>
    </div>
  )
}
