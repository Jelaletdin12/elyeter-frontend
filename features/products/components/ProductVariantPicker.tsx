'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAddCartItemMutation } from '@/features/cart/api/mutations';

import type { ProductVariant } from '../types';

interface ProductVariantPickerProps {
  variants: ProductVariant[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatPrice(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value;

  return Number.isNaN(num)
    ? String(value)
    : currencyFormatter.format(num);
}

function normalizeAttributeName(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProductVariantPicker({
  variants,
}: ProductVariantPickerProps) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );

  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? '',
  );

  const [quantity, setQuantity] = useState(1);

  const addItem = useAddCartItemMutation(storeId);

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId,
  );

  const availableQuantity = selectedVariant?.inventory
    ? Math.max(
        0,
        selectedVariant.inventory.quantity -
          selectedVariant.inventory.reservedQuantity,
      )
    : 0;

  const isOutOfStock = availableQuantity <= 0;

  const isLowStock =
    !isOutOfStock &&
    availableQuantity <=
      (selectedVariant?.inventory?.lowStockThreshold ?? 0);

  const attributeGroups = useMemo(() => {
    const groups = new Map<string, string[]>();

    variants.forEach((variant) => {
      const attributes = variant.attributes as Record<
        string,
        string
      >;

      Object.entries(attributes).forEach(([key, value]) => {
        if (!groups.has(key)) {
          groups.set(key, []);
        }

        const values = groups.get(key)!;

        if (!values.includes(value)) {
          values.push(value);
        }
      });
    });

    return Array.from(groups.entries()).map(([key, values]) => ({
      key,
      values,
    }));
  }, [variants]);

  const selectedAttributes = useMemo(() => {
    return (
      (selectedVariant?.attributes as Record<string, string>) ?? {}
    );
  }, [selectedVariant]);

  const discountPercentage = useMemo(() => {
    if (!selectedVariant?.compareAtPrice) {
      return null;
    }

    const price = Number(selectedVariant.price);
    const compareAt = Number(selectedVariant.compareAtPrice);

    if (
      !Number.isFinite(price) ||
      !Number.isFinite(compareAt) ||
      compareAt <= price
    ) {
      return null;
    }

    return Math.round(((compareAt - price) / compareAt) * 100);
  }, [selectedVariant]);

  function selectAttribute(
    attributeKey: string,
    value: string,
  ) {
    const candidate = variants.find((variant) => {
      const attributes = variant.attributes as Record<
        string,
        string
      >;

      if (attributes[attributeKey] !== value) {
        return false;
      }

      return Object.entries(selectedAttributes).every(
        ([key, selectedValue]) => {
          if (key === attributeKey) {
            return true;
          }

          return attributes[key] === selectedValue;
        },
      );
    });

    if (!candidate) {
      return;
    }

    setSelectedVariantId(candidate.id);
    setQuantity(1);
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast.error('Sign in to add products to your cart.');
      return;
    }

    if (!selectedVariant || isOutOfStock) {
      return;
    }

    addItem.mutate(
      {
        productVariantId: selectedVariant.id,
        quantity,
      },
      {
        onSuccess: () => {
          toast.success('Added to cart.');
        },
        onError: () => {
          toast.error('Could not add product to cart.');
        },
      },
    );
  }

  if (!selectedVariant) {
    return null;
  }

  return (
    <div className="space-y-7">
      {/* PRICE */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold tracking-tight sm:text-4xl">
            {formatPrice(selectedVariant.price)}
          </span>

          {selectedVariant.compareAtPrice && (
            <span className="text-muted-foreground mb-1 text-base line-through">
              {formatPrice(selectedVariant.compareAtPrice)}
            </span>
          )}

          {discountPercentage !== null && (
            <span className="mb-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              -{discountPercentage}%
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          Price includes applicable taxes
        </p>
      </div>

      {/* VARIANTS */}
      {attributeGroups.length > 0 && (
        <div className="space-y-5">
          {attributeGroups.map(({ key, values }) => (
            <div key={key} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {normalizeAttributeName(key)}
                </span>

                <span className="text-muted-foreground text-xs">
                  {selectedAttributes[key] ?? 'Select'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isSelected =
                    selectedAttributes[key] === value;

                  const isAvailable = variants.some((variant) => {
                    const attributes =
                      variant.attributes as Record<
                        string,
                        string
                      >;

                    if (attributes[key] !== value) {
                      return false;
                    }

                    return Object.entries(selectedAttributes).every(
                      ([selectedKey, selectedValue]) => {
                        if (selectedKey === key) {
                          return true;
                        }

                        return (
                          attributes[selectedKey] ===
                          selectedValue
                        );
                      },
                    );
                  });

                  return (
                    <button
                      key={`${key}-${value}`}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() =>
                        selectAttribute(key, value)
                      }
                      className={cn(
                        'relative min-w-16 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                        'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none',
                        isSelected &&
                          'border-primary bg-primary/5 text-primary shadow-sm',
                        !isSelected &&
                          isAvailable &&
                          'border-border bg-background hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm',
                        !isAvailable &&
                          'cursor-not-allowed opacity-35 line-through',
                      )}
                    >
                      {value}

                      {isSelected && (
                        <span className="bg-primary absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full text-primary-foreground">
                          <Check className="size-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STOCK */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3',
          isOutOfStock
            ? 'border-destructive/20 bg-destructive/5'
            : isLowStock
              ? 'border-amber-500/20 bg-amber-500/5'
              : 'border-emerald-500/20 bg-emerald-500/5',
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full',
            isOutOfStock
              ? 'bg-destructive'
              : isLowStock
                ? 'bg-amber-500'
                : 'bg-emerald-500',
          )}
        />

        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              isOutOfStock
                ? 'text-destructive'
                : isLowStock
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400',
            )}
          >
            {isOutOfStock
              ? 'Out of stock'
              : isLowStock
                ? `Only ${availableQuantity} left`
                : 'In stock'}
          </p>

          {!isOutOfStock && (
            <p className="text-muted-foreground text-xs">
              {availableQuantity} available
            </p>
          )}
        </div>

        {!isOutOfStock && (
          <Truck className="text-muted-foreground size-4" />
        )}
      </div>

      {/* DESKTOP PURCHASE */}
      <div className="hidden space-y-3 sm:block">
        <div className="flex gap-3">
          {/* QUANTITY */}
          <div className="flex h-12 items-center rounded-xl border bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-l-xl rounded-r-none"
              disabled={
                isOutOfStock ||
                quantity <= 1 ||
                addItem.isPending
              }
              onClick={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1),
                )
              }
            >
              <Minus className="size-4" />
            </Button>

            <span className="w-10 text-center text-sm font-semibold">
              {quantity}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-l-none rounded-r-xl"
              disabled={
                isOutOfStock ||
                quantity >= availableQuantity ||
                addItem.isPending
              }
              onClick={() =>
                setQuantity((current) =>
                  Math.min(
                    availableQuantity,
                    current + 1,
                  ),
                )
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* ADD TO CART */}
          <Button
            type="button"
            size="lg"
            className="h-12 flex-1 rounded-xl text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            disabled={
              !isAuthenticated ||
              isOutOfStock ||
              addItem.isPending
            }
            onClick={handleAddToCart}
          >
            {addItem.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}

            {isOutOfStock
              ? 'Out of stock'
              : 'Add to cart'}
          </Button>
        </div>

        {!isAuthenticated && (
          <p className="text-muted-foreground text-center text-xs">
            Sign in to add items to your cart.
          </p>
        )}
      </div>

      {/* MOBILE STICKY PURCHASE */}
      <div className="h-16 sm:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-11 shrink-0 items-center rounded-xl border bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-l-xl rounded-r-none"
              disabled={
                isOutOfStock ||
                quantity <= 1 ||
                addItem.isPending
              }
              onClick={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1),
                )
              }
            >
              <Minus className="size-3.5" />
            </Button>

            <span className="w-7 text-center text-xs font-semibold">
              {quantity}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-l-none rounded-r-xl"
              disabled={
                isOutOfStock ||
                quantity >= availableQuantity ||
                addItem.isPending
              }
              onClick={() =>
                setQuantity((current) =>
                  Math.min(
                    availableQuantity,
                    current + 1,
                  ),
                )
              }
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            className="h-11 flex-1 rounded-xl font-semibold"
            disabled={
              !isAuthenticated ||
              isOutOfStock ||
              addItem.isPending
            }
            onClick={handleAddToCart}
          >
            {addItem.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShoppingCart className="size-4" />
            )}

            {isOutOfStock
              ? 'Out of stock'
              : 'Add to cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}