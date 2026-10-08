'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/stores/auth-store';
import { useCartItemQuantity } from '@/features/cart/hooks/useCartItemQuantity';
import { useToggleWishlistMutation } from '@/features/wishlist/api/mutations';

import type { Product } from '@/features/products/types';
import { brandTranslation } from '@/features/brands/types';

interface ProductCardProps {
  product: Product;
  locale: string;
  isWishlisted?: boolean;
  /**
   * "Sizin için" bölümündeki "Neden önerildi?" rozeti. Tanımlanırsa kartın
   * sol altında küçük bir pill olarak çizilir; öneri dışı kullanımlar için
   * doldurulmaz. (Öneri motorunun `recommendationReason`'ı backend tarafında
   * i18n resolve ETMEZ — label frontend'te message key'inden üretilir.)
   */
  reasonLabel?: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'tmt',
  maximumFractionDigits: 2,
});

function formatPrice(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return value;
  return currencyFormatter.format(num);
}

export function ProductCard({
  product,
  locale,
  isWishlisted = false,
  reasonLabel,
}: ProductCardProps) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const t = useTranslations('common');

  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const translation =
    product.translations.find((item) => item.locale === locale) ?? product.translations[0];

  const images = product.images.length > 0 ? product.images : [];

  // Temsilci varyant: önce STOKLU + en ucuz aktif varyant; stoklu yoksa
  // en ucuz aktif varyant; o da yoksa ilk varyant. Yalnızca variants[0]'a
  // bakmak, varyantları fiyat/stok bakımından sırasız gelen aramalarda
  // stoklu ürünü yanlışlıkla "Out of stock" göstermeye yol açar (Redmi
  // örneği: 128GB stok 0, 256GB stok 30 — ilki önde olurdu).
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const sellableVariants = activeVariants.filter(
    (variant) =>
      variant.inventory != null &&
      variant.inventory.quantity - variant.inventory.reservedQuantity > 0,
  );
  const cheapest = (variants: typeof product.variants) =>
    [...variants].sort((a, b) => Number(a.price) - Number(b.price))[0];
  const representativeVariant =
    cheapest(sellableVariants) ?? cheapest(activeVariants) ?? product.variants[0];

  const availableQuantity = representativeVariant?.inventory
    ? representativeVariant.inventory.quantity - representativeVariant.inventory.reservedQuantity
    : 0;

  const inStock = availableQuantity > 0;

  const price = representativeVariant ? Number(representativeVariant.price) : 0;
  const compareAtPrice = representativeVariant?.compareAtPrice
    ? Number(representativeVariant.compareAtPrice)
    : null;
  const discountPercent =
    (typeof representativeVariant?.discountPercent === 'number'
      ? representativeVariant.discountPercent
      : null) ??
    (compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null);

  const toggleWishlist = useToggleWishlistMutation(storeId);

  // Debounced ve optimistik sepet miktar yönetimi — her tıklamada istek gitmez,
  // ekstra GET isteklerini önler, UI 0ms gecikmeyle anında tepki verir.
  const {
    quantity,
    increment,
    decrement,
    isPending: isCartMutating,
    canIncrement,
    canDecrement,
  } = useCartItemQuantity({
    variantId: representativeVariant?.id ?? '',
    availableQuantity,
    onAuthRequired: () => toast.error(t('signInToCart')),
  });

  const productHref = `/${locale}/products/${translation?.slug}`;

  function handleWishlist() {
    if (!isAuthenticated) {
      toast.error(t('signInToSave'));
      return;
    }

    toggleWishlist.mutate({
      productId: product.id,
      isWishlisted,
    });
  }

  if (!translation || !representativeVariant) return null;

  return (
    <article className="group bg-card relative min-w-0 overflow-hidden rounded-md border">
      {/* IMAGE / CAROUSEL */}
      <div className="bg-muted relative aspect-square overflow-hidden">
        <Link
          href={productHref}
          className="absolute inset-0 z-10"
          aria-label={t('viewProduct', { name: translation.name })}
        />

        {images.length > 0 ? (
          <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="h-full w-full">
            <CarouselContent className="ml-0 h-full">
              {images.map((image, index) => (
                <CarouselItem key={image.id ?? index} className="h-full pl-0">
                  <div className="flex h-full items-center justify-center">
                    <img
                      src={image.cardUrl}
                      alt={translation.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {t('noImage')}
          </div>
        )}

        {/* DISCOUNT BADGE */}
        {discountPercent ? (
          <span className="pointer-events-none absolute top-0 left-0 z-20 rounded-br-xl bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            {discountPercent}% OFF
          </span>
        ) : null}

        {/* WISHLIST */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleWishlist}
          disabled={toggleWishlist.isPending}
          aria-label={isWishlisted ? t('removeFromList') : t('addToList')}
          className="bg-background/90 pointer-events-auto absolute top-3 right-3 z-30 size-9 rounded-full shadow-sm backdrop-blur-md transition hover:scale-105"
        >
          {toggleWishlist.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Heart
              className={cn(
                'size-4 transition-colors',
                isWishlisted &&
                  'fill-foreground text-foreground dark:fill-primary dark:text-primary',
              )}
            />
          )}
        </Button>

        {!inStock && (
          <span className="bg-background/90 text-foreground pointer-events-none absolute bottom-3 left-3 z-20 rounded-md px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur">
            {t('outOfStock')}
          </span>
        )}

        {/* "NASIL BULUNDU?" rozeti — sadece öneri grid'lerinde. Öneri motoru
            satılamayanı önermediği için stok pill'iyle çakışmaz. */}
        {reasonLabel && (
          <span className="bg-primary/90 pointer-events-none absolute bottom-3 left-3 z-20 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            {reasonLabel}
          </span>
        )}

        {/* DOT INDICATOR */}
        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1">
            {images.map((image, index) => (
              <span
                key={image.id ?? index}
                className={cn(
                  'h-1.5 rounded-full bg-white/60 transition-all',
                  index === activeIndex ? 'w-3 bg-white' : 'w-1.5',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* PRODUCT INFO */}
      <div className="p-4">
        <Link href={productHref} className="block">
          {product.category?.name && (
            <p className="text-[11px] font-medium tracking-wide text-orange-500 uppercase">
              {product.category.name}
            </p>
          )}
          <h3 className="text-foreground hover:text-foreground/70 line-clamp-2 text-sm leading-5 font-medium transition-colors">
            {translation.name}
          </h3>
          {product.brand && brandTranslation(product.brand, locale)?.name && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {brandTranslation(product.brand, locale)?.name}
            </p>
          )}
        </Link>

        <div className="mt-1.5 flex items-center gap-2">
          <p className="text-base font-semibold tracking-tight">{formatPrice(price)}</p>
          {compareAtPrice && compareAtPrice > price && (
            <p className="text-muted-foreground text-sm line-through">
              {formatPrice(compareAtPrice)}
            </p>
          )}
        </div>

        {/* CTA — Add to cart butonu kaldırıldı, her zaman inc/dec stepper kullanılıyor */}
        {/* CTA — quantity 0 ise "Add to cart", sepette varsa +/- stepper */}
        {!inStock ? (
          <Button
            type="button"
            variant="secondary"
            disabled
            className="mt-3 h-10 w-full rounded-md text-xs font-medium"
          >
            {t('outOfStock')}
          </Button>
        ) : isHydrating ? (
          <Button disabled className="mt-3 h-10 w-full rounded-md">
            <Loader2 className="size-4 animate-spin" />
          </Button>
        ) : quantity === 0 ? (
          <Button
            type="button"
            variant="default"
            className="mt-3 h-10 w-full rounded-md text-xs font-bold transition-all active:scale-[0.98]"
            onClick={increment}
            disabled={isCartMutating}
          >
            {isCartMutating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="size-3.5" />
                {t('addToCart')}
              </>
            )}
          </Button>
        ) : (
          <div className="border-border/80 bg-muted/30 hover:border-border mt-3 flex h-10 w-full items-center justify-between rounded-xl border p-1 transition-colors">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 rounded-md transition-all',
                !canDecrement
                  ? 'cursor-not-allowed opacity-30'
                  : 'text-foreground hover:bg-background hover:shadow-xs active:scale-95',
              )}
              onClick={decrement}
              disabled={!canDecrement || isCartMutating}
              aria-label={t('decreaseQuantity')}
            >
              <Minus className="size-3.5" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <span className="text-foreground min-w-[2ch] text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              {isCartMutating && (
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-8 rounded-md transition-all',
                !canIncrement
                  ? 'cursor-not-allowed opacity-30'
                  : 'text-foreground hover:bg-background hover:shadow-xs active:scale-95',
              )}
              onClick={increment}
              disabled={!canIncrement}
              aria-label={t('increaseQuantity')}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
