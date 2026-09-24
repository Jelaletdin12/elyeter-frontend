'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { ProductGrid } from '@/features/home/components/ProductGrid';
import { homeRecommendationsOptions } from '../api/queries';

import { useAuthStore } from '@/stores/auth-store';

import type { RecommendationReason } from '../types';

const REASON_KEYS: Record<RecommendationReason, string> = {
  behavior: 'reasons.behavior',
  content: 'reasons.content',
  collaborative: 'reasons.collaborative',
  popularity: 'reasons.popularity',
  freshness: 'reasons.freshness',
};

export function ForYouSection({ locale }: { locale: string }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  const tHome = useTranslations('home');
  const tReasons = useTranslations('recommendations');

  const { data } = useQuery({
    ...homeRecommendationsOptions(storeId),
    enabled: isAuthenticated && !isHydrating,
  });

  const reasonLabels = useMemo(() => {
    const labels: Record<string, string> = {};

    if (!data) return labels;

    for (const product of data.forYou) {
      labels[product.id] = tReasons(
        REASON_KEYS[product.recommendationReason],
      );
    }

    return labels;
  }, [data, tReasons]);

  if (!data) return null;

  const brands =
    data.brands?.filter(
      (brand) => brand.translations.length > 0,
    ) ?? [];

  const brandName = (
    brand: (typeof brands)[number],
    lang: string,
  ) =>
    brand.translations.find((t) => t.locale === lang)?.name ??
    brand.translations[0]?.name ??
    '';

  const brandSlug = (
    brand: (typeof brands)[number],
    lang: string,
  ) =>
    brand.translations.find((t) => t.locale === lang)?.slug ??
    brand.translations[0]?.slug ??
    '';

  return (
    <>
      {/* FOR YOU */}
      {data.forYou.length > 0 && (
        <ProductGrid
          products={data.forYou}
          locale={locale}
          title={tHome('forYou')}
          reasonLabels={reasonLabels}
          viewAllHref={`/${locale}/recommendations`}
        />
      )}

      {/* BRANDS */}
      {brands.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14">
          {/* Header */}
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tHome('brandsEyebrow')}
              </p>

              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {tHome('brands')}
              </h2>
            </div>

            {/* View all */}
            <Link
              href={`/${locale}/brands`}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <span>{tHome('viewAll')}</span>

              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            </Link>
          </div>

          {/* Brand rail */}
          <div
            className="
              -mx-4 overflow-x-auto px-4 pb-3
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <div className="flex min-w-max gap-4">
              {brands.map((brand) => {
                const name = brandName(brand, locale);

                return (
                  <Link
                    key={brand.id}
                    href={`/${locale}/brand/${brandSlug(brand, locale)}`}
                    className="
                      group relative
                      flex w-[190px] shrink-0 flex-col
                      overflow-hidden rounded-3xl
                      border border-border/70
                      bg-card
                      p-5
                      shadow-sm
                      transition-all duration-300
                      hover:-translate-y-1
                      hover:border-primary/20
                      hover:shadow-lg hover:shadow-primary/5
                    "
                  >
                    {/* Decorative background */}
                    <div
                      className="
                        pointer-events-none absolute
                        -right-10 -top-10
                        size-28 rounded-full
                        bg-primary/[0.06]
                        transition-transform duration-500
                        group-hover:scale-150
                      "
                    />

                    {/* Logo */}
                    <div
                      className="
                        relative mb-5 flex size-16
                        items-center justify-center
                        overflow-hidden rounded-2xl
                        border border-border/60
                        bg-muted/40
                        transition-all duration-300
                        group-hover:border-primary/20
                        group-hover:bg-background
                      "
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={name}
                          width={48}
                          height={48}
                          className="
                            size-12 object-contain
                            transition-transform duration-300
                            group-hover:scale-110
                          "
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name + arrow */}
                    <div className="relative mt-auto flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight">
                          {name}
                        </p>

                        <span className="mt-1 block text-xs text-muted-foreground transition-colors group-hover:text-primary">
                          {tHome('exploreBrand')}
                        </span>
                      </div>

                      <div
                        className="
                          flex size-8 shrink-0 items-center justify-center
                          rounded-full
                          border border-border
                          bg-background
                          transition-all duration-300
                          group-hover:border-primary/20
                          group-hover:bg-primary
                          group-hover:text-primary-foreground
                        "
                      >
                        <ArrowUpRight
                          className="
                            size-4
                            transition-transform duration-300
                            group-hover:translate-x-0.5
                            group-hover:-translate-y-0.5
                          "
                          strokeWidth={1.8}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}