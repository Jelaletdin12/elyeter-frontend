import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch as authorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { User, UserListFilters, UserListResponse } from '../types';

/**
 * ✅ DOĞRULANDI: GET /users → { items: User[], meta }, ürünlerle aynı
 * sayfalama pattern'i. Query param'ları (page/limit/search/role) backend'de
 * UserListQueryDto ile doğrulandı (curl, 2026-09-17) — search email/tam ad
 * contains, role IsEnum(Role), limit max 50.
 */
export function userListOptions(storeId: string, page = 1, filters: UserListFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.role) params.set('role', filters.role);

  return queryOptions({
    queryKey: queryKeys.adminUsers.list(storeId, page, filters),
    queryFn: () => authorizedFetch<UserListResponse>(`/users?${params.toString()}`),
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
