import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { ProductListResponse } from '@/features/products/types';
import type { CategoryListResponse } from '@/features/categories/types';
import type { CouponListResponse, CouponUsagesResponse } from '../types';

/**
 * GET /coupons — sayfalanmış {items, meta} (products/categories ile AYNI desen).
 * GET parametreleri Swagger'da dokümante değil; curl'de sayfalamanın çalıştığı
 * (meta dönmesi) doğrulandı, ?page= convention'ı products/categories'ten alındı.
 */
export function couponListOptions(storeId: string, page = 1) {
  return queryOptions({
    queryKey: queryKeys.adminCoupons.list(storeId, page),
    queryFn: () => adminAuthorizedFetch<CouponListResponse>(`/coupons?page=${page}`),
    staleTime: 30_000,
  });
}

/**
 * GET /coupons/{id}/usages — kupon kullanım geçmişi (sayfalanmış).
 * ⚠️ Tip doğrulanmadı (boş dizi döndü) — UI şu an sadece usedCount gösteriyor.
 */
export function couponUsagesOptions(storeId: string, couponId: string) {
  return queryOptions({
    queryKey: queryKeys.adminCoupons.usages(storeId, couponId),
    queryFn: () =>
      adminAuthorizedFetch<CouponUsagesResponse>(`/coupons/${couponId}/usages?page=1&limit=100`),
    staleTime: 30_000,
  });
}

/**
 * Scope dialog'unun ürün adları için — ürün listesinden istenen limit'te isim
 * haritası kurulur. Büyük katalogda pagination UI'ı kurmamak adına ilk 100 ile
 * sınırlı (isim araması ürün kartındaki gerçek ürün adları üzerinden yapılır).
 */
export function couponProductScopeOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.adminCoupons.productScope(storeId),
    queryFn: () => adminAuthorizedFetch<ProductListResponse>(`/products?limit=100`),
    staleTime: 30_000,
  });
}

/** Scope dialog'unun kategori adları için. */
export function couponCategoryScopeOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.adminCoupons.categoryScope(storeId),
    queryFn: () => adminAuthorizedFetch<CategoryListResponse>(`/categories?limit=100`),
    staleTime: 30_000,
  });
}
