import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys, type NotificationListFilters } from '@/lib/api/query-keys';
import type { StockNotificationListResponse } from '../types';

function buildSearch(filters: NotificationListFilters): string {
  const params = new URLSearchParams();

  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  // Backend `isTrue()` sadece `true`/`"true"` kabul ediyor — false göndermeye
  // gerek yok, filtre yoksa tüm abonelikler döner (bkz. notifications.service.ts).
  if (filters.onlyReady) params.set('onlyReady', 'true');
  if (filters.unreadOnly) params.set('unreadOnly', 'true');

  return params.toString();
}

/**
 * Abonelik listesi. Aynı çağrı üç yerde kullanılır:
 *  - bildirimlerim sayfası (tam liste, sayfalı),
 *  - header badge (unreadOnly=true → meta.total),
 *  - ürün sayfası (hangi varyanta abone olduğumuzun anlaşılması).
 */
export function stockNotificationListOptions(
  storeId: string,
  filters: NotificationListFilters = {},
) {
  const search = buildSearch(filters);

  return queryOptions({
    queryKey: queryKeys.notifications.list(storeId, filters),
    queryFn: () =>
      authorizedFetch<StockNotificationListResponse>(
        `/notifications/stock${search ? `?${search}` : ''}`,
      ),
    staleTime: 30 * 1000,
  });
}

/** Header zilindeki okunmamış rozet sayısı — tek satır çekip sadece meta.total'ı kullanır. */
export function unreadNotificationCountOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.notifications.unreadCount(storeId),
    queryFn: () =>
      authorizedFetch<StockNotificationListResponse>(
        '/notifications/stock?unreadOnly=true&page=1&limit=1',
      ),
    staleTime: 15 * 1000,
    select: (data) => data.meta.total,
  });
}
