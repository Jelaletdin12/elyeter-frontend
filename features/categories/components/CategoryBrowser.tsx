'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { publicCategoryListOptions } from '../api/queries';
import { categoryTranslation } from '../types';
import type { Category, CategoryListResponse } from '../types';

/**
 * Public /categories dizini — backend `search` param'ıyla (translation adında
 * case-insensitive substring) client filtreleme. `initialCategoryList` ISR
 * ilk içerik; TanStack Query filtre kombinasyonlarını Next Data Cache'e girmez.
 */
export function CategoryBrowser({
  initialCategoryList,
  locale,
}: {
  initialCategoryList: CategoryListResponse;
  locale: string;
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isFetching } = useQuery({
    ...publicCategoryListOptions(storeId, search),
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialCategoryList,
  });

  const categories = (data ?? initialCategoryList).items;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setHasInteracted(true);
            setSearch(e.target.value);
          }}
          placeholder="Search categories…"
          className="border-border bg-card rounded-md border px-3 py-2 text-sm focus:outline-none"
        />
        {isFetching && <span className="text-muted-foreground text-xs">…</span>}
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">No categories found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((category: Category) => {
            const translation = categoryTranslation(category, locale);
            if (!translation) return null;
            return (
              <Link
                key={category.id}
                href={`/${locale}/${translation.slug}`}
                className="border-border bg-card hover:border-ink/30 group overflow-hidden rounded-md border transition-colors"
              >
                <div className="bg-background aspect-[3/2] w-full overflow-hidden">
                  {category.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.imageUrl}
                      alt={translation.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-sidebar-primary/10 flex h-full items-center justify-center">
                      <span className="text-muted-foreground text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium">{translation.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {category._count?.children ? `${category._count.children} categories` : '⋯'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}