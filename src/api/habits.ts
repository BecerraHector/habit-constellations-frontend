import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Habit, HabitHistory } from '@/api/types'
import { apiFetch } from '@/lib/http'

const KEY = ['habits'] as const

export function useHabits() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Habit[]>('/api/v1/habits'),
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => apiFetch<Habit>(`/api/v1/habits/${id}`),
  })
}

/** Fechas cumplidas dentro de una ventana; el backend la recorta si hace falta. */
export function useHabitHistory(id: string, from: string, to: string) {
  return useQuery({
    queryKey: [...KEY, id, 'logs', from, to],
    queryFn: () => apiFetch<HabitHistory>(`/api/v1/habits/${id}/logs?from=${from}&to=${to}`),
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

export function useUpdateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description: string }) =>
      apiFetch<Habit>(`/api/v1/habits/${id}`, { method: 'PUT', body: { name, description } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

// Marcar y desmarcar devuelven el habito con su progreso recalculado (racha incluida),
// asi que basta con invalidar para que la lista lo repinte. `date` permite el repaso
// de ayer, la unica fecha pasada que la ventana del backend admite.
export function useToggleCompletion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, done, date }: { id: string; done: boolean; date?: string }) =>
      apiFetch<Habit>(`/api/v1/habits/${id}/completions`, {
        method: done ? 'POST' : 'DELETE',
        body: date ? { date } : undefined,
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
