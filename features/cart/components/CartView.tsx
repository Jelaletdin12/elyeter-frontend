'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import type { CartItemDto } from '../api/queries';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';

interface CartItemRowProps {
  item: CartItemDto;
  isFirst: boolean;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  isRemoving: boolean;
}

function CartItemRow({ item, isFirst, onRemove, onUpdateQuantity, isRemoving }: CartItemRowProps) {
  const locale = useLocale();
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemovingLocally, setIsRemovingLocally] = useState(false);

  const serverQuantityRef = useRef(item.quantity);
  useEffect(() => {
    serverQuantityRef.current = item.quantity;
  }, [item.quantity]);

  const targetQuantityRef = useRef(item.quantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current === null && !isUpdating) {
      setQuantity(item.quantity);
      targetQuantityRef.current = item.quantity;
    }
  }, [item.quantity, isUpdating]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const targetQty = targetQuantityRef.current;
    if (targetQty === serverQuantityRef.current) {
      return;
    }

    setIsUpdating(true);
    try {
      if (targetQty <= 0) {
        onRemove(item.id);
        return;
      }
      await onUpdateQuantity(item.id, targetQty);
    } catch {
      toast.error(t('quantityUpdateFailed'));
      setQuantity(serverQuantityRef.current);
      targetQuantityRef.current = serverQuantityRef.current;
      setIsRemovingLocally(false);
    } finally {
      setIsUpdating(false);
    }
  }, [item.id, onRemove, onUpdateQuantity]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const targetQty = targetQuantityRef.current;
        if (targetQty !== serverQuantityRef.current) {
          if (targetQty <= 0) {
            onRemove(item.id);
          } else {
            onUpdateQuantity(item.id, targetQty).catch(() => {});
          }
        }
      }
    };
  }, [item.id, onRemove, onUpdateQuantity]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flush();
    }, 450);
  }, [flush]);

  const handleIncrement = () => {
    if (quantity >= item.availableQuantity) return;
    const next = quantity + 1;
    targetQuantityRef.current = next;
    setQuantity(next);
    scheduleFlush();
  };

  const handleDecrement = () => {
    const next = quantity - 1;

    if (next <= 0) {
      setIsRemovingLocally(true);
      targetQuantityRef.current = 0;
      scheduleFlush();
      return;
    }

    targetQuantityRef.current = next;
    setQuantity(next);
    scheduleFlush();
  };

  const priceChanged = item.priceSnapshot !== item.currentPrice;
  const isOutOfStock = item.availableQuantity <= 0;
  const variant = item.productVariant;
  const product = variant.product;
  const name =
    product.translations.find((t) => t.locale === locale)?.name ??
    product.translations[0]?.name ??
    variant.sku;
  const attributes = Object.entries(variant.attributes ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');

  const brandName =
    product.brand?.translations.find((t) => t.locale === locale)?.name ??
    product.brand?.translations[0]?.name;
  const categoryName =
    product.category?.translations.find((t) => t.locale === locale)?.name ??
    product.category?.translations[0]?.name;
  const thumbnail = product.images[0];

  return (
    <div
      className={
        isRemovingLocally || isRemoving ? 'pointer-events-none opacity-40 transition-opacity' : ''
      }
    >
      {!isFirst && <Separator />}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            {thumbnail ? (
              <Image
                src={thumbnail.cardUrl}
                alt={name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package size={22} className="text-muted-foreground/50" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">
              {name}
              {attributes && <span className="text-muted-foreground"> · {attributes}</span>}
            </p>

            {(brandName || categoryName) && (
              <p className="text-muted-foreground mt-0.5 text-xs">
                {[brandName, categoryName].filter(Boolean).join(' · ')}
              </p>
            )}

            <p className="text-muted-foreground mt-0.5 text-xs">{variant.sku}</p>

            {priceChanged && (
              <Badge variant="destructive" className="mt-2">
                {t('priceChangedBadge', {
                  from: item.priceSnapshot,
                  to: item.currentPrice,
                })}
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="mt-2">
                {tCommon('outOfStock')}
              </Badge>
            )}

            <button
              type="button"
              onClick={() => {
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = null;
                }
                onRemove(item.id);
              }}
              disabled={isRemoving}
              className="text-muted-foreground hover:text-destructive mt-2 flex items-center gap-1 text-xs underline-offset-2 hover:underline disabled:opacity-50"
            >
              <Trash2 size={12} /> {t('remove')}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="border-border flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              disabled={isOutOfStock || isRemovingLocally}
              onClick={handleDecrement}
              aria-label={quantity <= 1 ? t('removeFromCart') : t('decrease')}
            >
              {quantity <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
            </Button>
            <div className="flex w-8 items-center justify-center">
              <span className="text-center text-sm tabular-nums">{quantity}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              disabled={isOutOfStock || quantity >= item.availableQuantity || isRemovingLocally}
              onClick={handleIncrement}
              aria-label={t('increase')}
            >
              <Plus size={14} />
            </Button>
          </div>
          <span className="text-foreground w-16 text-right text-sm font-medium">
            {(Number(item.currentPrice) * quantity).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  const t = useTranslations('cart');
  const { cart, isLoading, updateMutation, removeMutation } = useCart();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t('empty')}
        action={
          <Button asChild variant="outline">
            <Link href="/">{t('continueShopping')}</Link>
          </Button>
        }
      />
    );
  }

  const hasBlockingIssue = cart.items.some((item) => item.availableQuantity <= 0);
  const discount = 0;

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    await updateMutation.mutateAsync({ cartItemId, quantity });
  };

  const handleRemove = (cartItemId: string) => {
    removeMutation.mutate(cartItemId);
  };

  return (
    <div className="mx-auto flex max-w-7xl justify-between gap-4 px-4">
      <div className="w-2/3">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-foreground text-xl font-semibold">{t('title')}</h1>
          <Badge variant="secondary">{t('itemCount', { count: cart.items.length })}</Badge>
        </div>

        <div className="border-border bg-card rounded-lg border">
          {cart.items.map((item, i) => (
            <CartItemRow
              key={item.id}
              item={item}
              isFirst={i === 0}
              onRemove={handleRemove}
              onUpdateQuantity={handleUpdateQuantity}
              isRemoving={removeMutation.isPending}
            />
          ))}
        </div>
      </div>

      <div className="w-1/3">
        <div className="border-border bg-card sticky top-4 rounded-lg border p-4">
          <h2 className="text-foreground text-sm font-medium">{t('summaryTitle')}</h2>
          <Separator className="my-3" />
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{t('subtotal')}</span>
            <span className="text-foreground">{cart.subtotal}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between">
            <span className="text-foreground text-sm font-medium">{t('total')}</span>
            <span className="text-foreground font-serif italic">
              {(Number(cart.subtotal) - discount).toFixed(2)}
            </span>
          </div>

          {hasBlockingIssue && (
            <p className="text-destructive mt-3 text-xs">{t('outOfStockWarning')}</p>
          )}

          <Button asChild className="mt-4 w-full">
            <Link href="/checkout">{t('proceedToCheckout')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
