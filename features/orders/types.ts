import type { ProductVariant, ProductTranslation } from '@/features/products/types';

/**
 * ✅ DOĞRULANDI — GET /orders, GET /orders/{id} response şemaları backend
 * `OrderResponseDto` + curl doğrulamasından (2026-09-10). Decimal alanlar
 * (total/subtotal/discountAmount/price/coupon.value) TransformInterceptor
 * nedeniyle string geliyor.
 */
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Backend'deki ORDER_STATUS_TRANSITIONS'ın frontend yansıması
 * (bkz. orders.controller updateStatus) — status picker sadece bu sonraki
 * status'ları sunar. BACKEND final otoritedir; bu sadece UX.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  CANCELLED: [],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: [],
};

export type OrderStatusTone = 'neutral' | 'success' | 'warning' | 'destructive';

/** Liste + detay + dashboard ortak status görünümleri (tek kaynak). */
export const ORDER_STATUS_FLOW: { status: OrderStatus; label: string; tone: OrderStatusTone }[] = [
  { status: 'PENDING', label: 'Pending', tone: 'warning' },
  { status: 'CONFIRMED', label: 'Confirmed', tone: 'neutral' },
  { status: 'PROCESSING', label: 'Processing', tone: 'neutral' },
  { status: 'SHIPPED', label: 'Shipped', tone: 'neutral' },
  { status: 'DELIVERED', label: 'Delivered', tone: 'success' },
  { status: 'CANCELLED', label: 'Cancelled', tone: 'destructive' },
  { status: 'RETURN_REQUESTED', label: 'Return requested', tone: 'warning' },
  { status: 'RETURNED', label: 'Returned', tone: 'neutral' },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  ORDER_STATUS_FLOW.map((s) => [s.status, s.label]),
) as Record<OrderStatus, string>;

export const ORDER_STATUS_TONES: Record<OrderStatus, OrderStatusTone> = Object.fromEntries(
  ORDER_STATUS_FLOW.map((s) => [s.status, s.tone]),
) as Record<OrderStatus, OrderStatusTone>;

export type OrderCoupon = {
  id: string;
  code: string;
  type: string;
  value: string;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: string;
  reason: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  price: string;
  productVariant: ProductVariant & { product: { translations: ProductTranslation[] } };
};

export type Order = {
  id: string;
  clientId: string;
  status: OrderStatus;
  subtotal: string | null;
  discountAmount: string;
  total: string;
  couponId: string | null;
  coupon: OrderCoupon | null;
  paymentMethod: string;
  fulfillmentType: string;
  recipientName: string | null;
  recipientPhone: string | null;
  shippingAddress: string | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
};

export type OrderListResponse = {
  items: Order[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
