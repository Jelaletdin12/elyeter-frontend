import { queryOptions } from '@tanstack/react-query';
import { authorizedFetch } from '@/lib/auth/authorized-fetch';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * STANDARDS.md #5: sepet/stok gibi hızlı değişen veri → staleTime:0,
 * refetchOnWindowFocus:true. `priceSnapshot` (schema.prisma CartItem) her
 * zaman `productVariant.price` ile karşılaştırılıp "fiyat değişti" uyarısı
 * gösterilir — sipariş her zaman GÜNCEL fiyattan oluşur.
 */

import type { ProductVariant, ProductTranslation, ProductImage } from '@/features/products/types';
import type { BrandBrief } from '@/features/brands/types';

/**
 * ⚠️ Swagger'da ProductVariantResponseDto'nun `product` alanı yok — ama cart
 * include'u (cart.service.ts CART_ITEM_INCLUDE) her zaman `product`'ı
 * translations + category + brand + images ile birlikte getiriyor
 * (curl doğrulandı). `images[0]` her zaman primary görseldir
 * (PRODUCT_IMAGE_ORDER_BY — card/detail arası eşleşme garantisi).
 */
export type CartItemProduct = {
  id: string;
  isActive: boolean;
  categoryId: string;
  brandId: string | null;
  translations: ProductTranslation[];
  category: {
    id: string;
    translations: { locale: string; name: string }[];
  } | null;
  brand: BrandBrief | null;
  images: ProductImage[];
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
    staleTime: 1000 * 60 * 2, // 2 dakika boyunca taze sayılır, gereksiz GET isteklerini önler
    refetchOnWindowFocus: false, // Sekme değişimlerinde sürekli GET /cart atılmasını önler
  });
}
