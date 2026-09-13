import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { OrderListResponse, Order } from '../types';

/**
 * Admin GET /orders — staff için TÜM siparişler (CLIENT'a göre ownership
 * filtresi backend'de yok), createdAt desc. `?limit=` açıkca verilir
 * (normalizePagination default'una güvenilmez). GET /orders?status= desteği
 * backend'de yok (findAll sadece PaginationQuery okur) — durum filtreleme
 * backend'e eklenene kadar koyulmaz.
 */
export function adminOrderListOptions(storeId: string, page = 1) {
  return queryOptions({
    queryKey: queryKeys.adminOrders.list(storeId, page),
    queryFn: () => adminAuthorizedFetch<OrderListResponse>(`/orders?page=${page}&limit=20`),
    staleTime: 15_000,
  });
}

export function adminOrderDetailOptions(storeId: string, orderId: string) {
  return queryOptions({
    queryKey: queryKeys.adminOrders.detail(storeId, orderId),
    queryFn: () => adminAuthorizedFetch<Order>(`/orders/${orderId}`),
    staleTime: 15_000,
  });
}
