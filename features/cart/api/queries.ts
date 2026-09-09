import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * STANDARDS.md #5: sepet/stok gibi hızlı değişen veri → staleTime:0,
 * refetchOnWindowFocus:true. `priceSnapshot` (schema.prisma CartItem) her
 * zaman `productVariant.price` ile karşılaştırılıp "fiyat değişti" uyarısı
 * gösterilir — sipariş her zaman GÜNCEL fiyattan oluşur.
 */

export type CartItemDto = {
  id: string;
  productVariantId: string;
  quantity: number;
  priceSnapshot: string;
  currentPrice: string;
  availableQuantity: number;
};

export type CartDto = { id: string; items: CartItemDto[] };

export function cartOptions(storeId: string) {
  return queryOptions({
    queryKey: queryKeys.cart.current(storeId),
    queryFn: () => authorizedFetch<CartDto>('/cart'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
