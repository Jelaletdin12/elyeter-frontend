'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { productListOptions } from '../api/queries';
import type { ProductListResponse } from '../types';

/**
 * Server Component'ten gelen `initialProductList` başlangıç/SEO içeriğidir
 * (ProductListResponseDto — { items, meta }, DÜZ DİZİ DEĞİL, bkz. STANDARDS.md
 * doğrulaması: GET /products sayfalanmış döner). Kullanıcı filtre/sıralama
 * değiştirdiğinde bu Client Component kendi TanStack query'sine geçer — URL
 * search param'a bağlı sonsuz kombinasyon Next.js Data Cache'e hiç girmez
 * (STANDARDS.md #4).
 */
export function CategoryFilters({
  categoryId,
  initialProductList,
}: {
  categoryId: string;
  initialProductList: ProductListResponse;
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  const { data, isFetching } = useQuery({
    ...productListOptions(storeId, { categoryId, minPrice, maxPrice }),
    // Kullanıcı henüz etkileşmediyse server'dan gelen SEO içeriğini kullan,
    // gereksiz bir ilk fetch tetikleme.
    enabled: hasInteracted,
    initialData: hasInteracted ? undefined : initialProductList,
  });

  const products = (data ?? initialProductList).items;

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          className="w-24 rounded-md border border-border px-2 py-1 text-sm"
          onChange={(e) => {
            setHasInteracted(true);
            setMinPrice(e.target.value ? Number(e.target.value) : undefined);
          }}
        />
        <input
          type="number"
          placeholder="Max"
          className="w-24 rounded-md border border-border px-2 py-1 text-sm"
          onChange={(e) => {
            setHasInteracted(true);
            setMaxPrice(e.target.value ? Number(e.target.value) : undefined);
          }}
        />
        {isFetching && <span className="text-xs text-muted-foreground">...</span>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-lg border border-border p-3" />
        ))}
      </div>
    </div>
  );
}
