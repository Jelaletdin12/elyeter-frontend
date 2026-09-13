import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { ProductVariant, ProductTranslation } from '@/features/products/types';

export type OrderListItem = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
};

export type OrderListResponse = {
  items: OrderListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type OrderItemLine = {
  id: string;
  quantity: number;
  price: string;
  productVariant: ProductVariant & { product: { translations: ProductTranslation[] } };
};

export type OrderDetail = OrderListItem & {
  subtotal: string;
  discountAmount: string;
  coupon: { id: string; code: string; type: string; value: string } | null;
  items: OrderItemLine[];
  statusHistory: { fromStatus: string | null; toStatus: string; createdAt: string }[];
};

export function orderListOptions(storeId: string, page: number) {
  return queryOptions({
    queryKey: queryKeys.orders.list(storeId, page),
    queryFn: () => authorizedFetch<OrderListResponse>(`/orders?page=${page}`),
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
