'use client';

import { useMemo, useState } from 'react';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAddCartItemMutation } from '@/features/cart/api/mutations';
import type { ProductVariant } from '../types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatPrice(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(num) ? value : currencyFormatter.format(num);
}

function variantLabel(variant: ProductVariant) {
  const attrs = Object.values(variant.attributes as Record<string, string>).join(' / ');
  return attrs || variant.sku;
}

/**
 * Her ürünün en az bir varyantı var, fiyat/stok varyant seviyesinde
 * (schema.prisma). Bu component varyant seçip POST /cart/items'a
 * (productVariantId + quantity) gönderiyor — useAddCartItemMutation
 * (features/cart/api/mutations.ts) üzerinden, sepet cache'i otomatik
 * invalidate oluyor.
 */
export function ProductVariantPicker({ variants }: { variants: ProductVariant[] }) {
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
  const isLowStock =
    !isOutOfStock && availableQuantity <= (selectedVariant?.inventory?.lowStockThreshold ?? 0);

  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) =>
      Object.keys(v.attributes as Record<string, string>).forEach((k) => keys.add(k)),
    );
    return Array.from(keys);
  }, [variants]);

  function handleSelectVariant(id: string) {
    setSelectedVariantId(id);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast.error('Sign in to add products to your cart.');
      return;
    }
    if (!selectedVariant || isOutOfStock) return;

    addItem.mutate(
      { productVariantId: selectedVariant.id, quantity },
      {
        onSuccess: () => toast.success('Added to cart.'),
        onError: () => toast.error('Could not add product to cart.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* PRICE */}
      <div className="flex items-center gap-2">
        <p className="text-2xl font-semibold tracking-tight">
          {selectedVariant && formatPrice(selectedVariant.price)}
        </p>
        {selectedVariant?.compareAtPrice && (
          <p className="text-muted-foreground text-base line-through">
            {formatPrice(selectedVariant.compareAtPrice)}
          </p>
        )}
      </div>

      {/* VARIANT SWATCHES */}
      {variants.length > 1 && (
        <div className="space-y-3">
          {attributeKeys.length > 0 ? (
            attributeKeys.map((key) => (
              <div key={key} className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium capitalize">{key}</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const value = (variant.attributes as Record<string, string>)[key];
                    if (!value) return null;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleSelectVariant(variant.id)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm transition',
                          variant.id === selectedVariantId
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border text-foreground hover:border-foreground/30',
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelectVariant(variant.id)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition',
                    variant.id === selectedVariantId
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-foreground hover:border-foreground/30',
                  )}
                >
                  {variantLabel(variant)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STOCK STATUS */}
      <p
        className={cn(
          'text-xs font-medium',
          isOutOfStock
            ? 'text-destructive'
            : isLowStock
              ? 'text-amber-600'
              : 'text-muted-foreground',
        )}
      >
        {isOutOfStock
          ? 'Out of stock'
          : isLowStock
            ? `Only ${availableQuantity} left`
            : `${availableQuantity} available`}
      </p>

      {/* QUANTITY + ADD TO CART */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-l-xl rounded-r-none"
            disabled={isOutOfStock || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-l-none rounded-r-xl"
            disabled={isOutOfStock || quantity >= availableQuantity}
            onClick={() => setQuantity((q) => Math.min(availableQuantity, q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          type="button"
          className="h-10 flex-1 rounded-xl"
          disabled={!isAuthenticated || isOutOfStock || addItem.isPending || !selectedVariant}
          onClick={handleAddToCart}
        >
          {addItem.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          {isOutOfStock ? 'Out of stock' : 'Add to cart'}
        </Button>
      </div>

      {!isAuthenticated && (
        <p className="text-muted-foreground text-xs">Sign in to add items to your cart.</p>
      )}
    </div>
  );
}
