import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { User, CreateUserInput, UpdateUserInput } from '../types';

/**
 * Users tamamen admin-internal veri — hiçbir public/ISR sayfası bunu
 * göstermiyor, bu yüzden burada dual invalidation (FRONTEND_AGENTS.md #7)
 * YOK, sadece admin'in kendi listesi invalidate ediliyor.
 */
export function useCreateUserMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      authorizedFetch<User>('/users', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all(storeId) }),
  });
}

export function useUpdateUserMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      authorizedFetch<User>(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all(storeId) }),
  });
}

export function useDeleteUserMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authorizedFetch<void>(`/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all(storeId) }),
  });
}
