import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags, type ProductFilters } from '@/lib/api/query-keys';
import type { Product, ProductListResponse, StockMovementListResponse } from '../types';

/**
 * ⚠️ GET /products'un query parametreleri (locale/categoryId/search/page vb.)
 * docs-json.json'da @ApiQuery ile dokümante edilmemiş — backend controller'ı
 * muhtemelen bunları @Query() DTO ile okuyor ama Swagger'a yansımamış.
 * Aşağıdaki query string'ler STANDARDS.md'deki isimlendirme convention'ına
 * göre TAHMİN edildi. Backend ayaktayken bir istek atıp gerçekten filtrelediğini
 * doğrula; çalışmıyorsa backend'deki @Query() DTO'sunun gerçek alan adlarına göre
 * burayı güncelle.
 *
 * KESİN olan: response şekli — { items: ProductResponseDto[], meta: {...} }
 * (ProductListResponseDto, Swagger'da tam dokümante).
 */

export async function getProductBySlug(locale: string, slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/slug/${locale}/${slug}`, {
    next: {
      revalidate: 600,
      tags: [dataCacheTags.product(locale, slug), dataCacheTags.products()],
    },
  });
}

/**
 * "Benzer ürünler" bölümü artık öneri motoruyla geliyor —
 * bkz. features/recommendations/api/queries.ts (getSimilarProducts).
 * Buradaki /products/:id/related client'ı kaldırıldı; endpoint backend'de
 * hâlâ mevcut olabilir ama frontend tüketmez.
 */

export async function getProductList(
  locale: string,
  categorySlug: string,
): Promise<ProductListResponse> {
  // categorySlug'dan categoryId'ye çevirmek çağıran tarafın işi (bkz.
  // app/[locale]/[categorySlug]/page.tsx — önce getCategory ile id alınıyor).
  return apiFetch<ProductListResponse>(`/products?locale=${locale}&categoryId=${categorySlug}`, {
    next: {
      revalidate: 300,
      tags: [dataCacheTags.category(locale, categorySlug), dataCacheTags.products()],
    },
  });
}

export function productDetailOptions(storeId: string, productId: string) {
  return queryOptions({
    queryKey: queryKeys.products.detail(storeId, productId),
    queryFn: () => apiFetch<Product>(`/products/${productId}`, { cache: 'no-store' }),
    staleTime: 5 * 60 * 1000,
  });
}

export function productListOptions(storeId: string, filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.brandId) params.set('brandId', filters.brandId);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  // Filtre paneli tüm kataloğu görür — backend limit max 100 (product-list-query.dto).
  params.set('limit', '100');

  return queryOptions({
    queryKey: queryKeys.products.list(storeId, filters),
    queryFn: () =>
      apiFetch<ProductListResponse>(`/products?${params.toString()}`, { cache: 'no-store' }),
    staleTime: 30_000,
  });
}

export type CategoryFacet = { id: string; label: string };

/** markanın ürünlerindeki kategori alanından benzersiz kategori listesi çıkarır. */
export function extractCategoryFacets(items: Product[], locale: string): CategoryFacet[] {
  const seen = new Map<string, CategoryFacet>();
  for (const product of items) {
    const category = product.category;
    if (!category || seen.has(category.id)) continue;
    const label =
      category.translations?.find((t) => t.locale === locale)?.name ??
      category.translations?.[0]?.name ??
      category.name ??
      category.id;
    seen.set(category.id, { id: category.id, label });
  }
  return [...seen.values()];
}

/**
 * Marka sayfasının filtre paneli KATEGORİ listesi. Backend'de "markanın
 * kategorileri" endpoint'i yok (categories controller'ı yalnızca kategori
 * içindeki markaları destekler: /brands?categoryId=, tersini değil). Bu yüzden
 * markanın ürünleri çekilip imbeding category alanından benzersiz kategoriler
 * türetilir (limit 100 — panel önerileri için yeterli). Çekim AYRI bir query
 * key'ine sahip: kullanıcı filtreledikçe sonuç kümesi daralsa da panel listesi
 * sabit kalır.
 */
export function brandCategoriesOptions(storeId: string, locale: string, brandId: string) {
  return queryOptions({
    queryKey: [...queryKeys.products.all(storeId), 'brand-categories', locale, brandId] as const,
    queryFn: () =>
      apiFetch<ProductListResponse>(`/products?brandId=${encodeURIComponent(brandId)}&limit=100`, {
        cache: 'no-store',
      }).then((res) => extractCategoryFacets(res.items, locale)),
    staleTime: 60_000,
  });
}

/** Admin — tekil ürün ("get one"), ürün düzenleme sayfası için. */
export function adminProductDetailOptions(storeId: string, productId: string) {
  return queryOptions({
    queryKey: queryKeys.adminProducts.detail(storeId, productId),
    queryFn: () => adminAuthorizedFetch<Product>(`/products/${productId}`),
    staleTime: 30_000,
  });
}

/**
 * ✅ Doğrulandı (curl, 2026-09-08): GET .../stock-movements sayfalanmış döner.
 * Response şeması Swagger'da yok, StockMovement tipi elle çıkarıldı
 * (bkz. features/products/types/index.ts).
 */
export function stockMovementsOptions(
  storeId: string,
  productId: string,
  variantId: string,
  page = 1,
) {
  return queryOptions({
    queryKey: [
      ...queryKeys.adminProducts.detail(storeId, productId),
      'stock-movements',
      variantId,
      page,
    ] as const,
    queryFn: () =>
      adminAuthorizedFetch<StockMovementListResponse>(
        `/products/${productId}/variants/${variantId}/stock-movements?page=${page}`,
      ),
    staleTime: 10_000,
  });
}
