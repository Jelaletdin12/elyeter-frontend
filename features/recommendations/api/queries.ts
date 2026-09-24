import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type {
  HomeRecommendations,
  RecommendedProduct,
  RecommendationProductListResponse,
} from '../types';

/**
 * Misafir anasayfa bölümleri (trending + newArrivals) — SERVER tarafı, ISR.
 * Auth header/cookie olmadan çağrılır → backend popülerlik fallback'i döner.
 * GET /recommendations/home. `forYou`/`categories`/`brands` bölümleri misafir
 * için popülerlik yedeğini içerse de anasayfada kişisel forYou ayrı client
 * bileşeniyle (bakınız ForYouSection) çizilir.
 */
export async function getGuestHomeRecommendations(): Promise<HomeRecommendations> {
  return apiFetch<HomeRecommendations>('/recommendations/home', {
    next: { revalidate: 300, tags: [dataCacheTags.home(), dataCacheTags.products()] },
  });
}

/**
 * Kişisel anasayfa — CLIENT (TanStack Query). JWT (auth store) ile çağrılır →
 * backend CLIENT kullanıcısının davranış verisine göre forYou/categories/brands
 * üretir. authorizedFetch 401'de silent refresh yapar (STANDARDS.md #8).
 * Anasayfa ISR olduğundan kişisel bölümler server'a girmez; bu query yalnızca
 * oturum açıkken etkinleştirilir (STANDARDS.md #4, #5).
 */
export function homeRecommendationsOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.recommendations.home(storeId),
    queryFn: () => authorizedFetch<HomeRecommendations>('/recommendations/home'),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export const RECOMMENDATIONS_PAGE_SIZE = 12;

/**
 * Sayfalanmış öneri ürünleri — /recommendations "View all" sayfası, CLIENT.
 * JWT ile çağrılır → oturumluysa kişisel forYou sıralaması, değilse popülerlik
 * fallback'i döner (misafir de sayfayı açabilir). authorizedFetch 401'de silent
 * refresh yapar (STANDARDS.md #8).
 */
export function recommendationsProductsPageOptions(storeId: string, page: number) {
  return queryOptions({
    queryKey: queryKeys.recommendations.productsPage(storeId, page),
    queryFn: () =>
      authorizedFetch<RecommendationProductListResponse>(
        `/recommendations/products?page=${page}&limit=${RECOMMENDATIONS_PAGE_SIZE}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Benzer ürünler — ürün detay sayfası, SERVER (ISR 600s).
 * GET /recommendations/products/:id/similar (V2 content similarity).
 */
export async function getSimilarProducts(
  productId: string,
  limit = 8,
): Promise<RecommendedProduct[]> {
  return apiFetch<RecommendedProduct[]>(
    `/recommendations/products/${productId}/similar?limit=${limit}`,
    {
      next: {
        revalidate: 600,
        tags: [dataCacheTags.products()],
      },
    },
  );
}