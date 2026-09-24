'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ProductCard } from '@/features/home/components/ProductCard';
import { PagePagination } from '@/components/shared/PagePagination';
import { recommendationsProductsPageOptions } from '../api/queries';

import { useAuthStore } from '@/stores/auth-store';
import { wishlistOptions } from '@/features/wishlist/api/queries';

import type { RecommendationReason } from '../types';

const REASON_KEYS: Record<RecommendationReason, string> = {
  behavior: 'reasons.behavior',
  content: 'reasons.content',
  collaborative: 'reasons.collaborative',
  popularity: 'reasons.popularity',
  freshness: 'reasons.freshness',
};

/**
 * /recommendations "View all" sayfası — CLIENT (no-store), TanStack Query.
 * Oturumluysa backend kişisel forYou sıralamasının tam havuzunu sayfalar,
 * misafirde popülerlik fallback'i döner (bu yüzden sayfa auth gerektirmez).
 * reason pill'leri (neden önerildi) ürün kartında gösterilir.
 */
export function RecommendedProductsBrowser({ locale }: { locale: string }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [page, setPage] = useState(1);

  const t = useTranslations('recommendations');

  const { data, isFetching } = useQuery({
    ...recommendationsProductsPageOptions(storeId, page),
    placeholderData: (previous) => previous,
  });

  const { data: wishlist = [] } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.productId)), [wishlist]);

  const reasonLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    if (!data) return labels;
    for (const product of data.items) {
      labels[product.id] = t(REASON_KEYS[product.recommendationReason]);
    }
    return labels;
  }, [data, t]);

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <p className="text-muted-foreground text-sm">…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-7 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">
          {data.meta.total} products{isFetching ? ' …' : ''}
        </p>
      </div>

      {data.items.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">{t('empty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-6 xl:gap-y-10">
            {data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                isWishlisted={wishlistIds.has(product.id)}
                reasonLabel={reasonLabels[product.id]}
              />
            ))}
          </div>

          <div className="mt-10">
            <PagePagination
              currentPage={data.meta.page}
              totalPages={Math.max(1, data.meta.totalPages)}
              totalCount={data.meta.total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}