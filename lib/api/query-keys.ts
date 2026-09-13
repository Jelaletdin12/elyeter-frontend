/**
 * Tüm TanStack Query key'leri BURADA tanımlanır — feature'lar kendi query
 * dosyalarında ham dizi (['products', ...]) yazmaz, buradaki factory'leri kullanır.
 *
 * Convention (FRONTEND_STANDARDS.md #9, #14): [domain, storeId, ...params]
 * storeId şu an backend'den tek/sabit dönse bile key'in bir parçasıdır —
 * ileride multi-store (B2B) geçişinde tüm cache invalidation mantığı
 * bu tek dosyayı güncelleyerek çalışmaya devam eder.
 */

export type ProductFilters = {
  categoryId?: string;
  search?: string;
  page?: number;
  perPage?: number;
  minPrice?: number;
  maxPrice?: number;
};

export const queryKeys = {
  products: {
    all: (storeId: string) => ['products', storeId] as const,
    list: (storeId: string, filters: ProductFilters) =>
      ['products', storeId, 'list', filters] as const,
    detail: (storeId: string, productId: string) =>
      ['products', storeId, 'detail', productId] as const,
    bySlug: (storeId: string, locale: string, slug: string) =>
      ['products', storeId, 'slug', locale, slug] as const,
  },

  categories: {
    all: (storeId: string) => ['categories', storeId] as const,
    list: (storeId: string) => ['categories', storeId, 'list'] as const,
    bySlug: (storeId: string, locale: string, slug: string) =>
      ['categories', storeId, 'slug', locale, slug] as const,
  },

  cart: {
    all: (storeId: string) => ['cart', storeId] as const,
    current: (storeId: string) => ['cart', storeId, 'current'] as const,
  },

  wishlist: {
    all: (storeId: string) => ['wishlist', storeId] as const,
    current: (storeId: string) => ['wishlist', storeId, 'current'] as const,
  },

  orders: {
    all: (storeId: string) => ['orders', storeId] as const,
    list: (storeId: string, page: number) => ['orders', storeId, 'list', page] as const,
    detail: (storeId: string, orderId: string) => ['orders', storeId, 'detail', orderId] as const,
  },

  profile: {
    all: (storeId: string) => ['profile', storeId] as const,
    current: (storeId: string) => ['profile', storeId, 'current'] as const,
  },

  search: {
    results: (storeId: string, locale: string, term: string) =>
      ['search', storeId, locale, term] as const,
  },

  // --- Admin (CSR, private) ---
  adminProducts: {
    all: (storeId: string) => ['admin-products', storeId] as const,
    list: (storeId: string, filters: ProductFilters) =>
      ['admin-products', storeId, 'list', filters] as const,
    detail: (storeId: string, productId: string) =>
      ['admin-products', storeId, 'detail', productId] as const,
  },
  adminCategories: {
    all: (storeId: string) => ['admin-categories', storeId] as const,
  },
  adminBanners: {
    all: (storeId: string) => ['admin-banners', storeId] as const,
  },
  adminOrders: {
    all: (storeId: string) => ['admin-orders', storeId] as const,
    list: (storeId: string, page: number) => ['admin-orders', storeId, 'list', page] as const,
    detail: (storeId: string, orderId: string) =>
      ['admin-orders', storeId, 'detail', orderId] as const,
  },
  adminUsers: {
    all: (storeId: string) => ['admin-users', storeId] as const,
    list: (storeId: string, page: number) => ['admin-users', storeId, 'list', page] as const,
    detail: (storeId: string, userId: string) =>
      ['admin-users', storeId, 'detail', userId] as const,
  },
  adminCoupons: {
    all: (storeId: string) => ['admin-coupons', storeId] as const,
    list: (storeId: string, page: number) => ['admin-coupons', storeId, 'list', page] as const,
    usages: (storeId: string, couponId: string) =>
      ['admin-coupons', storeId, 'usages', couponId] as const,
    // Scope dialog'unun ürün/kategori isim eşleştirmesi için büyük listeler.
    productScope: (storeId: string) => ['admin-coupons', storeId, 'product-scope'] as const,
    categoryScope: (storeId: string) => ['admin-coupons', storeId, 'category-scope'] as const,
  },
  adminStats: {
    all: (storeId: string) => ['admin-stats', storeId] as const,
    overview: (storeId: string) => ['admin-stats', storeId, 'overview'] as const,
    productsByOperator: (storeId: string) =>
      ['admin-stats', storeId, 'products-by-operator'] as const,
    mostViewed: (storeId: string, locale: string) =>
      ['admin-stats', storeId, 'most-viewed', locale] as const,
    mostSearched: (storeId: string, limit: number) =>
      ['admin-stats', storeId, 'most-searched', limit] as const,
  },
  adminAuditLog: {
    all: (storeId: string) => ['admin-audit-log', storeId] as const,
    list: (
      storeId: string,
      page: number,
      filters: { entity?: string; action?: string; actorId?: string },
    ) => ['admin-audit-log', storeId, 'list', page, filters] as const,
  },

  auth: {
    me: () => ['auth', 'me'] as const,
  },
} as const;

/**
 * Next.js Data Cache tag convention'ı (query key'lerden AYRI — bkz. FRONTEND_AGENTS.md #6).
 * Bunlar apiFetch'in { next: { tags } } opsiyonunda ve /api/revalidate route'unda kullanılır.
 * Ad hoc tag ismi üretilmez, yeni bir cacheable veri tipi eklenirse aynı desen izlenir.
 */
export const dataCacheTags = {
  home: () => 'home',
  banners: () => 'banners',
  products: () => 'products',
  product: (locale: string, slug: string) => `product:${locale}:${slug}`,
  categories: () => 'categories',
  category: (locale: string, slug: string) => `category:${locale}:${slug}`,
} as const;
