'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cartOptions } from '../api/queries';
import { useUpdateCartItemMutation, useRemoveCartItemMutation } from '../api/mutations';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * `priceSnapshot` !== `currentPrice` olan satırlarda "fiyat değişti" uyarısı
 * gösterilir (schema.prisma CartItem yorumu: snapshot sadece bilgilendirme,
 * sipariş her zaman güncel fiyattan oluşur). `availableQuantity <= 0`
 * satırları checkout'a geçişi engellemez ama uyarır — asıl engelleme
 * backend'de checkout sırasında yapılır.
 */
export function CartView() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data: cart, isLoading } = useQuery(cartOptions(storeId));

  const updateItem = useUpdateCartItemMutation(storeId);
  const removeItem = useRemoveCartItemMutation(storeId);

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
        title="Sepetiniz boş"
        action={
          <Button asChild variant="outline">
            <Link href="/">Alışverişe devam et</Link>
          </Button>
        }
      />
    );
  }

  const hasBlockingIssue = cart.items.some((item) => item.availableQuantity <= 0);
  const discount = 0; // kupon sepette henüz uygulanmıyor; checkout'ta uygulanıyor

  function changeQty(itemId: string, next: number, max: number) {
    const clamped = Math.max(1, Math.min(next, max));
    updateItem.mutate({ cartItemId: itemId, quantity: clamped });
  }

  return (
    <div className="flex max-w-6xl px-4 mx-auto justify-between gap-4">
      <div className="w-2/3">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Sepetiniz</h1>
          <Badge variant="secondary">{cart.items.length} ürün</Badge>
        </div>

        <div className="rounded-lg border border-border bg-card">
          {cart.items.map((item, i) => {
            const priceChanged = item.priceSnapshot !== item.currentPrice;
            const isOutOfStock = item.availableQuantity <= 0;
            const variant = item.productVariant;
            const name = variant.product.translations[0]?.name ?? variant.sku;
            const attributes = Object.entries(variant.attributes ?? {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ');

            return (
              <div key={item.id}>
                {i > 0 && <Separator />}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {name}
                      {attributes && (
                        <span className="text-muted-foreground"> · {attributes}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{variant.sku}</p>

                    {priceChanged && (
                      <Badge variant="destructive" className="mt-2">
                        Fiyat değişti: {item.priceSnapshot} → {item.currentPrice}
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="destructive" className="mt-2">
                        Stokta yok
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                    >
                      <Trash2 size={12} /> Kaldır
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center rounded-md border border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-r-none"
                        disabled={item.quantity <= 1 || isOutOfStock}
                        onClick={() => changeQty(item.id, item.quantity - 1, item.availableQuantity)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-l-none"
                        disabled={isOutOfStock || item.quantity >= item.availableQuantity}
                        onClick={() => changeQty(item.id, item.quantity + 1, item.availableQuantity)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <span className="w-16 text-right text-sm font-medium text-foreground">
                      {(Number(item.currentPrice) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-1/3">
        <div className="sticky top-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Sipariş özeti</h2>
          <Separator className="my-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Ara toplam</span>
            <span className="text-foreground">{cart.subtotal}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between">
            <span className="text-sm font-medium text-foreground">Toplam</span>
            <span className="font-serif italic text-foreground">
              {(Number(cart.subtotal) - discount).toFixed(2)}
            </span>
          </div>

          {hasBlockingIssue && (
            <p className="mt-3 text-xs text-destructive">
              Sepetinizde stokta olmayan ürün var, ödemeye geçmeden önce kontrol edin.
            </p>
          )}

          <Button asChild className="mt-4 w-full">
            <Link href="/checkout">Ödemeye geç</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}