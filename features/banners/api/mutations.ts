import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Banner, CreateBannerInput, UpdateBannerInput } from '../types';

/**
 * FRONTEND_AGENTS.md #7 — dual invalidation, products/categories mutation'larıyla
 * AYNI pattern. Banner'lar sadece anasayfada göründüğü için tag seti daha dar
 * (banners + home).
 */

async function revalidatePublicTags(tags: string[]) {
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  });
}

export function useCreateBannerMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBannerInput) =>
      adminAuthorizedFetch<Banner>('/banners', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBanners.all(storeId) });
      await revalidatePublicTags([dataCacheTags.banners(), dataCacheTags.home()]);
    },
  });
}

export function useUpdateBannerMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bannerId, input }: { bannerId: string; input: UpdateBannerInput }) =>
      adminAuthorizedFetch<Banner>(`/banners/${bannerId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBanners.all(storeId) });
      await revalidatePublicTags([dataCacheTags.banners(), dataCacheTags.home()]);
    },
  });
}

export function useDeleteBannerMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerId: string) =>
      adminAuthorizedFetch<void>(`/banners/${bannerId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminBanners.all(storeId) });
      await revalidatePublicTags([dataCacheTags.banners(), dataCacheTags.home()]);
    },
  });
}
