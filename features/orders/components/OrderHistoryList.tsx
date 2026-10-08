'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { orderListOptions } from '../api/queries';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
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

export function OrderHistoryList() {
  const locale = useLocale();
  const t = useTranslations('orders');
  const tStatus = useTranslations('notifications.status');
  const storeId = useAuthStore((s) => s.activeStoreId);
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = useQuery(orderListOptions(storeId, page));

  const statusLabel = (status: string) => tStatus(status as Parameters<typeof tStatus>[0]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState icon={Package} title={t('emptyTitle')} description={t('emptyDescription')} />
    );
  }

  return (
    <div className="max-w-7xl space-y-4">
      <ul className="divide-border border-border bg-card divide-y rounded-md border">
        {data.items.map((order) => (
          <li key={order.id}>
            <Link
              href={`/${locale}/account/orders/${order.id}`}
              className="hover:bg-background flex items-center justify-between gap-3 px-4 py-3.5 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {t('orderNumber', { id: order.id.slice(0, 8) })}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {new Date(order.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge tone={STATUS_TONE[order.status] ?? 'neutral'}>
                  {statusLabel(order.status)}
                </StatusBadge>
                <span className="text-foreground font-serif text-sm italic">{order.total}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
