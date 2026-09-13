import { queryOptions } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type {
  StatsOverview,
  ProductsByOperatorEntry,
  MostViewedProductEntry,
  MostSearchedTermEntry,
} from '../types';

/**
 * GET /stats/* — sadece SUPER_ADMIN ve ADMIN (backend @Roles). Dashboard
 * üzerinde ayrı sayfalar/cache invalidation olmadığı için staleTime 30s yeterli.
 */
export function statsOverviewOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.adminStats.overview(storeId),
    queryFn: () => adminAuthorizedFetch<StatsOverview>(`/stats/overview`),
    staleTime: 30_000,
  });
}

export function productsByOperatorOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.adminStats.productsByOperator(storeId),
    queryFn: () => adminAuthorizedFetch<ProductsByOperatorEntry[]>(`/stats/products-by-operator`),
    staleTime: 30_000,
  });
}

/**
 * GET /stats/most-viewed-products?limit=5&locale=en — backend locale default'u
 * 'tk', dolayısıyla admin ingilizce arayüzü için 'en' AÇIKÇA gönderilir (çevirisi
 * olmayan ürünlerde name 'Unknown' dönebilir).
 */
export function mostViewedProductsOptions(storeId: string, locale = 'en', limit = 5) {
  return queryOptions({
    queryKey: queryKeys.adminStats.mostViewed(storeId, locale),
    queryFn: () =>
      adminAuthorizedFetch<MostViewedProductEntry[]>(
        `/stats/most-viewed-products?limit=${limit}&locale=${locale}`,
      ),
    staleTime: 30_000,
  });
}

export function mostSearchedTermsOptions(storeId: string, limit = 5) {
  return queryOptions({
    queryKey: queryKeys.adminStats.mostSearched(storeId, limit),
    queryFn: () =>
      adminAuthorizedFetch<MostSearchedTermEntry[]>(`/stats/most-searched-terms?limit=${limit}`),
    staleTime: 30_000,
  });
}
