import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { Order, OrderStatus } from '../types';

/**
 * PATCH /orders/{id}/status — body {status, reason?}. Geçişler backend'de
 * ORDER_STATUS_TRANSITIONS ile doğrulanır (UX haritası types.ts'te, backend
 * final otorite). Güncelleme sadece staff'a açık (SUPER_ADMIN/ADMIN/OPERATOR).
 *
 * Invalidation: sadece adminOrders (liste + detay) DEĞİL — dashboard
 * `/stats/overview`'ın ordersByStatus/totalOrders verisi de değişir.
 */
export function useUpdateOrderStatusMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: { status: OrderStatus; reason?: string };
    }) =>
      adminAuthorizedFetch<Order>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all(storeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats.overview(storeId) });
    },
  });
}
