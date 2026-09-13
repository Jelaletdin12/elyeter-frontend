import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * STANDARDS.md #5: sepet/stok gibi hızlı değişen veri → staleTime:0,
 * refetchOnWindowFocus:true. `priceSnapshot` (schema.prisma CartItem) her
 * zaman `productVariant.price` ile karşılaştırılıp "fiyat değişti" uyarısı
 * gösterilir — sipariş her zaman GÜNCEL fiyattan oluşur.
 */

import type { ProductVariant, ProductTranslation } from '@/features/products/types';

/**
 * ⚠️ Swagger'da ProductVariantResponseDto'nun `product` alanı yok — ama cart
 * include'u (cart.service.ts CART_ITEM_INCLUDE) her zaman `product`'ı
 * translations ile birlikte getiriyor (curl doğrulandı, 2026-09-10).
 * `images` gelmez — o yüzden Product değil bu hafif şekil kullanılır.
 */
export type CartItemProduct = {
  id: string;
  isActive: boolean;
  categoryId: string;
  translations: ProductTranslation[];
};

export type CartItemDto = {
  id: string;
  productVariantId: string;
  productVariant: ProductVariant & { product: CartItemProduct };
  quantity: number;
  priceSnapshot: string;
  currentPrice: string;
  priceChanged: boolean;
  inStock: boolean;
  availableQuantity: number;
  isWishlisted: boolean;
};

export type CartDto = {
  id: string;
  items: CartItemDto[];
  subtotal: string;
  itemCount: number;
};

export function cartOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.cart.current(storeId),
    queryFn: () => authorizedFetch<CartDto>('/cart'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
