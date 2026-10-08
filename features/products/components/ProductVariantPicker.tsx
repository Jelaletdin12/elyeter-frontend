'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Minus, Plus, ShoppingCart, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useCartItemQuantity } from '@/features/cart/hooks/useCartItemQuantity';
import { NotifyMeButton } from '@/features/notifications/components/NotifyMeButton';
import { toast } from '@/components/ui/sonner';
import { useVariantSelection } from './VariantSelectionProvider';

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

  return Number.isNaN(num) ? String(value) : currencyFormatter.format(num);
}

function normalizeAttributeName(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProductVariantPicker({ variants }: ProductVariantPickerProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tCommon = useTranslations('common');
  const tProducts = useTranslations('products');

  const { selectedVariant, selectVariant } = useVariantSelection();

  // Pasif varyantlar satılabilir değil — karttaki ProductCard ile aynı filtre.
  // (Backend `addItem` da isActive:true şartı koşuyor, seçilirse 404 verirdi.)
  const activeVariants = useMemo(() => variants.filter((variant) => variant.isActive), [variants]);

  const availableQuantity = selectedVariant?.inventory
    ? Math.max(0, selectedVariant.inventory.quantity - selectedVariant.inventory.reservedQuantity)
    : 0;

  const isOutOfStock = availableQuantity <= 0;

  const isLowStock =
    !isOutOfStock && availableQuantity <= (selectedVariant?.inventory?.lowStockThreshold ?? 0);

  const {
    quantity,
    increment,
    decrement,
    isPending: isCartMutating,
    canIncrement,
    canDecrement,
  } = useCartItemQuantity({
    variantId: selectedVariant?.id ?? '',
    availableQuantity,
    onAuthRequired: () => toast.error(tCommon('signInToCart')),
  });

  const attributeGroups = useMemo(() => {
    const groups = new Map<string, string[]>();

    activeVariants.forEach((variant) => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
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
  }, [activeVariants]);

  /**
   * Attribute'sız varyantlar (ör. ürün create'inde otomatik oluşan ilk varyant)
   * hiçbir attribute grubunda temsil edilemez — sadece değer butonlarıyla
   * onlara asla geri dönülemez. Bu durumda tüm varyantlar chip olarak
   * gösterilir ve attribute grupları gizlenir (chip zaten her şeyi kapsar).
   */
  const useVariantChips =
    activeVariants.length > 1 &&
    activeVariants.some((variant) => Object.keys(variant.attributes).length === 0);

  const selectedAttributes = useMemo(() => {
    return (selectedVariant?.attributes as Record<string, string>) ?? {};
  }, [selectedVariant]);

  const discountPercentage = useMemo(() => {
    if (!selectedVariant?.compareAtPrice) {
      return null;
    }

    const price = Number(selectedVariant.price);
    const compareAt = Number(selectedVariant.compareAtPrice);

    if (!Number.isFinite(price) || !Number.isFinite(compareAt) || compareAt <= price) {
      return null;
    }

    return Math.round(((compareAt - price) / compareAt) * 100);
  }, [selectedVariant]);

  /**
   * Bir attribute değerine tıklamak her zaman bir varyant seçmeli:
   * 1) Diğer seçili değerlerin hepsini koruyan (tam eşleşme) varyant varsa o.
   * 2) Tam eşleşme yoksa (çapraz kombinasyon, örn. Red+L yoksa) diğer seçili
   *    anahtarlardan vazgeçerek en çok eşleşen varyanta geçilir — buton asla
   *    "disabled" olmaz, varyantlar arası geçiş her zaman yapılabilir.
   */
  function selectAttribute(attributeKey: string, value: string) {
    const currentAttributes = selectedVariant?.attributes ?? {};

    const candidates = activeVariants.filter(
      (variant) => variant.attributes[attributeKey] === value,
    );
    if (candidates.length === 0) return;

    const otherKeys = Object.keys(currentAttributes).filter((key) => key !== attributeKey);
    const matchCount = (variant: ProductVariant) =>
      otherKeys.filter((key) => variant.attributes[key] === currentAttributes[key]).length;
    const matchesAllOthers = (variant: ProductVariant) =>
      otherKeys.every((key) => variant.attributes[key] === currentAttributes[key]);

    const exactMatch = candidates
      .filter(matchesAllOthers)
      .find((variant) => variant.id !== selectedVariant?.id);

    const relaxedMatch = [...candidates]
      .sort((a, b) => matchCount(b) - matchCount(a))
      .find((variant) => variant.id !== selectedVariant?.id);

    const next = exactMatch ?? relaxedMatch;
    if (next) selectVariant(next.id);
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

        <p className="text-muted-foreground text-xs">{tProducts('priceWithTaxes')}</p>
      </div>

      {/* VARIANTS — attribute'sız varyant varsa chip listesi, yoksa attribute grupları */}
      {useVariantChips && (
        <div className="space-y-2.5">
          <span className="text-sm font-semibold">{tProducts('variantLabel')}</span>

          <div className="flex flex-wrap gap-2">
            {activeVariants.map((variant) => {
              const entries = Object.entries(variant.attributes);
              const label =
                entries.length > 0
                  ? entries
                      .map(([key, val]) => `${normalizeAttributeName(key)}: ${val}`)
                      .join(' · ')
                  : variant.sku;
              const isSelected = variant.id === selectedVariant?.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  className={cn(
                    'relative min-w-16 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                    'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                    isSelected && 'border-primary bg-primary/5 text-primary shadow-sm',
                    !isSelected &&
                      'border-border bg-background hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-sm',
                  )}
                >
                  {label}

                  {isSelected && (
                    <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!useVariantChips && attributeGroups.length > 0 && (
        <div className="space-y-5">
          {attributeGroups.map(({ key, values }) => (
            <div key={key} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{normalizeAttributeName(key)}</span>

                <span className="text-muted-foreground text-xs">
                  {selectedAttributes[key] ?? tProducts('selectAttribute')}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const isSelected = selectedAttributes[key] === value;

                  return (
                    <button
                      key={`${key}-${value}`}
                      type="button"
                      onClick={() => selectAttribute(key, value)}
                      className={cn(
                        'relative min-w-16 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                        'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                        isSelected && 'border-primary bg-primary/5 text-primary shadow-sm',
                        !isSelected &&
                          'border-border bg-background hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-sm',
                      )}
                    >
                      {value}

                      {isSelected && (
                        <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full">
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
            isOutOfStock ? 'bg-destructive' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500',
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
            <p className="text-muted-foreground text-xs">{availableQuantity} available</p>
          )}
        </div>

        {!isOutOfStock && <Truck className="text-muted-foreground size-4" />}
      </div>

      {/* BACK IN STOCK — seçili varyant stokta yoksa abonelik butonu */}
      {isOutOfStock && <NotifyMeButton productVariantId={selectedVariant.id} />}

      {/* DESKTOP — quantity 0 ise "Add to cart", sepette varsa +/- stepper */}
      <div className="hidden sm:block">
        {isOutOfStock ? (
          <Button
            type="button"
            size="lg"
            disabled
            className="h-12 w-full rounded-xl text-sm font-semibold"
          >
            {tCommon('outOfStock')}
          </Button>
        ) : quantity === 0 ? (
          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={increment}
            disabled={isCartMutating}
          >
            {isCartMutating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="size-4" />
                {tCommon('addToCart')}
              </>
            )}
          </Button>
        ) : (
          <div className="border-border/80 bg-muted/30 hover:border-border flex h-12 w-full items-center justify-between rounded-xl border p-1.5 transition-colors">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 rounded-lg transition-all',
                !canDecrement
                  ? 'cursor-not-allowed opacity-30'
                  : 'text-foreground hover:bg-background hover:shadow-xs active:scale-95',
              )}
              onClick={decrement}
              disabled={!canDecrement || isCartMutating}
              aria-label={tCommon('decreaseQuantity')}
            >
              <Minus className="size-4" />
            </Button>

            <div className="flex items-center gap-2 px-2">
              <span className="text-foreground min-w-[2ch] text-center text-base font-semibold tabular-nums">
                {quantity}
              </span>
              {isCartMutating && (
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 rounded-lg transition-all',
                !canIncrement
                  ? 'cursor-not-allowed opacity-30'
                  : 'text-foreground hover:bg-background hover:shadow-xs active:scale-95',
              )}
              onClick={increment}
              disabled={!canIncrement}
              aria-label={tCommon('increaseQuantity')}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        {!isAuthenticated && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {tCommon('signInToCart')}
          </p>
        )}
      </div>

      {/* MOBILE STICKY — aynı mantık */}
      <div className="h-16 sm:hidden" />

      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:hidden">
        {isOutOfStock ? (
          <Button type="button" disabled className="h-11 w-full rounded-xl font-semibold">
            {tCommon('outOfStock')}
          </Button>
        ) : quantity === 0 ? (
          <Button
            type="button"
            className="h-11 w-full rounded-xl font-semibold"
            onClick={increment}
            disabled={isCartMutating}
          >
            {isCartMutating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="size-4" />
                {tCommon('addToCart')}
              </>
            )}
          </Button>
        ) : (
          <div className="border-border/80 bg-muted/30 flex h-11 w-full items-center justify-between rounded-xl border p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 rounded-lg transition-all',
                !canDecrement ? 'cursor-not-allowed opacity-30' : 'active:scale-95',
              )}
              onClick={decrement}
              disabled={!canDecrement || isCartMutating}
              aria-label={tCommon('decreaseQuantity')}
            >
              <Minus className="size-3.5" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              {isCartMutating && (
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'size-9 rounded-lg transition-all',
                !canIncrement ? 'cursor-not-allowed opacity-30' : 'active:scale-95',
              )}
              onClick={increment}
              disabled={!canIncrement}
              aria-label={tCommon('increaseQuantity')}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
