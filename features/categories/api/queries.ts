import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Category, CategoryListResponse, CategoryTreeNode } from '../types';

/** Admin liste — sayfalanmış, adminAuthorizedFetch (ayrı admin oturumu). */
export function categoryListOptions(storeId: string, page = 1) {
  return queryOptions({
    queryKey: queryKeys.adminCategories.all(storeId),
    queryFn: () => adminAuthorizedFetch<CategoryListResponse>(`/categories?page=${page}`),
    staleTime: 30_000,
  });
}

/** Admin hiyerarşi (tree) — parent selector ve ağaç görünümü için. Sadece aktif. */
export function adminCategoryTreeOptions(storeId: string) {
  return queryOptions({
    queryKey: [...queryKeys.adminCategories.all(storeId), 'tree'] as const,
    queryFn: () => adminAuthorizedFetch<CategoryTreeNode[]>(`/categories/tree`),
    staleTime: 30_000,
  });
}

/** Public ISR — kategori sayfası (app/[locale]/[categorySlug]/page.tsx) için. */
export async function getCategoryBySlug(locale: string, slug: string): Promise<Category> {
  return apiFetch<Category>(`/categories/slug/${locale}/${slug}`, {
    next: {
      revalidate: 300,
      tags: [dataCacheTags.category(locale, slug), dataCacheTags.categories()],
    },
  });
}

/** Public ISR — anasayfa kategori şeridi için. */
export async function getPublicCategories(limit = 8): Promise<CategoryListResponse> {
  return apiFetch<CategoryListResponse>(`/categories?limit=${limit}`, {
    next: { revalidate: 300, tags: [dataCacheTags.categories(), dataCacheTags.home()] },
  });
}
