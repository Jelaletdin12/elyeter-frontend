/**
 * FRONTEND_AGENTS.md #2: Backend DTO tipleri elle kopyalanmaz —
 * types/generated/api.ts, gerçek backend Swagger şemasından üretildi.
 * Bu dosya sadece feature içinde kullanılacak isimlere ince bir alias veriyor.
 *
 * ✅ TAMAMEN DOĞRULANDI (curl, 2026-09-08) — ürün create/list/detail/variant/
 * stok akışının tamamı gerçek response'larla test edildi.
 *
 * 🔧 DÜZELTME: generated dosyada `attributes: Record<string, never>` olarak
 * geldi (openapi-typescript'in boş `{}` örneğinden yanlış çıkarım yapması) —
 * bu tip HİÇBİR key'e izin vermiyor, ama backend gerçekte
 * `{color:"Red",size:"L"}` gibi serbest key-value kabul ediyor (curl ile
 * doğrulandı). Burada Omit + intersection ile düzeltiliyor — generated
 * dosyanın kendisi ELLE DÜZENLENMİYOR (bir sonraki generate:types'ta
 * silineceği için oraya düzeltme yazmak kalıcı olmaz).
 */
import type { components } from '@/types/generated/api';

export type ProductTranslation = Omit<components['schemas']['ProductTranslationResponseDto'], 'description'> & {
  description?: string;
};
export type ProductImage = components['schemas']['ProductImageResponseDto'];
export type ProductInventory = components['schemas']['InventoryResponseDto'];

export type ProductVariant = Omit<
  components['schemas']['ProductVariantResponseDto'],
  'attributes' | 'compareAtPrice' | 'discountPercent'
> & {
  attributes: Record<string, string>;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
};

export type Product = Omit<components['schemas']['ProductResponseDto'], 'translations' | 'variants'> & {
  translations: ProductTranslation[];
  variants: ProductVariant[];
  /** API response'unda gelen populate edilmiş kategori — generated tipte sadece categoryId var */
  category?: {
    id: string;
    name?: string;
    translations: { locale: string; name: string }[];
  };
};

export type ProductListResponse = Omit<components['schemas']['ProductListResponseDto'], 'items'> & {
  items: Product[];
};
export type ProductPaginationMeta = components['schemas']['ProductPaginationMetaDto'];

export type CreateProductInput = components['schemas']['CreateProductDto'];
export type UpdateProductInput = Omit<components['schemas']['UpdateProductDto'], 'isActive'> & {
  isActive?: boolean;
};

export type CreateProductVariantInput = Omit<
  components['schemas']['CreateProductVariantDto'],
  'attributes'
> & { attributes?: Record<string, string> };

export type StockAdjustmentInput = components['schemas']['StockAdjustmentDto'];

/**
 * ⚠️ Swagger'da response şeması dokümante değil — gerçek curl çıktısından
 * (2026-09-08) elle çıkarıldı. GET .../stock-movements sayfalanmış döner.
 */
export type StockMovement = {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reason: string | null;
  relatedOrderId: string | null;
  performedById: string;
  createdAt: string;
};

export type StockMovementListResponse = {
  items: StockMovement[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function productTranslation(product: Product, locale: string): ProductTranslation | undefined {
  return product.translations.find((t) => t.locale === locale) ?? product.translations[0];
}

export function availableQuantity(variant: ProductVariant): number {
  if (!variant.inventory) return 0;
  return variant.inventory.quantity - variant.inventory.reservedQuantity;
}
