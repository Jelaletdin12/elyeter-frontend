'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { orderDetailOptions } from '@/features/orders/api/queries';

/**
 * STANDARDS.md #4: private sayfa, CSR. Client Component olarak yazıldı
 * (Next.js 15'te dynamic segment param'ına Server Component'te de erişilebilir,
 * ama bu sayfa TanStack Query cache'ini paylaşmak / status history'i canlı
 * göstermek için CSR tercih edildi).
 */
export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const storeId = useAuthStore((s) => s.activeStoreId);
  const { data: order, isLoading } = useQuery(orderDetailOptions(storeId, params.orderId));

  if (isLoading) return <p className="text-sm text-ink-muted">...</p>;
  if (!order) return <p className="text-sm text-ink-muted">Order not found.</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
      <p className="mt-1 text-sm text-ink-muted">Status: {order.status}</p>

      <ul className="mt-6 divide-y divide-border">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between py-3 text-sm">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{item.price}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Status history</h2>
        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              {h.fromStatus ?? '—'} → {h.toStatus} ({new Date(h.createdAt).toLocaleString()})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
