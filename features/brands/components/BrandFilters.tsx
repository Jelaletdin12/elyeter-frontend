'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { publicBrandListOptions } from '../api/queries';
import { BrandCard } from './BrandCard';
import type { Brand, BrandListResponse } from '../types';

/**
 * Public /brands sayfasının client filtreleme bileşeni. Server Component'ten
 * gelen `initialBrandList` SEO/ilk içeriktir (ISR). Kullanıcı arama yapıp
 * kategori seçince backend'in `search` + `categoryId` param'larına bağlanır
 * (CategoryFilters ile AYNI pattern — filtre kombinasyonları Next Data
 * Cache'e girmez, STANDARDS.md #4).
 */
export function BrandFilters({
  initialBrandList,
  locale,
  categoryOptions,
}: {
  initialBrandList: BrandListResponse;
  locale: string;
  categoryOptions: Array<{ id: string; label: string }>;
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data, isFetching } = useQuery({
    ...publicBrandListOptions(storeId, search, categoryId),
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialBrandList,
  });

  const brands = (data ?? initialBrandList).items;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setHasInteracted(true);
            setSearch(e.target.value);
          }}
          placeholder="Search brands…"
          className="border-border bg-card rounded-md border px-3 py-2 text-sm focus:outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setHasInteracted(true);
            setCategoryId(e.target.value);
          }}
          className="border-border bg-card rounded-md border px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All categories</option>
          {categoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {isFetching && <span className="text-muted-foreground text-xs">…</span>}
      </div>

      {brands.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">No brands found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand: Brand) => (
            <BrandCard key={brand.id} brand={brand} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}