import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Friend, FriendRequest, InviteCode, PageResponse } from '@/api/types'
import { apiFetch } from '@/lib/http'

const KEY = ['social'] as const

export function useInviteCode() {
  return useQuery({
    queryKey: [...KEY, 'invite-code'],
    queryFn: () => apiFetch<InviteCode>('/api/v1/me/invite-code'),
  })
}

/** El codigo anterior queda invalidado: quien lo tuviera ya no puede usarlo. */
export function useRegenerateInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<InviteCode>('/api/v1/me/invite-code', { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [...KEY, 'invite-code'] }),
  })
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: [...KEY, 'requests', 'in'],
    queryFn: () => apiFetch<FriendRequest[]>('/api/v1/friend-requests'),
  })
}

export function useOutgoingRequests() {
  return useQuery({
    queryKey: [...KEY, 'requests', 'out'],
    queryFn: () => apiFetch<FriendRequest[]>('/api/v1/friend-requests/sent'),
  })
}

export function useSendRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (inviteCode: string) =>
      apiFetch<FriendRequest>('/api/v1/friend-requests', {
        method: 'POST',
        body: { inviteCode },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRespondRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      apiFetch<void>(`/api/v1/friend-requests/${requestId}/${accept ? 'accept' : 'decline'}`, {
        method: 'POST',
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useFriends() {
  return useQuery({
    queryKey: [...KEY, 'friends'],
    queryFn: () => apiFetch<PageResponse<Friend>>('/api/v1/friends'),
  })
}

export function useRemoveFriend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<void>(`/api/v1/friends/${userId}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  })
}
