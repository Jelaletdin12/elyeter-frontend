import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { adminAuthorizedFetch } from '@/lib/auth/admin-authorized-fetch';
import { queryKeys, dataCacheTags } from '@/lib/api/query-keys';
import type { Brand, BrandListResponse } from '../types';

/**
 * Admin liste — sayfalanmış + `search` (translation adında) + `categoryId`
 * (backend: o kategori subtree'sindeki ürünlerde kullanılan markalar).
 */
export function brandListOptions(storeId: string, page = 1, search = '', categoryId = '') {
  return queryOptions({
    queryKey: [...queryKeys.adminBrands.all(storeId), 'list', page, search, categoryId] as const,
    queryFn: () =>
      adminAuthorizedFetch<BrandListResponse>(
        `/brands?page=${page}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ''}${
          categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''
        }`,
      ),
    staleTime: 30_000,
  });
}

/** Public ISR — brand listesi (/brands sayfası). */
export async function getPublicBrands(limit = 50): Promise<BrandListResponse> {
  return apiFetch<BrandListResponse>(`/brands?limit=${limit}`, {
    next: { revalidate: 300, tags: [dataCacheTags.brands(), dataCacheTags.home()] },
  });
}

/** Public ISR — tekil brand sayfası (app/[locale]/brand/[slug]). */
export async function getBrandBySlug(locale: string, slug: string): Promise<Brand> {
  return apiFetch<Brand>(`/brands/slug/${locale}/${slug}`, {
    next: {
      revalidate: 300,
      tags: [dataCacheTags.brand(locale, slug), dataCacheTags.brands()],
    },
  });
}

/** Kategori alt sayfası sol paneli için: o kategori subtree'sindeki aktif markalar. */
export async function getBrandsByCategory(categoryId: string): Promise<BrandListResponse> {
  return apiFetch<BrandListResponse>(`/brands?categoryId=${categoryId}`, {
    next: { revalidate: 300, tags: [dataCacheTags.brands()] },
  });
}

/**
 * Kategori ürün sayfasının filtre paneli için marka query'si — backend
 * GET /brands?categoryId='i (o kategori subtree'sinde ürünü olan markalar)
 * TanStack Query ile çeker. Client-side, Next Data Cache'e girmez.
 */
export function brandsByCategoryOptions(storeId: string, categoryId: string) {
  return queryOptions({
    queryKey: [...queryKeys.brands.all(storeId), 'by-category', categoryId] as const,
    queryFn: () =>
      apiFetch<BrandListResponse>(`/brands?categoryId=${encodeURIComponent(categoryId)}&limit=100`),
    staleTime: 60_000,
  });
}

/**
 * Client'ta marka listesi filtreleme — backend `search` + `categoryId` param'larını
 * kullanır (public /brands sayfasının BrandFilters bileşeni). TanStack Query +
 * apiFetch (client tarafı aynı-origin proxy'den geçer, bkz. CategoryFilters pattern).
 * Bu filtre kombinasyonları Next Data Cache'e GİRMEZ (STANDARDS.md #4).
 */
export function publicBrandListOptions(storeId: string, search: string, categoryId: string) {
  return queryOptions({
    queryKey: [...queryKeys.brands.list(storeId), search, categoryId] as const,
    queryFn: () =>
      apiFetch<BrandListResponse>(
        `/brands?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}${
          categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''
        }`,
      ),
    staleTime: 60_000,
  });
}

/**
 * Admin brand option'ları — ProductForm brand Select'i için tüm aktif markalar.
 * sayfalama yok (max 200-300 marka bekleniyor).
 */
export function brandOptions(storeId: string) {
  return queryOptions({
    queryKey: [...queryKeys.adminBrands.all(storeId), 'options'] as const,
    queryFn: () => adminAuthorizedFetch<BrandListResponse>('/brands?limit=500'),
    staleTime: 60_000,
    select: (data) => data.items.filter((b) => b.isActive),
  });
}
