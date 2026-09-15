import { useMutation } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { VisualSearchResult, VisualSearchReindexResult } from '../types';

/**
 * Görsel ürün arama. Public + opsiyonel auth endpoint: anonim kullanıcılar için
 * accessToken yoktur (authorizedFetch accessToken null → Bearer header yazılmaz),
 * oturumlu kullanıcılarda 401 alınırsa tek seferlik refresh ile isWishlisted
 * bilgisi doğru kalır. FormData'yı multipart gönderir — Content-Type'ı tarayıcı
 * kendi boundary'siyle set eder (apiFetch isFormData dalı).
 */
export function useVisualSearchMutation(storeId: string) {
  return useMutation({
    mutationKey: queryKeys.search.image(storeId),
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      return authorizedFetch<VisualSearchResult>('/products/search-by-image?limit=20', {
        method: 'POST',
        body: formData,
      });
    },
  });
}

/**
 * Admin tarafı: katalogdaki tüm ProductImage'ları tarayıp embedding'i
 * olmayanları indexler (idempotent — indexli olanlar `skipped` sayılır).
 * Backend'de @Roles(SUPER_ADMIN, ADMIN) — OPERATOR bu endpoint'e ulaşamaz;
 * buton `can('visualSearch.reindex')` ile aynı grubu gösterir (UX only).
 */
export function useVisualSearchReindexMutation() {
  return useMutation({
    mutationFn: () =>
      adminAuthorizedFetch<VisualSearchReindexResult>('/admin/products/visual-search/reindex', {
        method: 'POST',
      }),
  });
}
