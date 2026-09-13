import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { Profile } from '../types';

/**
 * GET /api/v1/profile — kullanıcı + kayıtlı adresler birlikte döner
 * (profile.service.ts getMe). Yavaş değişen veri → staleTime:30s (standart #5).
 */
export function profileOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.profile.current(storeId),
    queryFn: () => authorizedFetch<Profile>('/profile'),
    staleTime: 30_000,
  });
}
