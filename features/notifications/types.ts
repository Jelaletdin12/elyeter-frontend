/**
 * GET /notifications/stock yanıt şeması — backend NotificationsService.listMine()
 * içindeki Prisma include'ının (stockNotification + productVariant + product
 * + translations) frontend aynası. Backend'de bu endpoint için Swagger'da
 * detaylı alan şeması yok; alanlar şemadan türetildi.
 */

export type StockNotificationTranslation = {
  locale: string;
  name: string;
  slug: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type StockNotificationItem = {
  id: string;
  productVariantId: string;
  clientId: string;
  /** null = hâlâ bekliyor; dolu = stoğa geldi (haber verilmeye hazır). */
  readyAt: string | null;
  /** null = okunmamış (header badge sayacı). */
  readAt: string | null;
  createdAt: string;
  productVariant: {
    id: string;
    productId: string;
    sku: string;
    /** Prisma Decimal serialization'ı yüzünden string (bkz. wishlist notes). */
    price: string;
    compareAtPrice?: string | null;
    attributes: Record<string, string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    product: {
      id: string;
      isActive: boolean;
      brandId?: string | null;
      categoryId: string;
      viewCount: number;
      createdById: string;
      createdAt: string;
      updatedAt: string;
      translations: StockNotificationTranslation[];
    };
  };
};

export type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type StockNotificationListResponse = Paginated<StockNotificationItem>;

export type StockSubscribedResponse = { subscribed: boolean };

export type StockUnsubscribedResponse = { unsubscribed: boolean };

export type StockNotificationsReadResponse = { marked: boolean; count: number };
