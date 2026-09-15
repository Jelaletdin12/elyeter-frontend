'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { productListOptions } from '../api/queries';
import { availableQuantity, type Product, type ProductListResponse } from '../types';
import { ProductCard } from '@/features/home/components/ProductCard';
import { wishlistOptions } from '@/features/wishlist/api/queries';

/**
 * Server Component'ten gelen `initialProductList` başlangıç/SEO içeriğidir
 * (ProductListResponseDto — { items, meta }, DÜZ DİZİ DEĞİL, bkz. STANDARDS.md
 * doğrulaması: GET /products sayfalanmış döner). Kullanıcı filtre/sıralama
 * değiştirdiğinde bu Client Component kendi TanStack query'sine geçer — URL
 * search param'a bağlı sonsuz kombinasyon Next.js Data Cache'e hiç girmez
 * (STANDARDS.md #4).
 *
 * categoryId filtresi backend'te ALT AĞACI kapsar (getSubtreeIds) — bir ana
 * kategori seçilince alt kategorilerdeki ürünler de gelir (curl ile
 * doğrulandı, 2026-09-14).
 */
export function CategoryFilters({
  categoryId,
  initialProductList,
  locale,
}: {
  categoryId: string;
  initialProductList: ProductListResponse;
  locale: string;
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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

  const { data: wishlist = [] } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);

  const products = (data ?? initialProductList).items;
  const inStock = products.some((p) => p.variants.some((v) => availableQuantity(v) > 0));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          className="border-border w-24 rounded-md border px-2 py-1 text-sm"
          onChange={(e) => {
            setHasInteracted(true);
            setMinPrice(e.target.value ? Number(e.target.value) : undefined);
          }}
        />
        <input
          type="number"
          placeholder="Max"
          className="border-border w-24 rounded-md border px-2 py-1 text-sm"
          onChange={(e) => {
            setHasInteracted(true);
            setMaxPrice(e.target.value ? Number(e.target.value) : undefined);
          }}
        />
        {isFetching && <span className="text-muted-foreground text-xs">...</span>}
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">No products found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              isWishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        {products.length} products{inStock ? '' : ' — out of stock'}
      </p>
    </div>
  );
}
