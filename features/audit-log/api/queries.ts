import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { AuditLogListResponse, AuditLogFilters } from '../types';

/**
 * GET /audit-log — sayfalanmış {items, meta} (users/coupons ile AYNI desen).
 * Filtre set'inin page reset'lenmesi sayfa tarafında yapılır (buradan sadece
 * query key + url üretilir). staleTime 10s — aktif bir audit kaydı görülsün.
 */
export function auditLogListOptions(storeId: string, page = 1, filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (filters.entity) params.set('entity', filters.entity);
  if (filters.action) params.set('action', filters.action);
  if (filters.actorId) params.set('actorId', filters.actorId);
  const qs = params.toString();

  return queryOptions({
    queryKey: queryKeys.adminAuditLog.list(storeId, page, filters),
    queryFn: () => adminAuthorizedFetch<AuditLogListResponse>(`/audit-log${qs ? `?${qs}` : ''}`),
    staleTime: 10_000,
  });
}
