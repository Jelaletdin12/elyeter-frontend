'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import { wishlistOptions } from '../api/queries';
import { useToggleWishlistMutation } from '../api/mutations';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProductCard } from '@/features/home/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/features/products/types';

export function WishlistView() {
  const locale = useLocale();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAuthDialog = useUiStore((s) => s.openAuthDialog);

  const { data: items, isLoading } = useQuery({
    ...wishlistOptions(storeId),
    enabled: isAuthenticated,
  });

  // ProductCard'ın kendi heart toggle'ı zaten remove'u karşılıyor (isWishlisted: true
  // ile tekrar mutate etmek backend'de kaldırma anlamına geliyor) — burada ayrıca
  // bir onRemove prop'una gerek yok, ama grid genelinde tek bir mutation instance
  // kullanmak için burada tutuyoruz ve ProductCard'a geçmiyoruz; ProductCard kendi
  // useToggleWishlistMutation'ını çağırıyor zaten.

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Heart}
        title="Favorilerinizi görmek için giriş yapın"
        action={
          <button
            type="button"
            onClick={() => openAuthDialog('login')}
            className="text-sm underline"
          >
            Giriş yap
          </button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Favori listeniz boş"
        description="Beğendiğiniz ürünlerdeki kalp ikonuna dokunarak buraya ekleyin."
        action={
          <Link href={`/${locale}`} className="text-sm underline">
            Ürünlere göz at
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard
          key={item.productId}
          product={item.product as unknown as Product}
          locale={locale}
          isWishlisted
        />
      ))}
    </div>
  );
}
