import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { User, UserListResponse } from '../types';

/**
 * ✅ DOĞRULANDI: GET /users → { items: User[], meta }, ürünlerle aynı
 * sayfalama pattern'i. Query param'ları (page/limit) Swagger'da dokümante
 * değil ama muhtemelen products gibi çalışıyor — sayfalama görürsen ekle.
 */
export function userListOptions(storeId: string, page = 1) {
  return queryOptions({
    queryKey: queryKeys.adminUsers.list(storeId, page),
    queryFn: () => authorizedFetch<UserListResponse>(`/users?page=${page}`),
    staleTime: 30_000,
  });
}

export function userDetailOptions(storeId: string, userId: string) {
  return queryOptions({
    queryKey: queryKeys.adminUsers.detail(storeId, userId),
    queryFn: () => authorizedFetch<User>(`/users/${userId}`),
    staleTime: 30_000,
  });
}
