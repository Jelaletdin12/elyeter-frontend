'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ProductCard } from './ProductCard';

import { useAuthStore } from '@/stores/auth-store';
import { wishlistOptions } from '@/features/wishlist/api/queries';

import type { Product } from '@/features/products/types';

interface ProductGridProps {
  products: Product[];
  locale: string;
  title?: React.ReactNode;
  /**
   * Sağ üstte "View all" bağlantısı gösterir (bkz. forYou → /recommendations).
   * Verilmezse mevcut gibi ürün sayısı metni görünür.
   */
  viewAllHref?: string;
  /**
   * Ürün kartları üzerinde gösterilecek "Neden önerildi?" rozetleri —
   * productId → label. Yalnızca öneri bölümleri doldurur, diğer grid'ler
   * doldurmadığında kartlar değişmez (geriyedönük uyumlu).
   */
  reasonLabels?: Record<string, string>;
}

export function ProductGrid({
  products,
  locale,
  title = 'New arrivals',
  viewAllHref,
  reasonLabels,
}: ProductGridProps) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const t = useTranslations('home');

  const { data: wishlist = [] } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-[0.18em] uppercase">
            Just added
          </p>

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        </div>

        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={1.8}
            />
          </Link>
        ) : (
          <span className="text-muted-foreground hidden text-sm sm:block">
            {products.length} products
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 xl:gap-y-10">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            isWishlisted={wishlistIds.has(product.id)}
            reasonLabel={reasonLabels?.[product.id]}
          />
        ))}
      </div>
    </section>
  );
}
