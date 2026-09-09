import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

export type OrderListItem = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
};

export type OrderDetail = OrderListItem & {
  items: { productName: string; quantity: number; price: string }[];
  statusHistory: { fromStatus: string | null; toStatus: string; createdAt: string }[];
};

export function orderListOptions(storeId: string, page: number) {
  return queryOptions({
    queryKey: queryKeys.orders.list(storeId, page),
    queryFn: () => authorizedFetch<OrderListItem[]>(`/orders?page=${page}`),
    staleTime: 30_000,
  });
}

export function orderDetailOptions(storeId: string, orderId: string) {
  return queryOptions({
    queryKey: queryKeys.orders.detail(storeId, orderId),
    queryFn: () => authorizedFetch<OrderDetail>(`/orders/${orderId}`),
    staleTime: 30_000,
  });
}
