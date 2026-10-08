'use client';

import { useMemo, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
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

type Brand = {
  id: string;
  logoUrl?: string | null;
  translations: Array<{
    locale: string;
    name: string;
    slug: string;
  }>;
};

export function ForYouSection({ locale }: { locale: string }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  const tHome = useTranslations('home');
  const tReasons = useTranslations('recommendations');

  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const { data } = useQuery({
    ...homeRecommendationsOptions(storeId),
    enabled: isAuthenticated && !isHydrating,
  });

  const reasonLabels = useMemo(() => {
    const labels: Record<string, string> = {};

    if (!data) return labels;

    for (const product of data.forYou) {
      labels[product.id] = tReasons(REASON_KEYS[product.recommendationReason]);
    }

    return labels;
  }, [data, tReasons]);

  if (!data) return null;

  const brands =
    (data.brands as Brand[] | undefined)?.filter((brand) => brand.translations.length > 0) ?? [];

  const brandName = (brand: Brand, lang: string) =>
    brand.translations.find((translation) => translation.locale === lang)?.name ??
    brand.translations[0]?.name ??
    '';

  const brandSlug = (brand: Brand, lang: string) =>
    brand.translations.find((translation) => translation.locale === lang)?.slug ??
    brand.translations[0]?.slug ??
    '';

  const handlePointerEnter = (brandId: string) => {
    setActiveBrand(brandId);
  };

  const handlePointerLeave = () => {
    setActiveBrand(null);
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>, brandId: string) => {
    /*
     * We don't use heavy JS mouse tracking here.
     * The magnetic feeling comes from the active/neighbor states,
     * which keeps the component smooth even on weaker devices.
     */
    if (event.pointerType === 'mouse') {
      setActiveBrand(brandId);
    }
  };

  return (
    <>
      {/* ====================================================== */}
      {/* FOR YOU */}
      {/* ====================================================== */}

      {data.forYou.length > 0 && (
        <ProductGrid
          products={data.forYou}
          locale={locale}
          title={tHome('forYou')}
          reasonLabels={reasonLabels}
          viewAllHref={`/${locale}/recommendations`}
        />
      )}

      {/* ====================================================== */}
      {/* MAGNETIC BRANDS */}
      {/* ====================================================== */}

      {brands.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:py-14">
          {/* -------------------------------------------------- */}
          {/* HEADER */}
          {/* -------------------------------------------------- */}

          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Sparkles className="text-primary size-3.5" />

                <p className="text-muted-foreground text-[10px] font-medium tracking-[0.22em] uppercase">
                  {tHome('brandsEyebrow')}
                </p>
              </div>

              <h2 className="text-foreground text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {tHome('brands')}
              </h2>
            </div>

            <Link
              href={`/${locale}/brands`}
              className="group border-border/80 bg-background/70 text-foreground hover:border-primary/30 hover:bg-primary/[0.05] hover:text-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-300"
            >
              <span>{tHome('viewAll')}</span>

              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={1.8}
              />
            </Link>
          </div>

          {/* -------------------------------------------------- */}
          {/* MAGNETIC RAIL */}
          {/* -------------------------------------------------- */}

          <div
            className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden"
            onPointerLeave={() => setActiveBrand(null)}
          >
            <div className="flex min-w-max justify-start gap-3 lg:min-w-0 lg:justify-between">
              {brands.map((brand, index) => {
                const name = brandName(brand, locale);
                const slug = brandSlug(brand, locale);
                const initial = name.charAt(0).toUpperCase();

                const isActive = activeBrand === brand.id;

                const activeIndex = brands.findIndex((item) => item.id === activeBrand);

                const distance = activeIndex === -1 ? 0 : Math.abs(index - activeIndex);

                const isNeighbor = activeIndex !== -1 && distance === 1 && !isActive;

                const isFar = activeIndex !== -1 && distance > 1 && !isActive;

                const cardStyle = {
                  '--brand-flex': isActive ? '1.32' : '1',
                } as CSSProperties;

                return (
                  <Link
                    key={brand.id}
                    href={`/${locale}/brand/${slug}`}
                    style={cardStyle}
                    onPointerEnter={() => setActiveBrand(brand.id)}
                    onPointerMove={(event) => handlePointerMove(event, brand.id)}
                    onFocus={() => setActiveBrand(brand.id)}
                    className={`group bg-card relative flex h-[238px] min-w-[220px] flex-[var(--brand-flex)] shrink-0 flex-col overflow-hidden rounded-[24px] border transition-[flex,transform,opacity,box-shadow,border-color] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[245px] sm:min-w-[235px] lg:min-w-0 ${
                      isActive
                        ? `border-primary/25 -translate-y-0.5 shadow-[0_16px_40px_-22px_hsl(var(--primary)/0.3)]`
                        : `border-border/70 shadow-sm`
                    } ${isNeighbor ? `scale-[0.992] opacity-[0.95]` : ''} ${
                      isFar ? `scale-[0.985] opacity-[0.8]` : ''
                    } motion-reduce:transform-none motion-reduce:transition-none`}
                  >
                    {/* ================================================= */}
                    {/* BACKGROUND */}
                    {/* ================================================= */}

                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      {/* Soft background */}
                      <div
                        className={`from-primary/[0.055] to-primary/[0.02] absolute inset-0 bg-gradient-to-br via-transparent transition-opacity duration-500 ${
                          isActive ? 'opacity-100' : 'opacity-60'
                        } `}
                      />

                      {/* Small glow */}
                      <div
                        className={`bg-primary/[0.07] absolute -top-12 -right-12 size-28 rounded-full blur-2xl transition-all duration-600 ${
                          isActive ? 'bg-primary/[0.11] scale-125' : ''
                        } `}
                      />

                      {/* Small watermark */}
                      <span
                        className={`text-foreground/[0.018] absolute top-[48%] -right-1 -translate-y-1/2 text-[115px] leading-none font-bold tracking-[-0.1em] transition-all duration-500 select-none ${
                          isActive ? 'text-primary/[0.035]' : ''
                        } `}
                      >
                        {initial}
                      </span>
                    </div>

                    {/* ================================================= */}
                    {/* TOP META */}
                    {/* ================================================= */}

                    <div className="relative z-20 flex items-center justify-between px-4 pt-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full transition-all duration-300 ${
                            isActive
                              ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.65)]'
                              : 'bg-muted-foreground/30'
                          } `}
                        />

                        <span className="text-muted-foreground text-[9px] font-medium tracking-[0.16em] uppercase">
                          {tHome('exploreBrand')}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div
                        className={`flex size-8 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-400 ${
                          isActive
                            ? `border-primary/20 bg-primary text-primary-foreground`
                            : `border-border/60 bg-background/65 text-foreground`
                        } `}
                      >
                        <ArrowUpRight
                          className={`size-3.5 transition-transform duration-400 ${
                            isActive ? 'translate-x-0.5 -translate-y-0.5' : ''
                          } `}
                          strokeWidth={1.8}
                        />
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* LOGO */}
                    {/* ================================================= */}

                    <div className="relative flex flex-1 items-center justify-center">
                      {/* Halo */}
                      <div
                        className={`bg-primary/[0.025] absolute h-full w-full rounded-full blur-xl transition-all duration-500 ${
                          isActive ? 'bg-primary/[0.05] size-[110px]' : ''
                        } `}
                      />

                      {/* Logo stage */}
                      <div
                        className={`border-border/60 bg-background/80 relative z-10 flex size-[90px] items-center justify-center overflow-hidden rounded-[22px] border shadow-[0_10px_25px_-15px_hsl(var(--foreground)/0.2)] backdrop-blur-md transition-all duration-500 ${
                          isActive
                            ? `border-primary/20 size-[88px] rounded-[25px] shadow-[0_15px_30px_-15px_hsl(var(--primary)/0.2)]`
                            : ''
                        } `}
                      >
                        {brand.logoUrl ? (
                          <Image
                            src={brand.logoUrl}
                            alt={name}
                            width={64}
                            height={64}
                            className={`size-[54px] object-contain transition-transform duration-500 ${
                              isActive ? 'size-[62px] scale-105' : ''
                            } `}
                          />
                        ) : (
                          <span
                            className={`text-primary font-semibold ${
                              isActive ? 'text-3xl' : 'text-2xl'
                            } `}
                          >
                            {initial}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* BOTTOM CONTENT */}
                    {/* ================================================= */}

                    <div className="relative z-20 px-4 pb-4">
                      <h3
                        className={`truncate font-semibold tracking-[-0.02em] transition-all duration-300 ${
                          isActive ? 'text-[17px]' : 'text-[16px]'
                        } `}
                      >
                        {name}
                      </h3>

                      <p
                        className={`mt-0.5 text-xs transition-colors duration-300 ${
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        } `}
                      >
                        {tHome('exploreBrand')}
                      </p>

                      {/* Magnetic indicator */}
                      <div className="bg-border/50 mt-3 h-px w-full overflow-hidden">
                        <div
                          className={`bg-primary h-full transition-all duration-500 ${
                            isActive ? 'w-full' : 'w-0'
                          } `}
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
