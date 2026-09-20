'use client';

import { useEffect, useState } from 'react';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { ProductImage } from '../types';

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
    api.on('select', () => setActiveIndex(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    const primaryIndex = images.findIndex((img) => img.isPrimary);
    if (primaryIndex >= 0) {
      api?.scrollTo(primaryIndex, true);
    }
    // sadece ilk mount'ta primary'e git
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center rounded-2xl border text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-2xl border">
        <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="h-full w-full">
          <CarouselContent className="ml-0 h-full">
            {images.map((image) => (
              <CarouselItem key={image.id} className="h-full pl-0">
                <div className="flex h-full items-center justify-center p-6">
                  <img src={image.detailUrl} alt={alt} className="h-full w-full object-contain" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1">
            {images.map((image, index) => (
              <span
                key={image.id}
                className={cn(
                  'bg-foreground/30 h-1.5 rounded-full transition-all',
                  index === activeIndex ? 'bg-foreground w-4' : 'w-1.5',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl border transition',
                index === activeIndex
                  ? 'border-primary ring-primary ring-1'
                  : 'border-border hover:border-foreground/30',
              )}
            >
              <img src={image.cardUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
