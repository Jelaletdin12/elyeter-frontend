/**
 * Backend realtime event adları ve payload tipleri —
 * `src/modules/shared/realtime/types/realtime-payload.type.ts` dosyasının
 * frontend aynası. Backend ve frontend aynı paketi paylaşmadığı için bu iki
 * dosya bilinçli olarak ayrı tutulur; bir event eklendiğinde veya payload'ı
 * değiştiğinde İKİ dosya da güncellenmelidir.
 */

export const REALTIME_EVENTS = {
  STOCK_NOTIFICATION_READY: 'stock_notification.ready',
  ORDER_STATUS_CHANGED: 'order.status_changed',
} as const;

/** Prisma `OrderStatus` enum'unun frontend aynası (payload'lar içinde gelir). */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type StockNotificationReadyPayload = {
  /** Bu emisyonu tetikleyen (waiting → ready) abonelik id'leri. */
  notificationIds: string[];
  readyAt: string;
  productVariantId: string;
  variant: { id: string; sku: string };
  product: { id: string; translations: { locale: string; name: string; slug: string }[] };
};

export type OrderStatusChangedPayload = {
  orderId: string;
  status: OrderStatus;
  previousStatus: OrderStatus;
  changedAt: string;
};

/** Socket.IO client'ın dinleyebileceği tek yönlü (server → client) olaylar. */
export interface ServerToClientEvents {
  'stock_notification.ready': (payload: StockNotificationReadyPayload) => void;
  'order.status_changed': (payload: OrderStatusChangedPayload) => void;
}
