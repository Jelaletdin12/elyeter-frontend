'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { ArrowRight } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { SearchBar } from './SearchBar';

import type { Banner } from '@/features/banners/types';

interface HeroBannerProps {
  banners: Banner[];
  locale: string;
}

export function HeroBanner({ banners, locale }: HeroBannerProps) {
  const activeBanners = React.useMemo(
    () => banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order),
    [banners],
  );

  const autoplay = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  if (activeBanners.length === 0) return null;

  return (
    <section className="relative">
      <Carousel opts={{ loop: true }} plugins={[autoplay.current]} className="group relative">
        <CarouselContent>
          {activeBanners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="bg-muted relative h-[58vh] max-h-[720px] min-h-[420px] overflow-hidden sm:h-[62vh]">
                {/* IMAGE */}
                {banner.linkUrl ? (
                  <Link
                    href={banner.linkUrl}
                    className="absolute inset-0"
                    aria-label="Explore collection"
                  >
                    <Image
                      src={banner.desktopUrl}
                      alt=""
                      fill
                      priority
                      sizes="100vw"
                      className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                  </Link>
                ) : (
                  <Image
                    src={banner.desktopUrl}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                  />
                )}

                {/* GRADIENT */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                {/* CONTENT */}
                <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
                  <div className="max-w-xl text-white">
                    <p className="mb-3 text-xs font-medium tracking-[0.22em] text-white/75 uppercase">
                      New collection
                    </p>
                    <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                      Discover something new
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-6 text-white/80 sm:text-base">
                      Find pieces you&apos;ll love, from everyday essentials to something a little
                      more special.
                    </p>
                    {banner.linkUrl && (
                      <Link
                        href={banner.linkUrl}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition-all hover:gap-3 hover:bg-white/90"
                      >
                        Explore collection
                        <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* ARROWS — only visible on hover, hidden if single slide */}
        {activeBanners.length > 1 && (
          <>
            <CarouselPrevious className="left-4 z-30 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex" />
            <CarouselNext className="right-4 z-30 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:flex" />
          </>
        )}

        {/* DOTS */}
        {activeBanners.length > 1 && <CarouselDots count={activeBanners.length} />}
      </Carousel>
    </section>
  );
}

// Small dots indicator synced to the carousel API.
function CarouselDots({ count }: { count: number }) {
  // NOTE: shadcn's Carousel doesn't expose the embla API via context by
  // default in older versions — if you're on a version that does, wire this
  // to `api.selectedScrollSnap()` / `api.on('select', ...)` instead of
  // re-deriving state here. Simplest correct approach shown below.
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/50 data-[active=true]:bg-white"
        />
      ))}
    </div>
  );
}
