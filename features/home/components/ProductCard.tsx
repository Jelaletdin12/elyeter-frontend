'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAddCartItemMutation } from '@/features/cart/api/mutations';
import { wishlistOptions } from '@/features/wishlist/api/queries';
import { useToggleWishlistMutation } from '@/features/wishlist/api/mutations';
import type { Product } from '@/features/products/types';

/**
 * ✅ Gerçek Product tipi — translations[]/variants[]/images[] üzerinden okunuyor
 * (mock'taki düz name/price/imageUrl alanları yerine). Hover'daki "Quick add"
 * ve kalp ikonu artık GERÇEK mutation'lara bağlı (useAddCartItemMutation,
 * useToggleWishlistMutation) — dekoratif değil, gerçekten sepete/wishlist'e
 * ekliyor. İlk variant + miktar 1 ile "hızlı ekle" — varyant seçimi gerektiren
 * ürünler için tam seçim ürün detay sayfasında (ProductVariantPicker).
 */
export function ProductCard({ product, locale }: { product: Product; locale: string }) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const translation = product.translations.find((t) => t.locale === locale) ?? product.translations[0];
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const firstVariant = product.variants[0];
  const availableQuantity = firstVariant?.inventory
    ? firstVariant.inventory.quantity - firstVariant.inventory.reservedQuantity
    : 0;
  const inStock = availableQuantity > 0;

  const { data: wishlist } = useQuery({ ...wishlistOptions(storeId), enabled: isAuthenticated });
  const isWishlisted = wishlist?.some((item) => item.productId === product.id) ?? false;
  const toggleWishlist = useToggleWishlistMutation(storeId);
  const addToCart = useAddCartItemMutation(storeId);

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to save items to your wishlist.');
      return;
    }
    toggleWishlist.mutate({ productId: product.id, isWishlisted });
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to add items to your cart.');
      return;
    }
    if (!firstVariant) return;
    addToCart.mutate(
      { productVariantId: firstVariant.id, quantity: 1 },
      { onSuccess: () => toast.success('Added to cart.') },
    );
  }

  return (
    <div className="group">
      <Link href={`/${locale}/products/${translation?.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-card bg-surface shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
          {primaryImage && (
            // eslint-disable-next-line @next/next/no-img-element -- gerçek entegrasyonda next/image + remotePatterns
            <img
              src={primaryImage.cardUrl}
              alt={translation?.name ?? ''}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}

          {!inStock && (
            <span className="absolute left-2 top-2 rounded-sm bg-ink/85 px-2 py-1 text-xs text-white">
              Out of stock
            </span>
          )}

          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label="Add to wishlist"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 hover:scale-110"
          >
            <Heart size={15} className={cn(isWishlisted ? 'fill-danger text-danger' : 'text-ink')} />
          </button>

          {inStock && firstVariant && (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={addToCart.isPending}
              className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/90 py-2 text-center text-xs font-medium text-white transition-transform duration-300 group-hover:translate-y-0 disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag size={13} /> {addToCart.isPending ? 'Adding…' : 'Quick add'}
              </span>
            </button>
          )}
        </div>

        <p className="mt-3 truncate text-sm text-ink">{translation?.name}</p>
        <p className="font-display text-base italic text-ink">{firstVariant?.price}</p>
      </Link>
    </div>
  );
}
