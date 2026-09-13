import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';
import type { ProductTranslation } from '@/features/products/types';

/**
 * ⚠️ GET /wishlist'in response şeması Swagger'da yok (WishlistController'da
 * @ApiOkResponse yok) — backend wishlist.service.ts WISHLIST_ITEM_INCLUDE'tan
 * çıkarıldı (2026-09-10). `product.variants` sadece {id, sku, price, isActive}
 * seçilir — inventory GELMEZ. `price` Decimal serialization yüzünden string.
 */
export type WishlistItem = {
  id: string;
  wishlistId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    isActive: boolean;
    translations: ProductTranslation[];
    images: { cardUrl: string; isPrimary: boolean }[];
    variants: { id: string; sku: string; price: string; isActive: boolean }[];
  };
};

export function wishlistOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.wishlist.current(storeId),
    queryFn: () => authorizedFetch<WishlistItem[]>('/wishlist'),
    staleTime: 5 * 60 * 1000,
  });
}
