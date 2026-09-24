'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

import { useAuthStore } from '@/stores/auth-store';
import {
  useAddCartItemMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/features/cart/api/mutations';
import { cartOptions } from '@/features/cart/api/queries';
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

  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    setActiveIndex(api.selectedScrollSnap());
    api.on('select', () => setActiveIndex(api.selectedScrollSnap()));
  }, [api]);

  const translation =
    product.translations.find((item) => item.locale === locale) ?? product.translations[0];

  const images = product.images.length > 0 ? product.images : [];

  const firstVariant = product.variants[0];

  const availableQuantity = firstVariant?.inventory
    ? firstVariant.inventory.quantity - firstVariant.inventory.reservedQuantity
    : 0;

  const inStock = availableQuantity > 0;

  const price = firstVariant ? Number(firstVariant.price) : 0;
  const compareAtPrice = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : null;
  const discountPercent =
    (typeof firstVariant?.discountPercent === 'number' ? firstVariant.discountPercent : null) ??
    (compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null);

  const toggleWishlist = useToggleWishlistMutation(storeId);
  const addToCart = useAddCartItemMutation(storeId);
  const updateCartItem = useUpdateCartItemMutation(storeId);
  const removeCartItem = useRemoveCartItemMutation(storeId);

  // Sepet cart endpoinden reel-time okunur (TanStack aynı queryKey'i dedupe
  // eder — gridde N tane kart olsa bile tek fetch). Bu, "sepetten dönünce kart
  // hâlâ Add to cart gösteriyor" hatasını kökten çözer: adet state değil,
  // backend'in sepetinden türer.
  const { data: cart } = useQuery({
    ...cartOptions(storeId),
    enabled: isAuthenticated,
  });

  const cartItem = cart?.items.find((item) => item.productVariantId === firstVariant?.id);
  const quantity = cartItem?.quantity ?? 0;

  const isCartMutating =
    addToCart.isPending || updateCartItem.isPending || removeCartItem.isPending;

  const productHref = `/${locale}/products/${translation?.slug}`;

  function handleWishlist() {
    if (!isAuthenticated) {
      toast.error('Sign in to save products.');
      return;
    }

    toggleWishlist.mutate({
      productId: product.id,
      isWishlisted,
    });
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast.error('Sign in to add products to your cart.');
      return;
    }

    if (!firstVariant || !inStock || quantity > 0) return;

    addToCart.mutate(
      { productVariantId: firstVariant.id, quantity: 1 },
      {
        onSuccess: () => {
          toast.success('Added to cart.');
        },
        onError: () => {
          toast.error('Could not add product to cart.');
        },
      },
    );
  }

  function handleQuantityChange(nextQuantity: number) {
    if (!firstVariant || !cartItem) return;

    if (nextQuantity > availableQuantity) return;

    if (nextQuantity <= 0) {
      // 1'den eksiye düşmek sepetten çıkarır (DELETE /cart/items/:id).
      removeCartItem.mutate(cartItem.id);
      return;
    }

    // PATCH /cart/items/:id — miktarı üzerine yazar (eklemez).
    updateCartItem.mutate({ cartItemId: cartItem.id, quantity: nextQuantity });
  }

  if (!translation || !firstVariant) return null;

  return (
    <article className="group bg-card relative min-w-0 overflow-hidden rounded-2xl border">
      {/* IMAGE / CAROUSEL */}
      <div className="bg-muted relative aspect-square overflow-hidden">
        <Link
          href={productHref}
          className="absolute inset-0 z-10"
          aria-label={`View ${translation.name}`}
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
            No image
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
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="bg-background/90 pointer-events-auto absolute top-3 right-3 z-30 size-9 rounded-full shadow-sm backdrop-blur-md transition hover:scale-105"
        >
          {toggleWishlist.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Heart
              className={cn(
                'size-4 transition-colors',
                isWishlisted && 'fill-foreground text-foreground dark:fill-primary dark:text-primary',
              )}
            />
          )}
        </Button>

        {!inStock && (
          <span className="bg-background/90 text-foreground pointer-events-none absolute bottom-3 left-3 z-20 rounded-md px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur">
            Out of stock
          </span>
        )}

        {/* "NASIL BULUNDU?" rozeti — sadece öneri grid'lerinde. Öneri motoru
            satılamayanı önermediği için stok pill'iyle çakışmaz. */}
        {reasonLabel && (
          <span className="bg-primary/90 text-white pointer-events-none absolute bottom-3 left-3 z-20 rounded-md px-2.5 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur">
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
          {product.brand && brandTranslation(product.brand, 'en')?.name && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {brandTranslation(product.brand, 'en')?.name}
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

        {/* CTA */}
        {!inStock ? (
          <Button
            type="button"
            variant="secondary"
            disabled
            className="mt-3 h-10 w-full "
          >
            Out of stock
          </Button>
        ) : quantity > 0 ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isCartMutating}
            >
              <Minus className="size-4" />
            </Button>
            <span className="text-sm font-medium">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 "
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isCartMutating || quantity >= availableQuantity}
            >
              {isCartMutating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </Button>
          </div>
        ) : isHydrating ? (
          <Button disabled className="mt-3 h-10 w-full">
            <Loader2 className="size-4 animate-spin" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || isCartMutating}
            className="mt-3 h-10 w-full text-white"
          >
            {addToCart.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}
            Add to cart
          </Button>
        )}
      </div>
    </article>
  );
}
