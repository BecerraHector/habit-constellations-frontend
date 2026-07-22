import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Galaxy,
  GalaxyDayDetail,
  GalaxyDetail,
  GalaxyMember,
  PageResponse,
  ThemeCount,
} from '@/api/types'
import { apiFetch } from '@/lib/http'

const KEY = ['galaxies'] as const

export function useMyGalaxies() {
  return useQuery({
    queryKey: [...KEY, 'mine'],
    queryFn: () => apiFetch<Galaxy[]>('/api/v1/galaxies'),
  })
}

export function useCatalog() {
  return useQuery({
    queryKey: [...KEY, 'catalog'],
    queryFn: () => apiFetch<ThemeCount[]>('/api/v1/galaxies/catalog'),
  })
}

/** Galaxias abiertas a descubrir; `theme` acota, vacio trae las mas vivas. */
export function useDiscover(theme: string | null) {
  return useQuery({
    queryKey: [...KEY, 'discover', theme],
    queryFn: () =>
      apiFetch<Galaxy[]>(
        theme
          ? `/api/v1/galaxies/discover?theme=${encodeURIComponent(theme)}`
          : '/api/v1/galaxies/discover',
      ),
  })
}

export function useGalaxyDetail(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => apiFetch<GalaxyDetail>(`/api/v1/galaxies/${id}`),
  })
}

export function useGalaxyMembers(id: string) {
  return useQuery({
    queryKey: [...KEY, id, 'members'],
    queryFn: () => apiFetch<PageResponse<GalaxyMember>>(`/api/v1/galaxies/${id}/members`),
  })
}

/** El desglose de un dia se pide al tocar su estrella; `date` nulo no consulta. */
export function useGalaxyDay(id: string, date: string | null) {
  return useQuery({
    queryKey: [...KEY, id, 'day', date],
    queryFn: () => apiFetch<GalaxyDayDetail>(`/api/v1/galaxies/${id}/days/${date}`),
    enabled: date !== null,
  })
}

export interface CreateGalaxyInput {
  name: string
  description: string
  theme: string
  habitId: string | null
}

export function useCreateGalaxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGalaxyInput) =>
      apiFetch<Galaxy>('/api/v1/galaxies', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
      // Si no se enlazo un habito, el backend creo uno nuevo.
      void qc.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}

/** Unirse enlaza un habito propio; sin `habitId` el backend crea uno nuevo. */
export function useJoinGalaxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, habitId }: { id: string; habitId: string | null }) =>
      apiFetch<Galaxy>(`/api/v1/galaxies/${id}/members`, {
        method: 'POST',
        body: habitId ? { habitId } : {},
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY })
      void qc.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}

export function useLeaveGalaxy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/v1/galaxies/${id}/members/me`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  })
}
