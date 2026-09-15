'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ProductCard } from './ProductCard';

import { useAuthStore } from '@/stores/auth-store';
import { wishlistOptions } from '@/features/wishlist/api/queries';

import type { Product } from '@/features/products/types';

interface ProductGridProps {
  products: Product[];
  locale: string;
  title?: React.ReactNode;
}

export function ProductGrid({ products, locale, title = 'New arrivals' }: ProductGridProps) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: wishlist = [] } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-[0.18em] uppercase">
            Just added
          </p>

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        </div>

        <span className="text-muted-foreground hidden text-sm sm:block">
          {products.length} products
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 xl:gap-y-10">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            isWishlisted={wishlistIds.has(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
