import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Brand, BrandListResponse, CreateBrandInput, UpdateBrandInput } from '../types';

/**
 * ✅ DOĞRULANDI — gerçek backend curl çıktısından (2026-09-16):
 * POST/PATCH /brands/{id} translation'ları createMany/deleteMany+create
 * pattern'iyle yazıyor; slug/metaTitle/metaDescription boş bırakılırsa
 * backend name'den üretiyor (Category ile AYNI). Brand logoUrl zorunlu
 * değil; create formunda opsiyonel URL string'i girilir.
 */

/** Brand adı/slug değiştiğinde public brand sayfası + brand listesi +
 * home (marka rozeti görünebilir) + ürün kartları revalidate edilir. */
const BRAND_REVALIDATE_ENDPOINT = '/api/revalidate';

async function revalidatePublicTags(tags: string[]) {
  const res = await fetch(BRAND_REVALIDATE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) console.error('revalidatePublicTags failed', res.status, await res.text());
}

const BRAND_PUBLIC_TAGS = [dataCacheTags.brands(), dataCacheTags.home(), dataCacheTags.products()];

export function useCreateBrandMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBrandInput) =>
      adminAuthorizedFetch<Brand>(`/brands`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBrands.all(storeId) });
      // Oluşturulan brand'in TÜM dillerdeki slug'ları revalidate edilir.
      const tags = created.translations.map((t) => dataCacheTags.brand(t.locale, t.slug));
      await revalidatePublicTags([...new Set([...tags, ...BRAND_PUBLIC_TAGS])]);
    },
  });
}

export function useUpdateBrandMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, input }: { brandId: string; input: UpdateBrandInput }) =>
      adminAuthorizedFetch<Brand>(`/brands/${brandId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBrands.all(storeId) });
      const tags = updated.translations.map((t) => dataCacheTags.brand(t.locale, t.slug));
      await revalidatePublicTags([...new Set([...tags, ...BRAND_PUBLIC_TAGS])]);
    },
  });
}

export function useDeleteBrandMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string) =>
      adminAuthorizedFetch<void>(`/brands/${brandId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBrands.all(storeId) });
      await revalidatePublicTags(BRAND_PUBLIC_TAGS);
    },
  });
}
