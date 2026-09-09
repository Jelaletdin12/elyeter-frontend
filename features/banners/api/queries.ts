import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Banner } from '../types';

/** Admin liste — GET /banners DÜZ DİZİ döner, sayfalama yok. */
export function bannerListOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.adminBanners.all(storeId),
    queryFn: () => adminAuthorizedFetch<Banner[]>('/banners'),
    staleTime: 30_000,
  });
}

/** Public ISR — anasayfa hero'su için. */
export async function getPublicBanners(): Promise<Banner[]> {
  return apiFetch<Banner[]>('/banners', {
    next: { revalidate: 300, tags: [dataCacheTags.banners(), dataCacheTags.home()] },
  });
}
