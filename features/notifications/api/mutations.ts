import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type {
  StockSubscribedResponse,
  StockUnsubscribedResponse,
  StockNotificationsReadResponse,
} from '../types';

/**
 * Bildirim mutation'ları tamamen private/kişisel — Next Data Cache'e girmez,
 * bu yüzden tek bir `notifications.all(storeId)` invalidation'ı yeterli
 * (liste + badge + ürün sayfasındaki abone durumu aynı key ağacında).
 *
 * Hata mesajları global MutationCache onError'da çözülür
 * (bkz. providers/QueryProvider.tsx) — burada manuel toast yazılmaz.
 */
function useInvalidateNotifications(storeId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(storeId) });
  };
}

/** POST /notifications/stock/:variantId — stoğu olmayan varyanta "haber ver" aboneliği. */
export function useSubscribeToStockMutation(storeId: string) {
  const invalidate = useInvalidateNotifications(storeId);

  return useMutation({
    mutationFn: (productVariantId: string) =>
      authorizedFetch<StockSubscribedResponse>(`/notifications/stock/${productVariantId}`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });
}

/** DELETE /notifications/stock/:variantId — idempotent (zaten yoksa da 200 döner). */
export function useUnsubscribeFromStockMutation(storeId: string) {
  const invalidate = useInvalidateNotifications(storeId);

  return useMutation({
    mutationFn: (productVariantId: string) =>
      authorizedFetch<StockUnsubscribedResponse>(`/notifications/stock/${productVariantId}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });
}

/**
 * PATCH /notifications/stock/read — body boşsa TÜM hazır abonelikler okundu
 * sayılır, `productVariantId` verilirse sadece o varyant.
 */
export function useMarkStockNotificationsReadMutation(storeId: string) {
  const invalidate = useInvalidateNotifications(storeId);

  return useMutation({
    mutationFn: (productVariantId?: string) =>
      authorizedFetch<StockNotificationsReadResponse>('/notifications/stock/read', {
        method: 'PATCH',
        body: JSON.stringify(productVariantId ? { productVariantId } : {}),
      }),
    onSuccess: invalidate,
  });
}
