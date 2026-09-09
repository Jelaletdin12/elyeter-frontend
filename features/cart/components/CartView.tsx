'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { cartOptions } from '../api/queries';
import { useUpdateCartItemMutation, useRemoveCartItemMutation } from '../api/mutations';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

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
      <div className="animate-pulse space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-card bg-paper" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        action={
          <Link href="/" className="text-sm underline">
            Continue shopping
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Your cart</h1>

      <ul className="mt-6 divide-y divide-border">
        {cart.items.map((item) => {
          const priceChanged = item.priceSnapshot !== item.currentPrice;
          const isOutOfStock = item.availableQuantity <= 0;

          return (
            <li key={item.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Variant {item.productVariantId}</p>
                {priceChanged && (
                  <p className="text-xs text-destructive">
                    Price changed: {item.priceSnapshot} → {item.currentPrice}
                  </p>
                )}
                {isOutOfStock && <p className="text-xs text-destructive">Out of stock</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={item.availableQuantity}
                  defaultValue={item.quantity}
                  className="w-16 rounded-md border border-line px-2 py-1 text-sm"
                  onBlur={(e) =>
                    updateItem.mutate({ cartItemId: item.id, quantity: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeItem.mutate(item.id)}
                  className="text-xs text-ink-muted underline"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-end">
        <Link
          href="/checkout"
          className="rounded-md bg-ink px-4 py-2 text-sm text-white"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
