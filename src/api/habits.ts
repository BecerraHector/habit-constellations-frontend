import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Habit } from '@/api/types'
import { apiFetch } from '@/lib/http'

const KEY = ['habits'] as const

export function useHabits() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Habit[]>('/api/v1/habits'),
  })
}

export function useCreateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      apiFetch<Habit>('/api/v1/habits', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Marcar y desmarcar devuelven el habito con su progreso recalculado (racha incluida),
// asi que basta con invalidar para que la lista lo repinte.
export function useToggleCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      apiFetch<Habit>(`/api/v1/habits/${id}/completions`, {
        method: done ? 'POST' : 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useArchiveHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/v1/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
