'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { orderDetailOptions } from '@/features/orders/api/queries';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'destructive' | 'neutral'> = {
  DELIVERED: 'success',
  SHIPPED: 'neutral',
  PROCESSING: 'neutral',
  CONFIRMED: 'neutral',
  PENDING: 'warning',
  CANCELLED: 'destructive',
  RETURN_REQUESTED: 'warning',
  RETURNED: 'neutral',
};

/**
 * STANDARDS.md #4: private sayfa, CSR. Client Component olarak yazıldı
 * (Next.js 15'te dynamic segment param'ına Server Component'te de erişilebilir,
 * ama bu sayfa TanStack Query cache'ini paylaşmak / status history'i canlı
 * göstermek için CSR tercih edildi).
 */
export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data: order, isLoading } = useQuery(orderDetailOptions(storeId, params.orderId));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground text-sm">Sipariş bulunamadı.</p>
      </div>
    );
  }

  const discount = order.discountAmount ? Number(order.discountAmount) : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={14} /> Siparişlere dön
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">Sipariş #{order.id.slice(0, 8)}</h1>
        <StatusBadge tone={STATUS_TONE[order.status] ?? 'neutral'}>{order.status}</StatusBadge>
      </div>

      <div className="border-border bg-card mt-6 rounded-md border">
        <ul className="divide-border divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3.5 text-sm">
              <span className="text-foreground">
                {item.productVariant.product.translations[0]?.name ?? item.productVariant.sku}
                <span className="text-muted-foreground"> × {item.quantity}</span>
              </span>
              <span className="text-foreground">{item.price}</span>
            </li>
          ))}
        </ul>

        <Separator />

        <div className="space-y-1.5 px-4 py-3.5">
          {order.coupon && (
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>Kupon {order.coupon.code}</span>
              <span className="text-sidebar-primary">−{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium">
            <span className="text-foreground">Toplam</span>
            <span className="text-foreground font-serif italic">{order.total}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-foreground text-sm font-semibold">Sipariş geçmişi</h2>
        <ol className="mt-4 space-y-0">
          {order.statusHistory.map((h, i) => {
            return (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="bg-sidebar-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white">
                    <Check size={11} />
                  </span>
                </div>
                <div className="pb-4 text-sm">
                  <p className="text-foreground">
                    {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
