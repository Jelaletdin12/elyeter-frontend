import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/api/query-keys';
import type { ClientAddress, Profile, ProfileAddressInput } from '../types';

/** PATCH /api/v1/profile — fullName/phone günceller. Header'daki isim de
 *  store'a yazılır (auth-store yalnızca backend response'undan doldurulur). */
export function useUpdateProfileMutation(storeId: string) {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: { fullName?: string; phone?: string }) =>
      authorizedFetch<Profile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current(storeId) });
      const { user, accessToken } = useAuthStore.getState();
      if (user && accessToken) {
        setSession({ ...user, fullName: data.fullName }, accessToken);
      }
    },
  });
}

/** POST /api/v1/profile/addresses — yeni adres ekler, profili tazeler. */
export function useAddAddressMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProfileAddressInput) =>
      authorizedFetch<ClientAddress>('/profile/addresses', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current(storeId) }),
  });
}

/** PATCH /api/v1/profile/addresses/{id} */
export function useUpdateAddressMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, ...input }: ProfileAddressInput & { addressId: string }) =>
      authorizedFetch<ClientAddress>(`/profile/addresses/${addressId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current(storeId) }),
  });
}

/** DELETE /api/v1/profile/addresses/{id} */
export function useRemoveAddressMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      authorizedFetch<void>(`/profile/addresses/${addressId}`, { method: 'DELETE' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current(storeId) }),
  });
}
