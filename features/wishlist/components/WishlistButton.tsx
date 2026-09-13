'use client';

import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { wishlistOptions } from '../api/queries';
import { useToggleWishlistMutation } from '../api/mutations';

/**
 * STANDARDS.md #5: Server Component'ten (ürün detay ISR sayfası) prop
 * olarak "isWishlisted" ALINMAZ — server private/kişisel veriyi bilmez
 * (ISR sayfası tüm ziyaretçiler için aynı HTML'i üretir). Bu component
 * kendi kısa-staleTime'lı TanStack query'siyle wishlist durumunu bağımsız
 * okur/yazar.
 */
export function WishlistButton({ productId }: { productId: string }) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: wishlist } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  const toggle = useToggleWishlistMutation(storeId);

  const isWishlisted = wishlist?.some((item) => item.productId === productId) ?? false;

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      aria-pressed={isWishlisted}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ productId, isWishlisted })}
      className="rounded-full border border-border p-2 disabled:opacity-50"
    >
      <Heart className={isWishlisted ? 'fill-destructive text-destructive' : ''} size={18} />
    </button>
  );
}
