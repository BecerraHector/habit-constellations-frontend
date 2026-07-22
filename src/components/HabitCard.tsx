import type { Habit } from '@/api/types'
import { useArchiveHabit, useToggleCompletion } from '@/api/habits'
import { Button, Card } from '@/components/ui'

// Estrellas del ciclo actual hacia la proxima constelacion. Las cumplidas brillan;
// las que faltan quedan apagadas. El total es lo que el backend ya calcula.
function CycleStars({ filled, pending }: { filled: number; pending: number }) {
  const total = filled + pending
  if (total === 0) return null
  return (
    <div className="flex flex-wrap gap-1" aria-label={`${filled} de ${total} estrellas`}>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${i < filled ? 'twinkle' : ''}`}
          fill={i < filled ? 'var(--lum-4)' : 'var(--lum-0)'}
        >
          <path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 16.9 6.3 20.3l1.7-6.6L2.8 9.3l6.8-.5z" />
        </svg>
      ))}
    </div>
  )
}

export function HabitCard({ habit }: { habit: Habit }) {
  const toggle = useToggleCompletion()
  const archive = useArchiveHabit()
  const { progress } = habit
  const done = progress.completedToday

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-medium text-ink">{habit.name}</h3>
          {habit.description && (
            <p className="mt-0.5 truncate text-sm text-muted">{habit.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-primary-strong">
            {progress.currentStreak}
          </div>
          <div className="text-xs text-faint">
            {progress.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <CycleStars filled={progress.starsInCurrentCycle} pending={progress.daysToNextConstellation} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => archive.mutate(habit.id)}
            disabled={archive.isPending}
            aria-label={`Archivar ${habit.name}`}
          >
            Archivar
          </Button>
          <Button
            variant={done ? 'ghost' : 'primary'}
            onClick={() => toggle.mutate({ id: habit.id, done: !done })}
            disabled={toggle.isPending}
          >
            {done ? '✓ Hoy hecho' : 'Marcar hoy'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
