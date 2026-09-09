'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { orderListOptions } from '../api/queries';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';

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

export function OrderHistoryList() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [page] = useState(1);
  const { data, isLoading } = useQuery(orderListOptions(storeId, page));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-card bg-paper" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Your order history will show up here once you place your first order."
      />
    );
  }

  return (
    <ul className="divide-y divide-line rounded-card border border-line bg-surface">
      {data.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-paper"
          >
            <div>
              <p className="text-sm font-medium text-ink">Order #{order.id.slice(0, 8)}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge tone={STATUS_TONE[order.status] ?? 'neutral'}>{order.status}</StatusBadge>
              <span className="font-display text-sm italic text-ink">{order.total}</span>
              <ChevronRight size={16} className="text-ink-muted" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
