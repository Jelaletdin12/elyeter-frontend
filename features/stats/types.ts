/**
 * ⚠️ GET /stats/* response şemaları Swagger'da yok (StatsController'da
 * @ApiOkResponse yok) — backend stats.service.ts'ten çıkarıldı (2026-09-10).
 */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type StatsOverview = {
  totalActiveProducts: number;
  totalStockRemaining: number;
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  /** CANCELLED olmayan siparişlerdeki OrderItem.quantity toplamı */
  totalUnitsSold: number;
};

export type ProductsByOperatorEntry = {
  operatorId: string;
  operatorEmail: string;
  operatorFullName: string;
  productCount: number;
};

export type MostViewedProductEntry = {
  id: string;
  name: string;
  viewCount: number;
};

export type MostSearchedTermEntry = {
  term: string;
  searchCount: number;
};
