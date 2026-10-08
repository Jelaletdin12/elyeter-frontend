'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';

import { toast } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { queryKeys } from '@/lib/api/query-keys';
import { createRealtimeSocket } from '@/lib/realtime/socket';
import {
  REALTIME_EVENTS,
  type OrderStatusChangedPayload,
  type StockNotificationReadyPayload,
} from '@/lib/realtime/events';

/**
 * Canlı bildirim köprüsü — Socket.IO istemcisiyi yaşatır ve gelen olayları
 * react-query invalidation + toast'a çevirir.
 *
 * Önemli davranışlar:
 *  - Bağlantı giriş yapılmış müşteri oturumunda kurulur. Access token
 *    zustand'ta memory'de tutulduğu için (persist yok) sessiz refresh'te
 *    token değişir → effect yeniden çalışır ve socket yeni token'la tekrar
 *    bağlanır (bkz. stores/auth-store.ts).
 *  - `t` (useTranslations) next-intl'de messages/locale üzerinden memoize
 *    edildiği için effect'i gereksiz yere yeniden tetiklemez; locale
 *    değiştiğinde ise zaten çeviriyle birlikte tazelenmesi istenir.
 *  - Payload'daki çeviriler backend'den TÜM locale'lerle gelir; mevcut
 *    locale ile eşleşen ad toast'ta gösterilir, eşleşmezse ilk çeviri
 *    kullanılır.
 */
export function RealtimeProvider() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const storeId = useAuthStore((s) => s.activeStoreId);
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('notifications');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = createRealtimeSocket(accessToken);
    if (!socket) return;

    const onStockReady = (payload: StockNotificationReadyPayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(storeId) });

      const translation =
        payload.product.translations.find((tr) => tr.locale === locale) ??
        payload.product.translations[0];
      const name = translation?.name ?? payload.variant.sku;

      toast.success(t('stockReadyTitle'), {
        description: t('stockReadyDescription', { product: name }),
      });
    };

    const onOrderStatusChanged = (payload: OrderStatusChangedPayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all(storeId) });

      toast.info(t('orderStatusTitle'), {
        description: t('orderStatusDescription', {
          orderId: payload.orderId.slice(0, 8),
          status: t(`status.${payload.status}`),
        }),
      });
    };

    socket.on(REALTIME_EVENTS.STOCK_NOTIFICATION_READY, onStockReady);
    socket.on(REALTIME_EVENTS.ORDER_STATUS_CHANGED, onOrderStatusChanged);

    return () => {
      socket.off(REALTIME_EVENTS.STOCK_NOTIFICATION_READY, onStockReady);
      socket.off(REALTIME_EVENTS.ORDER_STATUS_CHANGED, onOrderStatusChanged);
      socket.disconnect();
    };
  }, [isAuthenticated, accessToken, storeId, queryClient, locale, t]);

  return null;
}
