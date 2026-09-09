'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAddCartItemMutation } from '@/features/cart/api/mutations';
import type { ProductVariant } from '../types';

/**
 * Her ürünün en az bir varyantı var, fiyat/stok varyant seviyesinde
 * (schema.prisma). Bu component varyant seçip POST /cart/items'a
 * (productVariantId + quantity) gönderiyor — useAddCartItemMutation
 * (features/cart/api/mutations.ts) üzerinden, sepet cache'i otomatik
 * invalidate oluyor.
 */
export function ProductVariantPicker({
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);

  const addItem = useAddCartItemMutation(storeId);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const availableQuantity = selectedVariant?.inventory
    ? selectedVariant.inventory.quantity - selectedVariant.inventory.reservedQuantity
    : 0;
  const isOutOfStock = availableQuantity <= 0;

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => setSelectedVariantId(variant.id)}
              className={
                variant.id === selectedVariantId
                  ? 'rounded-md border-2 border-primary px-3 py-1.5 text-sm'
                  : 'rounded-md border border-line px-3 py-1.5 text-sm'
              }
            >
              {Object.values(variant.attributes as Record<string, string>).join(' / ') ||
                variant.sku}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <p className="text-xl font-semibold">{selectedVariant?.price}</p>
        {isOutOfStock ? (
          <span className="text-sm text-destructive">Out of stock</span>
        ) : (
          <span className="text-xs text-ink-muted">{availableQuantity} available</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={availableQuantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-16 rounded-md border border-line px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={!isAuthenticated || isOutOfStock || addItem.isPending || !selectedVariant}
          onClick={() =>
            selectedVariant && addItem.mutate({ productVariantId: selectedVariant.id, quantity })
          }
          className="rounded-md bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {addItem.isPending ? '...' : 'Add to cart'}
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-ink-muted">Sign in to add items to your cart.</p>
      )}
    </div>
  );
}
